import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, MessageSquareText, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { featuredMovies } from '../data/movies';
import Hls from 'hls.js';
import './ClipPlayer.css';

interface ClipRow {
  id: string;
  movie_id: string;
  start_time: number;
  end_time: number;
}

interface ParsedCue { start: number; end: number; text: string; }

const parseVTT = (raw: string): ParsedCue[] => {
  const cues: ParsedCue[] = [];
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeLine = lines.find(l => l.includes('-->'));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const toSec = (t: string) => {
      const p = t.replace(/,/g, '.').split(':').map(Number);
      return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p[0]*60 + p[1];
    };
    const textLines = lines.filter(l => !l.includes('-->') && !/^\d+$/.test(l.trim()) && l !== 'WEBVTT');
    if (textLines.length) cues.push({ start: toSec(startStr), end: toSec(endStr), text: textLines.join('\n').replace(/<[^>]+>/g, '') });
  }
  return cues;
};

const fmt = (s: number) => {
  const c = Math.max(0, s);
  const m = Math.floor(c / 60);
  const sec = Math.floor(c % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

export default function ClipPlayer() {
  const { clipId } = useParams<{ movieSlug: string; clipId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [clipData, setClipData] = useState<ClipRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clipDuration, setClipDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const controlsTimerRef = useRef<number | null>(null);
  const [showLogo, setShowLogo] = useState(true);
  const [logoFading, setLogoFading] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<ParsedCue[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState('');
  const [activeSubIdx, setActiveSubIdx] = useState<number>(-1);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // ── 1. Fetch clip row from Supabase ──────────────────────────────────────
  useEffect(() => {
    if (!clipId) { setError('No clip ID provided.'); setLoading(false); return; }

    supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Clip not found or has expired.');
          setShowLogo(false);
        } else {
          setClipData(data as ClipRow);
          setClipDuration(data.end_time - data.start_time);
          // Fade logo out after 1.8s
          setTimeout(() => setLogoFading(true), 1400);
          setTimeout(() => setShowLogo(false), 2000);
        }
        setLoading(false);
      });
  }, [clipId]);

  // ── 2. Once we have the clip, load the video ─────────────────────────────
  useEffect(() => {
    if (!clipData || !videoRef.current) return;
    const mid = clipData.movie_id;
    const movie = featuredMovies.find(
      m => m.id === mid || (mid && m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(mid.replace(/[^a-z0-9]+/g, '-').slice(0, 8)))
    );
    const src = movie?.videoUrl;
    if (!src) { setError(`Video source not available. (movie_id: ${mid})`); return; }

    const video = videoRef.current;

    const seekToStart = () => {
      video.currentTime = clipData.start_time;
    };

    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 60 });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        seekToStart();
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', seekToStart, { once: true });
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.src = src;
      video.addEventListener('loadedmetadata', seekToStart, { once: true });
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [clipData]);

  // ── 2b. Load subtitles ───────────────────────────────────────────────────
  useEffect(() => {
    if (!clipData) return;
    const mid = clipData.movie_id;
    const movie = featuredMovies.find(
      m => m.id === mid || m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(mid.replace(/[^a-z0-9]+/g, '-').slice(0, 8))
    );
    
    // Default to Filipino on first load if not set
    if (activeSubIdx === -1 && movie?.subtitles) {
      const filIdx = movie.subtitles.findIndex(s => s.label.toLowerCase() === 'filipino');
      setActiveSubIdx(filIdx !== -1 ? filIdx : 0);
      return;
    }

    const vttUrl = movie?.subtitles?.[activeSubIdx]?.url;
    if (!vttUrl) {
      setSubtitleCues([]);
      setActiveSubtitle('');
      return;
    }

    fetch(vttUrl)
      .then(r => r.text())
      .then(raw => setSubtitleCues(parseVTT(raw)))
      .catch(() => {});
  }, [clipData, activeSubIdx]);

  // ── 3. Progress tracking + clip boundary enforcement ─────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clipData) return;

    const onTimeUpdate = () => {
      const e = Math.max(0, video.currentTime - clipData.start_time);
      setElapsed(e);
      // Update subtitle
      const t = video.currentTime;
      const cue = subtitleCues.find(c => t >= c.start && t <= c.end);
      setActiveSubtitle(cue?.text ?? '');
      // Enforce clip end
      if (video.currentTime >= clipData.end_time) {
        video.pause();
        video.currentTime = clipData.end_time;
        setIsPlaying(false);
        setHasEnded(true);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [clipData, subtitleCues]);

  // ── 4. Controls auto-hide ─────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = window.setTimeout(() => {
      if (!hasEnded) setShowControls(false);
    }, 3500);
  }, [hasEnded]);

  // ── 5. Playback helpers ───────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (hasEnded) { replay(); return; }
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { v.play().then(() => setIsPlaying(true)).catch(() => {}); }
    resetControlsTimer();
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v || !clipData) return;
    v.currentTime = clipData.start_time;
    v.play().then(() => { setIsPlaying(true); setHasEnded(false); setElapsed(0); }).catch(() => {});
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) videoRef.current.muted = !isMuted;
    setIsMuted(p => !p);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // Seek within clip boundaries from progress bar interaction
  const seekFromPct = (pct: number) => {
    if (!clipData || !videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, pct));
    const newTime = clipData.start_time + clamped * clipDuration;
    videoRef.current.currentTime = newTime;
    setElapsed(clamped * clipDuration);
    setHasEnded(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    seekFromPct((e.clientX - rect.left) / rect.width);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    seekFromPct((touch.clientX - rect.left) / rect.width);
  };

  const progress = clipDuration > 0 ? Math.min(1, elapsed / clipDuration) : 0;
  const movie = clipData ? featuredMovies.find(m => {
    const mid = clipData.movie_id;
    return m.id === mid || m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(mid.replace(/[^a-z0-9]+/g, '-').slice(0, 8));
  }) : null;

  // ── Loading / Error screens ───────────────────────────────────────────────
  if (loading) return (
    <div className="cp-screen">
      <div className="cp-spinner" />
      <p className="cp-hint">Loading shared moment…</p>
    </div>
  );

  if (error) return (
    <div className="cp-screen">
      <div className="cp-error-icon">✂</div>
      <h2 className="cp-error-title">Clip Not Found</h2>
      <p className="cp-hint">{error}</p>
      <button className="cp-home-btn" onClick={() => navigate('/browse')}>Go Home</button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`cp-container ${showControls ? "show-controls" : ""}`}
      onMouseMove={resetControlsTimer}
      onClick={() => {
        if (showControls) setShowControls(false);
        else resetControlsTimer();
      }}
    >
      {/* Video element — no native controls */}
      <video
        ref={videoRef}
        className="cp-video"
        playsInline
        webkit-playsinline="true"
        preload="auto"
      />

      {/* Gradient overlays */}
      <div className="cp-gradient-top" />
      <div className="cp-gradient-bottom" />

      {/* Logo Splash */}
      {showLogo && (
        <div className={`cp-logo-splash ${logoFading ? 'fading' : ''}`}>
          {movie?.logo
            ? <img src={movie.logo} className="cp-splash-logo" alt={movie.title} />
            : <span className="cp-splash-title">{movie?.title ?? 'LSFPlus'}</span>
          }
          <div className="cp-logo-tagline">Shared Moment</div>
        </div>
      )}

      {/* Paused Gradient Overlay */}
      <div className={`cp-paused-gradient ${!isPlaying && !hasEnded && !showLogo ? 'visible' : ''}`} />

      {/* Top bar — movie info */}
      <div 
        className={`cp-top-bar ${showControls ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="cp-movie-info">
          {movie?.logo
            ? <img src={movie.logo} className="cp-movie-logo" alt={movie.title} />
            : <span className="cp-movie-title">{movie?.title}</span>
          }
          <span className="cp-clip-badge">Shared Moment</span>
        </div>
        <button
          className="cp-watch-full-btn"
          onClick={e => { e.stopPropagation(); navigate(`/watch/${clipData?.movie_id}`); }}
        >
          Watch Full Movie
        </button>
      </div>

      {/* Paused Info Panel — fades in on left when paused */}
      <div 
        className={`cp-paused-info ${!isPlaying && !hasEnded && !showLogo ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {movie?.logo
          ? <img src={movie.logo} className="cp-paused-logo" alt={movie.title} />
          : <span className="cp-paused-title-text">{movie?.title}</span>
        }
        {movie?.description && (
          <p className="cp-paused-desc">{movie.description}</p>
        )}
        <button
          className="cp-paused-watch-btn"
          onClick={e => { e.stopPropagation(); navigate(`/watch/${clipData?.movie_id}`); }}
        >
          Watch Full Movie
        </button>
      </div>

      {/* Centre play/replay overlay when ended */}
      {hasEnded && (
        <div className="cp-ended-overlay" onClick={e => { e.stopPropagation(); replay(); }}>
          <div className="cp-replay-btn">
            <RotateCcw size={40} color="white" />
            <span>Replay</span>
          </div>
        </div>
      )}

      {/* Subtitle overlay */}
      {activeSubtitle && (
        <div className="cp-custom-subtitle-container" onClick={e => e.stopPropagation()}>
          <div className="cp-custom-subtitle-text">
            {activeSubtitle.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div 
        className={`cp-controls ${showControls || hasEnded ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Seekable progress bar */}
        <div
          className="cp-progress-wrap"
          ref={progressBarRef}
          onClick={handleProgressClick}
          onTouchMove={handleProgressTouch}
          onTouchStart={handleProgressTouch}
        >
          <div className="cp-progress-bg">
            <div className="cp-progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="cp-progress-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
          <span className="cp-time">{fmt(elapsed)}</span>
          <span className="cp-time cp-time-total">−{fmt(clipDuration - elapsed)}</span>
        </div>

        {/* Button row */}
        <div className="cp-btn-row">
          <button className="cp-btn" onClick={e => { e.stopPropagation(); togglePlay(); }}>
            {hasEnded
              ? <RotateCcw size={24} />
              : isPlaying
                ? <Pause size={24} fill="white" strokeWidth={0} />
                : <Play size={24} fill="white" strokeWidth={0} />
            }
          </button>
          <button className="cp-btn" onClick={e => { e.stopPropagation(); replay(); }}>
            <RotateCcw size={20} />
          </button>
          <span className="cp-time-label">
            {fmt(elapsed)} / {fmt(clipDuration)}
          </span>
          <div style={{ flex: 1 }} />
          
          {/* Subtitles Menu Button */}
          <div className="cp-sub-wrapper">
            <button 
              className={`cp-btn ${showSubMenu ? 'active' : ''}`} 
              onClick={e => { e.stopPropagation(); setShowSubMenu(!showSubMenu); }}
            >
              <MessageSquareText size={22} />
            </button>
            
            {showSubMenu && movie?.subtitles && (
              <div className="cp-sub-menu" onClick={e => e.stopPropagation()}>
                <div className="cp-menu-column">
                  <div className="cp-menu-header">Audio</div>
                  <div className="cp-menu-list">
                    <div className="cp-menu-item active">
                      <Check size={16} />
                      <span>Filipino [Original]</span>
                    </div>
                  </div>
                </div>

                <div className="cp-menu-divider-v" />

                <div className="cp-menu-column">
                  <div className="cp-menu-header">Subtitles</div>
                  <div className="cp-menu-list">
                    <div 
                      className={`cp-menu-item ${activeSubIdx === -1 ? 'active' : ''}`}
                      onClick={() => { setActiveSubIdx(-1); setShowSubMenu(false); }}
                    >
                      {activeSubIdx === -1 && <Check size={16} />}
                      {activeSubIdx !== -1 && <div style={{ width: 16 }} />}
                      <span>Off</span>
                    </div>
                    {movie.subtitles.map((sub, idx) => (
                      <div 
                        key={idx}
                        className={`cp-menu-item ${activeSubIdx === idx ? 'active' : ''}`}
                        onClick={() => { setActiveSubIdx(idx); setShowSubMenu(false); }}
                      >
                        {activeSubIdx === idx && <Check size={16} />}
                        {activeSubIdx !== idx && <div style={{ width: 16 }} />}
                        <span>{sub.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="cp-btn" onClick={e => { e.stopPropagation(); toggleMute(); }}>
            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
          <button className="cp-btn" onClick={e => { e.stopPropagation(); toggleFullscreen(); }}>
            <Maximize size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
