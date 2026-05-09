import { Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { getLiveSchedule, subscribeToScheduleChanges } from '../services/epgService';
import type { EPGProgram } from '../services/epgService';
import { useLanguage } from '../i18n/LanguageContext';
import './LiveStreamSection.css';

export default function LiveStreamSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [, setEpg] = useState<EPGProgram[]>([]);
  const [isCurrentlyLive, setIsCurrentlyLive] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const schedule = await getLiveSchedule();
      setEpg(schedule);
    };

    fetchSchedule();
    const sub = subscribeToScheduleChanges(fetchSchedule);
    
    // Also periodically check if we hit a live block
    const timer = setInterval(() => {
      const now = new Date();
      setEpg(currentEpg => {
        const currentProg = currentEpg.find(p => now >= p.start && now <= p.stop);
        setIsCurrentlyLive(!!currentProg);
        setCurrentProgram(currentProg || null);
        return currentEpg;
      });
    }, 1000);

    return () => {
      sub.unsubscribe();
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="live-row">
      <div className="live-row__header">
        <h2 className="live-row__title">{t('live.title')}</h2>
      </div>
      
      <div className="live-banner">
        <img 
          src="/images/AFTERHOURS-banner.png" 
          alt="After Hours" 
          className="live-banner__img" 
        />
        <div className="live-banner__overlay">
          <div className="live-banner__content">
            {isCurrentlyLive ? (
              <div className="live-badge" style={{ gap: '6px' }}>
                <div className="pulse-icon-container" style={{ transform: 'scale(0.8)' }}>
                  <div className="pulse-dot"></div>
                  <div className="pulse-ring"></div>
                </div>
                {t('live.now')}
              </div>
            ) : (
              <div className="upcoming-badge">
                <Star size={12} fill="white" />
                {t('live.premiere')}
              </div>
            )}
            <img 
              src="/images/AFTER%20HOURS-logo.png" 
              alt="After Hours" 
              className="live-banner__logo" 
            />
            {isCurrentlyLive && currentProgram && (
              <h3 style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '-10px', marginBottom: '15px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {currentProgram.title}
              </h3>
            )}
            <p className="live-banner__desc">
              {t('live.desc')}
            </p>
            <div className="live-banner__actions">
              <button 
                className="live-banner__btn live-banner__btn--primary"
                onClick={() => navigate('/live')}
              >
                <Play size={20} fill="currentColor" />
                {t('live.watch')}
              </button>
              <button 
                className="live-banner__btn live-banner__btn--secondary"
                onClick={() => navigate('/after-hours')}
              >
                {t('live.more')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
