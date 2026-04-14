import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Pencil, X, Plus } from 'lucide-react';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { elBimboFeatured } from '../data/movies';
import './ProfilePicker.css';

export default function ProfilePicker() {
  const navigate = useNavigate();
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    // Check if we should start in managing mode (e.g., from My Netflix)
    const params = new URLSearchParams(window.location.search);
    if (params.get('manage') === 'true') {
      setIsManaging(true);
    }
  }, []);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pinEntry, setPinEntry] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    getProfiles()
      .then((data) => {
        if (data.length === 0) {
          navigate('/CreateProfile');
        } else {
          setProfiles(data);
        }
      })
      .catch(() => navigate('/CreateProfile'))
      .finally(() => setLoading(false));

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleProfileClick = (profile: Profile) => {
    if (isManaging) {
      if (isMobile) {
        navigate(`/EditProfile/${profile.id}`);
      } else {
        navigate(`/ManageProfile/${profile.id}`);
      }
    } else {
      if (profile.locked) {
        setSelectedProfile(profile);
        setPinEntry(['', '', '', '']);
        setPinError(false);
        setShowPinModal(true);
      } else {
        localStorage.setItem('activeProfile', JSON.stringify(profile));
        navigate('/browse');
      }
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    setPinError(false);
    const newPin = [...pinEntry];
    newPin[index] = value.substring(value.length - 1);
    setPinEntry(newPin);

    // Auto-advance
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    } else if (index === 3 && value) {
      // Validate
      const fullTyped = newPin.join('');
      if (fullTyped.length === 4) {
        if (fullTyped === selectedProfile?.pin || selectedProfile?.pin === undefined) {
           localStorage.setItem('activeProfile', JSON.stringify(selectedProfile));
           setShowPinModal(false);
           navigate('/browse');
        } else {
           setPinError(true);
           setPinEntry(['', '', '', '']);
           pinRefs[0].current?.focus();
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinEntry[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={`profile-picker-container ${isMobile ? 'profile-picker--mobile' : ''}`}>
      {isMobile && elBimboFeatured && (
        <div 
          className="profile-picker__hero-bg" 
          style={{ backgroundImage: `url(${elBimboFeatured.mobileBanner})` }} 
        />
      )}
      {isMobile && <div className="profile-picker__mobile-bg-gradient" />}
      
      <div className="profile-picker__inner">
        {isMobile && (
          <div className="profile-picker__mobile-hero-info">
            {elBimboFeatured.logo ? (
              <img src={elBimboFeatured.logo} alt={elBimboFeatured.title} className="profile-picker__mobile-logo" />
            ) : (
              <h1 className="profile-picker__mobile-title">{elBimboFeatured.title}</h1>
            )}
            <p className="profile-picker__mobile-subtitle">Best in Musical • Best In Poster</p>
          </div>
        )}

        <h1 className="profile-picker__title">
          {isMobile ? "Choose Your Profile" : "Who's watching?"}
        </h1>

        <ul className="profile-picker__list">
          {profiles.map((profile) => (
            <li key={profile.id} className="profile-picker__item">
              <button
                className="profile-picker__btn"
                onClick={() => handleProfileClick(profile)}
              >
                <div className="profile-picker__avatar-wrapper">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="profile-picker__avatar"
                  />
                  {profile.locked && !isManaging && (
                    <div className="profile-picker__lock-overlay">
                      <Lock size={16} color="white" />
                    </div>
                  )}
                  {isManaging && (
                    <div className="profile-picker__edit-overlay">
                      <Pencil size={32} color="white" />
                    </div>
                  )}
                </div>
                <div className="profile-picker__info">
                  <span className="profile-picker__name">{profile.name}</span>
                  {profile.locked && isManaging && (
                    <Lock size={16} className="profile-picker__lock" />
                  )}
                </div>
              </button>
            </li>
          ))}
          {isMobile && profiles.length < 5 && !isManaging && (
            <li className="profile-picker__item">
              <button className="profile-picker__btn" onClick={() => navigate('/CreateProfile')}>
                <div className="profile-picker__avatar-wrapper profile-picker__grid-action-wrapper">
                  <Plus size={40} color="#a3a3a3" />
                </div>
                <div className="profile-picker__info">
                  <span className="profile-picker__name">Add Profile</span>
                </div>
              </button>
            </li>
          )}
          {isMobile && !isManaging && (
            <li className="profile-picker__item">
              <button className="profile-picker__btn" onClick={() => setIsManaging(true)}>
                <div className="profile-picker__avatar-wrapper profile-picker__grid-action-wrapper">
                  <Pencil size={32} color="white" />
                </div>
                <div className="profile-picker__info">
                  <span className="profile-picker__name">Edit</span>
                </div>
              </button>
            </li>
          )}
        </ul>

        <div className="profile-picker__actions">
          {!isMobile && profiles.length < 5 && (
            <button
              className="profile-picker__manage-btn"
              onClick={() => navigate('/CreateProfile')}
              style={{ marginRight: '1rem' }}
            >
              Add Profile
            </button>
          )}
          {isManaging ? (
            <button
              className="profile-picker__done-btn"
              onClick={() => setIsManaging(false)}
            >
              Done
            </button>
          ) : (
            !isMobile && (
              <button
                className="profile-picker__manage-btn"
                onClick={() => setIsManaging(true)}
              >
                Manage Profiles
              </button>
            )
          )}
        </div>
      </div>

      {showPinModal && selectedProfile && (
        <div className="profile-picker__pin-overlay">
          <div className="profile-picker__pin-modal">
            <button className="profile-picker__close-btn" onClick={() => setShowPinModal(false)}>
              <X size={24} color="white" />
            </button>
            <h2 className="profile-picker__pin-title">Profile Lock is on</h2>
            <p className="profile-picker__pin-subtitle">Enter your PIN to access this profile.</p>

            <div className="profile-picker__pin-boxes">
              {pinEntry.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  className={`profile-picker__pin-input ${pinError ? 'error' : ''}`}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {pinError && <p style={{ color: '#e50914', marginTop: '1rem' }}>Incorrect PIN. Please try again.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
