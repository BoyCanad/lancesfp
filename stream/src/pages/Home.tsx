import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import { featuredMovies, trendingMovies, elBimboFeatured } from '../data/movies';
import { useState, useEffect } from 'react';
import { getProfiles, getWatchProgress } from '../services/profileService';
import type { Profile } from '../services/profileService';

const archiveMovies = [trendingMovies[0], elBimboFeatured, ...trendingMovies.slice(1)];
const elBimboCollections = [
  elBimboFeatured,
  featuredMovies[1],
  featuredMovies[3],
  featuredMovies[4],
  featuredMovies[5],
  featuredMovies[6],
  featuredMovies[7],
  featuredMovies[8],
  ...[...trendingMovies].reverse().slice(7)
];

export default function Home() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<any[]>([]);

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
        const progress = await getWatchProgress(activeP.id);
        
        // Map progress data back to movie objects
        const allMovies = [...featuredMovies, ...trendingMovies, elBimboFeatured];
        const watchedItems = progress
          .map(wp => {
            const movie = allMovies.find(m => m.id === wp.movie_id);
            if (!movie) return null;
            
            // Only show if less than 95% finished
            if (wp.progress_ms / wp.duration_ms > 0.95) return null;

            return {
              ...movie,
              progress: (wp.progress_ms / wp.duration_ms) * 100
            };
          })
          .filter(Boolean);
        
        setDynamicContinueWatching(watchedItems);
      }
    });
  }, []);
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
            variant="wide"
          />
        )}
        <ContentRow
          title="G11 Archives"
          movies={archiveMovies}
        />
        <ContentRow
          title="Ang Huling El Bimbo Collections"
          movies={elBimboCollections}
        />
      </div>
    </main>
  );
}
