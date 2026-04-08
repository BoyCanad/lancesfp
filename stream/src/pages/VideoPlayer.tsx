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
  const [subtitleBlobs, setSubtitleBlobs] = useState<Record<string, string>>({});
  
  const hideControlsTimeoutRef = useRef<number | null>(null);
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

  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
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

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Pre-fetch subtitles to bypass CORS constraints on <track> elements when video has crossorigin='anonymous'
  useEffect(() => {
    if (!movie?.subtitles) return;
    
    const objectUrls: string[] = [];
    
    movie.subtitles.forEach(async (sub) => {
      try {
        const response = await fetch(sub.url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/vtt' });
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.push(objectUrl);
        
        setSubtitleBlobs(prev => ({ ...prev, [sub.url]: objectUrl }));
      } catch (error) {
        console.error('Failed to load subtitle:', sub.url, error);
      }
    });

    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [movie?.subtitles]);

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
        tracks[i].mode = i === index ? 'showing' : 'hidden';
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
  const showSkipIntro = currentTime < skipTime; 

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
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onError={handleVideoError}
      >
        {!isNativePlayer && movie?.subtitles?.map((sub, index) => (
          <track
            key={index}
            kind="subtitles"
            src={subtitleBlobs[sub.url] || sub.url}
            srcLang={sub.srclang}
            label={sub.label}
            default={index === 0}
          />
        ))}
      </video>
      
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
      {showSkipIntro && (
        <button className="skip-intro-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime = skipTime; }}>
          {skipLabel}
        </button>
      )}

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
