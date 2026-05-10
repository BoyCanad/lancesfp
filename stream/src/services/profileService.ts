import { supabase } from '../supabaseClient';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  image: string;
  locked: boolean;
  pin?: string;
  icon_history?: string[];
  display_order: number;
}

export interface WatchProgress {
  id: string;
  profile_id: string;
  movie_id: string;
  progress_ms: number;
  duration_ms: number;
  last_watched: string;
}

export interface RecentlyWatched {
  id: string;
  profile_id: string;
  movie_id: string;
  watched_at: string;
  episode_info?: string;
}

const PROFILES_CACHE_KEY = 'lsfplus_profiles_cache';

export function getCachedProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem(PROFILES_CACHE_KEY, JSON.stringify(profiles));
  } catch {
    // storage quota exceeded — ignore
  }
}

export async function getProfiles(): Promise<Profile[]> {
  // If offline, serve from cache immediately
  if (!navigator.onLine) {
    const cached = getCachedProfiles();
    if (cached.length > 0) return cached;
    // No cache available — throw so caller knows
    throw new Error('offline');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    const profiles = data || [];
    // Persist to cache for offline use
    setCachedProfiles(profiles);
    return profiles;
  } catch (err) {
    // Network failed despite navigator.onLine — try cache as fallback
    const cached = getCachedProfiles();
    if (cached.length > 0) return cached;
    throw err;
  }
}

export async function createProfile(name: string, image: string): Promise<Profile> {
  if (!navigator.onLine) return {} as any;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const existing = await getProfiles();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: session.user.id,
      name,
      image,
      locked: false,
      display_order: existing.length,
      icon_history: [image]
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'image' | 'locked' | 'pin' | 'icon_history'>>
): Promise<Profile> {
  if (!navigator.onLine) return {} as any;
  // If updating image, handle history
  if (updates.image) {
    const { data: current } = await supabase
      .from('profiles')
      .select('icon_history, image')
      .eq('id', id)
      .single();
    
    if (current) {
      const history = current.icon_history || (current.image ? [current.image] : []);
      if (!history.includes(updates.image)) {
        updates.icon_history = [...history, updates.image];
      }
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id: string): Promise<void> {
  if (!navigator.onLine) return;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function getWatchProgress(profileId: string): Promise<WatchProgress[]> {
  const { data, error } = await supabase
    .from('watch_progress')
    .select('*')
    .eq('profile_id', profileId)
    .order('last_watched', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateWatchProgress(
  profileId: string,
  movieId: string,
  progressMs: number,
  durationMs: number
): Promise<void> {
  if (!navigator.onLine) return;
  const { error } = await supabase
    .from('watch_progress')
    .upsert({
      profile_id: profileId,
      movie_id: movieId,
      progress_ms: progressMs,
      duration_ms: durationMs,
      last_watched: new Date().toISOString()
    }, { onConflict: 'profile_id,movie_id' });
  
  if (error) throw error;
}
export async function deleteWatchProgress(profileId: string, movieId: string): Promise<void> {
  if (!navigator.onLine) return;
  const { error } = await supabase
    .from('watch_progress')
    .delete()
    .eq('profile_id', profileId)
    .eq('movie_id', movieId);
  
  if (error) throw error;
}

export async function getRecentlyWatched(profileId: string): Promise<RecentlyWatched[]> {
  try {
    const { data, error } = await supabase
      .from('recently_watched')
      .select('*')
      .eq('profile_id', profileId)
      .order('watched_at', { ascending: false });
    
    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') {
        console.warn('recently_watched table not found. Please create it in Supabase.');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn('Recently watched fetch failed:', err);
    return [];
  }
}

export async function addToRecentlyWatched(profileId: string, movieId: string, episodeInfo?: string): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const { error } = await supabase
      .from('recently_watched')
      .upsert({
        profile_id: profileId,
        movie_id: movieId,
        episode_info: episodeInfo,
        watched_at: new Date().toISOString()
      }, { onConflict: 'profile_id,movie_id' });
    
    if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
            console.warn('recently_watched table not found. Cannot save history.');
            return;
        }
        throw error;
    }
  } catch (err) {
    console.warn('Could not add to recently watched:', err);
  }
}

export async function getLikedMovies(profileId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('liked_movies')
      .select('movie_id')
      .eq('profile_id', profileId);
    
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
        console.warn('liked_movies table not found. Please create it in Supabase.');
        return [];
      }
      throw error;
    }
    return (data || []).map(item => item.movie_id);
  } catch (err) {
    return [];
  }
}

export async function toggleLike(profileId: string, movieId: string): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('liked_movies')
      .select('*')
      .eq('profile_id', profileId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (fetchError) {
      if (fetchError.code === 'PGRST204' || fetchError.code === '42P01') {
        console.error('liked_movies table not found. Please create it in your Supabase dashboard.');
        return false;
      }
      throw fetchError;
    }

    if (existing) {
      await supabase
        .from('liked_movies')
        .delete()
        .eq('profile_id', profileId)
        .eq('movie_id', movieId);
      return false;
    } else {
      await supabase
        .from('liked_movies')
        .insert({ profile_id: profileId, movie_id: movieId });
      return true;
    }
  } catch (err) {
    console.warn('Toggle like failed:', err);
    return false;
  }
}
