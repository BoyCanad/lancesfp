import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Pencil, User, HelpCircle, RefreshCw, Lock, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getProfiles } from '../services/profileService';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeout = useRef<any>(null);
  const navigate = useNavigate();

  const fetchProfiles = () => {
    getProfiles().then((data) => {
      setProfiles(data);
      
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = data.find(p => p.id === parsed.id);
        if (match) {
          setActiveProfile(match);
          return;
        }
      }

      if (data.length > 0) setActiveProfile(data[0]);
    }).catch(() => {
      setProfiles([]);
      setActiveProfile(null);
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfiles();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfiles();
      else {
        setProfiles([]);
        setActiveProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) fetchProfiles();
      });
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <div className="navbar__left">
          <div
            className="navbar__logo"
            onClick={() => navigate('/browse')}
            style={{ cursor: 'pointer' }}
          >
            <span className="navbar__logo-text">LSFPlus</span>
          </div>
          
          <ul className="navbar__menu">
            <li className="navbar__menu-item fw-bold" onClick={() => navigate('/browse')}>Home</li>
            <li className="navbar__menu-item">Shows</li>
            <li className="navbar__menu-item">Movies</li>
            <li className="navbar__menu-item">Games</li>
            <li className="navbar__menu-item">New & Popular</li>
            <li className="navbar__menu-item">My List</li>
            <li className="navbar__menu-item" onClick={() => navigate('/downloads')}>My Downloads</li>
            <li className="navbar__menu-item">Browse by Languages</li>
          </ul>
        </div>

        {/* Right Controls */}
        <div className="navbar__right">
          <div className="navbar__icon-wrapper">
            <Search size={24} color="white" />
          </div>
          
          <div className="navbar__icon-wrapper">
            <Bell size={24} color="white" />
          </div>
          
          {session ? (
            <div 
              className="navbar__profile-group" 
              onMouseEnter={() => {
                if (closeTimeout.current) clearTimeout(closeTimeout.current);
                setIsDropdownOpen(true);
              }}
              onMouseLeave={() => {
                closeTimeout.current = setTimeout(() => setIsDropdownOpen(false), 200);
              }}
            >
              <div className="navbar__avatar" onClick={() => navigate('/')}>
                {activeProfile ? (
                  <img src={activeProfile.image} alt="Profile" className="navbar__avatar-img" />
                ) : (
                  <span>S</span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                color="white" 
                className={`navbar__dropdown-icon ${isDropdownOpen ? 'open' : ''}`} 
              />

              {isDropdownOpen && (
                <div className="navbar__dropdown">
                  <div className="navbar__dropdown-caret" />
                  <div className="navbar__dropdown-content">
                    {/* Other Profiles */}
                    <div className="navbar__dropdown-profiles">
                      {profiles
                        .filter((p) => p.id !== activeProfile?.id)
                        .map((p) => (
                          <div key={p.id} className="navbar__dropdown-item" onClick={() => navigate('/')}>
                            <div className="navbar__dropdown-avatar-wrapper">
                                <img src={p.image} alt={p.name} className="navbar__dropdown-avatar" />
                            </div>
                            <span className="navbar__dropdown-text">{p.name}</span>
                            {p.locked && <Lock size={14} color="#737373" className="navbar__dropdown-lock" />}
                          </div>
                        ))}
                      
                      {profiles.length < 5 && (
                        <div className="navbar__dropdown-item" onClick={() => navigate('/CreateProfile')}>
                          <div className="navbar__dropdown-avatar-wrapper navbar__dropdown-avatar-plus">
                            <Plus size={20} color="#b3b3b3" />
                          </div>
                          <span className="navbar__dropdown-text">Add Profile</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Actions */}
                    <div className="navbar__dropdown-menu">
                      <div className="navbar__dropdown-item" onClick={() => navigate('/')}>
                        <div className="navbar__dropdown-icon-wrapper">
                          <Pencil size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">Manage Profiles</span>
                      </div>
                      <div className="navbar__dropdown-item">
                        <div className="navbar__dropdown-icon-wrapper">
                          <RefreshCw size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">Transfer Profile</span>
                      </div>
                      <div className="navbar__dropdown-item">
                        <div className="navbar__dropdown-icon-wrapper">
                          <User size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">Account</span>
                      </div>
                      <div className="navbar__dropdown-item">
                        <div className="navbar__dropdown-icon-wrapper">
                          <HelpCircle size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">Help Center</span>
                      </div>
                    </div>

                    <div className="navbar__dropdown-footer">
                      <button 
                        className="navbar__signout-btn" 
                        onClick={() => supabase.auth.signOut()}
                      >
                        Sign out of LSFPlus
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="navbar__signin-btn" 
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#e50914',
                color: 'white',
                border: 'none',
                padding: '7px 17px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
