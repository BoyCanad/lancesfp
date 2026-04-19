import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Maximize, Minimize, Subtitles } from 'lucide-react';
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
  const [epg, setEpg] = useState<any[]>([]);
  const [syncOffset, setSyncOffset] = useState(0);
  const [parsedCues, setParsedCues] = useState<any[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");

  const hideControlsTimerRef = useRef<number | null>(null);

  // VTT Parser
  useEffect(() => {
    if (currentSubtitleUrl) {
      fetch(currentSubtitleUrl)
        .then(res => res.text())
        .then(text => {
          const lines = text.split('\n');

          const parseVttTime = (timeStr: string) => {
            const parts = timeStr.trim().split(/[:\.,]/);
            if (parts.length === 3) {
              // MM:SS.mmm
              return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 1000;
            } else if (parts.length === 4) {
              // HH:MM:SS.mmm
              return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]) + parseInt(parts[3]) / 1000;
            }
            return 0;
          };

          const cues: any[] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('-->')) {
              const [startStr, endStr] = line.split(' --> ');
              const textLines = [];
              let j = i + 1;
              while (j < lines.length && lines[j].trim() !== "" && !lines[j].includes('-->')) {
                textLines.push(lines[j].trim());
                j++;
              }
              cues.push({
                start: parseVttTime(startStr),
                end: parseVttTime(endStr),
                text: textLines.join(' ')
              });
              i = j - 1;
            }
          }
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

  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };

  const adjustSync = (seconds: number) => {
    setSyncOffset(prev => prev + seconds);
  };

  // EPG Fetching for Sync
  useEffect(() => {
    fetch('/epg.xml')
      .then(res => res.text())
      .then(xmlStr => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
        const programs = xmlDoc.getElementsByTagName("programme");
        const parsed: any[] = [];
        const parseDate = (str: string) => {
          const y = parseInt(str.substring(0, 4));
          const m = parseInt(str.substring(4, 6)) - 1;
          const d = parseInt(str.substring(6, 8));
          const h = parseInt(str.substring(8, 10));
          const mm = parseInt(str.substring(10, 12));
          const s = parseInt(str.substring(12, 14));
          return new Date(y, m, d, h, mm, s);
        };
        for (let i = 0; i < programs.length; i++) {
          const p = programs[i];
          parsed.push({
            title: p.getElementsByTagName("title")[0]?.textContent || "",
            start: parseDate(p.getAttribute("start") || ""),
            stop: parseDate(p.getAttribute("stop") || ""),
            subtitles: p.getAttribute("subtitles") || null,
          });
        }
        setEpg(parsed);
      });
  }, []);

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

        {activeSubtitle && (
          <div className="vplayer-subtitle-overlay">
            {activeSubtitle}
          </div>
        )}

        <div className="player-top-bar" onClick={(e) => e.stopPropagation()}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={42} />
          </button>

          <div className="mobile-top-title mobile-only">
            After Hours
          </div>

          <div className="top-right-controls">
            <button className="vplayer-control-btn mobile-only" onClick={toggleSubtitles}>
              <Subtitles size={24} color={subtitlesEnabled ? "#e50914" : "white"} />
            </button>
            <button className="flag-button mobile-only" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>

        <div
          className={`center-mobile-controls mobile-only ${showControls ? 'show' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sync-controls">
            <button className="vplayer-control-btn center-action-btn" onClick={() => adjustSync(-1)}>
              <span className="sync-label">LATE?</span>
              <span className="sync-sublabel">-1s</span>
            </button>
            <span className="sync-status">SYNC {syncOffset > 0 ? `+${syncOffset}` : syncOffset}s</span>
            <button className="vplayer-control-btn center-action-btn" onClick={() => adjustSync(1)}>
              <span className="sync-label">EARLY?</span>
              <span className="sync-sublabel">+1s</span>
            </button>
          </div>

          <button className="vplayer-control-btn center-play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" />}
          </button>

          <button className="vplayer-control-btn center-action-btn" onClick={toggleSubtitles}>
            <Subtitles size={40} color={subtitlesEnabled ? "#e50914" : "#ffffff"} />
          </button>
        </div>

        <div className="player-controls-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="timeline-container" style={{ alignItems: 'center', gap: 16 }}>
            <div
              className="live-player__badge"
              onClick={jumpToLive}
              style={{ flexShrink: 0, fontSize: '0.75rem', cursor: 'pointer' }}
            >
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
              <button className="vplayer-control-btn" style={{ marginRight: 20 }} onClick={toggleSubtitles}>
                <Subtitles size={42} color={subtitlesEnabled ? "#e50914" : "white"} />
              </button>
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
