import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Plus, Check, Bell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Movie } from '../data/movies';
import { addToMyList, removeFromMyList, isInMyList } from '../services/listService';
import { HDBadge, SpatialAudioBadge } from './AudioBadges';
import { useLanguage } from '../i18n/LanguageContext';
import './HeroCarousel.css';

function HeroListButton({ movie }: { movie: Movie }) {
  const { t } = useLanguage();
  const [inList, setInList] = useState(() => isInMyList(movie.id));

  useEffect(() => {
    setInList(isInMyList(movie.id));
    const handleUpdate = () => setInList(isInMyList(movie.id));
    window.addEventListener('mylist_updated', handleUpdate);
    return () => window.removeEventListener('mylist_updated', handleUpdate);
  }, [movie.id]);

  const toggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inList) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  return (
    <button className="hero__btn hero__btn--secondary" onClick={toggleList}>
      {inList ? <Check size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />} 
      {t('hero.my_list')}
    </button>
  );
}

function HeroPlayRemindButton({ movie, onPlay }: { movie: Movie; onPlay: (movie: Movie) => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reminded, setReminded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      const profile = JSON.parse(stored);
      import('../services/reminderService').then(({ isReminded }) => {
        isReminded(profile.id, movie.id).then((val) => {
          if (active) setReminded(val);
        });
      });
    }

    const handleUpdate = () => {
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        import('../services/reminderService').then(({ isReminded }) => {
          isReminded(profile.id, movie.id).then((val) => {
            if (active) setReminded(val);
          });
        });
      }
    };
    window.addEventListener('reminders_updated', handleUpdate);

    return () => {
      active = false;
      window.removeEventListener('reminders_updated', handleUpdate);
    };
  }, [movie.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    if (movie.comingSoon || (!movie.videoUrl && (!movie.seasons || movie.seasons.length === 0))) {
      const stored = localStorage.getItem('activeProfile');
      if (!stored) return;
      const profile = JSON.parse(stored);
      const { toggleReminder } = await import('../services/reminderService');
      const nextReminded = await toggleReminder(profile.id, movie.id);
      setReminded(nextReminded);
      showToast(nextReminded 
        ? `🔔 Reminder set! We will notify you when "${movie.title}" is available.`
        : `🔕 Reminder removed for "${movie.title}".`
      );
      return;
    }

    onPlay(movie);
  };

  const isComingSoon = movie.comingSoon || (!movie.videoUrl && (!movie.seasons || movie.seasons.length === 0));

  return (
    <>
      <button 
        className={`hero__btn hero__btn--play ${isComingSoon && reminded ? 'hero__btn--reminded' : ''}`} 
        onClick={handleClick}
        style={isComingSoon ? {
          backgroundColor: reminded ? 'rgba(255,255,255,0.1)' : 'white',
          color: reminded ? 'white' : 'black',
          border: reminded ? '1px solid rgba(255,255,255,0.4)' : 'none'
        } : {}}
      >
        {isComingSoon ? (
          <Bell size={15} fill={reminded ? "white" : "none"} color={reminded ? "white" : "black"} />
        ) : (
          <Play size={15} fill="white" />
        )}
        {' '}
        {isComingSoon ? (reminded ? 'Reminded' : t('hero.remind_me')) : t('hero.play')}
      </button>

      {toastMessage && (
        <div className="netflix-toast" style={{
          position: 'fixed',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          zIndex: 10000,
          boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderLeft: '4px solid #e50914',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}

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
  const { t } = useLanguage();

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
    isMobile
      ? movie.mobileCarouselBanner || movie.mobileBanner || movie.banner
      : movie.banner;

  const handleMoreInfo = (movie: Movie) => {
    const pathMap: Record<string, string> = {
      'ang-huling-el-bimbo-play': '/ang-huling-el-bimbo-play',
      'ang-huling-el-bimbo-play-xray': '/ang-huling-el-bimbo-play-xray',
      'minsan': '/minsan',
      'tindahan-ni-aling-nena': '/tindahan-ni-aling-nena',
      'alapaap-overdrive': '/alapaap-overdrive',
      'spoliarium-graduation': '/spoliarium-graduation',
      'pare-ko': '/pare-ko',
      'tama-ka-ligaya': '/tama-ka-ligaya',
      'ang-huling-el-bimbo': '/ang-huling-el-bimbo',
      'beyond-the-last-dance': '/beyond-the-last-dance'
    };
    
    if (pathMap[movie.id]) {
      navigate(pathMap[movie.id]);
    } else if (movie.title.includes('Ang Huling El Bimbo')) {
      navigate('/ang-huling-el-bimbo-play');
    } else {
      navigate(`/watch/${movie.id}`);
    }
  };

  const handlePlay = async (movie: Movie) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    if (movie.id === 'ang-huling-el-bimbo-play' || movie.title.includes('Ang Huling El Bimbo')) {
      navigate('/watch/ang-huling-el-bimbo-play');
    } else {
      navigate(`/watch/${movie.id}`);
    }
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
          <div className="hero__branding">
            {movie.logo ? (
              <img src={movie.logo} alt={movie.title} className="hero__logo" />
            ) : (
              <h1 className="hero__title">{movie.title}</h1>
            )}
            <div className="hero__meta">
              <span className="hero__year">{movie.year}</span>
              <span className="hero__badge">{movie.ageRating}</span>
              <HDBadge />
              {(movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
                <SpatialAudioBadge />
              )}
            </div>
          </div>
          <p className="hero__desc">{movie.description}</p>
          <div className="hero__actions">
            <HeroPlayRemindButton movie={movie} onPlay={handlePlay} />
            <button className="hero__btn hero__btn--secondary" onClick={() => handleMoreInfo(movie)}><Info size={15} /> {t('hero.more_info')}</button>
            <HeroListButton movie={movie} />
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
                    <div className="hero__branding">
                      {movie.logo
                        ? <img src={movie.logo} alt={movie.title} className="hero__logo" />
                        : <h1 className="hero__title">{movie.title}</h1>}
                      <div className="hero__meta">
                        <span className="hero__year">{movie.year}</span>
                        <span className="hero__badge">{movie.ageRating}</span>
                        <HDBadge />
                        {(movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
                          <SpatialAudioBadge />
                        )}
                      </div>
                    </div>
                    <p className="hero__desc">{movie.description}</p>
                    <div className="hero__actions">
                      <HeroPlayRemindButton movie={movie} onPlay={handlePlay} />
                      <button className="hero__btn hero__btn--secondary" onClick={() => handleMoreInfo(movie)}><Info size={15} /> {t('hero.more_info')}</button>
                      <HeroListButton movie={movie} />
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
