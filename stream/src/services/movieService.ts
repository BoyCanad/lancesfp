import { supabase } from '../supabaseClient';
import type { Movie } from '../data/movies';
import {
  featuredMovies as staticFeatured,
  trendingMovies as staticTrending,
  makingOfLegacy as staticMakingOf,
  afterHours as staticAfterHours,
  allMovies as staticAllMovies,
} from '../data/movies';

// ─── Cache ─────────────────────────────────────────────────────────────────
let _cache: Movie[] | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Row helpers (preserve original static ordering) ────────────────────────
const FEATURED_IDS = staticFeatured.map((m) => m.id);
const TRENDING_IDS = staticTrending.map((m) => m.id);

function buildRows(movies: Movie[]) {
  const byId = Object.fromEntries(movies.map((m) => [m.id, m]));

  const featured = FEATURED_IDS.map((id) => byId[id]).filter(Boolean) as Movie[];
  const trending = TRENDING_IDS.map((id) => byId[id]).filter(Boolean) as Movie[];

  const all = [...movies].filter(
    (m, i, self) => i === self.findIndex((x) => x.id === m.id),
  );

  const makingOf = byId['beyond-the-last-dance'] ?? staticMakingOf;
  const ahours = byId['after-hours'] ?? staticAfterHours;

  const elBimboIds = [
    'ang-huling-el-bimbo-play',
    'ang-huling-el-bimbo-play-xray',
    'beyond-the-last-dance',
    'minsan',
    'tindahan-ni-aling-nena',
    'alapaap-overdrive',
    'spoliarium-graduation',
    'pare-ko',
    'tama-ka-ligaya',
    'ang-huling-el-bimbo',
  ];
  const elBimboCollections = elBimboIds.map((id) => byId[id]).filter(Boolean) as Movie[];

  const archiveLeadIds = [
    't1',
    'ang-huling-el-bimbo-play',
    'ang-huling-el-bimbo-play-xray',
    'beyond-the-last-dance',
    'bukang-liwayway-takipsilim',
    'a-day-in-my-life-stem',
  ];
  const archiveMovies = [
    ...archiveLeadIds.map((id) => byId[id]).filter(Boolean),
  ] as Movie[];

  return { featured, trending, makingOf, ahours, elBimboCollections, archiveMovies, all };
}

// ─── Map Supabase row → Movie interface ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Movie {
  const staticEquivalent = staticAllMovies.find((m) => m.id === row.id) || ({} as Partial<Movie>);

  return {
    id: row.id || staticEquivalent.id || '',
    title: row.title || staticEquivalent.title || '',
    thumbnail: row.thumbnail || staticEquivalent.thumbnail || '',
    banner: row.banner || staticEquivalent.banner || '',
    description: row.description || staticEquivalent.description || '',
    rating: row.rating || staticEquivalent.rating || '',
    year: row.year || staticEquivalent.year || '',
    duration: row.duration || staticEquivalent.duration || '',
    genre: (row.genre && row.genre.length > 0) ? row.genre : (staticEquivalent.genre ?? []),
    ageRating: row.ageRating || staticEquivalent.ageRating || '',
    contentWarnings: row.contentWarnings ?? staticEquivalent.contentWarnings,
    isOriginal: row.isOriginal ?? staticEquivalent.isOriginal ?? false,
    progress: row.progress ?? staticEquivalent.progress,
    desktopOnly: row.desktopOnly ?? staticEquivalent.desktopOnly ?? false,
    streamStatus: row.streamStatus ?? staticEquivalent.streamStatus,
    quality: row.quality || staticEquivalent.quality,
    mobileThumbnail: row.mobileThumbnail || staticEquivalent.mobileThumbnail,
    mobileBanner: row.mobileBanner || staticEquivalent.mobileBanner,
    cardBanner: row.cardBanner || staticEquivalent.cardBanner,
    mobileCardBanner: row.mobileCardBanner || staticEquivalent.mobileCardBanner,
    logo: row.logo || staticEquivalent.logo,
    videoUrl: row.videoUrl || staticEquivalent.videoUrl,
    detailMobileBanner: row.detailMobileBanner || staticEquivalent.detailMobileBanner,
    detailBanner: row.detailBanner || staticEquivalent.detailBanner,
    mobileCarouselBanner: row.mobileCarouselBanner || staticEquivalent.mobileCarouselBanner,
    subtitles: row.subtitles ?? staticEquivalent.subtitles,
    trailerUrl: row.trailerUrl || staticEquivalent.trailerUrl,
    trailerVttUrl: row.trailerVttUrl || staticEquivalent.trailerVttUrl,
    spriteUrl: row.spriteUrl || staticEquivalent.spriteUrl,
    spriteConfig: row.spriteConfig ?? staticEquivalent.spriteConfig,
    downloadUrl: row.downloadUrl || staticEquivalent.downloadUrl,
    seasons: row.seasons ?? staticEquivalent.seasons,
    squareThumbnail: row.squareThumbnail || staticEquivalent.squareThumbnail,
    tallTrailerUrl: row.tallTrailerUrl || staticEquivalent.tallTrailerUrl,
    mediaType: row.mediaType || staticEquivalent.mediaType || 'movie',
    xRay: row.xRay ?? staticEquivalent.xRay,
    comingSoon: row.comingSoon ?? staticEquivalent.comingSoon ?? (!row.videoUrl && !staticEquivalent.videoUrl),
  };
}

