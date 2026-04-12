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
  Info,
  MessageSquareText,
  Copy,
  Gauge,
  SkipForward,
  Flag,
  Scissors,
  ThumbsUp,
  FastForward,
  Plus,
  X,
  Check
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
  const sliderRef = useRef<HTMLInputElement>(null);
  
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
  const [isExpandingTrailer, setIsExpandingTrailer] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);
  const [trailerCues, setTrailerCues] = useState<ParsedCue[]>([]);
  const [currentTrailerSubtitle, setCurrentTrailerSubtitle] = useState<string>('');
  const [isTrailerVideoVisible, setIsTrailerVideoVisible] = useState(false);
  const [is2xPressing, setIs2xPressing] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPos, setPreviewPos] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [hoverLinePos, setHoverLinePos] = useState(0);
  const [isMobileWindow, setIsMobileWindow] = useState(window.innerWidth <= 896);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobileWindow(window.innerWidth <= 896);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isExpandingTrailer) {
      if (isMobileWindow) {
        const timer = setTimeout(() => {
          setIsTrailerVideoVisible(true);
          // Force play on mobile to ensure autoplay happens after expansion
          if (trailerVideoRef.current) {
            trailerVideoRef.current.load();
            trailerVideoRef.current.play().catch(err => {
              console.error("Trailer play failed:", err);
            });
          }
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setIsTrailerVideoVisible(true);
        if (trailerVideoRef.current) {
          trailerVideoRef.current.play().catch(() => {});
        }
      }
    } else {
      setIsTrailerVideoVisible(false);
    }
  }, [isExpandingTrailer, isMobileWindow]);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const hasShownRatingRef = useRef<boolean>(false);
  const hlsManagedRef = useRef<boolean>(false);
  const hlsRef = useRef<Hls | null>(null);
  const playPendingRef = useRef<boolean>(false);
  const indicatorTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailerVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const ratingTimerRef = useRef<number | null>(null);
  const lastTriggeredRatingRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressActiveRef = useRef(false);
  const hlsPreviewRef = useRef<Hls | null>(null);
  const seekDebounceRef = useRef<number | null>(null);

  const EL_BIMBO_RATING_TIMESTAMPS = [1025, 1104, 1154, 1779, 2144, 2182];

  const triggerRating = () => {
    if (ratingTimerRef.current) window.clearTimeout(ratingTimerRef.current);
    setShowRating(true);
    ratingTimerRef.current = window.setTimeout(() => {
      setShowRating(false);
      ratingTimerRef.current = null;
    }, 7000);
  };

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
    // Special overrides for curated recommendations
    if (movie?.id === 'f2') return featuredMovies.find(m => m.id === 'f1') ?? featuredMovies[0];

    const currentIndex = featuredMovies.findIndex(m => m.id === movie?.id);
    if (currentIndex !== -1 && currentIndex < featuredMovies.length - 1) {
      return featuredMovies[currentIndex + 1];
    }
    return featuredMovies[0]; // loop back or fallback
  }, [movie]);

  const nextThreeMovies = useMemo(() => {
    // Special overrides for curated recommendations
    if (movie?.id === 'f2') {
      // End of Minsan → recommend El Bimbo Play first, then Tindahan, Alapaap
      return [
        featuredMovies.find(m => m.id === 'f1'),
        featuredMovies.find(m => m.id === 'f4'),
        featuredMovies.find(m => m.id === 'f5'),
      ].filter(Boolean) as typeof featuredMovies;
    }

    const currentIndex = featuredMovies.findIndex(m => m.id === movie?.id);
    let list = [];
    if (currentIndex !== -1) {
      for (let i = 1; i <= 3; i++) {
        let nextIndex = (currentIndex + i) % featuredMovies.length;
        list.push(featuredMovies[nextIndex]);
      }
    } else {
      list = [featuredMovies[0], featuredMovies[1], featuredMovies[2]];
    }
    return list;
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

    if (isScrubbingRef.current) return;

    hideControlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isScrubbingRef.current) {
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
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('touchmove', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isScrubbing]);


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
    const isMainVideoEnded = videoRef.current?.ended;
    
    if (showRecommendation && (isPlaying || isMainVideoEnded) && nextCountdown > 0 && !isExpandingTrailer) {
      timer = window.setInterval(() => {
        setNextCountdown(prev => {
          if (prev <= 1) {
            setIsExpandingTrailer(true);
            return 0; // stop counting
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showRecommendation, isPlaying, nextCountdown, isExpandingTrailer]);

  // Fade audio then pause main video when inline trailer takes over
  useEffect(() => {
    if (isExpandingTrailer && nextMovie?.id) {
      const video = videoRef.current;
      if (!video) return;

      // Reset trailer subtitle state
      setTrailerCues([]);
      setCurrentTrailerSubtitle('');

      // Fetch trailer subtitles if available
      if (nextMovie.trailerVttUrl) {
        fetch(nextMovie.trailerVttUrl)
          .then(res => res.text())
          .then(data => {
            const parsed = parseVTT(data);
            setTrailerCues(parsed);
          })
          .catch(err => console.error('Failed to load trailer subtitles:', err));
      }

      const startVolume = video.volume;
      const steps = 25;
      const decrement = startVolume / steps;
      let tick = 0;
      const fadeInterval = window.setInterval(() => {
        tick++;
        const next = Math.max(0, video.volume - decrement);
        video.volume = next;
        if (tick >= steps || next === 0) {
          video.volume = 0;
          video.pause();
          clearInterval(fadeInterval);
        }
      }, 800 / steps); // 800 ms total fade
      return () => {
        clearInterval(fadeInterval);
      };
    }
  }, [isExpandingTrailer, nextMovie]);

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
      triggerRating();
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
      setIsExpandingTrailer(false);
      setNextCountdown(10);
    };
  }, [videoSrc]);

  useEffect(() => {
    if (isMobileWindow || !previewVideoRef.current || !videoSrc) return;

    if (videoSrc.includes('.m3u8') && Hls.isSupported()) {
      const hlsP = new Hls({
        enableWorker: true,
        autoStartLoad: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsPreviewRef.current = hlsP;
      hlsP.attachMedia(previewVideoRef.current);
      hlsP.on(Hls.Events.MEDIA_ATTACHED, () => {
        hlsP.loadSource(videoSrc);
      });
      hlsP.on(Hls.Events.MANIFEST_PARSED, () => {
        hlsP.currentLevel = 0; // Force lowest quality chunk for instant preview
        hlsP.startLoad();
      });

      return () => {
        hlsP.destroy();
        hlsPreviewRef.current = null;
      };
    } else {
      previewVideoRef.current.src = videoSrc;
    }
  }, [videoSrc, isMobileWindow]);


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

  // Handle trailer time update for subtitles
  const handleTrailerTimeUpdate = () => {
    if (!trailerVideoRef.current) return;
    const time = trailerVideoRef.current.currentTime;
    const activeCue = trailerCues.find(cue => time >= cue.start && time <= cue.end);
    setCurrentTrailerSubtitle(activeCue ? activeCue.text : '');
  };

  const handleTrailerEnded = () => {
    // 1. Hide the video, show the static banner again
    setIsTrailerVideoVisible(false);
    
    // 2. Wait 5 seconds (user requested wait time)
    setTimeout(() => {
      if (isExpandingTrailer) {
        // 3. Trigger the cinematic cross-fade back to the video
        setIsTrailerVideoVisible(true);
        if (trailerVideoRef.current) {
          trailerVideoRef.current.currentTime = 0;
          trailerVideoRef.current.play().catch(() => {});
        }
      }
    }, 5000);
  };

  const handleDismissRecommendation = () => {
    setDismissedRecommendation(true);
    setShowRecommendation(false);
    setIsExpandingTrailer(false);
    setNextCountdown(10);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    // If in credits-shrink mode, clicking the video brings it back to full size
    if (showRecommendation) {
      handleDismissRecommendation();
      return;
    }

    const isMobile = window.innerWidth <= 896;
    
    if (isMobile) {
      const now = Date.now();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      // Double tap detection (within 300ms)
      if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
        const width = rect.width;
        // Left 40% for backward, Right 40% for forward
        if (x < width * 0.4) {
          skipBackward();
          lastTapRef.current = null; // Reset to prevent triple tap
          return;
        } else if (x > width * 0.6) {
          skipForward();
          lastTapRef.current = null;
          return;
        }
      }
      
      lastTapRef.current = { time: now, x };

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

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent bubbling to handleActivity which double-toggles
    if (!isMobileWindow) return;
    longPressTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && isPlaying) {
        isLongPressActiveRef.current = true;
        videoRef.current.playbackRate = 2;
        setIs2xPressing(true);
        if ('vibrate' in navigator) navigator.vibrate(50);
      }
    }, 500); 
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent bubbling to handleActivity
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed;
        setIs2xPressing(false);
      }
      e.preventDefault(); 
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
    if (videoRef.current && !isScrubbing) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Determine when to trigger the credits mode
      let shouldShowRecommendation = false;
      if (movie?.id === 'f1' || movie?.id === 'eb1') {
        const floorTime = Math.floor(time);
        
        // Age Rating Timestamps trigger
        if (EL_BIMBO_RATING_TIMESTAMPS.includes(floorTime) && lastTriggeredRatingRef.current !== floorTime) {
          lastTriggeredRatingRef.current = floorTime;
          triggerRating();
        }

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

  // Shared seek calculation: pure linear from wrapper rect.
  // Both the hover tooltip AND clicking use this same formula → they always match.
  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * duration;
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const lastPreviewTimeRef = useRef(0);

  const updatePreview = (clientX: number, target: HTMLElement) => {
    if (!duration || !movie) return;
    const rect = target.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    
    const time = pct * duration;
    lastPreviewTimeRef.current = time; // track for touch end
    
    const cursorPx = pct * rect.width;
    const thumbnailWidth = isMobileWindow ? 180 : 240; // smaller on mobile
    const halfWidth = thumbnailWidth / 2;
    const clampedPx = Math.max(halfWidth, Math.min(rect.width - halfWidth, cursorPx));
    
    setPreviewPos((clampedPx / rect.width) * 100);
    setHoverLinePos(pct * 100);
    setPreviewTime(time);
    setIsScrubbing(true);
    isScrubbingRef.current = true;
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    // For mobile, visually move the progress bar thumb while dragging
    if (isMobileWindow) {
      setCurrentTime(time);
    }
    
    setShowPreview(true);
    
    if (previewVideoRef.current) {
      if (seekDebounceRef.current) window.clearTimeout(seekDebounceRef.current);
      seekDebounceRef.current = window.setTimeout(() => {
        if (previewVideoRef.current) previewVideoRef.current.currentTime = time;
      }, 60);
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePreview(e.clientX, e.currentTarget);
  };

  const handleTimelineTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    updatePreview(e.touches[0].clientX, e.currentTarget);
  };

  const handleTimelineTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    updatePreview(e.touches[0].clientX, e.currentTarget);
  };

  const handleTimelineMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only hide when leaving the wrapper entirely, not when moving into overlay children.
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setShowPreview(false);
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    resetControlsTimer();
  };

  const handleTimelineTouchEnd = () => {
    setShowPreview(false);
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    // Seek main video on release
    if (videoRef.current) {
      const finalTime = lastPreviewTimeRef.current;
      videoRef.current.currentTime = finalTime;
      setCurrentTime(finalTime);
    }
    resetControlsTimer();
  };

  const formatTime = (time: number) => {
    const clamped = Math.max(0, time); // prevent -1:0-1 at video end
    const minutes = Math.floor(clamped / 60);
    const seconds = Math.floor(clamped % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Show the recommendation overlay when the video fully ends, 
    // giving the user another chance to watch the next movie even if they previously dismissed it to watch credits.
    if (!showRecommendation) {
      setDismissedRecommendation(false);
      setNextCountdown(10);
      setShowRecommendation(true);
    }
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
      
      {/* ── Old "Next Up" Recommendation Overlays (shows during countdown) ── */}
      {showRecommendation && nextMovie && (
        <>
          {/* Desktop Layout */}
          <div className={`next-up-overlay desktop-recommendation-overlay ${isExpandingTrailer ? 'trailer-expanding' : ''}`}>
            <img src={nextMovie.banner || nextMovie.cardBanner || nextMovie.thumbnail} className="next-up-bg" alt="Next Up Background" />
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
                  onClick={() => setIsExpandingTrailer(true)}
                >
                  <Play size={20} fill="white" /> Trailer in {nextCountdown}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Thumbnail Layout */}
          <div 
            className={`mobile-recommendations-overlay ${isExpandingTrailer ? 'trailer-expanding' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleDismissRecommendation();
            }}
          >
            <div 
              className="mobile-recommendations-header-area"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleDismissRecommendation();
              }}
            >
              <button className="mobile-recommendations-back" onClick={handleDismissRecommendation}>
                <ArrowLeft size={24} color="white" />
              </button>
            </div>
            <div 
              className="mobile-recommendations-content"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleDismissRecommendation();
              }}
            >
              <h3 className="mobile-recommendations-title">Check out these recommendations</h3>
              <p className="mobile-recommendations-subtitle">
                Preview in {nextCountdown} seconds
              </p>
              <div 
                className="mobile-recommendations-grid"
                onClick={(e) => e.stopPropagation()} // prevent grid area from closing
              >
                {nextThreeMovies.map((m) => (
                  <div
                    key={m.id}
                    className="mobile-recommendation-card"
                    onClick={() => navigate(`/watch/${m.id}`)}
                  >
                    <img src={m.thumbnail || m.mobileThumbnail || m.cardBanner} alt={m.title} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Inline Trailer Overlay (TrailerPlayer look) — shows when countdown hits 0 ── */}
      {isExpandingTrailer && nextMovie && (
        <div className="inline-trailer-overlay inline-trailer-overlay--visible">
        {/* Seamless Mobile Expansion: Render banner and video together for cross-fade */}
        <img 
          src={nextMovie.banner || nextMovie.mobileCardBanner || nextMovie.cardBanner || nextMovie.thumbnail} 
          className={`inline-trailer-banner ${isMobileWindow ? 'mobile-expand-animation' : ''} ${isTrailerVideoVisible ? 'fade-out' : ''}`} 
          alt="" 
        />

          {/* Render trailer video. On desktop it shows immediately, on mobile it fades in after banner expansion. */}
          {nextMovie.trailerUrl && (!isMobileWindow || isExpandingTrailer) && (
            <video
              ref={trailerVideoRef}
              className={`inline-trailer-video ${isTrailerVideoVisible ? 'fade-in' : 'hidden-video'}`}
              playsInline
              onTimeUpdate={handleTrailerTimeUpdate}
              onEnded={handleTrailerEnded}
            >
              <source src={nextMovie.trailerUrl} type="video/mp4" />
            </video>
          )}

          {/* Trailer Subtitle Overlay */}
          {currentTrailerSubtitle && isTrailerVideoVisible && (
            <div className="inline-trailer-subtitle-overlay">
              <div className="inline-trailer-subtitle-text">
                {currentTrailerSubtitle.split('\n').map((line, idx) => (
                  <span key={idx}>{line}<br /></span>
                ))}
              </div>
            </div>
          )}

          {/* Top: Back to Browse (Desktop) or X Close (Mobile) */}
          <div
            className={`inline-trailer-back ${isMobileWindow ? 'mobile-close-btn' : ''}`}
            onClick={() => {
              if (isMobileWindow) {
                 handleDismissRecommendation();
                 if (videoRef.current) {
                   videoRef.current.volume = 1;
                   videoRef.current.play().catch(() => {});
                 }
              } else {
                 navigate('/');
              }
            }}
          >
            {isMobileWindow ? (
              <div className="inline-trailer-close-circle">
                <X size={24} color="black" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <div className="inline-trailer-back-circle">
                  <ArrowLeft size={22} color="white" strokeWidth={2.5} />
                </div>
                <span className="inline-trailer-back-label">Back to Browse</span>
              </>
            )}
          </div>

          {/* Bottom Branding (Desktop Right, Mobile Left) */}
          <div className={`inline-trailer-branding ${isMobileWindow ? 'mobile-trailer-branding' : ''} fade-in-actions`}>
            {nextMovie.logo ? (
              <img src={nextMovie.logo} alt={nextMovie.title} className="inline-trailer-logo" />
            ) : (
              <h2 className="inline-trailer-title">{nextMovie.title}</h2>
            )}
            
            {/* Description (Desktop only, only during banner pause phase) */}
            {!isTrailerVideoVisible && !isMobileWindow && <p className="inline-trailer-desc">{nextMovie.description}</p>}

            <div className="inline-trailer-actions">
              <button
                className="inline-trailer-btn inline-trailer-btn--play"
                onClick={() => navigate(`/watch/${nextMovie.id}`)}
              >
                <Play size={17} fill={isMobileWindow ? "black" : "white"} color={isMobileWindow ? "black" : "white"} strokeWidth={0} /> Play
              </button>
              {isMobileWindow ? (
                <button className="inline-trailer-btn inline-trailer-btn--mylist">
                  <Plus size={18} color="white" strokeWidth={2.5} /> My List
                </button>
              ) : (
                <button
                  className="inline-trailer-btn inline-trailer-btn--info"
                  onClick={() => {
                    if (nextMovie.id === 'f2') navigate('/minsan');
                    else if (nextMovie.id === 'f1' || nextMovie.id === 'eb1') navigate('/ang-huling-el-bimbo-play');
                    else navigate('/');
                  }}
                >
                  <Info size={17} /> More Info
                </button>
              )}
            </div>
          </div>
      </div>
    )}

      <div className={`video-stage-wrapper ${showRecommendation ? 'credits-shrink' : ''} ${isExpandingTrailer ? 'trailer-expanding' : ''}`}>
        {/* Rate overlay inside the shrunken frame */}
        {showRecommendation && !isExpandingTrailer && !isMobileWindow && (
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => isLongPressActiveRef.current && e.preventDefault()}
          onError={handleVideoError}
          onEnded={handleVideoEnded}
        >
          {/* Subtitles handled by custom overlay */}
        </video>



        {/* 2X Speed Indicator */}
        {is2xPressing && isMobileWindow && (
          <div className="speed-2x-indicator">
            <div className="speed-2x-pill">
              <FastForward size={16} fill="white" strokeWidth={0} />
              <span>2X Speed</span>
            </div>
          </div>
        )}

        {/* Playback Indicators Overlay (Bubble Pop-up) - Filtered to only show for Play/Pause */}
        {activeIndicator && (activeIndicator.type === 'play' || activeIndicator.type === 'pause') && (
          <div className={`playback-indicator playback-indicator--${activeIndicator.type}`} key={activeIndicator.key}>
            <div className="indicator-icon-wrapper">
              {activeIndicator.type === 'play' && <Play size={64} fill="currentColor" />}
              {activeIndicator.type === 'pause' && <Pause size={64} fill="currentColor" />}
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
            <div 
              className="timeline-track-wrapper"
              onMouseMove={handleTimelineMouseMove}
              onMouseDown={seekFromEvent}
              onMouseLeave={handleTimelineMouseLeave}
              onTouchMove={handleTimelineTouchMove}
              onTouchStart={handleTimelineTouchStart}
              onTouchEnd={handleTimelineTouchEnd}
              style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', marginRight: '15px', cursor: 'pointer' }}
            >
              {showPreview && (
                <div 
                  className="hover-progress-line"
                  style={{
                    position: 'absolute',
                    left: `${hoverLinePos}%`,
                    width: '2px',
                    height: '8px', 
                    top: '50%',
                    backgroundColor: 'white',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />
              )}
              <div 
                className="seek-preview-overlay"
                style={{ 
                  left: `${previewPos}%`,
                  opacity: showPreview ? 1 : 0,
                  transform: `translateX(-50%) translateY(${showPreview ? '0' : '10px'})`,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                  <div className="seek-preview-frame">
                    {movie.spriteUrl && movie.spriteConfig ? (
                      <div 
                        className="preview-sprite-element"
                        style={{
                          backgroundImage: `url(${movie.spriteUrl})`,
                          backgroundPosition: (() => {
                            const config = movie.spriteConfig;
                            const index = Math.floor(previewTime / config.interval);
                            const col = index % config.cols;
                            const row = Math.floor(index / config.cols);
                            const posX = config.cols > 1 ? (col / (config.cols - 1)) * 100 : 0;
                            const posY = config.rows > 1 ? (row / (config.rows - 1)) * 100 : 0;
                            return `${posX}% ${posY}%`;
                          })(),
                          backgroundSize: `${movie.spriteConfig.cols * 100}% ${movie.spriteConfig.rows * 100}%`
                        }}
                      />
                    ) : (
                      <video
                        ref={previewVideoRef}
                        className="preview-video-element"
                        muted
                        playsInline
                        preload="auto"
                      />
                    )}
                  </div>
                  <span className="seek-preview-time">{formatTime(previewTime)}</span>
                </div>
              <input
                ref={sliderRef}
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={() => {/* seeking handled by onMouseDown on wrapper */}}
                className="timeline-slider"
                style={{
                  backgroundSize: `${(currentTime / Math.max(duration, 1)) * 100}% 100%`,
                  margin: 0,
                  pointerEvents: 'none' // wrapper handles all mouse events
                }}
              />
            </div>
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
                      <h4 className="menu-header">Audio</h4>
                      <div className="scrollable-list">
                        <ul className="menu-list">
                          <li className="menu-item active">
                            <Check size={20} className="check-icon" />
                            <span>Filipino [Original]</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="menu-section">
                      <h4 className="menu-header">Subtitles</h4>
                      <div className="scrollable-list">
                        <ul className="menu-list">
                          <li 
                            className={`menu-item ${activeSubtitle === -1 ? "active" : ""}`}
                            onClick={() => handleSubtitleChange(-1)}
                          >
                            {activeSubtitle === -1 && <Check size={20} className="check-icon" />}
                            {activeSubtitle !== -1 && <span className="spacer-icon" />}
                            <span>Off</span>
                          </li>
                          <li 
                            className={`menu-item ${activeSubtitle === 0 ? "active" : ""}`}
                            onClick={() => handleSubtitleChange(0)}
                          >
                            {activeSubtitle === 0 && <Check size={20} className="check-icon" />}
                            {activeSubtitle !== 0 && <span className="spacer-icon" />}
                            <span>English</span>
                          </li>
                          <li 
                            className={`menu-item ${activeSubtitle === 1 ? "active" : ""}`}
                            onClick={() => handleSubtitleChange(1)}
                          >
                            {activeSubtitle === 1 && <Check size={20} className="check-icon" />}
                            {activeSubtitle !== 1 && <span className="spacer-icon" />}
                            <span>Filipino</span>
                          </li>
                        </ul>
                      </div>
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
                  <div className="speed-menu subtitles-menu speed-slider-popover">
                    <div className="speed-slider-container">
                      <h4>Playback Speed</h4>
                      <div className="speed-track-wrapper">
                        <div className="speed-track"></div>
                        <div className="speed-marks">
                          {[0.5, 0.75, 1, 1.5, 2].map(speed => (
                            <div 
                              key={speed} 
                              className={`speed-mark ${playbackSpeed === speed ? 'active' : ''}`}
                              onClick={() => handleSpeedChange(speed)}
                            >
                              <div className="speed-dot-outer">
                                <div className="speed-dot"></div>
                              </div>
                              <span className="speed-label">
                                {speed === 1 ? '1x (Normal)' : `${speed}x`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={42} /> : <Maximize size={42} />}
              </button>
            </div>
          </div>

          {/* Mobile Bottom Fixed Row */}
            <div className="mobile-bottom-row mobile-only">
              <div className="mobile-bottom-btn">
                <Scissors size={20} />
                <span>Clip</span>
              </div>
              <div className="mobile-bottom-btn" onClick={() => { setShowSpeedMenu(true); setShowSubtitlesMenu(false); }}>
                <Gauge size={20} />
                <span>Speed ({playbackSpeed}x)</span>
              </div>
              <div className="mobile-bottom-btn" onClick={() => { setShowSubtitlesMenu(true); setShowSpeedMenu(false); }}>
                <MessageSquareText size={20} />
                <span>Audio & Subtitles</span>
              </div>
            </div>

            {/* Mobile Menu Backdrop */}
            <div 
              className={`mobile-menu-backdrop ${(showSubtitlesMenu || showSpeedMenu) && isMobileWindow ? 'show' : ''}`}
              onClick={() => { setShowSubtitlesMenu(false); setShowSpeedMenu(false); }}
            />

            {/* Mobile Subtitles Bottom Sheet */}
            {isMobileWindow && showSubtitlesMenu && (
              <div className="mobile-bottom-sheet show">
                <div className="mobile-menu-handle" onClick={() => setShowSubtitlesMenu(false)}></div>
                <div className="mobile-sheet-header">
                  <button className="close-sheet-btn" onClick={() => setShowSubtitlesMenu(false)}>
                    <X size={24} />
                  </button>
                  <div className="mobile-menu-title">Audio & Subtitles</div>
                </div>
                <div className="mobile-menu-scrollable mobile-dual-column">
                  <div className="mobile-menu-section">
                    <h4>Audio</h4>
                    <div className="mobile-scroll-container">
                      <ul className="mobile-menu-list">
                        <li className="mobile-menu-item active">
                          <div className="mobile-menu-item-left">
                            <Check size={20} className="mobile-check-icon" />
                            <span>Filipino [Original]</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mobile-menu-section">
                    <h4>Subtitles</h4>
                    <div className="mobile-scroll-container">
                      <ul className="mobile-menu-list">
                        <li 
                          className={`mobile-menu-item ${activeSubtitle === -1 ? 'active' : ''}`}
                          onClick={() => { handleSubtitleChange(-1); setShowSubtitlesMenu(false); }}
                        >
                          <div className="mobile-menu-item-left">
                            {activeSubtitle === -1 && <Check size={20} className="mobile-check-icon" />}
                            {activeSubtitle !== -1 && <div className="mobile-spacer-icon" />}
                            <span>Off</span>
                          </div>
                        </li>
                        <li 
                          className={`mobile-menu-item ${activeSubtitle === 0 ? 'active' : ''}`}
                          onClick={() => { handleSubtitleChange(0); setShowSubtitlesMenu(false); }}
                        >
                          <div className="mobile-menu-item-left">
                            {activeSubtitle === 0 && <Check size={20} className="mobile-check-icon" />}
                            {activeSubtitle !== 0 && <div className="mobile-spacer-icon" />}
                            <span>English</span>
                          </div>
                        </li>
                        <li 
                          className={`mobile-menu-item ${activeSubtitle === 1 ? 'active' : ''}`}
                          onClick={() => { handleSubtitleChange(1); setShowSubtitlesMenu(false); }}
                        >
                          <div className="mobile-menu-item-left">
                            {activeSubtitle === 1 && <Check size={20} className="mobile-check-icon" />}
                            {activeSubtitle !== 1 && <div className="mobile-spacer-icon" />}
                            <span>Filipino</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Speed Bottom Sheet */}
            {isMobileWindow && showSpeedMenu && (
              <div className="mobile-bottom-sheet mobile-speed-sheet show">
                <div className="mobile-menu-handle" onClick={() => setShowSpeedMenu(false)}></div>
                <div className="mobile-sheet-header">
                    <button className="close-sheet-btn" onClick={() => setShowSpeedMenu(false)}>
                      <X size={24} />
                    </button>
                    <div className="mobile-menu-title">Playback Speed</div>
                </div>
                <div className="speed-slider-container">
                  <div className="speed-track-wrapper">
                    <div className="speed-track"></div>
                    <div className="speed-marks">
                      {[0.5, 0.75, 1, 1.5, 2].map(speed => (
                        <div 
                          key={speed} 
                          className={`speed-mark ${playbackSpeed === speed ? 'active' : ''}`}
                          onClick={() => handleSpeedChange(speed)}
                        >
                          <div className="speed-dot-outer">
                            <div className="speed-dot"></div>
                          </div>
                          <span className="speed-label">
                            {speed === 1 ? 'Normal' : `${speed}x`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
