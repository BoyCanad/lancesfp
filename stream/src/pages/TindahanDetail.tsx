import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, Download, Library } from 'lucide-react';
import { featuredMovies, trendingMovies, elBimboFeatured } from '../data/movies';
import ContentRow from '../components/ContentRow';
import './MovieDetail.css';

const elBimboCollections = [
  elBimboFeatured,
  featuredMovies[1],
  featuredMovies[3],
  featuredMovies[4],
  featuredMovies[5],
  featuredMovies[6],
  featuredMovies[7],
  featuredMovies[8],
  ...[...trendingMovies].reverse().slice(7)
];

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
    ? '/images/tindahan-detail-mobile.webp'
    : '/images/tindahan-detail.webp';

  return (
    <div className="mdetail-page-wrapper">
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
          <Link to={`/watch/tindahan`} className="mdetail-btn mdetail-btn-play" style={{ textDecoration: 'none' }}>
            <Play size={18} fill="black" strokeWidth={0} /> Play
          </Link>

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
      
      <div className="mdetail-collections-wrapper">
        <ContentRow
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Library size={24} color="#e50914" /> Ang Huling El Bimbo Collections
            </div>
          }
          movies={elBimboCollections.filter(m => m.title !== movie?.title)}
        />
      </div>
    </div>
  );
}
