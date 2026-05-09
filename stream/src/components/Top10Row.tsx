import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Check, ThumbsUp, ChevronDown, Volume2, VolumeX, Bell } from 'lucide-react';
import type { Movie } from '../data/movies';
import { addToMyList, removeFromMyList, isInMyList } from '../services/listService';
import { supabase } from '../supabaseClient';
import { HDBadge, SpatialAudioBadge } from './AudioBadges';
import './Top10Row.css';

interface Top10RowProps {
  title?: string;
  movies: Movie[];
}

// Mirror the same detail-path logic from ContentRow
const getDetailPath = (movie: Movie) => {
  const map: Record<string, string> = {
    'ang-huling-el-bimbo-play': '/ang-huling-el-bimbo-play',
    'ang-huling-el-bimbo-play-xray': '/ang-huling-el-bimbo-play-xray',
    'minsan': '/minsan',
    'tindahan-ni-aling-nena': '/tindahan-ni-aling-nena',
    'alapaap-overdrive': '/alapaap-overdrive',
    'spoliarium-graduation': '/spoliarium-graduation',
    'pare-ko': '/pare-ko',
    'tama-ka-ligaya': '/tama-ka-ligaya',
    'ang-huling-el-bimbo': '/ang-huling-el-bimbo',
    'beyond-the-last-dance': '/beyond-the-last-dance',
    'bukang-liwayway-takipsilim': '/bukang-liwayway-takipsilim',
    'a-day-in-my-life-stem': '/a-day-in-my-life-stem',
    't1': '/11-stem-a',
  };
  return map[movie.id] || '/browse';
};

