import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Share2, Library, ArrowLeft, Star, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { afterHours, featuredMovies } from '../data/movies';
import { getLiveSchedule, getPastStreams, subscribeToScheduleChanges, type EPGProgram } from '../services/epgService';
import ContentRow from '../components/ContentRow';
import RateButton from '../components/RateButton';
import './MovieDetail.css';

export default function AfterHoursDetail() {
  const movie = afterHours;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [epg, setEpg] = useState<EPGProgram[]>([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'episodes' | 'schedule'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState(movie.seasons?.[0]);

  // Supabase EPG Fetching & Real-time Sync
  useEffect(() => {
    const fetchSchedule = async () => {
      const schedule = await getLiveSchedule();
      const pastStreams = await getPastStreams();
      setEpg(schedule);

      console.log('Filtering past streams from dedicated table:', pastStreams);

      const pastRecordings = pastStreams.map((ps, idx) => {
        // Find programs whose scheduled time overlaps at all with this VOD's actual recorded timeframe
        const associatedPrograms = schedule.filter(p => p.start < ps.end_time && p.stop > ps.start_time);

          // Only fall back to a live_schedule subtitle if:
          // 1. past_streams.subtitles_url is not set AND
          // 2. The program that has subtitles started WITHIN this recording window
          //    (started >= recording start). This prevents inheriting a previous stream's
          //    subtitle file just because that old schedule program's stop time runs into
          //    the current recording's window.
          const candidateSubtitleOwner = associatedPrograms.find(
            p => p.subtitles && p.start >= ps.start_time
          );
          const fallbackSubtitleUrl = candidateSubtitleOwner?.subtitles ?? null;

          // Find which program owns the subtitle so we can pass an offset to the player
          const subtitleOwner = ps.subtitles_url
            ? associatedPrograms.find(p => p.subtitles) // if set explicitly, still resolve the owner
            : candidateSubtitleOwner;
          const subtitleProgramStartMs = subtitleOwner ? subtitleOwner.start.getTime() : ps.start_time.getTime();

          console.log('[AfterHours] episode subtitle debug:', {
            episodeTitle: ps.title,
            subtitleUrl: ps.subtitles_url || subtitleOwner?.subtitles,
            subtitleOwnerTitle: subtitleOwner?.title ?? 'none (fallback to recording start)',
            subtitleProgramStartMs,
            recordingStartMs: ps.start_time.getTime(),
            associatedProgramTitles: associatedPrograms.map(p => p.title)
          });

          return {
            id: ps.id,
            episodeNumber: pastStreams.length - idx,
            title: ps.title,
            description: ps.description || (associatedPrograms.length > 0 ? `Includes: ${associatedPrograms.map(p => p.title).join(', ')}` : 'Recorded Broadcast'),
            thumbnail: ps.thumbnail_url || movie.thumbnail,
            videoUrl: ps.recording_url,
            duration: ps.duration_minutes ? `${ps.duration_minutes}m` : (associatedPrograms.length > 0 ? `${Math.round((associatedPrograms[associatedPrograms.length - 1].stop.getTime() - associatedPrograms[0].start.getTime()) / 60000)}m` : 'VOD'),
            subtitles: ps.subtitles_url || fallbackSubtitleUrl,
            recordingStartTimeMs: ps.start_time.getTime(),
            subtitleProgramStartMs,
            associatedPrograms: associatedPrograms.map(s => ({
              title: s.title,
              startMs: s.start.getTime(),
              stopMs: s.stop.getTime()
            }))
          };
      });

      console.log('Processed VOD recordings:', pastRecordings);

      if (movie.seasons) {
        const updatedSeason = {
          ...movie.seasons[0],
          episodes: pastRecordings.reverse() // Display newest first or oldest first? E.g. Netflix usually shows oldest = ep1 first but in UI they can be reversed. 'episodenumber' handles numbering.
        };
        setSelectedSeason(updatedSeason);
      }
    };

    fetchSchedule();
    const sub = subscribeToScheduleChanges(fetchSchedule);
    return () => {
      sub.unsubscribe();
    };
  }, [movie]);

  const handlePlayClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      navigate('/live');
    }
  };

  const handleEpisodeClick = (episode: any) => {
    navigate(`/watch/${movie.id}`, { 
      state: { 
        videoUrl: episode.videoUrl, 
        episodeTitle: episode.title, 
        subtitlesUrl: episode.subtitles,
        recordingStartTimeMs: episode.recordingStartTimeMs,
        subtitleProgramStartMs: episode.subtitleProgramStartMs,
        associatedPrograms: episode.associatedPrograms,
        episodeId: episode.id  // Unique UUID used as the watch-progress key
      } 
    });
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

          {isCurrentlyLive && currentProgram && (
            <h3 className="mdetail-live-program" style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '-10px', marginBottom: '15px' }}>
              {currentProgram.title}
            </h3>
          )}

          <div className="mdetail-meta-row">
            <span className="mdetail-meta-text">{movie.year}</span>
            <span className="mdetail-badge">{movie.ageRating}</span>
            <span className="mdetail-meta-text" style={{ color: '#e50914', fontWeight: 700 }}>{movie.duration}</span>
            <span className="mdetail-badge mdetail-badge-cam">HD</span>
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

      <div className="mdetail-tabs-section">
        <div className="mdetail-tabs">
          <button 
            className={`mdetail-tab ${activeTab === 'episodes' ? 'mdetail-tab--active' : ''}`}
            onClick={() => setActiveTab('episodes')}
          >
            Episodes
          </button>
          <button 
            className={`mdetail-tab ${activeTab === 'schedule' ? 'mdetail-tab--active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
        </div>

        <div className="mdetail-tab-content">
          {activeTab === 'episodes' ? (
            <div className="episodes-section">
               <div className="season-selector-wrapper">
                 <button className="season-selector">
                   {selectedSeason?.title} <ChevronDown size={16} />
                 </button>
               </div>

               <div className="episodes-list">
                 {selectedSeason?.episodes.length === 0 ? (
                   <div className="no-episodes-message">
                     <Library size={48} color="#333" strokeWidth={1} />
                     <p>There are no recordings available for this season yet.</p>
                     <span>Real past streams will automatically appear here once they finish processing.</span>
                   </div>
                 ) : (
                   selectedSeason?.episodes.map((episode) => (
                     <div key={episode.id} className="episode-item" onClick={() => handleEpisodeClick(episode)}>
                       <div className="episode-main">
                          <div className="episode-index">{episode.episodeNumber}</div>
                          <div className="episode-thumbnail-container">
                            <img 
                            src={episode.thumbnail} 
                            alt={episode.title} 
                            className="episode-thumbnail" 
                            onError={(e) => {
                              e.currentTarget.onerror = null; // Prevent infinite loop
                              e.currentTarget.src = movie.thumbnail;
                            }}
                          />
                            <div className="episode-play-overlay">
                               <Play size={24} fill="white" color="white" />
                            </div>
                          </div>
                          <div className="episode-info-main">
                            <div className="episode-header">
                               <h4 className="episode-title">{episode.title}</h4>
                               <span className="episode-duration">{episode.duration}</span>
                            </div>
                            <p className="episode-desc">{episode.description}</p>
                          </div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          ) : (
            <div className="epg-section">
              <h3 className="epg-title">
                <Clock size={16} /> Live Broadcast Schedule
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
          )}
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
        .mdetail-tabs-section {
          padding: 0 4vw 40px;
        }

        .mdetail-tabs {
          display: flex;
          gap: 30px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 30px;
        }

        .mdetail-tab {
          background: none;
          border: none;
          color: #a3a3a3;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 15px 0;
          cursor: pointer;
          position: relative;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: color 0.3s;
        }

        .mdetail-tab--active {
          color: white;
        }

        .mdetail-tab--active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 4px;
          background: #e50914;
          border-radius: 2px;
        }

        .season-selector-wrapper {
          margin-bottom: 25px;
        }

        .season-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.3s;
        }

        .season-selector:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .episodes-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .episode-item {
          padding: 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .episode-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .episode-main {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .episode-index {
          font-size: 1.5rem;
          color: #666;
          font-weight: 400;
          min-width: 30px;
        }

        .episode-thumbnail-container {
          position: relative;
          width: 180px;
          aspect-ratio: 16/9;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .episode-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .episode-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .episode-item:hover .episode-play-overlay {
          opacity: 1;
        }

        .episode-info-main {
          flex: 1;
        }

        .episode-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .episode-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .episode-duration {
          color: white;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .episode-desc {
          font-size: 0.9rem;
          color: #a3a3a3;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .episode-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .episode-index {
            display: none;
          }

          .episode-thumbnail-container {
            width: 100%;
          }

          .episode-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
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
        }

        .upcoming-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, rgba(229, 9, 20, 0.2), rgba(255, 255, 255, 0.1));
          color: white;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          text-transform: uppercase;
          width: fit-content;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .upcoming-status-pill svg {
          animation: starPulse 2.5s infinite ease-in-out;
        }

        @keyframes starPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 2px rgba(255,255,255,0.5)); }
          50% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 8px rgba(255,255,255,1)); }
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

        .no-episodes-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .no-episodes-message p {
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          margin: 20px 0 10px;
        }

        .no-episodes-message span {
          color: #666;
          font-size: 0.9rem;
          max-width: 300px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
