import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Gamepad2 } from 'lucide-react';
import { getProfiles } from '../services/profileService';
import './MobileNav.css';

export default function MobileNav() {
  const { pathname } = useLocation();
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const navigate = useNavigate();

  // Highlight based on current pathname
  const activeId = pathname.includes('/my-lsfplus') ? 'my-lsfplus' : pathname === '/clips' ? 'clips' : 'home';

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
    { id: 'my-lsfplus', label: 'My LSFPlus', isAvatar: true },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__inner">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              className={`mobile-nav__btn ${isActive ? 'mobile-nav__btn--active' : ''}`}
              onClick={() => {
                if (item.id === 'home') navigate('/browse');
                else if (item.id === 'clips') navigate('/clips');
                else if (item.id === 'my-lsfplus') navigate('/my-lsfplus');
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
