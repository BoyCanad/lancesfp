import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Bookmark, Download, Library, VolumeX, Volume2, X, Trash2 } from 'lucide-react';
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
  const [isMuted, setIsMuted]             = useState(false);
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
    const checkTarget = movie?.downloadUrl || movie?.videoUrl;
    if (!checkTarget) return;
    caches.open('lsfplus-movies').then(cache => {
      cache.match(checkTarget).then(match => {
        if (match) setIsCached(true);
      });
    });
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
      const cache = await caches.open('lsfplus-movies');
      
      // Delete video
      if (movie.videoUrl) await cache.delete(movie.videoUrl);
      if (movie.downloadUrl) await cache.delete(movie.downloadUrl);
      
      // Delete subtitles
      if (movie.subtitles) {
        for (const sub of movie.subtitles) {
          await cache.delete(sub.url);
        }
      }
      
      // Delete sprites
      if (movie.spriteUrl) await cache.delete(movie.spriteUrl);

      setIsCached(false);
      alert('Movie removed from offline storage.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete movie.');
    }
  };

  const handleDownload = async () => {
    const targetUrl = movie?.downloadUrl || movie?.videoUrl;
    if (!targetUrl || isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const resp = await fetch(targetUrl, { signal: controller.signal });
      if (!resp.ok) throw new Error('Download failed');

      const contentLength = resp.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No reader found');

      let received = 0;
      const chunks = [];
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) {
          setDownloadProgress(Math.round((received / total) * 100));
        }
      }

      const blob = new Blob(chunks);
      const cache = await caches.open('lsfplus-movies');
      
      // Cache the video under its download URL
      await cache.put(targetUrl, new Response(blob, {
        headers: { 
          'Content-Type': targetUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4', 
          'Content-Length': blob.size.toString() 
        }
      }));
      
      // Also cache all subtitles
      if (movie.subtitles) {
        for (const sub of movie.subtitles) {
          try {
            const subResp = await fetch(sub.url);
            if (subResp.ok) await cache.put(sub.url, subResp);
          } catch (e) { console.error('Sub cache fail', e); }
        }
      }

      // Also cache the sprite/storyboard image
      if (movie.spriteUrl) {
        try {
          const spriteResp = await fetch(movie.spriteUrl);
          if (spriteResp.ok) await cache.put(movie.spriteUrl, spriteResp);
        } catch (e) { console.error('Sprite cache fail', e); }
      }
      
      setIsCached(true);
      alert(`"${movie.title}" and its data are now available offline!`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Download cancelled by user');
      } else {
        console.error(err);
        alert('Failed to save for offline viewing.');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      abortControllerRef.current = null;
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
