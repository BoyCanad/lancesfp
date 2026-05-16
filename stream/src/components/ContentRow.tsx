import { useRef, useState, memo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Check, X, ThumbsUp, ChevronDown, Volume2, VolumeX, Bell } from 'lucide-react';
import type { Movie } from '../data/movies';
import { supabase } from '../supabaseClient';
import { addToMyList, removeFromMyList, isInMyList } from '../services/listService';
import { HDBadge, SpatialAudioBadge } from './AudioBadges';
import './ContentRow.css';

interface ContentRowProps {
  title: ReactNode;
  movies: Movie[];
  showProgress?: boolean;
  variant?: 'default' | 'wide';
  onSeeAll?: () => void;
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

export const MovieCard = memo(({ 
  movie, 
  showProgress, 
  onClick,
  onDetailClick
}: { 
  movie: Movie; 
  showProgress?: boolean; 
  onClick: (movie: Movie, startTime?: number) => void;
  onDetailClick?: (movie: Movie) => void;
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [hasFinishedOnce, setHasFinishedOnce] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to audio on as requested
  const [inMyList, setInMyList] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoElemRef = useRef<HTMLVideoElement>(null);
  const ytIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      if (isMuted) {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
      } else {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      }
    }
  }, [isMuted]);

  useEffect(() => {
    setInMyList(isInMyList(movie.id));
    
    const handleUpdate = () => {
      setInMyList(isInMyList(movie.id));
    };
    window.addEventListener('mylist_updated', handleUpdate);
    return () => window.removeEventListener('mylist_updated', handleUpdate);
  }, [movie.id]);

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
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
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
    const base = movie.xRay ? '/xray' : '/watch';
    navigate(`${base}/${movie.id}`, { state: { startTime: videoElemRef.current?.currentTime } });
  };

  const [isLiked, setIsLiked] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial check (could be optimized by parent passing it down)
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      const profile = JSON.parse(stored);
      supabase.from('liked_movies')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('movie_id', movie.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST204' || error.code === '42P01') return;
          }
          setIsLiked(!!data);
        });
    }
  }, [movie.id]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem('activeProfile');
    if (!stored) return;
    const profile = JSON.parse(stored);
    
    // Optimistic update
    const newLiked = !isLiked;
    setIsLiked(newLiked);

    try {
      const { toggleLike } = await import('../services/profileService');
      await toggleLike(profile.id, movie.id);
    } catch (err) {
      console.error('Failed to toggle like', err);
      setIsLiked(!newLiked); // Rollback
    }
  };

  const handleListToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inMyList) {
      removeFromMyList(movie.id);
    } else {
      addToMyList(movie.id);
    }
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
        
        {/* TMDB Title Logo Overlay (Desktop Only) */}
        {movie.id.startsWith('tmdb-') && movie.logo && (
          <div className="card__logo-overlay desktop-only-logo">
            <img 
              src={movie.logo} 
              alt={`${movie.title} logo`} 
              className="card__thumb-logo" 
            />
          </div>
        )}
        
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
              {movie.mobileThumbnail && (
                <source 
                  media="(max-width: 768px)" 
                  srcSet={movie.mobileThumbnail} 
                />
              )}
              <img 
                src={movie.thumbnail} 
                alt="" 
                className="card__expanded-banner" 
                loading="lazy"
              />
            </picture>

            {/* Trailer (Video) - Preloaded during hover delay */}
            {movie.trailerUrl && (
              <div className="card__video-wrapper">
                {movie.trailerUrl.includes('youtube.com') || movie.trailerUrl.includes('youtu.be') ? (
                  <iframe
                    ref={ytIframeRef}
                    className={`card__expanded-trailer ${isPlayingTrailer ? 'card__expanded-trailer--playing' : ''}`}
                    src={isPlayingTrailer ? `${movie.trailerUrl}${movie.trailerUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1` : ''}
                    allow="autoplay; encrypted-media"
                    frameBorder="0"
                    style={{ pointerEvents: 'none', border: 'none', transform: 'scale(1.35)' }}
                  />
                ) : (
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
                )}
                
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
                    <button 
                      className={`card__btn card__btn--play-large ${movie.comingSoon ? 'card__btn--disabled' : ''}`} 
                      onClick={(e) => !movie.comingSoon && handlePlayClick(e)}
                      disabled={movie.comingSoon}
                    >
                      {movie.comingSoon ? <Bell size={20} fill="black" color="black" /> : <Play size={20} fill="black" color="black" />}
                    </button>
                    <button className="card__btn card__btn--circle" onClick={(e) => e.stopPropagation()}>
                      <Check size={18} color="white" />
                    </button>
                    <button className="card__btn card__btn--circle" onClick={(e) => e.stopPropagation()}>
                      <X size={18} color="white" />
                    </button>
                    <button className="card__btn card__btn--circle" onClick={handleLikeToggle}>
                      <ThumbsUp size={16} color={isLiked ? "#46d369" : "white"} fill={isLiked ? "#46d369" : "transparent"} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`card__btn card__btn--play card__btn--white ${movie.comingSoon ? 'card__btn--disabled' : ''}`} 
                      onClick={(e) => !movie.comingSoon && handlePlayClick(e)}
                      disabled={movie.comingSoon}
                    >
                      {movie.comingSoon ? <Bell size={14} color="white" fill="white" /> : <Play size={12} fill="black" color="black" />}
                    </button>
                    <button 
                      className={`card__btn card__btn--icon ${inMyList ? 'active' : ''}`} 
                      onClick={handleListToggle}
                      title={inMyList ? "Remove from My List" : "Add to My List"}
                    >
                      {inMyList ? <Check size={14} color="white" /> : <Plus size={14} color="white" />}
                    </button>
                    <button className="card__btn card__btn--icon" onClick={handleLikeToggle}>
                      <ThumbsUp size={12} color={isLiked ? "#46d369" : "white"} fill={isLiked ? "#46d369" : "transparent"} />
                    </button>
                  </>
                )}
              </div>
              <div className="card__controls-right">
                <button 
                  className="card__btn card__btn--circle-small" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onDetailClick) {
                      onDetailClick(movie);
                    } else {
                      onClick(movie);
                    }
                  }}
                >
                  <ChevronDown size={showProgress ? 20 : 16} color="white" />
                </button>
              </div>
            </div>

            {showProgress && movie.progress !== undefined ? (
              <div style={{ marginTop: '12px' }}>
                {movie.currentEpisode && (
                  <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    S{movie.currentEpisode.season}:E{movie.currentEpisode.episode} "{movie.currentEpisode.title}"
                  </div>
                )}
                <div className="card__expanded-progress-row" style={{ marginTop: '0' }}>
                <div className="card__expanded-progress-bg">
                  <div className="card__expanded-progress-fill" style={{ width: `${movie.progress}%` }} />
                </div>
                <span className="card__expanded-time">
                  {movie.duration_ms 
                    ? `${Math.round((movie.progress / 100) * (movie.duration_ms / 60000))}m of ${Math.round(movie.duration_ms / 60000)}m`
                    : `${Math.round((movie.progress / 100) * parseDurationToMin(movie.duration))}m of ${parseDurationToMin(movie.duration)}m`
                  }
                </span>
              </div>
              </div>
            ) : (
              <>
                <div className="card__metadata-row">
                  {movie.comingSoon && (
                    <span className="card__coming-soon">COMING SOON</span>
                  )}
                  <span className="card__age">{movie.ageRating || '13+'}</span>
                  <span className="card__duration">
                    {movie.comingSoon ? 'TBA' : (movie.duration.includes('s') ? `${parseDurationToMin(movie.duration)}m` : movie.duration)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HDBadge isSmall={true} />
                    {(movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
                      <SpatialAudioBadge isSmall={true} />
                    )}
                  </div>
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

    </div>
  );
});

