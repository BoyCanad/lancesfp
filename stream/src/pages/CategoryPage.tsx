import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Play, Plus, Check, Info, ArrowLeft, Search } from 'lucide-react';
import { elBimboFeatured, afterHours, allMovies } from '../data/movies';
import { isInMyList, addToMyList, removeFromMyList } from '../services/listService';
import { getWatchProgress } from '../services/profileService';
import { useVideoFade } from '../hooks/useVideoFade';
import ContentRow from '../components/ContentRow';
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
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type');
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [heroMuted, setHeroMuted] = useState(false);
  const [isHeroMinimal, setIsHeroMinimal] = useState(false);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<any[]>([]);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

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
    const filtered = allMovies.filter(m => {
      if (genreId.toLowerCase() === 'shows') return m.mediaType === 'show';
      if (genreId.toLowerCase() === 'movies') return m.mediaType === 'movie';
      
      const matchesGenre = m.genre.some((g: string) => g.toLowerCase() === genreId.toLowerCase() || g.toLowerCase().replace(/ /g, '-') === genreId.toLowerCase());
      if (typeFilter === 'show') return matchesGenre && m.mediaType === 'show';
      if (typeFilter === 'movie') return matchesGenre && m.mediaType === 'movie';
      return matchesGenre;
    });

    setMovies(filtered);
  }, [genreId, typeFilter]);

  const handleMovieClick = (movie: any) => navigate(PATH_MAP[movie.id] || `/watch/${movie.id}`);

  const isShowContext = genreId.toLowerCase() === 'shows' || (genreId.toLowerCase() === 'documentary' && typeFilter === 'show');
  const featured = movies.length > 0 ? (isShowContext ? movies.find(m => m.id === 'beyond-the-last-dance') || movies[0] : movies[0]) : null;
  const desktopHero = isShowContext ? (movies.find(m => m.id === 'beyond-the-last-dance') || afterHours) : (featured || elBimboFeatured);

  useEffect(() => {
    if (featured) setInMyList(isInMyList(featured.id));
  }, [featured]);

  const handleToggleList = () => {
    if (!featured) return;
    if (inMyList) { removeFromMyList(featured.id); setInMyList(false); }
    else { addToMyList(featured.id); setInMyList(true); }
  };

  const isAggregatedGenre = ['shows', 'movies'].includes(genreId.toLowerCase());
  
  useEffect(() => {
    setIsHeroMinimal(false); // Reset on genre change
    setIsVideoEnded(false);  // Reset video state
    const timer = setTimeout(() => {
      setIsHeroMinimal(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [genreId, typeFilter, desktopHero.id]);

  // Handle visibility-based pause and volume fade
  useVideoFade(heroVideoRef, heroMuted, !!desktopHero?.trailerUrl && !isVideoEnded);

  // ─── Trailer Subtitle Logic ───────────────────────────────────────────────
  interface ParsedCue {
    start: number;
    end: number;
    text: string;
  }

  const [cues, setCues] = useState<ParsedCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  const parseVTT = (vttData: string): ParsedCue[] => {
    const cues: ParsedCue[] = [];
    const lines = vttData.split(/\r?\n/);
    let i = 0;

    const timeToSeconds = (timeStr: string) => {
      const parts = timeStr.trim().split(':');
      let secs = 0;
      if (parts.length === 3) {
        secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
      } else if (parts.length === 2) {
        secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
      }
      return isNaN(secs) ? 0 : secs;
    };

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const parts = line.split('-->');
        const start = timeToSeconds(parts[0]);
        const end = timeToSeconds(parts[1]);

        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          const textLine = lines[i].trim().replace(/<[^>]+>/g, '');
          text += (text ? '\n' : '') + textLine;
          i++;
        }
        cues.push({ start, end, text });
      } else {
        i++;
      }
    }
    return cues;
  };

  useEffect(() => {
    if (desktopHero?.trailerVttUrl) {
      fetch(desktopHero.trailerVttUrl)
        .then(res => res.text())
        .then(data => setCues(parseVTT(data)))
        .catch(err => console.error('Failed to load subtitles:', err));
    } else {
      setCues([]);
    }
    setCurrentSubtitle('');
  }, [desktopHero]);

  const handleTimeUpdate = () => {
    if (!heroVideoRef.current) return;
    const time = heroVideoRef.current.currentTime;
    const activeCue = cues.find(cue => time >= cue.start && time <= cue.end);
    setCurrentSubtitle(activeCue ? activeCue.text : '');
  };

  // ─── Row structure helper ───────────────────────────────────────────────────
  const getCategoryRows = () => {
    const rows = [];
    
    // Add Continue Watching row if data exists
    if (dynamicContinueWatching.length > 0) {
      const filteredCW = dynamicContinueWatching.filter(m => {
        if (genreId.toLowerCase() === 'shows') return m.mediaType === 'show';
        if (genreId.toLowerCase() === 'movies') return m.mediaType === 'movie';
        
        const matchesGenre = m.genre.some((g: string) => g.toLowerCase() === genreId.toLowerCase() || g.toLowerCase().replace(/ /g, '-') === genreId.toLowerCase());
        if (typeFilter === 'show') return matchesGenre && m.mediaType === 'show';
        if (typeFilter === 'movie') return matchesGenre && m.mediaType === 'movie';
        return matchesGenre;
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
  if (isDesktop) {
    // Determine parent label for breadcrumb
    const parentLabel = genreId.toLowerCase() === 'shows' || genreId.toLowerCase() === 'movies'
      ? null
      : (typeFilter === 'movie' ? 'Movies' : typeFilter === 'show' ? 'TV Shows' : (desktopHero?.mediaType === 'movie' ? 'Movies' : 'TV Shows'));
    const genreLabel = genreId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
      <div className="cp cp--desktop">
        {isAggregatedGenre ? (
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
        ) : (
          <div className="cp__breadcrumb">
            <span className="cp__breadcrumb-parent" onClick={() => navigate(parentLabel === 'Movies' ? '/genre/movies' : '/genre/shows')}>
              {parentLabel}
            </span>
            <span className="cp__breadcrumb-sep"> &rsaquo; </span>
            <span className="cp__breadcrumb-current">{genreLabel}</span>
          </div>
        )}

        <div className="cp__hero">
          <div className="cp__hero-media-wrapper">
            <img 
              src={desktopHero.banner} 
              className={`cp__hero-media cp__hero-img ${isVideoEnded ? 'is-visible' : ''}`} 
              alt={desktopHero.title} 
            />
            {desktopHero.trailerUrl && (
              <video 
                key={desktopHero.id}
                ref={heroVideoRef} 
                className={`cp__hero-media cp__hero-video ${isVideoEnded ? 'is-hidden' : ''}`} 
                src={desktopHero.trailerUrl}
                autoPlay 
                muted={heroMuted} 
                playsInline 
                poster={desktopHero.banner} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsVideoEnded(true)}
              />
            )}
          </div>
          <div className="cp__hero-gradient" />
          
          {currentSubtitle && (
            <div className="cp__hero-subtitle-overlay">
              <div className="cp__hero-subtitle-text">
                {currentSubtitle.split('\n').map((line, idx) => (
                  <span key={idx}>{line}<br /></span>
                ))}
              </div>
            </div>
          )}

          <div className={`cp__hero-content ${isHeroMinimal ? 'cp__hero-content--minimal' : ''}`}>
            {desktopHero.logo ? (
              <img src={desktopHero.logo} alt={desktopHero.title} className="cp__hero-logo" />
            ) : (
              <h2 className="cp__hero-title">{desktopHero.title}</h2>
            )}
            
            {desktopHero.mediaType === 'show' && (
              <div className="cp__hero-status">
                {desktopHero.comingSoon ? "New Episodes Coming Soon" : "Watch Season 1 Now"}
              </div>
            )}

            <p className="cp__hero-desc">{desktopHero.description}</p>
            
            <div className="cp__hero-actions">
              <button className="cp__hero-play-btn" onClick={() => handleMovieClick(desktopHero)}>
                <Play size={24} fill="black" /> Play
              </button>
              <button className="cp__hero-info-btn" onClick={() => handleMovieClick(desktopHero)}>
                <Info size={24} /> More Info
              </button>
            </div>
          </div>

          <div className="cp__hero-right-meta">
            {desktopHero.trailerUrl && !isVideoEnded && (
              <button className="cp__hero-mute-btn" onClick={() => { setHeroMuted(!heroMuted); if (heroVideoRef.current) heroVideoRef.current.muted = !heroMuted; }}>
                {heroMuted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            )}
            <div className="cp__hero-rating">
              {desktopHero.ageRating}
            </div>
          </div>

          <div className="cp__hero-vignette" />
        </div>

        <div className="cp__rows cp__rows--desktop">
          {rows.map((row, i) => (
            <ContentRow key={i} title={row.title} movies={row.items} showProgress={row.showProgress} />
          ))}
          {!isAggregatedGenre && movies.length > 1 && (
            <ContentRow title={`More in ${genreLabel}`} movies={movies.slice(1)} />
          )}
        </div>

        <CategorySelector isOpen={isCategorySelectorOpen} onClose={() => setIsCategorySelectorOpen(false)} currentCategory={genreId} mode={genreId.toLowerCase() === 'shows' ? 'shows' : genreId.toLowerCase() === 'movies' ? 'movies' : undefined} />
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
          <button className="category-page__icon-btn" onClick={() => navigate('/search')}><Search size={24} color="white" /></button>
        </div>
      </header>

      <div className="category-page__filter-container">
        <button className="category-page__filter-pill" onClick={() => setIsCategorySelectorOpen(true)}>
          <span className="category-page__filter-text" style={{textTransform: 'capitalize'}}>{genreId}</span>
          <ChevronDown size={16} color="#fff" strokeWidth={2}/>
        </button>
      </div>

      <div className="category-page__content cp__rows--mobile">
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

        <div className="cp__rows-wrapper">
          {isAggregatedGenre ? (
            rows.map((row, i) => (
              <ContentRow key={i} title={row.title} movies={row.items} showProgress={row.showProgress} />
            ))
          ) : (
            movies.length > 1 && (
              <ContentRow title={`More in ${genreId}`} movies={movies.slice(1)} />
            )
          )}
        </div>
      </div>

      <CategorySelector isOpen={isCategorySelectorOpen} onClose={() => setIsCategorySelectorOpen(false)} currentCategory={genreId} mode={genreId.toLowerCase() === 'shows' ? 'shows' : genreId.toLowerCase() === 'movies' ? 'movies' : undefined} />
    </div>
  );
}
