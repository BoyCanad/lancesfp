import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import LiveStreamSection from '../components/LiveStreamSection';
import { featuredMovies, trendingMovies, elBimboFeatured, elBimboCollections, makingOfLegacy } from '../data/movies';
import { useState, useEffect } from 'react';
import { getProfiles, getWatchProgress } from '../services/profileService';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../services/profileService';

const archiveMovies = [trendingMovies[2], elBimboFeatured, makingOfLegacy, trendingMovies[0], trendingMovies[1], ...trendingMovies.slice(3)];

export default function Home() {
  const navigate = useNavigate();
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
            
            // We no longer filter by 95% here because the VideoPlayer 
            // now handles deletion at the specific 'Credits' timestamp.
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
          />
        )}

        <LiveStreamSection />

        <ContentRow
          title="G11 Archives"
          movies={archiveMovies}
        />
        <ContentRow
          title="Ang Huling El Bimbo Collections"
          movies={elBimboCollections}
          onSeeAll={() => navigate('/collections/el-bimbo')}
        />
      </div>
    </main>
  );
}
