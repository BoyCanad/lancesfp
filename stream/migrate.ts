import { createClient } from '@supabase/supabase-js';
import { allMovies } from './src/data/movies.ts';

const supabaseUrl = 'https://figlafktafkwzmgeyslw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo'; // ⚠️ Put your anon key here
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateMovies() {
    console.log(`Starting migration for ${allMovies.length} movies...`);

    // Insert all at once! No mapping needed because the DB columns perfectly match your interface.
    const { data, error } = await supabase
        .from('movies')
        .insert(allMovies);

    if (error) {
        console.error('Error inserting movies:', error);
    } else {
        console.log('✅ Successfully migrated all movies to Supabase!');
    }
}

migrateMovies();
