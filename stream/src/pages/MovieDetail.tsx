import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Bookmark, Download, Library, VolumeX, Volume2 } from 'lucide-react';
import { featuredMovies, trendingMovies, elBimboFeatured } from '../data/movies';
import ContentRow from '../components/ContentRow';
import './MovieDetail.css';
import './MinsanDetail.css'; // Reuse Minsan's cinematic detail styles

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
  const movie = featuredMovies.find((m) => m.id === 'f1');
  const location = useLocation();
  const stateStartTime = location.state?.startTime as number | undefined;
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Trailer preview states
  const [trailerActive, setTrailerActive] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isMuted, setIsMuted]             = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Handle play when trailer active
  useEffect(() => {
    if (trailerActive && videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [trailerActive]);

  const handleTrailerEnd = () => {
    setTrailerActive(false);
  };

  const toggleMute = () => setIsMuted(m => !m);

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
            onEnded={handleTrailerEnd}
          />
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
            <Link to={`/watch/f1`} className="mdetail-btn mdetail-btn-play" style={{ textDecoration: 'none' }}>
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
