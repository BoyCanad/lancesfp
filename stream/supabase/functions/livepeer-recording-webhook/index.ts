// @ts-nocheck
// This file runs on Deno (Supabase Edge Functions). ESM URL imports and Deno.* globals
// are valid at runtime but unrecognised by the local Node.js TypeScript server — ignore.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Log full payload so we can inspect the exact structure in Supabase logs
  console.log('[livepeer-webhook] Full payload:', JSON.stringify(body));

  // Only handle recording.ready
  if (body.event !== 'recording.ready') {
    return new Response(JSON.stringify({ skipped: true, event: body.event }), { status: 200 });
  }

  // Livepeer actual webhook structure (as of 2024):
  // body.payload.recordingUrl  — HLS playback URL
  // body.payload.mp4Url        — direct MP4 download
  // body.payload.duration      — seconds (float)
  // body.stream.createdAt      — epoch ms when stream started
  // body.stream.name           — stream name set in Livepeer dashboard
  const lp = body.payload ?? {};
  const stream = body.stream ?? {};

  // Try every known location for the recording URL
  const recordingUrl =
    lp.recordingUrl ||
    lp.downloadUrl ||
    lp.mp4Url ||
    stream.recordingUrl ||
    body.recordingUrl ||
    body.downloadUrl ||
    body.mp4Url;

  if (!recordingUrl) {
    console.error('[livepeer-webhook] No recording URL found. payloadKeys:', Object.keys(lp), 'bodyKeys:', Object.keys(body));
    return new Response(
      JSON.stringify({ error: 'No recording URL in payload', payloadKeys: Object.keys(lp), bodyKeys: Object.keys(body) }),
      { status: 422 }
    );
  }

  const durationSeconds = lp.duration ?? body.duration ?? null;
  const durationMinutes = durationSeconds ? Math.round(durationSeconds / 60) : null;

  const streamStartMs = stream.createdAt ?? body.timestamp ?? Date.now();
  const streamStartDate = new Date(streamStartMs);
  const streamEndDate = durationSeconds
    ? new Date(streamStartMs + durationSeconds * 1000)
    : new Date(Date.now());

  const title = stream.name?.trim()
    ? stream.name.trim()
    : streamStartDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
      });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Deduplicate — prevent double inserts on webhook retries
  const { data: existing } = await supabase
    .from('past_streams')
    .select('id')
    .eq('recording_url', recordingUrl)
    .maybeSingle();

  if (existing) {
    console.log('[livepeer-webhook] Already exists, skipping:', recordingUrl);
    return new Response(JSON.stringify({ skipped: true, reason: 'duplicate' }), { status: 200 });
  }

  const { error } = await supabase.from('past_streams').insert({
    title,
    description: null,
    recording_url: recordingUrl,
    thumbnail_url: null,
    subtitles_url: null,
    duration_minutes: durationMinutes,
    start_time: streamStartDate.toISOString(),
    end_time: streamEndDate.toISOString(),
  });

  if (error) {
    console.error('[livepeer-webhook] Supabase insert error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log('[livepeer-webhook] Inserted:', title, recordingUrl);
  return new Response(JSON.stringify({ success: true, title, recordingUrl }), { status: 200 });
});
