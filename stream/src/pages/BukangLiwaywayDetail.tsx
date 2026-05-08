import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Share2, Library, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { archiveMovies } from '../data/movies';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import './MovieDetail.css';
import './MinsanDetail.css';

export default function BukangLiwaywayDetail() {
  const movie = archiveMovies.find((m) => m.id === 'bukang-liwayway-takipsilim');
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlayClick = async () => {
    if (!movie) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    navigate(`/watch/${movie.id}`);
  };

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? movie.mobileBanner || movie.banner
    : movie.banner;

  return (
    <div className="mdetail-page-wrapper">
      <button className="mdetail-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={28} />
      </button>
      <div className="mdetail-container">
        <div
          className="mdetail-bg mdetail-bg--static"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        <div className="mdetail-gradient mdetail-gradient-left" />
        <div className="mdetail-gradient mdetail-gradient-bottom" />

        <div className="mdetail-content">
          {movie.logo ? (
            <img src={movie.logo} alt={movie.title} className="mdetail-logo" />
          ) : (
            <h1 className="mdetail-title">{movie.title}</h1>
          )}

          <div className="mdetail-meta-row">
            <span className="mdetail-meta-text">{movie.year}</span>
            <span className="mdetail-badge">{movie.ageRating}</span>
            <span className="mdetail-meta-text">{movie.duration}</span>
            <span className="mdetail-badge mdetail-badge-cam">HD</span>

          </div>

          <div className="mdetail-genres">
            {movie.genre.map((g) => (
              <span key={g} className="mdetail-genre-pill">{g}</span>
            ))}
          </div>

          <p className="mdetail-description">{movie.description}</p>

          <div className="mdetail-actions">
            <button onClick={handlePlayClick} className="mdetail-btn mdetail-btn-play">
              <Play size={18} fill="black" strokeWidth={0} /> Play
            </button>

            <div className="mdetail-quick-actions">
              <button className="mdetail-quick-btn">
                <Plus size={28} color="white" strokeWidth={1.5} />
                <span>My List</span>
              </button>
              <RateButton movieId={movie.id} />
              <button className="mdetail-quick-btn">
                <Share2 size={24} color="white" strokeWidth={1.5} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mdetail-collections-wrapper">
        <ContentRow
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Library size={24} color="#e50914" /> G11 Archives
            </div>
          }
          movies={archiveMovies.filter(m => m.id !== movie.id)}
        />
      </div>
    </div>
  );
}
