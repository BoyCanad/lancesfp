import { featuredMovies, trendingMovies, makingOfLegacy, afterHours } from '../data/movies';
import fs from 'fs';

const allMovies = [
  ...featuredMovies,
  ...trendingMovies,
  makingOfLegacy,
  afterHours,
].filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'null';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function toSqlArray(arr: string[] | null | undefined): string {
  if (!arr || !Array.isArray(arr)) return 'null';
  if (arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map(v => escapeSql(v)).join(', ')}]`;
}

function escapeJson(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  return escapeSql(JSON.stringify(obj));
}

function toSqlBoolean(bool: boolean | undefined | null): string {
  return bool ? 'true' : 'false';
}

const schemaSql = `
-- 1. Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY
);

-- 2. Add any missing columns
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS banner TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS rating TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS genre TEXT[];
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "ageRating" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "contentWarnings" TEXT[];
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "isOriginal" BOOLEAN DEFAULT false;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS progress NUMERIC;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "desktopOnly" BOOLEAN DEFAULT false;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "streamStatus" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS quality TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "mobileThumbnail" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "mobileBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "cardBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "mobileCardBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "detailMobileBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "detailBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "mobileCarouselBanner" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS subtitles JSONB;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "trailerUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "trailerVttUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "spriteUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "spriteConfig" JSONB;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS seasons JSONB;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "squareThumbnail" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "tallTrailerUrl" TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'movie';
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS "xRay" JSONB;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
`;

const sql = allMovies.map(m => `
INSERT INTO movies (
  id, title, thumbnail, banner, description, rating, year, duration, genre, 
  "ageRating", "contentWarnings", "isOriginal", progress, "desktopOnly", 
  "streamStatus", quality, "mobileThumbnail", "mobileBanner", "cardBanner", 
  "mobileCardBanner", logo, "videoUrl", "detailMobileBanner", "detailBanner", 
  "mobileCarouselBanner", subtitles, "trailerUrl", "trailerVttUrl", "spriteUrl", 
  "spriteConfig", "downloadUrl", seasons, "squareThumbnail", "tallTrailerUrl", 
  "mediaType", "xRay"
) VALUES (
  ${escapeSql(m.id)},
  ${escapeSql(m.title)},
  ${escapeSql(m.thumbnail)},
  ${escapeSql(m.banner)},
  ${escapeSql(m.description)},
  ${escapeSql(m.rating)},
  ${parseInt(m.year) || 0},
  ${escapeSql(m.duration)},
  ${toSqlArray(m.genre)},
  ${escapeSql(m.ageRating)},
  ${toSqlArray(m.contentWarnings)},
  ${toSqlBoolean(m.isOriginal)},
  ${m.progress ?? 'null'},
  ${toSqlBoolean(m.desktopOnly)},
  ${escapeSql(m.streamStatus)},
  ${escapeSql(m.quality)},
  ${escapeSql(m.mobileThumbnail)},
  ${escapeSql(m.mobileBanner)},
  ${escapeSql(m.cardBanner)},
  ${escapeSql(m.mobileCardBanner)},
  ${escapeSql(m.logo)},
  ${escapeSql(m.videoUrl)},
  ${escapeSql(m.detailMobileBanner)},
  ${escapeSql(m.detailBanner)},
  ${escapeSql(m.mobileCarouselBanner)},
  ${escapeJson(m.subtitles || null)},
  ${escapeSql(m.trailerUrl)},
  ${escapeSql(m.trailerVttUrl)},
  ${escapeSql(m.spriteUrl)},
  ${escapeJson(m.spriteConfig || null)},
  ${escapeSql(m.downloadUrl)},
  ${escapeJson(m.seasons || null)},
  ${escapeSql(m.squareThumbnail)},
  ${escapeSql(m.tallTrailerUrl)},
  ${escapeSql(m.mediaType || 'movie')},
  ${escapeJson(m.xRay || null)}
) ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  thumbnail = EXCLUDED.thumbnail,
  banner = EXCLUDED.banner,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating,
  year = EXCLUDED.year,
  duration = EXCLUDED.duration,
  genre = EXCLUDED.genre,
  "ageRating" = EXCLUDED."ageRating",
  "contentWarnings" = EXCLUDED."contentWarnings",
  "isOriginal" = EXCLUDED."isOriginal",
  progress = EXCLUDED.progress,
  "desktopOnly" = EXCLUDED."desktopOnly",
  "streamStatus" = EXCLUDED."streamStatus",
  quality = EXCLUDED.quality,
  "mobileThumbnail" = EXCLUDED."mobileThumbnail",
  "mobileBanner" = EXCLUDED."mobileBanner",
  "cardBanner" = EXCLUDED."cardBanner",
  "mobileCardBanner" = EXCLUDED."mobileCardBanner",
  logo = EXCLUDED.logo,
  "videoUrl" = EXCLUDED."videoUrl",
  "detailMobileBanner" = EXCLUDED."detailMobileBanner",
  "detailBanner" = EXCLUDED."detailBanner",
  "mobileCarouselBanner" = EXCLUDED."mobileCarouselBanner",
  subtitles = EXCLUDED.subtitles,
  "trailerUrl" = EXCLUDED."trailerUrl",
  "trailerVttUrl" = EXCLUDED."trailerVttUrl",
  "spriteUrl" = EXCLUDED."spriteUrl",
  "spriteConfig" = EXCLUDED."spriteConfig",
  "downloadUrl" = EXCLUDED."downloadUrl",
  seasons = EXCLUDED.seasons,
  "squareThumbnail" = EXCLUDED."squareThumbnail",
  "tallTrailerUrl" = EXCLUDED."tallTrailerUrl",
  "mediaType" = EXCLUDED."mediaType",
  "xRay" = EXCLUDED."xRay";
`).join('\n');

fs.writeFileSync('seed.sql', schemaSql + '\n' + sql);
console.log('Successfully generated seed.sql');
