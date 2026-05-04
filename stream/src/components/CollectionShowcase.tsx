import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '../data/movies';
import './CollectionShowcase.css';

interface CollectionShowcaseProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  logoImage?: string;
  movies: Movie[];
  onSeeAll?: () => void;
}

export default function CollectionShowcase({
  title,
  subtitle,
  backgroundImage,
  logoImage,
  movies,
  onSeeAll,
}: CollectionShowcaseProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollBtns = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(updateScrollBtns, 400);
  };

  const getDetailPath = (movie: Movie) => {
    if (movie.id === 'ang-huling-el-bimbo-play') return '/ang-huling-el-bimbo-play';
    if (movie.id === 'ang-huling-el-bimbo-play-xray') return '/ang-huling-el-bimbo-play-xray';
    if (movie.id === 'minsan') return '/minsan';
    if (movie.id === 'tindahan-ni-aling-nena') return '/tindahan-ni-aling-nena';
    if (movie.id === 'alapaap-overdrive') return '/alapaap-overdrive';
    if (movie.id === 'spoliarium-graduation') return '/spoliarium-graduation';
    if (movie.id === 'pare-ko') return '/pare-ko';
    if (movie.id === 'tama-ka-ligaya') return '/tama-ka-ligaya';
    if (movie.id === 'ang-huling-el-bimbo') return '/ang-huling-el-bimbo';
    if (movie.id === 'beyond-the-last-dance') return '/beyond-the-last-dance';
    if (movie.id === 'bukang-liwayway-takipsilim') return '/bukang-liwayway-takipsilim';
    if (movie.id === 'a-day-in-my-life-stem') return '/a-day-in-my-life-stem';
    if (movie.id === 't1') return '/11-stem-a';
    return `/browse`;
  };

  return (
    <section className="showcase" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="showcase__bg-overlay" />

      {canScrollLeft && (
        <button className="showcase__arrow showcase__arrow--left" onClick={() => scroll('left')}>
          <ChevronLeft size={28} />
        </button>
      )}

      <div className="showcase__content" ref={scrollRef} onScroll={updateScrollBtns}>
        {/* Left info panel */}
        <div className="showcase__info">
          <div className="showcase__info-content">
            {logoImage ? (
              <img src={logoImage} alt={title} className="showcase__logo" />
            ) : (
              <h2 className="showcase__title">{title}</h2>
            )}
            <p className="showcase__subtitle">{subtitle}</p>
            {onSeeAll && (
              <button className="showcase__browse-btn" onClick={onSeeAll}>
                Browse Collection →
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="showcase__cards">
          {movies.map((movie, index) => (
            <div
              key={movie.id + index}
              className="showcase__card"
              onClick={() => navigate(getDetailPath(movie))}
            >
              <img
                src={movie.mobileThumbnail || movie.thumbnail}
                alt={movie.title}
                className="showcase__card-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {canScrollRight && (
        <button className="showcase__arrow showcase__arrow--right" onClick={() => scroll('right')}>
          <ChevronRight size={28} />
        </button>
      )}
    </section>
  );
}