MovieCard.displayName = 'MovieCard';

export default function ContentRow({
  title,
  movies,
  showProgress = false,
  variant = 'default',
  onSeeAll,
}: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const updateScrollBtns = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    
    // Calculate pages based on clientWidth vs scrollWidth
    // We add a tiny buffer to avoid rounding issues
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    const current = Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
    
    setTotalPages(total);
    setCurrentPage(current);
  }, []);

  useEffect(() => {
    updateScrollBtns();
    window.addEventListener('resize', updateScrollBtns);
    return () => window.removeEventListener('resize', updateScrollBtns);
  }, [movies, updateScrollBtns]);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.9; // Scroll nearly a full page
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    // updateScrollBtns will be triggered by onScroll event
  };

  const getDetailPath = (movie: Movie) => {
    // Use movie.id (The slug) to navigate to details
    if (movie.id === 'ang-huling-el-bimbo-play') return '/ang-huling-el-bimbo-play';
    if (movie.id === 'ang-huling-el-bimbo-play-xray') return '/ang-huling-el-bimbo-play-xray';
    if (movie.id === 'minsan') return '/minsan';
    if (movie.id === 'tindahan-ni-aling-nena') return '/tindahan-ni-aling-nena';
    if (movie.id === 'alapaap-overdrive') return '/alapaap-overdrive';
    if (movie.id === 'spoliarium-graduation') return '/spoliarium-graduation';
    if (movie.id === 'pare-ko') return '/pare-ko';
    if (movie.id === 'tama-ka-ligaya') return '/tama-ka-ligaya';
    if (movie.id === 'ang-huling-el-bimbo') return '/ang-huling-el-bimbo';
    if (movie.id === 'beyond-the-last-dance') return '/beyond-the-last-dance';
    if (movie.id === 'bukang-liwayway-takipsilim') return '/bukang-liwayway-takipsilim';
    if (movie.id === 'a-day-in-my-life-stem') return '/a-day-in-my-life-stem';
    if (movie.id === 't1') return '/11-stem-a';
    return `/${movie.id}`; // Fallback to slug-based routing
  };

  const handleMovieClick = useCallback((movie: Movie, startTime?: number) => {
    const navOptions = { state: { startTime } };
    
    // If we are in "Continue Watching" mode, go directly to the player
    if (showProgress) {
      navigate(`${movie.xRay ? '/xray' : '/watch'}/${movie.id}`, navOptions);
      return;
    }

    navigate(getDetailPath(movie), navOptions);
  }, [navigate, showProgress]);

  const handleDetailClick = useCallback((movie: Movie) => {
    navigate(getDetailPath(movie));
  }, [navigate]);

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        <div className="row__header-right">
          {totalPages > 1 && (
            <div className="row__pagination">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div 
                  key={i} 
                  className={`row__pagination-dot ${i === currentPage ? 'active' : ''}`}
                ></div>
              ))}
            </div>
          )}
          {onSeeAll && (
            <button className="row__see-all" onClick={onSeeAll}>See All →</button>
          )}
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
          {movies.map((movie, index) => (
            <MovieCard 
              key={movie.id + index} 
              movie={movie} 
              showProgress={showProgress}
              onClick={handleMovieClick}
              onDetailClick={handleDetailClick}
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
