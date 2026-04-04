import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Bell } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo & Discord */}
        <div className="navbar__logo-group">
          <div 
            className="navbar__logo" 
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="navbar__logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#7c3aed" opacity="0.3"/>
                <path d="M8 8l8 4-8 4V8z" fill="white"/>
              </svg>
            </div>
            <span className="navbar__logo-text">
              LSFPlus
            </span>
          </div>
          <button className="navbar__discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0328 1.5032 4.0228 2.4221 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 5.973-3.0244a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="navbar__right">
          <div className="navbar__search">
            <Search size={15} className="navbar__search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="navbar__search-input"
            />
            <span className="navbar__search-shortcut">⌘K</span>
          </div>
          <button className="navbar__icon-btn navbar__icon-btn--hide-mobile">
            <Bell size={18} />
          </button>
          <div className="navbar__avatar">
            <span>S</span>
          </div>
          <button className="navbar__icon-btn navbar__icon-btn--hide-mobile">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
