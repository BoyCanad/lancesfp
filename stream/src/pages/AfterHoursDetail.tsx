import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Share2, Library, ArrowLeft, Star, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { afterHours, featuredMovies } from '../data/movies';
import { getLiveSchedule, subscribeToScheduleChanges, type EPGProgram } from '../services/epgService';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import './MovieDetail.css';

export default function AfterHoursDetail() {
  const movie = afterHours;
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [epg, setEpg] = useState<EPGProgram[]>([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Supabase EPG Fetching & Real-time Sync
  useEffect(() => {
    const fetchSchedule = async () => {
      const schedule = await getLiveSchedule();
      setEpg(schedule);
    };

    fetchSchedule();
    const sub = subscribeToScheduleChanges(fetchSchedule);
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handlePlayClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      navigate('/live');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const now = new Date();
  const currentProgram = epg.find(p => now >= p.start && now <= p.stop);
  const isCurrentlyLive = !!currentProgram;

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
          {isCurrentlyLive ? (
            <div className="live-status-pill">
              <div className="pulse-icon-container">
                <div className="pulse-dot"></div>
                <div className="pulse-ring"></div>
              </div>
              LIVE NOW
            </div>
          ) : (
            <div className="upcoming-status-pill">
              <Star size={14} fill="white" />
              PREMIERE
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

          {/* EPG Section */}
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

      <div className="mdetail-epg-wrapper">
        {/* EPG Section */}
        <div className="epg-section">
          <h3 className="epg-title">
            <Clock size={16} /> Schedule
          </h3>
          <div className="epg-list">
            {epg.map((prog, idx) => {
              const isLive = now >= prog.start && now <= prog.stop;
              return (
                <div key={idx} className={`epg-item ${isLive ? 'epg-item--active' : ''}`}>
                  <div className="epg-time">
                    {formatTime(prog.start)}
                  </div>
                  <div className="epg-info">
                    <div className="epg-prog-title">
                      {prog.title}
                      {isLive && <span className="epg-live-indicator">NOW PLAYING</span>}
                    </div>
                    <div className="epg-prog-desc">{prog.description}</div>
                  </div>
                </div>
              );
            })}
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
          movies={featuredMovies.slice(0, 10)}
        />
      </div>

      <style>{`
        .mdetail-epg-wrapper {
          padding: 0 4vw 40px;
          background-color: transparent;
        }

        .epg-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          max-width: 800px;
        }

        .epg-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #a3a3a3;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .epg-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .epg-item {
          display: flex;
          gap: 20px;
          opacity: 0.6;
          transition: all 0.3s;
        }

        .epg-item--active {
          opacity: 1;
        }

        .epg-time {
          font-family: monospace;
          font-weight: 700;
          color: #e50914;
          font-size: 0.95rem;
          min-width: 70px;
        }

        .epg-prog-title {
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upcoming-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #eab308 0%, #d97706 100%);
          color: white;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          box-shadow: 
            0 8px 25px rgba(234, 179, 8, 0.4),
            inset 0 0 10px rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          text-transform: uppercase;
          width: fit-content;
          position: relative;
          overflow: hidden;
        }

        .upcoming-status-pill::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(
            45deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 60%,
            transparent 100%
          );
          animation: shimmer 3s infinite;
          pointer-events: none;
        }

        @keyframes shimmer {
          0% { transform: translate(-30%, -30%); }
          100% { transform: translate(30%, 30%); }
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(229, 9, 20, 0.95);
          color: white;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          box-shadow: 
            0 8px 25px rgba(229, 9, 20, 0.5),
            inset 0 0 12px rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          text-transform: uppercase;
          width: fit-content;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .live-dot {
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          position: relative;
        }

        .live-dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          background-color: white;
          border-radius: 50%;
          filter: blur(2px);
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
          opacity: 0.6;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0.6; }
          80%, 100% { transform: scale(3.5); opacity: 0; }
        }

        .epg-live-indicator {
          background: #e50914;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 2px;
          font-weight: 900;
        }

        .epg-prog-desc {
          font-size: 0.85rem;
          color: #a3a3a3;
          line-height: 1.4;
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
