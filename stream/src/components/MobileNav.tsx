import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, PlaySquare, Gamepad2 } from 'lucide-react';
import { getProfiles } from '../services/profileService';
import './MobileNav.css';

export default function MobileNav() {
  const [active, setActive] = useState('home');
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to load the active profile specifically for the "My Netflix" avatar
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    } else {
      getProfiles().then(data => {
        if (data.length > 0) setActiveProfile(data[0]);
      }).catch(() => {});
    }
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'clips', label: 'Clips', icon: PlaySquare },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'my-netflix', label: 'My Netflix', isAvatar: true },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__inner">
        {navItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              className={`mobile-nav__btn ${isActive ? 'mobile-nav__btn--active' : ''}`}
              onClick={() => {
                setActive(item.id);
                if (item.id === 'home') navigate('/browse');
                else if (item.id === 'my-netflix') navigate('/my-netflix');
              }}
            >
              <div className="mobile-nav__icon-wrapper">
                {item.isAvatar ? (
                  <div className={`mobile-nav__avatar-container ${isActive ? 'active-border' : ''}`}>
                    {activeProfile?.image ? (
                      <img src={activeProfile.image} alt="Profile" className="mobile-nav__avatar" />
                    ) : (
                      <div className="mobile-nav__avatar-placeholder">S</div>
                    )}
                  </div>
                ) : (
                  Icon && <Icon size={24} className="mobile-nav__icon" fill={isActive ? "white" : "transparent"} strokeWidth={isActive ? 2 : 1.5} />
                )}
              </div>
              <span className="mobile-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
