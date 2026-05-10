import { useState, useEffect, useCallback, useRef } from 'react';
import {
  downloadHlsStream,
  deleteOfflineMovie,
  isMovieOffline,
  getOfflineMeta,
  cancelDownload,
  type DownloadProgress,
  type SubtitleTrack,
} from '../services/hlsDownloadService';
import type { Movie } from '../data/movies';
import './DownloadButton.css';

interface Props {
  movie: Movie;
  /** compact = small icon-only button (for player controls), full = card-style download UI */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function DownloadButton({ movie, variant = 'full', className = '' }: Props) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [offline, setOffline] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const confirmRef = useRef<number | null>(null);

  const checkOffline = useCallback(() => {
    setOffline(isMovieOffline(movie.id));
    const meta = getOfflineMeta(movie.id);
    if (meta) {
      setProgress({
        movieId: movie.id,
        total: meta.segmentCount,
        downloaded: meta.segmentCount,
        status: 'done',
      });
    }
  }, [movie.id]);

  useEffect(() => {
    checkOffline();
  }, [checkOffline]);

  // Don't show for live streams or movies without a downloadable HLS URL
  const canDownload =
    movie.videoUrl &&
    (movie.videoUrl.includes('.m3u8') || movie.videoUrl.includes('m3u8')) &&
    movie.streamStatus !== 'live';

  if (!canDownload) return null;

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : 0;

  const isDownloading = progress?.status === 'downloading';
  const isDone = progress?.status === 'done' || offline;
  const isError = progress?.status === 'error';

  const handleDownload = async () => {
    if (isDownloading) {
      cancelDownload(movie.id);
      setProgress(null);
      return;
    }

    if (isDone) {
      setShowConfirmDelete(true);
      confirmRef.current = window.setTimeout(() => setShowConfirmDelete(false), 4000);
      return;
    }

    try {
      const subtitleTracks: SubtitleTrack[] = movie.subtitles ?? [];
      await downloadHlsStream(movie.id, movie.videoUrl!, (p) => {
        setProgress(p);
        if (p.status === 'done') setOffline(true);
        if (p.status === 'idle') setOffline(false);
      }, subtitleTracks);
    } catch {
      // Error already reflected via progress callback
    }
  };

  const handleDelete = async () => {
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setShowConfirmDelete(false);
    await deleteOfflineMovie(movie.id);
    setProgress(null);
    setOffline(false);
  };

  const handleCancelDelete = () => {
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setShowConfirmDelete(false);
  };

  if (variant === 'compact') {
    return (
      <div className={`dl-btn-compact ${className}`}>
        {showConfirmDelete ? (
          <div className="dl-confirm-delete-compact">
            <button onClick={handleDelete} className="dl-confirm-yes">Delete</button>
            <button onClick={handleCancelDelete} className="dl-confirm-no">Cancel</button>
          </div>
        ) : (
          <button
            className={`dl-compact-btn ${isDone ? 'dl-done' : ''} ${isDownloading ? 'dl-loading' : ''} ${isError ? 'dl-error' : ''}`}
            onClick={handleDownload}
            title={isDone ? 'Available offline – tap to remove' : isDownloading ? `Downloading… ${percent}%` : 'Download for offline'}
            aria-label={isDone ? 'Delete offline copy' : 'Download for offline'}
          >
            {isDone ? (
              <DownloadDoneIcon />
            ) : isDownloading ? (
              <DownloadProgressIcon percent={percent} />
            ) : (
              <DownloadIcon />
            )}
          </button>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`dl-btn-full ${className}`}>
      {showConfirmDelete ? (
        <div className="dl-confirm-delete">
          <p className="dl-confirm-text">Remove offline copy of <strong>{movie.title}</strong>?</p>
          <div className="dl-confirm-actions">
            <button onClick={handleDelete} className="dl-btn-delete">Delete</button>
            <button onClick={handleCancelDelete} className="dl-btn-cancel">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          className={`dl-full-btn ${isDone ? 'dl-full-done' : ''} ${isDownloading ? 'dl-full-loading' : ''} ${isError ? 'dl-full-error' : ''}`}
          onClick={handleDownload}
        >
          {isDownloading ? (
            <>
              <DownloadProgressIcon percent={percent} />
              <span className="dl-full-label">
                Downloading… {percent}%
                <span className="dl-cancel-hint"> (tap to cancel)</span>
              </span>
            </>
          ) : isDone ? (
            <>
              <DownloadDoneIcon />
              <span className="dl-full-label">Available Offline</span>
            </>
          ) : isError ? (
            <>
              <DownloadIcon />
              <span className="dl-full-label">Download Failed – Retry</span>
            </>
          ) : (
            <>
              <DownloadIcon />
              <span className="dl-full-label">Download</span>
            </>
          )}
        </button>
      )}

      {isDownloading && (
        <div className="dl-progress-bar">
          <div className="dl-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      )}

      {isError && (
        <p className="dl-error-msg">{progress?.error ?? 'Download failed. Check your connection.'}</p>
      )}
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function DownloadDoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadProgressIcon({ percent }: { percent: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}
