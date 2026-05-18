import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import Hls from 'hls.js';
import './EmbeddedVideoPlayer.css';

interface EmbeddedVideoPlayerProps {
  videoUrl: string;
  title: string;
}

export default function EmbeddedVideoPlayer({ videoUrl, title }: EmbeddedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load video with HLS support
  useEffect(() => {
    if (!videoUrl || !videoRef.current) {
      console.error('EmbeddedVideoPlayer: Missing videoUrl or videoRef');
      setError('Invalid video URL or player not ready');
      setIsLoading(false);
      return;
    }

    console.log('EmbeddedVideoPlayer: Loading video', videoUrl);
    const video = videoRef.current;
    let hls: Hls | null = null;

    setIsLoading(true);
    setError(null);

    const handleLoad = () => {
      console.log('EmbeddedVideoPlayer: Video loaded');
      setIsLoading(false);
      video.play().then(() => {
        console.log('EmbeddedVideoPlayer: Playing');
        setIsPlaying(true);
      }).catch((err) => {
        console.error('EmbeddedVideoPlayer: Play error', err);
        setError('Failed to play video');
        setIsPlaying(false);
      });
    };

    const handleError = (e: Event) => {
      console.error('EmbeddedVideoPlayer: Video error', e);
      setError('Failed to load video');
      setIsLoading(false);
    };

    // Timeout for loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error('EmbeddedVideoPlayer: Loading timeout');
        setError('Loading timeout - video may be unavailable');
        setIsLoading(false);
      }
    }, 30000);

    video.addEventListener('error', handleError);

    if (videoUrl.includes('.m3u8') && Hls.isSupported()) {
      console.log('EmbeddedVideoPlayer: Using HLS');
      hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        fragLoadingTimeOut: 40000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        enableSoftwareAES: true
      });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('EmbeddedVideoPlayer: HLS media attached, loading source');
        if (hls) hls.loadSource(videoUrl);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('EmbeddedVideoPlayer: HLS manifest parsed');
        clearTimeout(timeoutId);
        handleLoad();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('EmbeddedVideoPlayer: HLS Error', data);
        if (data.fatal) {
          clearTimeout(timeoutId);
          setIsLoading(false);
          setError(`HLS Error: ${data.details || data.type}`);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('EmbeddedVideoPlayer: Fatal network error, trying to recover');
              if (hls) hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('EmbeddedVideoPlayer: Fatal media error, trying to recover');
              if (hls) hls.recoverMediaError();
              break;
            default:
              console.log('EmbeddedVideoPlayer: Fatal error, cannot recover');
              if (hls) hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('EmbeddedVideoPlayer: Using native HLS');
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        handleLoad();
      }, { once: true });
    } else {
      console.log('EmbeddedVideoPlayer: Using direct video source');
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        handleLoad();
      }, { once: true });
    }

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('error', handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // Update time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);


  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    resetControlsTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div
      ref={containerRef}
      className={`embedded-video-player ${showControls ? 'show-controls' : ''}`}
      onMouseMove={resetControlsTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="embedded-video"
        playsInline
        webkit-playsinline="true"
        preload="auto"
      />

      {isLoading && (
        <div className="embedded-loading">
          <div className="embedded-spinner" />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="embedded-error">
          <span className="embedded-error-icon">⚠</span>
          <span className="embedded-error-text">{error}</span>
        </div>
      )}

      <div className={`embedded-controls ${showControls ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="embedded-progress">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="embedded-seek-bar"
            style={{
              backgroundSize: `${(currentTime / Math.max(duration, 1)) * 100}% 100%`
            }}
          />
          <div className="embedded-time">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="embedded-buttons">
          <div className="embedded-buttons-left">
            <button className="embedded-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>
            <button className="embedded-btn" onClick={(e) => { e.stopPropagation(); skipBackward(); }}>
              <RotateCcw size={18} />
            </button>
            <button className="embedded-btn" onClick={(e) => { e.stopPropagation(); skipForward(); }}>
              <RotateCw size={18} />
            </button>
            <button className="embedded-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <div className="embedded-buttons-right">
            <span className="embedded-title">{title}</span>
            <button className="embedded-btn" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
