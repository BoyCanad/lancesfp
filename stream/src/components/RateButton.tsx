import { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toggleLike } from '../services/profileService';

interface RateButtonProps {
  movieId: string;
  size?: number;
  showLabel?: boolean;
}

export default function RateButton({ movieId, size = 24, showLabel = true }: RateButtonProps) {
  const [isLiked, setIsLiked] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('activeProfile');
    if (stored && movieId) {
      const profile = JSON.parse(stored);
      supabase.from('liked_movies')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('movie_id', movieId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST204' || error.code === '42P01') {
              console.warn(`[RateButton] liked_movies table not found for movie ${movieId}.`);
              return;
            }
          }
          setIsLiked(!!data);
        });
    }
  }, [movieId]);

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const stored = localStorage.getItem('activeProfile');
    if (!stored || !movieId) return;
    const profile = JSON.parse(stored);
    
    // Optimistic UI
    const newLiked = !isLiked;
    setIsLiked(newLiked);

    try {
      await toggleLike(profile.id, movieId);
    } catch (err) {
      console.error('Failed to toggle like', err);
      setIsLiked(!newLiked); // Rollback
    }
  };

  return (
    <button className="mdetail-quick-btn" onClick={handleToggle}>
      <ThumbsUp 
        size={size} 
        color={isLiked ? "#46d369" : "white"} 
        fill={isLiked ? "#46d369" : "transparent"} 
        strokeWidth={1.5} 
      />
      {showLabel && (
        <span style={{ color: isLiked ? "#46d369" : "white" }}>
          {isLiked ? 'Liked' : 'Rate'}
        </span>
      )}
    </button>
  );
}
