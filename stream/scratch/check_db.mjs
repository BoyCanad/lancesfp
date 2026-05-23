import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://figlafktafkwzmgeyslw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    const dummyUserId = 'd5c5f464-9467-4e67-91fb-1811e550e50f'; // dummy user
    // Generate an exact 6-character uppercase alphanumeric code
    const dummyCode = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, 'X').slice(0, 6);
    const meta = {
      device_name: 'Scratch Test Device',
      device_type: 'desktop',
      location: 'Manila, Philippines',
      recent_profile: 'Main Profile',
      recent_profile_image: '',
      last_used: new Date().toISOString(),
    };

    console.log(`Attempting insert with code: ${dummyCode} (${dummyCode.length} chars)...`);
    const { data, error } = await supabase
      .from('device_codes')
      .insert({
        code: dummyCode,
        status: 'approved',
        user_id: dummyUserId,
        access_token: JSON.stringify(meta),
        expires_at: new Date(Date.now() + 1000 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select();

    if (error) {
      console.error('Insert failed with error:', error);
    } else {
      console.log('Insert succeeded! Row created:', data);
      
      // Clean it up
      if (data && data[0]) {
        const { error: delError } = await supabase
          .from('device_codes')
          .delete()
          .eq('id', data[0].id);
        console.log('Cleanup delete:', delError ? 'failed' : 'succeeded');
      }
    }
  } catch (err) {
    console.error('Thrown error:', err);
  }
}

testInsert();
