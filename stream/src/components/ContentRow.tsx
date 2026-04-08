import { useRef, useState, memo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Info } from 'lucide-react';
import type { Movie } from '../data/movies';
import './ContentRow.css';

interface ContentRowProps {
  title: ReactNode;
  movies: Movie[];
  showProgress?: boolean;
  variant?: 'default' | 'wide';
}

const MovieCard = memo(({ 
  movie, 
  showProgress, 
  onClick 
}: { 
  movie: Movie; 
  showProgress?: boolean; 
  onClick: (movie: Movie) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
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
  };

  return (
    <div
      className={`card ${movie.desktopOnly ? 'card--desktop-only' : ''}`}
      onClick={() => onClick(movie)}
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
        
        {/* Normal State Info */}
        <div className="card__rating-badge card__default-item">
          {movie.rating}
        </div>
        
        {showProgress && movie.progress !== undefined && (
          <div className="card__progress-bar card__default-item">
            <div
              className="card__progress-fill"
              style={{ width: `${movie.progress}%` }}
            />
          </div>
        )}

        {/* Expanded State Layer - Only rendered when hovered to save resources */}
        {isHovered && (
          <div className="card__expanded-layer">
            <img 
              src={movie.cardBanner || movie.banner} 
              alt="" 
              className="card__expanded-banner" 
              loading="lazy"
            />
            <div className="card__expanded-gradient" />
            <div className="card__expanded-content">
              <div className="card__tooltip-quality">{movie.quality || 'HD'}</div>
              <div className="card__tooltip-controls">
                <button><Plus size={16} strokeWidth={2.5} color="white" /></button>
                <button><Info size={16} strokeWidth={2.5} color="white" /></button>
              </div>
              <div className="card__tooltip-play-center">
                <Play size={24} fill="white" color="white" />
              </div>
              <div className="card__tooltip-genres-bottom">
                {movie.genre.join(' · ')}
              </div>
            </div>
          </div>
        )}
      </div>

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

  const handleMovieClick = useCallback((movie: Movie) => {
    if (movie.id === 'f1' || movie.id === 'eb1' || movie.title.includes('Ang Huling El Bimbo')) {
      navigate('/ang-huling-el-bimbo-play');
    } else if (movie.id === 'f2' || movie.title === 'Minsan') {
      navigate('/minsan');
    } else if (movie.id === 'f4' || movie.title === 'Tindahan ni Aling Nena') {
      navigate('/tindahan');
    } else if (movie.id === 'f5' || movie.title === 'Alapaap/Overdrive') {
      navigate('/alapaap');
    } else if (movie.id === 'f6' || movie.title === 'Spoliarium/Graduation') {
      navigate('/spoliarium');
    } else if (movie.id === 'f7' || movie.title === 'Pare Ko') {
      navigate('/pare-ko');
    }

  }, [navigate]);

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        <button className="row__see-all">See All →</button>
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
