import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Film, Sparkles, LibraryBig, Settings } from 'lucide-react';
import './MobileNav.css';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'mood', label: 'Mood', icon: Sparkles },
  { id: 'vaults', label: 'Vaults', icon: LibraryBig },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const [active, setActive] = useState('home');
  const navigate = useNavigate();

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              className={`mobile-nav__btn ${isActive ? 'mobile-nav__btn--active' : ''}`}
              onClick={() => {
                setActive(item.id);
                if (item.id === 'home') {
                  navigate('/');
                }
              }}
            >
              <div className="mobile-nav__icon-wrapper">
                <Icon size={22} className="mobile-nav__icon" />
                {isActive && <div className="mobile-nav__dot" />}
              </div>
              <span className="mobile-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
