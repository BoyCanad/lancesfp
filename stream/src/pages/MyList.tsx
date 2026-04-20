import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { featuredMovies, trendingMovies, elBimboFeatured, makingOfLegacy, elBimboCollections } from '../data/movies';
import { MovieCard } from '../components/ContentRow';
import { getMyList } from '../services/listService';
import './Search.css'; // Reuse search grid styles
import './MyList.css';

export default function MyList() {
  const navigate = useNavigate();
  const [listMovies, setListMovies] = useState<any[]>([]);

  useEffect(() => {
    const fetchList = () => {
      const savedIds = getMyList();
      const allMovies = [
        ...featuredMovies, 
        ...trendingMovies, 
        elBimboFeatured, 
        makingOfLegacy,
        ...elBimboCollections
      ];
      
      const filtered = allMovies.filter(m => savedIds.includes(m.id));
      // Unique items
      const uniqueResults = Array.from(new Map(filtered.map(item => [item.id, item])).values());
      setListMovies(uniqueResults);
    };

    fetchList();
    window.addEventListener('mylist_updated', fetchList);
    return () => window.removeEventListener('mylist_updated', fetchList);
  }, []);

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

  return (
    <div className="search-page my-list-page">
      <h1 className="my-list-page__title">My List</h1>
      
      {listMovies.length === 0 ? (
        <div className="search-page__no-results my-list-empty">
          <p>You haven't added any titles to your list yet.</p>
          <button className="my-list-empty-btn" onClick={() => navigate('/browse')}>
            Browse Movies & TV
          </button>
        </div>
      ) : (
        <div className="search-page__grid">
          {listMovies.map(movie => (
            <div key={movie.id} className="search-page__item">
              <MovieCard 
                movie={movie} 
                onClick={() => handleMovieClick(movie)} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
