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
  
  // -1 means Off. 0 means the first subtitle track.
  const [activeSubtitle, setActiveSubtitle] = useState<number>(0);
  
  const hideControlsTimeoutRef = useRef<number | null>(null);

  // Mock Data fallback
  const movie = featuredMovies.find(m => m.id === id || (id && m.title.toLowerCase().includes(id))) || featuredMovies[0];
  const title = movie?.title || "Ang Huling El Bimbo";
  
  // Determine if it's a movie or series
  // For now, let's assume if it has 'h' in duration or is one of the featured musicals, it's a movie
  const isMovie = movie?.duration?.includes('h') || movie?.id?.startsWith('f') || movie?.id === 'eb1';
  
  const seasonAndEpisode = isMovie ? "" : "S1:E1";
  const episodeTitle = isMovie ? "" : (movie?.title || "Minsan");
  
  // Use movie.videoUrl if available, otherwise fallback to the mock sample
  const videoSrc = movie?.videoUrl || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

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
    if (videoRef.current) {
      if (videoSrc.includes('.m3u8')) {
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls?.loadSource(videoSrc);
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Ready to play
            setVideoError(null);
          });
          
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls?.recoverMediaError();
                  break;
                default:
                  setVideoError("The video format is not supported or the source link is invalid.");
                  break;
              }
            }
          });
        } else {
          // Native support for Safari (iOS)
          videoRef.current.src = videoSrc;
        }
      } else {
        // Regular mp4 or other formats
        videoRef.current.src = videoSrc;
      }
    }
    return () => {
      if (hls) {
        hls.destroy();
      }
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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setVideoError(null);
        }).catch((error) => {
          console.error("Video play failed:", error);
          setVideoError("Unable to play video perfectly. If this is a Google Drive link, the file may be too large to stream directly without a virus scan prompt.");
          setIsPlaying(false);
        });
      }
    }
  };

  const handleVideoError = () => {
    setVideoError("The video format is not supported or the source link is invalid/restricted (like a large Google Drive file).");
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoError(null); // Clear any early errors if metadata successfully loaded
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
        crossOrigin="anonymous"
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
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
