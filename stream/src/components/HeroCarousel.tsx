import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Bookmark } from 'lucide-react';
import type { Movie } from '../data/movies';
import './HeroCarousel.css';

interface HeroCarouselProps {
  movies: Movie[];
}

export default function HeroCarousel({ movies: allMovies }: HeroCarouselProps) {
  const [current, setCurrent]           = useState(0);
  const [prev, setPrev]                 = useState<number | null>(null);
  const [direction, setDirection]       = useState<'left' | 'right'>('right');
  const [isMobile, setIsMobile]         = useState(false);
  const [isAnimating, setIsAnimating]   = useState(false);
  const autoTimer  = useRef<ReturnType<typeof setInterval>  | null>(null);
  const exitTimer  = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const navigate = useNavigate();

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
      // Auto-advance fires goTo internally via direction 'right'
      setCurrent(c => {
        setPrev(c);
        setDirection('right');
        setIsAnimating(true);
        if (exitTimer.current) clearTimeout(exitTimer.current);
        exitTimer.current = setTimeout(() => {
          setPrev(null);
          setIsAnimating(false);
        }, 750);
        return (c + 1) % movies.length;
      });
    }, 6000);
  }, [movies.length]);

  useEffect(() => {
    resetAutoTimer();
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [resetAutoTimer]);

  const goTo = useCallback((index: number, dir: 'left' | 'right' = 'right') => {
    if (index === current || isAnimating) return;
    setDirection(dir);
    setPrev(current);
    setCurrent(index);
    setIsAnimating(true);
    resetAutoTimer();

    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      setPrev(null);
      setIsAnimating(false);
    }, 750); // matches CSS animation duration
  }, [current, isAnimating, resetAutoTimer]);

  const goPrev = () => goTo((current - 1 + movies.length) % movies.length, 'left');
  const goNext = () => goTo((current + 1) % movies.length, 'right');

  const getBannerSource = (movie: Movie) =>
    isMobile && movie.mobileBanner ? movie.mobileBanner : movie.banner;

  const handleMoreInfo = (movie: Movie) => {
    if (movie.id === 'f1' || movie.title === 'Ang Huling El Bimbo') navigate('/el-bimbo');
  };

  // Touch swipe (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const peekLeft  = movies[(current - 1 + movies.length) % movies.length];
  const peekRight = movies[(current + 1) % movies.length];

  // ── Desktop card builder ────────────────────────────────────
  const renderDesktopCard = (movie: Movie, idx: number, role: 'enter' | 'exit') => (
    <div
      key={`${role}-${idx}`}
      className={[
        'hero__card',
        movie.id === 'f1' ? 'hero__card--el-bimbo' : '',
        role === 'enter' ? `hero__card--enter-${direction}` : `hero__card--exit-${direction}`,
      ].filter(Boolean).join(' ')}
      style={{ backgroundImage: `url(${getBannerSource(movie)})` }}
    >
      <div className="hero__gradient" />
      {/* Staggered content only on entering card */}
      {role === 'enter' && (
        <div className="hero__content hero__content--stagger">
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
            <button className="hero__btn hero__btn--play"><Play size={15} fill="white" /> Play</button>
            <button className="hero__btn hero__btn--secondary" onClick={() => handleMoreInfo(movie)}><Info size={15} /> More Info</button>
            <button className="hero__btn hero__btn--secondary"><Bookmark size={15} /> Save</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="hero">
      <div className="hero__stage">

        {/* Left peek */}
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
          {isMobile ? (
            /* ── Mobile: stacked crossfade+zoom ── */
            <div className="hero__track">
              {movies.map((movie, i) => (
                <div
                  key={movie.id}
                  className={[
                    'hero__card',
                    movie.id === 'f1' ? 'hero__card--el-bimbo' : '',
                    i === current ? 'hero__card--active' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ backgroundImage: `url(${getBannerSource(movie)})` }}
                >
                  <div className="hero__gradient" />
                  <div className={`hero__content${i === current ? ' hero__content--active' : ''}`}>
                    {movie.logo
                      ? <img src={movie.logo} alt={movie.title} className="hero__logo" />
                      : <h1 className="hero__title">{movie.title}</h1>}
                    <div className="hero__meta">
                      <span className="hero__rating">★ {movie.rating}</span>
                      <span className="hero__year">{movie.year}</span>
                      <span className="hero__badge">{movie.ageRating}</span>
                    </div>
                    <p className="hero__desc">{movie.description}</p>
                    <div className="hero__actions">
                      <button className="hero__btn hero__btn--play"><Play size={15} fill="white" /> Play</button>
                      <button className="hero__btn hero__btn--secondary" onClick={() => handleMoreInfo(movie)}><Info size={15} /> More Info</button>
                      <button className="hero__btn hero__btn--secondary"><Bookmark size={15} /> Save</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop: cinematic directional dissolve ── */
            <div className="hero__cinema">
              {/* Exiting slide — underneath */}
              {prev !== null && renderDesktopCard(movies[prev], prev, 'exit')}
              {/* Entering slide — on top, key resets animation every slide change */}
              <div key={`enter-${current}`} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                {renderDesktopCard(movies[current], current, 'enter')}
              </div>
            </div>
          )}
        </div>

        {/* Right peek */}
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
            onClick={() => goTo(i, i > current ? 'right' : 'left')}
          />
        ))}
      </div>
    </section>
  );
}
