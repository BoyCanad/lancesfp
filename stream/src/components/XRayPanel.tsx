import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, X, Maximize2, Clock, User, Info } from 'lucide-react';

import type { XRayData, XRayActor } from '../data/movies';
import { submitPollVote, getPollResults, getUserVote, type PollResult } from '../services/pollService';
import './XRayPanel.css';

interface XRayPanelProps {
  xRay: XRayData;
  currentTime: number;
  onActorClick?: (actor: XRayActor) => void;
  onBack?: () => void;
  onSeek?: (time: number) => void;
  onShowAllChange?: (show: boolean) => void;
  isPortrait?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ActorImage({ src, alt, iconSize = 24 }: { src: string; alt: string; iconSize?: number }) {
  const [errored, setErrored] = useState(false);
  if (errored || !src) {
    return (
      <div className="xray-actor-placeholder">
        <User size={iconSize} />
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setErrored(true)} />;
}

function TriviaView({ text, isPortrait }: { text: string, isPortrait: boolean }) {
  let cleanText = text.replace(/^\(\d+:\d+(?:-\d+:\d+)?\)\s*/, '');
  let title = 'Trivia';
  
  if (cleanText.startsWith('Fun Fact:')) {
    cleanText = cleanText.replace(/^Fun Fact:\s*/, '');
    title = 'Fun Fact';
  } else if (cleanText.startsWith('Trivia: Did you know?')) {
    cleanText = cleanText.replace(/^Trivia: Did you know\?\s*/, '');
    title = 'Did you know?';
  } else if (cleanText.startsWith('Trivia:')) {
    cleanText = cleanText.replace(/^Trivia:\s*/, '');
  }

  if (isPortrait) {
    return (
      <div className="xray-portrait-trivia prime-trivia-card">
        <div className="prime-trivia-header">
          <Info size={16} className="prime-trivia-icon" />
          <span>{title}</span>
        </div>
        <div className="xray-portrait-trivia-text prime-trivia-body">
          {cleanText}
        </div>
      </div>
    );
  }

  return (
    <div className="xray-panel__trivia prime-trivia-card">
      <div className="prime-trivia-header">
        <Info size={16} className="prime-trivia-icon" />
        <span>{title}</span>
      </div>
      <div className="xray-panel__trivia-text prime-trivia-body">
        {cleanText}
      </div>
    </div>
  );
}

function BonusImage({ index, onClick }: { index: number, onClick: (src: string) => void }) {
  const [src, setSrc] = useState(`https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/photos/${index}.webp`);
  const [hide, setHide] = useState(false);

  if (hide) return null;

  return (
    <img 
      src={src}
      alt={`Bonus ${index}`}
      loading="lazy"
      decoding="async"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onClick(src)}
      onError={() => {
        if (src.endsWith('.webp')) {
          setSrc(src.replace('.webp', '.jpg'));
        } else if (src.endsWith('.jpg')) {
          setSrc(src.replace('.jpg', '.png'));
        } else {
          setHide(true);
        }
      }}
    />
  );
}


function PollView({ poll, isPortrait }: { poll: { question: string, options: string[] }, isPortrait: boolean }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<PollResult[] | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      setLoading(true);
      const stored = localStorage.getItem('activeProfile');
      const profileId = stored ? JSON.parse(stored).id : 'anonymous';
      
      const vote = await getUserVote(poll.question, profileId);
      if (mounted) {
        setUserVote(vote);
      }
      
      if (vote) {
        const pollStats = await getPollResults(poll.question, poll.options);
        if (mounted) {
          setResults(pollStats);
        }
      }
      if (mounted) {
        setLoading(false);
      }
    };
    fetchResults();
    return () => { mounted = false; };
  }, [poll]);

  const handleVote = async (option: string) => {
    if (userVote || submitting) return;
    setSubmitting(true);
    const stored = localStorage.getItem('activeProfile');
    const profileId = stored ? JSON.parse(stored).id : 'anonymous';
    
    const success = await submitPollVote(poll.question, option, profileId);
    if (success) {
      setUserVote(option);
      const pollStats = await getPollResults(poll.question, poll.options);
      setResults(pollStats);
    }
    setSubmitting(false);
  };

  const containerClass = isPortrait ? "xray-portrait-poll" : "xray-panel__poll";
  const questionClass = isPortrait ? "xray-portrait-poll-question" : "xray-panel__poll-question";
  const optionsClass = isPortrait ? "xray-portrait-poll-options" : "xray-panel__poll-options";
  const optionBtnClass = isPortrait ? "xray-portrait-poll-option" : "xray-panel__poll-option";

  if (loading) {
     return (
       <div className={containerClass}>
         <p className={questionClass}>{poll.question}</p>
         <div style={{color: '#888', fontSize: '0.9rem', padding: '10px'}}>Loading...</div>
       </div>
     );
  }

  return (
    <div className={containerClass}>
      <p className={questionClass}>{poll.question}</p>
      <div className={optionsClass}>
        {results && userVote ? (
          results.map((res, oIdx) => (
            <div key={oIdx} style={{ marginBottom: '8px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${res.percentage}%`, backgroundColor: res.option === userVote ? 'rgba(0,255,131,0.3)' : 'rgba(255,255,255,0.2)', transition: 'width 0.5s ease' }} />
              <div style={{ position: 'relative', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#fff' }}>
                <span>{res.option} {res.option === userVote && '✓'}</span>
                <span style={{ fontWeight: 600 }}>{res.percentage}%</span>
              </div>
            </div>
          ))
        ) : (
          poll.options.map((opt, oIdx) => (
            <button 
              key={oIdx} 
              className={optionBtnClass} 
              onClick={() => handleVote(opt)}
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'default' : 'pointer' }}
            >
              {opt}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function XRayPanel({ xRay, currentTime, onActorClick, onSeek, onShowAllChange, isPortrait }: XRayPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'scene' | 'cast' | 'music' | 'trivia' | 'polls' | 'bonus'>('scene');
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [portraitTab, setPortraitTab] = useState<'xray' | 'bonus'>('xray');

  useEffect(() => {
    onShowAllChange?.(showAll);
  }, [showAll, onShowAllChange]);

  const activeScene = useMemo(() => {
    return xRay.scenes.find(s => currentTime >= s.start && currentTime <= s.end) || null;
  }, [xRay, currentTime]);

  const activeSongs = useMemo(() => {
    if (!activeScene?.songs) return [];
    return activeScene.songs.filter(song => {
      if (song.start === undefined || song.end === undefined) return true;
      return currentTime >= song.start && currentTime <= song.end;
    });
  }, [activeScene, currentTime]);

  const activeActors = useMemo(() => {
    if (!activeScene?.actors) return [];
    return activeScene.actors.filter(actor => {
      if (!actor.timeRanges || actor.timeRanges.length === 0) return true;
      return actor.timeRanges.some(r => currentTime >= r.start && currentTime <= r.end);
    });
  }, [activeScene, currentTime]);

  const activeTrivia = useMemo(() => {
    if (!activeScene?.trivia) return [];
    return activeScene.trivia.filter(t => {
      // support backwards compatibility with string arrays
      if (typeof t === 'string') return true;
      if (t.start === undefined || t.end === undefined) return true;
      return currentTime >= t.start && currentTime <= t.end;
    });
  }, [activeScene, currentTime]);

  const activePolls = useMemo(() => {
    if (!activeScene?.polls) return [];
    return activeScene.polls.filter(p => {
      if (p.start === undefined || p.end === undefined) return true;
      return currentTime >= p.start && currentTime <= p.end;
    });
  }, [activeScene, currentTime]);

  const allActors = useMemo(() => {
    const seen = new Set<string>();
    const result: XRayActor[] = [];
    for (const scene of xRay.scenes) {
      for (const actor of scene.actors || []) {
        if (!seen.has(actor.name)) {
          seen.add(actor.name);
          result.push(actor);
        }
      }
    }
    return result;
  }, [xRay]);

  const allSongs = useMemo(() => {
    const seen = new Set<string>();
    const result: { title: string; artist?: string; start?: number }[] = [];
    for (const scene of xRay.scenes) {
      for (const song of scene.songs || []) {
        if (!seen.has(song.title)) {
          seen.add(song.title);
          result.push({ title: song.title, artist: song.artist, start: song.start ?? scene.start });
        }
      }
    }
    return result;
  }, [xRay]);

  const allTrivia = useMemo(() => {
    const result: any[] = [];
    for (const scene of xRay.scenes) {
      if (scene.trivia) {
        result.push(...scene.trivia);
      }
    }
    return result;
  }, [xRay]);

  const allPolls = useMemo(() => {
    const result: any[] = [];
    for (const scene of xRay.scenes) {
      if (scene.polls) {
        result.push(...scene.polls);
      }
    }
    return result;
  }, [xRay]);

  const hasContent = activeSongs.length > 0 || activeActors.length > 0 || activeTrivia.length > 0 || activePolls.length > 0;

  /* ── Expanded "All" right panel ── */
  if (showAll) {
    const tabItems = activeTab === 'scene'
      ? { actors: activeActors, songs: activeSongs, trivia: activeTrivia, polls: activePolls }
      : activeTab === 'cast'
        ? { actors: allActors, songs: [], trivia: [], polls: [] }
        : activeTab === 'music'
          ? { actors: [], songs: allSongs, trivia: [], polls: [] }
          : activeTab === 'trivia'
            ? { actors: [], songs: [], trivia: allTrivia, polls: [] }
            : activeTab === 'polls'
              ? { actors: [], songs: [], trivia: [], polls: allPolls }
              : { actors: [], songs: [], trivia: [], polls: [] }; // Photos empty for now

    return (
      <div className="xray-all-overlay">
        <div className="xray-all-panel">
          {/* Header */}
          <div className="xray-all-panel__header">
            <span className="xray-all-panel__title">X-Ray</span>
            <div className="xray-all-panel__header-actions">
              <button className="xray-all-panel__icon-btn" onClick={() => setShowAll(false)}>
                <Maximize2 size={18} />
              </button>
              <button className="xray-all-panel__icon-btn" onClick={() => setShowAll(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="xray-all-panel__tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: '10px' }}>
            <button
              className={`xray-all-panel__tab ${activeTab === 'scene' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('scene')}
            >In Scene</button>
            <button
              className={`xray-all-panel__tab ${activeTab === 'cast' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('cast')}
            >Cast</button>
            <button
              className={`xray-all-panel__tab ${activeTab === 'music' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('music')}
            >Music</button>
            <button
              className={`xray-all-panel__tab ${activeTab === 'trivia' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('trivia')}
            >Trivia</button>
            <button
              className={`xray-all-panel__tab ${activeTab === 'polls' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('polls')}
            >Polls</button>
            <button
              className={`xray-all-panel__tab ${activeTab === 'bonus' ? 'xray-all-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('bonus')}
            >Bonus</button>
          </div>

          {/* Content */}
          <div className="xray-all-panel__content">
            {tabItems.actors.length > 0 && tabItems.actors.map((actor, idx) => (
              <div key={`a-${idx}`} className="xray-all-panel__row" onClick={() => onActorClick?.(actor)}>
                <div className="xray-all-panel__row-img">
                  <ActorImage src={actor.image} alt={actor.name} iconSize={24} />
                </div>
                <div className="xray-all-panel__row-info">
                  <span className="xray-all-panel__row-name">{actor.name}</span>
                  <span className="xray-all-panel__row-sub">{actor.character}</span>
                </div>
                <ChevronDown size={16} className="xray-all-panel__row-chevron" />
              </div>
            ))}

            {tabItems.songs.length > 0 && (
              <div className="xray-all-panel__section-header">Tracks ({tabItems.songs.length})</div>
            )}

            {tabItems.songs.length > 0 && tabItems.songs.map((song, idx) => {
              const isOpen = expandedSong === song.title;
              return (
                <div
                  key={`s-${idx}`}
                  className={`xray-all-panel__row xray-all-panel__row--song ${isOpen ? 'xray-all-panel__row--expanded' : ''}`}
                  onClick={() => setExpandedSong(isOpen ? null : song.title)}
                >
                  <div className="xray-all-panel__row-img xray-all-panel__row-img--music">
                    <img src="/images/artwork.webp" alt={song.title} />
                  </div>
                  <div className="xray-all-panel__row-body">
                    <div className="xray-all-panel__row-info">
                      <span className="xray-all-panel__row-name">{song.title}</span>
                      <span className="xray-all-panel__row-sub">
                        {song.start !== undefined ? `Starts at ${formatTime(song.start)}` : song.artist || ''}
                      </span>
                    </div>
                    {isOpen && song.start !== undefined && (
                      <button
                        className="xray-all-panel__jump-btn"
                        onClick={(e) => { e.stopPropagation(); onSeek?.(song.start!); }}
                      >
                        <Clock size={14} />
                        <span>Jump to scene</span>
                      </button>
                    )}
                  </div>
                  {isOpen ? <ChevronUp size={16} className="xray-all-panel__row-chevron" /> : <ChevronDown size={16} className="xray-all-panel__row-chevron" />}
                </div>
              );
            })}

            {tabItems.polls.length > 0 && (
              <div className="xray-all-panel__section-header" style={{marginTop: '20px'}}>Polls ({tabItems.polls.length})</div>
            )}
            {tabItems.polls.length > 0 && tabItems.polls.map((poll, idx) => (
              <PollView key={`all-poll-${idx}`} poll={poll} isPortrait={false} />
            ))}

            {tabItems.trivia.length > 0 && (
              <div className="xray-all-panel__section-header" style={{marginTop: '20px'}}>Trivia ({tabItems.trivia.length})</div>
            )}
            {tabItems.trivia.length > 0 && tabItems.trivia.map((t, idx) => {
              const text = typeof t === 'string' ? t : t.text;
              return <TriviaView key={`all-trivia-${idx}`} text={text} isPortrait={false} />;
            })}

            {activeTab === 'bonus' && (
               <div className="xray-all-panel__bonus-grid">
                 {[...Array(71)].map((_, i) => (
                    <BonusImage 
                      key={i} 
                      index={i + 1} 
                      onClick={(src) => setEnlargedImage(src)} 
                    />
                 ))}
               </div>
            )}

            {tabItems.actors.length === 0 && tabItems.songs.length === 0 && tabItems.trivia.length === 0 && tabItems.polls.length === 0 && activeTab !== 'bonus' && (
              <div className="xray-all-panel__empty">No data for this tab</div>
            )}
          </div>
        </div>

        {/* Lightbox for Enlarged Image */}
        {enlargedImage && (
          <div 
            className="xray-lightbox-overlay" 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEnlargedImage(null)}
          >
            <button 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
              onClick={() => setEnlargedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged bonus" 
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', userSelect: 'none' }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  /* ── Portrait layout for mobile ── */
  if (isPortrait) {
    return (
      <div className="xray-portrait-container">
        <div className="xray-portrait-handle-area">
          <div className="xray-portrait-handle"></div>
        </div>
        
        <div className="xray-portrait-scroll">
          <div className="xray-portrait-top-tabs">
            <button 
              className={`xray-portrait-tab ${portraitTab === 'xray' ? 'active' : ''}`}
              onClick={() => setPortraitTab('xray')}
            >
              X-Ray
            </button>
            <button 
              className={`xray-portrait-tab ${portraitTab === 'bonus' ? 'active' : ''}`}
              onClick={() => setPortraitTab('bonus')}
            >
              Bonus
            </button>
          </div>

          {portraitTab === 'xray' && (
            <>
              <div className="xray-portrait-section">
                <h3 className="xray-portrait-section-title">In this scene</h3>
                
                {activeSongs.length > 0 && activeSongs.map((song, idx) => (
                  <div key={idx} className="xray-portrait-row">
                    <div className="xray-portrait-song-img">
                       <img src="/images/artwork.webp" alt={song.title} />
                    </div>
                    <div className="xray-portrait-row-info">
                      <span className="xray-portrait-name">{song.title}</span>
                      <div className="xray-portrait-playing-indicator">
                        <div className="bar"></div>
                        <div className="bar"></div>
                        <div className="bar"></div>
                      </div>
                    </div>
                  </div>
                ))}

                {activePolls.length > 0 && activePolls.map((poll, idx) => (
                  <PollView key={`poll-${idx}`} poll={poll} isPortrait={true} />
                ))}

                {activeTrivia.length > 0 && activeTrivia.map((t, idx) => {
                  const text = typeof t === 'string' ? t : t.text;
                  return <TriviaView key={`trivia-${idx}`} text={text} isPortrait={true} />;
                })}

                {activeActors.length > 0 && activeActors.map((actor, idx) => (
                  <div key={idx} className="xray-portrait-row" onClick={() => onActorClick?.(actor)}>
                    <div className="xray-portrait-actor-img">
                      <ActorImage src={actor.image} alt={actor.name} />
                    </div>
                    <div className="xray-portrait-row-info">
                      <span className="xray-portrait-name">{actor.name}</span>
                      <span className="xray-portrait-sub">{actor.character}</span>
                    </div>
                    <ChevronRight size={20} className="xray-portrait-chevron" />
                  </div>
                ))}
              </div>

              <div className="xray-portrait-section">
                <h3 className="xray-portrait-section-title">Cast</h3>
                {allActors.map((actor, idx) => (
                   <div key={idx} className="xray-portrait-row" onClick={() => onActorClick?.(actor)}>
                   <div className="xray-portrait-actor-img">
                     <ActorImage src={actor.image} alt={actor.name} />
                   </div>
                   <div className="xray-portrait-row-info">
                     <span className="xray-portrait-name">{actor.name}</span>
                     <span className="xray-portrait-sub">{actor.character}</span>
                   </div>
                   <ChevronRight size={20} className="xray-portrait-chevron" />
                 </div>
                ))}
              </div>

          <div className="xray-portrait-section">
            <h3 className="xray-portrait-section-title">Music</h3>
            {allSongs.map((song, idx) => (
              <div key={idx} className="xray-portrait-row" onClick={() => song.start !== undefined && onSeek?.(song.start)}>
                <div className="xray-portrait-song-img">
                   <img src="/images/artwork.webp" alt={song.title} />
                </div>
                <div className="xray-portrait-row-info">
                  <span className="xray-portrait-name">{song.title}</span>
                  <span className="xray-portrait-sub">
                    {song.start !== undefined ? `Starts at ${formatTime(song.start)}` : song.artist || ''}
                  </span>
                </div>
                <ChevronRight size={20} className="xray-portrait-chevron" />
              </div>
            ))}
          </div>

          {allTrivia.length > 0 && (
            <div className="xray-portrait-section">
              <h3 className="xray-portrait-section-title">Trivia</h3>
              {allTrivia.map((t, idx) => {
                const text = typeof t === 'string' ? t : t.text;
                return <TriviaView key={`all-trivia-${idx}`} text={text} isPortrait={true} />;
              })}
            </div>
          )}

              {allPolls.length > 0 && (
                <div className="xray-portrait-section">
                  <h3 className="xray-portrait-section-title">Polls</h3>
                  {allPolls.map((poll, idx) => (
                    <PollView key={`all-poll-${idx}`} poll={poll} isPortrait={true} />
                  ))}
                </div>
              )}
            </>
          )}

          {portraitTab === 'bonus' && (
            <div className="xray-portrait-section">
              <h3 className="xray-portrait-section-title">Set Pics (71)</h3>
              <div className="xray-all-panel__bonus-grid" style={{ padding: 0 }}>
                 {[...Array(71)].map((_, i) => (
                    <BonusImage 
                      key={i} 
                      index={i + 1} 
                      onClick={(src) => setEnlargedImage(src)} 
                    />
                 ))}
               </div>
            </div>
          )}

        </div>

        {/* Lightbox for Enlarged Image (Portrait) */}
        {enlargedImage && (
          <div 
            className="xray-lightbox-overlay" 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEnlargedImage(null)}
          >
            <button 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
              onClick={() => setEnlargedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged bonus" 
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', userSelect: 'none' }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  /* ── Compact left panel ── */
  return (
    <div className={`xray-panel ${expanded ? 'xray-panel--expanded' : 'xray-panel--collapsed'}`}>
      <div className="xray-panel__inner">
        {/* Header */}
        <div className="xray-panel__header">
          <button
            className="xray-panel__title-btn"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="xray-panel__title">X-Ray</span>
            {expanded ? <ChevronUp size={14} className="xray-panel__chevron" /> : <ChevronDown size={14} className="xray-panel__chevron" />}
          </button>
          <span className="xray-panel__badge">IMDb</span>
          <button className="xray-panel__all-btn" onClick={() => { setShowAll(true); setActiveTab('scene'); }}>
            All <ChevronRight size={14} />
          </button>
        </div>

        {/* Scrollable Content */}
        {expanded && (
        <div className="xray-panel__scroll">
          {!hasContent && (
            <div className="xray-panel__empty">No X-Ray data at this moment</div>
          )}
          {/* Songs */}
          {activeSongs.length > 0 && (
            <div className="xray-panel__section">
              {activeSongs.map((song, idx) => (
                <div key={idx} className="xray-panel__song">
                  <div className="xray-panel__song-icon">
                    <img src="/images/artwork.webp" alt={song.title} />
                  </div>
                  <span className="xray-panel__song-title">{song.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Polls */}
          {activePolls.length > 0 && (
            <div className="xray-panel__section">
              <h4 className="xray-panel__section-title">Polls</h4>
              {activePolls.map((poll, idx) => (
                <PollView key={`poll-${idx}`} poll={poll} isPortrait={false} />
              ))}
            </div>
          )}

          {/* Trivia */}
          {activeTrivia.length > 0 && (
            <div className="xray-panel__section">
              {activeTrivia.map((t, idx) => {
                const text = typeof t === 'string' ? t : t.text;
                return <TriviaView key={`trivia-${idx}`} text={text} isPortrait={false} />;
              })}
            </div>
          )}

          {/* Actors */}
          {activeActors.length > 0 && (
            <div className="xray-panel__section">
              {activeActors.map((actor, idx) => (
                <div
                  key={idx}
                  className="xray-panel__actor"
                  onClick={() => onActorClick?.(actor)}
                >
                  <div className="xray-panel__actor-image-wrapper">
                    <ActorImage src={actor.image} alt={actor.name} iconSize={36} />

                  </div>
                  <div className="xray-panel__actor-info">
                    <span className="xray-panel__actor-name">{actor.name}</span>
                    <span className="xray-panel__actor-role">{actor.character}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
