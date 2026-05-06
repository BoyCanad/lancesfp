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
    ...all.filter((m) => !archiveLeadIds.includes(m.id) && !FEATURED_IDS.includes(m.id)),
  ] as Movie[];

  return { featured, trending, makingOf, ahours, elBimboCollections, archiveMovies, all };
}

// ─── Map Supabase row → Movie interface ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Movie {
  return {
    id: row.id,
    title: row.title,
    thumbnail: row.thumbnail,
    banner: row.banner,
    description: row.description,
    rating: row.rating,
    year: row.year,
    duration: row.duration,
    genre: row.genre ?? [],
    ageRating: row.ageRating,
    contentWarnings: row.contentWarnings ?? undefined,
    isOriginal: row.isOriginal ?? false,
    progress: row.progress ?? undefined,
    desktopOnly: row.desktopOnly ?? false,
    streamStatus: row.streamStatus ?? undefined,
    quality: row.quality ?? undefined,
    mobileThumbnail: row.mobileThumbnail ?? undefined,
    mobileBanner: row.mobileBanner ?? undefined,
    cardBanner: row.cardBanner ?? undefined,
    mobileCardBanner: row.mobileCardBanner ?? undefined,
    logo: row.logo ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    detailMobileBanner: row.detailMobileBanner ?? undefined,
    detailBanner: row.detailBanner ?? undefined,
    mobileCarouselBanner: row.mobileCarouselBanner ?? undefined,
    subtitles: row.subtitles ?? undefined,
    trailerUrl: row.trailerUrl ?? undefined,
    trailerVttUrl: row.trailerVttUrl ?? undefined,
    spriteUrl: row.spriteUrl ?? undefined,
    spriteConfig: row.spriteConfig ?? undefined,
    downloadUrl: row.downloadUrl ?? undefined,
    seasons: row.seasons ?? undefined,
    squareThumbnail: row.squareThumbnail ?? undefined,
    tallTrailerUrl: row.tallTrailerUrl ?? undefined,
    mediaType: row.mediaType ?? 'movie',
    xRay: row.xRay ?? undefined,
    comingSoon: row.comingSoon || !row.videoUrl || row.videoUrl === '' || row.id === 'beyond-the-last-dance',
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

    _cache = data.map(mapRow);
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
  // Try cache / static first for speed
  const cached = _cache ?? staticAllMovies;
  const hit = cached.find((m) => m.id === id);
  if (hit) return hit;

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapRow(data);
  } catch {
    return null;
  }
}

// ─── Invalidate cache (call after seeding) ──────────────────────────────────
export function invalidateMovieCache() {
  _cache = null;
  _cacheTime = 0;
}