// ─── Main fetch ─────────────────────────────────────────────────────────────
export async function fetchAllMovies(): Promise<Movie[]> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) return _cache;

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No movies returned');

    _cache = data.map(row => {
      const mapped = mapRow(row);
      // Mutate the static array so that legacy imports get the synced data
      const staticEquivalent = staticAllMovies.find(m => m.id === row.id);
      if (staticEquivalent) {
        Object.assign(staticEquivalent, mapped);
      }
      return mapped;
    });
    _cacheTime = now;
    return _cache;
  } catch (err) {
    console.warn('[movieService] Supabase fetch failed, using local data:', err);
    return staticAllMovies;
  }
}

// ─── Convenience: build all rows in one call ────────────────────────────────
export type MovieRows = ReturnType<typeof buildRows>;

export async function fetchMovieRows(): Promise<MovieRows> {
  const movies = await fetchAllMovies();
  return buildRows(movies);
}

// ─── Single movie lookup ─────────────────────────────────────────────────────
export async function fetchMovieById(id: string): Promise<Movie | null> {
  // Check memory cache first
  if (_cache) {
    const hit = _cache.find((m) => m.id === id);
    if (hit) return hit;
  }

  // If not in cache or cache is empty, fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    const mapped = mapRow(data);
    const staticEquivalent = staticAllMovies.find(m => m.id === data.id);
    if (staticEquivalent) {
      Object.assign(staticEquivalent, mapped);
    }
    return mapped;
  } catch (err) {
    console.warn(`[movieService] Supabase fetch failed for id ${id}, using local data:`, err);
    return staticAllMovies.find((m) => m.id === id) ?? null;
  }
}

// ─── Invalidate cache (call after seeding) ──────────────────────────────────
export function invalidateMovieCache() {
  _cache = null;
  _cacheTime = 0;
}

// ─── Dynamic Home Rows ───────────────────────────────────────────────────────
export type HomeRowType = 'standard' | 'top10' | 'collection' | 'live';

export interface HomeRowConfig {
  id: string;
  sort_order: number;
  row_type: HomeRowType;
  title: string;
  movie_ids: string[];
  enabled: boolean;
  subtitle?: string;
  background_url?: string;
  mobile_bg_url?: string;
  logo_url?: string;
  see_all_path?: string;
}

export interface ResolvedHomeRow extends HomeRowConfig {
  movies: Movie[];
}

let _homeRowsCache: HomeRowConfig[] | null = null;
let _homeRowsCacheTime = 0;

export async function fetchHomeRows(): Promise<ResolvedHomeRow[]> {
  const now = Date.now();

  // Re-use cached row configs within TTL
  if (!_homeRowsCache || now - _homeRowsCacheTime > CACHE_TTL_MS) {
    try {
      const { data, error } = await supabase
        .from('home_rows')
        .select('*')
        .eq('enabled', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      _homeRowsCache = data as HomeRowConfig[];
      _homeRowsCacheTime = now;
    } catch (err) {
      console.warn('[movieService] home_rows fetch failed, using static fallback:', err);
      _homeRowsCache = null;
    }
  }

  // Fetch the movie pool
  const allMovies = await fetchAllMovies();
  const byId = Object.fromEntries(allMovies.map((m) => [m.id, m]));

  // If Supabase home_rows are available, resolve them
  if (_homeRowsCache && _homeRowsCache.length > 0) {
    return _homeRowsCache.map((row) => ({
      ...row,
      movies: row.movie_ids.map((id) => byId[id]).filter(Boolean) as Movie[],
    }));
  }

  // ── Static fallback (mirrors the old hardcoded Home.tsx layout) ──────────
  const staticRows = buildRows(allMovies);
  const fallback: ResolvedHomeRow[] = [
    {
      id: 'live',
      sort_order: 10,
      row_type: 'live',
      title: 'Live Stream',
      movie_ids: [],
      enabled: true,
      movies: [],
    },
    {
      id: 'g11-archives',
      sort_order: 20,
      row_type: 'standard',
      title: 'G11 Archives',
      movie_ids: staticRows.archiveMovies.map((m) => m.id),
      enabled: true,
      movies: staticRows.archiveMovies,
    },
    {
      id: 'top10',
      sort_order: 30,
      row_type: 'top10',
      title: 'Top 10 Titles in LSFPlus Today',
      movie_ids: [...allMovies]
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 10)
        .map((m) => m.id),
      enabled: true,
      movies: [...allMovies]
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 10),
    },
    {
      id: 'el-bimbo-collection',
      sort_order: 40,
      row_type: 'collection',
      title: 'Ang Huling El Bimbo Collections',
      movie_ids: staticRows.elBimboCollections.map((m) => m.id),
      enabled: true,
      movies: staticRows.elBimboCollections,
      subtitle: 'Browse the complete collection from the world of Ang Huling El Bimbo',
      background_url: 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection.png',
      mobile_bg_url: 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection-m.webp',
      logo_url: '/images/el-bimbo-logo.webp',
      see_all_path: '/collections/el-bimbo',
    },
  ];
  return fallback;
}

export function invalidateHomeRowsCache() {
  _homeRowsCache = null;
  _homeRowsCacheTime = 0;
}
