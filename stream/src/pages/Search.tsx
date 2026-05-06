import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { allMovies as staticAllMovies } from '../data/movies';
import { fetchAllMovies } from '../services/movieService';
import { MovieCard } from '../components/ContentRow';
import { PlayCircle, ArrowLeft, Mic, Download, Search as SearchIcon, X, Bell } from 'lucide-react';
import './Search.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [allMovies, setAllMovies] = useState(staticAllMovies);

  // Load from Supabase once
  useEffect(() => {
    fetchAllMovies().then(setAllMovies);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isSearchEmpty = query.trim().length === 0;

  useEffect(() => {
    if (!isSearchEmpty) {
      const lowerQuery = query.toLowerCase();
      const filtered = allMovies.filter(m =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.description.toLowerCase().includes(lowerQuery) ||
        m.genre.some(g => g.toLowerCase().includes(lowerQuery)) ||
        (m.ageRating && m.ageRating.toLowerCase().includes(lowerQuery))
      );
      // Remove duplicates
      const uniqueResults = Array.from(new Map(filtered.map(item => [item.id, item])).values());
      setResults(uniqueResults);
    } else if (isMobile) {
      // Recommendations for mobile empty state
      setResults(allMovies.slice(0, 8));
    } else {
      setResults([]);
    }
  }, [query, isMobile, isSearchEmpty, allMovies]);

  const handleMovieClick = (movie: any) => {
    const pathMap: Record<string, string> = {
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
      't1': '/11-stem-a'
    };
    
    navigate(pathMap[movie.id] || `/watch/${movie.id}`);
  };



  const onSearchQueryChange = (val: string) => {
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val)}`, { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  return (
    <div className="search-page">
      {isMobile && (
        <div className="search-page__mobile-container">
          <header className="search-page__mobile-header">
            <button className="search-page__back-btn" onClick={() => navigate('/browse')}>
              <ArrowLeft size={24} color="white" />
            </button>
            <div className="search-page__header-right">
              <Download size={24} color="white" />
            </div>
          </header>
          
          <div className="search-page__mobile-search-bar">
            <SearchIcon size={20} color="#b3b3b3" className="search-page__bar-icon" />
            <input 
              type="text" 
              placeholder="Search shows, movies, names..."
              value={query}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="search-page__bar-input"
            />
            {query ? (
              <X size={20} color="#b3b3b3" onClick={() => onSearchQueryChange('')} />
            ) : (
              <Mic size={20} color="#b3b3b3" />
            )}
          </div>
        </div>
      )}

      {isMobile && isSearchEmpty ? (
        <div className="search-page__mobile-rec">
          <h2 className="search-page__title">Recommended TV Shows & Movies</h2>
          <div className="search-page__list">
            {results.map(movie => (
              <div 
                key={movie.id} 
                className="search-page__list-item"
                onClick={() => handleMovieClick(movie)}
              >
                <div className="search-page__item-thumb">
                  <img src={movie.thumbnail} alt={movie.title} />
                </div>
                <div className="search-page__item-info">
                  <span className="search-page__item-title">{movie.title}</span>
                  {movie.comingSoon && <span className="search-page__item-coming-soon">Remind Me</span>}
                </div>
                <div className="search-page__item-action">
                  {movie.comingSoon ? <Bell size={24} color="white" /> : <PlayCircle size={28} color="white" strokeWidth={1.5} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : results.length === 0 && !isSearchEmpty ? (
        <div className="search-page__no-results">
          <p>Your search for "{query}" did not have any matches.</p>
          <ul>
            <li>Try different keywords</li>
            <li>Looking for a movie or TV show?</li>
            <li>Try using a movie, TV show title, or a genre</li>
          </ul>
        </div>
      ) : (
        <>
          {isMobile && !isSearchEmpty && (
            <h2 className="search-page__title">Movies & TV</h2>
          )}
          <div className="search-page__grid">
            {results.map(movie => (
              <div key={movie.id} className="search-page__item">
                <MovieCard 
                  movie={movie} 
                  onClick={() => handleMovieClick(movie)} 
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
