/**
 * HLS Offline Download Service
 *
 * Fetches and caches HLS streams (m3u8 + .ts segments) + subtitle VTT files
 * so they can be played back entirely offline via the Service Worker interceptor.
 */

export const HLS_CACHE_NAME = 'hls-offline-v1';

export interface SubtitleTrack {
  label: string;
  srclang: string;
  url: string;
}

export interface DownloadProgress {
  movieId: string;
  total: number;
  downloaded: number;
  status: 'idle' | 'downloading' | 'done' | 'error';
  error?: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

// ─── Manifest Parsing ────────────────────────────────────────────────────────

/**
 * Resolves a relative URL against a base URL (the manifest location).
 */
function resolveUrl(base: string, relative: string): string {
  if (/^https?:\/\//i.test(relative)) return relative;
  const dir = base.substring(0, base.lastIndexOf('/') + 1);
  return new URL(relative, dir).href;
}

/**
 * Parses an HLS master manifest and returns the first (best) variant playlist URL.
 * If it's already a media playlist (contains #EXTINF), returns the URL as-is.
 */
async function resolveMediaPlaylist(masterUrl: string): Promise<string> {
  const res = await fetch(masterUrl);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${masterUrl}`);
  const text = await res.text();

  if (text.includes('#EXTINF')) return masterUrl;

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      return resolveUrl(masterUrl, trimmed);
    }
  }
  throw new Error('No variant stream found in master playlist');
}

/**
 * Parses a media playlist and returns all .ts segment URLs in order.
 */
async function parseSegments(playlistUrl: string): Promise<{ playlistUrl: string; segmentUrls: string[] }> {
  const res = await fetch(playlistUrl);
  if (!res.ok) throw new Error(`Failed to fetch media playlist: ${playlistUrl}`);
  const text = await res.text();

  const segmentUrls: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      segmentUrls.push(resolveUrl(playlistUrl, trimmed));
    }
  }
  return { playlistUrl, segmentUrls };
}

// ─── Download Logic ───────────────────────────────────────────────────────────

const activeAbortControllers = new Map<string, AbortController>();

/**
 * Downloads all HLS segments + subtitle VTT files for a movie and stores
 * them in the Cache API. Emits progress via the callback.
 *
 * @param subtitleTracks  Optional subtitle tracks to cache alongside the video.
 */
export async function downloadHlsStream(
  movieId: string,
  m3u8Url: string,
  onProgress?: ProgressCallback,
  subtitleTracks?: SubtitleTrack[]
): Promise<void> {
  cancelDownload(movieId);

  const controller = new AbortController();
  activeAbortControllers.set(movieId, controller);

  const report = (update: Partial<DownloadProgress>) => {
    if (onProgress) {
      onProgress({
        movieId,
        total: 0,
        downloaded: 0,
        status: 'downloading',
        ...update,
      } as DownloadProgress);
    }
  };

  report({ status: 'downloading', total: 0, downloaded: 0 });

  try {
    const cache = await caches.open(HLS_CACHE_NAME);

    // Step 1: Resolve media playlist from master
    const mediaPlaylistUrl = await resolveMediaPlaylist(m3u8Url);

    // Step 2: Parse all segment URLs
    const { segmentUrls } = await parseSegments(mediaPlaylistUrl);

    // Collect subtitle URLs to cache
    const subtitleUrls = (subtitleTracks ?? []).map((t) => t.url).filter(Boolean);

    // Total = master manifest + media playlist + segments + subtitle files
    const total = segmentUrls.length + 2 + subtitleUrls.length;
    report({ total, downloaded: 0 });

    // Step 3: Cache the master manifest
    await cacheWithKey(cache, m3u8Url, m3u8Url, controller.signal);
    let downloaded = 1;
    report({ total, downloaded });

    // Step 4: Cache the media playlist
    if (mediaPlaylistUrl !== m3u8Url) {
      await cacheWithKey(cache, mediaPlaylistUrl, mediaPlaylistUrl, controller.signal);
      downloaded++;
      report({ total, downloaded });
    }

    // Step 5: Download video segments in parallel batches
    const BATCH_SIZE = 4;
    for (let i = 0; i < segmentUrls.length; i += BATCH_SIZE) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const batch = segmentUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (url) => {
          await cacheWithKey(cache, url, url, controller.signal);
          downloaded++;
          report({ total, downloaded });
        })
      );
    }

    // Step 6: Download subtitle VTT files (non-fatal if one fails)
    for (const url of subtitleUrls) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        await cacheWithKey(cache, url, url, controller.signal);
      } catch (e) {
        console.warn('[HLS Download] Subtitle cache failed:', url, e);
      }
      downloaded++;
      report({ total, downloaded });
    }

    // Step 7: Store metadata for offline management
    const meta: OfflineMovieMeta = {
      movieId,
      m3u8Url,
      mediaPlaylistUrl,
      segmentCount: segmentUrls.length,
      subtitleUrls,
      downloadedAt: Date.now(),
    };
    saveOfflineMeta(meta);

    report({ status: 'done', total, downloaded: total });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      report({ status: 'idle', total: 0, downloaded: 0 });
    } else {
      report({ status: 'error', error: err?.message ?? 'Unknown error' });
      throw err;
    }
  } finally {
    activeAbortControllers.delete(movieId);
  }
}

/**
 * Fetches a URL and stores it in the cache under the given key.
 * Skips if already cached.
 *
 * WHY we buffer into ArrayBuffer before cache.put():
 * ─────────────────────────────────────────────────
 * cache.put(key, liveResponse) pipes a *live network stream* directly into
 * the Cache API.  If the CDN redirects mid-flight, the connection drops, or
 * the CORS stream is tainted, Chrome throws:
 *   "Failed to execute 'put' on 'Cache': Cache.put() encountered a network error"
 *
 * By reading the entire body into memory first (arrayBuffer()), we hand the
 * Cache API a *finished*, in-memory Response — nothing can fail mid-stream.
 */
async function cacheWithKey(
  cache: Cache,
  key: string,
  url: string,
  signal: AbortSignal
): Promise<void> {
  const existing = await cache.match(key);
  if (existing) return;

  // Follow redirects explicitly so the final resolved URL is what we cache
  const res = await fetch(url, { signal, redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);

  // Buffer the entire body into memory — eliminates "Cache.put() network error"
  // that occurs when the live stream is interrupted during cache.put().
  const buffer = await res.arrayBuffer();
  const buffered = new Response(buffer, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
  await cache.put(key, buffered);
}

/**
 * Cancels an in-progress download for a movie.
 */
export function cancelDownload(movieId: string): void {
  const ctrl = activeAbortControllers.get(movieId);
  if (ctrl) {
    ctrl.abort();
    activeAbortControllers.delete(movieId);
  }
}

// ─── Offline Metadata ─────────────────────────────────────────────────────────

export interface OfflineMovieMeta {
  movieId: string;
  m3u8Url: string;
  mediaPlaylistUrl: string;
  segmentCount: number;
  /** Cached subtitle VTT URLs */
  subtitleUrls: string[];
  downloadedAt: number;
}

const META_KEY = 'lsfplus_offline_movies';

export function getOfflineMovies(): OfflineMovieMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isMovieOffline(movieId: string): boolean {
  return getOfflineMovies().some((m) => m.movieId === movieId);
}

export function getOfflineMeta(movieId: string): OfflineMovieMeta | null {
  return getOfflineMovies().find((m) => m.movieId === movieId) ?? null;
}

function saveOfflineMeta(meta: OfflineMovieMeta): void {
  const existing = getOfflineMovies().filter((m) => m.movieId !== meta.movieId);
  localStorage.setItem(META_KEY, JSON.stringify([...existing, meta]));
}

/**
 * Deletes all cached segments, manifests and subtitle files for a movie,
 * then removes its metadata entry.
 */
export async function deleteOfflineMovie(movieId: string): Promise<void> {
  const meta = getOfflineMeta(movieId);
  if (!meta) return;

  const cache = await caches.open(HLS_CACHE_NAME);

  // Delete master manifest
  await cache.delete(meta.m3u8Url);

  // Delete media playlist
  if (meta.mediaPlaylistUrl !== meta.m3u8Url) {
    await cache.delete(meta.mediaPlaylistUrl);
  }

  // Delete all .ts segments by re-parsing the cached playlist
  try {
    const res = await cache.match(meta.mediaPlaylistUrl);
    if (res) {
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const segUrl = resolveUrl(meta.mediaPlaylistUrl, trimmed);
          await cache.delete(segUrl);
        }
      }
    }
  } catch { /* ignore */ }

  // Delete cached subtitle VTT files
  for (const url of meta.subtitleUrls ?? []) {
    await cache.delete(url);
  }

  // Remove metadata entry
  const updated = getOfflineMovies().filter((m) => m.movieId !== movieId);
  localStorage.setItem(META_KEY, JSON.stringify(updated));
}

/**
 * Returns the cached m3u8 URL for offline playback (same URL, served from cache).
 * Returns null if not available offline.
 */
export function getOfflinePlaybackUrl(movieId: string): string | null {
  const meta = getOfflineMeta(movieId);
  return meta ? meta.m3u8Url : null;
}
