import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, Mic } from 'lucide-react';
import { minsanLyrics } from '../data/minsanLyrics';
import { tindahanLyrics } from '../data/tindahanLyrics';
import './MusicPlayer.css';

// Mock lyrics data for demonstration
const mockLyrics = [
  { time: 0, text: "(Instrumental Intro)" },
  { time: 10, text: "Kamikazee, Eraserheads, Rivermaya..." },
  { time: 15, text: "Wait, this is Ang Huling El Bimbo." },
  { time: 18, text: "Kamukha mo si Paraluman" },
  { time: 22, text: "Nung tayo ay bata pa" },
  { time: 27, text: "At ang galing galing mong sumayaw" },
  { time: 32, text: "Mapa boogie man o cha cha" },
  { time: 37, text: "Ngunit ang paborito" },
  { time: 42, text: "Ay ang pagsayaw mo ng El Bimbo" },
  { time: 47, text: "Nakakaindak, nakakaaliw" },
  { time: 52, text: "Nakakatindig balahibo" },
  { time: 57, text: "Pagkagaling sa eskuwela" },
  { time: 61, text: "Ay didiretso na sa inyo" },
  { time: 66, text: "At buong maghapon ay tinuturuan mo ako" },
  { time: 71, text: "Magkahawak ang ating kamay" },
  { time: 75, text: "At walang kamalay-malay" },
  { time: 79, text: "Na tinuruan mo ang puso ko" },
  { time: 84, text: "Na umibig ng tunay" }
];

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  audioUrl: string;
  lyrics: {
    time: number;
    text: string;
    words?: { text: string; start: number; end: number }[];
  }[];
  instrumentalUrl?: string;
}

const mockSongs: Record<string, Song> = {
  'minsan': {
    id: 'minsan',
    title: 'Minsan',
    artist: 'The Ensemble',
    album: 'Ang Huling El Bimbo Play',
    artwork: 'https://boycanad.github.io/music-storage-1/Pixaloop_17_04_2026_16_30_33_8209999.mp4',
    audioUrl: 'https://boycanad.github.io/music-storage-1/Minsan.wav', // Replace with your actual file
    instrumentalUrl: 'https://boycanad.github.io/music-storage-1/minsan-inst.wav',
    lyrics: minsanLyrics
  },
  'el-bimbo': {
    id: 'el-bimbo',
    title: 'Ang Huling El Bimbo',
    artist: 'Eraserheads',
    album: 'Cutterpillow',
    artwork: '/images/huling-el-bimbo.webp',
    audioUrl: 'https://boycanad.github.io/music-storage-1/AngHulingElBimbo.mp3', // Replace with your actual file
    lyrics: mockLyrics
  },
  'tindahan': {
    id: 'tindahan',
    title: 'Tindahan ni Aling Nena',
    artist: 'The Ensemble',
    album: 'Ang Huling El Bimbo Play',
    artwork: '/images/tindahan.webp',
    audioUrl: 'https://boycanad.github.io/music-storage-1/Tindahan.wav',
    instrumentalUrl: 'https://boycanad.github.io/music-storage-1/Tindahan-inst.wav',
    lyrics: tindahanLyrics
  }
};

export interface Word {
  text: string;
  start: number;
  end: number;
}

export type ComputedLyric = {
  id?: string;
  time: number;
  endTime?: number;
  text: string;
  isInstrumental?: boolean;
  words?: Word[];
};

