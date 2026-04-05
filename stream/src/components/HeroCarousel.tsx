import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Bookmark } from 'lucide-react';
import type { Movie } from '../data/movies';
import './HeroCarousel.css';

interface HeroCarouselProps {
  movies: Movie[];
}

export default function HeroCarousel({ movies: allMovies }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const navigate = useNavigate();

  // Filter movies based on screen width
  const movies = allMovies.filter(m => !isMobile || !m.desktopOnly);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetAutoTimer = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setCurrent(c => (c + 1) % movies.length);
    }, 6000);
  }, [movies.length]);

  useEffect(() => {
    resetAutoTimer();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [resetAutoTimer]);

  const goTo = useCallback((index: number) => {
    if (index === current || isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    resetAutoTimer();
    setTimeout(() => setIsTransitioning(false), 580);
  }, [current, isTransitioning, resetAutoTimer]);

  const goPrev = () => goTo((current - 1 + movies.length) % movies.length);
  const goNext = () => goTo((current + 1) % movies.length);

  const getBannerSource = (movie: Movie) =>
    isMobile && movie.mobileBanner ? movie.mobileBanner : movie.banner;

  const handleMoreInfo = (movie: Movie) => {
    if (movie.id === 'f1' || movie.title === 'Ang Huling El Bimbo') {
      navigate('/el-bimbo');
    }
  };

  // ── Touch / swipe handling (mobile only) ─────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe dominates (avoids fighting vertical scroll)
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const peekLeft  = movies[(current - 1 + movies.length) % movies.length];
  const peekRight = movies[(current + 1) % movies.length];

  return (
    <section className="hero">
      <div className="hero__stage">

        {/* Left peek — desktop only */}
        <div
          className="hero__peek hero__peek--left"
          onClick={goPrev}
          style={{ backgroundImage: `url(${getBannerSource(peekLeft)})` }}
        >
          <div className="hero__peek-veil" />
        </div>

        {/* Viewport */}
        <div
          className="hero__card-viewport"
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {/*
            Desktop: .hero__track slides horizontally via translateX.
            Mobile:  translateX is removed; CSS stacks cards and crossfades them.
          */}
          <div
            className="hero__track"
            style={isMobile ? undefined : { transform: `translateX(-${current * 100}%)` }}
          >
            {movies.map((movie, i) => (
              <div
                key={movie.id}
                className={[
                  'hero__card',
                  movie.id === 'f1' ? 'hero__card--el-bimbo' : '',
                  isMobile && i === current ? 'hero__card--active' : '',
                ].filter(Boolean).join(' ')}
                style={{ backgroundImage: `url(${getBannerSource(movie)})` }}
              >
                <div className="hero__gradient" />

                <div className={`hero__content${i === current ? ' hero__content--active' : ''}`}>
                  {movie.logo ? (
                    <img src={movie.logo} alt={movie.title} className="hero__logo" />
                  ) : (
                    <h1 className="hero__title">{movie.title}</h1>
                  )}

                  <div className="hero__meta">
                    <span className="hero__rating">★ {movie.rating}</span>
                    <span className="hero__year">{movie.year}</span>
                    <span className="hero__badge">{movie.ageRating}</span>
                  </div>

                  <p className="hero__desc">{movie.description}</p>

                  <div className="hero__actions">
                    <button className="hero__btn hero__btn--play">
                      <Play size={15} fill="white" /> Play
                    </button>
                    <button className="hero__btn hero__btn--secondary" onClick={() => handleMoreInfo(movie)}>
                      <Info size={15} /> More Info
                    </button>
                    <button className="hero__btn hero__btn--secondary">
                      <Bookmark size={15} /> Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right peek — desktop only */}
        <div
          className="hero__peek hero__peek--right"
          onClick={goNext}
          style={{ backgroundImage: `url(${getBannerSource(peekRight)})` }}
        >
          <div className="hero__peek-veil" />
        </div>

      </div>

      {/* Dots */}
      <div className="hero__dots">
        {movies.map((_, i) => (
          <button
            key={i === current ? `dot-active-${current}` : i}
            className={`hero__dot${i === current ? ' hero__dot--on' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
}
