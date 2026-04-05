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
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Filter movies based on screen width
  const movies = allMovies.filter(m => !isMobile || !m.desktopOnly);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const goTo = useCallback((index: number, dir: 'left' | 'right' = 'right') => {
    if (index === current || isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    if (animTimeout.current) clearTimeout(animTimeout.current);
    animTimeout.current = setTimeout(() => {
      setCurrent(index);
      setContentKey(k => k + 1);
      setIsAnimating(false);
      setDirection(null);
    }, 420); // matches CSS transition duration
  }, [current, isAnimating]);

  // Auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (current + 1) % movies.length;
      goTo(next, 'right');
    }, 6000);
    return () => clearInterval(timer);
  }, [movies.length, current, goTo]);

  const goPrev = () => goTo((current - 1 + movies.length) % movies.length, 'left');
  const goNext = () => goTo((current + 1) % movies.length, 'right');

  const peekLeft  = movies[(current - 1 + movies.length) % movies.length];
  const peekRight = movies[(current + 1) % movies.length];
  const featured  = movies[current];

  // Helper to determine the correct background image source based on screen size
  const getBannerSource = (movie: Movie) => {
    return isMobile && movie.mobileBanner ? movie.mobileBanner : movie.banner;
  };

  const handleMoreInfo = () => {
    if (featured.id === 'f1' || featured.title === 'Ang Huling El Bimbo') {
      navigate('/el-bimbo');
    }
  };

  // Determine slide class based on animation state
  const cardSlideClass = isAnimating
    ? direction === 'right'
      ? 'hero__card--slide-out-left'
      : 'hero__card--slide-out-right'
    : '';

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

        {/* Main card — slide wrapper */}
        <div className="hero__card-viewport">
          <div
            className={`hero__card${featured.id === 'f1' ? ' hero__card--el-bimbo' : ''} ${cardSlideClass}`}
            style={{ backgroundImage: `url(${getBannerSource(featured)})` }}
          >
            <div className="hero__gradient" />

            {/* Info — fades in fresh on each slide */}
            <div key={contentKey} className="hero__content hero__content--fade">
              {featured.logo ? (
                <img src={featured.logo} alt={featured.title} className="hero__logo" />
              ) : (
                <h1 className="hero__title">{featured.title}</h1>
              )}

              <div className="hero__meta">
                <span className="hero__rating">★ {featured.rating}</span>
                <span className="hero__year">{featured.year}</span>
                <span className="hero__badge">{featured.ageRating}</span>
              </div>

              <p className="hero__desc">{featured.description}</p>

              <div className="hero__actions">
                <button className="hero__btn hero__btn--play">
                  <Play size={15} fill="white" /> Play
                </button>
                <button className="hero__btn hero__btn--secondary" onClick={handleMoreInfo}>
                  <Info size={15} /> More Info
                </button>
                <button className="hero__btn hero__btn--secondary">
                  <Bookmark size={15} /> Save
                </button>
              </div>
            </div>
          </div>
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

      {/* Dots (Pagination) */}
      <div className="hero__dots">
        {movies.map((_, i) => (
          <button
            key={i}
            className={`hero__dot${i === current ? ' hero__dot--on' : ''}`}
            onClick={() => goTo(i, i > current ? 'right' : 'left')}
          />
        ))}
      </div>
    </section>
  );
}
