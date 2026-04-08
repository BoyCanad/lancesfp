import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  MessageSquareText,
  Copy,
  Gauge,
  SkipForward,
  Flag,
  Lock,
  Scissors
} from 'lucide-react';
import { featuredMovies } from '../data/movies';
import Hls from 'hls.js';
import './VideoPlayer.css';

interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

const parseVTT = (vttData: string): ParsedCue[] => {
  const cues: ParsedCue[] = [];
  const lines = vttData.split(/\r?\n/);
  let i = 0;
  
  const timeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':');
    let secs = 0;
    if (parts.length === 3) {
      secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
      secs = parseFloat(timeStr);
    }
    return isNaN(secs) ? 0 : secs;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const start = timeToSeconds(parts[0].trim());
      const end = timeToSeconds(parts[1].trim());
      
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
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

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNativePlayer, setIsNativePlayer] = useState(false);
  const [parsedSubtitles, setParsedSubtitles] = useState<Record<string, ParsedCue[]>>({});
  const [showRating, setShowRating] = useState(false);
  
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const hasShownRatingRef = useRef<boolean>(false);
  const hlsManagedRef = useRef<boolean>(false);
  const hlsRef = useRef<Hls | null>(null);
  const playPendingRef = useRef<boolean>(false);

  // Mock Data fallback
  const movie = featuredMovies.find(m => m.id === id || (id && m.title.toLowerCase().includes(id))) || featuredMovies[0];
  const title = movie?.title || "Ang Huling El Bimbo";
  
  // Determine if it's a movie or series
  // For now, let's assume if it has 'h' in duration or is one of the featured musicals, it's a movie
  const isMovie = movie?.duration?.includes('h') || movie?.id?.startsWith('f') || movie?.id === 'eb1';
  
  const seasonAndEpisode = isMovie ? "" : "S1:E1";
  const episodeTitle = isMovie ? "" : (movie?.title || "Minsan");
  
  // Use movie.videoUrl if available, otherwise fallback to the mock sample
  const videoSrc = movie?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

  const resetControlsTimer = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSubtitlesMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      resetControlsTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    // Explicitly removed global touchstart and click to prevent conflict with native mobile tapping logic
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Show Age Rating once when playback starts
  useEffect(() => {
    if (isPlaying && !hasShownRatingRef.current) {
      hasShownRatingRef.current = true;
      setShowRating(true);
      
      const timer = setTimeout(() => {
        setShowRating(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  // Pre-fetch subtitles and parse them to bypass native OS caption styling
  useEffect(() => {
    if (!movie?.subtitles) return;
    
    movie.subtitles.forEach(async (sub) => {
      try {
        const response = await fetch(sub.url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const parsed = parseVTT(text);
        
        setParsedSubtitles(prev => ({ ...prev, [sub.url]: parsed }));
      } catch (error) {
        console.error('Failed to load subtitle:', sub.url, error);
      }
    });
  }, [movie?.subtitles]);

  useEffect(() => {
    if (!videoRef.current) return;
    const hideTracks = () => {
      const tracks = videoRef.current?.textTracks;
      if (!tracks) return;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].mode !== 'hidden') {
          tracks[i].mode = 'hidden';
        }
      }
    };
    hideTracks();
    const interval = setInterval(hideTracks, 500);
    return () => clearInterval(interval);
  }, [activeSubtitle]);

  // HLS logic for .m3u8 streaming
  useEffect(() => {
    let hls: Hls | null = null;
    hlsManagedRef.current = false;
    hlsRef.current = null;
    playPendingRef.current = false;

    if (!videoRef.current) return;

    if (videoSrc.includes('.m3u8')) {
      // First, try MSE (hls.js). This works beautifully on Android Chrome and Desktop Safari/Chrome.
      // We must not force Android to native HLS, because Android native HLS often drops video layers (black screen).
      if (Hls.isSupported()) {
        hlsManagedRef.current = true;
        setVideoError(null);
        let mediaErrorRecoveries = 0;

        hls = new Hls({
          enableWorker: false,
          autoStartLoad: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
        });

        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls?.loadSource(videoSrc);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setVideoError(null);
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data.type, data.details);

          // bufferAppendingError is usually NON-fatal — hls.js will self-recover.
          // Only trigger native fallback when it's actually fatal (codec truly incompatible).
          if (
            data.fatal && (
              data.details === 'bufferAppendError' ||
              data.details === 'bufferAppendingError'
            )
          ) {
            console.warn('[HLS] Fatal buffer append error — trying native');
            tryNativeFallback();
            return;
          }

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                if (data.details === 'bufferStalledError') {
                  hls?.startLoad();
                } else if (mediaErrorRecoveries === 0) {
                  mediaErrorRecoveries++;
                  hls?.recoverMediaError();
                } else if (mediaErrorRecoveries === 1) {
                  mediaErrorRecoveries++;
                  hls?.swapAudioCodec();
                  hls?.recoverMediaError();
                } else {
                  tryNativeFallback();
                }
                break;
              default:
                setVideoError('Unable to load the video stream. Please try again.');
                setIsLoading(false);
                playPendingRef.current = false;
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl') !== '') {
        // Native fallback for iOS Safari and missing MSE browsers
        hlsManagedRef.current = false;
        setIsNativePlayer(true);
        videoRef.current.removeAttribute('crossorigin');
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
        videoRef.current.src = videoSrc;
        videoRef.current.load();
      } else {
        setVideoError("Your browser does not support HLS video streaming.");
        setIsLoading(false);
      }
    } else {
      // Regular mp4 or other formats
      hlsManagedRef.current = false;
      videoRef.current.src = videoSrc;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      hlsManagedRef.current = false;
      hlsRef.current = null;
      playPendingRef.current = false;
    };
  }, [videoSrc]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Last-resort fallback: destroy hls.js and try native video.src playback.
  // Works on iOS Safari (native HLS) and sometimes Android Chrome.
  const tryNativeFallback = () => {
    if (!videoRef.current) return;
    console.warn('[VideoPlayer] Falling back to native src playback');
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    hlsManagedRef.current = false;
    playPendingRef.current = false;
    setIsNativePlayer(true);
    // MUST remove crossorigin before setting native src —
    // if left on, the browser makes CORS preflight requests for .ts segments.
    // If Supabase doesn't echo back Access-Control-Allow-Origin, the browser
    // blocks video frame rendering (tainted canvas) while audio continues.
    videoRef.current.removeAttribute('crossorigin');
    videoRef.current.removeAttribute('src');
    videoRef.current.load();
    videoRef.current.src = videoSrc;
    videoRef.current.load();
    videoRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setVideoError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[VideoPlayer] Native fallback also failed:', err.name);
        setVideoError('Unable to play this video on your device. The format may not be supported.');
        setIsPlaying(false);
        setIsLoading(false);
      });
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setVideoError(null);
        })
        .catch((error) => {
          console.warn('[VideoPlayer] play() failed:', error.name, {
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            errorCode: videoRef.current?.error?.code,
            src: (videoRef.current?.src || '').substring(0, 80),
          });
          if (hlsManagedRef.current) {
            if (error.name === 'NotSupportedError') {
              // Decoder cannot handle the video stream via MSE, fallback to native avplayer
              tryNativeFallback();
            } else {
              // Wait for buffer to fill up
              playPendingRef.current = true;
              setIsLoading(true);
            }
          } else {
            setVideoError('The video format is not supported or the source link is invalid.');
            setIsPlaying(false);
          }
        });
    }
  };

  const handleVideoClick = () => {
    const isMobile = window.innerWidth <= 896;
    
    if (isMobile) {
      // Mobile behavior: toggle controls visibility
      if (showControls) {
        setShowControls(false);
        setShowSubtitlesMenu(false);
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      } else {
        setShowControls(true);
        resetControlsTimer();
      }
    } else {
      // Desktop behavior: play/pause
      togglePlay();
    }
  };

  const handleVideoError = () => {
    // Suppress native error events when hls.js is in control —
    // the video element has no src initially, so browsers fire a spurious error.
    if (hlsManagedRef.current) return;
    setVideoError("The video format is not supported or the source link is invalid.");
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    // Execute any queued play intent (user tapped before hls.js was ready)
    if (playPendingRef.current && videoRef.current) {
      playPendingRef.current = false;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Deferred play failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoError(null); // Clear any early errors if metadata successfully loaded
      setIsLoading(false);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const handleSubtitleChange = (index: number) => {
    setActiveSubtitle(index);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'hidden';
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipTime = movie?.id === 'f1' || movie?.id === 'eb1' ? 10 : 30;
  const skipLabel = movie?.id === 'f1' || movie?.id === 'eb1' ? "Skip Logo" : "Skip Intro";

  return (
    <div className={`video-player-container ${showControls ? 'show-controls' : ''}`} ref={containerRef}>
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        {...(!isNativePlayer ? { crossOrigin: 'anonymous' } : {})}
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onClick={handleVideoClick}
        onDoubleClick={toggleFullscreen}
        onError={handleVideoError}
      >
        {/* Subtitles handled by custom overlay */}
      </video>
      {/* Custom Subtitle Overlay */}
      {activeSubtitle !== -1 && movie?.subtitles && parsedSubtitles[movie.subtitles[activeSubtitle]?.url] && (
        <div className="custom-subtitle-overlay-container">
          {parsedSubtitles[movie.subtitles[activeSubtitle].url]
            .filter(cue => currentTime >= cue.start && currentTime <= cue.end)
            .map((cue, idx) => (
              <div key={idx} className="custom-subtitle-text">
                {cue.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            ))}
        </div>
      )}
      
      {isLoading && !videoError && (
        <div className="player-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {videoError && (
        <div className="video-error-overlay">
          <p>{videoError}</p>
        </div>
      )}

      {/* Age Rating Overlay - Netflix Style */}
      <div className={`age-rating-overlay ${showRating ? 'show' : (hasShownRatingRef.current ? 'hide' : '')}`}>
        <div className="age-rating-content">
          <h4 className="age-rating-main">RATED {movie.ageRating}</h4>
          {movie.contentWarnings && movie.contentWarnings.length > 0 && (
            <p className="age-rating-warnings">
              {movie.contentWarnings.join(', ')}
            </p>
          )}
        </div>
      </div>
      
      {/* Top Bar Navigation */}
      <div className="player-top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={42} />
        </button>
        
        {/* Mobile Title */}
        <div className="mobile-top-title mobile-only">
          {title}
        </div>
        
        <div className="top-right-controls">
          <button className="flag-button lock-button desktop-only tooltip">
            <Flag size={38} />
            <span className="tooltip-text tooltip-bottom">Report an issue</span>
          </button>
          <button className="flag-button lock-button mobile-only">
            <Lock size={24} />
          </button>
        </div>
      </div>

      {/* Skip Intro/Logo Button */}
      <button 
        className={`skip-intro-btn ${currentTime > 0.1 && currentTime < skipTime ? 'show' : (currentTime >= skipTime && currentTime < skipTime + 3 ? 'hide' : '')}`} 
        onClick={() => { if(videoRef.current) videoRef.current.currentTime = skipTime; }}
      >
        {skipLabel}
      </button>

      {/* Center Mobile Controls (Hidden on Desktop) */}
      <div className={`center-mobile-controls mobile-only ${showControls ? 'show' : ''}`}>
        <button className="control-btn center-action-btn" onClick={skipBackward}>
          <RotateCcw size={36} />
          <span className="skip-text-inside">10</span>
        </button>
        
        <button className="control-btn center-play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
        </button>
        
        <button className="control-btn center-action-btn" onClick={skipForward}>
          <RotateCw size={36} />
          <span className="skip-text-inside">10</span>
        </button>
      </div>

      {/* Controls Overlay */}
      <div className="player-controls-overlay">
        
        {/* Timeline */}
        <div className="timeline-container">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="timeline-slider"
            style={{
              backgroundSize: `${(currentTime / Math.max(duration, 1)) * 100}% 100%`,
              marginRight: '15px'
            }}
          />
          <span className="time-text">{formatTime(duration - currentTime)}</span>
        </div>

        {/* Bottom Control Bar */}
        <div className="bottom-controls">
          <div className="controls-left desktop-only">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={42} fill="currentColor" /> : <Play size={42} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={skipBackward}>
              <RotateCcw size={38} />
              <span className="skip-text-inside">10</span>
            </button>
            <button className="control-btn" onClick={skipForward}>
              <RotateCw size={38} />
              <span className="skip-text-inside">10</span>
            </button>
            
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={42} /> : <Volume2 size={42} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{
                  backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%`
                }}
              />
            </div>
          </div>

          {/* Title & Episode info (Desktop) */}
          <div className="title-info desktop-only">
            <span className="title-main">{title}</span>
            {!isMovie && (
              <span className="title-episode">{seasonAndEpisode} {episodeTitle}</span>
            )}
          </div>

          <div className="controls-right desktop-only">
            {!isMovie && (
              <button className="control-btn with-label tooltip">
                <SkipForward size={38} />
                <span className="tooltip-text">Next Episode</span>
              </button>
            )}

            {!isMovie && (
              <button className="control-btn with-label tooltip">
                <Copy size={38} />
                <span className="tooltip-text">Episodes</span>
              </button>
            )}
            
            <div className="subtitles-wrapper">
              <button className="control-btn with-label tooltip" onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}>
                <MessageSquareText size={38} />
                <span className="tooltip-text">Subtitles / Audio</span>
              </button>
              {showSubtitlesMenu && (
                <div className="subtitles-menu">
                  <div className="menu-section">
                    <h4>Audio</h4>
                    <ul>
                      <li className="active">Filipino</li>
                    </ul>
                  </div>
                  <div className="menu-section">
                    <h4>Subtitles</h4>
                    <ul>
                      <li 
                        className={activeSubtitle === -1 ? "active" : ""}
                        onClick={() => handleSubtitleChange(-1)}
                      >
                        Off
                      </li>
                      {movie.subtitles?.map((sub, idx) => (
                        <li 
                          key={idx}
                          className={activeSubtitle === idx ? "active" : ""}
                          onClick={() => handleSubtitleChange(idx)}
                        >
                          {sub.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <button className="control-btn">
              <Gauge size={38} />
            </button>

            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={42} /> : <Maximize size={42} />}
            </button>
          </div>

          {/* Mobile Bottom Fixed Row */}
          <div className="mobile-bottom-row mobile-only">
            <div className="mobile-bottom-btn">
              <Scissors size={20} />
              <span>Clip</span>
            </div>
            <div className="mobile-bottom-btn">
              <Gauge size={20} />
              <span>Speed (1x)</span>
            </div>
            <div className="mobile-bottom-btn" onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}>
              <MessageSquareText size={20} />
              <span>Audio & Subtitles</span>
              {showSubtitlesMenu && (
                <div className="subtitles-menu mobile-subtitles-menu">
                  <div className="menu-section">
                    <h4>Audio</h4>
                    <ul>
                      <li className="active">Filipino</li>
                    </ul>
                  </div>
                  <div className="menu-section">
                    <h4>Subtitles</h4>
                    <ul>
                      <li 
                        className={activeSubtitle === -1 ? "active" : ""}
                        onClick={() => handleSubtitleChange(-1)}
                      >
                        Off
                      </li>
                      {movie.subtitles?.map((sub, idx) => (
                        <li 
                          key={idx}
                          className={activeSubtitle === idx ? "active" : ""}
                          onClick={() => handleSubtitleChange(idx)}
                        >
                          {sub.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