const MemoizedLyricLine = memo(({ lyric, isActive, isPast, currentTime, onSeek }: any) => {
  return (
    <div
      className={`lyric-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${lyric.isInstrumental ? 'instrumental-line' : ''} ${lyric.isInstrumental && !isActive ? 'hidden-instrumental' : ''}`}
      onClick={() => onSeek(lyric.time)}
    >
      {lyric.words ? (
        (() => {
          const { mainParts, subParts } = useMemo(() => {
            const words = lyric.words || [];
            const mainP: any[] = [];
            const subP: any[] = [];
            let inParens = false;
            words.forEach((w: Word) => {
              const trimmed = w.text.trim();
              if (trimmed.startsWith('(')) inParens = true;
              
              const parsed = {
                ...w,
                cleanText: w.text.replace(/[()]/g, ''),
                chars: w.text.replace(/[()]/g, '').split('')
              };
              
              if (inParens) subP.push(parsed);
              else mainP.push(parsed);
              if (trimmed.endsWith(')')) inParens = false;
            });
            return { mainParts: mainP, subParts: subP };
          }, [lyric.words]);

          const renderWord = (word: any, wIdx: number) => {
            let isCurrentlySung = false;
            let isFinished = false;
            let fillPercentage = 0;

            if (isActive) {
              isCurrentlySung = currentTime >= word.start && currentTime < word.end;
              isFinished = currentTime >= word.end;
              if (isCurrentlySung) {
                const duration = word.end - word.start;
                fillPercentage = duration > 0 ? ((currentTime - word.start) / duration) * 100 : 100;
              } else if (isFinished) {
                fillPercentage = 100;
              }
            }
            
            // Fast-path for non-active lines (prevents CPU spiking)
            // No gradients or letter calculations needed
            if (!isActive) {
              return (
                <span key={wIdx} className="lyric-word" style={{
                  position: 'relative',
                  display: 'inline-block',
                  zIndex: 1,
                  color: isPast ? '#fff' : 'inherit'
                }}>
                  {word.chars.map((char: string, i: number) => (
                    <span key={i} className="lyric-letter" style={{ color: isPast ? '#fff' : 'inherit' }}>{char}</span>
                  ))}
                </span>
              );
            }

            // High-performance React rendering for active characters without string allocations
            return (
              <span key={wIdx} className="lyric-word" style={{
                position: 'relative',
                display: 'inline-block',
                zIndex: isCurrentlySung ? 10 : 1
              }}>
                {word.chars.map((char: string, i: number) => {
                  const len = word.chars.length;
                  const charStartPercent = (i / len) * 100;
                  const charEndPercent = ((i + 1) / len) * 100;
                  const isCharLifted = !isPast && (isFinished || (isCurrentlySung && fillPercentage >= charStartPercent));
                  const letterClass = `lyric-letter${isCharLifted ? ' lifted' : ''}`;

                  const localFill = ((fillPercentage - charStartPercent) / (charEndPercent - charStartPercent)) * 100;
                  const clampedFill = Math.max(0, Math.min(100, localFill));
                  const isLocalGlowActive = isCurrentlySung && localFill > -20 && localFill < 120;

                  if (isPast) {
                    return <span key={i} className="lyric-letter" style={{ color: '#fff' }}>{char}</span>;
                  }

                  return (
                    <span key={i} className={letterClass} style={{
                      backgroundImage: `
                        linear-gradient(90deg, #fff 0%, #fff ${Math.max(0, clampedFill - 5)}%, transparent ${Math.min(100, clampedFill + 5)}%),
                        linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) 100%)
                      `,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      filter: isLocalGlowActive ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.8))' : 'none'
                    }}>{char}</span>
                  );
                })}
              </span>
            );
          };

          return (
            <div className="lyric-line-content">
              <div className="main-row">
                {mainParts.map((w: any, i: number) => renderWord(w, i))}
              </div>
              {subParts.length > 0 && (
                <div className="sub-row">
                  {subParts.map((w: any, i: number) => renderWord(w, i))}
                </div>
              )}
            </div>
          );
        })()
      ) : lyric.isInstrumental ? (
        <div className="instrumental-line">
          {(() => {
            const start = lyric.time;
            const end = lyric.endTime || (start + 5);
            const progress = Math.max(0, Math.min(1, (currentTime - start) / (end - start)));
            const isBreakActive = currentTime >= start && currentTime < end;

            return (
              <div className={`instrumental-dots ${isBreakActive ? 'active-group' : ''}`}>
                {[0, 1, 2].map((i) => {
                  const dotStart = i / 3;
                  const dotEnd = (i + 1) / 3;
                  const dotProgress = Math.max(0, Math.min(1, (progress - dotStart) / (dotEnd - dotStart)));
                  const isFinished = dotProgress === 1;

                  return (
                    <span
                      key={i}
                      className={`dot ${isFinished ? 'finished' : ''}`}
                      style={{
                        backgroundImage: `
                          linear-gradient(90deg, #fff 0%, #fff ${dotProgress * 100}%, rgba(255,255,255,0.2) ${dotProgress * 100}%)
                        `
                      }}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        lyric.text.replace(/[()]/g, '')
      )}
    </div>
  );
});

const MarqueeText = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current && textRef.current) {
        setShouldAnimate(textRef.current.offsetWidth > containerRef.current.offsetWidth);
      }
    };
    checkWidth();
    // Re-check after a small delay in case fonts are loading
    setTimeout(checkWidth, 100);
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [children]);

  return (
    <div className={`marquee-container ${className || ''}`} ref={containerRef}>
      <div className={`marquee-content ${shouldAnimate ? 'animate' : ''}`}>
        <span ref={textRef} className="marquee-part">{children}</span>
        {shouldAnimate && <span className="marquee-part duplicated">{children}</span>}
      </div>
    </div>
  );
};

export default function MusicPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLyricsScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
    }, 2500);
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Per-song ambient palette fallbacks (sampled from artwork)
  const songPalettes: Record<string, string[]> = {
    'minsan': ['rgb(60,80,55)', 'rgb(90,70,45)', 'rgb(40,55,70)', 'rgb(75,60,40)'],
    'el-bimbo': ['rgb(80,40,30)', 'rgb(50,30,60)', 'rgb(30,50,80)', 'rgb(60,50,30)'],
  };
  const [paletteColors, setPaletteColors] = useState<string[]>(
    songPalettes[id ?? ''] ?? ['rgb(50,50,70)', 'rgb(40,60,80)', 'rgb(60,40,70)', 'rgb(70,55,40)']
  );

  const song = id && mockSongs[id] ? mockSongs[id] : mockSongs['el-bimbo'];

  let effectiveArtwork = song.artwork;
  if (isMobile && song.id === 'minsan') {
    effectiveArtwork = showLyrics 
      ? '/images/minsan-sq.webp' 
      : 'https://boycanad.github.io/music-storage-1/minsan-tall.mp4';
  }

  const computedLyrics = useMemo<ComputedLyric[]>(() => {
    const extended: ComputedLyric[] = [];
    const minGap = 5; // min 5 seconds gap to count as instrumental

    if (song.lyrics.length > 0 && song.lyrics[0].time > minGap) {
      extended.push({
        id: 'intro',
        time: 0,
        endTime: song.lyrics[0].time,
        text: '•••',
        isInstrumental: true
      });
    }

    song.lyrics.forEach((lyric, idx) => {
      extended.push({ ...lyric, id: `lyric-${idx}`, isInstrumental: false });

      const nextLyric = song.lyrics[idx + 1];
      const lastWord = lyric.words && lyric.words.length > 0 ? lyric.words[lyric.words.length - 1] : null;
      const lineEndTime = lastWord ? lastWord.end : lyric.time + 3;

      if (nextLyric && (nextLyric.time - lineEndTime) > minGap + 1) {
        extended.push({
          id: `inst-${idx}`,
          time: lineEndTime + 1,
          endTime: nextLyric.time,
          text: '•••',
          isInstrumental: true
        });
      }
    });

    return extended;
  }, [song]);

  // Extract dominant colors from artwork for ambient background
  useEffect(() => {
    // Reset to per-song fallback immediately so background always has color
    const songPalettes: Record<string, string[]> = {
      'minsan': ['rgb(60,80,55)', 'rgb(90,70,45)', 'rgb(40,55,70)', 'rgb(75,60,40)'],
      'el-bimbo': ['rgb(80,40,30)', 'rgb(50,30,60)', 'rgb(30,50,80)', 'rgb(60,50,30)'],
    };
    setPaletteColors(songPalettes[song.id] ?? ['rgb(50,50,70)', 'rgb(40,60,80)', 'rgb(60,40,70)', 'rgb(70,55,40)']);

    const img = new Image();
    // No crossOrigin for local assets - setting it breaks getImageData
    img.src = song.artwork;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 64;
      canvas.height = 64;
      try {
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        // Sample 4 quadrants for color variety
        const quadrants = [
          { x: 8, y: 8 }, { x: 48, y: 8 },
          { x: 8, y: 48 }, { x: 48, y: 48 }
        ];
        const colors = quadrants.map(({ x, y }) => {
          const idx = (y * 64 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Moderate darkening for moody ambient look
          return `rgb(${Math.floor(r * 0.75)}, ${Math.floor(g * 0.75)}, ${Math.floor(b * 0.75)})`;
        });
        setPaletteColors(colors);
      } catch {
        // Canvas tainted (CORS) - fallback palette already set above
      }
    };
  }, [song.artwork, song.id]);

  useEffect(() => {
    // Reset state on song change
    setCurrentTime(0);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.log("Auto-play blocked", e);
        setIsPlaying(false);
      });
    }

    // Set Media Session metadata for OS integration (Lock screen, Control Center, etc.)
    if ('mediaSession' in navigator) {
      const songArtworkMap: Record<string, string> = {
        'minsan': '/images/minsan-sq.webp',
        'tindahan': '/images/tindahan-sq.webp',
      };
      const mediaArtwork = song.id in songArtworkMap
        ? `${window.location.origin}${songArtworkMap[song.id]}`
        : song.artwork.endsWith('.mp4')
          ? `${window.location.origin}/images/bts-minsan.webp`
          : `${window.location.origin}${song.artwork}`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [
          { src: mediaArtwork, sizes: '96x96', type: 'image/webp' },
          { src: mediaArtwork, sizes: '128x128', type: 'image/webp' },
          { src: mediaArtwork, sizes: '192x192', type: 'image/webp' },
          { src: mediaArtwork, sizes: '256x256', type: 'image/webp' },
          { src: mediaArtwork, sizes: '384x384', type: 'image/webp' },
          { src: mediaArtwork, sizes: '512x512', type: 'image/webp' },
        ]
      });

      // Hook up OS media controls to our app state
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
        audioRef.current?.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
        audioRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }

  }, [song.id, song.title, song.artist, song.album, song.artwork]);

  useEffect(() => {
    let animationFrameId: number;
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    // Scroll to center the first lyric when lyrics panel first appears
    if (!showLyrics || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const firstLyric = container.querySelector('.lyric-line') as HTMLElement;
    if (!firstLyric) return;
    const scrollTarget = firstLyric.offsetTop - (container.clientHeight / 2) + (firstLyric.clientHeight / 2);
    container.scrollTo({ top: scrollTarget, behavior: 'instant' });
  }, [showLyrics]);

  const [activeLyricId, setActiveLyricId] = useState<string | null>(null);
  const prevActiveLyricIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Auto-scroll to keep active lyric centered during playback
    // Find the primary active lyric (the first one that is active)
    let currentActiveId: string | null = null;

    for (let i = 0; i < computedLyrics.length; i++) {
      const lyric = computedLyrics[i];
      const isLastLyric = i === computedLyrics.length - 1;
      const wordsEnd = lyric.words && lyric.words.length > 0
        ? Math.max(...lyric.words.map((w_end: Word) => w_end.end))
        : (lyric.endTime || computedLyrics[i + 1]?.time || lyric.time + 4);

      const isActive = isLastLyric
        ? currentTime >= lyric.time
        : (currentTime >= lyric.time && currentTime < wordsEnd);

      if (isActive) {
        currentActiveId = lyric.id || `lyric-${i}`;
        break;
      }
    }

    if (currentActiveId !== activeLyricId) {
      setActiveLyricId(currentActiveId);
    }
  }, [currentTime, computedLyrics, activeLyricId]);

  useEffect(() => {
    if (!showLyrics || isUserScrolling) return;
    const container = lyricsContainerRef.current;
    if (!container) return;

    // A new lyric just became active (including after a null gap)
    if (activeLyricId && activeLyricId !== prevActiveLyricIdRef.current) {
      const wasInstrumental =
        prevActiveLyricIdRef.current?.startsWith('inst-') ||
        prevActiveLyricIdRef.current === 'intro';

      prevActiveLyricIdRef.current = activeLyricId;

      const scrollToActive = (behavior: ScrollBehavior = 'smooth') => {
        const activeEl = container.querySelector('.lyric-line.active') as HTMLElement;
        if (activeEl) {
          const scrollTarget = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
          container.scrollTo({ top: scrollTarget, behavior });
        }
      };

      let raf: number | undefined;
      let correctionTimer: number | undefined;

      if (wasInstrumental) {
        // Skip the premature rAF scroll — the layout is still collapsing.
        // After the 0.8s collapse animation settles, jump instantly to center.
        correctionTimer = window.setTimeout(() => scrollToActive('instant'), 850);
      } else {
        // Normal lyric transition — defer one frame for React to paint .active
        raf = requestAnimationFrame(() => scrollToActive('smooth'));
      }

      return () => {
        if (raf !== undefined) cancelAnimationFrame(raf);
        if (correctionTimer !== undefined) clearTimeout(correctionTimer);
      };
    }
  }, [activeLyricId, isUserScrolling, showLyrics]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleKaraoke = () => {
    if (!audioRef.current) return;
    const previousTime = audioRef.current.currentTime;
    const wasPlaying = !audioRef.current.paused;
    const nextMode = !isKaraokeMode;

    setIsKaraokeMode(nextMode);

    const targetSource = nextMode && song.instrumentalUrl ? song.instrumentalUrl : song.audioUrl;

    audioRef.current.src = targetSource;
    audioRef.current.load(); // Ensure source is loaded
    audioRef.current.currentTime = previousTime;

    if (wasPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed after source switch", e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`music-player-container${!showLyrics ? ' no-lyrics-mode' : ''}`} style={{
      '--c1': paletteColors[0],
      '--c2': paletteColors[1],
      '--c3': paletteColors[2],
      '--c4': paletteColors[3],
    } as React.CSSProperties}>
      {/* Hidden canvas for color extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Apple Music-style animated ambient gradient background */}
      <div className="music-player-ambient">
        {/* Extra blobs (c3, c4) rendered via a child to bypass ::before/::after limit */}
        <div className="music-player-ambient-extra" />
      </div>
      <div className="music-player-overlay" />

      <div className={`music-player-header${!showLyrics ? ' hidden-in-artwork' : ''}`}>
        <div className="mobile-header-bar">
          <button className="icon-btn close-btn" onClick={() => navigate(-1)}>
            <ChevronDown size={28} />
          </button>
          
          <div className="mobile-now-playing">
            {effectiveArtwork.endsWith('.mp4') ? (
              <video
                src={effectiveArtwork}
                className="mobile-artwork-thumb"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img src={effectiveArtwork} alt={song.title} className="mobile-artwork-thumb" />
            )}
            <div className="mobile-song-text">
              <MarqueeText className="mobile-title">{song.title}</MarqueeText>
              <MarqueeText className="mobile-artist">{song.artist}</MarqueeText>
            </div>
          </div>

          <div className="mobile-header-actions">
            <button className="icon-btn small transparent-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <button className="icon-btn small transparent-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`music-player-content ${showLyrics ? 'with-lyrics' : ''}`}>

        {/* Artwork Section */}
        <div className="artwork-section">
          <div className={`artwork-wrapper ${isPlaying ? 'playing' : ''}`}>
            {effectiveArtwork.endsWith('.mp4') ? (
              <video
                src={effectiveArtwork}
                className="artwork-img"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img src={effectiveArtwork} alt={song.title} className="artwork-img" />
            )}
          </div>

          {/* Controls Section now natively stacked under artwork */}
          <div className="music-player-footer">
            <div className="song-info">
              <div className="song-info-text-wrapper">
                <MarqueeText className="song-title">{song.title}</MarqueeText>
                <MarqueeText className="song-artist">{song.artist} — {song.album}</MarqueeText>
              </div>
              <div className="song-actions">
                <button className="icon-btn small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </button>
                <button className="icon-btn small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <span className="time current-time">{formatTime(currentTime)}</span>
              <div className="progress-bar-wrapper">
                <input
                  type="range"
                  className="progress-bar"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`
                  }}
                />
              </div>
              <span className="time total-time">-{formatTime((duration || 0) - currentTime)}</span>
            </div>
            
            {/* Lossless badge for mobile layout */}
            <div className="mobile-lossless-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
              Lossless
            </div>

            {/* Playback Controls and Volume Row */}
            <div className="bottom-controls-row">
              <div className="playback-controls">
                <button className="control-btn secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                </button>

                <button className="control-btn secondary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" /></svg>
                </button>

                <button className="control-btn primary" onClick={togglePlay}>
                  {isPlaying ? (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="play-icon"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  )}
                </button>

                <button className="control-btn secondary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" /></svg>
                </button>

                <button className="control-btn secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                </button>
              </div>

              <div className="volume-container">
                <div className="volume-time-match">
                  <button className="icon-btn small no-bg" onClick={() => setIsMuted(!isMuted)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isMuted || volume === 0 ? (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </>
                      ) : (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                <input
                  type="range"
                  className="volume-slider"
                  min="0" max="1" step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%`
                  }}
                />
                <div className="volume-time-match" />
              </div>
            </div>

            {/* Mobile Bottom Bar Actions (Replaces volume and corner buttons on mobile) */}
            <div className="mobile-bottom-bar">
              <button className={`icon-btn no-bg toggle-lyrics ${showLyrics ? 'active-text' : ''}`} onClick={() => setShowLyrics(!showLyrics)}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="12" y1="7" x2="12" y2="13" /></svg>
              </button>
              <button
                className={`icon-btn no-bg mic-toggle ${isKaraokeMode ? 'active-text' : ''}`}
                onClick={toggleKaraoke}
                title="Karaoke Mode"
              >
                <Mic size={24} color={isKaraokeMode ? "#fa2d48" : "currentColor"} fill={isKaraokeMode ? "#fa2d48" : "none"} />
              </button>
              <button className="icon-btn no-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Lyrics Section */}
        <div
          className={`lyrics-section${isUserScrolling ? ' user-scrolling' : ''}`}
          ref={lyricsContainerRef}
          onWheel={handleLyricsScroll}
          onTouchMove={handleLyricsScroll}
        >
          <div className="lyrics-padding-top" />
          {computedLyrics.map((lyric, idx) => {
              const isLastLyric = idx === computedLyrics.length - 1;
              const wordsEnd = lyric.words && lyric.words.length > 0
                ? Math.max(...lyric.words.map((w: Word) => w.end))
                : (lyric.endTime || computedLyrics[idx + 1]?.time || lyric.time + 4);

              // Last line never becomes "past" once played
              const isActive = isLastLyric
                ? currentTime >= lyric.time
                : (currentTime >= lyric.time && currentTime < wordsEnd);

              const isPast = !isLastLyric && currentTime >= wordsEnd;

              return (
                <MemoizedLyricLine 
                  key={lyric.id || idx}
                  lyric={lyric}
                  isActive={isActive}
                  isPast={isPast}
                  currentTime={isActive ? currentTime : 0}
                  onSeek={(t: number) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = t;
                      setCurrentTime(t);
                    }
                  }} 
                />
              );
            })}
          </div>
      </div>
      {/* Desktop Top right actions (Hidden on mobile) */}
      <div className="desktop-corner-btn">
        <button
          className={`icon-btn no-bg mic-toggle ${isKaraokeMode ? 'active-text' : ''}`}
          onClick={toggleKaraoke}
          title="Karaoke Mode"
        >
          <Mic size={24} color={isKaraokeMode ? "#fa2d48" : "currentColor"} fill={isKaraokeMode ? "#fa2d48" : "none"} />
        </button>
        <button className={`icon-btn no-bg toggle-lyrics ${showLyrics ? 'active-text' : ''}`} onClick={() => setShowLyrics(!showLyrics)}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="12" y1="7" x2="12" y2="13" /></svg>
        </button>
      </div>

      <audio
        ref={audioRef}
        src={song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
      />
    </div>
  );
}
