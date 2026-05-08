import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, X, Maximize2, Clock, User } from 'lucide-react';

import type { XRayData, XRayActor } from '../data/movies';
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

export default function XRayPanel({ xRay, currentTime, onActorClick, onSeek, onShowAllChange, isPortrait }: XRayPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'scene' | 'cast' | 'music'>('scene');
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

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

  const hasContent = activeSongs.length > 0 || activeActors.length > 0;

  /* ── Expanded "All" right panel ── */
  if (showAll) {
    const tabItems = activeTab === 'scene'
      ? { actors: activeActors, songs: activeSongs }
      : activeTab === 'cast'
        ? { actors: allActors, songs: [] }
        : { actors: [], songs: allSongs };

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
          <div className="xray-all-panel__tabs">
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

            {tabItems.actors.length === 0 && tabItems.songs.length === 0 && (
              <div className="xray-all-panel__empty">No data for this tab</div>
            )}
          </div>
        </div>
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
          <div className="xray-portrait-top-pill">
            <span className="xray-pill">X-Ray</span>
          </div>

          <div className="xray-portrait-section">
            <h3 className="xray-portrait-section-title">In this scene</h3>
            
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

            {activeScene?.trivia && (
              <div className="xray-portrait-trivia">
                <div className="xray-portrait-trivia-img">
                  {activeActors[0] ? <ActorImage src={activeActors[0].image} alt="Trivia" /> : <div className="trivia-placeholder" />}
                </div>
                <div className="xray-portrait-trivia-text">
                  <p><strong>Did you know?</strong> {activeScene.trivia}</p>
                </div>
              </div>
            )}
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
        </div>
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
