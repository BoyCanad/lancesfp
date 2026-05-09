import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { createProfile, getProfiles } from '../services/profileService';
import './CreateProfile.css';

const iconCategories = {
  classics: [
    'https://api.dicebear.com/7.x/bottts/svg?seed=newuser&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/bottts/svg?seed=eggman&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dog&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=frog&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4',
  ],
  elBimbo: [
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/1.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/2.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/3.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/4.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/5.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/6.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/7.webp',
    'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/8.webp',
  ]
};

export default function CreateProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconCategories.classics[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfiles().then(profiles => {
      if (profiles.length >= 5) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createProfile(name.trim(), selectedIcon);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-container">
      <header className="cp-header">
        <div className="cp-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
      </header>

      <div className="cp-main-wrapper">
        <div className="cp-main">
          <h1 className="cp-title">Add Profile</h1>
          <p className="cp-subtitle">Add a profile for another person watching LSFPlus.</p>

          <form className="cp-form" onSubmit={handleContinue}>
            <div className="cp-avatar-section">
              {/* Avatar with pencil overlay */}
              <div className="cp-avatar-wrapper" onClick={() => setShowIconPicker((v) => !v)}>
                <img src={selectedIcon} alt="Profile icon" className="cp-avatar" />
                <div className="cp-avatar-overlay">
                  <Pencil size={22} color="white" />
                </div>
              </div>

              <div className="cp-input-group">
                <input
                  type="text"
                  placeholder="Name"
                  className="cp-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                {error && <p className="cp-error">{error}</p>}
              </div>
            </div>


            <div className="cp-actions">
              <button
                type="submit"
                className={`cp-btn cp-continue-btn ${name.trim() ? 'active' : ''}`}
                disabled={!name.trim() || loading}
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
              <button
                type="button"
                className="cp-btn cp-cancel-btn"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Icon Picker Popup */}
      {showIconPicker && (
        <div className="cp-modal-overlay" onClick={() => setShowIconPicker(false)}>
          <div className="cp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">Choose your avatar</h2>
              <button className="cp-modal-close" onClick={() => setShowIconPicker(false)}>×</button>
            </div>
            
            <div className="cp-icon-picker-scroll">
              <div className="cp-picker-section">
                <h3 className="cp-picker-category-title">The Classics</h3>
                <div className="cp-icon-grid">
                  {iconCategories.classics.map((icon, idx) => (
                    <img
                      key={idx}
                      src={icon}
                      alt={`Classic Icon ${idx + 1}`}
                      className={`cp-icon-option ${selectedIcon === icon ? 'cp-icon-option--selected' : ''}`}
                      onClick={() => {
                        setSelectedIcon(icon);
                        setShowIconPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="cp-picker-section">
                <h3 className="cp-picker-category-title">Ang Huling El Bimbo</h3>
                <div className="cp-icon-grid">
                  {iconCategories.elBimbo.map((icon, idx) => (
                    <img
                      key={idx}
                      src={icon}
                      alt={`El Bimbo Icon ${idx + 1}`}
                      className={`cp-icon-option ${selectedIcon === icon ? 'cp-icon-option--selected' : ''}`}
                      onClick={() => {
                        setSelectedIcon(icon);
                        setShowIconPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
