import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, ChevronDown, Play, Plus, Check, Info } from 'lucide-react';
import { featuredMovies, trendingMovies, elBimboFeatured, makingOfLegacy, elBimboCollections, afterHours, allMovies } from '../data/movies';
import { isInMyList, addToMyList, removeFromMyList } from '../services/listService';
import { getWatchProgress } from '../services/profileService';
import type { Profile } from '../services/profileService';
import CategorySelector from '../components/CategorySelector';
import './CategoryPage.css';

// ─── Path map shared between mobile and desktop ───────────────────────────────
const PATH_MAP: Record<string, string> = {
  'ang-huling-el-bimbo-play': '/ang-huling-el-bimbo-play',
  'minsan': '/minsan',
  'tindahan-ni-aling-nena': '/tindahan-ni-aling-nena',
  'alapaap-overdrive': '/alapaap-overdrive',
  'spoliarium-graduation': '/spoliarium-graduation',
  'pare-ko': '/pare-ko',
  'tama-ka-ligaya': '/tama-ka-ligaya',
  'ang-huling-el-bimbo': '/ang-huling-el-bimbo',
  'beyond-the-last-dance': '/beyond-the-last-dance',
  'after-hours': '/after-hours',
  'bukang-liwayway-takipsilim': '/bukang-liwayway-takipsilim',
  'a-day-in-my-life-stem': '/a-day-in-my-life-stem',
  't1': '/11-stem-a',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function CategoryPage() {
  const { genreId = 'Browse' } = useParams<{ genreId: string }>();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [heroMuted, setHeroMuted] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<any[]>([]);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    
    // Get profile and fetch progress (matching Home.tsx logic)
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setActiveProfile(profile);
        
        getWatchProgress(profile.id).then(progress => {
          const watchedItems = progress
            .map(wp => {
              const movie = allMovies.find(m => m.id === wp.movie_id);
              if (!movie) return null;
              return {
                ...movie,
                progress: (wp.progress_ms / wp.duration_ms) * 100
              };
            })
            .filter(Boolean);
          setDynamicContinueWatching(watchedItems);
        });
      } catch (e) {}
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const pool = [
      ...featuredMovies,
      ...trendingMovies,
      elBimboFeatured,
      makingOfLegacy,
      afterHours,
      ...elBimboCollections,
    ];

    const unique = Array.from(new Map(pool.map(item => [item.id, item])).values());

    const filtered = unique.filter(m => {
      if (genreId.toLowerCase() === 'shows') return m.mediaType === 'show';
      if (genreId.toLowerCase() === 'movies') return m.mediaType === 'movie';
      return m.genre.some((g: string) => g.toLowerCase() === genreId.toLowerCase());
    });

    setMovies(filtered);
  }, [genreId]);

  const handleMovieClick = (movie: any) => navigate(PATH_MAP[movie.id] || `/watch/${movie.id}`);

  const featured = movies.length > 0 ? (genreId.toLowerCase() === 'shows' ? movies.find(m => m.id === 't1') || movies[0] : movies[0]) : null;
  const desktopHero = genreId.toLowerCase() === 'shows' ? (movies.find(m => m.id === 't1') || afterHours) : (featured || elBimboFeatured);

  useEffect(() => {
    if (featured) setInMyList(isInMyList(featured.id));
  }, [featured]);

  const handleToggleList = () => {
    if (!featured) return;
    if (inMyList) { removeFromMyList(featured.id); setInMyList(false); }
    else { addToMyList(featured.id); setInMyList(true); }
  };

  const isAggregatedGenre = ['shows', 'movies'].includes(genreId.toLowerCase());
  
  // ─── Row structure helper ───────────────────────────────────────────────────
  const getCategoryRows = () => {
    const rows = [];
    
    // Add Continue Watching row if data exists
    if (dynamicContinueWatching.length > 0) {
      // We often filter continue watching in category pages to match the genre
      const filteredCW = dynamicContinueWatching.filter(m => {
        if (genreId.toLowerCase() === 'shows') return m.mediaType === 'show';
        if (genreId.toLowerCase() === 'movies') return m.mediaType === 'movie';
        return true;
      });

      if (filteredCW.length > 0) {
        rows.push({ title: `Continue Watching for ${activeProfile?.name || 'User'}`, items: filteredCW, showProgress: true });
      }
    }

    if (genreId.toLowerCase() === 'shows') {
      rows.push(
        { title: 'LSFPlus Originals', items: allMovies.filter(m => m.mediaType === 'show' && m.isOriginal) },
        { title: 'Documentaries', items: allMovies.filter(m => m.mediaType === 'show' && m.genre.includes('Documentary')) },
        { title: 'Live & Event Shows', items: allMovies.filter(m => m.mediaType === 'show' && (m.genre.includes('Live') || m.streamStatus === 'live')) },
        { title: 'Classroom Chronicles', items: allMovies.filter(m => m.mediaType === 'show' && (m.genre.includes('Classroom') || m.genre.includes('STEM'))) },
      );
    } else if (genreId.toLowerCase() === 'movies') {
      rows.push(
        { title: 'Musical', items: allMovies.filter(m => m.mediaType === 'movie' && m.genre.includes('Musical')) },
        { title: 'Documentaries', items: allMovies.filter(m => m.mediaType === 'movie' && m.genre.includes('Documentary')) },
      );
    }
    
    return rows.filter(r => r.items.length > 0);
  };

  const rows = getCategoryRows();

  // ── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  if (isDesktop && isAggregatedGenre) {
    return (
      <div className="cp cp--desktop">
        <div className="cp__sub-header">
          <div className="cp__sub-header-left">
            <h1 className="cp__page-title">{genreId.toLowerCase() === 'shows' ? 'TV Shows' : 'Movies'}</h1>
            <button className="cp__genres-btn" onClick={() => setIsCategorySelectorOpen(true)}>
              Genres <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="cp__view-toggles">
            <button className="cp__view-btn cp__view-btn--active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
            <button className="cp__view-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>
          </div>
        </div>

        <div className="cp__hero">
          {desktopHero.trailerUrl ? (
            <video ref={heroVideoRef} className="cp__hero-media" autoPlay muted={heroMuted} loop playsInline poster={desktopHero.banner}><source src={desktopHero.trailerUrl} type="video/mp4" /></video>
          ) : (
            <img src={desktopHero.banner} className="cp__hero-media" alt={desktopHero.title} />
          )}
          <div className="cp__hero-gradient" />
          <div className="cp__hero-content">
            {desktopHero.logo ? <img src={desktopHero.logo} alt={desktopHero.title} className="cp__hero-logo" /> : <h2 className="cp__hero-title">{desktopHero.title}</h2>}
            <p className="cp__hero-desc">{desktopHero.description}</p>
            <div className="cp__hero-actions">
              <button className="cp__hero-play-btn" onClick={() => handleMovieClick(desktopHero)}><Play size={20} fill="black" /> Play</button>
              <button className="cp__hero-info-btn" onClick={() => handleMovieClick(desktopHero)}><Info size={20} /> More Info</button>
            </div>
          </div>
          <div className="cp__hero-vignette" />
          {desktopHero.trailerUrl && (
            <button className="cp__hero-mute-btn" onClick={() => { setHeroMuted(!heroMuted); if (heroVideoRef.current) heroVideoRef.current.muted = !heroMuted; }}>
              {heroMuted ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
            </button>
          )}
        </div>

        <div className="cp__rows">
          {rows.map((row, i) => (
            <DesktopRow key={i} title={row.title} items={row.items} onMovieClick={handleMovieClick} showProgress={row.showProgress} />
          ))}
        </div>

        <CategorySelector isOpen={isCategorySelectorOpen} onClose={() => setIsCategorySelectorOpen(false)} currentCategory={genreId} />
      </div>
    );
  }

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div className="category-page">
      <header className="category-page__header">
        <div className="category-page__header-left">
          <button className="category-page__icon-btn" onClick={() => navigate('/browse')}><ArrowLeft size={26} color="white" strokeWidth={2.5}/></button>
          <h1 className="category-page__header-title">Categories</h1>
        </div>
        <div className="category-page__header-right">
          <button className="category-page__icon-btn"><Download size={24} color="white" /></button>
          <button className="category-page__icon-btn" onClick={() => navigate('/search')}><Search size={24} color="white" /></button>
        </div>
      </header>

      <div className="category-page__filter-container">
        <button className="category-page__filter-pill" onClick={() => setIsCategorySelectorOpen(true)}>
          <span className="category-page__filter-text" style={{textTransform: 'capitalize'}}>{genreId}</span>
          <ChevronDown size={16} color="#fff" strokeWidth={2}/>
        </button>
      </div>

      <div className="category-page__content">
        {featured ? (
          <div className="category-page__hero-card">
            <img src={featured.mobileBanner || featured.mobileThumbnail || featured.banner || featured.thumbnail} className="category-page__hero-img" alt={featured.title} />
            <div className="category-page__hero-overlay">
              {featured.logo ? <img src={featured.logo} alt={featured.title} className="category-page__hero-logo" /> : <h2 className="category-page__hero-title">{featured.title}</h2>}
              <div className="category-page__hero-genres">{featured.genre.slice(0, 4).join(' • ')}</div>
              <div className="category-page__hero-actions">
                <button className="category-page__play-btn" onClick={() => handleMovieClick(featured)}><Play size={20} fill="black" /> <span>Play</span></button>
                <button className="category-page__mylist-btn" onClick={handleToggleList}>{inMyList ? <Check size={22} color="#00ff00" /> : <Plus size={22} color="white" />}<span>{inMyList ? 'Added' : 'My List'}</span></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="category-page__empty"><p>No titles found in this category.</p></div>
        )}

        {isAggregatedGenre ? (
          rows.map((row, i) => (
            <MobileRow key={i} title={row.title} items={row.items} onMovieClick={handleMovieClick} showProgress={row.showProgress} />
          ))
        ) : (
          movies.length > 1 && (
            <MobileRow title={`More in ${genreId}`} items={movies.slice(1)} onMovieClick={handleMovieClick} />
          )
        )}
      </div>

      <CategorySelector isOpen={isCategorySelectorOpen} onClose={() => setIsCategorySelectorOpen(false)} currentCategory={genreId} />
    </div>
  );
}

