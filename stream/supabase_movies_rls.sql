-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so anyone can fetch movies)
CREATE POLICY "Allow public read access" 
ON public.movies 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update movies (Admin Import)
-- If your users aren't always authenticated when importing, you can change 'authenticated' to 'anon', 
-- but it is safer to require authentication.
CREATE POLICY "Allow authenticated insert access" 
ON public.movies 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" 
ON public.movies 
FOR UPDATE 
TO authenticated 
USING (true);

-- If you are testing without logging in and want to allow anyone to import:
-- Uncomment the following lines to allow public (anon) insert/update:

-- CREATE POLICY "Allow anon insert access" ON public.movies FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Allow anon update access" ON public.movies FOR UPDATE TO anon USING (true);