// ─── Single Top 10 Card ─────────────────────────────────────
function Top10Card({
  movie,
  rank,
  position,
  onClick,
}: {
  movie: Movie;
  rank: number;
  position: 'left' | 'right' | 'center';
  onClick: (movie: Movie) => void;
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInMyList(isInMyList(movie.id));
    const handleUpdate = () => setInMyList(isInMyList(movie.id));
    window.addEventListener('mylist_updated', handleUpdate);
    
    // Initial like check
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      const profile = JSON.parse(stored);
      supabase.from('liked_movies')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('movie_id', movie.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST204' || error.code === '42P01') return;
          }
          setIsLiked(!!data);
        });
    }

    return () => window.removeEventListener('mylist_updated', handleUpdate);
  }, [movie.id]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem('activeProfile');
    if (!stored) return;
    const profile = JSON.parse(stored);
    
    const newLiked = !isLiked;
    setIsLiked(newLiked);

    try {
      const { toggleLike } = await import('../services/profileService');
      await toggleLike(profile.id, movie.id);
    } catch (err) {
      console.error('Failed to toggle like', err);
      setIsLiked(!newLiked);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth <= 768) return;
    setIsHovered(true);

    // Replicate ContentRow's dynamic transform-origin based on screen edge
    const rect = e.currentTarget.getBoundingClientRect();
    const edgeThreshold = 120;
    let origin = 'center calc(50% + 5px)';
    if (rect.left < edgeThreshold) {
      origin = 'left calc(50% + 5px)';
    } else if (window.innerWidth - rect.right < edgeThreshold) {
      origin = 'right calc(50% + 5px)';
    }
    e.currentTarget.style.setProperty('--origin', origin);

    if (movie.trailerUrl) {
      hoverTimerRef.current = setTimeout(() => {
        setIsPlayingTrailer(true);
        setTimeout(() => {
          videoRef.current?.play().catch(() => {});
        }, 400);
      }, 2000);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPlayingTrailer(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, []);

  const handleListToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inMyList) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const base = movie.xRay ? '/xray' : '/watch';
    navigate(`${base}/${movie.id}`);
  };

  const posClass =
    position === 'right' ? 'top10-card--pos-right'
    : position === 'left' ? 'top10-card--pos-left'
    : '';

  // Mobile: tap goes to detail
  const handleCardClick = () => {
    if (window.innerWidth <= 768) {
      onClick(movie);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`top10-card ${posClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Big rank number */}
      <span className={`top10-card__rank ${rank === 1 ? 'top10-card__rank--one' : ''}`}>{rank}</span>

      {/* Portrait thumbnail + expanded popup — share a positioning context */}
      <div className="top10-card__thumb-container">
        <div className="top10-card__thumb-wrap">
          <img
            src={movie.mobileThumbnail || movie.thumbnail}
            alt={movie.title}
            className="top10-card__img"
            loading="lazy"
          />
        </div>

        {/* Expanded hover card — scales from thumbnail footprint */}
        {isHovered && (
          <div className={`top10-card__expanded ${posClass} ${isPlayingTrailer ? 'top10-card__expanded--playing' : ''}`}>

            {/* ── Media area ── */}
            <div className="top10-card__media-wrap">
              {/* Static banner (always present as base layer) */}
              <img
                src={movie.cardBanner || movie.banner || movie.thumbnail}
                alt=""
                className="top10-card__preview"
                style={{ opacity: isPlayingTrailer ? 0 : 1 }}
              />

              {/* Trailer video fades in over the banner */}
              {movie.trailerUrl && (
                <video
                  ref={videoRef}
                  src={movie.trailerUrl}
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  className="top10-card__preview-video"
                  onEnded={() => setIsPlayingTrailer(false)}
                  style={{ opacity: isPlayingTrailer ? 1 : 0 }}
                />
              )}

              {/* Vol toggle & Logo */}
              {movie.trailerUrl && isPlayingTrailer && (
                <>
                  <button
                    className="top10-card__vol-btn"
                    onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
                  >
                    {isMuted ? <VolumeX size={14} color="white" /> : <Volume2 size={14} color="white" />}
                  </button>
                  {movie.logo && (
                    <img src={movie.logo} alt="" className="top10-card__video-logo" />
                  )}
                </>
              )}
            </div>

            {/* ── Details ── */}
            <div className="top10-card__details">

              {/* Mini rank badge */}
              <div className="top10-card__rank-badge">
                <span className="top10-card__rank-badge-num">#{rank}</span>
                <span>in LSFPlus Today</span>
              </div>

              {/* Playback controls */}
              <div className="top10-card__controls">
                <div className="top10-card__controls-left">
                  <button
                    className={`top10-card__btn top10-card__btn--play ${movie.comingSoon ? 'top10-card__btn--disabled' : ''}`}
                    onClick={handlePlay}
                    disabled={movie.comingSoon}
                  >
                    {movie.comingSoon
                      ? <Bell size={13} color="black" fill="black" />
                      : <Play size={12} fill="black" color="black" />}
                  </button>
                  <button
                    className={`top10-card__btn top10-card__btn--icon ${inMyList ? 'top10-card__btn--active' : ''}`}
                    onClick={handleListToggle}
                    title={inMyList ? 'Remove from My List' : 'Add to My List'}
                  >
                    {inMyList ? <Check size={13} color="white" /> : <Plus size={13} color="white" />}
                  </button>
                  <button
                    className="top10-card__btn top10-card__btn--icon"
                    onClick={handleLikeToggle}
                  >
                    <ThumbsUp
                      size={12}
                      color={isLiked ? '#46d369' : 'white'}
                      fill={isLiked ? '#46d369' : 'transparent'}
                    />
                  </button>
                </div>
                <button
                  className="top10-card__btn top10-card__btn--info"
                  onClick={(e) => { e.stopPropagation(); onClick(movie); }}
                >
                  <ChevronDown size={15} color="white" />
                </button>
              </div>

              {/* Match / age / duration */}
              <div className="top10-card__meta-row">
                {movie.comingSoon && <span className="top10-card__coming-soon">COMING SOON</span>}
                <span className="top10-card__age">{movie.ageRating || '13+'}</span>
                <span className="top10-card__duration">
                  {movie.comingSoon ? 'TBA' : movie.duration}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HDBadge isSmall={true} />
                  {(movie.id === 'ang-huling-el-bimbo-play' || movie.id === 'ang-huling-el-bimbo-play-xray') && (
                    <SpatialAudioBadge isSmall={true} />
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="top10-card__genres">
                {movie.genre.slice(0, 3).map((g, i, arr) => (
                  <span key={g}>
                    {g}
                    {i < arr.length - 1 && <span className="top10-card__genre-dot">•</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Top 10 Row ─────────────────────────────────────────────
export default function Top10Row({
  title = 'Top 10 Titles in LSFPlus Today',
  movies,
}: Top10RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollBtns = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(updateScrollBtns, 400);
  };

  const handleMovieClick = useCallback((movie: Movie) => {
    navigate(getDetailPath(movie));
  }, [navigate]);

  // Determine edge position for hover expansion direction
  const getPosition = (index: number, total: number): 'left' | 'right' | 'center' => {
    if (index === 0) return 'right';
    if (index >= total - 2) return 'left';
    return 'center';
  };

  return (
    <section className="top10-row">
      <div className="top10-row__header">
        <h2 className="top10-row__title">{title}</h2>
      </div>

      <div className="top10-row__wrapper">
        {canScrollLeft && (
          <button className="top10-row__arrow top10-row__arrow--left" onClick={() => scroll('left')}>
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          ref={rowRef}
          className="top10-row__track"
          onScroll={updateScrollBtns}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <Top10Card
              key={movie.id}
              movie={movie}
              rank={index + 1}
              position={getPosition(index, Math.min(movies.length, 10))}
              onClick={handleMovieClick}
            />
          ))}
        </div>

        {canScrollRight && (
          <button className="top10-row__arrow top10-row__arrow--right" onClick={() => scroll('right')}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </section>
  );
}
