import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVideoFade } from '../hooks/useVideoFade';
import { Play, Plus, Share2, Library, VolumeX, Volume2, ArrowLeft, Check, Bell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { allMovies as staticAllMovies, elBimboCollections as staticElBimboCollections, archiveMovies as staticArchiveMovies } from '../data/movies';
import type { Movie } from '../data/movies';
import { fetchMovieById, fetchMovieRows } from '../services/movieService';
import { addToMyList, removeFromMyList, isInMyList } from '../services/listService';
import { getWatchProgress, type WatchProgress } from '../services/profileService';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import BarkadaSection from '../components/BarkadaSection';
import BehindTheScenesSection from '../components/BehindTheScenesSection';
import { HDBadge, SpatialAudioBadge } from '../components/AudioBadges';
import './MovieDetail.css';
import './MinsanDetail.css'; // Reuse Minsan's cinematic detail styles

interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

const parseVTT = (vttData: string): ParsedCue[] => {
  const cues: ParsedCue[] = [];
  const lines = vttData.split(/\r?\n/);
  let i = 0;

  const timeToSeconds = (timeStr: string) => {
    const parts = timeStr.trim().split(':');
    let secs = 0;
    if (parts.length === 3) {
      secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
      secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
    }
    return isNaN(secs) ? 0 : secs;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const start = timeToSeconds(parts[0]);
      const end = timeToSeconds(parts[1]);

      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        const textLine = lines[i].trim().replace(/<[^>]+>/g, '');
        text += (text ? '\n' : '') + textLine;
        i++;
      }
      cues.push({ start, end, text });
    } else {
      i++;
    }
  }
  return cues;
};

