import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Info } from 'lucide-react';
import type { Movie } from '../data/movies';
import './ContentRow.css';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  showProgress?: boolean;
  variant?: 'default' | 'wide';
}

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
            <div
              key={movie.id}
              className={`card ${movie.desktopOnly ? 'card--desktop-only' : ''}`}
              onClick={() => {
                if (movie.id === 'f1' || movie.id === 'eb1' || movie.title === 'Ang Huling El Bimbo') {
                  navigate('/el-bimbo');
                }
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const edgeThreshold = 100;
                if (rect.left < edgeThreshold) {
                  e.currentTarget.style.setProperty('--origin', 'left calc(50% + 5px)');
                } else if (window.innerWidth - rect.right < edgeThreshold) {
                  e.currentTarget.style.setProperty('--origin', 'right calc(50% + 5px)');
                } else {
                  e.currentTarget.style.setProperty('--origin', 'center calc(50% + 5px)');
                }
              }}
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

                {/* Expanded State Layer (lives inside scaling thumb) */}
                <div className="card__expanded-layer">
                  <img src={movie.banner} alt="" className="card__expanded-banner" />
                  <div className="card__expanded-gradient" />
                  <div className="card__expanded-content">
                    <div className="card__tooltip-quality">{movie.quality || 'HD'}</div>
                    <div className="card__tooltip-controls">
                      <button><Plus size={16} strokeWidth={2.5} color="white" /></button>
                      <button><Info size={16} strokeWidth={2.5} color="white" /></button>
                    </div>
                    <button className="card__tooltip-play-center">
                      <Play size={24} fill="white" color="white" />
                    </button>
                    <div className="card__tooltip-genres-bottom">
                      {movie.genre.join(' · ')}
                    </div>
                  </div>
                </div>
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
