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

  // Start auto-advance
  useEffect(() => {
    resetAutoTimer();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [resetAutoTimer]);

  const goTo = useCallback((index: number) => {
    if (index === current || isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    resetAutoTimer();
    // Unlock after transition completes (matches CSS transition duration)
    setTimeout(() => setIsTransitioning(false), 520);
  }, [current, isTransitioning, resetAutoTimer]);

  const goPrev = () => goTo((current - 1 + movies.length) % movies.length);
  const goNext = () => goTo((current + 1) % movies.length);

  const peekLeft  = movies[(current - 1 + movies.length) % movies.length];
  const peekRight = movies[(current + 1) % movies.length];

  // Helper to determine the correct background image source based on screen size
  const getBannerSource = (movie: Movie) => {
    return isMobile && movie.mobileBanner ? movie.mobileBanner : movie.banner;
  };

  const handleMoreInfo = (movie: Movie) => {
    if (movie.id === 'f1' || movie.title === 'Ang Huling El Bimbo') {
      navigate('/el-bimbo');
    }
  };

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

        {/* Sliding track viewport */}
        <div className="hero__card-viewport">
          {/* Track: all slides rendered side-by-side, translateX drives the switch */}
          <div
            className="hero__track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {movies.map((movie, i) => (
              <div
                key={movie.id}
                className={`hero__card${movie.id === 'f1' ? ' hero__card--el-bimbo' : ''}`}
                style={{ backgroundImage: `url(${getBannerSource(movie)})` }}
              >
                <div className="hero__gradient" />

                {/* Content fades in when this slide becomes active */}
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
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
}
