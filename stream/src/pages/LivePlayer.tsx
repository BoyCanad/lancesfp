import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Maximize, Minimize, MessageSquareText, Check, Star } from 'lucide-react';
import { getLiveSchedule, subscribeToScheduleChanges, type EPGProgram } from '../services/epgService';
import './VideoPlayer.css';
import './LivePlayer.css';

const STREAM_URL = "https://livepeercdn.studio/hls/f8a31biu1b7w4hzw/index.m3u8";

export default function LivePlayer() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [currentSubtitleUrl, setCurrentSubtitleUrl] = useState<string | null>(null);
  const [epg, setEpg] = useState<EPGProgram[]>([]);
  const [syncOffset, setSyncOffset] = useState(0);
  const [parsedCues, setParsedCues] = useState<any[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");
  const [showSettings, setShowSettings] = useState(false); // Subtitle settings panel
  const [isCurrentlyLive, setIsCurrentlyLive] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);

  const hideControlsTimerRef = useRef<number | null>(null);

  // Supabase EPG Fetching & Real-time Sync
  useEffect(() => {
    const fetchSchedule = async () => {
      const schedule = await getLiveSchedule();
      console.log('EPG Data Received from Supabase:', schedule);
      setEpg(schedule);
    };

    fetchSchedule();
    
    // Subscribe to any changes in the DB to update schedule LIVE
    const subscription = subscribeToScheduleChanges(() => {
      fetchSchedule();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // VTT Parser
  useEffect(() => {
    if (currentSubtitleUrl) {
      fetch(currentSubtitleUrl)
        .then(res => res.text())
        .then(text => {
          const parseVTT = (vttData: string) => {
            const cues: any[] = [];
            const lines = vttData.split(/\r?\n/);
            let i = 0;
            
            const timeToSeconds = (timeStr: string) => {
              const parts = timeStr.trim().split(/[:\.,]/);
              if (parts.length === 3) {
                return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 1000;
              } else if (parts.length === 4) {
                return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]) + parseInt(parts[3]) / 1000;
              }
              return 0;
            };

            while (i < lines.length) {
              const line = lines[i].trim();
              if (line.includes('-->')) {
                const parts = line.split('-->');
                const start = timeToSeconds(parts[0].trim());
                const end = timeToSeconds(parts[1].trim());
                
                i++;
                let text = '';
                while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
                  const textLine = lines[i].trim().replace(/<[^>]+>/g, '');
                  text += (text ? '\n' : '') + textLine;
                  i++;
                }
                cues.push({ start, end, text });
              } else {
                i++;
              }
            }
            return cues;
          };

          const cues = parseVTT(text);
          console.log(`Parsed ${cues.length} subtitles for ${currentSubtitleUrl}`);
          setParsedCues(cues);
        })
        .catch(err => console.error("Subtitle Fetch Error:", err));
    }
  }, [currentSubtitleUrl]);

  // High-Precision Subtitle Sync
  useEffect(() => {
    if (!epg.length) return;

    const findActiveProg = () => {
      const now = new Date();
      const currentProg = epg.find(p => now >= p.start && now <= p.stop);
      setCurrentProgram(currentProg || null);
      setIsCurrentlyLive(!!currentProg);
      if (currentProg && currentProg.subtitles !== currentSubtitleUrl) {
        setCurrentSubtitleUrl(currentProg.subtitles);
      }
    };

    findActiveProg(); // Initial check
    const progTimer = setInterval(findActiveProg, 2000);

    const syncInterval = setInterval(() => {
      if (!subtitlesEnabled || !parsedCues.length) {
        setActiveSubtitle("");
        return;
      }

      const now = new Date();
      const currentProg = epg.find(p => now >= p.start && now <= p.stop);

      if (currentProg) {
        const DEFAULT_LATENCY = -13; // Balanced early peek
        const elapsed = (now.getTime() - currentProg.start.getTime()) / 1000;
        const streamTime = elapsed - DEFAULT_LATENCY - syncOffset;

        const cue = parsedCues.find(c => streamTime >= c.start && streamTime <= c.end);
        setActiveSubtitle(cue ? cue.text : "");
      }
    }, 100);

    return () => {
      clearInterval(progTimer);
      clearInterval(syncInterval);
    };
  }, [subtitlesEnabled, parsedCues, epg, syncOffset, currentSubtitleUrl]);


  const adjustSync = (seconds: number) => {
    setSyncOffset(prev => prev + seconds);
  };

  const hlsRef = useRef<Hls | null>(null);

  const jumpToLive = () => {
    if (videoRef.current) {
      // For HLS, seeking to the very end of the seekable range usually hits the live edge
      const seekable = videoRef.current.seekable;
      if (seekable.length > 0) {
        videoRef.current.currentTime = seekable.end(seekable.length - 1);
        console.log("Jumping to Live Edge...");
      }
    }
  };

  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;

    if (video) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // Disabled for better jitter handling
          backBufferLength: 60,
          liveSyncDurationCount: 3, // Buffer at least 3 segments to smooth jitter
          liveMaxLatencyDurationCount: 10,
          manifestLoadingMaxRetry: 5,
          levelLoadingMaxRetry: 5,
        });
        hls.loadSource(STREAM_URL);
        hls.attachMedia(video);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(console.error);
          setIsPlaying(true);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = STREAM_URL;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(console.error);
          setIsPlaying(true);
        });
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    // Disable pausing on mobile to keep the live stream synchronized
    if (window.innerWidth <= 768) return;

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };


  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);

    hideControlsTimerRef.current = window.setTimeout(() => {
      // Don't hide controls if someone is currently using the settings menu
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleInteraction);
    document.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isPlaying]);

  // Robust Touch Detection (covers Phone, Tablet, and Touch-Laptops)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Guardian: Force Play if the browser tries to pause the live stream accidentally
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventPause = (_e: Event) => {
      // If we are on mobile/touch, the only way to pause should be the button.
      // If the browser pauses due to a tap/gesture, we force it back to play.
      if (isTouchDevice && isPlaying) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('pause', preventPause);
    return () => video.removeEventListener('pause', preventPause);
  }, [isTouchDevice, isPlaying]);

  const handleStageClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    if (isTouchDevice) {
      // Mobile touch: Strictly toggle UI, never touch playback
      setShowControls(prev => !prev);
    } else {
      // Desktop click: Standard play/pause
      togglePlay();
    }
  };

  const interactionLayerRef = useRef<HTMLDivElement>(null);

  // Manual non-passive listener to bypass Chrome/Safari passive limits
  useEffect(() => {
    const layer = interactionLayerRef.current;
    if (!layer) return;

    const handleTouch = (e: TouchEvent) => {
      // NOTE: We no longer call e.preventDefault() here because it blocks the 'User Gesture'
      // needed to unlock media playback on mobile browsers. 
      // Instead, we rely on our 'Guardian' Effect to instantly resume play if it pauses.
      e.stopPropagation();
      setShowControls(prev => !prev);
    };

    layer.addEventListener('touchstart', handleTouch, { passive: false });
    return () => layer.removeEventListener('touchstart', handleTouch);
  }, []);

  return (
    <div
      className={`video-player-container ${showControls || !isPlaying ? 'show-controls' : ''}`}
      ref={containerRef}
      style={{ cursor: !showControls && isPlaying ? 'none' : 'auto' }}
    >
      <div className="ambient-glow" style={{ backgroundColor: 'transparent' }} />

      <div className="video-stage-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          playsInline
          autoPlay
          muted={isMuted}
          poster="/images/after-hours.gif"
          style={{ pointerEvents: 'auto' }}
        />
        
        {/* Transparent Interaction Shield: Now with manual non-passive listener */}
        <div 
          ref={interactionLayerRef}
          className="video-interaction-layer" 
          onClick={(e) => {
            if (!isTouchDevice) handleStageClick(e);
          }} 
        />

        {/* Custom Subtitle Overlay - Now behind controls */}
        {activeSubtitle && subtitlesEnabled && (
          <div className="custom-subtitle-overlay-container">
            <div className="custom-subtitle-text">
              {activeSubtitle.split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="player-top-bar" onClick={(e) => e.stopPropagation()}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={42} />
          </button>

          <div className="mobile-top-title mobile-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <span>After Hours</span>
            {currentProgram && (
              <span style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'normal', marginTop: '2px' }}>
                {currentProgram.title}
              </span>
            )}
          </div>

          <div className="top-right-controls">
            <button className="flag-button mobile-only" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>


        <div className="player-controls-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="timeline-container" style={{ alignItems: 'center', gap: 16 }}>
            {isCurrentlyLive ? (
              <div
                className="live-player__badge"
                onClick={jumpToLive}
                style={{ flexShrink: 0, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <div className="pulse-icon-container" style={{ transform: 'scale(0.8)', marginRight: 4 }}>
                  <div className="pulse-dot"></div>
                  <div className="pulse-ring"></div>
                </div>
                LIVE NOW
              </div>
            ) : (
              <div
                className="upcoming-status-pill"
                style={{ marginBottom: 0, padding: '4px 10px', fontSize: '11px', gap: '4px' }}
              >
                <Star size={12} fill="white" />
                PREMIERE
              </div>
            )}

            <div style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: '#e50914',
                borderRadius: 2,
                width: '100%',
              }} />
            </div>
          </div>

          <div className="bottom-controls">
            <div className="vplayer-controls-left desktop-only">
              <button className="vplayer-control-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={42} fill="currentColor" /> : <Play size={42} fill="currentColor" />}
              </button>
              <div className="vplayer-volume-container">
                <button className="vplayer-control-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={42} /> : <Volume2 size={42} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="vplayer-volume-slider"
                  style={{ backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%` }}
                />
              </div>
            </div>

            <div className="title-info desktop-only">
              <span className="title-main">After Hours</span>
              {currentProgram && (
                <span className="title-episode">
                  {currentProgram.title}
                </span>
              )}
            </div>

            <div className="vplayer-controls-right desktop-only">
              <div className="subtitles-wrapper">
                <button 
                  className="vplayer-control-btn with-label tooltip" 
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <MessageSquareText size={38} color={subtitlesEnabled ? "#e50914" : "white"} />
                  <span className="tooltip-text">Subtitles</span>
                </button>
              </div>

              <button className="vplayer-control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={42} /> : <Maximize size={42} />}
              </button>
            </div>

          </div>

          {/* Mobile Bottom Fixed Row - Replicated from VideoPlayer */}
          <div className="mobile-bottom-row mobile-only">
            <div className="mobile-bottom-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </div>

            <div className="mobile-bottom-program-slot">
              <span className="mobile-program-title">
                {epg.find(p => {
                  const now = new Date();
                  return now >= p.start && now <= p.stop;
                })?.title || 'Live Broadcast'}
              </span>
            </div>

            <div className="mobile-bottom-btn" onClick={() => setShowSettings(!showSettings)}>
              <MessageSquareText size={20} />
              <span>Subtitles</span>
            </div>
          </div>
        </div>

        {/* Global Subtitle Menu Overlay */}
        {showSettings && (
          <div className="subtitles-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-section">
              <h4 className="menu-header">Sync Calibration</h4>
              <div className="sync-adjustment-container">
                <button className="sync-adj-menu-btn" onClick={() => adjustSync(-1)}>
                  <span>LATE?</span>
                  <span className="adj-val">-1s</span>
                </button>
                <div className="sync-offset-display">
                  {syncOffset > 0 ? `+${syncOffset}` : syncOffset}s
                </div>
                <button className="sync-adj-menu-btn" onClick={() => adjustSync(1)}>
                  <span>EARLY?</span>
                  <span className="adj-val">+1s</span>
                </button>
              </div>
              <button className="menu-reset-btn" onClick={() => setSyncOffset(0)}>
                Reset to Master Clock
              </button>
            </div>
            
            <div className="menu-section">
              <h4 className="menu-header">Subtitles</h4>
              <div className="scrollable-list">
                <ul className="menu-list">
                  <li 
                    className={`menu-item ${!subtitlesEnabled ? "active" : ""}`}
                    onClick={() => {
                      setSubtitlesEnabled(false);
                      setShowSettings(false);
                    }}
                  >
                    {!subtitlesEnabled && <Check size={20} className="check-icon" />}
                    {subtitlesEnabled && <span className="spacer-icon" />}
                    <span>Off</span>
                  </li>
                  {currentSubtitleUrl && (
                    <li 
                      className={`menu-item ${subtitlesEnabled ? "active" : ""}`}
                      onClick={() => {
                        setSubtitlesEnabled(true);
                        setShowSettings(false);
                      }}
                    >
                      {subtitlesEnabled && <Check size={20} className="check-icon" />}
                      {!subtitlesEnabled && <span className="spacer-icon" />}
                      <span>Filipino</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Custom Subtitle Overlay - Controlled via z-index in CSS */}
        {activeSubtitle && subtitlesEnabled && (
          <div className="custom-subtitle-overlay-container">
            <div className="custom-subtitle-text">
              {activeSubtitle.split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
