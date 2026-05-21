import { supabase } from '../supabaseClient';

export interface MovieReminder {
  profile_id: string;
  movie_id: string;
  created_at?: string;
}

export async function getReminders(profileId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('movie_reminders')
      .select('movie_id')
      .eq('profile_id', profileId);

    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
        // Table doesn't exist, fallback to localStorage
        const stored = localStorage.getItem(`lsfplus_reminders_${profileId}`);
        return stored ? JSON.parse(stored) : [];
      }
      throw error;
    }
    return (data || []).map(item => item.movie_id);
  } catch (err) {
    const stored = localStorage.getItem(`lsfplus_reminders_${profileId}`);
    return stored ? JSON.parse(stored) : [];
  }
}

export async function toggleReminder(profileId: string, movieId: string): Promise<boolean> {
  // Sync to local first (guaranteed backup)
  const storedKey = `lsfplus_reminders_${profileId}`;
  const localReminders: string[] = JSON.parse(localStorage.getItem(storedKey) || '[]');
  const isCurrentlyReminded = localReminders.includes(movieId);
  let nextReminded = !isCurrentlyReminded;

  if (isCurrentlyReminded) {
    localStorage.setItem(storedKey, JSON.stringify(localReminders.filter(id => id !== movieId)));
  } else {
    localStorage.setItem(storedKey, JSON.stringify([...localReminders, movieId]));
  }

  // Update Supabase
  if (navigator.onLine) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('movie_reminders')
        .select('*')
        .eq('profile_id', profileId)
        .eq('movie_id', movieId)
        .maybeSingle();

      if (!fetchError) {
        if (existing) {
          await supabase
            .from('movie_reminders')
            .delete()
            .eq('profile_id', profileId)
            .eq('movie_id', movieId);
          nextReminded = false;
        } else {
          // get user ID
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase
              .from('movie_reminders')
              .insert({
                user_id: session.user.id,
                profile_id: profileId,
                movie_id: movieId
              });
            nextReminded = true;
          }
        }
      } else {
        console.warn('Supabase fetch reminder returned error code:', fetchError.code);
      }
    } catch (err) {
      console.warn('Syncing reminder to Supabase failed, using local fallback:', err);
    }
  }

  window.dispatchEvent(new Event('reminders_updated'));
  return nextReminded;
}

export async function isReminded(profileId: string, movieId: string): Promise<boolean> {
  const reminders = await getReminders(profileId);
  return reminders.includes(movieId);
}
