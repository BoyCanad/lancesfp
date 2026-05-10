import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, AlertCircle } from 'lucide-react';
import { getOfflineMovies, deleteOfflineMovie } from '../services/hlsDownloadService';
import { allMovies } from '../data/movies';
import { MovieCard } from '../components/ContentRow';
import './Search.css';
import './Downloads.css';

export default function Downloads() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);

  const fetchOffline = () => {
    const metas = getOfflineMovies();
    
    const offlineMovies = metas.map(meta => {
      const movie = allMovies.find(m => m.id === meta.movieId);
      return movie ? { ...movie, offlineMeta: meta } : null;
    }).filter(Boolean);
    
    setMovies(offlineMovies);
  };

  useEffect(() => {
    fetchOffline();
    // Refresh if other tabs delete something
    window.addEventListener('storage', fetchOffline);
    return () => window.removeEventListener('storage', fetchOffline);
  }, []);

  const handleDelete = async (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this download?')) {
      await deleteOfflineMovie(movieId);
      fetchOffline();
    }
  };

  const handleMovieClick = (movie: any) => {
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div className="search-page downloads-page">
      <div className="downloads-header">
        <h1 className="downloads-title">Downloads</h1>
        <div className="downloads-storage-info">
          <Download size={16} />
          <span>{movies.length} titles available offline</span>
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="downloads-empty">
          <div className="downloads-empty-icon">
            <Download size={80} strokeWidth={1} />
          </div>
          <h2 className="downloads-empty-title">No Downloads</h2>
          <p className="downloads-empty-text">
            Movies and TV shows that you download will appear here.
          </p>
          <button className="downloads-browse-btn" onClick={() => navigate('/browse')}>
            Find Something to Download
          </button>
        </div>
      ) : (
        <div className="downloads-grid">
          {movies.map(movie => (
            <div key={movie.id} className="downloads-item" onClick={() => handleMovieClick(movie)}>
              <div className="downloads-card-wrapper">
                <MovieCard 
                  movie={movie} 
                  onClick={() => handleMovieClick(movie)} 
                />
                <div className="downloads-overlay">
                   <button 
                     className="downloads-action-btn delete" 
                     onClick={(e) => handleDelete(movie.id, e)}
                     title="Delete Download"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              </div>
              <div className="downloads-info">
                <h3 className="downloads-item-title">{movie.title}</h3>
                <div className="downloads-item-meta">
                  <span>{movie.year}</span>
                  <span className="dot">•</span>
                  <span>{movie.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="downloads-footer-tip">
        <AlertCircle size={14} />
        <span>Smart Downloads is on. Some titles may have been downloaded for you.</span>
      </div>
    </div>
  );
}
