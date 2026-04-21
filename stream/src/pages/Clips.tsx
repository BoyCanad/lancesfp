import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, Plus, Check, Share2, Play,
  Home, PlaySquare, Gamepad2
} from 'lucide-react';
import { isInMyList, addToMyList, removeFromMyList } from '../services/listService';
import { allMovies } from '../data/movies';
import type { Movie } from '../data/movies';
import { getProfiles } from '../services/profileService';
import './Clips.css';

// Include any movie that has a tall trailer (vertical video)
const clipsData: Movie[] = allMovies.filter(m => m.tallTrailerUrl);

// ─────────────────────────────────────────────────────────
//  VTT parser — returns array of { start, end, text } cues
// ─────────────────────────────────────────────────────────
interface VttCue { start: number; end: number; text: string; }

function parseVttTime(ts: string): number {
  // Supports HH:MM:SS.mmm and MM:SS.mmm
  const parts = ts.trim().split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return seconds;
}

function parseVtt(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    // Find the timing line
    const timingIdx = lines.findIndex(l => l.includes('-->'));
    if (timingIdx === -1) continue;
    const [startStr, endStr] = lines[timingIdx].split('-->');
    const start = parseVttTime(startStr);
    const end   = parseVttTime(endStr.trim().split(' ')[0]); // strip cue settings
    const text  = lines.slice(timingIdx + 1).join('\n').trim();
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

// ─────────────────────────────────────────────────────────
//  Single clip card
// ─────────────────────────────────────────────────────────
interface ClipItemProps {
  movie: Movie;
  isActive: boolean;
  isNext: boolean;
  isPrev: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  index: number;
}

function ClipItem({ movie, isActive, isNext, isPrev, isMuted, onMuteToggle, index }: ClipItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [showPauseFlash, setShowPauseFlash] = useState(false);
  const [inList, setInList] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  // Subtitle state
  const [subtitleCues, setSubtitleCues] = useState<VttCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch & parse VTT eagerly on mount so it's ready when clip becomes active
  useEffect(() => {
    if (!movie.trailerVttUrl) return;
    let cancelled = false;
    fetch(movie.trailerVttUrl)
      .then(r => r.text())
      .then(raw => { 
        if (!cancelled) setSubtitleCues(parseVtt(raw)); 
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [movie.trailerVttUrl]);


  // Track video currentTime and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  // Active subtitle cues
  const activeCues = subtitleCues.filter(
    c => currentTime >= c.start && currentTime <= c.end
  );

  // Autoplay/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;

      const tryPlay = () => {
        video.currentTime = 0;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      };

      // readyState < 3 means not enough data buffered to play
      if (video.readyState < 3) {
        video.load(); // kick off loading
        const onCanPlay = () => tryPlay();
        video.addEventListener('canplay', onCanPlay, { once: true });
        return () => video.removeEventListener('canplay', onCanPlay);
      } else {
        tryPlay();
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setCurrentTime(0);
    }
  }, [isActive]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setInList(isInMyList(movie.id));
  }, [movie.id]);

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inList) {
      removeFromMyList(movie.id);
      setInList(false);
    } else {
      addToMyList(movie.id);
      setInList(true);
    }
  };

  // Keep mute in sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
      setShowPauseFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => setShowPauseFlash(false), 900);
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pathMap: Record<string, string> = {
      'ang-huling-el-bimbo-play': '/ang-huling-el-bimbo-play',
      'minsan': '/minsan',
      'tindahan-ni-aling-nena': '/tindahan-ni-aling-nena',
      'alapaap-overdrive': '/alapaap-overdrive',
      'spoliarium-graduation': '/spoliarium-graduation',
      'pare-ko': '/pare-ko',
      'tama-ka-ligaya': '/tama-ka-ligaya',
      'ang-huling-el-bimbo': '/ang-huling-el-bimbo'
    };
    navigate(pathMap[movie.id] || `/watch/${movie.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${movie.id}`;
    try {
      if (navigator.share) await navigator.share({ title: movie.title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* noop */ }
  };

  return (
    <div className="clip-item" id={`clip-${index}`}>
      {/* ── Video ── */}
      <video
        ref={videoRef}
        className="clip-video"
        src={movie.tallTrailerUrl || movie.trailerUrl}
        playsInline
        loop
        muted={isMuted}
        preload={isActive || isNext || isPrev ? 'auto' : 'metadata'}
        onClick={handleVideoClick}
      />

      {/* ── Gradient ── */}
      <div className="clip-gradient" />

      {/* ── Pause flash ── */}
      {showPauseFlash && (
        <div className="clip-play-flash">
          <Play size={64} fill="white" strokeWidth={0} />
        </div>
      )}

      {/* ── Age rating badge ── */}
      <div className="clip-age-badge">{movie.ageRating}</div>

      {/* ── Right action buttons ── */}
      <div className="clip-actions-right" onClick={e => e.stopPropagation()}>
        {/* Volume */}
        <button className="clip-action-btn" onClick={onMuteToggle}>
          <div className="clip-action-icon">
            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </div>
        </button>

        {/* My List */}
        <div className="clip-action-item">
          <button className="clip-action-btn" onClick={handleToggleList}>
            <div className="clip-action-icon">
              {inList ? <Check size={22} color="#00ff00" /> : <Plus size={22} />}
            </div>
          </button>
          <span className="clip-action-label">{inList ? 'Added' : 'My List'}</span>
        </div>

        {/* Share */}
        <div className="clip-action-item">
          <button className="clip-action-btn" onClick={handleShare}>
            <div className="clip-action-icon"><Share2 size={20} /></div>
          </button>
          <span className="clip-action-label">Share</span>
        </div>
      </div>

      {/* ── Bottom info panel ── */}
      <div className="clip-info" onClick={e => e.stopPropagation()}>
        {/* Left: text */}
        <div className="clip-info-left">
          {/* ── Custom subtitle overlay ── */}
          {isActive && activeCues.length > 0 && (
            <div className="clip-subtitle-overlay" onClick={e => e.stopPropagation()}>
              {activeCues.map((cue, i) => (
                <div key={i} className="clip-subtitle-cue">
                  {cue.text.split('\n').map((line, li) => (
                    <span key={li}>{line}<br /></span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <h2 className="clip-title">{movie.title}</h2>

          <div className="clip-genres">
            {movie.genre.slice(0, 3).map((g, i) => (
              <span key={g}>
                {i > 0 && <span className="clip-genre-dot"> • </span>}
                <span className="clip-genre-tag">{g}</span>
              </span>
            ))}
          </div>

          <div 
            className={`clip-description-container ${isExpanded ? 'is-expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <p className="clip-description">
              {movie.description}
            </p>
            {!isExpanded && movie.description.length > 60 && (
              <span className="clip-description-more">
                ...more
              </span>
            )}
          </div>

          <button className="clip-watch-btn" onClick={handleDetailsClick}>
            <Play size={14} fill="white" strokeWidth={0} />
            Watch Now
          </button>
        </div>

        {/* Right: thumbnail + logo */}
        <div className="clip-thumbnail-wrap" onClick={handleDetailsClick}>
          <div className="clip-thumb-circle">
            <img
              className="clip-thumb-img"
              src={movie.squareThumbnail || movie.mobileBanner || movie.mobileThumbnail || movie.thumbnail}
              alt={movie.title}
            />
          </div>
          {movie.logo && (
            <img className="clip-thumb-logo" src={movie.logo} alt={`${movie.title} logo`} />
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="clip-progress-container">
        <div 
          className="clip-progress-fill" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Page wrapper
// ─────────────────────────────────────────────────────────
export default function Clips() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Audio ON by default as requested
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load active profile for the bottom nav avatar
  useEffect(() => {
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    } else {
      getProfiles()
        .then(data => { if (data.length > 0) setActiveProfile(data[0]); })
        .catch(() => {});
    }
  }, []);

  // Intersection observer: detect which clip is most visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = parseInt((entry.target as HTMLElement).dataset.index ?? '0', 10);
            setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const items = container.querySelectorAll<HTMLElement>('.clip-item');
    items.forEach((el, i) => {
      el.dataset.index = String(i);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);



  return (
    <>
      {/* ── Feed ── */}
      <div className="clips-page" ref={containerRef}>
        {clipsData.map((movie, i) => (
          <ClipItem
            key={movie.id}
            movie={movie}
            index={i}
            isActive={i === activeIndex}
            isNext={i === activeIndex + 1}
            isPrev={i === activeIndex - 1}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(m => !m)}
          />
        ))}

      </div>

      {/* ── Embedded bottom nav (global nav is suppressed on this route) ── */}
      <nav className="clips-bottom-nav">
        <button className="clips-nav-btn" onClick={() => navigate('/browse')}>
          <Home size={24} strokeWidth={1.5} />
          <span>Home</span>
        </button>

        <button className="clips-nav-btn clips-nav-btn--active">
          <PlaySquare size={24} fill="white" strokeWidth={2} />
          <span>Clips</span>
        </button>

        <button className="clips-nav-btn">
          <Gamepad2 size={24} strokeWidth={1.5} />
          <span>Games</span>
        </button>

        <button className="clips-nav-btn" onClick={() => navigate('/my-lsfplus')}>
          <div className="clips-nav-avatar">
            {activeProfile?.image
              ? <img src={activeProfile.image} alt="Profile" />
              : <span>S</span>
            }
          </div>
          <span>My LSFPlus</span>
        </button>
      </nav>
    </>
  );
}