export default function MovieDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname.substring(1); // remove leading slash

  const [movie, setMovie] = useState<Movie | null>(
    staticAllMovies.find((m) => m.id === pathname) ?? staticAllMovies.find((m) => m.id === 'ang-huling-el-bimbo-play') ?? null,
  );
  const [elBimboCollections, setElBimboCollections] = useState<Movie[]>(staticElBimboCollections);
  const [archiveMovies, setArchiveMovies] = useState<Movie[]>(staticArchiveMovies);

  // Fetch movie + row data from Supabase (non-blocking, replaces static if richer)
  useEffect(() => {
    fetchMovieById(pathname).then((m) => {
      if (m) setMovie(m);
    });
    fetchMovieRows().then((rows) => {
      setElBimboCollections(rows.elBimboCollections);
      setArchiveMovies(rows.archiveMovies);
    });
  }, [pathname]);

  const stateStartTime = location.state?.startTime as number | undefined;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Trailer preview states
  const [trailerActive, setTrailerActive] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cues, setCues] = useState<ParsedCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inMyList, setInMyList] = useState(false);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    if (movie) {
      setInMyList(isInMyList(movie.id));
      const handleUpdate = () => setInMyList(isInMyList(movie.id));
      window.addEventListener('mylist_updated', handleUpdate);
      
      // Fetch Watch Progress
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        getWatchProgress(profile.id).then(allProgress => {
          const movieProgress = allProgress.find(p => p.movie_id === movie.id);
          if (movieProgress) setProgress(movieProgress);
        });
      }

      return () => window.removeEventListener('mylist_updated', handleUpdate);
    }
  }, [movie]);

  useVideoFade(videoRef, isMuted, trailerActive);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mark page as ready only after the app-level loading spinner is dismissed
  useEffect(() => {
    if ((window as any).__pageLoadingDone) { setPageReady(true); return; }
    const handleDone = () => setPageReady(true);
    window.addEventListener('page_loading_done', handleDone);
    return () => window.removeEventListener('page_loading_done', handleDone);
  }, []);

  // Trailer start logic — only after page is fully ready
  useEffect(() => {
    if (!pageReady || hasPlayedOnce || trailerActive || !movie?.trailerUrl) return;
    if (stateStartTime !== undefined) {
      setTrailerActive(true);
      setHasPlayedOnce(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setTrailerActive(true);
      setHasPlayedOnce(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [pageReady, stateStartTime, hasPlayedOnce, trailerActive, movie?.trailerUrl]);

  useEffect(() => {
    if (trailerActive && stateStartTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = stateStartTime;
    }
  }, [trailerActive, stateStartTime]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (movie?.trailerVttUrl) {
      fetch(movie.trailerVttUrl)
        .then(res => res.text())
        .then(data => setCues(parseVTT(data)))
        .catch(err => console.error('Failed to load subtitles:', err));
    }
  }, [movie]);

  const handleListToggle = () => {
    if (!movie) return;
    if (inMyList) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !trailerActive) return;
    const time = videoRef.current.currentTime;
    const activeCue = cues.find(cue => time >= cue.start && time <= cue.end);
    setCurrentSubtitle(activeCue ? activeCue.text : '');
  };

  const handleTrailerEnd = () => setTrailerActive(false);
  const toggleMute = () => setIsMuted(m => !m);

  const handlePlayClick = async () => {
    if (!movie) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    navigate(movie.xRay ? `/xray/${movie.id}` : `/watch/${movie.id}`);
  };

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? movie.detailMobileBanner || movie.mobileBanner || movie.banner || movie.mobileThumbnail || movie.thumbnail
    : movie.detailBanner || movie.banner || movie.thumbnail;

  const isElBimbo = movie.genre.includes('Ang Huling El Bimbo') || movie.id.includes('el-bimbo');

  // Progress Calculation
  const progressPercent = progress ? (progress.progress_ms / progress.duration_ms) * 100 : 0;
  const remainingMs = progress ? progress.duration_ms - progress.progress_ms : 0;
  
  const formatRemaining = (ms: number) => {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
  };

  return (
    <div className="mdetail-page-wrapper">
      <button className="mdetail-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={28} />
      </button>
      <div className="mdetail-container">
        <div
          className={`mdetail-bg mdetail-bg--static ${trailerActive ? 'mdetail-bg--hidden' : ''}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        {movie.trailerUrl && (
          <video
            ref={videoRef}
            className={`mdetail-trailer-video ${trailerActive ? 'mdetail-trailer-video--visible' : ''}`}
            src={movie.trailerUrl}
            autoPlay={trailerActive}
            muted={isMuted}
            loop={false}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleTrailerEnd}
          />
        )}

        {trailerActive && currentSubtitle && (
          <div className="mdetail-subtitle-overlay">
            <div className="mdetail-subtitle-text">
              {currentSubtitle.split('\n').map((line, idx) => (
                <span key={idx}>{line}<br /></span>
              ))}
            </div>
          </div>
        )}

        <div className="mdetail-gradient mdetail-gradient-left" />
        <div className="mdetail-gradient mdetail-gradient-bottom" />

        {trailerActive && movie.trailerUrl && (
          <button className="mdetail-vol-btn" onClick={toggleMute}>
            {isMuted ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
          </button>
        )}

        <div className="mdetail-content">
          {movie.logo ? (
            <img src={movie.logo} alt={movie.title} className="mdetail-logo" />
          ) : (
            <h1 className="mdetail-title">{movie.title}</h1>
          )}

          <div className="mdetail-meta-row">
            <span className="mdetail-meta-text">{movie.year}</span>
            <span className="mdetail-badge">{movie.ageRating}</span>
            <span className="mdetail-meta-text">{movie.duration}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HDBadge />
              {(movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
                <SpatialAudioBadge />
              )}
            </div>
          </div>

          <div className="mdetail-genres">
            {movie.genre.filter(g => g !== 'Ang Huling El Bimbo').map((g) => (
              <span key={g} className="mdetail-genre-pill">{g}</span>
            ))}
          </div>

          <p className="mdetail-description">{movie.description}</p>

          <div className="mdetail-actions">
            <button
               onClick={handlePlayClick}
               className={`mdetail-btn ${progress ? 'mdetail-btn-resume' : 'mdetail-btn-play'} ${movie.comingSoon ? 'mdetail-btn-disabled' : ''}`}
               disabled={movie.comingSoon}
            >
              {movie.comingSoon ? <Bell size={18} fill="white" /> : <Play size={18} fill={progress ? "white" : "black"} strokeWidth={0} />} {movie.comingSoon ? 'Remind Me' : (progress ? 'Resume' : 'Play')}
            </button>

            {progress && (
              <div className="mdetail-progress-section">
                <div className="mdetail-progress-bar">
                  <div className="mdetail-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mdetail-remaining-text">{formatRemaining(remainingMs)}</div>
              </div>
            )}

            <div className="mdetail-quick-actions">
              <button className={`mdetail-quick-btn ${inMyList ? 'active' : ''}`} onClick={handleListToggle}>
                {inMyList ? <Check size={28} color="white" strokeWidth={1.5} /> : <Plus size={28} color="white" strokeWidth={1.5} />}
                <span>My List</span>
              </button>
              <RateButton movieId={movie.id} />
              <button className="mdetail-quick-btn">
                <Share2 size={24} color="white" strokeWidth={1.5} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isElBimbo && (movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
        <><BarkadaSection /><BehindTheScenesSection /></>
      )}

      <div className="mdetail-collections-wrapper">
        <ContentRow
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Library size={24} color="#e50914" /> {isElBimbo ? 'Ang Huling El Bimbo Collections' : 'G11 Archives'}</div>}
          movies={(isElBimbo ? elBimboCollections : archiveMovies).filter(m => m.id !== movie?.id)}
        />
      </div>
    </div>
  );
}
