import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Share2, Library, ArrowLeft, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { afterHours, featuredMovies } from '../data/movies';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import './MovieDetail.css';

export default function AfterHoursDetail() {
  const movie = afterHours;
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlayClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      navigate('/live');
    }
  };

  const isMobile = windowWidth < 768;

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
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />

        <div className="mdetail-gradient mdetail-gradient-left" />
        <div className="mdetail-gradient mdetail-gradient-bottom" />

        <div className="mdetail-content">
          {movie.streamStatus === 'live' ? (
            <div className="live-status-pill">
              <div className="pulse-icon-container">
                <div className="pulse-dot"></div>
                <div className="pulse-ring"></div>
              </div>
              LIVE NOW
            </div>
          ) : movie.streamStatus === 'scheduled' ? (
            <div className="upcoming-status-pill">
              <Star size={14} fill="white" />
              PREMIERE
            </div>
          ) : (
            <div className="vod-status-pill">
              NEW EPISODE
            </div>
          )}

          {movie.logo ? (
            <img src={movie.logo} alt={movie.title} className="mdetail-logo" />
          ) : (
            <h1 className="mdetail-title">{movie.title}</h1>
          )}

          <div className="mdetail-meta-row">
            <span className="mdetail-meta-text">{movie.year}</span>
            <span className="mdetail-badge">{movie.ageRating}</span>
            <span className="mdetail-meta-text" style={{ color: '#e50914', fontWeight: 700 }}>{movie.duration}</span>
            <span className="mdetail-badge mdetail-badge-cam">4K</span>
            <span className="mdetail-rating">★ {movie.rating}</span>
          </div>

          <div className="mdetail-genres">
            {movie.genre.map((g) => (
              <span key={g} className="mdetail-genre-pill">{g}</span>
            ))}
          </div>

          <p className="mdetail-description">{movie.description}</p>

          <div className="mdetail-actions">
            <button onClick={handlePlayClick} className="mdetail-btn mdetail-btn-play">
              <Play size={18} fill="black" strokeWidth={0} /> Watch Live
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
              <Library size={24} color="#e50914" /> Up Next For You
            </div>
          }
          movies={featuredMovies.slice(1, 10)}
        />
      </div>

      <style>{`
        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.95) 0%, rgba(185, 8, 16, 0.95) 100%);
          color: white;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          box-shadow: 
            0 8px 25px rgba(229, 9, 20, 0.5),
            inset 0 0 10px rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          text-transform: uppercase;
          width: fit-content;
        }

        .upcoming-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #eab308 0%, #d97706 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          box-shadow: 0 4px 15px rgba(234, 179, 8, 0.4);
          width: fit-content;
          text-transform: uppercase;
        }

        .vod-status-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 25px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          width: fit-content;
        }

        .pulse-icon-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          z-index: 2;
        }

        .pulse-ring {
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          opacity: 0.6;
          animation: ringPulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }

        @keyframes ringPulse {
          0% { transform: scale(0.4); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
