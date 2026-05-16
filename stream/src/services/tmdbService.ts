import type { Movie, Season } from '../data/movies';

const TMDB_API_KEY = '584505aa50d82bbeb1ecb67a68aa136f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
}

export const tmdbService = {
  async search(query: string, type: 'movie' | 'tv' | 'multi' = 'multi'): Promise<TMDBResult[]> {
    const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  },

  async getDetails(id: number, type: 'movie' | 'tv' = 'movie') {
    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates,content_ratings,videos,images&include_image_language=en,null`;
    const response = await fetch(url);
    return await response.json();
  },

  async mapToMovie(tmdb: any, type: 'movie' | 'tv' = 'movie'): Promise<Movie> {
    const id = `tmdb-${tmdb.id}`;
    const title = tmdb.title || tmdb.name || '';
    const description = tmdb.overview || '';
    const rating = tmdb.vote_average ? tmdb.vote_average.toFixed(1) : '0.0';
    const year = (tmdb.release_date || tmdb.first_air_date || '').split('-')[0] || 'N/A';
    
    // TMDB runtime is in minutes, our format is usually "1h 30m"
    let duration = '';
    if (tmdb.runtime) {
      const h = Math.floor(tmdb.runtime / 60);
      const m = tmdb.runtime % 60;
      duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
    } else if (tmdb.episode_run_time && tmdb.episode_run_time.length > 0) {
      duration = `${tmdb.episode_run_time[0]}m`;
    } else {
      duration = type === 'movie' ? 'N/A' : 'Series';
    }

    const genre = tmdb.genres ? tmdb.genres.map((g: any) => g.name) : [];
    
    // Find age rating
    let ageRating = 'NR';
    if (type === 'movie' && tmdb.release_dates) {
      const usRelease = tmdb.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates.length > 0) {
        ageRating = usRelease.release_dates[0].certification || 'NR';
      }
    } else if (type === 'tv' && tmdb.content_ratings) {
      const usRating = tmdb.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRating) {
        ageRating = usRating.rating || 'NR';
      }
    }

    // Find trailer (fallback to teaser or first available YouTube video)
    let trailerUrl = '';
    if (tmdb.videos && tmdb.videos.results && tmdb.videos.results.length > 0) {
      let video = tmdb.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      if (!video) video = tmdb.videos.results.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube');
      if (!video) video = tmdb.videos.results.find((v: any) => v.site === 'YouTube');
      
      if (video) {
        trailerUrl = `https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${video.key}`;
      }
    }

    // Find logo
    let logo = '';
    if (tmdb.images && tmdb.images.logos && tmdb.images.logos.length > 0) {
      // Prioritize English logos, or take the first available
      const enLogo = tmdb.images.logos.find((l: any) => l.iso_639_1 === 'en');
      const selectedLogo = enLogo || tmdb.images.logos[0];
      logo = `${IMAGE_BASE_URL}/w500${selectedLogo.file_path}`;
    }

    // Fetch seasons for TV shows
    let seasons: Season[] = [];
    if (type === 'tv' && tmdb.seasons) {
      const validSeasons = tmdb.seasons.filter((s: any) => s.season_number > 0);
      seasons = await Promise.all(validSeasons.map(async (s: any) => {
        try {
          const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${tmdb.id}/season/${s.season_number}?api_key=${TMDB_API_KEY}`);
          const seasonData = await seasonRes.json();
          
          return {
            id: `season-${s.season_number}`,
            seasonNumber: s.season_number,
            title: s.name,
            episodes: (seasonData.episodes || []).map((ep: any) => ({
              id: `ep-${ep.id}`,
              episodeNumber: ep.episode_number,
              title: ep.name,
              description: ep.overview,
              thumbnail: ep.still_path ? `${IMAGE_BASE_URL}/w500${ep.still_path}` : (tmdb.backdrop_path ? `${IMAGE_BASE_URL}/w500${tmdb.backdrop_path}` : ''),
              videoUrl: `https://www.vidking.net/embed/tv/${tmdb.id}/${s.season_number}/${ep.episode_number}?color=9146ff&autoPlay=true&nextEpisode=true&episodeSelector=true`,
              duration: ep.runtime ? `${ep.runtime}m` : 'N/A'
            }))
          };
        } catch (e) {
          console.error(`Failed to fetch season ${s.season_number}`, e);
          return null;
        }
      }));
      seasons = seasons.filter(Boolean) as Season[];
    }

    return {
      id,
      title,
      description,
      rating,
      year,
      duration,
      genre,
      ageRating,
      thumbnail: tmdb.backdrop_path ? `${IMAGE_BASE_URL}/w780${tmdb.backdrop_path}` : (tmdb.poster_path ? `${IMAGE_BASE_URL}/w500${tmdb.poster_path}` : ''),
      banner: tmdb.backdrop_path ? `${IMAGE_BASE_URL}/original${tmdb.backdrop_path}` : '',
      mobileThumbnail: tmdb.poster_path ? `${IMAGE_BASE_URL}/w342${tmdb.poster_path}` : '',
      mobileBanner: tmdb.backdrop_path ? `${IMAGE_BASE_URL}/w780${tmdb.backdrop_path}` : '',
      detailBanner: tmdb.backdrop_path ? `${IMAGE_BASE_URL}/original${tmdb.backdrop_path}` : '',
      detailMobileBanner: tmdb.backdrop_path ? `${IMAGE_BASE_URL}/w780${tmdb.backdrop_path}` : '',
      trailerUrl,
      logo,
      mediaType: type === 'tv' ? 'show' : 'movie',
      isOriginal: false,
      comingSoon: false, // Set to false so they are playable via the iframe
      seasons: seasons.length > 0 ? seasons : undefined
    };
  }
};
