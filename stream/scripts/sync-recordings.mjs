/**
 * sync-recordings.mjs
 * 
 * Fetches recent Livepeer recordings and inserts any new ones into Supabase past_streams.
 * 
 * Usage:
 *   node scripts/sync-recordings.mjs
 * 
 * Requires environment variables (add to .env.local):
 *   LIVEPEER_API_KEY=<your key>
 *   SUPABASE_SERVICE_ROLE_KEY=<your service role key>
 */

import { createClient } from '@supabase/supabase-js';

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;
const SUPABASE_URL = 'https://figlafktafkwzmgeyslw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!LIVEPEER_API_KEY) {
  console.error('❌ Missing LIVEPEER_API_KEY environment variable.');
  console.error('   Set it with: $env:LIVEPEER_API_KEY="your-key" before running.');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-key" before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchLivepeerRecordings() {
  const res = await fetch('https://livepeer.studio/api/session?limit=20', {
    headers: {
      Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Livepeer API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function syncRecordings() {
  console.log('📡 Fetching recent Livepeer recordings...');
  const sessions = await fetchLivepeerRecordings();

  // Filter only sessions that have a completed recording
  const recorded = sessions.filter(s => s.recordingStatus === 'ready' && s.recordingUrl);
  console.log(`✅ Found ${recorded.length} ready recordings out of ${sessions.length} sessions.`);

  for (const session of recorded) {
    const recordingUrl = session.recordingUrl;

    // Check if already in Supabase
    const { data: existing } = await supabase
      .from('past_streams')
      .select('id')
      .eq('recording_url', recordingUrl)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Already exists, skipping: ${recordingUrl}`);
      continue;
    }

    // Derive metadata
    const startDate = new Date(session.createdAt);
    const durationMs = session.duration ? session.duration * 1000 : 0;
    const endDate = new Date(startDate.getTime() + durationMs);
    const durationMinutes = session.duration ? Math.round(session.duration / 60) : null;

    const title = startDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
    });

    const { error } = await supabase.from('past_streams').insert({
      title,
      description: null,
      recording_url: recordingUrl,
      thumbnail_url: null,
      subtitles_url: null,
      duration_minutes: durationMinutes,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
    });

    if (error) {
      console.error(`❌ Failed to insert ${recordingUrl}:`, error.message);
    } else {
      console.log(`✅ Inserted: "${title}" — ${recordingUrl}`);
    }
  }

  console.log('\n🎉 Sync complete!');
}

syncRecordings().catch(err => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
