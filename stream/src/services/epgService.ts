import { supabase } from '../supabaseClient';

export interface EPGProgram {
  id: string;
  title: string;
  episode_title?: string | null;
  episode_thumbnail?: string | null;
  description: string;
  start: Date;
  stop: Date;
  subtitles: string | null;
  recording_url?: string | null;
}

/**
 * Fetches the complete live schedule from Supabase
 * Ordered by start time to ensure logical progression
 */
export const getLiveSchedule = async (): Promise<EPGProgram[]> => {
  const { data, error } = await supabase
    .from('live_schedule')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching live schedule:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    episode_title: item.episode_title,
    episode_thumbnail: item.episode_thumbnail,
    description: item.description,
    start: new Date(item.start_time),
    stop: new Date(item.stop_time),
    subtitles: item.subtitles_url,
    recording_url: item.recording_url
  }));
};

/**
 * Subscribes to changes in the live schedule table
 * This allows the site to update instantly when the DB changes
 */
export const subscribeToScheduleChanges = (onUpdate: () => void) => {
  return supabase
    .channel('live_schedule_changes')
    .on(
      'postgres_changes',
      { event: '*', table: 'live_schedule', schema: 'public' },
      () => onUpdate()
    )
    .subscribe();
};

export interface PastStream {
  id: string;
  created_at: Date;
  title: string;
  description: string;
  recording_url: string;
  thumbnail_url: string | null;
  subtitles_url: string | null;
  duration_minutes: number | null;
  start_time: Date;
  end_time: Date;
}

export const getPastStreams = async (): Promise<PastStream[]> => {
  const { data, error } = await supabase
    .from('past_streams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching past streams:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    created_at: new Date(item.created_at),
    title: item.title,
    description: item.description,
    recording_url: item.recording_url,
    thumbnail_url: item.thumbnail_url,
    subtitles_url: item.subtitles_url,
    duration_minutes: item.duration_minutes,
    start_time: new Date(item.start_time),
    end_time: new Date(item.end_time)
  }));
};
