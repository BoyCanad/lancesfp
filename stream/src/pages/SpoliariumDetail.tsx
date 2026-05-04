import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVideoFade } from '../hooks/useVideoFade';
import { Play, Plus, Share2, Library, VolumeX, Volume2, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { featuredMovies, elBimboCollections } from '../data/movies';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import './MovieDetail.css';
import './MinsanDetail.css';

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



export default function SpoliariumDetail() {
  const movie = featuredMovies.find((m) => m.id === 'spoliarium-graduation');
  const navigate = useNavigate();
  const location = useLocation();
  const stateStartTime = location.state?.startTime as number | undefined;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Trailer preview states
  const [trailerActive, setTrailerActive] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cues, setCues] = useState<ParsedCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [pageReady, setPageReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Set initial time if provided from navigation
  useEffect(() => {
    if (trailerActive && stateStartTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = stateStartTime;
    }
  }, [trailerActive, stateStartTime]);

  // Sync subtitles
  useEffect(() => {
    if (!trailerActive) {
      setCurrentSubtitle('');
    }
  }, [trailerActive]);

  // Fetch subtitles on mount
  useEffect(() => {
    if (!movie?.trailerVttUrl) return;
    fetch(movie.trailerVttUrl)
      .then(res => res.text())
      .then(data => {
        const parsed = parseVTT(data);
        setCues(parsed);
      })
      .catch(err => console.error('Failed to load subtitles:', err));
  }, [movie]);

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Start playing when trailer becomes active
  useEffect(() => {
    if (trailerActive && videoRef.current) {
      videoRef.current.muted = isMuted;
      // videoRef.current.play().catch(() => { });
    }
  }, [trailerActive]);

  // Update subtitles as video plays
  const handleTimeUpdate = () => {
    if (!videoRef.current || !trailerActive) return;
    const time = videoRef.current.currentTime;
    const activeCue = cues.find(cue => time >= cue.start && time <= cue.end);
    setCurrentSubtitle(activeCue ? activeCue.text : '');
  };

  const handleTrailerEnd = () => {
    setTrailerActive(false);
  };

  const toggleMute = () => setIsMuted(m => !m);

  const handlePlayClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      navigate('/watch/spoliarium-graduation');
    }
  };

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? movie.mobileBanner || movie.banner
    : movie.banner;

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
          <button
            className="mdetail-vol-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
          >
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
            <span className="mdetail-badge mdetail-badge-cam">HD</span>
            <span className="mdetail-rating">★ {movie.rating}</span>
          </div>

          <div className="mdetail-genres">
            {movie.genre.filter(g => g !== 'Ang Huling El Bimbo').map((g) => (
              <span key={g} className="mdetail-genre-pill">{g}</span>
            ))}
          </div>

          <p className="mdetail-description">{movie.description}</p>

          <div className="mdetail-actions">
            <button onClick={handlePlayClick} className="mdetail-btn mdetail-btn-play">
              <Play size={18} fill="black" strokeWidth={0} /> Play
            </button>

            <div className="mdetail-quick-actions">
              <button className="mdetail-quick-btn">
                <Plus size={28} color="white" strokeWidth={1.5} />
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
      
      <div className="mdetail-collections-wrapper">
        <ContentRow
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Library size={24} color="#e50914" /> Ang Huling El Bimbo Collections
            </div>
          }
          movies={elBimboCollections.filter(m => m.title !== movie?.title)}
        />
      </div>
    </div>
  );
}
