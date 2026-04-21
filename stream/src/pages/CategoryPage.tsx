import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, ChevronDown, Play, Plus, Check } from 'lucide-react';
import { featuredMovies, trendingMovies, elBimboFeatured, makingOfLegacy, elBimboCollections } from '../data/movies';
import { isInMyList, addToMyList, removeFromMyList } from '../services/listService';
import CategorySelector from '../components/CategorySelector';
import './CategoryPage.css';

export default function CategoryPage() {
  const { genreId } = useParams<{ genreId: string }>();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [inMyList, setInMyList] = useState(false);

  useEffect(() => {
    if (!genreId) return;

    const allMovies = [
      ...featuredMovies,
      ...trendingMovies,
      elBimboFeatured,
      makingOfLegacy,
      ...elBimboCollections
    ];

    // Remove duplicates
    const uniqueMovies = Array.from(new Map(allMovies.map(item => [item.id, item])).values());

    const filtered = uniqueMovies.filter(m => 
      m.genre.some((g: string) => g.toLowerCase() === genreId.toLowerCase())
    );

    setMovies(filtered);
  }, [genreId]);

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

  const featured = movies.length > 0 ? movies[0] : null;

  useEffect(() => {
    if (featured) {
      setInMyList(isInMyList(featured.id));
    }
  }, [featured]);

  const handleToggleList = () => {
    if (!featured) return;
    if (inMyList) {
      removeFromMyList(featured.id);
      setInMyList(false);
    } else {
      addToMyList(featured.id);
      setInMyList(true);
    }
  };

  const listMovies = movies.length > 1 ? movies.slice(1) : [];

  return (
    <div className="category-page">
      <header className="category-page__header">
        <div className="category-page__header-left">
          <button className="category-page__icon-btn" onClick={() => navigate('/browse')}>
            <ArrowLeft size={26} color="white" strokeWidth={2.5}/>
          </button>
          <h1 className="category-page__header-title">Categories</h1>
        </div>
        <div className="category-page__header-right">
          <button className="category-page__icon-btn">
            <Download size={24} color="white" />
          </button>
          <button className="category-page__icon-btn" onClick={() => navigate('/search')}>
            <Search size={24} color="white" />
          </button>
        </div>
      </header>

      <div className="category-page__filter-container">
        <button 
          className="category-page__filter-pill"
          onClick={() => setIsCategorySelectorOpen(true)}
        >
          <span className="category-page__filter-text" style={{textTransform: 'capitalize'}}>{genreId}</span>
          <ChevronDown size={16} color="#fff" strokeWidth={2}/>
        </button>
      </div>

      <div className="category-page__content">
        {featured ? (
          <div className="category-page__hero-card">
            <img src={featured.mobileBanner || featured.mobileThumbnail || featured.banner || featured.thumbnail} className="category-page__hero-img" alt={featured.title} />
            <div className="category-page__hero-overlay">
              {featured.logo ? (
                <img src={featured.logo} alt={featured.title} className="category-page__hero-logo" />
              ) : (
                <h2 className="category-page__hero-title">{featured.title}</h2>
              )}
              <div className="category-page__hero-genres">
                {featured.genre.slice(0, 4).join(' • ')}
              </div>
              <div className="category-page__hero-actions">
                <button className="category-page__play-btn" onClick={() => handleMovieClick(featured)}>
                  <Play size={20} fill="black" /> <span>Play</span>
                </button>
                <button className="category-page__mylist-btn" onClick={handleToggleList}>
                  {inMyList ? (
                    <Check size={22} color="#00ff00" />
                  ) : (
                    <Plus size={22} color="white" />
                  )}
                  <span>{inMyList ? 'Added' : 'My List'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="category-page__empty">
             <p>No titles found in this category.</p>
          </div>
        )}

        {listMovies.length > 0 && (
          <div className="category-page__list-section">
            <h3 className="category-page__list-title" style={{textTransform: 'capitalize'}}>More in {genreId}</h3>
            <div className="category-page__row">
              {listMovies.map(movie => (
                <div key={movie.id} className="category-page__list-item" onClick={() => handleMovieClick(movie)}>
                  <img src={movie.mobileThumbnail || movie.thumbnail} alt={movie.title} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CategorySelector 
        isOpen={isCategorySelectorOpen} 
        onClose={() => setIsCategorySelectorOpen(false)} 
        currentCategory={genreId}
      />
    </div>
  );
}
