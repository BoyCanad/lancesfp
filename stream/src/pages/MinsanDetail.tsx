import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Bookmark, Download, Library, VolumeX, Volume2 } from 'lucide-react';
import { featuredMovies, trendingMovies, elBimboFeatured } from '../data/movies';
import ContentRow from '../components/ContentRow';
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

const elBimboCollections = [
  elBimboFeatured,
  featuredMovies[1],
  featuredMovies[3],
  featuredMovies[4],
  featuredMovies[5],
  featuredMovies[6],
  featuredMovies[7],
  featuredMovies[8],
  ...[...trendingMovies].reverse().slice(7)
];

export default function MinsanDetail() {
  const movie = featuredMovies.find((m) => m.id === 'f2');
  const location = useLocation();
  const stateStartTime = location.state?.startTime as number | undefined;
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Trailer preview states
  const [trailerActive, setTrailerActive] = useState(false); // true after 5 s
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isMuted, setIsMuted]             = useState(true);
  const [cues, setCues]                   = useState<ParsedCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start trailer once after 5s upon landing (or immediately if from thumbnail)
  useEffect(() => {
    if (hasPlayedOnce || trailerActive) return;

    // If we came from a thumbnail, play immediately
    if (stateStartTime !== undefined) {
      setTrailerActive(true);
      setHasPlayedOnce(true);
      return;
    }

    // Otherwise wait 3 seconds
    const timer = window.setTimeout(() => {
      setTrailerActive(true);
      setHasPlayedOnce(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [stateStartTime, hasPlayedOnce, trailerActive]);

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
    fetch('https://ebrdhrulyjxleytptrpf.supabase.co/storage/v1/object/public/titles/Minsan/TRAILER.vtt')
      .then(res => res.text())
      .then(data => {
        const parsed = parseVTT(data);
        setCues(parsed);
      })
      .catch(err => console.error('Failed to load subtitles:', err));
  }, []);

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
      videoRef.current.play().catch(() => {});
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

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? '/images/minsan-detail-mobile.webp'
    : '/images/minsan-detail.webp';

  return (
    <div className="mdetail-page-wrapper">
      <div className="mdetail-container">

        {/* Static background — fades out when trailer starts */}
        <div
          className={`mdetail-bg mdetail-bg--static ${trailerActive ? 'mdetail-bg--hidden' : ''}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        {/* Trailer video — fades in after 5 s */}
        {movie.trailerUrl && (
          <video
            ref={videoRef}
            className={`mdetail-trailer-video ${trailerActive ? 'mdetail-trailer-video--visible' : ''}`}
            src={movie.trailerUrl}
            autoPlay={trailerActive}
            muted={isMuted}
            loop={false} // Change to false to trigger onEnded
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleTrailerEnd}
          />
        )}

        {/* Custom Subtitle Overlay */}
        {trailerActive && currentSubtitle && (
          <div className="mdetail-subtitle-overlay">
            <div className="mdetail-subtitle-text">
              {currentSubtitle.split('\n').map((line, idx) => (
                <span key={idx}>{line}<br /></span>
              ))}
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="mdetail-gradient mdetail-gradient-left" />
        <div className="mdetail-gradient mdetail-gradient-bottom" />

        {/* Volume toggle — appears only while trailer is playing */}
        {trailerActive && movie.trailerUrl && (
          <button
            className="mdetail-vol-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
          >
            {isMuted
              ? <VolumeX size={20} strokeWidth={2} />
              : <Volume2 size={20} strokeWidth={2} />
            }
          </button>
        )}

        {/* Content wrapper */}
        <div className="mdetail-content">

          {/* Logo */}
          {movie.logo ? (
            <img src={movie.logo} alt={movie.title} className="mdetail-logo" />
          ) : (
            <h1 className="mdetail-title">{movie.title}</h1>
          )}

          {/* Metadata row */}
          <div className="mdetail-meta-row">
            <span className="mdetail-meta-text">{movie.year}</span>
            <span className="mdetail-badge">{movie.ageRating}</span>
            <span className="mdetail-meta-text">{movie.duration}</span>
            <span className="mdetail-badge mdetail-badge-cam">HD</span>
            <span className="mdetail-rating">★ {movie.rating}</span>
          </div>

          {/* Genre pills */}
          <div className="mdetail-genres">
            {movie.genre.map((g) => (
              <span key={g} className="mdetail-genre-pill">{g}</span>
            ))}
          </div>

          {/* Description */}
          <p className="mdetail-description">{movie.description}</p>

          {/* Action Buttons */}
          <div className="mdetail-actions">
            <Link to={`/watch/minsan`} className="mdetail-btn mdetail-btn-play" style={{ textDecoration: 'none' }}>
              <Play size={18} fill="black" strokeWidth={0} /> Play
            </Link>

            <div className="mdetail-actions-row">
              <button className="mdetail-btn mdetail-btn-secondary">
                <Bookmark size={18} /> Save to Vault
              </button>
              <button className="mdetail-btn mdetail-btn-secondary">
                <Download size={18} /> Download
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
