import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import LiveStreamSection from '../components/LiveStreamSection';
import { featuredMovies, elBimboCollections, archiveMovies, allMovies } from '../data/movies';
import { useState, useEffect } from 'react';
import { getProfiles, getWatchProgress, getRecentlyWatched } from '../services/profileService';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../services/profileService';

export default function Home() {
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<any[]>([]);
  const [hasWatchedElBimbo, setHasWatchedElBimbo] = useState(false);

  useEffect(() => {
    getProfiles().then(async profiles => {
      let activeP = profiles[0];
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        activeP = profiles.find(p => p.id === parsed.id) || profiles[0];
      }
      
      setActiveProfile(activeP);

      if (activeP) {
        // Fetch Continue Watching
        const progress = await getWatchProgress(activeP.id);
        const watchedCW = progress
          .map(wp => {
            const movie = allMovies.find(m => m.id === wp.movie_id);
            if (!movie) return null;
            return {
              ...movie,
              progress: (wp.progress_ms / wp.duration_ms) * 100
            };
          })
          .filter(Boolean);
        setDynamicContinueWatching(watchedCW);

        // Check if El Bimbo Play has been watched
        const history = await getRecentlyWatched(activeP.id);
        const didWatch = history.some(h => h.movie_id === 'ang-huling-el-bimbo-play');
        setHasWatchedElBimbo(didWatch);
      }
    });
  }, []);

  const recommendedIds = [
    'beyond-the-last-dance', 
    'minsan', 
    'pare-ko', 
    'ang-huling-el-bimbo', 
    'tama-ka-ligaya', 
    'tindahan-ni-aling-nena'
  ];

  const recommendedMovies = recommendedIds
    .map(id => allMovies.find(m => m.id === id))
    .filter((m): m is any => !!m);
  
  return (
    <main className="app__main">
      {/* Hero Carousel */}
      <HeroCarousel movies={featuredMovies.slice(0, 3)} />

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
          movies={archiveMovies}
        />

        {hasWatchedElBimbo && recommendedMovies.length > 0 && (
          <ContentRow
            title="Because you watched Ang Huling El Bimbo Play"
            movies={recommendedMovies}
          />
        )}

        <ContentRow
          title="Ang Huling El Bimbo Collections"
          movies={elBimboCollections}
          onSeeAll={() => navigate('/collections/el-bimbo')}
        />
      </div>
    </main>
  );
}
