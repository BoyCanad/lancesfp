import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Gamepad2, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfiles, updateProfile } from '../services/profileService';
import type { Profile } from '../services/profileService';
import './EditProfile.css';

export default function EditProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === id);
      if (found) {
        setProfile(found);
        setName(found.name);
        setImage(location.state?.newIcon || found.image);
      }
    });
  }, [id, location.state]);

  const handleSave = async () => {
    if (!profile || !id) return;
    setLoading(true);
    try {
      await updateProfile(id, { name, image });
      navigate(`/ManageProfile/${id}`);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="ep-container">
      <header className="ep-header">
        <div className="ep-logo" onClick={() => navigate('/browse')}>LSFPlus</div>
      </header>

      <main className="ep-main">
        <div className="ep-back-title">
          <button className="ep-back-btn" onClick={() => navigate(`/ManageProfile/${profile.id}`)}>←</button>
          <h1 className="ep-title">Edit Profile</h1>
        </div>

        <div className="ep-card">
          <div className="ep-avatar-section">
            <div
              className="ep-avatar-wrapper"
              onClick={() => navigate(`/IconPicker/${profile.id}`)}
            >
              <img src={image} alt={name} className="ep-avatar" />
              <div className="ep-avatar-overlay">
                <Pencil size={24} color="white" />
              </div>
            </div>

            <div className="ep-input-group">
              <label className="ep-label">Profile name</label>
              <input
                type="text"
                className="ep-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="ep-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div className="ep-contact-box">
              <div className="ep-contact-left">
                <Gamepad2 size={24} color="#333" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="ep-contact-label">Game Handle</span>
                  <span className="ep-contact-sub">Set a game handle to connect with others</span>
                </div>
              </div>
              <span className="ep-arrow-right">›</span>
            </div>
            
            <div className="ep-contact-box">
              <div className="ep-contact-left">
                <Mail size={24} color="#333" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="ep-contact-label">Email or Phone</span>
                  <span className="ep-contact-sub">Manage your contact info</span>
                </div>
              </div>
              <span className="ep-arrow-right">›</span>
            </div>
          </div>

          <button className="ep-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </main>
    </div>
  );
}
