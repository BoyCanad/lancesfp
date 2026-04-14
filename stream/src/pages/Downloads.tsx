import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, Smartphone, Download, ChevronLeft } from 'lucide-react';
import { downloadService } from '../services/downloadService';
import type { DownloadedMovie } from '../services/downloadService';
import './Downloads.css';

export default function Downloads() {
  const [downloads, setDownloads] = useState<DownloadedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const all = await downloadService.getAllDownloaded();
      setDownloads(all.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${title}" from your downloads?`)) {
      await downloadService.deleteDownload(id);
      loadDownloads();
    }
  };

  const handlePlay = (movie: DownloadedMovie) => {
    navigate(`/watch/${movie.id}?src=offline`, { state: { offlineUrl: movie.url } });
  };

  return (
    <div className="downloads-page">
      <div className="downloads-header">
        <button className="downloads-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1>My Downloads</h1>
      </div>

      <div className="downloads-container">
        {loading ? (
          <div className="downloads-loading">
            <div className="downloads-spinner"></div>
          </div>
        ) : downloads.length === 0 ? (
          <div className="downloads-empty">
            <div className="downloads-empty-icon">
              <Smartphone size={64} strokeWidth={1} />
              <Download size={24} className="downloads-overlay-icon" />
            </div>
            <h2>No Downloads</h2>
            <p>Movies and shows you download will appear here, so you can watch them anywhere, even without Wi-Fi.</p>
            <button className="downloads-explore-btn" onClick={() => navigate('/browse')}>
              Find Something to Download
            </button>
          </div>
        ) : (
          <div className="downloads-grid">
            {downloads.map((movie) => (
              <div 
                key={movie.id} 
                className="downloads-card"
                onClick={() => handlePlay(movie)}
              >
                <div className="downloads-card__thumb">
                  <img src={movie.thumbnail} alt={movie.title} />
                  <div className="downloads-card__overlay">
                    <div className="downloads-card__play">
                      <Play size={32} fill="white" />
                    </div>
                  </div>
                </div>
                <div className="downloads-card__info">
                  <div className="downloads-card__text">
                    <h3>{movie.title}</h3>
                    <p>{movie.duration} • 1.2 GB • Downloaded</p>
                  </div>
                  <button 
                    className="downloads-card__delete"
                    onClick={(e) => handleDelete(e, movie.id, movie.title)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
