import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { elBimboCollections, type Movie } from '../data/movies';
import { MovieCard } from '../components/ContentRow';
import BarkadaSection from '../components/BarkadaSection';
import BehindTheScenesSection from '../components/BehindTheScenesSection';
import './ElBimboCollection.css';

export default function ElBimboCollection() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Scroll parallax configurations
  const bgScale = useTransform(scrollY, [0, 600], [1, 1.15]);
  const bgY = useTransform(scrollY, [0, 600], [0, 80]);
  const contentY = useTransform(scrollY, [0, 600], [0, 50]);
  const contentOpacity = useTransform(scrollY, [0, 450], [1, 0]);

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
    <div className="collection-page" ref={containerRef}>
      {/* Dynamic Header Overlay */}
      <div className={`collection-header ${isScrolled ? 'collection-header--scrolled' : ''}`}>
        <button className="collection-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={28} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="collection-hero">
        <motion.div 
          className="collection-hero__bg-wrapper"
          style={{ scale: bgScale, y: bgY }}
        >
          <picture className="collection-hero__bg">
            <source media="(max-width: 768px)" srcSet="/images/collection-m.webp" />
            <img src="/images/bg.webp" alt="Ang Huling El Bimbo Collection" />
          </picture>
        </motion.div>
        
        <div className="collection-hero__overlay">
          <motion.div 
            className="collection-hero__content"
            style={{ y: contentY, opacity: contentOpacity }}
          >
            <img 
              src="/images/collection-logo.png" 
              alt="Ang Huling El Bimbo" 
              className="collection-hero__logo" 
            />
            <div className="collection-hero__meta">
              <span className="collection-hero__year">2026</span>
              <span className="collection-hero__age">PG-13</span>
              <span className="collection-hero__award">
                <img
                  src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/wreath.png"
                  alt="Award"
                  className="collection-hero__laurel"
                />
                Teatro Bonifacio Winner
              </span>
            </div>
            <p className="collection-hero__description">
              Relive the multi-awarded Philippine musical masterpiece. A nostalgic journey through friendship, love, and the bittersweet passage of time, set to the timeless songs of the Eraserheads.
            </p>
          </motion.div>
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

      {/* Barkada Section */}
      <BarkadaSection />

      {/* Behind The Scenes Section */}
      <BehindTheScenesSection />
    </div>
  );
}
