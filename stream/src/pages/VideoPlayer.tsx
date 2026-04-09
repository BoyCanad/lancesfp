import { useState, useRef, useEffect, useMemo } from 'react';
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
  Scissors,
  ThumbsUp
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNativePlayer, setIsNativePlayer] = useState(false);
  const [parsedSubtitles, setParsedSubtitles] = useState<Record<string, ParsedCue[]>>({});
  const [showRating, setShowRating] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<{ type: 'play' | 'pause' | 'forward' | 'backward'; key: number } | null>(null);
  const [ambientColor, setAmbientColor] = useState('rgba(0,0,0,0.9)');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [dismissedRecommendation, setDismissedRecommendation] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);

  
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const hasShownRatingRef = useRef<boolean>(false);
  const hlsManagedRef = useRef<boolean>(false);
  const hlsRef = useRef<Hls | null>(null);
  const playPendingRef = useRef<boolean>(false);
  const indicatorTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerIndicator = (type: 'play' | 'pause' | 'forward' | 'backward') => {
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    setActiveIndicator({ type, key: Math.random() });
    indicatorTimerRef.current = window.setTimeout(() => {
      setActiveIndicator(null);
    }, 700);
  };

  // Mock Data fallback
  const movie = featuredMovies.find(m => m.id === id || (id && m.title.toLowerCase().includes(id))) || featuredMovies[0];
  const title = movie?.title || "Ang Huling El Bimbo";
  
  const nextMovie = useMemo(() => {
    const currentIndex = featuredMovies.findIndex(m => m.id === movie?.id);
    if (currentIndex !== -1 && currentIndex < featuredMovies.length - 1) {
      return featuredMovies[currentIndex + 1];
    }
    return featuredMovies[0]; // loop back or fallback
  }, [movie]);

  
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
        setShowSpeedMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      resetControlsTimer();
    };

    window.addEventListener('mousemove', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);


  // Ambient Color Sampling for Mobile Portrait
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Sample less frequently for a smoother vibe (every 3 seconds)
        if (ctx && video.readyState >= 2) {
          try {
            ctx.drawImage(video, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            // Use a softer opacity, blending multiple scenes organically
            setAmbientColor(`rgba(${r}, ${g}, ${b}, 0.5)`);
          } catch (e) {
            // Error handling
          }
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying]);


  // Next Up Recommendation Timer
  useEffect(() => {
    let timer: number;
    if (showRecommendation && isPlaying && nextCountdown > 0) {
      timer = window.setInterval(() => {
        setNextCountdown(prev => {
          if (prev <= 1) {
            navigate(`/watch/${nextMovie.id}`);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showRecommendation, isPlaying, nextCountdown, nextMovie, navigate]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input (just in case)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]); // Need isPlaying dependency for togglePlay logic

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
          // Auto-play on load
          videoRef.current?.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.warn("Autoplay blocked or failed:", err));
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
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.warn("Native autoplay blocked:", err));
      } else {
        setVideoError("Your browser does not support HLS video streaming.");
        setIsLoading(false);
      }
    } else {
      // Regular mp4 or other formats
      hlsManagedRef.current = false;
      videoRef.current.src = videoSrc;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn("MP4 autoplay blocked:", err));
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      hlsManagedRef.current = false;
      hlsRef.current = null;
      playPendingRef.current = false;
      // Reset recommendations on new video
      setDismissedRecommendation(false);
      setShowRecommendation(false);
      setNextCountdown(10);
    };
  }, [videoSrc]);

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      // Auto-lock to landscape on mobile when entering fullscreen
      if (isFull) {
        try {
          if (window.screen.orientation && 'lock' in window.screen.orientation) {
            // @ts-ignore
            await window.screen.orientation.lock('landscape');
          }
        } catch (e) {
          console.log('Orientation lock failed:', e);
        }
      } else {
        // Unlock when exiting fullscreen
        try {
          if (window.screen.orientation && 'unlock' in window.screen.orientation) {
            window.screen.orientation.unlock();
          }
        } catch (e) {
          console.log('Orientation unlock failed:', e);
        }
      }
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
      triggerIndicator('pause');
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setVideoError(null);
          triggerIndicator('play');
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
    // If in credits-shrink mode, clicking the video brings it back to full size
    if (showRecommendation) {
      setDismissedRecommendation(true);
      setShowRecommendation(false);
      setNextCountdown(10);
      return;
    }

    const isMobile = window.innerWidth <= 896;
    
    if (isMobile) {
      // Mobile behavior: toggle controls visibility
      if (showControls) {
        setShowControls(false);
        setShowSubtitlesMenu(false);
        setShowSpeedMenu(false);
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
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Determine when to trigger the credits mode
      let shouldShowRecommendation = false;
      if (movie?.id === 'f1') {
        // Specific request: trigger at 48:30 (2910 seconds) for Ang Huling El Bimbo Play
        shouldShowRecommendation = time >= 2910;
      } else if (duration > 0 && (duration - time) <= 15) {
        // Default case: 15 seconds before the end
        shouldShowRecommendation = true;
      }
      
      if (shouldShowRecommendation && !dismissedRecommendation) {
        if (!showRecommendation) {
          setShowRecommendation(true);
        }
      } else {
        if (showRecommendation) {
          setShowRecommendation(false);
          setNextCountdown(10);
        }
      }
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
      triggerIndicator('forward');
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
      triggerIndicator('backward');
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

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
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

  const skipIds = ['f1', 'eb1', 'f4', 'f5'];
  const skipTime = skipIds.includes(movie?.id) ? 10 : 30;
  const skipLabel = skipIds.includes(movie?.id) ? "Skip Logo" : "Skip Intro";

  return (
    <div className={`video-player-container ${showControls ? 'show-controls' : ''}`} ref={containerRef}>
      
      {/* GPU Accelerated Ambient Glow */}
      <div 
        className="ambient-glow"
        style={{ backgroundColor: ambientColor }}
      />

      {/* Hidden canvas for color sampling */}
      <canvas ref={canvasRef} width="1" height="1" style={{ display: 'none' }} />
      
      {/* Next Up Recommendation Overlay */}
      {showRecommendation && nextMovie && (
        <div className="next-up-overlay">
          <img src={nextMovie.banner || nextMovie.thumbnail} className="next-up-bg" alt="Next Up Background" />
          <div className="next-up-gradient"></div>
          <div className="next-up-content">
            {nextMovie.logo ? (
              <img src={nextMovie.logo} className="next-up-logo" alt={nextMovie.title} />
            ) : (
              <h2 className="next-up-title-text">{nextMovie.title}</h2>
            )}
            <p className="next-up-desc">{nextMovie.description}</p>
            <div className="next-up-buttons">
              <button 
                className="next-play-btn" 
                onClick={() => navigate(`/watch/${nextMovie.id}`)}
              >
                <Play size={20} fill="black" /> Play
              </button>
              <button 
                className="next-trailer-btn"
                onClick={() => navigate(`/watch/${nextMovie.id}`)}
              >
                <Play size={20} fill="white" /> Trailer in {nextCountdown}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`video-stage-wrapper ${showRecommendation ? 'credits-shrink' : ''}`}>
        {/* If shrinking, show Rate overlay inside the frame too */}
        {showRecommendation && (
          <div className="rate-shrunken-video">
            <span className="rate-text">Rate:</span>
            <button className="rate-btn"><ThumbsUp size={16} color="white" /></button>
          </div>
        )}

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

        {/* Playback Indicators Overlay */}
        {activeIndicator && (
          <div className={`playback-indicator playback-indicator--${activeIndicator.type}`} key={activeIndicator.key}>
            <div className="indicator-icon-wrapper">
              {activeIndicator.type === 'play' && <Play size={64} fill="currentColor" />}
              {activeIndicator.type === 'pause' && <Pause size={64} fill="currentColor" />}
              {activeIndicator.type === 'forward' && <RotateCw size={64} />}
              {activeIndicator.type === 'backward' && <RotateCcw size={64} />}
              {(activeIndicator.type === 'forward' || activeIndicator.type === 'backward') && (
                <span className="indicator-text-label">10</span>
              )}
            </div>
          </div>
        )}
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
            <button className="flag-button mobile-only" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>

        {/* Skip Intro/Logo Button */}
        {movie?.id !== 'f2' && (
          <button 
            className={`skip-intro-btn ${currentTime > 0.1 && currentTime < skipTime ? 'show' : (currentTime >= skipTime && currentTime < skipTime + 3 ? 'hide' : '')}`} 
            onClick={() => { if(videoRef.current) videoRef.current.currentTime = skipTime; }}
          >
            {skipLabel}
          </button>
        )}

        {/* Center Mobile Controls (Hidden on Desktop, Fades out automatically when buffering) */}
        <div className={`center-mobile-controls mobile-only ${showControls && !isLoading ? 'show' : ''}`}>
          <button 
            className={`control-btn center-action-btn ${activeIndicator?.type === 'backward' ? 'animate-spin-backward' : ''}`}
            onClick={skipBackward}
            key={`back-${activeIndicator?.type === 'backward' ? activeIndicator.key : 'idle'}`}
          >
            <RotateCcw size={36} />
            <span className="skip-text-inside">10</span>
          </button>
          
          <button 
            className={`control-btn center-play-btn ${(activeIndicator?.type === 'play' || activeIndicator?.type === 'pause') ? 'animate-pop' : ''}`}
            onClick={togglePlay}
            key={`play-${activeIndicator?.type === 'play' || activeIndicator?.type === 'pause' ? activeIndicator.key : 'idle'}`}
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
          </button>
          
          <button 
            className={`control-btn center-action-btn ${activeIndicator?.type === 'forward' ? 'animate-spin-forward' : ''}`}
            onClick={skipForward}
            key={`fwd-${activeIndicator?.type === 'forward' ? activeIndicator.key : 'idle'}`}
          >
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
                <button className="control-btn with-label tooltip" onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSpeedMenu(false); }}>
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

              <div className="speed-wrapper" style={{ position: 'relative' }}>
                <button 
                  className="control-btn tooltip" 
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSubtitlesMenu(false); }}
                >
                  <Gauge size={38} />
                  <span className="tooltip-text">Playback Speed</span>
                </button>
                
                {showSpeedMenu && (
                  <div className="speed-menu subtitles-menu">
                    <div className="menu-section">
                      <h4>Speed</h4>
                      <ul>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <li 
                            key={speed}
                            className={playbackSpeed === speed ? "active" : ""}
                            onClick={() => handleSpeedChange(speed)}
                          >
                            {speed === 1 ? "Normal (1x)" : `${speed}x`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

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
              <div className="mobile-bottom-btn" onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSubtitlesMenu(false); }}>
                <Gauge size={20} />
                <span>Speed ({playbackSpeed}x)</span>
                {showSpeedMenu && (
                  <div className="speed-menu subtitles-menu mobile-subtitles-menu">
                    <div className="menu-section">
                      <h4>Playback Speed</h4>
                      <ul>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <li 
                            key={speed}
                            className={playbackSpeed === speed ? "active" : ""}
                            onClick={() => handleSpeedChange(speed)}
                          >
                            {speed === 1 ? "Normal" : `${speed}x`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="mobile-bottom-btn" onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSpeedMenu(false); }}>
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
    </div>
  );
}
