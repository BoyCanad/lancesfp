import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '../data/movies';
import { MovieCard } from './ContentRow';
import './ContentGrid.css';

interface ContentGridProps {
  title: ReactNode;
  movies: Movie[];
  showProgress?: boolean;
  onSeeAll?: () => void;
}

export default function ContentGrid({
  title,
  movies,
  showProgress = false,
  onSeeAll,
}: ContentGridProps) {
  const navigate = useNavigate();

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

  const handleMovieClick = useCallback((movie: Movie, startTime?: number) => {
    const navOptions = { state: { startTime } };
    
    if (showProgress) {
      navigate(`${movie.xRay ? '/xray' : '/watch'}/${movie.id}`, navOptions);
      return;
    }

    navigate(getDetailPath(movie), navOptions);
  }, [navigate, showProgress]);

  const handleDetailClick = useCallback((movie: Movie) => {
    navigate(getDetailPath(movie));
  }, [navigate]);

  return (
    <section className="content-grid">
      <div className="content-grid__header">
        <h2 className="content-grid__title">{title}</h2>
        {onSeeAll && (
          <button className="content-grid__see-all" onClick={onSeeAll}>See All →</button>
        )}
      </div>

      <div className="content-grid__container">
        {movies.map((movie, index) => (
          <MovieCard 
            key={movie.id + index} 
            movie={movie} 
            showProgress={showProgress}
            onClick={handleMovieClick}
            onDetailClick={handleDetailClick}
          />
        ))}
      </div>
    </section>
  );
}
