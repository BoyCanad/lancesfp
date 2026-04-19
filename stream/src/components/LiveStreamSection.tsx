import { Play, Radio, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { afterHours } from '../data/movies';
import './LiveStreamSection.css';

export default function LiveStreamSection() {
  const navigate = useNavigate();

  return (
    <section className="live-row">
      <div className="live-row__header">
        <h2 className="live-row__title">Live Stream</h2>
      </div>
      
      <div className="live-banner">
        <img 
          src="/images/AFTER%20HOURS-banner.gif" 
          alt="After Hours" 
          className="live-banner__img" 
        />
        <div className="live-banner__overlay">
          <div className="live-banner__content">
            {afterHours.streamStatus === 'live' ? (
              <div className="live-badge">
                <div className="pulse-icon-container">
                  <div className="pulse-dot"></div>
                  <div className="pulse-ring"></div>
                </div>
                LIVE
              </div>
            ) : afterHours.streamStatus === 'scheduled' ? (
              <div className="upcoming-badge">
                <Star size={12} fill="white" />
                PREMIERE
              </div>
            ) : (
              <div className="vod-badge">
                NEW EPISODE
              </div>
            )}
            <img 
              src="/images/AFTER%20HOURS-logo.png" 
              alt="After Hours" 
              className="live-banner__logo" 
            />
            <p className="live-banner__desc">
              Join the crew for an exclusive behind-the-scenes live session. Chat, hang out, and see what happens after the show.
            </p>
            <div className="live-banner__actions">
              <button 
                className="live-banner__btn live-banner__btn--primary"
                onClick={() => navigate('/live')}
              >
                <Play size={20} fill="currentColor" />
                Watch Now
              </button>
              <button 
                className="live-banner__btn live-banner__btn--secondary"
                onClick={() => navigate('/after-hours')}
              >
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
