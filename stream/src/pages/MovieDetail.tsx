import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Bookmark, Download, Library, VolumeX, Volume2, X, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { featuredMovies, trendingMovies, elBimboFeatured } from '../data/movies';
import ContentRow from '../components/ContentRow';
import { downloadService } from '../services/downloadService';
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

export default function MovieDetail() {
  const movie = featuredMovies.find((m) => m.id === 'ang-huling-el-bimbo-play');
  const navigate = useNavigate();
  const location = useLocation();
  const stateStartTime = location.state?.startTime as number | undefined;
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Trailer preview states
  const [trailerActive, setTrailerActive] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isMuted, setIsMuted]             = useState(false);
  const [cues, setCues] = useState<ParsedCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [isDownloading, setIsDownloading]   = useState(false);
  const [isCached, setIsCached]            = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if movie is already offline
  useEffect(() => {
    if (!movie) return;
    downloadService.isDownloaded(movie.id).then(setIsCached);
  }, [movie]);

  // Start trailer once after 3s upon landing (or immediately if from thumbnail)
  useEffect(() => {
    if (hasPlayedOnce || trailerActive || !movie?.trailerUrl) return;

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
  }, [stateStartTime, hasPlayedOnce, trailerActive, movie?.trailerUrl]);

  // Set initial time if provided from navigation
  useEffect(() => {
    if (trailerActive && stateStartTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = stateStartTime;
    }
  }, [trailerActive, stateStartTime]);

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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

  // Handle play when trailer active
  useEffect(() => {
    if (trailerActive && videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [trailerActive]);

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

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };



  const handleDeleteDownload = async () => {
    if (!movie) return;
    const confirmDelete = window.confirm(`Remove "${movie.title}" from your offline downloads?`);
    if (!confirmDelete) return;

    try {
      await downloadService.deleteDownload(movie.id);
      setIsCached(false);
      alert('Movie removed from offline storage.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete movie.');
    }
  };

  const handleDownload = async () => {
    if (!movie || isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await downloadService.downloadAndStore(
        movie.id,
        movie.videoUrl || '',
        {
          title: movie.title,
          thumbnail: movie.thumbnail,
          duration: movie.duration
        },
        (progress) => setDownloadProgress(progress),
        controller.signal
      );
      
      setIsCached(true);
      alert(`"${movie.title}" is now available offline!`);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        console.log('Download cancelled by user');
      } else {
        console.error(err);
        alert('Failed to save for offline viewing. Please check your connection and storage space.');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handlePlayClick = async () => {
    if (!movie) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const downloaded = await downloadService.getDownloadedMovie(movie.id);
    if (downloaded) {
      navigate(`/watch/${movie.id}?src=offline`, { state: { offlineUrl: downloaded.url } });
    } else {
      navigate(`/watch/${movie.id}`);
    }
  };

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? '/images/el-bimbo-detail-mobile.webp'
    : '/images/el-bimbo-detail.webp';

  return (
    <div className="mdetail-page-wrapper">
      <div className="mdetail-container">

        {/* Static background — fades out when trailer starts */}
        <div
          className={`mdetail-bg mdetail-bg--static ${trailerActive ? 'mdetail-bg--hidden' : ''}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        {/* Trailer video — fades in after 3s */}
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

        {/* Volume toggle */}
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
            <button 
              onClick={handlePlayClick} 
              className="mdetail-btn mdetail-btn-play" 
              style={{ textDecoration: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Play size={18} fill="black" strokeWidth={0} /> Play
            </button>

            <div className="mdetail-actions-row">
              <button className="mdetail-btn mdetail-btn-secondary">
                <Bookmark size={18} /> Save to Vault
              </button>
              {isDownloading ? (
                <button 
                  className="mdetail-btn mdetail-btn-secondary pulse cancel-mode"
                  onClick={handleCancelDownload}
                >
                  <X size={18} /> Cancel {downloadProgress}%
                </button>
              ) : isCached ? (
                <div className="mdetail-downloaded-wrapper">
                  <button 
                    className="mdetail-btn mdetail-btn-secondary cached"
                    disabled
                  >
                    <Download size={18} /> Downloaded
                  </button>
                  <button 
                    className="mdetail-delete-btn"
                    onClick={handleDeleteDownload}
                    title="Delete Download"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  className="mdetail-btn mdetail-btn-secondary"
                  onClick={handleDownload}
                >
                  <Download size={18} /> Download
                </button>
              )}
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
