import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw } from 'lucide-react';
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

  const hideControlsTimerRef = useRef<number | null>(null);



  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;

    if (video) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(STREAM_URL);
        hls.attachMedia(video);
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
      }
    };
  }, []);

  const togglePlay = () => {
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
      if (isPlaying) setShowControls(false);
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

  return (
    <div 
      className={`video-player-container ${showControls || !isPlaying ? 'show-controls' : ''}`}
      ref={containerRef}
      style={{ cursor: !showControls && isPlaying ? 'none' : 'auto' }}
    >
      <div className="ambient-glow" style={{ backgroundColor: 'transparent' }} />
      
      <div className="video-stage-wrapper" onClick={togglePlay}>
        <video
          ref={videoRef}
          className="video-element"
          playsInline
        />

        <div className="player-top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={42} />
          </button>
          
          <div className="mobile-top-title mobile-only">
            After Hours
          </div>

          <div className="top-right-controls">
            <button className="flag-button mobile-only" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>

        <div className={`center-mobile-controls mobile-only ${showControls ? 'show' : ''}`}>
          <button className="vplayer-control-btn center-action-btn">
            <RotateCcw size={40} />
          </button>
          
          <button className="vplayer-control-btn center-play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" />}
          </button>
          
          <button className="vplayer-control-btn center-action-btn">
            <RotateCw size={40} />
          </button>
        </div>

        <div className="player-controls-overlay">
          <div className="timeline-container" style={{ alignItems: 'center', gap: 16 }}>
            <div className="live-player__badge" style={{ flexShrink: 0, fontSize: '0.75rem' }}>
              <span className="live-player__dot"></span>
              LIVE
            </div>

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
            </div>

            <div className="vplayer-controls-right desktop-only">
              <button className="vplayer-control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={42} /> : <Maximize size={42} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
