import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://figlafktafkwzmgeyslw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('movies').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data?.[0] ? Object.keys(data[0]) : 'no data');
}
checkColumns();
