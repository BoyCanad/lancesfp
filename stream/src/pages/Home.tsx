import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import Top10Row from '../components/Top10Row';
import CollectionShowcase from '../components/CollectionShowcase';
import LiveStreamSection from '../components/LiveStreamSection';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '../data/movies';
import { getWatchProgress, getRecentlyWatched, getProfiles } from '../services/profileService';
import { fetchAllMovies, fetchHomeRows, type ResolvedHomeRow } from '../services/movieService';
import { allMovies as staticAllMovies } from '../data/movies';
import type { Profile } from '../services/profileService';
import { useLanguage } from '../i18n/LanguageContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [dynamicContinueWatching, setDynamicContinueWatching] = useState<Movie[]>([]);
  const [hasWatchedElBimbo, setHasWatchedElBimbo] = useState(false);
  const [homeRows, setHomeRows] = useState<ResolvedHomeRow[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>(staticAllMovies);

  // Fetch all home rows from Supabase (with static fallback)
  useEffect(() => {
    fetchHomeRows().then(setHomeRows);
    fetchAllMovies().then(setAllMovies);
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
        // Fetch Continue Watching
        const progress = await getWatchProgress(activeP.id);
        const watchedCW = progress
          .map((wp) => {
            const movie = allMovies.find((m) => m.id === wp.movie_id);
            if (!movie) return null;
            let currentEpisode;
            if (movie.mediaType === 'show' && movie.id.startsWith('tmdb-')) {
              try {
                const vidRaw = localStorage.getItem('vidLinkProgress');
                if (vidRaw) {
                  const vp = JSON.parse(vidRaw);
                  const entry = vp[movie.id.replace('tmdb-', '')];
                  if (entry?.last_season_watched && entry?.last_episode_watched) {
                    const s = parseInt(entry.last_season_watched);
                    const e = parseInt(entry.last_episode_watched);
                    const season = movie.seasons?.find(ss => ss.seasonNumber === s);
                    const ep = season?.episodes.find(ee => ee.episodeNumber === e);
                    currentEpisode = { season: s, episode: e, title: ep?.title || `Episode ${e}` };
                  }
                }
              } catch (e) {}
            }

            return {
              ...movie,
              progress: (wp.progress_ms / wp.duration_ms) * 100,
              duration_ms: wp.duration_ms,
              ...(currentEpisode ? { currentEpisode } : {})
            };
          })
          .filter(Boolean) as Movie[];
        setDynamicContinueWatching(watchedCW);

        // Check if El Bimbo Play has been watched
        const history = await getRecentlyWatched(activeP.id);
        const didWatch = history.some((h) => h.movie_id === 'ang-huling-el-bimbo-play');
        setHasWatchedElBimbo(didWatch);
      }
    });
  }, [allMovies]);

  // "Because you watched" row (only shown after watching El Bimbo)
  const recommendedIds = [
    'beyond-the-last-dance',
    'minsan',
    'pare-ko',
    'ang-huling-el-bimbo',
    'tama-ka-ligaya',
    'tindahan-ni-aling-nena',
  ];
  const recommendedMovies = recommendedIds
    .map((id) => allMovies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m);

  const featuredForCarousel = [
    allMovies.find((m) => m.id === 'ang-huling-el-bimbo-play'),
    allMovies.find((m) => m.id === 'tindahan-ni-aling-nena'),
    allMovies.find((m) => m.id === 'minsan'),
  ].filter((m): m is Movie => !!m);

  const getTranslatedRowTitle = (title: string) => {
    const titleKeyMap: Record<string, string> = {
      'Top 10 Titles in LSFPlus Today': 'row.top10',
      'Trending Now': 'row.trending',
      'G11 Archive': 'row.g11_archive',
      'Top 10': 'row.top10',
      'The El Bimbo Collection': 'row.el_bimbo_collection'
    };
    const key = titleKeyMap[title];
    return key ? t(key) : title;
  };

  return (
    <main className="app__main">
      {/* Hero Carousel */}
      <HeroCarousel movies={featuredForCarousel} />

      {/* Content Rows */}
      <div className="app__rows">
        {/* Continue Watching — always first, profile-specific */}
        {dynamicContinueWatching.length > 0 && (
          <ContentRow
            title={t('home.continue_watching', { name: activeProfile?.name || 'User' })}
            movies={dynamicContinueWatching}
            showProgress
          />
        )}

        {/* Dynamic rows fetched from Supabase home_rows table */}
        {homeRows.map((row) => {
          if (row.row_type === 'live') {
            return <LiveStreamSection key={row.id} />;
          }

          if (row.row_type === 'top10') {
            return (
              <Top10Row
                key={row.id}
                title={getTranslatedRowTitle(row.title)}
                movies={row.movies}
              />
            );
          }

          if (row.row_type === 'collection') {
            return (
              <CollectionShowcase
                key={row.id}
                title={getTranslatedRowTitle(row.title)}
                subtitle={row.subtitle ?? ''}
                backgroundImage={row.background_url ?? ''}
                mobileBackgroundImage={row.mobile_bg_url ?? ''}
                logoImage={row.logo_url ?? ''}
                movies={row.movies}
                onSeeAll={() => navigate(row.see_all_path ?? '/browse')}
              />
            );
          }

          // Default: standard ContentRow
          return (
            <ContentRow
              key={row.id}
              title={getTranslatedRowTitle(row.title)}
              movies={row.movies}
            />
          );
        })}

        {/* "Because you watched" row — conditional, not managed via home_rows */}
        {hasWatchedElBimbo && recommendedMovies.length > 0 && (
          <ContentRow
            title={t('home.because_watched', { title: 'Ang Huling El Bimbo Play' })}
            movies={recommendedMovies}
          />
        )}
      </div>
    </main>
  );
}
