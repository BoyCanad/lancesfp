import { useState, useEffect } from 'react';
import { Play, Bookmark, Download } from 'lucide-react';
import { featuredMovies } from '../data/movies';
import './MovieDetail.css';

export default function TindahanDetail() {
  const movie = featuredMovies.find((m) => m.id === 'f4');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  if (!movie) {
    return <div className="movie-detail-not-found">Movie not found</div>;
  }

  const backgroundImage = isMobile
    ? '/images/tindahan-detail-mobile.png'
    : '/images/tindahan-detail.png';

  return (
    <div className="mdetail-container">
      {/* Background Image layer */}
      <div
        className="mdetail-bg"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      {/* Edge-to-edge gradient overlays to ensure text legibility */}
      <div className="mdetail-gradient mdetail-gradient-left"></div>
      <div className="mdetail-gradient mdetail-gradient-bottom"></div>

      {/* Content wrapper */}
      <div className="mdetail-content">

        {/* Logo */}
        {movie.logo ? (
          <img src={movie.logo} alt={movie.title} className="mdetail-logo" />
        ) : (
          <h1 className="mdetail-title">{movie.title}</h1>
        )}

        {/* Metadata row */}
        <div className="mdetail-meta-row">
          <span className="mdetail-meta-text">{movie.year}</span>
          <span className="mdetail-badge">{movie.ageRating}</span>
          <span className="mdetail-meta-text">{movie.duration}</span>
          <span className="mdetail-badge mdetail-badge-cam">HD</span>
          <span className="mdetail-rating">★ {movie.rating}</span>
        </div>

        {/* Genre pills */}
        <div className="mdetail-genres">
          {movie.genre.map((g) => (
            <span key={g} className="mdetail-genre-pill">{g}</span>
          ))}
        </div>

        {/* Description */}
        <p className="mdetail-description">{movie.description}</p>

        {/* Action Buttons */}
        <div className="mdetail-actions">
          <button className="mdetail-btn mdetail-btn-play">
            <Play size={18} fill="black" strokeWidth={0} /> Play
          </button>

          <div className="mdetail-actions-row">
            <button className="mdetail-btn mdetail-btn-secondary">
              <Bookmark size={18} /> Save to Vault
            </button>
            <button className="mdetail-btn mdetail-btn-secondary">
              <Download size={18} /> Download
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
