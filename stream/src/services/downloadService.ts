/**
 * DOWNLOAD SERVICE
 * Handles the storage and retrieval of movie blobs using IndexedDB
 * for offline viewing functionality.
 */

const DB_NAME = 'lsfplus-downloads';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

export interface DownloadedMovie {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  timestamp: number;
  duration: string;
  blob?: Blob; // Added for robust binary storage
}

const HLS_CACHE_NAME = 'offline-hls-cache';

class DownloadService {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => resolve(this.db = (event.target as IDBOpenDBRequest).result);
      request.onerror = () => reject('Error opening IndexedDB');
    });
  }

  async downloadAndStore(
    id: string, 
    url: string, 
    metadata: { title: string, thumbnail: string, duration: string },
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const db = await this.initDB();
    const cache = await caches.open(HLS_CACHE_NAME);

    // Initial metadata for IndexedDB
    const movieData: DownloadedMovie = {
      id,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      url,
      timestamp: Date.now(),
    };

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error('Failed to fetch video target');

      if (url.includes('.m3u8')) {
        // --- HLS SEGMENT DOWNLOADER ---
        const text = await response.text();
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        
        const lines = text.split('\n');
        const segmentUrls: string[] = [];
        const playlists: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          if (trimmed.endsWith('.m3u8')) {
             playlists.push(trimmed.startsWith('http') ? trimmed : baseUrl + trimmed);
          } else {
             segmentUrls.push(trimmed.startsWith('http') ? trimmed : baseUrl + trimmed);
          }
        }

        let segmentsToDownload: string[] = [];
        const manifestsToCache: {url: string, text: string}[] = [{url, text}];
        
        if (playlists.length > 0) {
          // Fetch highest/first quality manifest
          const streamUrl = playlists[0];
          const streamResp = await fetch(streamUrl, { signal });
          const streamText = await streamResp.text();
          manifestsToCache.push({url: streamUrl, text: streamText});
          
          const streamBaseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
          for (const line of streamText.split('\n')) {
             const trimmed = line.trim();
             if (!trimmed || trimmed.startsWith('#')) continue;
             segmentsToDownload.push(trimmed.startsWith('http') ? trimmed : streamBaseUrl + trimmed);
          }
        } else {
          segmentsToDownload = segmentUrls;
        }

        // Cache the manifests
        for (const m of manifestsToCache) {
          await cache.put(m.url, new Response(m.text, {
            headers: { 'Content-Type': 'application/x-mpegURL' }
          }));
        }

        // Concurrent chunk downloading
        let loaded = 0;
        const total = segmentsToDownload.length;
        const CONCURRENCY = 5;

        for (let i = 0; i < total; i += CONCURRENCY) {
          if (signal?.aborted) throw new Error('AbortError');
          
          const batch = segmentsToDownload.slice(i, i + CONCURRENCY);
          await Promise.all(batch.map(async (segUrl) => {
            try {
              const segResp = await fetch(segUrl, { signal });
              if (segResp.ok) await cache.put(segUrl, segResp);
            } catch(e) {
              if ((e as Error).name === 'AbortError') throw e;
              console.warn('Failed to fetch segment:', segUrl);
            }
            loaded++;
            if (onProgress) onProgress(Math.round((loaded / total) * 100));
          }));
        }
      } else {
        // --- STANDARD MP4 DOWNLOADER ---
        const responseClone = response.clone();
        const [blob] = await Promise.all([
          responseClone.blob(),
          cache.put(url, response)
        ]);
        movieData.blob = blob;
        if (onProgress) onProgress(100);
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(movieData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error saving metadata to IndexedDB');
      });

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Get a downloaded movie from IndexedDB
   */
  async getDownloadedMovie(id: string): Promise<DownloadedMovie | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Error retrieving from IndexedDB');
    });
  }

  /**
   * List all downloaded movies
   */
  async getAllDownloaded(): Promise<DownloadedMovie[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Error listing downloads');
    });
  }

  /**
   * Delete a downloaded movie
   */
  async deleteDownload(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error deleting from IndexedDB');
    });
  }

  /**
   * Check if a movie is already downloaded
   */
  async isDownloaded(id: string): Promise<boolean> {
    const movie = await this.getDownloadedMovie(id);
    return !!movie;
  }
}

export const downloadService = new DownloadService();
