import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Info } from 'lucide-react';
import { featuredMovies } from '../data/movies';
import './TrailerPlayer.css';

export default function TrailerPlayer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const movie = featuredMovies.find((m) => m.id === id);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback to Minsan trailer if not provided
  const trailerUrl = movie?.trailerUrl || "https://ebrdhrulyjxleytptrpf.supabase.co/storage/v1/object/public/titles/Minsan/TRAILER.mp4";

  if (!movie) {
    return <div style={{ color: 'white' }}>Movie not found</div>;
  }

  return (
    <div className="trailer-player-container">
      <video
        ref={videoRef}
        className="trailer-video"
        src={trailerUrl}
        autoPlay
        playsInline
        controls={false}
      />
      
      <div className="trailer-overlay">
        <div className="trailer-top-left" onClick={() => navigate('/')}>
          <div className="trailer-back-btn">
            <ArrowLeft size={24} color="white" strokeWidth={2.5} />
          </div>
          <span className="trailer-back-text">Back to Browse</span>
        </div>

        <div className="trailer-bottom-right">
          {movie.logo ? (
            <img src={movie.logo} alt={movie.title} className="trailer-movie-logo" />
          ) : (
            <h1 className="trailer-movie-title">{movie.title}</h1>
          )}
          <div className="trailer-action-buttons">
            <button className="trailer-btn trailer-btn-play" onClick={() => navigate(`/watch/${movie.id}`)}>
              <Play size={18} fill="white" strokeWidth={0} /> Play
            </button>
            <button className="trailer-btn trailer-btn-info" onClick={() => {
              if (movie.id === 'f2') navigate('/minsan');
              else if (movie.id === 'f1') navigate('/ang-huling-el-bimbo-play');
              else navigate('/');
            }}>
              <Info size={18} /> More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