// ─── Scrollable row component (Desktop fallback for aggregated) ────────────────
function DesktopRow({ title, items, onMovieClick, showProgress }: { title: string; items: any[]; onMovieClick: (m: any) => void; showProgress?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="cp-row">
      <div className="cp-row__header">
        <h2 className="cp-row__title">{title}</h2>
      </div>
      <div className="cp-row__track">
        {items.map(movie => (
          <div key={movie.id} className="cp-row__card" onClick={() => onMovieClick(movie)}>
            <div className="cp-row__card-img-wrapper">
              <img src={movie.cardBanner || movie.banner || movie.thumbnail} alt={movie.title} className="cp-row__card-img" />
              {movie.isOriginal && <div className="cp-row__n-badge">N</div>}
              <div className="cp-row__card-overlay"><Play size={28} fill="white" color="white" /></div>
            </div>
            {showProgress && movie.progress !== undefined && (
                <div className="cp-row__progress-container">
                    <div className="cp-row__progress-bg">
                        <div className="cp-row__progress-bar" style={{ width: `${movie.progress}%` }} />
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Mobile Row Component ────────────────────────────────────────────────────
function MobileRow({ title, items, onMovieClick, showProgress }: { title: string; items: any[]; onMovieClick: (m: any) => void; showProgress?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="category-page__list-section">
      <h3 className="category-page__list-title">{title}</h3>
      <div className="category-page__row">
        {items.map(movie => (
          <div key={movie.id} className="category-page__list-item" onClick={() => onMovieClick(movie)}>
            <div className="category-page__list-item-img-wrapper">
              <img src={movie.mobileThumbnail || movie.thumbnail} alt={movie.title} />
            </div>
            {showProgress && movie.progress !== undefined && (
                <div className="category-page__mobile-progress">
                    <div className="category-page__mobile-progress-bg">
                        <div className="category-page__mobile-progress-fill" style={{ width: `${movie.progress}%` }} />
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
