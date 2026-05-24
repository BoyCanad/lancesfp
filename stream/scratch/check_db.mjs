import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://figlafktafkwzmgeyslw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert(payload, label) {
  try {
    const { data, error } = await supabase
      .from('device_codes')
      .insert({
        user_id: 'd5c5f464-9467-4e67-91fb-1811e550e50f', // dummy
        expires_at: new Date(Date.now() + 1000000).toISOString(),
        ...payload
      })
      .select();

    if (error) {
      console.log(`[${label}] Failed with message:`, error.message);
    } else {
      console.log(`[${label}] Succeeded!`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

async function runTests() {
  // Test 1: Long code
  await testInsert({ code: 'LONGERTHAN6', status: 'A', access_token: 'A', refresh_token: 'A' }, 'Long Code (11 chars)');

  // Test 2: Standard code (6 chars), approved status (8 chars)
  await testInsert({ code: 'AAAAAA', status: 'approved', access_token: 'A', refresh_token: 'A' }, 'Approved Status (8 chars)');

  // Test 3: Standard code (6 chars), status (1 char), long access_token
  await testInsert({ code: 'BBBBBB', status: 'A', access_token: '{"device_name":"Windows PC • Chrome"}', refresh_token: 'A' }, 'Long Access Token (37 chars)');

  // Test 4: Standard code (6 chars), status (1 char), long refresh_token
  await testInsert({ code: 'CCCCCC', status: 'A', access_token: 'A', refresh_token: '{"device_name":"Windows PC • Chrome"}' }, 'Long Refresh Token (37 chars)');
}

runTests();
