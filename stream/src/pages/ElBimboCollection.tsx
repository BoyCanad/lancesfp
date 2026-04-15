import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { elBimboCollections, type Movie } from '../data/movies';
import { MovieCard } from '../components/ContentRow';
import './ElBimboCollection.css';

export default function ElBimboCollection() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMovieClick = (movie: Movie) => {
    // Navigate to the detail page route (matching the movie ID)
    navigate(`/${movie.id}`);
  };

  return (
    <div className="collection-page">
      {/* Dynamic Header Overlay */}
      <div className={`collection-header ${isScrolled ? 'collection-header--scrolled' : ''}`}>
        <button className="collection-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={28} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="collection-hero">
        <picture className="collection-hero__bg">
          <source media="(max-width: 768px)" srcSet="/images/collection-m.png" />
          <img src="/images/collection.png" alt="Ang Huling El Bimbo Collection" />
        </picture>
        
        <div className="collection-hero__overlay">
          <div className="collection-hero__content">
            <img 
              src="/images/collection-logo.png" 
              alt="Ang Huling El Bimbo" 
              className="collection-hero__logo" 
            />
            <div className="collection-hero__meta">
              <span className="collection-hero__year">2026</span>
              <span className="collection-hero__dot">•</span>
              <span className="collection-hero__age">PG-13</span>
              <span className="collection-hero__dot">•</span>
              <span className="collection-hero__quality">Teatro Bonifacio Winner</span>
            </div>
            <p className="collection-hero__description">
              Relive the multi-awarded Philippine musical masterpiece. A nostalgic journey through friendship, love, and the bittersweet passage of time, set to the timeless songs of the Eraserheads.
            </p>
            

          </div>
        </div>
      </section>

      {/* Collection Content - Grid Layout */}
      <section className="collection-content">
        <h2 className="collection-grid__title">The Complete Collection</h2>
        <div className="collection-grid">
          {elBimboCollections.map(movie => (
            <div key={movie.id} className="collection-grid__item">
              <MovieCard 
                movie={movie} 
                onClick={handleMovieClick}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
