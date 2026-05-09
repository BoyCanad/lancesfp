import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import SettingsHeader from '../components/SettingsHeader';
import './LanguageSettings.css';

const displayLanguages: Language[] = [
  'English',
  'Filipino',
  'Español',
  'Deutsch',
  'Français',
  'Italiano',
  'Português',
  '日本語',
  '한국어',
  '中文'
];

const audioSubtitleLanguages = [
  'Dansk',
  'Deutsch',
  'English',
  'English (United Kingdom)',
  'Español',
  'Español (España)',
  'Filipino',
  'Français',
  'Italiano',
  'Nederlands',
  'Norsk bokmål',
  'Português',
  'Română',
  'Suomi',
  'Svenska',
  'Türkçe',
  'Tiếng Việt',
  'Русский',
  'ไทย',
  '中文',
  '日本語',
  '한국어'
];

export default function LanguageSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDisplay, setSelectedDisplay] = useState<Language>(language);
  const [selectedAudioSub, setSelectedAudioSub] = useState<string[]>(['English']);
  const [saving, setSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSelectDisplayLanguage = (lang: Language) => {
    setSelectedDisplay(lang);
    setIsDropdownOpen(false);
    
    if (audioSubtitleLanguages.includes(lang) && !selectedAudioSub.includes(lang)) {
      setSelectedAudioSub(prev => [...prev, lang]);
    }
  };

  useEffect(() => {
    getProfiles().then(profiles => {
      const found = profiles.find(p => p.id === id);
      if (found) {
        setProfile(found);
        
        const storedAudioSub = localStorage.getItem(`lsfplus_audio_sub_${id}`);
        if (storedAudioSub) {
          try {
            const parsed = JSON.parse(storedAudioSub);
            if (!parsed.includes('English')) parsed.push('English');
            setSelectedAudioSub(parsed);
          } catch (e) {
            // fallback
          }
        }
      } else {
        navigate('/?manage=true');
      }
    });
  }, [id, navigate]);

  const toggleAudioSub = (lang: string) => {
    if (lang === 'English') return;
    setSelectedAudioSub(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Persist to context (and localStorage)
    setLanguage(selectedDisplay);
    localStorage.setItem(`lsfplus_audio_sub_${id}`, JSON.stringify(selectedAudioSub));
    
    // In a real app, we would update the profile in Supabase here
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      
      // Navigate after toast is shown for a bit
      setTimeout(() => {
        navigate(`/ManageProfile/${id}`);
      }, 2000);
    }, 800);
  };

  if (!profile) return null;

  return (
    <div className="lang-settings">
      <SettingsHeader />

      <main className="lang-settings__main">
        <button className="lang-settings__back" onClick={() => navigate(`/ManageProfile/${id}`)}>
          <ArrowLeft size={24} />
        </button>

        <div className="lang-settings__content">
          <h1 className="lang-settings__title">{t('settings.language_title')}</h1>
          <div className="lang-settings__profile-info">
            <span>For {profile.name}</span>
            <img src={profile.image} alt="" className="lang-settings__avatar" />
          </div>

          <section className="lang-settings__section">
            <h2 className="lang-settings__section-label">{t('settings.display_language')}</h2>
            <div className="lang-settings__dropdown-container">
              <button 
                className={`lang-settings__dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{selectedDisplay}</span>
                {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {isDropdownOpen && (
                <div className="lang-settings__dropdown-menu">
                  {displayLanguages.map(lang => (
                    <div 
                      key={lang} 
                      className={`lang-settings__dropdown-item ${selectedDisplay === lang ? 'selected' : ''}`}
                      onClick={() => handleSelectDisplayLanguage(lang)}
                    >
                      <span>{lang}</span>
                      {selectedDisplay === lang && <Check size={18} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="lang-settings__help-text">
              This controls the text you see on LSFPlus. Any change will also apply to the default language for audio and subtitles.
            </p>
          </section>

          <hr className="lang-settings__divider" />

          <section className="lang-settings__section">
            <h2 className="lang-settings__section-title">{t('settings.audio_subtitle')}</h2>
            <p className="lang-settings__description">
              Choosing the languages you watch TV shows and movies in helps us set up your audio and subtitles for a better viewing experience.
            </p>

            <div className="lang-settings__checkbox-grid">
              {audioSubtitleLanguages.map(lang => (
                <label key={lang} className={`lang-settings__checkbox-item ${lang === 'English' ? 'disabled' : ''}`}>
                  <div className={`lang-settings__checkbox ${selectedAudioSub.includes(lang) || lang === 'English' ? 'checked' : ''} ${lang === 'English' ? 'disabled-box' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedAudioSub.includes(lang) || lang === 'English'}
                      onChange={() => toggleAudioSub(lang)}
                      disabled={lang === 'English'}
                    />
                    {(selectedAudioSub.includes(lang) || lang === 'English') && <Check size={14} color={lang === 'English' ? '#737373' : 'white'} strokeWidth={4} />}
                  </div>
                  <span className={`lang-settings__lang-name ${selectedAudioSub.includes(lang) || lang === 'English' ? 'active' : ''} ${lang === 'English' ? 'disabled-text' : ''}`}>
                    {lang}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="lang-settings__actions">
            <button 
              className="lang-settings__save-btn" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('settings.saving') : t('settings.save')}
            </button>
            <button 
              className="lang-settings__cancel-btn"
              onClick={() => navigate(`/ManageProfile/${id}`)}
              disabled={saving}
            >
              {t('settings.cancel')}
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`lang-toast ${showToast ? 'show' : ''}`}>
        <Check size={18} color="#4ade80" strokeWidth={3} />
        {t('settings.language_saved')}
      </div>
    </div>
  );
}
