/**
 * Seed Script — pushes all local movie data to Supabase `movies` table.
 *
 * Run once from the project root (d:\App\Website\stream):
 *   npx tsx src/scripts/seedMovies.ts
 *
 * Requires:
 *   npm install -D tsx   (or use ts-node)
 *   VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY env vars  (or hardcoded fallbacks in supabaseClient.ts)
 */

import { createClient } from '@supabase/supabase-js';
import {
  featuredMovies,
  trendingMovies,
  makingOfLegacy,
  afterHours,
} from '../data/movies';
import type { Movie } from '../data/movies';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://figlafktafkwzmgeyslw.supabase.co';

// ⚠️  Use the SERVICE ROLE key (not the anon key) to bypass RLS.
// Set env var:  $env:SUPABASE_SERVICE_KEY="eyJ..."
// Or paste it directly below (never commit to git!).
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  'PASTE_YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Deduplicate by id, preserving first occurrence
const allMovies: Movie[] = [
  ...featuredMovies,
  ...trendingMovies,
  makingOfLegacy,
  afterHours,
].filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));

// Map Movie interface → DB row (match table column names exactly)
function toRow(m: Movie) {
  return {
    id: m.id,
    title: m.title,
    thumbnail: m.thumbnail,
    banner: m.banner,
    description: m.description,
    rating: m.rating,
    year: m.year,
    duration: m.duration,
    genre: m.genre,
    ageRating: m.ageRating,
    contentWarnings: m.contentWarnings ?? null,
    isOriginal: m.isOriginal ?? false,
    progress: m.progress ?? null,
    desktopOnly: m.desktopOnly ?? false,
    streamStatus: m.streamStatus ?? null,
    quality: m.quality ?? null,
    mobileThumbnail: m.mobileThumbnail ?? null,
    mobileBanner: m.mobileBanner ?? null,
    cardBanner: m.cardBanner ?? null,
    mobileCardBanner: m.mobileCardBanner ?? null,
    logo: m.logo ?? null,
    videoUrl: m.videoUrl ?? null,
    detailMobileBanner: m.detailMobileBanner ?? null,
    detailBanner: m.detailBanner ?? null,
    mobileCarouselBanner: m.mobileCarouselBanner ?? null,
    subtitles: m.subtitles ?? null,
    trailerUrl: m.trailerUrl ?? null,
    trailerVttUrl: m.trailerVttUrl ?? null,
    spriteUrl: m.spriteUrl ?? null,
    spriteConfig: m.spriteConfig ?? null,
    downloadUrl: m.downloadUrl ?? null,
    seasons: m.seasons ?? null,
    squareThumbnail: m.squareThumbnail ?? null,
    tallTrailerUrl: m.tallTrailerUrl ?? null,
    mediaType: m.mediaType ?? 'movie',
    xRay: m.xRay ?? null,
  };
}

async function seed() {
  console.log(`Seeding ${allMovies.length} movies…`);

  const rows = allMovies.map(toRow);

  const { data, error } = await supabase
    .from('movies')
    .upsert(rows, { onConflict: 'id' })
    .select('id');

  if (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Upserted ${data?.length ?? 0} movies:`);
  data?.forEach((r) => console.log(' •', r.id));
}

seed();
