import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, User, Pencil, HelpCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SettingsHeader.css';

export default function SettingsHeader() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('activeProfile');
    window.location.href = '/login';
  };

  return (
    <header className="settings-header">
      <div className="settings-header__inner">
        <div className="settings-header__logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" />
        </div>

        <div className="settings-header__right" ref={dropdownRef}>
          {activeProfile && (
            <div 
              className="settings-header__profile-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img src={activeProfile.image} alt="" className="settings-header__avatar" />
              <ChevronDown size={14} className={`settings-header__caret ${isDropdownOpen ? 'open' : ''}`} />
            </div>
          )}

          {isDropdownOpen && (
            <div className="settings-header__dropdown">
              <div className="settings-header__menu">
                <div className="settings-header__menu-item" onClick={() => navigate('/browse')}>
                  <ArrowLeft size={18} />
                  <span>Back to LSFPlus</span>
                </div>
                <div className="settings-header__divider" />
                <div className="settings-header__menu-item" onClick={() => navigate('/account')}>
                  <User size={18} />
                  <span>Account</span>
                </div>
                <div className="settings-header__menu-item" onClick={() => navigate('/?manage=true')}>
                  <Pencil size={18} />
                  <span>Manage Profiles</span>
                </div>
                <div className="settings-header__menu-item" onClick={() => window.open('https://help.netflix.com', '_blank')}>
                  <HelpCircle size={18} />
                  <span>Help Center</span>
                  <ExternalLink size={14} className="settings-header__external-icon" />
                </div>
                <div className="settings-header__divider" />
                <div 
                  className="settings-header__menu-item settings-header__menu-item--switch"
                  onClick={() => navigate('/')}
                >
                  <span>Switch Profile</span>
                  <ChevronRight size={18} />
                </div>
                <div className="settings-header__divider" />
                <div className="settings-header__menu-item" onClick={handleSignOut}>
                  <span>Sign out</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
