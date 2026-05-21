import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Bell, ChevronDown, Pencil, User, HelpCircle, RefreshCw, Lock, Plus, X, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getProfiles } from '../services/profileService';
import { useLanguage } from '../i18n/LanguageContext';

import CategorySelector from './CategorySelector';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;


  const [session, setSession] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [params] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeTimeout = useRef<any>(null);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    if (!activeProfile) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const { fetchAllMovies } = await import('../services/movieService');
        const { getReminders } = await import('../services/reminderService');
        
        const allMovies = await fetchAllMovies();
        const remindedIds = await getReminders(activeProfile.id);

        if (!active) return;

        // Filter movies that are in reminders and are released
        const releasedReminders = allMovies.filter(movie => {
          if (!remindedIds.includes(movie.id)) return false;
          
          // Check if released
          if (!movie.comingSoon) return true;
          if (!movie.releaseDate) return false;
          
          try {
            const timeStr = movie.releaseTime || '00:00';
            const releaseDateTime = new Date(`${movie.releaseDate}T${timeStr}`);
            return Date.now() >= releaseDateTime.getTime();
          } catch (e) {
            return false;
          }
        });

        // Get read notifications
        const readStorageKey = `lsfplus_read_notif_${activeProfile.id}`;
        const readIds: string[] = JSON.parse(localStorage.getItem(readStorageKey) || '[]');

        const notifs = releasedReminders.map(movie => ({
          id: movie.id,
          title: movie.title,
          thumbnail: movie.thumbnail,
          mobileThumbnail: movie.mobileThumbnail,
          banner: movie.banner,
          releaseDate: movie.releaseDate,
          releaseTime: movie.releaseTime,
          isNew: !readIds.includes(movie.id)
        }));

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => n.isNew).length);
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      }
    };

    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };
    window.addEventListener('reminders_updated', handleUpdate);
    const interval = setInterval(loadNotifications, 60000);

    return () => {
      active = false;
      window.removeEventListener('reminders_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [activeProfile]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotifOpen(!isNotifOpen);
    
    // Mark all as read when opening
    if (!isNotifOpen && activeProfile && notifications.length > 0) {
      const readStorageKey = `lsfplus_read_notif_${activeProfile.id}`;
      const readIds = notifications.map(n => n.id);
      localStorage.setItem(readStorageKey, JSON.stringify(readIds));
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
      setUnreadCount(0);
    }
  };

  const handleNotifItemClick = (movieId: string) => {
    setIsNotifOpen(false);
    
    const pathMap: Record<string, string> = {
      'ang-huling-el-bimbo-play': '/ang-huling-el-bimbo-play',
      'ang-huling-el-bimbo-play-xray': '/ang-huling-el-bimbo-play-xray',
      'minsan': '/minsan',
      'tindahan-ni-aling-nena': '/tindahan-ni-aling-nena',
      'alapaap-overdrive': '/alapaap-overdrive',
      'spoliarium-graduation': '/spoliarium-graduation',
      'pare-ko': '/pare-ko',
      'tama-ka-ligaya': '/tama-ka-ligaya',
      'ang-huling-el-bimbo': '/ang-huling-el-bimbo',
      'beyond-the-last-dance': '/beyond-the-last-dance'
    };

    if (pathMap[movieId]) {
      navigate(pathMap[movieId]);
    } else {
      navigate(`/watch/${movieId}`);
    }
  };

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

  const isDetailPage = [
    '/ang-huling-el-bimbo-play',
    '/minsan',
    '/tindahan-ni-aling-nena',
    '/alapaap-overdrive',
    '/spoliarium-graduation',
    '/pare-ko',
    '/tama-ka-ligaya',
    '/ang-huling-el-bimbo',
    '/collections/el-bimbo',
    '/beyond-the-last-dance'
  ].some(path => location.pathname.includes(path));

  const isHomePage = location.pathname === '/browse';
  const isGenrePage = location.pathname.startsWith('/genre');
  
  // Sync query state with URL
  useEffect(() => {
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      setIsSearchExpanded(true);
    }
  }, [params]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate('/browse', { replace: true });
    }
  };

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  if (isMobile && location.pathname === '/search') {
    return null;
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${isDetailPage ? 'navbar--detail-page' : ''} ${isGenrePage ? 'navbar--no-bg' : ''}`}>
      {/* --- DESKTOP NAVBAR --- */}
      <div className="navbar__inner desktop-only">
        <div className="navbar__left">
          <div
            className="navbar__logo"
            onClick={() => navigate('/browse')}
            style={{ cursor: 'pointer' }}
          >
            <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '40px' }} />
          </div>
          
          <ul className="navbar__menu">
            <li className={`navbar__menu-item ${location.pathname === '/browse' ? 'fw-bold' : ''}`} onClick={() => navigate('/browse')}>{t('nav.home')}</li>
            <li className={`navbar__menu-item ${location.pathname.startsWith('/genre/shows') ? 'fw-bold' : ''}`} onClick={() => navigate('/genre/shows')}>{t('nav.shows')}</li>
            <li className={`navbar__menu-item ${location.pathname.startsWith('/genre/movies') ? 'fw-bold' : ''}`} onClick={() => navigate('/genre/movies')}>{t('nav.movies')}</li>
            <li className={`navbar__menu-item ${location.pathname === '/games' ? 'fw-bold' : ''}`} onClick={() => navigate('/games')}>{t('nav.games')}</li>
            <li className="navbar__menu-item">{t('nav.new_popular')}</li>
            <li className={`navbar__menu-item ${location.pathname === '/my-list' ? 'fw-bold' : ''}`} onClick={() => navigate('/my-list')}>{t('nav.mylist')}</li>
            <li className="navbar__menu-item">{t('nav.browse_lang')}</li>
          </ul>
        </div>

        {/* Right Controls */}
          <div className="navbar__right">
            <div className={`navbar__search-container ${isSearchExpanded ? 'expanded' : ''}`}>
              <Search 
                size={22} 
                color="white" 
                className="navbar__search-icon" 
                onClick={handleSearchClick}
              />
              <input
                ref={searchInputRef}
                type="text"
                className="navbar__search-input"
                placeholder="Titles, people, genres"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onBlur={() => {
                  if (searchQuery === '') setTimeout(() => setIsSearchExpanded(false), 200);
                }}
              />
              {isSearchExpanded && searchQuery !== '' && (
                <X 
                  size={18} 
                  color="white" 
                  className="navbar__clear-icon" 
                  onClick={() => handleSearchChange('')}
                />
              )}
            </div>
          
          <div className="navbar__icon-wrapper" onClick={() => navigate('/downloads')} style={{ cursor: 'pointer' }} title="Downloads">
            <Download size={22} color="white" />
          </div>
          
          <div className="navbar__notif-container" ref={notifDropdownRef}>
            <div className="navbar__icon-wrapper" onClick={handleBellClick}>
              <Bell size={24} color="white" />
              {unreadCount > 0 && (
                <div className="navbar__notif-badge">{unreadCount}</div>
              )}
            </div>

            {isNotifOpen && (
              <div className="navbar__notif-dropdown">
                <div className="navbar__notif-caret" />
                <div className="navbar__notif-content">
                  <div className="navbar__notif-header">
                    <span>Notifications</span>
                  </div>
                  <div className="navbar__notif-list">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="navbar__notif-item" onClick={() => handleNotifItemClick(n.id)}>
                          <div className="navbar__notif-img-wrapper">
                            <img src={n.thumbnail || n.mobileThumbnail || n.banner} alt={n.title} className="navbar__notif-img" />
                          </div>
                          <div className="navbar__notif-info">
                            <div className="navbar__notif-title-row">
                              <span className="navbar__notif-action">New Release: </span>{n.title} is now available to watch.
                            </div>
                            <div className="navbar__notif-date">
                              Released on {n.releaseDate}
                            </div>
                          </div>
                          {n.isNew && <div className="navbar__notif-dot" />}
                        </div>
                      ))
                    ) : (
                      <div className="navbar__notif-empty">
                        <Bell size={32} color="#555" />
                        <span>No new notifications. Set reminders on Coming Soon titles to get notified here!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                          <span className="navbar__dropdown-text">{t('profile.add')}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Actions */}
                    <div className="navbar__dropdown-menu">
                      <div className="navbar__dropdown-item" onClick={() => navigate('/?manage=true')}>
                        <div className="navbar__dropdown-icon-wrapper">
                          <Pencil size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">{t('profile.manage')}</span>
                      </div>
                      <div className="navbar__dropdown-item">
                        <div className="navbar__dropdown-icon-wrapper">
                          <RefreshCw size={20} color="#b3b3b3" />
                        </div>
                        <span className="navbar__dropdown-text">Transfer Profile</span>
                      </div>
                      <div className="navbar__dropdown-item" onClick={() => navigate('/account')}>
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
                        onClick={async () => {
                          await supabase.auth.signOut();
                          localStorage.removeItem('activeProfile');
                          navigate('/login');
                        }}
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

      {/* --- MOBILE NAVBAR (Matches Netflix exactly) --- */}
      <div className="navbar__mobile-inner mobile-only">
        {isHomePage && (
          <div className="navbar__mobile-top">
          <div className="navbar__mobile-branding">
            <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '34px' }} />

          </div>
          <div className="navbar__mobile-actions">
            <div className={`navbar__mobile-search ${isSearchExpanded ? 'expanded' : ''}`}>
               {isSearchExpanded ? (
                 <div className="navbar__mobile-search-bar">
                    <Search size={20} color="#b3b3b3" />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search" 
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      autoFocus
                    />
                    <X size={20} color="#b3b3b3" onClick={() => { setIsSearchExpanded(false); handleSearchChange(''); }} />
                 </div>
               ) : (
                  <Search size={24} color="white" onClick={() => navigate('/search')} />
               )}
            </div>
            <div className="navbar__mobile-icon-wrapper" onClick={() => navigate('/downloads')}>
               <Download size={24} color="white" />
            </div>
          </div>
        </div>
        )}
        {isHomePage && !isDetailPage && (
          <div className={`navbar__mobile-pills ${scrolled ? 'navbar__mobile-pills--hidden' : ''}`}>
            <button className={`navbar__mobile-pill ${location.pathname.startsWith('/genre/shows') ? 'active' : ''}`} onClick={() => navigate('/genre/shows')}>Shows</button>
            <button className={`navbar__mobile-pill ${location.pathname.startsWith('/genre/movies') ? 'active' : ''}`} onClick={() => navigate('/genre/movies')}>Movies</button>
            <button 
              className="navbar__mobile-pill"
              onClick={() => setIsCategorySelectorOpen(true)}
            >
              Categories <ChevronDown size={14} style={{ marginLeft: 4 }} />
            </button>
          </div>
        )}
      </div>

      <CategorySelector 
        isOpen={isCategorySelectorOpen} 
        onClose={() => setIsCategorySelectorOpen(false)} 
        currentCategory={location.pathname === '/browse' ? 'Home' : location.pathname.startsWith('/genre/') ? location.pathname.split('/').pop() : undefined}
      />
    </header>
  );
}
