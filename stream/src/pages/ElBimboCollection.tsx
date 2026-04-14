import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft } from 'lucide-react';
import { elBimboCollections } from '../data/movies';
import ContentRow from '../components/ContentRow';
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
              <span className="collection-hero__age">PG-13</span>
              <span className="collection-hero__quality">4K Ultra HD</span>
            </div>
            <p className="collection-hero__description">
              Relive the multi-awarded Philippine musical masterpiece. A nostalgic journey through friendship, love, and the bittersweet passage of time, set to the timeless songs of the Eraserheads.
            </p>
            
            <div className="collection-hero__actions">
              <button 
                className="collection-hero__btn collection-hero__btn--play"
                onClick={() => navigate('/ang-huling-el-bimbo-play')}
              >
                <Play size={24} fill="currentColor" />
                Play Now
              </button>
              <button 
                className="collection-hero__btn collection-hero__btn--info"
                onClick={() => navigate('/ang-huling-el-bimbo')}
              >
                <Info size={24} />
                More Info
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Content */}
      <section className="collection-content">
        <div className="collection-section">
          <ContentRow 
            title="The Musical Scenes" 
            movies={elBimboCollections.filter(m => m.id !== 'ang-huling-el-bimbo-play')} 
          />
        </div>
        
        <div className="collection-section">
          <ContentRow 
            title="Archives & Specials" 
            movies={elBimboCollections.filter(m => m.id.includes('sy-2025'))} 
          />
        </div>
      </section>
    </div>
  );
}
