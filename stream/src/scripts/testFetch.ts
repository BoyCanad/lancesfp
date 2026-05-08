import { supabase } from '../supabaseClient';
async function test() {
  const { data, error } = await supabase.from('movies').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data?.[0] ? Object.keys(data[0]) : 'no data');
}
test();
