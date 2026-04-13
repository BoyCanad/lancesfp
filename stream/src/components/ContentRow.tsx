import { useRef, useState, memo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Check, X, ThumbsUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import type { Movie } from '../data/movies';
import './ContentRow.css';

interface ContentRowProps {
  title: ReactNode;
  movies: Movie[];
  showProgress?: boolean;
  variant?: 'default' | 'wide';
}

const parseDurationToMin = (dur: string) => {
  if (!dur) return 120;
  let total = 0;
  const hMatch = dur.match(/(\d+)h/);
  const mMatch = dur.match(/(\d+)m/);
  if (hMatch) total += parseInt(hMatch[1]) * 60;
  if (mMatch) total += parseInt(mMatch[1]);
  return total || parseInt(dur) || 120;
};

const MovieCard = memo(({ 
  movie, 
  showProgress, 
  onClick 
}: { 
  movie: Movie; 
  showProgress?: boolean; 
  onClick: (movie: Movie, startTime?: number) => void;
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [hasFinishedOnce, setHasFinishedOnce] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to audio on as requested
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoElemRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth <= 768) return;
    setIsHovered(true);
    
    // Start 2s timer for trailer if available and not finished once yet
    if (movie.trailerUrl && !hasFinishedOnce) {
      hoverTimerRef.current = setTimeout(() => {
        setIsPlayingTrailer(true); // Triggers CSS Fade
        // Play the video slightly after the fade starts for a more deliberate feel
        setTimeout(() => {
          if (videoElemRef.current) {
            videoElemRef.current.play().catch(e => console.log("Autoplay blocked/failed", e));
          }
        }, 400); 
      }, 2000);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const edgeThreshold = 120;
    let origin = 'center calc(50% + 5px)';

    if (rect.left < edgeThreshold) {
      origin = 'left calc(50% + 5px)';
    } else if (window.innerWidth - rect.right < edgeThreshold) {
      origin = 'right calc(50% + 5px)';
    }
    
    e.currentTarget.style.setProperty('--origin', origin);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPlayingTrailer(false);
    if (videoElemRef.current) {
      videoElemRef.current.pause();
      videoElemRef.current.currentTime = 0;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${movie.id}`, { state: { startTime: videoElemRef.current?.currentTime } });
  };

  return (
    <div
      className={`card ${movie.desktopOnly ? 'card--desktop-only' : ''}`}
      onClick={() => onClick(movie, videoElemRef.current?.currentTime)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <div className="card__thumb">
        <picture>
          {movie.mobileThumbnail && (
            <source media="(max-width: 768px)" srcSet={movie.mobileThumbnail} />
          )}
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="card__img"
            loading="lazy"
            decoding="async"
          />
        </picture>
        
        {/* Thumbnail logic continue... */}
      </div>

      {/* Progress bar below thumb */}
      {showProgress && movie.progress !== undefined && (
        <div className="card__progress-container">
          <div className="card__progress-bar-bg">
            <div
              className="card__progress-fill"
              style={{ width: `${movie.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded State Layer */}
      {isHovered && (
        <div className="card__expanded-card">
          <div className={`card__expanded-video ${isPlayingTrailer ? 'card__expanded-video--playing' : ''}`}>
            {/* Banner (Static) */}
            <picture className="card__expanded-banner-pic">
              {(movie.mobileCardBanner || movie.mobileBanner) && (
                <source 
                  media="(max-width: 768px)" 
                  srcSet={movie.mobileCardBanner || movie.mobileBanner} 
                />
              )}
              <img 
                src={movie.cardBanner || movie.banner || movie.thumbnail} 
                alt="" 
                className="card__expanded-banner" 
                loading="lazy"
              />
            </picture>

            {/* Trailer (Video) - Preloaded during hover delay */}
            {movie.trailerUrl && (
              <div className="card__video-wrapper">
                <video
                  ref={videoElemRef}
                  src={movie.trailerUrl}
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  className="card__expanded-trailer"
                  onEnded={() => {
                    setIsPlayingTrailer(false);
                    setHasFinishedOnce(true);
                  }}
                />
                
                <button 
                  className="card__vol-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                >
                  {isMuted ? (
                    <VolumeX size={18} color="white" />
                  ) : (
                    <Volume2 size={18} color="white" />
                  )}
                </button>
                {movie.logo && (
                  <img src={movie.logo} alt="" className="card__video-logo" />
                )}
              </div>
            )}
          </div>
          
          <div className={`card__expanded-details ${showProgress ? 'card__expanded-details--continue' : ''}`}>
            <div className="card__controls">
              <div className="card__controls-left">
                {showProgress ? (
                  <>
                    <button className="card__btn card__btn--play-large" onClick={handlePlayClick}>
                      <Play size={20} fill="black" color="black" />
                    </button>
                    <button className="card__btn card__btn--circle" onClick={(e) => e.stopPropagation()}>
                      <Check size={18} color="white" />
                    </button>
                    <button className="card__btn card__btn--circle" onClick={(e) => e.stopPropagation()}>
                      <X size={18} color="white" />
                    </button>
                    <button className="card__btn card__btn--circle" onClick={(e) => e.stopPropagation()}>
                      <ThumbsUp size={16} color="white" />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="card__btn card__btn--play card__btn--white" onClick={handlePlayClick}>
                      <Play size={12} fill="black" color="black" />
                    </button>
                    <button className="card__btn card__btn--icon" onClick={(e) => e.stopPropagation()}>
                      <Plus size={14} color="white" />
                    </button>
                    <button className="card__btn card__btn--icon" onClick={(e) => e.stopPropagation()}>
                      <ThumbsUp size={12} color="white" />
                    </button>
                  </>
                )}
              </div>
              <div className="card__controls-right">
                <button className="card__btn card__btn--circle-small" onClick={(e) => { e.stopPropagation(); onClick(movie, videoElemRef.current?.currentTime); }}>
                  <ChevronDown size={showProgress ? 20 : 16} color="white" />
                </button>
              </div>
            </div>

            {showProgress && movie.progress !== undefined ? (
              <div className="card__expanded-progress-row">
                <div className="card__expanded-progress-bg">
                  <div className="card__expanded-progress-fill" style={{ width: `${movie.progress}%` }} />
                </div>
                <span className="card__expanded-time">
                  {Math.round((movie.progress / 100) * parseDurationToMin(movie.duration))}m of {parseDurationToMin(movie.duration)}m
                </span>
              </div>
            ) : (
              <>
                <div className="card__metadata-row">
                  <span className="card__match">98% Match</span>
                  <span className="card__age">{movie.ageRating || '13+'}</span>
                  <span className="card__duration">
                    {movie.duration.includes('s') ? `${parseDurationToMin(movie.duration)}m` : movie.duration}
                  </span>
                  <span className="card__quality-badge">{movie.quality || 'HD'}</span>
                </div>
                
                <div className="card__genres-row">
                  {movie.genre.slice(0, 3).map((g, i, arr) => (
                    <span key={g}>
                      {g} {i < arr.length - 1 && <span className="card__genre-dot">•</span>}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card info below thumbnail */}
      <div className="card__info">
        <p className="card__title">{movie.title}</p>
        <div className="card__meta">
          <span className="card__year">{movie.year}</span>
          <span className="card__dot">·</span>
          <span className="card__genre">{movie.genre[0]}</span>
        </div>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';

export default function ContentRow({
  title,
  movies,
  showProgress = false,
  variant = 'default',
}: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollBtns = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(updateScrollBtns, 400);
  };

  const handleMovieClick = useCallback((movie: Movie, startTime?: number) => {
    const navOptions = { state: { startTime } };
    
    if (movie.id === 'f1' || movie.id === 'eb1' || movie.title === 'Ang Huling El Bimbo Play') {
      navigate('/ang-huling-el-bimbo-play', navOptions);
    } else if (movie.id === 'f2' || movie.title === 'Minsan') {
      navigate('/minsan', navOptions);
    } else if (movie.id === 'f4' || movie.title === 'Tindahan ni Aling Nena') {
      navigate('/tindahan', navOptions);
    } else if (movie.id === 'f5' || movie.title === 'Alapaap/Overdrive') {
      navigate('/alapaap', navOptions);
    } else if (movie.id === 'f6' || movie.title === 'Spoliarium/Graduation') {
      navigate('/spoliarium', navOptions);
    } else if (movie.id === 'f7' || movie.title === 'Pare Ko') {
      navigate('/pare-ko', navOptions);
    } else if (movie.id === 'f8' || movie.title === 'Tama Ka/Ligaya') {
      navigate('/tama-ka', navOptions);
    } else if (movie.id === 'f9' || movie.title === 'Ang Huling El Bimbo') {
      navigate('/el-bimbo', navOptions);
    }

  }, [navigate]);

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        <div className="row__header-right">
          <div className="row__pagination">
            <div className="row__pagination-dot active"></div>
            <div className="row__pagination-dot"></div>
            <div className="row__pagination-dot"></div>
            <div className="row__pagination-dot"></div>
          </div>
          <button className="row__see-all">See All →</button>
        </div>
      </div>

      <div className="row__wrapper">
        {/* Left arrow */}
        {canScrollLeft && (
          <button className="row__arrow row__arrow--left" onClick={() => scroll('left')}>
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          ref={rowRef}
          className={`row__track row__track--${variant}`}
          onScroll={updateScrollBtns}
        >
          {movies.map(movie => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              showProgress={showProgress} 
              onClick={handleMovieClick}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button className="row__arrow row__arrow--right" onClick={() => scroll('right')}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </section>
  );
}
