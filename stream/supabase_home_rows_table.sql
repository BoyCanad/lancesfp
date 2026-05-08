-- ─────────────────────────────────────────────────────────────────────────────
-- home_rows: defines the dynamic content rows shown on the Home page
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.home_rows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order  int  NOT NULL DEFAULT 0,           -- controls display order
  row_type    text NOT NULL DEFAULT 'standard',  -- 'standard' | 'top10' | 'collection' | 'live'
  title       text NOT NULL,                     -- row heading text
  movie_ids   text[] NOT NULL DEFAULT '{}',      -- ordered list of movie IDs
  enabled     boolean NOT NULL DEFAULT true,     -- toggle without deleting
  -- Extra fields used by the 'collection' row_type
  subtitle        text,
  background_url  text,
  mobile_bg_url   text,
  logo_url        text,
  see_all_path    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (read-only for anon users)
ALTER TABLE public.home_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.home_rows
  FOR SELECT USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER home_rows_updated_at
  BEFORE UPDATE ON public.home_rows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: replicate the current hardcoded Home.tsx rows
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.home_rows (sort_order, row_type, title, movie_ids) VALUES
(10, 'live',       'Live Stream',                       '{}'),
(20, 'standard',   'G11 Archives', ARRAY[
  't1',
  'ang-huling-el-bimbo-play',
  'ang-huling-el-bimbo-play-xray',
  'beyond-the-last-dance',
  'bukang-liwayway-takipsilim',
  'a-day-in-my-life-stem',
  'minsan',
  'tindahan-ni-aling-nena',
  'alapaap-overdrive',
  'spoliarium-graduation',
  'pare-ko',
  'tama-ka-ligaya',
  'ang-huling-el-bimbo'
]),
(30, 'top10',      'Top 10 Titles in LSFPlus Today', ARRAY[
  'ang-huling-el-bimbo-play',
  'tindahan-ni-aling-nena',
  'minsan',
  'pare-ko',
  'tama-ka-ligaya',
  'ang-huling-el-bimbo',
  'alapaap-overdrive',
  'spoliarium-graduation',
  'ang-huling-el-bimbo-play-xray',
  'beyond-the-last-dance'
]),
(40, 'collection', 'Ang Huling El Bimbo Collections', ARRAY[
  'ang-huling-el-bimbo-play',
  'ang-huling-el-bimbo-play-xray',
  'beyond-the-last-dance',
  'minsan',
  'tindahan-ni-aling-nena',
  'alapaap-overdrive',
  'spoliarium-graduation',
  'pare-ko',
  'tama-ka-ligaya',
  'ang-huling-el-bimbo'
]);

-- Update the collection row with its extra metadata
UPDATE public.home_rows
SET
  subtitle       = 'Browse the complete collection from the world of Ang Huling El Bimbo',
  background_url = 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection.png',
  mobile_bg_url  = 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection-m.webp',
  logo_url       = '/images/el-bimbo-logo.webp',
  see_all_path   = '/collections/el-bimbo'
WHERE row_type = 'collection';
