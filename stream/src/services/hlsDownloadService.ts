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
 * Parses an HLS master manifest and returns ALL variant playlist URLs (Video + Audio).
 */
async function resolveAllMediaPlaylists(masterUrl: string): Promise<string[]> {
  const res = await fetch(masterUrl);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${masterUrl}`);
  const text = await res.text();

  // If it's already a media playlist (contains #EXTINF), return it as the only item
  if (text.includes('#EXTINF')) return [masterUrl];

  const subPlaylists = new Set<string>();
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 1. Find separate Audio Tracks (e.g., stream_Stereo.m3u8)
    if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const uriMatch = line.match(/URI="([^"]+)"/);
      if (uriMatch) {
        subPlaylists.add(resolveUrl(masterUrl, uriMatch[1]));
      }
    } 
    // 2. Find Video Tracks (the line following #EXT-X-STREAM-INF)
    else if (line && !line.startsWith('#')) {
      subPlaylists.add(resolveUrl(masterUrl, line));
    }
  }

  if (subPlaylists.size === 0) {
    throw new Error('No variant stream found in master playlist');
  }
  
  return Array.from(subPlaylists);
}

/**
 * Parses a media playlist and returns all .ts/media segment URLs.
 */
async function parseSegments(playlistUrl: string): Promise<string[]> {
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
  return segmentUrls;
}

// ─── Download Logic ───────────────────────────────────────────────────────────

const activeAbortControllers = new Map<string, AbortController>();

/**
 * Downloads all HLS segments (Video + Audio) + subtitle VTT files for a movie and 
 * stores them in the Cache API. Emits progress via the callback.
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

    // Step 1: Find all sub-playlists (Video variants + Audio tracks)
    const mediaPlaylistUrls = await resolveAllMediaPlaylists(m3u8Url);
    
    // Step 2: Extract ALL unique media segment URLs from ALL playlists
    const allSegments = new Set<string>();
    for (const url of mediaPlaylistUrls) {
      // Cache the sub-playlist itself first
      await cacheWithKey(cache, url, url, controller.signal);
      const segments = await parseSegments(url);
      segments.forEach(seg => allSegments.add(seg));
    }

    const segmentArray = Array.from(allSegments);
    const subtitleUrls = (subtitleTracks ?? []).map((t) => t.url).filter(Boolean);

    // Total = master manifest + segments + subtitle files
    // (Note: playlists are already cached in step 2)
    const total = segmentArray.length + 1 + subtitleUrls.length;
    report({ total, downloaded: 0 });

    // Step 3: Cache the master manifest
    await cacheWithKey(cache, m3u8Url, m3u8Url, controller.signal);
    let downloaded = 1;
    report({ total, downloaded });

    // Step 4: Download all unique segments in batches (Prevents crashes/timeouts)
    const BATCH_SIZE = 5;
    for (let i = 0; i < segmentArray.length; i += BATCH_SIZE) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const batch = segmentArray.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (url) => {
          await cacheWithKey(cache, url, url, controller.signal);
          downloaded++;
          report({ total, downloaded });
        })
      );
    }

    // Step 5: Download subtitle VTT files
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

    // Step 6: Store metadata for offline management
    const meta: OfflineMovieMeta = {
      movieId,
      m3u8Url,
      mediaPlaylistUrls, // Updated to store all playlists
      segmentCount: segmentArray.length,
      subtitleUrls,
      downloadedAt: Date.now(),
    };
    saveOfflineMeta(meta);

    report({ status: 'done', total, downloaded: total });
    alert('✅ Download Complete!');
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      report({ status: 'idle', total: 0, downloaded: 0 });
    } else {
      console.error('❌ Fatal error during download:', err);
      report({ status: 'error', error: err?.message ?? 'Unknown error' });
      alert('❌ Failed to download video. Check console for details.');
      throw err;
    }
  } finally {
    activeAbortControllers.delete(movieId);
  }
}

/**
 * Fetches a URL and stores it in the cache under the given key.
 * Skips if already cached.
 */
async function cacheWithKey(
  cache: Cache,
  key: string,
  url: string,
  signal: AbortSignal
): Promise<void> {
  const existing = await cache.match(key);
  if (existing) return;

  const res = await fetch(url, { signal, redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);

  // Buffer the entire body into memory to prevent mid-stream network errors
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
  mediaPlaylistUrls: string[];
  segmentCount: number;
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
 * Deletes all cached segments, manifests and subtitle files for a movie.
 */
export async function deleteOfflineMovie(movieId: string): Promise<void> {
  const meta = getOfflineMeta(movieId);
  if (!meta) return;

  const cache = await caches.open(HLS_CACHE_NAME);

  // Delete master manifest
  await cache.delete(meta.m3u8Url);

  // Delete all media playlists and their segments
  for (const playlistUrl of meta.mediaPlaylistUrls) {
    try {
      const res = await cache.match(playlistUrl);
      if (res) {
        const text = await res.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const segUrl = resolveUrl(playlistUrl, trimmed);
            await cache.delete(segUrl);
          }
        }
      }
      await cache.delete(playlistUrl);
    } catch { /* ignore */ }
  }

  // Delete cached subtitle VTT files
  for (const url of meta.subtitleUrls ?? []) {
    await cache.delete(url);
  }

  // Remove metadata entry
  const updated = getOfflineMovies().filter((m) => m.movieId !== movieId);
  localStorage.setItem(META_KEY, JSON.stringify(updated));
}

export function getOfflinePlaybackUrl(movieId: string): string | null {
  const meta = getOfflineMeta(movieId);
  return meta ? meta.m3u8Url : null;
}
