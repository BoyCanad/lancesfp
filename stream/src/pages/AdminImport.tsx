import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService } from '../services/tmdbService';
import type { TMDBResult } from '../services/tmdbService';
import { upsertMovie } from '../services/movieService';
import { Search, Loader2, Plus, Check, ArrowLeft, Film, Tv } from 'lucide-react';
import './AdminImport.css';

export default function AdminImport() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await tmdbService.search(query);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (result: TMDBResult) => {
    setImporting(result.id);
    try {
      const type = result.media_type === 'tv' ? 'tv' : 'movie';
      const details = await tmdbService.getDetails(result.id, type);
      const movieData = await tmdbService.mapToMovie(details, type);
      
      console.log('[AdminImport] Attempting to upsert:', JSON.stringify(movieData, null, 2));
      await upsertMovie(movieData);
      
      setSuccess(result.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      console.error('[AdminImport] Full error:', err);
      alert(`Import failed:\n${msg}\n\nCheck the browser console (F12) for details.`);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="admin-import">
      <header className="admin-import__header">
        <button className="admin-import__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Import from TMDB</h1>
      </header>

      <div className="admin-import__search-container">
        <form onSubmit={handleSearch} className="admin-import__search-form">
          <Search className="admin-import__search-icon" size={20} />
          <input
            type="text"
            placeholder="Search movies or TV shows on TMDB..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
          </button>
        </form>
      </div>

      <div className="admin-import__results">
        {results.map((result) => (
          <div key={result.id} className="admin-import__card">
            <div className="admin-import__card-thumb">
              {result.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${result.poster_path}`} alt={result.title || result.name} />
              ) : (
                <div className="admin-import__no-thumb">No Image</div>
              )}
              <div className="admin-import__type-badge">
                {result.media_type === 'tv' ? <Tv size={14} /> : <Film size={14} />}
                <span>{result.media_type === 'tv' ? 'TV' : 'Movie'}</span>
              </div>
            </div>
            <div className="admin-import__card-info">
              <h3>{result.title || result.name}</h3>
              <p className="admin-import__meta">
                {result.release_date || result.first_air_date || 'N/A'} • ★{(result.vote_average ?? 0).toFixed(1)}
              </p>
              <p className="admin-import__overview">{result.overview}</p>
              <button
                className={`admin-import__import-btn ${success === result.id ? 'success' : ''}`}
                onClick={() => handleImport(result)}
                disabled={importing === result.id}
              >
                {importing === result.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : success === result.id ? (
                  <><Check size={18} /> Imported</>
                ) : (
                  <><Plus size={18} /> Add to Site</>
                )}
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && query && (
          <div className="admin-import__empty">
            <p>No titles found for "{query}" on TMDB.</p>
          </div>
        )}
      </div>
    </div>
  );
}
