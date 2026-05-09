import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lock, Languages, AlertCircle, MessageSquare, Bell, History, ShieldCheck, PlayCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { useLanguage } from '../i18n/LanguageContext';
import SettingsHeader from '../components/SettingsHeader';
import './ManageProfile.css';

export default function ManageProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      <SettingsHeader />

      <main className="mp-main">
        <div className="mp-back-title">
          <button className="mp-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="mp-title">{t('manage.title')}</h1>
        </div>

        <section className="mp-card">
          <div className="mp-row" onClick={() => navigate(`/EditProfile/${profile.id}`)}>
            <div className="mp-row-left">
              <img src={profile.image} alt={profile.name} className="mp-avatar" />
              <div className="mp-text-group">
                <span className="mp-row-title">{profile.name}</span>
                <span className="mp-row-sub">{t('manage.edit_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row" onClick={() => navigate(`/ProfileLock/${profile.id}`)}>
            <div className="mp-row-left">
              <Lock size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.lock')}</span>
                <span className="mp-row-sub">
                  {profile.locked ? 'On' : t('manage.lock_sub')}
                </span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
        </section>

        <h2 className="mp-section-title">{t('manage.preferences')}</h2>

        <section className="mp-card">
          <div className="mp-row" onClick={() => navigate(`/LanguageSettings/${profile.id}`)}>
            <div className="mp-row-left">
              <Languages size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.languages')}</span>
                <span className="mp-row-sub">{t('manage.lang_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <AlertCircle size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.parental')}</span>
                <span className="mp-row-sub">{t('manage.parental_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <MessageSquare size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.subtitle')}</span>
                <span className="mp-row-sub">{t('manage.subtitle_sub')}</span>
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
                <span className="mp-row-title">{t('manage.playback')}</span>
                <span className="mp-row-sub">{t('manage.playback_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <Bell size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.notifications')}</span>
                <span className="mp-row-sub">{t('manage.notifications_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <History size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.activity')}</span>
                <span className="mp-row-sub">{t('manage.activity_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
          <div className="mp-divider" />
          <div className="mp-row">
            <div className="mp-row-left">
              <ShieldCheck size={24} color="#333" className="mp-icon" />
              <div className="mp-text-group">
                <span className="mp-row-title">{t('manage.privacy')}</span>
                <span className="mp-row-sub">{t('manage.privacy_sub')}</span>
              </div>
            </div>
            <ChevronRight size={20} color="#737373" />
          </div>
        </section>

        <button className="mp-delete-btn">
          <Trash2 size={20} />
          <span>{t('manage.delete')}</span>
        </button>
      </main>
    </div>
  );
}
