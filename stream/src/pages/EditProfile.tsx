import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Pencil, 
  ShieldAlert, 
  Lock, 
  Languages, 
  MessageSquareText, 
  Type, 
  Trash2,
  Gamepad2,
  Mail
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfiles, updateProfile, deleteProfile as deleteProfileService } from '../services/profileService';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Toggles state (mostly for UI replication on mobile)
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [autoplayPreviews, setAutoplayPreviews] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    getProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === id);
      if (found) {
        setProfile(found);
        setName(found.name);
        setImage(location.state?.newIcon || found.image);
      }
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [id, location.state]);

  const handleSave = async () => {
    if (!profile || !id) return;
    setLoading(true);
    try {
      await updateProfile(id, { name, image });
      
      // Update local fallback history for immediate feedback
      const localHistoryStr = localStorage.getItem(`icon_history_${id}`);
      const history = localHistoryStr ? JSON.parse(localHistoryStr) : [];
      if (!history.includes(image)) {
        localStorage.setItem(`icon_history_${id}`, JSON.stringify([...history, image]));
      }

      navigate('/?manage=true');
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this profile?")) return;
    try {
      await deleteProfileService(id);
      navigate('/?manage=true');
    } catch (err) {
      console.error("Failed to delete profile", err);
    }
  };

  if (!profile) return null;

  // --- Mobile Version ---
  if (isMobile) {
    return (
      <div className="edit-profile">
        <header className="edit-profile__header">
          <button 
            className="edit-profile__back" 
            onClick={handleSave}
            disabled={loading}
          >
            <ArrowLeft size={28} color="white" />
          </button>
          <h1 className="edit-profile__title">{loading ? 'Saving...' : 'Edit Profile'}</h1>
        </header>

        <main className="edit-profile__content">
          <div className="edit-profile__hero">
            <div className="edit-profile__avatar-wrapper" onClick={() => navigate(`/IconPicker/${id}`)}>
              <img src={image} alt={name} className="edit-profile__avatar" />
              <div className="edit-profile__pencil-badge">
                <Pencil size={18} color="black" fill="black" />
              </div>
            </div>
          </div>

          <div className="edit-profile__name-section">
            <input 
              type="text" 
              className="edit-profile__name-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile Name"
            />
          </div>

          <div className="edit-profile__settings">
            <div className="edit-profile__item">
              <div className="edit-profile__item-left">
                <ShieldAlert size={24} color="#e5e5e5" />
                <div className="edit-profile__item-text">
                  <span className="edit-profile__item-title">Viewing Restrictions</span>
                  <span className="edit-profile__item-sub">No restrictions</span>
                </div>
              </div>
              <ChevronRight size={24} color="#666" />
            </div>

            <div className="edit-profile__item" onClick={() => navigate(`/ProfileLock/${id}`)}>
              <div className="edit-profile__item-left">
                <Lock size={24} color="#e5e5e5" />
                <div className="edit-profile__item-text">
                  <span className="edit-profile__item-title">Profile lock</span>
                  <span className="edit-profile__item-sub">Add a 4-digit PIN to this profile</span>
                </div>
              </div>
              <ChevronRight size={24} color="#666" />
            </div>

            <div className="edit-profile__item">
              <div className="edit-profile__item-left">
                <Languages size={24} color="#e5e5e5" />
                <div className="edit-profile__item-text">
                  <span className="edit-profile__item-title">Display Language</span>
                  <span className="edit-profile__item-sub">Change the language of the text you see on LSFPlus across all devices.</span>
                </div>
              </div>
              <ChevronRight size={24} color="#666" />
            </div>

            <div className="edit-profile__item">
              <div className="edit-profile__item-left">
                <MessageSquareText size={24} color="#e5e5e5" />
                <div className="edit-profile__item-text">
                  <span className="edit-profile__item-title">Audio & Subtitle Languages</span>
                  <span className="edit-profile__item-sub">Choose the languages you like to watch shows and movies in.</span>
                </div>
              </div>
              <ChevronRight size={24} color="#666" />
            </div>

            <div className="edit-profile__item">
              <div className="edit-profile__item-left">
                <Type size={24} color="#e5e5e5" />
                <div className="edit-profile__item-text">
                  <span className="edit-profile__item-title">Subtitle Appearance</span>
                  <span className="edit-profile__item-sub">Change the way subtitles appear on phones and tablets.</span>
                </div>
              </div>
              <ChevronRight size={24} color="#666" />
            </div>

            <div className="edit-profile__item">
               <div className="edit-profile__item-left">
                  <div className="edit-profile__item-icon-placeholder" /> 
                  <div className="edit-profile__item-text">
                    <span className="edit-profile__item-title">Autoplay Next Episode</span>
                    <span className="edit-profile__item-sub">On all devices</span>
                  </div>
               </div>
               <label className="netflix-switch">
                  <input type="checkbox" checked={autoplayNext} onChange={() => setAutoplayNext(!autoplayNext)} />
                  <span className="netflix-slider"></span>
               </label>
            </div>

            <div className="edit-profile__item">
               <div className="edit-profile__item-left">
                  <div className="edit-profile__item-icon-placeholder" />
                  <div className="edit-profile__item-text">
                    <span className="edit-profile__item-title">Autoplay Previews</span>
                    <span className="edit-profile__item-sub">On all devices</span>
                  </div>
               </div>
               <label className="netflix-switch">
                  <input type="checkbox" checked={autoplayPreviews} onChange={() => setAutoplayPreviews(!autoplayPreviews)} />
                  <span className="netflix-slider"></span>
               </label>
            </div>
          </div>

          {profile.display_order !== 0 && (
            <div className="edit-profile__footer">
              <button className="edit-profile__delete-btn" onClick={handleDelete}>
                <Trash2 size={24} />
                <span>Delete Profile</span>
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- Desktop Version ---
  return (
    <div className="ep-container">
      <header className="ep-header">
        <div className="ep-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
      </header>

      <main className="ep-main">
        <div className="ep-back-title">
          <button className="ep-back-btn" onClick={() => navigate(`/ManageProfile/${profile.id}`)}>
             <ArrowLeft size={24} />
          </button>
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
              <ChevronRight size={20} color="#737373" />
            </div>
            
            <div className="ep-contact-box">
              <div className="ep-contact-left">
                <Mail size={24} color="#333" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="ep-contact-label">Email or Phone</span>
                  <span className="ep-contact-sub">Manage your contact info</span>
                </div>
              </div>
              <ChevronRight size={20} color="#737373" />
            </div>
          </div>

          <div className="ep-action-buttons" style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
            <button className="ep-save-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button className="ep-cancel-btn" onClick={() => navigate(`/ManageProfile/${profile.id}`)}>
              Cancel
            </button>
            {profile.display_order !== 0 && (
              <button className="ep-delete-btn" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
                <Trash2 size={20} /> Delete Profile
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
