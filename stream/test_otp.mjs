import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://figlafktafkwzmgeyslw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2xhZmt0YWZrd3ptZ2V5c2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzAwODgsImV4cCI6MjA5MTYwNjA4OH0.k0L7JfGbe3p3G6wzOTowa-sfnozihWQrHILliwAC-Xo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test_${Date.now()}@example.com`;
  console.log('Testing signUp with new email:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Check_Only_Password_123!'
  });
  
  console.log('Result error:', error);
  console.log('Result data:', data);
}

test();
