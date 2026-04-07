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
  Flag
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
  
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const hlsManagedRef = useRef<boolean>(false);
  const hlsRef = useRef<Hls | null>(null); // exposed so togglePlay can call startLoad()
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
    const handleMouseMove = () => {
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

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // HLS logic for .m3u8 streaming
  useEffect(() => {
    let hls: Hls | null = null;
    hlsManagedRef.current = false;
    hlsRef.current = null;
    playPendingRef.current = false;

    if (!videoRef.current) return;

    if (videoSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hlsManagedRef.current = true;
        setVideoError(null);

        hls = new Hls({
          enableWorker: false,
          // Don't auto-load segments — wait for user tap so the stall
          // detector never fires before play() is called.
          autoStartLoad: false,
          lowLatencyMode: false,
          maxBufferLength: 30,
        });

        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls?.loadSource(videoSrc);
          // Manifest is fetched but segment loading waits for startLoad()
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setVideoError(null);
          setIsLoading(false);
          // If user tapped before manifest finished, start loading + play now
          if (playPendingRef.current && videoRef.current) {
            playPendingRef.current = false;
            hls?.startLoad(-1);
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.warn('Deferred play (MANIFEST_PARSED) failed:', err.name);
                // Re-queue for FRAG_BUFFERED
                playPendingRef.current = true;
              });
          }
        });

        // FRAG_BUFFERED fires when the first segment is written to the SourceBuffer.
        // At this point play() will reliably succeed on all mobile browsers.
        hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
          if (data.frag.sn === 0 && playPendingRef.current && videoRef.current) {
            playPendingRef.current = false;
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.error('Deferred play (FRAG_BUFFERED) failed:', err));
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data.type, data.details);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                setVideoError("Unable to load the video stream. Please try again.");
                setIsLoading(false);
                playPendingRef.current = false;
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl') !== '') {
        // Native HLS support (Safari / iOS)
        hlsManagedRef.current = false;
        videoRef.current.src = videoSrc;
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

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (hlsManagedRef.current) {
        if (!hlsRef.current) return;
        // Start loading segments (requires user gesture context for MSE on mobile)
        hlsRef.current.startLoad(-1);
        setIsLoading(true);
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setVideoError(null);
            setIsLoading(false);
          })
          .catch((error) => {
            // play() failed — first fragment not buffered yet.
            // FRAG_BUFFERED will retry automatically.
            console.warn('play() before first frag, waiting for buffer:', error.name);
            playPendingRef.current = true;
          });
      } else {
        // MP4 / native HLS (iOS)
        videoRef.current.play()
          .then(() => { setIsPlaying(true); setVideoError(null); })
          .catch(() => {
            setVideoError("The video format is not supported or the source link is invalid.");
            setIsPlaying(false);
          });
      }
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

  const showSkipIntro = currentTime < 30; // Show skip intro for first 30 seconds

  return (
    <div className={`video-player-container ${showControls ? 'show-controls' : ''}`} ref={containerRef}>
      <video
        ref={videoRef}
        playsInline
        crossOrigin={Hls.isSupported() ? "anonymous" : undefined}
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onError={handleVideoError}
      >
        {movie?.subtitles?.map((sub, index) => (
          <track
            key={index}
            kind="subtitles"
            src={sub.url}
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
          <ArrowLeft size={32} />
        </button>
        
        <button className="flag-button tooltip">
          <Flag size={28} />
          <span className="tooltip-text tooltip-bottom">Report an issue</span>
        </button>
      </div>

      {/* Skip Intro Button */}
      {showSkipIntro && (
        <button className="skip-intro-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime = 30; }}>
          Skip Intro
        </button>
      )}

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
          <span className="time-text">-{formatTime(duration - currentTime)}</span>
        </div>

        {/* Bottom Control Bar */}
        <div className="bottom-controls">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={skipBackward}>
              <RotateCcw size={24} />
              <span className="skip-text-inside">10</span>
            </button>
            <button className="control-btn" onClick={skipForward}>
              <RotateCw size={24} />
              <span className="skip-text-inside">10</span>
            </button>
            
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={28} /> : <Volume2 size={28} />}
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

          {/* Title & Episode info */}
          <div className="title-info">
            <span className="title-main">{title}</span>
            {!isMovie && (
              <span className="title-episode">{seasonAndEpisode} {episodeTitle}</span>
            )}
          </div>

          <div className="controls-right">
            {!isMovie && (
              <button className="control-btn with-label tooltip">
                <SkipForward size={24} />
                <span className="tooltip-text">Next Episode</span>
              </button>
            )}

            {!isMovie && (
              <button className="control-btn with-label tooltip">
                <Copy size={24} />
                <span className="tooltip-text">Episodes</span>
              </button>
            )}
            
            <div className="subtitles-wrapper">
              <button className="control-btn with-label tooltip" onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}>
                <MessageSquareText size={24} />
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
              <Gauge size={24} />
            </button>

            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
