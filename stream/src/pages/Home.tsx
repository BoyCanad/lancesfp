import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import CollectionShowcase from '../components/CollectionShowcase';
import LiveStreamSection from '../components/LiveStreamSection';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library } from 'lucide-react';
import type { Movie } from '../data/movies';
import { getWatchProgress, getRecentlyWatched, getProfiles } from '../services/profileService';
import { supabase } from '../supabaseClient';
import { fetchMovieRows, type MovieRows } from '../services/movieService';
import { allMovies as staticAllMovies } from '../data/movies';
import type { Profile } from '../services/profileService';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<Movie[]>([]);
  const [hasWatchedElBimbo, setHasWatchedElBimbo] = useState(false);
  const [rows, setRows] = useState<MovieRows | null>(null);

  useEffect(() => {
    fetchMovieRows().then(setRows);
  }, []);

  useEffect(() => {
    getProfiles().then(async (profiles) => {
      let activeP = profiles[0];
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        activeP = profiles.find((p) => p.id === parsed.id) || profiles[0];
      }
      setActiveProfile(activeP);

      if (activeP) {
        const allMovies = rows?.all ?? staticAllMovies;

        // Fetch Continue Watching
        const progress = await getWatchProgress(activeP.id);
        const watchedCW = progress
          .map((wp) => {
            const movie = allMovies.find((m) => m.id === wp.movie_id);
            if (!movie) return null;
            return {
              ...movie,
              progress: (wp.progress_ms / wp.duration_ms) * 100,
            };
          })
          .filter((m): m is Movie & { progress: number } => m !== null);
        setDynamicContinueWatching(watchedCW);

        // Check if El Bimbo Play has been watched
        const history = await getRecentlyWatched(activeP.id);
        const didWatch = history.some((h) => h.movie_id === 'ang-huling-el-bimbo-play');
        setHasWatchedElBimbo(didWatch);
      }
    });
  }, [rows]);

  const recommendedIds = [
    'beyond-the-last-dance',
    'minsan',
    'pare-ko',
    'ang-huling-el-bimbo',
    'tama-ka-ligaya',
    'tindahan-ni-aling-nena',
  ];

  const allMovies = rows?.all ?? staticAllMovies;
  const recommendedMovies = recommendedIds
    .map((id) => allMovies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m);

  const featuredForCarousel = [
    allMovies.find((m) => m.id === 'ang-huling-el-bimbo-play'),
    allMovies.find((m) => m.id === 'tindahan-ni-aling-nena'),
    allMovies.find((m) => m.id === 'minsan'),
  ].filter((m): m is Movie => !!m);

  return (
    <main className="app__main">
      {/* Hero Carousel */}
      <HeroCarousel movies={featuredForCarousel} />

      {/* Content Rows */}
      <div className="app__rows">
        {dynamicContinueWatching.length > 0 && (
          <ContentRow
            title={`Continue Watching for ${activeProfile?.name || 'User'}`}
            movies={dynamicContinueWatching}
            showProgress
          />
        )}

        <LiveStreamSection />

        <ContentRow
          title="G11 Archives"
          movies={rows?.archiveMovies ?? staticAllMovies}
        />

        {hasWatchedElBimbo && recommendedMovies.length > 0 && (
          <ContentRow
            title="Because you watched Ang Huling El Bimbo Play"
            movies={recommendedMovies}
          />
        )}

        <CollectionShowcase
          title="Ang Huling El Bimbo Collections"
          subtitle="Browse the complete collection from the world of Ang Huling El Bimbo"
          backgroundImage="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection.png"
          logoImage="/images/el-bimbo-logo.webp"
          movies={rows?.elBimboCollections ?? []}
          onSeeAll={() => navigate('/collections/el-bimbo')}
        />
      </div>
    </main>
  );
}
