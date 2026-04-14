import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, MessageSquareText, Check, FastForward, RotateCw, ArrowLeft, Flag, Minimize, Gauge } from 'lucide-react';
import { supabase } from '../supabaseClient';
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<{ type: 'play' | 'pause' | 'forward' | 'backward'; key: number } | null>(null);
  const [ambientColor, setAmbientColor] = useState('rgba(0,0,0,0)');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [is2xPressing, setIs2xPressing] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const indicatorTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressActiveRef = useRef(false);

  const triggerIndicator = (type: 'play' | 'pause' | 'forward' | 'backward') => {
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    setActiveIndicator({ type, key: Math.random() });
    indicatorTimerRef.current = window.setTimeout(() => {
      setActiveIndicator(null);
    }, 700);
  };

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
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, [clipId]);

  // ── 2. Once we have the clip, load the video ─────────────────────────────
  useEffect(() => {
    if (!clipData || !videoRef.current) return;
    let hls: any = null;
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
      hls = new Hls({ 
        enableWorker: true, 
        maxBufferLength: 30,
        fragLoadingTimeOut: 40000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        enableSoftwareAES: true 
      });
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

  // ── 3b. Ambient Color Sync ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canvasRef.current) return;

    const sample = () => {
      if (video.paused || video.ended) return;
      const ctx = canvasRef.current!.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setAmbientColor(`rgba(${r}, ${g}, ${b}, 0.5)`);
      }
    };

    let interval = setInterval(sample, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // ── 3c. Fullscreen Change Handler ──────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ── 4. Controls auto-hide ─────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = window.setTimeout(() => {
      if (!hasEnded && isPlaying) setShowControls(false);
    }, 3500);
  }, [hasEnded, isPlaying]);

  // ── 5. Playback helpers ───────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (hasEnded) { replay(); return; }
    if (isPlaying) { 
      v.pause(); 
      setIsPlaying(false); 
      triggerIndicator('pause');
    }
    else { 
      v.play().then(() => {
        setIsPlaying(true);
        triggerIndicator('play');
      }).catch(() => {}); 
    }
    resetControlsTimer();
  };

  const skipForward = () => {
    if (videoRef.current && clipData) {
      const newTime = Math.min(clipData.end_time, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = newTime;
      triggerIndicator('forward');
    }
  };

  const skipBackward = () => {
    if (videoRef.current && clipData) {
      const newTime = Math.max(clipData.start_time, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = newTime;
      triggerIndicator('backward');
    }
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v || !clipData) return;
    v.currentTime = clipData.start_time;
    v.play().then(() => { 
      setIsPlaying(true); 
      setHasEnded(false); 
      setElapsed(0); 
      triggerIndicator('play');
    }).catch(() => {});
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) videoRef.current.muted = !isMuted;
    setIsMuted(p => !p);
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };


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
      onClick={(e) => {
        const isMobile = window.innerWidth <= 896;
        if (isMobile) {
          const now = Date.now();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          
          if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
            const width = rect.width;
            if (x < width * 0.4) {
              skipBackward();
              lastTapRef.current = null;
              return;
            } else if (x > width * 0.6) {
              skipForward();
              lastTapRef.current = null;
              return;
            }
          }
          lastTapRef.current = { time: now, x };

          if (showControls) {
            setShowControls(false);
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
          } else {
            resetControlsTimer();
          }
        } else {
          togglePlay();
        }
      }}
      onTouchStart={() => {
        if (window.innerWidth > 896) return;
        longPressTimerRef.current = window.setTimeout(() => {
          if (videoRef.current && isPlaying) {
            isLongPressActiveRef.current = true;
            videoRef.current.playbackRate = 2;
            setIs2xPressing(true);
            if ('vibrate' in navigator) navigator.vibrate(50);
          }
        }, 500);
      }}
      onTouchEnd={(e) => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        if (isLongPressActiveRef.current) {
          isLongPressActiveRef.current = false;
          if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
            setIs2xPressing(false);
          }
          e.preventDefault();
        }
      }}
    >
      {/* GPU Accelerated Ambient Glow */}
      <div 
        className="cp-ambient-glow"
        style={{ backgroundColor: ambientColor }}
      />
      
      <canvas ref={canvasRef} width="1" height="1" style={{ display: 'none' }} />

      {/* Visual Indicators (Centered bubble) */}
      {activeIndicator && (activeIndicator.type === 'play' || activeIndicator.type === 'pause') && (
        <div key={activeIndicator.key} className={`cp-indicator cp-indicator--${activeIndicator.type}`}>
          {activeIndicator.type === 'play' && <Play fill="white" size={64} />}
          {activeIndicator.type === 'pause' && <Pause fill="white" size={64} />}
        </div>
      )}

      {is2xPressing && (
        <div className="cp-2x-indicator">
          <div className="cp-2x-pill">
            <FastForward size={16} fill="white" strokeWidth={0} />
            <span>2X Speed</span>
          </div>
        </div>
      )}
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

      {/* Top bar — redesigned like VideoPlayer */}
      <div 
        className={`cp-top-bar ${showControls ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="cp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={32} />
        </button>

        <div className="cp-movie-info desktop-only">
          {movie?.logo
            ? <img src={movie.logo} className="cp-movie-logo" alt={movie.title} />
            : <span className="cp-movie-title">{movie?.title}</span>
          }
          <span className="cp-clip-badge">Shared Moment</span>
        </div>

        <div className="cp-mobile-top-title mobile-only">
          {movie?.title}
        </div>

        <div className="cp-top-actions">
          <button className="cp-top-btn desktop-only">
            <Flag size={24} />
          </button>
          <button
            className="cp-watch-full-btn"
            onClick={e => { e.stopPropagation(); navigate(session ? `/watch/${clipData?.movie_id}` : '/login'); }}
          >
            {session ? 'Watch Full Movie' : 'Sign In to Watch'}
          </button>
        </div>
      </div>

      {/* Center Mobile Controls (Replicated from VideoPlayer) */}
      <div className={`cp-center-controls mobile-only ${showControls && !loading && !hasEnded ? 'show' : ''}`}>
        <button 
          className={`cp-center-btn ${activeIndicator?.type === 'backward' ? 'animate-spin-backward' : ''}`}
          onClick={(e) => { e.stopPropagation(); skipBackward(); }}
          key={`back-${activeIndicator?.type === 'backward' ? activeIndicator.key : 'idle'}`}
        >
          <RotateCcw size={36} />
          <span className="cp-skip-label">10</span>
        </button>
        
        <button 
          className={`cp-center-btn cp-center-play ${(activeIndicator?.type === 'play' || activeIndicator?.type === 'pause') ? 'animate-pop' : ''}`}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          key={`play-${activeIndicator?.type === 'play' || activeIndicator?.type === 'pause' ? activeIndicator.key : 'idle'}`}
        >
          {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
        </button>
        
        <button 
          className={`cp-center-btn ${activeIndicator?.type === 'forward' ? 'animate-spin-forward' : ''}`}
          onClick={(e) => { e.stopPropagation(); skipForward(); }}
          key={`fwd-${activeIndicator?.type === 'forward' ? activeIndicator.key : 'idle'}`}
        >
          <RotateCw size={36} />
          <span className="cp-skip-label">10</span>
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
          onClick={e => { e.stopPropagation(); navigate(session ? `/watch/${clipData?.movie_id}` : '/login'); }}
        >
          {session ? 'Watch Full Movie' : 'Sign in to watch full movie'}
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
        {/* Seekable progress bar — Netflix style */}
        <div className="cp-timeline-container">
          <input
            type="range"
            min="0"
            max={clipDuration || 100}
            step="0.01"
            value={elapsed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (videoRef.current && clipData) {
                videoRef.current.currentTime = clipData.start_time + val;
                setElapsed(val);
                setHasEnded(false);
              }
            }}
            className="cp-timeline-slider"
            style={{ 
              backgroundSize: `${(elapsed / Math.max(clipDuration, 1)) * 100}% 100%` 
            }}
          />
          <span className="cp-time-remaining">−{fmt(clipDuration - elapsed)}</span>
        </div>

        {/* Button row */}
        <div className="cp-btn-row">
          <div className="cp-controls-left desktop-only">
            <button className="cp-btn" onClick={e => { e.stopPropagation(); togglePlay(); }}>
              {hasEnded
                ? <RotateCcw size={42} />
                : isPlaying
                  ? <Pause size={42} fill="white" strokeWidth={0} />
                  : <Play size={42} fill="white" strokeWidth={0} />
              }
            </button>
            <button className="cp-btn" onClick={e => { e.stopPropagation(); skipBackward(); }}>
              <RotateCcw size={38} />
              <span className="cp-skip-inner-text">10</span>
            </button>
            <button className="cp-btn" onClick={e => { e.stopPropagation(); skipForward(); }}>
              <RotateCw size={38} />
              <span className="cp-skip-inner-text">10</span>
            </button>
            <button className="cp-btn" onClick={e => { e.stopPropagation(); toggleMute(); }}>
              {isMuted ? <VolumeX size={38} /> : <Volume2 size={38} />}
            </button>
          </div>

          <div className="cp-controls-center desktop-only">
            <span className="cp-active-title">{movie?.title}</span>
            <span className="cp-active-badge">Shared Moment</span>
          </div>

          <div className="cp-controls-right desktop-only">
            {/* Subtitles Menu Button */}
            <div className="cp-sub-wrapper">
              <button 
                className={`cp-btn ${showSubMenu ? 'active' : ''}`} 
                onClick={e => { e.stopPropagation(); setShowSubMenu(!showSubMenu); }}
              >
                <MessageSquareText size={28} />
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

            <button className="cp-btn desktop-only" onClick={e => { e.stopPropagation(); toggleFullscreen(); }}>
              {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Bottom Row — Replicated from VideoPlayer */}
        <div className="cp-mobile-bottom-row mobile-only">
          <div className="cp-mobile-bottom-btn" onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(true); setShowSubMenu(false); }}>
            <Gauge size={20} />
            <span>Speed ({playbackSpeed}x)</span>
          </div>
          <div className="cp-mobile-bottom-btn" onClick={(e) => { e.stopPropagation(); setShowSubMenu(true); setShowSpeedMenu(false); }}>
            <MessageSquareText size={20} />
            <span>Audio & Subtitles</span>
          </div>
        </div>
      </div>

      {/* Speed Menu Bottom Sheet for Mobile */}
      {showSpeedMenu && (
        <div className="cp-mobile-sheet-overlay" onClick={() => setShowSpeedMenu(false)}>
          <div className="cp-mobile-sheet" onClick={e => e.stopPropagation()}>
            <div className="cp-mobile-sheet-header">
              <div className="cp-mobile-sheet-title">Playback Speed</div>
            </div>
            <div className="cp-speed-options">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <div 
                  key={speed} 
                  className={`cp-speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(speed)}
                >
                  <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                  {playbackSpeed === speed && <Check size={20} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
