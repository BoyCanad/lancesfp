import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  Scissors,
  ThumbsUp,
  FastForward,
  Plus,
  X,
  Check,
  MessageCircle,
  Camera,
  MoreHorizontal,
  PictureInPicture2
} from 'lucide-react';
import { featuredMovies, afterHours, makingOfLegacy } from '../data/movies';
import Hls from 'hls.js';
import { supabase } from '../supabaseClient';
import { updateWatchProgress, getWatchProgress, deleteWatchProgress, addToRecentlyWatched } from '../services/profileService';
import { fetchMovieById } from '../services/movieService';
import type { Movie } from '../data/movies';
import { isMovieOffline, getOfflinePlaybackUrl } from '../services/hlsDownloadService';
import XRayPanel from '../components/XRayPanel';
import './VideoPlayer.css';

interface ParsedCue {
  start: number;
  end: number;
  text: string;
  isKaraoke?: boolean;
  position?: string;
}

const parseVTT = (vttData: string, preserveKaraoke = false): ParsedCue[] => {
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

      // Extract position attribute if present (e.g., position:80%)
      let position = undefined;
      const positionMatch = line.match(/position:\s*(\d+(?:\.\d+)?%)/);
      if (positionMatch) {
        position = positionMatch[1];
      }

      i++;
      let text = '';
      let isKaraoke = false;
      while (i < lines.length && lines[i].trim() !== '') {
        const textLine = lines[i].trim();
        if (preserveKaraoke) {
          // Check if this line contains any karaoke color tags (both hex codes and named colors, including dual-color format)
          if (textLine.match(/<c\.(color[0-9a-fA-F]+(?:\.[0-9a-fA-F]+)?|[a-zA-Z]+(?:\.[a-zA-Z]+)?)>/)) {
            isKaraoke = true;
          }
          text += (text ? '\n' : '') + textLine;
        } else {
          text += (text ? '\n' : '') + textLine.replace(/<[^>]+>/g, '');
        }
        i++;
      }
      cues.push({ start, end, text, isKaraoke, position });
    } else {
      i++;
    }
  }
  return cues;
};

// Render karaoke subtitle with highlighted text in blue
const renderKaraokeSubtitle = (text: string, movieId?: string) => {
  // First process karaoke tags across the entire text
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  // Handle dual-color format: <c.color0030ff.00ff83ff> or single-color: <c.color0030ff>
  const regex = /<c\.(color[0-9a-fA-F]+(?:\.[0-9a-fA-F]+)?|[a-zA-Z]+(?:\.[a-zA-Z]+)?)>(.*?)<\/c>/gs;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the karaoke tag (preserving line breaks)
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      beforeText.split('\n').forEach((line, idx, arr) => {
        result.push(<span key={`before-${lastIndex}-${idx}`} style={{ color: 'white' }}>{line}</span>);
        if (idx < arr.length - 1) result.push(<br key={`before-br-${lastIndex}-${idx}`} />);
      });
    }

    // Add the karaoke highlighted text with the specified color
    const colorValue = match[1];
    let color = '#0030ff';
    
    if (colorValue.includes('.')) {
      // Dual-color format: color0030ff.00ff83ff
      const parts = colorValue.split('.');
      if (parts[0].startsWith('color')) {
        color = '#' + parts[0].replace('color', '');
      } else {
        color = parts[0];
      }
    } else {
      // Single-color format
      if (colorValue.startsWith('color')) {
        color = '#' + colorValue.replace('color', '');
      } else {
        color = colorValue;
      }
    }
    
    // Override color for ang-huling-el-bimbo-play: change 0030ff to 00ff83
    if ((movieId === 'ang-huling-el-bimbo-play' || movieId === 'ang-huling-el-bimbo-play-xray') && color === '#0030ff') {
      color = '#00ff83';
    }
    
    // For dual-color, we could potentially render the unsung text in the second color
    // but the current implementation treats the entire match[2] as highlighted.
    match[2].split('\n').forEach((line, idx, arr) => {
      result.push(<span key={`karaoke-${match!.index}-${idx}`} style={{ color }}>{line}</span>);
      if (idx < arr.length - 1) result.push(<br key={`karaoke-br-${match!.index}-${idx}`} />);
    });

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last karaoke tag (preserving line breaks)
  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);
    afterText.split('\n').forEach((line, idx, arr) => {
      result.push(<span key={`after-${lastIndex}-${idx}`} style={{ color: 'white' }}>{line}</span>);
      if (idx < arr.length - 1) result.push(<br key={`after-br-${lastIndex}-${idx}`} />);
    });
  }

  return <>{result}</>;
};

interface VideoPlayerProps {
  variant?: 'default' | 'xray';
}

