import { supabase } from '../supabaseClient';

export interface PollResult {
  option: string;
  votes: number;
  percentage: number;
}

export async function submitPollVote(pollQuestion: string, selectedOption: string, profileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('poll_votes')
      .upsert({
        poll_question: pollQuestion,
        profile_id: profileId,
        selected_option: selectedOption
      }, { onConflict: 'poll_question,profile_id' });
      
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
         console.warn('poll_votes table not found');
         return false;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to submit vote:', err);
    return false;
  }
}

export async function getPollResults(pollQuestion: string, options: string[]): Promise<PollResult[]> {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('selected_option')
      .eq('poll_question', pollQuestion);
      
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
         return options.map(opt => ({ option: opt, votes: 0, percentage: 0 }));
      }
      throw error;
    }
    
    const totalVotes = data.length;
    const voteCounts: Record<string, number> = {};
    
    options.forEach(opt => { voteCounts[opt] = 0; });
    
    data.forEach(row => {
      const opt = row.selected_option;
      if (voteCounts[opt] !== undefined) {
        voteCounts[opt]++;
      }
    });
    
    return options.map(opt => ({
      option: opt,
      votes: voteCounts[opt] || 0,
      percentage: totalVotes > 0 ? Math.round(((voteCounts[opt] || 0) / totalVotes) * 100) : 0
    }));
  } catch (err) {
    console.error('Failed to fetch results:', err);
    return options.map(opt => ({ option: opt, votes: 0, percentage: 0 }));
  }
}

export async function getUserVote(pollQuestion: string, profileId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('poll_votes')
            .select('selected_option')
            .eq('poll_question', pollQuestion)
            .eq('profile_id', profileId)
            .maybeSingle();
            
        if (error || !data) return null;
        return data.selected_option;
    } catch (err) {
        return null;
    }
}
