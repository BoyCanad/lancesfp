import { supabase } from '../supabaseClient';

export interface EPGProgram {
  id: string;
  title: string;
  description: string;
  start: Date;
  stop: Date;
  subtitles: string | null;
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
    description: item.description,
    start: new Date(item.start_time),
    stop: new Date(item.stop_time),
    subtitles: item.subtitles_url
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
