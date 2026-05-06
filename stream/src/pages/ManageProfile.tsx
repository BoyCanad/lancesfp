import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lock, Languages, AlertCircle, MessageSquare, Bell, History, ShieldCheck, PlayCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import './ManageProfile.css';

export default function ManageProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === id);
      setProfile(found || null);
    });
  }, [id]);

  if (!profile) {
    return null;
  }

  return (
    <div className="mp-container">
      <header className="mp-header">
        <div className="mp-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px', cursor: 'pointer' }} />
        </div>
      </header>

      <main className="mp-main">
        <div className="mp-back-title">
          <button className="mp-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="mp-title">Manage profile and preferences</h1>
        </div>

        <section className="mp-card">
          <div className="mp-row" onClick={() => navigate(`/EditProfile/${profile.id}`)}>
            <div className="mp-row-left">
              <img src={profile.image} alt={profile.name} className="mp-avatar" />
              <div className="mp-text-group">
                <span className="mp-row-title">{profile.name}</span>
                <span className="mp-row-sub">Edit personal and contact info</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row" onClick={() => navigate(`/ProfileLock/${profile.id}`)}>
            <div className="mp-row-left">
              <Lock size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Profile Lock</span>
                <span className="mp-row-sub">
                  {profile.locked ? 'On' : 'Require a PIN to access this profile'}
                </span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
        </section>

        <h2 className="mp-section-title">Preferences</h2>

        <section className="mp-card">
          <div className="mp-row">
            <div className="mp-row-left">
              <Languages size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Languages</span>
                <span className="mp-row-sub">Set languages for display and audio</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <AlertCircle size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Adjust Parental Controls</span>
                <span className="mp-row-sub">Edit maturity rating and title restrictions</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <MessageSquare size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Subtitle appearance</span>
                <span className="mp-row-sub">Customize the way subtitles appear</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
        </section>

        <section className="mp-card">
          <div className="mp-row">
            <div className="mp-row-left">
              <PlayCircle size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Playback settings</span>
                <span className="mp-row-sub">Set autoplay and audio, video quality</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <Bell size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Notification settings</span>
                <span className="mp-row-sub">Manage notifications for email, text, push</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <History size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Viewing activity</span>
                <span className="mp-row-sub">Manage viewing history and ratings</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <ShieldCheck size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">Privacy and data settings</span>
                <span className="mp-row-sub">Manage usage of personal info</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
        </section>

        <button className="mp-delete-btn">
          <Trash2 size={20} />
          <span>Delete Profile</span>
        </button>
      </main>
    </div>
  );
}
