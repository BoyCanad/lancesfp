import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://figlafktafkwzmgeyslw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('device_codes')
      .select('id, code, status, user_id, access_token, refresh_token, created_at, expires_at')
      .limit(1);

    if (error) {
      console.log('Postgres returned error:', error.message);
    } else {
      console.log('Core columns exist! Valid columns verified.');
    }
  } catch (err) {
    console.error('Error querying columns:', err);
  }
}

checkColumns();