export default function VideoPlayer({ variant = 'default' }: VideoPlayerProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // --- Stateless Clip Sharing ---
  const [sharedClip, setSharedClip] = useState<{ start: number; end: number } | null>(null);
  const [showSharedBanner, setShowSharedBanner] = useState(false);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const pendingClipSeekRef = useRef<number | null>(null);
  const hasAppliedClipSeekRef = useRef(false);
  const [isSavingClip, setIsSavingClip] = useState(false);

  // Generate a random short alphanumeric ID for the clip
  const generateClipId = () =>
    Math.random().toString(36).slice(2, 8).toUpperCase();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clipParam = params.get('clip');
    if (clipParam) {
      try {
        const decoded = atob(clipParam);
        const [s, e] = decoded.split('-').map(Number);
        if (!isNaN(s) && !isNaN(e) && e > s) {
          setSharedClip({ start: s, end: e });
          setClipStart(s);
          setClipEnd(e);
          setShowSharedBanner(true);
          // Store the seek target — we'll apply it once the video is ready
          pendingClipSeekRef.current = s;
          hasAppliedClipSeekRef.current = false;
        }
      } catch { /* bad param, ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);


  const handleCopyLink = async () => {
    setIsSavingClip(true);
    const clipId = generateClipId();
    // `id` comes from useParams — always available, no ordering issue
    const movieSlug = id ?? 'unknown';
    const { error } = await supabase.from('clips').insert({
      id: clipId,
      movie_id: movieSlug,
      profile_id: activeProfileId,
      start_time: Math.round(clipStart),
      end_time: Math.round(clipEnd),
    });
    setIsSavingClip(false);
    if (error) {
      console.error('Failed to save clip:', error);
      // Fallback to stateless link if DB fails
      const encoded = btoa(`${Math.round(clipStart)}-${Math.round(clipEnd)}`);
      const fallback = `${window.location.origin}/watch/${movieSlug}?clip=${encoded}`;
      try { await navigator.clipboard.writeText(fallback); } catch { prompt('Copy this link:', fallback); }
      setCopyLinkDone(true);
      setTimeout(() => setCopyLinkDone(false), 2500);
      return;
    }
    const link = `${window.location.origin}/${movieSlug}/clip/${clipId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      prompt('Copy this link:', link);
    }
    setCopyLinkDone(true);
    setTimeout(() => setCopyLinkDone(false), 2500);
  };

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
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState<number>(0);
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
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isClippingMode, setIsClippingMode] = useState(false);
  const [showShareMoment, setShowShareMoment] = useState(false);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);
  const clipActiveHandleRef = useRef<'start' | 'end' | null>(null);
  const clipTrackRef = useRef<HTMLDivElement>(null);
  const clipScrollContainerRef = useRef<HTMLDivElement>(null);
  const clipSeekDebounceRef = useRef<number | null>(null);

  const clipStartUIRef = useRef<HTMLSpanElement>(null);
  const clipEndUIRef = useRef<HTMLSpanElement>(null);
  const clipDurationUIRef = useRef<HTMLDivElement>(null);
  const clipProgressUIRef = useRef<HTMLDivElement>(null);
  const clipStartHandleUIRef = useRef<HTMLDivElement>(null);
  const clipEndHandleUIRef = useRef<HTMLDivElement>(null);
  const clipLocalRef = useRef<{ start: number, end: number }>({ start: 0, end: 0 });

  const [activeSource, setActiveSource] = useState('');
  const [isUsingOfflineSource, setIsUsingOfflineSource] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isPiP, setIsPiP] = useState(false);

  const latestTimeRef = useRef(0);
  const latestDurationRef = useRef(0);

  const handleClipTrigger = () => {
    setIsClippingMode(true);
    const start = currentTime;
    const end = Math.min(duration || 0, currentTime + 30);
    setClipStart(start);
    setClipEnd(end);
    clipLocalRef.current = { start, end };
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      if (!isPlaying) togglePlay();
    }
  };



  const handleClipTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!clipActiveHandleRef.current || !clipTrackRef.current || !duration) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const rect = clipTrackRef.current.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    const newTime = percent * duration;
    const formatTimeLocal = (time: number) => {
      const clamped = Math.max(0, time);
      const minutes = Math.floor(clamped / 60);
      const seconds = Math.floor(clamped % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (clipActiveHandleRef.current === 'start') {
      if (newTime >= clipLocalRef.current.end - 2) return;
      clipLocalRef.current.start = newTime;

      if (clipStartHandleUIRef.current) clipStartHandleUIRef.current.style.left = `${(newTime / duration) * 100}%`;
      if (clipProgressUIRef.current) clipProgressUIRef.current.style.left = `${(newTime / duration) * 100}%`;
      if (clipStartUIRef.current) clipStartUIRef.current.textContent = formatTimeLocal(newTime).replace(/^00:/, '');
      if (clipDurationUIRef.current) clipDurationUIRef.current.textContent = formatTimeLocal(clipLocalRef.current.end - newTime).replace(/^00:/, '');

      if (videoRef.current) {
        if (clipSeekDebounceRef.current) window.clearTimeout(clipSeekDebounceRef.current);
        clipSeekDebounceRef.current = window.setTimeout(() => {
          if (videoRef.current) videoRef.current.currentTime = newTime;
        }, 80);
      }
    } else {
      if (newTime <= clipLocalRef.current.start + 2) return;
      clipLocalRef.current.end = newTime;

      if (clipEndHandleUIRef.current) clipEndHandleUIRef.current.style.left = `${(newTime / duration) * 100}%`;
      if (clipProgressUIRef.current) clipProgressUIRef.current.style.right = `${100 - (newTime / duration) * 100}%`;
      if (clipEndUIRef.current) clipEndUIRef.current.textContent = formatTimeLocal(newTime).replace(/^00:/, '');
      if (clipDurationUIRef.current) clipDurationUIRef.current.textContent = formatTimeLocal(newTime - clipLocalRef.current.start).replace(/^00:/, '');

      if (videoRef.current) {
        if (clipSeekDebounceRef.current) window.clearTimeout(clipSeekDebounceRef.current);
        clipSeekDebounceRef.current = window.setTimeout(() => {
          if (videoRef.current) videoRef.current.currentTime = newTime;
        }, 80);
      }
    }
  };

  const handleClipTouchEnd = () => {
    clipActiveHandleRef.current = null;
    setClipStart(clipLocalRef.current.start);
    setClipEnd(clipLocalRef.current.end);
  };

  useEffect(() => {
    if ((isClippingMode || sharedClip) && videoRef.current && currentTime >= clipEnd) {
      videoRef.current.currentTime = clipStart;
      videoRef.current.play().catch(() => { });
    }
  }, [currentTime, isClippingMode, sharedClip, clipEnd, clipStart]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileWindow(window.innerWidth <= 896);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);

    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      const parsed = JSON.parse(stored);
      setActiveProfileId(parsed.id);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPlaying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
  }, [isPlaying, hasStartedPlaying]);

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
          trailerVideoRef.current.play().catch(() => { });
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
  const hasCenteredClipRef = useRef(false);

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
  const allMovies = [...featuredMovies, afterHours, makingOfLegacy];
  const baseMovieFromId = useMemo(() => {
    return allMovies.find(m => m.id === id || (id && m.title.toLowerCase().includes(id))) || featuredMovies[0];
  }, [id]);

  const [dbMovie, setDbMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (id) {
      fetchMovieById(id).then(m => {
        if (m) {
          setDbMovie(m);
        }
      });
    }
  }, [id]);

  const baseMovie = dbMovie || baseMovieFromId;

  const movie = useMemo(() => {
    if (location.state?.subtitlesUrl) {
      return {
        ...baseMovie,
        subtitles: [
          { label: "Filipino", srclang: "fil", url: location.state.subtitlesUrl }
        ]
      };
    }
    return baseMovie;
  }, [baseMovie, location.state?.subtitlesUrl]);
  const title = location.state?.episodeTitle || movie?.title || "Ang Huling El Bimbo";

  const nextMovie = useMemo(() => {
    // Special overrides for curated recommendations
    if (movie?.id === 'minsan') return featuredMovies.find(m => m.id === 'ang-huling-el-bimbo-play') ?? featuredMovies[0];

    const currentIndex = featuredMovies.findIndex(m => m.id === movie?.id);
    if (currentIndex !== -1 && currentIndex < featuredMovies.length - 1) {
      return featuredMovies[currentIndex + 1];
    }
    return featuredMovies[0]; // loop back or fallback
  }, [movie]);

  useEffect(() => {
    if (movie?.subtitles && movie.subtitles.length > 0) {
      let matchedIndex = -1;
      
      if (activeProfileId) {
        const storedAudioSubStr = localStorage.getItem(`lsfplus_audio_sub_${activeProfileId}`);
        if (storedAudioSubStr) {
          try {
            let preferredLangs: string[] = JSON.parse(storedAudioSubStr);
            // Prioritize non-English languages over English
            preferredLangs = preferredLangs.sort((a, b) => {
              if (a === 'English') return 1;
              if (b === 'English') return -1;
              return 0;
            });
            const langMap: Record<string, string[]> = {
              '中文': ['chinese (simplified)', 'chinese', '中文'],
              '한국어': ['korean', '한국어'],
              '日本語': ['japanese', '日本語'],
              'español': ['spanish', 'español'],
              'français': ['french', 'français'],
              'deutsch': ['german', 'deutsch'],
              'português': ['portuguese', 'português'],
              'italiano': ['italian', 'italiano'],
              'filipino': ['filipino', 'tagalog']
            };

            for (const pref of preferredLangs) {
              const prefLower = pref.toLowerCase();
              const possibleMatches = langMap[prefLower] || [prefLower];
              
              matchedIndex = movie.subtitles.findIndex(s => 
                possibleMatches.includes(s.label.toLowerCase())
              );
              
              if (matchedIndex !== -1) break;
            }
          } catch(e) {}
        }
      }

      if (matchedIndex !== -1) {
        setActiveSubtitle(matchedIndex);
      } else {
        const filIndex = movie.subtitles.findIndex(s => s.label.toLowerCase() === 'filipino');
        if (filIndex !== -1) {
          setActiveSubtitle(filIndex);
        } else {
          setActiveSubtitle(0);
        }
      }
    }
  }, [movie, activeProfileId]);

  useEffect(() => {
    if (!isClippingMode) {
      hasCenteredClipRef.current = false;
      return;
    }
    if (isClippingMode && !hasCenteredClipRef.current && clipScrollContainerRef.current && movie?.spriteConfig && duration > 0) {
      hasCenteredClipRef.current = true;
      const totalThumbnails = movie.spriteConfig.cols * movie.spriteConfig.rows;
      const trackWidth = totalThumbnails * (45 * (16 / 9));
      // Scroll to exactly center the start handle
      const percent = clipStart / duration;
      const scrollPos = percent * trackWidth - (window.innerWidth / 2) + 45;
      clipScrollContainerRef.current.scrollLeft = scrollPos;
    }
  }, [isClippingMode, movie?.spriteConfig, duration, clipStart]);

  const nextThreeMovies = useMemo(() => {
    // Special overrides for curated recommendations
    if (movie?.id === 'minsan') {
      // End of Minsan → recommend El Bimbo Play first, then Tindahan, Alapaap
      return [
        featuredMovies.find(m => m.id === 'ang-huling-el-bimbo-play'),
        featuredMovies.find(m => m.id === 'tindahan-ni-aling-nena'),
        featuredMovies.find(m => m.id === 'alapaap-overdrive'),
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
  const isMovie = movie?.duration?.includes('h') || movie?.id?.startsWith('f') || movie?.id?.includes('el-bimbo') || movie?.duration?.includes('m');

  const seasonAndEpisode = isMovie ? "" : "S1:E1";
  const episodeTitle = isMovie ? "" : (movie?.title || "Minsan");

  const showXRay = variant === 'xray' || !!movie?.xRay;
  const [showAllPanel, setShowAllPanel] = useState(false);

  // Calculate dynamically active program for VOD recordings
  const currentProgramTitle = useMemo(() => {
    if (!location.state?.associatedPrograms || !location.state?.recordingStartTimeMs) return null;
    const currentAbsoluteMs = location.state.recordingStartTimeMs + (currentTime * 1000);
    const prog = location.state.associatedPrograms.find((p: any) => currentAbsoluteMs >= p.startMs && currentAbsoluteMs <= p.stopMs);
    return prog?.title;
  }, [location.state, currentTime]);

  // subtitleTimeOffset: VTT cue timestamps start at 0:00 = program start.
  // But currentTime is 0 at recording start, which may be minutes before/after the program.
  // offset = (subtitleProgramStartMs - recordingStartMs) / 1000
  // adjustedTime = currentTime - offset  →  when currentTime reaches the program's start in the VOD,
  // adjustedTime hits 0, matching the VTT's first cue.
  const subtitleTimeOffset = useMemo(() => {
    if (!location.state?.recordingStartTimeMs || !location.state?.subtitleProgramStartMs) return 0;
    return (location.state.subtitleProgramStartMs - location.state.recordingStartTimeMs) / 1000;
  }, [location.state]);

  // Gate: only show subtitles while the currently-active EPG program is the one that
  // owns the subtitle file. Prevents the subtitle from bleeding into other programs.
  const isInSubtitleProgram = useMemo(() => {
    if (!location.state?.recordingStartTimeMs || !location.state?.subtitleProgramStartMs || !location.state?.associatedPrograms) return true;
    // If subtitleProgramStartMs equals recordingStartMs (no schedule match found), always show.
    if (location.state.subtitleProgramStartMs === location.state.recordingStartTimeMs) return true;
    const currentAbsoluteMs = location.state.recordingStartTimeMs + (currentTime * 1000);
    const activeProg = location.state.associatedPrograms.find(
      (p: any) => currentAbsoluteMs >= p.startMs && currentAbsoluteMs <= p.stopMs
    );
    if (!activeProg) return false;
    return activeProg.startMs === location.state.subtitleProgramStartMs;
  }, [location.state, currentTime]);

  // Use movie.videoUrl if available, otherwise fallback to the mock sample
  const videoSrc = movie?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

  useEffect(() => {
    // Reset hasStartedPlaying so the poster banner shows until the new video starts playing
    setHasStartedPlaying(false);

    // PRIORITY 1: Check if we were passed a direct offline blob URL or a dynamic video URL (for episodes)
    if (location.state?.offlineUrl) {
      console.log('[Player] Playing from provided offline blob URL');
      setActiveSource(location.state.offlineUrl);
      setIsUsingOfflineSource(true);
      return;
    }

    if (location.state?.videoUrl) {
      console.log('[Player] Playing from provided dynamic video URL:', location.state.videoUrl);
      setActiveSource(location.state.videoUrl);
      setIsUsingOfflineSource(false);
      return;
    }

    // PRIORITY 2: Check offline cache (if navigator is offline or download exists)
    if (id) {
      const offlineUrl = getOfflinePlaybackUrl(id);
      if (offlineUrl && (isMovieOffline(id) || !navigator.onLine)) {
        console.log('[Player] Playing from HLS offline cache:', offlineUrl);
        setActiveSource(offlineUrl);
        setIsUsingOfflineSource(true);
        return;
      }
    }

    // PRIORITY 3: Use standard network source
    setActiveSource(videoSrc);
    setIsUsingOfflineSource(false);

    return () => {
      // Clean up blob URLs to prevent memory leaks
      if (activeSource.startsWith('blob:')) {
        URL.revokeObjectURL(activeSource);
      }
    };
  }, [videoSrc, movie, location.state, id]);

  useEffect(() => {
    if (!activeProfileId || !id) return;

    // Load initial progress
    getWatchProgress(activeProfileId).then(data => {
      const existing = data.find(p => p.movie_id === id);
      if (existing && videoRef.current) {
        // If progress is > 95%, maybe just start over? 
        // For now, always seek.
        videoRef.current.currentTime = existing.progress_ms / 1000;
        setCurrentTime(existing.progress_ms / 1000);
      }
    });
  }, [activeProfileId, id]);

  // For past stream episodes each has a unique UUID (episodeId) passed via location.state.
  // Using it as the watch-progress key prevents all episodes sharing the 'after-hours' slot.
  const progressKey = (location.state?.episodeId as string | undefined) || id;

  const saveProgress = async () => {
    if (activeProfileId && progressKey && latestDurationRef.current > 0) {
      const time = latestTimeRef.current;
      const duration = latestDurationRef.current;

      // Sync "Mark as Done" with the same logic used for recommendation triggers
      let isAtCredits = false;
      if (movie?.id === 'ang-huling-el-bimbo-play' || movie?.id === 'ang-huling-el-bimbo-play-xray' || movie?.id === 'f1' || movie?.id === 'eb1') {
        isAtCredits = time >= 2910;
      } else if (duration > 0 && (duration - time) <= 15) {
        // Default: 15 seconds before the end
        isAtCredits = true;
      }

      // If reached end credits / recommendation timestamp, delete progress and add to recently watched
      if (isAtCredits) {
        try {
          await deleteWatchProgress(activeProfileId, progressKey);
          await addToRecentlyWatched(activeProfileId, progressKey, seasonAndEpisode);
        } catch (e) {
          console.error('Failed to update watch history', e);
        }
        return;
      }

      try {
        await updateWatchProgress(
          activeProfileId,
          progressKey,
          Math.floor(time * 1000),
          Math.floor(duration * 1000)
        );
      } catch (e) {
        console.error('Final progress save failed', e);
      }
    }
  };

  useEffect(() => {
    // periodic save
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying && !isScrubbing && duration > 0) {
        saveProgress();
      }
    }, 5000);

    const handleBeforeUnload = () => {
      saveProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress(); // Save when navigating away via React Router
    };
  }, [activeProfileId, id, isPlaying, isScrubbing, duration]);

  // Update refs whenever time/duration changes
  useEffect(() => {
    latestTimeRef.current = currentTime;
    latestDurationRef.current = duration;
  }, [currentTime, duration]);

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

  // Setup Media Session API for native mobile notifications
  useEffect(() => {
    if ('mediaSession' in navigator && movie) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: 'LSFPlus',
        artwork: movie.thumbnail || movie.mobileThumbnail || movie.banner ? [
          { src: movie.thumbnail || movie.mobileThumbnail || movie.banner || '', sizes: '512x512', type: 'image/jpeg' }
        ] : undefined
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => { });
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (videoRef.current) {
          videoRef.current.currentTime -= 10;
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (videoRef.current) {
          videoRef.current.currentTime += 10;
        }
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      }
    };
  }, [movie, title]);

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
        // Use karaoke mode for ang-huling-el-bimbo-play and xray
        // Also enable if the subtitle URL contains "KARAOKE"
        const isKaraokeMovie = id === 'ang-huling-el-bimbo-play' || variant === 'xray' || sub.url.includes('KARAOKE');
        const parsed = parseVTT(text, isKaraokeMovie);

        setParsedSubtitles(prev => ({ ...prev, [sub.url]: parsed }));
      } catch (error) {
        console.error('Failed to load subtitle:', sub.url, error);
      }
    });
  }, [movie?.subtitles, id, variant]);

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

    if (activeSource.includes('.m3u8') && (!isUsingOfflineSource || !activeSource.startsWith('blob:'))) {
      // First, try MSE (hls.js). This works beautifully on Android Chrome and Desktop Safari/Chrome.
      // We must not force Android to native HLS, because Android native HLS often drops video layers (black screen).
      if (Hls.isSupported()) {
        hlsManagedRef.current = true;
        setVideoError(null);
        let mediaErrorRecoveries = 0;

        hls = new Hls({
          enableWorker: true,
          autoStartLoad: true,
          lowLatencyMode: false,
          maxBufferLength: 60,
          maxMaxBufferLength: 90,
          fragLoadingTimeOut: 45000,
          manifestLoadingTimeOut: 30000,
          levelLoadingTimeOut: 30000,
          fragLoadingMaxRetry: 10,
          fragLoadingRetryDelay: 1500,
          startLevel: 0,
          levelLoadingRetryDelay: 1000,
          nudgeMaxRetry: 5,
          nudgeOffset: 0.1,
          enableSoftwareAES: true
        });

        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls?.loadSource(activeSource);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (hls && hls.audioTracks && hls.audioTracks.length > 0) {
            setAudioTracks(hls.audioTracks);
            setActiveAudioTrack(hls.audioTrack);
          }
          setVideoError(null);
          setIsLoading(false);
          videoRef.current?.play()
            .then(() => {
              setIsPlaying(true);
              // Seek to shared clip start after playback begins
              if (pendingClipSeekRef.current !== null && !hasAppliedClipSeekRef.current && videoRef.current) {
                hasAppliedClipSeekRef.current = true;
                const seekTo = pendingClipSeekRef.current;
                // Small delay to let the buffer settle before seeking
                setTimeout(() => {
                  if (videoRef.current) videoRef.current.currentTime = seekTo;
                }, 300);
              }
            })
            .catch(err => console.warn("Autoplay blocked or failed:", err));
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
          if (data.audioTracks && data.audioTracks.length > 0) {
            setAudioTracks(data.audioTracks);
            if (hls) setActiveAudioTrack(hls.audioTrack);
          }
        });

        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event, data) => {
          setActiveAudioTrack(data.id);
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
        videoRef.current.src = activeSource;
        videoRef.current.load();
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.warn("Native autoplay blocked:", err));
      } else {
        setVideoError("Your browser does not support HLS video streaming.");
        setIsLoading(false);
      }
    } else if (activeSource) {
      // Regular mp4 or other formats (including cached downloads)
      hlsManagedRef.current = false;
      videoRef.current.src = activeSource;
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (pendingClipSeekRef.current !== null && !hasAppliedClipSeekRef.current && videoRef.current) {
            hasAppliedClipSeekRef.current = true;
            const seekTo = pendingClipSeekRef.current;
            setTimeout(() => {
              if (videoRef.current) videoRef.current.currentTime = seekTo;
            }, 300);
          }
        })
        .catch(err => console.warn("MP4 autoplay blocked:", err));
    }
    
    // Reset volume as it might have been set to 0 by the inline trailer fade-out
    if (videoRef.current) {
       videoRef.current.volume = 1;
       videoRef.current.muted = false;
       setIsMuted(false);
       setVolume(1);
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
  }, [activeSource]);

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
          trailerVideoRef.current.play().catch(() => { });
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

  // ── Document Picture-in-Picture API (custom PiP window) ──
  const pipWindowRef = useRef<Window | null>(null);
  const pipSyncRef = useRef<number | null>(null);
  const pipVideoContainerRef = useRef<HTMLElement | null>(null);

  const togglePiP = async () => {
    if (!videoRef.current || !movie) return;

    // If already in PiP, close it
    if (isPiP && pipWindowRef.current) {
      pipWindowRef.current.close();
      return;
    }

    // Document PiP API (Chrome 116+)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 480,
          height: 270,
        });
        pipWindowRef.current = pipWin;
        setIsPiP(true);

        // Inject premium CSS into PiP window
        const style = pipWin.document.createElement('style');
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; overflow: hidden; font-family: 'Inter', -apple-system, sans-serif; }
          .pip-root { position: relative; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; }
          video { width: 100%; height: 100%; object-fit: contain; cursor: pointer; }
          [data-action] { user-select: none; -webkit-user-select: none; }

          /* Title bar */
          .pip-topbar { position: absolute; top: 0; left: 0; right: 0; padding: 12px 16px 24px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.35) 55%, transparent 100%);
            display: flex; align-items: center; gap: 10px; z-index: 10;
            opacity: 0; transition: opacity 0.25s ease; }
          .pip-root:hover .pip-topbar, .pip-root.paused .pip-topbar { opacity: 1; }
          .pip-badge { display: inline-flex; align-items: center; gap: 5px;
            background: #e50914; color: #fff; font-size: 9px; font-weight: 800;
            letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border-radius: 3px; flex-shrink: 0; }
          .pip-eq { display: flex; align-items: flex-end; gap: 2px; height: 9px; }
          .pip-eq span { width: 2px; background: #fff; border-radius: 1px; }
          .pip-eq span:nth-child(1) { height: 4px; animation: eq 0.8s ease-in-out infinite alternate; }
          .pip-eq span:nth-child(2) { height: 7px; animation: eq 0.8s ease-in-out 0.15s infinite alternate; }
          .pip-eq span:nth-child(3) { height: 5px; animation: eq 0.8s ease-in-out 0.3s infinite alternate; }
          @keyframes eq { 0% { transform: scaleY(0.35); } 100% { transform: scaleY(1); } }
          .pip-title { color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 4px rgba(0,0,0,0.9); }

          /* Center controls row */
          .pip-controls-row { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            display: flex; align-items: center; gap: 24px; z-index: 10;
            opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
          .pip-root:hover .pip-controls-row, .pip-root.paused .pip-controls-row { opacity: 1; pointer-events: auto; }

          .pip-center { width: 56px; height: 56px; border-radius: 50%; border: none;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: transform 0.15s ease, background 0.15s ease; }
          .pip-center:hover { transform: scale(1.12); background: rgba(0,0,0,0.65); }
          .pip-center:active { transform: scale(0.92); }
          .pip-center svg { width: 28px; height: 28px; fill: white; pointer-events: none; }

          .pip-skip-btn { position: relative; width: 42px; height: 42px; border-radius: 50%; border: none;
            background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
            color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: transform 0.15s ease, background 0.15s ease; }
          .pip-skip-btn:hover { transform: scale(1.12); background: rgba(0,0,0,0.6); }
          .pip-skip-btn:active { transform: scale(0.9); }
          .pip-skip-btn svg { width: 22px; height: 22px; pointer-events: none; }
          
          /* Add this rule for the "10" text */
          .pip-skip-text {
            position: absolute;
            font-size: 8px;
            font-weight: 700;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          /* Subtitle */
          .pip-sub { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%);
            width: 90%; text-align: center; z-index: 8; pointer-events: none;
            transition: bottom 0.25s ease; }
          .pip-root:hover .pip-sub, .pip-root.paused .pip-sub { bottom: 14%; }
          .pip-sub span { 
            background: transparent;
            color: #ffffff;
            font-size: 18px; /* Slightly larger since there is no background box */
            font-weight: 600; 
            line-height: 1.15;
            text-shadow: 
              0px 0px 4px rgba(0,0,0,1),
              1px 1px 4px rgba(0,0,0,1),
              -1px -1px 4px rgba(0,0,0,1),
              2px 2px 6px rgba(0,0,0,0.9),
              0px 2px 10px rgba(0,0,0,0.8);
            display: inline; 
          }

          /* Progress bar */
          .pip-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
            background: rgba(255,255,255,0.15); z-index: 10; cursor: pointer; transition: height 0.2s ease; }
          .pip-root:hover .pip-progress, .pip-root.paused .pip-progress { height: 5px; }
          .pip-fill { height: 100%; background: linear-gradient(90deg, #e50914, #ff3d47); position: relative;
            border-radius: 0 2px 2px 0; transition: width 0.15s linear; }
          .pip-fill::after { content: ''; position: absolute; right: -1px; top: 50%;
            transform: translateY(-50%) scale(0); width: 10px; height: 10px; background: #fff;
            border-radius: 50%; box-shadow: 0 0 6px rgba(229,9,20,0.8); transition: transform 0.2s ease; }
          .pip-root:hover .pip-fill::after, .pip-root.paused .pip-fill::after { transform: translateY(-50%) scale(1); }

          /* Time display */
          .pip-time { position: absolute; bottom: 8px; right: 12px; color: rgba(255,255,255,0.7);
            font-size: 11px; font-weight: 600; z-index: 11; opacity: 0; transition: opacity 0.25s ease;
            text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
          .pip-root:hover .pip-time, .pip-root.paused .pip-time { opacity: 1; }
        `;
        pipWin.document.head.appendChild(style);

        // Build DOM
        const root = pipWin.document.createElement('div');
        root.className = 'pip-root';
        pipWin.document.body.appendChild(root);

        // Title bar
        const topbar = pipWin.document.createElement('div');
        topbar.className = 'pip-topbar';
        topbar.innerHTML = `
          <span class="pip-badge">
            <span class="pip-eq"><span></span><span></span><span></span></span>
            Now Playing
          </span>
          <span class="pip-title">${(title || movie.title || '').replace(/</g, '&lt;')}</span>
        `;
        root.appendChild(topbar);

        // Save original parent for restoration
        pipVideoContainerRef.current = videoRef.current.parentElement;

        // Move the video element into PiP window
        root.appendChild(videoRef.current);

        // Build center controls via innerHTML (avoids cross-doc event issues)
        const controlsRow = pipWin.document.createElement('div');
        controlsRow.className = 'pip-controls-row';
        controlsRow.innerHTML = `
          <div class="pip-skip-btn" data-action="rewind">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span class="pip-skip-text">10</span>
          </div>
          <div class="pip-center" data-action="toggle">
            <svg viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
          </div>
          <div class="pip-skip-btn" data-action="forward">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            <span class="pip-skip-text">10</span>
          </div>
        `;
        root.appendChild(controlsRow);

        const playBtnEl = controlsRow.querySelector('[data-action="toggle"]') as HTMLElement;

        const updateCenterIcon = () => {
          if (!videoRef.current || !playBtnEl) return;
          playBtnEl.innerHTML = videoRef.current.paused
            ? '<svg viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><polygon points="6 3 20 12 6 21"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>';
          root.classList.toggle('paused', videoRef.current.paused);
        };

        // Single delegated click handler on root — handles ALL clicks
        root.addEventListener('click', function (e: MouseEvent) {
          if (!videoRef.current) return;
          const target = (e.target as Element).closest('[data-action]') as Element | null;

          if (target) {
            const action = target.getAttribute('data-action');
            if (action === 'toggle') {
              if (videoRef.current.paused) { videoRef.current.play().catch(() => {}); }
              else { videoRef.current.pause(); }
            } else if (action === 'rewind') {
              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
            } else if (action === 'forward') {
              videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
            }
          } else if (e.target === videoRef.current || e.target === root) {
            // Clicked on the video or empty area
            if (videoRef.current.paused) { videoRef.current.play().catch(() => {}); }
            else { videoRef.current.pause(); }
          }
        });

        // Listen for play/pause state changes from video element
        const onPlay = () => { updateCenterIcon(); setIsPlaying(true); };
        const onPause = () => { updateCenterIcon(); setIsPlaying(false); };
        videoRef.current.addEventListener('play', onPlay);
        videoRef.current.addEventListener('pause', onPause);

        // Subtitle overlay
        const subEl = pipWin.document.createElement('div');
        subEl.className = 'pip-sub';
        root.appendChild(subEl);

        // Progress bar
        const progressBar = pipWin.document.createElement('div');
        progressBar.className = 'pip-progress';
        const progressFill = pipWin.document.createElement('div');
        progressFill.className = 'pip-fill';
        progressBar.appendChild(progressFill);
        root.appendChild(progressBar);

        // Click-to-seek on progress bar
        progressBar.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          if (!videoRef.current) return;
          const rect = progressBar.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          videoRef.current.currentTime = pct * videoRef.current.duration;
        });

        // Time display
        const timeEl = pipWin.document.createElement('div');
        timeEl.className = 'pip-time';
        root.appendChild(timeEl);

        // Sync loop: subtitles, progress, play state
        const fmtTime = (t: number) => {
          const m = Math.floor(t / 60);
          const s = Math.floor(t % 60);
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const VOD_SUBTITLE_LATENCY = movie?.id === 'after-hours' ? 15 : 0;

        const syncLoop = () => {
          if (!videoRef.current || !pipWindowRef.current) return;
          const v = videoRef.current;
          const ct = v.currentTime;
          const dur = v.duration || 1;

          // Progress
          progressFill.style.width = `${(ct / dur) * 100}%`;

          // Time
          const remaining = Math.max(0, dur - ct);
          timeEl.textContent = `-${fmtTime(remaining)}`;

          // Play/pause icon
          updateCenterIcon();

          // Subtitles
          if (activeSubtitle !== -1 && movie?.subtitles) {
            const subUrl = movie.subtitles[activeSubtitle]?.url;
            const cues = parsedSubtitles[subUrl];
            if (cues) {
              const adjustedTime = ct - subtitleTimeOffset + VOD_SUBTITLE_LATENCY;
              const activeCue = cues.filter(c => adjustedTime >= c.start && adjustedTime <= c.end && c.text.trim())
                .sort((a, b) => a.start - b.start).pop();
              if (activeCue) {
                const clean = activeCue.text.replace(/<[^>]+>/g, '').trim();
                subEl.innerHTML = `<span>${clean.replace(/\n/g, '<br>')}</span>`;
              } else {
                subEl.innerHTML = '';
              }
            } else {
              subEl.innerHTML = '';
            }
          } else {
            subEl.innerHTML = '';
          }

          pipSyncRef.current = requestAnimationFrame(syncLoop);
        };
        pipSyncRef.current = requestAnimationFrame(syncLoop);

        // MediaSession metadata
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: title || movie.title,
            artist: 'LSFPlus',
            artwork: (movie.thumbnail || movie.banner)
              ? [{ src: movie.thumbnail || movie.banner, sizes: '512x512', type: 'image/jpeg' }]
              : []
          });
        }

        // Cleanup on PiP close
        pipWin.addEventListener('pagehide', () => {
          if (pipSyncRef.current) cancelAnimationFrame(pipSyncRef.current);
          // Remove listeners before moving video back
          if (videoRef.current) {
            videoRef.current.removeEventListener('play', onPlay);
            videoRef.current.removeEventListener('pause', onPause);
          }
          // Move video back to the main document
          if (videoRef.current && pipVideoContainerRef.current) {
            pipVideoContainerRef.current.appendChild(videoRef.current);
          }
          pipWindowRef.current = null;
          setIsPiP(false);
        });

      } catch (err) {
        console.error('Document PiP failed:', err);
      }
    } else {
      // Fallback: native PiP (no custom styling possible)
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error('Native PiP failed:', err);
      }
    }
  };

  // Clean up PiP on unmount
  useEffect(() => {
    return () => {
      if (pipSyncRef.current) cancelAnimationFrame(pipSyncRef.current);
      if (pipWindowRef.current) pipWindowRef.current.close();
    };
  }, []);

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    // If in credits-shrink mode, clicking the video brings it back to full size
    if (showRecommendation) {
      handleDismissRecommendation();
      return;
    }

    if (isClippingMode) {
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

      // Custom trigger points for musical clips (seconds)
      const movieTriggers: Record<string, number> = {
        'minsan': 296,                 // 4:56
        'tindahan-ni-aling-nena': 353,   // 5:53
        'alapaap-overdrive': 357,       // 5:57
        'spoliarium-graduation': 328,    // 5:28
        'pare-ko': 395,                 // 6:35
        'tama-ka-ligaya': 293,          // 4:53
        'ang-huling-el-bimbo': 680      // 11:20
      };

      if (movie?.id && movieTriggers[movie.id]) {
        shouldShowRecommendation = time >= movieTriggers[movie.id];
      } else if (movie?.id === 'ang-huling-el-bimbo-play' || movie?.id === 'ang-huling-el-bimbo-play-xray' || movie?.id === 'f1' || movie?.id === 'eb1') {
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

  // Fires the instant actual playback begins — more reliable than waiting for
  // isPlaying React state to propagate. Clears the loading poster immediately.
  const handlePlaying = () => {
    setHasStartedPlaying(true);
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

  const handleAudioTrackChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = index;
      setActiveAudioTrack(index);
    }
  };



  // Shared seek calculation: pure linear from wrapper rect.
  // Both the hover tooltip AND clicking use this same formula → they always match.
  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    let time;
    if (sharedClip) {
      // Scale click to be within the clip boundaries
      time = sharedClip.start + (pct * (sharedClip.end - sharedClip.start));
    } else {
      time = pct * duration;
    }

    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const lastPreviewTimeRef = useRef(0);

  const updatePreview = (clientX: number, target: HTMLElement) => {
    if (!duration || !movie) return;
    const rect = target.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    let time;
    if (sharedClip) {
      // Only show preview within the clip boundaries
      time = sharedClip.start + (pct * (sharedClip.end - sharedClip.start));
    } else {
      time = pct * duration;
    }

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
    const clamped = Math.max(0, time);
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = Math.floor(clamped % 60);
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
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

  const skipPoints = useMemo(() => {
    // Special past stream
    if (movie?.id === 'after-hours') {
      if (location.state?.episodeTitle?.includes('April 20, 2026')) {
        return [
          { start: 0.1, end: 188, skipTo: 188, label: "Skip Intro" },
          { start: 3150, end: 3226, skipTo: 3226, label: "Skip" } // 52:30 to 53:46
        ];
      }
      return [];
    }

    // Normal skips
    const skipLogoIds = ['f1', 'eb1', 'f4', 'f5'];
    if (skipLogoIds.includes(movie?.id)) {
      return [{ start: 0.1, end: 10, skipTo: 10, label: "Skip Logo" }];
    }

    // No skip for short musical clips/performances
    const noSkipIds = [
      'f2', 
      'minsan', 
      'tindahan-ni-aling-nena', 
      'alapaap-overdrive', 
      'spoliarium-graduation', 
      'pare-ko', 
      'tama-ka-ligaya', 
      'ang-huling-el-bimbo'
    ];
    if (noSkipIds.includes(movie?.id)) {
      return [];
    }

    // Default 30s skip for others
    return [{ start: 0.1, end: 30, skipTo: 30, label: "Skip Intro" }];
  }, [movie?.id, location.state?.episodeTitle]);

  const activeSkipPoint = skipPoints.find(p => currentTime >= p.start && currentTime < p.end);
  const recentlyPassedSkipPoint = skipPoints.find(p => currentTime >= p.end && currentTime < p.end + 3);

  return (
    <div
      ref={containerRef}
      className={`video-player-container ${showControls || isScrubbing ? 'show-controls' : ''} ${!isMobileWindow ? 'desktop-player' : 'mobile-player'} ${isClippingMode ? 'clipping-mode' : ''} ${showXRay && !isExpandingTrailer && !showRecommendation && isPortrait && isMobileWindow ? 'portrait-xray-mode' : ''}`}
    >

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
              autoPlay={false}
              muted={false}
              onTimeUpdate={handleTrailerTimeUpdate}
              onEnded={handleTrailerEnded}
            >
              <source src={nextMovie.trailerUrl} type="video/mp4" />
            </video>
          )}

          {/* Trailer Subtitle Overlay */}
          {currentTrailerSubtitle && isTrailerVideoVisible && (
            <div 
              className="inline-trailer-subtitle-overlay"
              style={{
                position: 'absolute',
                bottom: isMobileWindow ? '12%' : '7%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                textAlign: 'center',
                zIndex: 60,
                pointerEvents: 'none',
                transition: 'bottom 0.3s ease-in-out'
              }}
            >
              <div 
                className="inline-trailer-subtitle-text"
                style={{
                  color: 'white',
                  fontSize: isMobileWindow ? (isPortrait ? '0.85rem' : '1.1rem') : '2.2rem',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
                  lineHeight: 1.2
                }}
              >
                {currentTrailerSubtitle.split('\n').map((line, idx, arr) => (
                  <span key={idx}>{line}{idx !== arr.length - 1 && <br />}</span>
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
                  videoRef.current.play().catch(() => { });
                }
              } else {
                navigate('/browse');
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
          <div className={`inline-trailer-branding ${isMobileWindow ? 'mobile-trailer-branding' : ''} ${!isTrailerVideoVisible ? 'static-banner-state' : ''} fade-in-actions`}>
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
                    else navigate('/browse');
                  }}
                >
                  <Info size={17} /> More Info
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`video-stage-wrapper ${showRecommendation ? 'credits-shrink' : ''} ${isExpandingTrailer ? 'trailer-expanding' : ''} ${isClippingMode ? 'clipping-active' : ''} ${showAllPanel ? 'xray-all-open' : ''}`}>
        {/* Rate overlay inside the shrunken frame */}
        {showRecommendation && !isExpandingTrailer && !isMobileWindow && (
          <div className="rate-shrunken-video">
            <span className="rate-text">Rate:</span>
            <button className="rate-btn"><ThumbsUp size={16} color="white" /></button>
          </div>
        )}

        {/* Loading Poster Overlay */}
        {(movie?.banner || movie?.thumbnail) && (
          <img
            src={movie.banner || movie.thumbnail}
            alt="Loading poster"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 15,
              opacity: hasStartedPlaying ? 0 : 1,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none'
            }}
          />
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
          onPlaying={handlePlaying}
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

        {/* Clip Editor Inner Buttons Overlay */}
        {isClippingMode && (
          <>
            <button className="clip-inner-btn clip-inner-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              {isPlaying ? <Pause size={28} fill="currentColor" strokeWidth={0.5} /> : <Play size={28} fill="currentColor" strokeWidth={0.5} />}
            </button>
            <button className="clip-inner-btn clip-inner-replay" onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.currentTime = clipStart;
                videoRef.current.play().catch(() => { });
                setIsPlaying(true);
              }
            }}>
              <RotateCcw size={28} />
            </button>
          </>
        )}

        {/* Custom Subtitle Overlay */}
        {activeSubtitle !== -1 && movie?.subtitles && parsedSubtitles[movie.subtitles[activeSubtitle]?.url] && (
          <div className="custom-subtitle-overlay-container">
            {(() => {
              const filteredCues = parsedSubtitles[movie.subtitles[activeSubtitle].url]
                .filter(cue => {
                  // VOD_SUBTITLE_LATENCY compensates for HLS encoding delay baked into the recording.
                  // Positive value = show subtitles this many seconds earlier. Tune as needed.
                  const VOD_SUBTITLE_LATENCY = movie?.id === 'after-hours' ? 15 : 0;
                  const adjustedTime = currentTime - subtitleTimeOffset + VOD_SUBTITLE_LATENCY;
                  return isInSubtitleProgram && adjustedTime >= cue.start && adjustedTime <= cue.end;
                })
                // Drop blank/whitespace-only cues that create phantom space
                .filter(cue => cue.text.trim() !== '');

              // For karaoke or positioned subtitles, show all overlapping cues to handle multiple alignments
              // For regular subtitles, use the latest one to prevent stacking
              const hasKaraoke = filteredCues.some(c => c.isKaraoke);
              const hasPositioned = filteredCues.some(c => c.position);
              const cuesToShow = (hasKaraoke || hasPositioned) ? filteredCues : filteredCues.sort((a, b) => a.start - b.start).slice(-1);

              return cuesToShow.map((cue, idx) => (
                <div
                  key={idx}
                  className="custom-subtitle-text"
                  style={cue.position ? { 
                    left: cue.position, 
                    transform: 'translateX(-50%)', 
                    position: 'absolute', 
                    bottom: '0', 
                    zIndex: 40 
                  } : {}}
                >
                  {cue.isKaraoke ? (
                    renderKaraokeSubtitle(cue.text.trim(), movie?.id)
                  ) : (
                    cue.text.trim().split('\n').map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i !== arr.length - 1 && <br />}
                      </span>
                    ))
                  )}
                </div>
              ));
            })()}
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
        <div className={`age-rating-overlay${showXRay && !isExpandingTrailer && !showRecommendation ? ' age-rating-overlay--xray' : ''} ${showRating ? 'show' : (hasShownRatingRef.current ? 'hide' : '')}`}>
          <div className="age-rating-content">
            <h4 className="age-rating-main">RATED {movie.ageRating}</h4>
            {movie.contentWarnings && movie.contentWarnings.length > 0 && (
              <p className="age-rating-warnings">
                {movie.contentWarnings.join(', ')}
              </p>
            )}
          </div>
        </div>


        {/* X-Ray top-right back button (since the X-Ray panel covers the regular back button) */}
        {showXRay && !isPortrait && !isMobileWindow && !isExpandingTrailer && !showRecommendation && (
          <button className="xray-back-button" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={42} />
          </button>
        )}

        {/* Regular Center Mobile Controls */}
        <div className={`center-mobile-controls mobile-only ${showControls && !isLoading ? 'show' : ''}`}>
          <button
            className={`vplayer-control-btn center-action-btn ${activeIndicator?.type === 'backward' ? 'animate-spin-backward' : ''}`}
            onClick={skipBackward}
            key={`back-${activeIndicator?.type === 'backward' ? activeIndicator.key : 'idle'}`}
          >
            <RotateCcw size={36} />
            <span className="skip-text-inside">10</span>
          </button>

          <button
            className={`vplayer-control-btn center-play-btn ${(activeIndicator?.type === 'play' || activeIndicator?.type === 'pause') ? 'animate-pop' : ''}`}
            onClick={togglePlay}
            key={`play-${activeIndicator?.type === 'play' || activeIndicator?.type === 'pause' ? activeIndicator.key : 'idle'}`}
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
          </button>

          <button
            className={`vplayer-control-btn center-action-btn ${activeIndicator?.type === 'forward' ? 'animate-spin-forward' : ''}`}
            onClick={skipForward}
            key={`fwd-${activeIndicator?.type === 'forward' ? activeIndicator.key : 'idle'}`}
          >
            <RotateCw size={36} />
            <span className="skip-text-inside">10</span>
          </button>
        </div>

        {/* X-Ray mobile-only top bar (title + fullscreen) */}
        {showXRay && !isExpandingTrailer && !showRecommendation && (
          <div className={`xray-mobile-top-bar mobile-only ${showControls ? 'show' : ''}`}>

            <div className="mobile-top-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, padding: '0 10px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                {movie?.id === 'after-hours'
                  ? `After Hours${location.state?.episodeTitle ? `: ${location.state.episodeTitle}` : ''}`
                  : title}
              </span>
              {currentProgramTitle && (
                <span style={{ fontSize: '0.7rem', color: '#ccc', fontWeight: 'normal', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                  {currentProgramTitle}
                </span>
              )}
            </div>
            <div className="top-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button className="flag-button xray-fullscreen-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button className="back-button" onClick={() => navigate(-1)} aria-label="Back" style={{ background: 'none', border: 'none', padding: '8px' }}>
                <ArrowLeft size={28} />
              </button>
            </div>
          </div>
        )}

        {/* Top Bar Navigation */}
        {!showXRay && (
          <div className="player-top-bar">
            <button className="back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={42} />
            </button>

            {/* Mobile Title */}
            <div className="mobile-top-title mobile-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>
                {movie?.id === 'after-hours'
                  ? `After Hours${location.state?.episodeTitle ? `: ${location.state.episodeTitle}` : ''}`
                  : title}
              </span>
              {currentProgramTitle && (
                <span style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'normal', marginTop: '2px' }}>
                  {currentProgramTitle}
                </span>
              )}
            </div>

            <div className="top-right-controls">
              <button className="flag-button mobile-only" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        )}

        {/* Skip Intro/Logo Button */}
        {(activeSkipPoint || recentlyPassedSkipPoint) && (
          <button
            className={`skip-intro-btn ${activeSkipPoint ? 'show' : 'hide'}`}
            onClick={() => {
              const target = activeSkipPoint || recentlyPassedSkipPoint;
              if (videoRef.current && target) videoRef.current.currentTime = target.skipTo;
            }}
          >
            {(activeSkipPoint || recentlyPassedSkipPoint)?.label}
          </button>
        )}

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
                onChange={() => {/* seeking handled by onMouseDown on wrapper */ }}
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
            <div className="vplayer-controls-left desktop-only">
              <button className="vplayer-control-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={42} fill="currentColor" /> : <Play size={42} fill="currentColor" />}
              </button>
              <button className="vplayer-control-btn" onClick={skipBackward}>
                <RotateCcw size={38} />
                <span className="skip-text-inside">10</span>
              </button>
              <button className="vplayer-control-btn" onClick={skipForward}>
                <RotateCw size={38} />
                <span className="skip-text-inside">10</span>
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

            {/* Title & Episode info (Desktop) */}
            <div className="title-info desktop-only">
              <span className="title-main">{movie?.id === 'after-hours' ? 'After Hours' : title}</span>
              {movie?.id === 'after-hours' && location.state?.episodeTitle ? (
                <span className="title-episode">: {location.state.episodeTitle}</span>
              ) : !isMovie && movie?.id !== 'after-hours' && (
                <span className="title-episode">{seasonAndEpisode} {episodeTitle}</span>
              )}
              {currentProgramTitle && (
                <span className="title-program" style={{ color: '#aaa', fontWeight: 600, fontSize: '0.95rem', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '12px' }}>
                  {currentProgramTitle}
                </span>
              )}
            </div>

            <div className="vplayer-controls-right desktop-only">
              {!isMovie && (
                <button className="vplayer-control-btn with-label tooltip">
                  <SkipForward size={38} />
                  <span className="tooltip-text">Next Episode</span>
                </button>
              )}

              {!isMovie && (
                <button className="vplayer-control-btn with-label tooltip">
                  <Copy size={38} />
                  <span className="tooltip-text">Episodes</span>
                </button>
              )}

              <div className="subtitles-wrapper">
                <button className="vplayer-control-btn with-label tooltip" onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSpeedMenu(false); }}>
                  <MessageSquareText size={38} />
                  <span className="tooltip-text">Subtitles / Audio</span>
                </button>
                {showSubtitlesMenu && (
                  <div className="subtitles-menu">
                    <div className="menu-section">
                      <h4 className="menu-header">Audio</h4>
                      <div className="scrollable-list">
                        <ul className="menu-list">
                          {audioTracks.length > 0 ? (
                            audioTracks.map((track, idx) => (
                              <li
                                key={idx}
                                className={`menu-item ${activeAudioTrack === idx ? "active" : ""}`}
                                onClick={() => handleAudioTrackChange(idx)}
                              >
                                {activeAudioTrack === idx ? <Check size={20} className="check-icon" /> : <span className="spacer-icon" />}
                                <span>{
                                  track.name === 'audio_1' ? 'Filipino [Original]' :
                                  track.name === 'audio_2' ? 'Filipino [Surround 5.1]' :
                                  (track.name || `Track ${idx + 1}`)
                                }</span>
                              </li>
                            ))
                          ) : (
                            <li className="menu-item active">
                              <Check size={20} className="check-icon" />
                              <span>Filipino [Original]</span>
                            </li>
                          )}
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
                          {movie.subtitles?.map((sub, idx) => (
                            <li
                              key={idx}
                              className={`menu-item ${activeSubtitle === idx ? "active" : ""}`}
                              onClick={() => handleSubtitleChange(idx)}
                            >
                              {activeSubtitle === idx && <Check size={20} className="check-icon" />}
                              {activeSubtitle !== idx && <span className="spacer-icon" />}
                              <span>{sub.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="speed-wrapper" style={{ position: 'relative' }}>
                <button
                  className="vplayer-control-btn tooltip"
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



              <button className="vplayer-control-btn tooltip" onClick={togglePiP}>
                <PictureInPicture2 size={38} />
                <span className="tooltip-text">{isPiP ? 'Exit PiP' : 'Mini Player'}</span>
              </button>

              <button className="vplayer-control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={42} /> : <Maximize size={42} />}
              </button>
            </div>
          </div>

          {/* Mobile Bottom Fixed Row */}
          <div className="mobile-bottom-row mobile-only">
            <div className="mobile-bottom-btn" onClick={handleClipTrigger}>
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
                      {audioTracks.length > 0 ? (
                        audioTracks.map((track, idx) => (
                          <li
                            key={idx}
                            className={`mobile-menu-item ${activeAudioTrack === idx ? 'active' : ''}`}
                            onClick={() => { handleAudioTrackChange(idx); setShowSubtitlesMenu(false); }}
                          >
                            <div className="mobile-menu-item-left">
                              {activeAudioTrack === idx ? <Check size={20} className="mobile-check-icon" /> : <div className="mobile-spacer-icon" />}
                              <span>{
                                track.name === 'audio_1' ? 'Filipino [Original]' :
                                track.name === 'audio_2' ? 'Filipino [Surround 5.1]' :
                                (track.name || `Track ${idx + 1}`)
                              }</span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="mobile-menu-item active">
                          <div className="mobile-menu-item-left">
                            <Check size={20} className="mobile-check-icon" />
                            <span>Filipino [Original]</span>
                          </div>
                        </li>
                      )}
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
                      {movie.subtitles?.map((sub, idx) => (
                        <li
                          key={idx}
                          className={`mobile-menu-item ${activeSubtitle === idx ? 'active' : ''}`}
                          onClick={() => { handleSubtitleChange(idx); setShowSubtitlesMenu(false); }}
                        >
                          <div className="mobile-menu-item-left">
                            {activeSubtitle === idx && <Check size={20} className="mobile-check-icon" />}
                            {activeSubtitle !== idx && <div className="mobile-spacer-icon" />}
                            <span>{sub.label}</span>
                          </div>
                        </li>
                      ))}
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

      {/* X-Ray Panel Overlay (Moved outside stage to allow portrait below-video layout) */}
      {showXRay && movie?.xRay && !isExpandingTrailer && !showRecommendation && (
        <XRayPanel xRay={movie.xRay} currentTime={currentTime} isPortrait={isPortrait && isMobileWindow} onBack={() => navigate(-1)} onSeek={(t) => { if (videoRef.current) videoRef.current.currentTime = t; }} onShowAllChange={setShowAllPanel} />
      )}

      {/* Clip Editor Moment UI */}
      {isClippingMode && (
        <div className="clip-editor-ui">
          <div className="clip-header">
            <button className="clip-back-btn" onClick={() => {
              setIsClippingMode(false);
              if (videoRef.current) videoRef.current.play();
            }}>
              <ArrowLeft size={28} />
            </button>
            <h2 className="clip-title">Clip a Moment</h2>
            <button className="clip-save-btn" onClick={() => {
              setIsClippingMode(false);
              setShowShareMoment(true);
              if (videoRef.current) videoRef.current.pause();
              setIsPlaying(false);
            }}>Save</button>
          </div>

          <div className="clip-body-labels">
            <div className="clip-side clip-side-left">
              <span className="clip-label-green">Start</span>
              <span className="clip-time-large" ref={clipStartUIRef}>{formatTime(clipStart).replace(/^00:/, '')}</span>
            </div>

            <div className="clip-side clip-side-right">
              <span className="clip-label-red">End</span>
              <span className="clip-time-large" ref={clipEndUIRef}>{formatTime(clipEnd).replace(/^00:/, '')}</span>
            </div>
          </div>

          <div className="clip-duration-bottom" ref={clipDurationUIRef}>
            {formatTime(clipEnd - clipStart).replace(/^00:/, '')}
          </div>

          <div className="clip-timeline-scroll-container" ref={clipScrollContainerRef}>
            <div className="clip-timeline-bottom"
              ref={clipTrackRef}
              style={{ width: movie?.spriteConfig ? `${movie.spriteConfig!.cols * movie.spriteConfig!.rows * (45 * (16 / 9))}px` : '100%' }}
              onTouchMove={handleClipTouchMove}
              onTouchEnd={handleClipTouchEnd}
              onMouseMove={handleClipTouchMove}
              onMouseUp={handleClipTouchEnd}
              onMouseLeave={handleClipTouchEnd}
            >
              <div className="clip-track-bg" style={{ display: 'flex', overflow: 'hidden' }}>
                {movie?.spriteUrl && movie?.spriteConfig ? (
                  Array.from({ length: movie.spriteConfig!.cols * movie.spriteConfig!.rows }).map((_, i) => {
                    const col = i % movie.spriteConfig!.cols;
                    const row = Math.floor(i / movie.spriteConfig!.cols);
                    const posX = movie.spriteConfig!.cols > 1 ? (col / (movie.spriteConfig!.cols - 1)) * 100 : 0;
                    const posY = movie.spriteConfig!.rows > 1 ? (row / (movie.spriteConfig!.rows - 1)) * 100 : 0;
                    return (
                      <div key={i} style={{
                        width: `${45 * (16 / 9)}px`,
                        flexShrink: 0,
                        height: '100%',
                        backgroundImage: `url(${movie.spriteUrl})`,
                        backgroundPosition: `${posX}% ${posY}%`,
                        backgroundSize: `${movie.spriteConfig!.cols * 100}% ${movie.spriteConfig!.rows * 100}%`
                      }} />
                    );
                  })
                ) : null}
              </div>

              <div className="clip-track-progress" ref={clipProgressUIRef} style={{
                left: `${(clipStart / Math.max(duration, 1)) * 100}%`,
                right: `${100 - (clipEnd / Math.max(duration, 1)) * 100}%`
              }}>
                <div className="clip-playhead" style={{
                  left: `${((currentTime - clipStart) / Math.max(clipEnd - clipStart, 1)) * 100}%`
                }} />
              </div>

              <div
                className="clip-handle start-handle"
                ref={clipStartHandleUIRef}
                style={{ left: `${(clipStart / Math.max(duration, 1)) * 100}%` }}
                onTouchStart={(e) => { clipActiveHandleRef.current = 'start'; e.stopPropagation(); }}
                onMouseDown={() => clipActiveHandleRef.current = 'start'}
              >
                <div className="handle-chevron handle-chevron-left" />
                <div className="handle-chevron handle-chevron-right" />
              </div>
              <div
                className="clip-handle end-handle"
                ref={clipEndHandleUIRef}
                style={{ left: `${(clipEnd / Math.max(duration, 1)) * 100}%` }}
                onTouchStart={(e) => { clipActiveHandleRef.current = 'end'; e.stopPropagation(); }}
                onMouseDown={() => clipActiveHandleRef.current = 'end'}
              >
                <div className="handle-chevron handle-chevron-left" />
                <div className="handle-chevron handle-chevron-right" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Moment Screen Overlay */}
      <div className={`share-moment-overlay ${showShareMoment ? 'show' : ''}`}>
        <div className="share-moment-header">
          <h2 className="share-moment-title">Share Moment</h2>
          <button className="share-moment-skip" onClick={() => {
            setShowShareMoment(false);
            if (videoRef.current) videoRef.current.play();
            setIsPlaying(true);
          }}>Skip</button>
        </div>

        <div className="share-moment-card">
          <img src={movie?.banner || movie?.thumbnail} className="share-moment-poster" alt={movie?.title} />
          <div className="share-moment-card-gradient"></div>
          <div className="share-moment-card-info">
            <h3 className="share-moment-movie-title">{movie?.title}</h3>
            <p className="share-moment-starts-at">Starts at {formatTime(clipStart).replace(/^00:/, '')}</p>
          </div>
        </div>

        <div className="share-moment-apps-container">
          <div className="share-moment-apps">
            <div className="share-app-btn">
              <div className="share-app-icon bg-whatsapp"><MessageCircle color="white" fill="white" /></div>
              <span>WhatsApp</span>
            </div>
            <div className="share-app-btn">
              <div className="share-app-icon bg-messages"><MessageSquareText color="white" fill="white" /></div>
              <span>Messages</span>
            </div>
            <div className="share-app-btn">
              <div className="share-app-icon bg-instagram"><Camera color="white" /></div>
              <span>Instagram<br />Stories</span>
            </div>
            <div className="share-app-btn">
              <div className="share-app-icon bg-messenger"><MessageCircle color="white" fill="white" /></div>
              <span>Messenger</span>
            </div>
            <div className="share-app-btn">
              <div className="share-app-icon bg-x"><X color="white" /></div>
              <span>X</span>
            </div>
            <div className="share-app-btn" onClick={!isSavingClip ? handleCopyLink : undefined} style={{ opacity: isSavingClip ? 0.6 : 1 }}>
              <div className={`share-app-icon bg-gray ${copyLinkDone ? 'copy-done' : ''}`}>
                {isSavingClip ? <div className="copy-spinner" /> : copyLinkDone ? <Check color="white" /> : <Copy color="white" />}
              </div>
              <span>{isSavingClip ? 'Saving…' : copyLinkDone ? 'Copied!' : 'Copy Link'}</span>
            </div>
            <div className="share-app-btn">
              <div className="share-app-icon bg-gray"><MoreHorizontal color="white" /></div>
              <span>More Options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Clip Banner */}
      {showSharedBanner && sharedClip && (
        <div className="shared-clip-banner">
          <div className="shared-clip-banner-inner">
            <div className="shared-clip-info">
              <Scissors size={16} />
              <div>
                <span className="shared-clip-label">Shared Moment</span>
                <span className="shared-clip-times">
                  {formatTime(sharedClip.start).replace(/^00:/, '')} – {formatTime(sharedClip.end).replace(/^00:/, '')}
                </span>
              </div>
            </div>
            <div className="shared-clip-actions">
              <button
                className="shared-clip-watch-full"
                onClick={() => {
                  setSharedClip(null);
                  setShowSharedBanner(false);
                  // strip the ?clip= param without reload
                  window.history.replaceState({}, '', window.location.pathname);
                }}
              >
                Watch Full Movie
              </button>
              <button
                className="shared-clip-dismiss"
                onClick={() => setShowSharedBanner(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
