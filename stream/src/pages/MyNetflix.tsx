import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  Share2,
  Bell,
  X,
  Pencil,
  Lock,
  Plus,
  Scissors,
  Play,
  Settings,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { featuredMovies, trendingMovies, elBimboFeatured, makingOfLegacy, elBimboCollections } from '../data/movies';
import { getMyList } from '../services/listService';
import { getProfiles, getWatchProgress, getRecentlyWatched, getLikedMovies } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { MoreVertical } from 'lucide-react';
import './MyNetflix.css';

export default function MyNetflix() {
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  const [likedTitles, setLikedTitles] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  // PIN Modal states
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
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }
    
    getProfiles().then(setProfiles).catch(console.error);
    
    // Fetch My List
    const fetchMyList = () => {
      const savedIds = getMyList();
      const allMovies = [...featuredMovies, ...trendingMovies, elBimboFeatured, makingOfLegacy, ...elBimboCollections];
      const items = savedIds.map(id => allMovies.find(m => m.id === id)).filter(Boolean);
      setMyList(items);
    };
    fetchMyList();
    window.addEventListener('mylist_updated', fetchMyList);
    return () => window.removeEventListener('mylist_updated', fetchMyList);
  }, []);

  useEffect(() => {
    if (activeProfile?.id) {
      supabase.from('clips')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.warn('[MyNetflix] Failed to fetch moments. Ensure the "clips" table has "profile_id" and "created_at" columns.', error);
            setMoments([]);
            return;
          }
          if (data) setMoments(data);
        });

      // Fetch Continue Watching
      getWatchProgress(activeProfile.id).then(progress => {
        const allMovies = [...featuredMovies, ...trendingMovies, elBimboFeatured];
        const watchedItems = progress
          .map(wp => {
            const movie = allMovies.find(m => m.id === wp.movie_id);
            if (!movie) return null;
            return {
              ...movie,
              progress: (wp.progress_ms / wp.duration_ms) * 100
            };
          })
          .filter(Boolean);
        setContinueWatching(watchedItems);
      }).catch(console.error);

      // Fetch Recently Watched
      getRecentlyWatched(activeProfile.id).then(history => {
        const allMovies = [...featuredMovies, ...trendingMovies, elBimboFeatured];
        const historyItems = history
          .map(item => {
            const movie = allMovies.find(m => m.id === item.movie_id);
            if (!movie) return null;
            return {
              ...movie,
              episode_info: item.episode_info
            };
          })
          .filter(Boolean);
        setRecentlyWatched(historyItems);
      }).catch(console.error);

      // Fetch Liked Movies
      getLikedMovies(activeProfile.id).then((likedIds: string[]) => {
        const allMovies = [...featuredMovies, ...trendingMovies, elBimboFeatured];
        const likedOnes = likedIds
          .map((id: string) => allMovies.find(m => m.id === id))
          .filter(Boolean);
        setLikedTitles(likedOnes);
      }).catch(console.error);
    }
  }, [activeProfile]);

  const handleProfileSwitch = (profile: any) => {
    setSelectedProfile(profile);
    if (profile.locked) {
      setPinEntry(['', '', '', '']);
      setPinError(false);
      setShowPinModal(true);
      return;
    }
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    setIsSwitching(false);
    navigate('/browse', { state: { fromProfileSwap: true, profileImage: profile.image } });
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
           setIsSwitching(false);
           // Brief delay before starting transition for better UX
           setTimeout(() => {
             navigate('/browse', { state: { fromProfileSwap: true, profileImage: selectedProfile?.image } });
           }, 400);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('activeProfile');
    window.location.href = '/login';
  };



  return (
    <div className="my-netflix">
      {/* Header */}
      <header className="mn-header">
        <h1 className="mn-header__title">My LSFPlus</h1>
        <div className="mn-header__actions">
          <Search size={26} color="white" />
          <button className="mn-menu-trigger" onClick={() => setShowMenu(true)}>
            <Menu size={26} color="white" />
          </button>
        </div>
      </header>

      {/* Profile Section */}
      <section className="mn-profile">
        <div className="mn-profile__avatar-wrapper">
          <img 
            src={activeProfile?.image || "/images/avatar-1.png"} 
            alt="Profile" 
            className="mn-profile__avatar" 
          />
        </div>
        <div className="mn-profile__name-group" onClick={() => setIsSwitching(true)}>
          <div className="mn-profile__name-row">
            <h2 className="mn-profile__name">{activeProfile?.name || 'User'}</h2>
            <ChevronDown size={24} color="white" />
          </div>
        </div>
      </section>

      {/* Switch Profiles Modal (Bottom Sheet) */}
      {isSwitching && (
        <div className="mn-modal-overlay" onClick={() => setIsSwitching(false)}>
          <div className="mn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mn-modal__header">
              <h2 className="mn-modal__title">Switch Profiles</h2>
              <button className="mn-modal__close" onClick={() => setIsSwitching(false)}>
                <X size={24} color="white" />
              </button>
            </div>
            
            <div className="mn-profiles-grid">
              {profiles.map((p: Profile) => (
                <div 
                  key={p.id} 
                  className={`mn-profile-item ${p.id === activeProfile?.id ? 'mn-profile-item--active' : ''}`}
                  onClick={() => handleProfileSwitch(p)}
                >
                  <div className="mn-profile-item__avatar-container">
                    <img src={p.image} alt={p.name} className="mn-profile-item__avatar" />
                    {p.id === activeProfile?.id && <div className="mn-profile-item__active-border" />}
                  </div>
                  <span className="mn-profile-item__name">{p.name}</span>
                  {p.locked && <Lock size={12} color="#a3a3a3" style={{ marginTop: 2 }} />}
                </div>
              ))}
              {profiles.length < 5 && (
                <div className="mn-profile-item" onClick={() => navigate('/CreateProfile')}>
                  <div className="mn-profile-item__avatar-container mn-profile-item__add-container">
                    <Plus size={32} color="#a3a3a3" />
                  </div>
                  <span className="mn-profile-item__name">Add Profile</span>
                </div>
              )}
            </div>

            <button className="mn-manage-profiles" onClick={() => navigate('/?manage=true')}>
              <Pencil size={20} />
              <span>Manage Profiles</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Shortcut */}
      <section className="mn-shortcuts">
        <div className="mn-card mn-card--notifications">
            <div className="mn-card__icon-circle red">
                <Bell size={24} color="white" fill="white" />
            </div>
            <div className="mn-card__content">
                <h3 className="mn-card__title">Notifications</h3>
            </div>
            <ChevronRight size={24} color="#666" />
        </div>
      </section>

      {/* Rows */}
      <div className="mn-rows">
        {likedTitles.length > 0 && (
          <section className="mn-row">
            <h2 className="mn-row__title">TV Shows & Movies You've Liked</h2>
            <div className="mn-row__track">
              {likedTitles.map((movie) => (
                <div key={movie.id} className="mn-liked-card" onClick={() => navigate(`/watch/${movie.id}`)}>
                  <img src={movie.mobileBanner || movie.mobileThumbnail || movie.thumbnail} alt={movie.title} className="mn-liked-card__img" />
                  <div className="mn-liked-card__footer">
                    <Share2 size={18} color="white" />
                    <span>Share</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mn-row">
          <h2 className="mn-row__title">Moments You've Created & Shared</h2>
          <div className="mn-row__track">
            {moments.length > 0 ? moments.map((clip) => {
              const movie = featuredMovies.find(m => m.id === clip.movie_id);
              return (
                <div key={clip.id} className="mn-moment-card" onClick={() => navigate(`/${clip.movie_id}/clip/${clip.id}`)}>
                   <div className="mn-moment-thumbnail-wrapper">
                      <img src={movie?.thumbnail || movie?.banner} alt="Moment" className="mn-moment-img" />
                      <div className="mn-moment-play-overlay">
                         <Play size={24} fill="white" color="white" />
                      </div>
                      <div className="mn-moment-tag">
                        <Scissors size={12} />
                        <span>Moment</span>
                      </div>
                   </div>
                   <div className="mn-moment-info">
                      <p className="mn-moment-title">{movie?.title || 'Unknown Movie'}</p>
                      <p className="mn-moment-time">{Math.floor(clip.start_time / 60)}:{String(clip.start_time % 60).padStart(2, '0')}</p>
                   </div>
                </div>
              );
            }) : (
              <div className="mn-empty-moments">
                 <Scissors size={24} color="#666" />
                 <p>Clip your favorite moments to see them here.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mn-row">
          <div className="mn-row__header">
            <h2 className="mn-row__title">My List</h2>
            <button className="mn-row__see-all" onClick={() => navigate('/my-list')}>
              See All <ChevronRight size={18} />
            </button>
          </div>
          <div className="mn-row__track">
            {myList.map((movie) => (
              <div key={movie.id} className="mn-list-card" onClick={() => navigate(`/watch/${movie.id}`)}>
                <img src={movie.mobileBanner || movie.mobileThumbnail || movie.thumbnail} alt={movie.title} className="mn-list-card__img" />
              </div>
            ))}
            {myList.length === 0 && (
              <div className="mn-empty-row-msg">
                Your list is empty. Add titles to see them here!
              </div>
            )}
          </div>
        </section>

        {continueWatching.length > 0 && (
          <section className="mn-row">
            <h2 className="mn-row__title">Continue Watching</h2>
            <div className="mn-row__track">
              {continueWatching.map((movie) => (
                <div key={movie.id} className="mn-continue-card" onClick={() => navigate(`/watch/${movie.id}`)}>
                  <div className="mn-continue-card__img-wrapper">
                    <img 
                      src={movie.mobileThumbnail || movie.thumbnail || movie.banner} 
                      alt={movie.title} 
                      className="mn-continue-card__img" 
                    />
                  </div>
                  
                  <div className="mn-continue-card__progress-container">
                    <div className="mn-continue-card__progress-bar-bg">
                      <div className="mn-continue-card__progress-fill" style={{ width: `${movie.progress}%` }} />
                    </div>
                  </div>

                  <div className="mn-continue-card__info">
                     <p className="mn-continue-card__title">{movie.title}</p>
                     <div className="mn-continue-card__meta">
                        <span className="mn-continue-card__year">{movie.year}</span>
                        <span className="mn-continue-card__dot">·</span>
                        <span className="mn-continue-card__genre">{movie.genre[0]}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {recentlyWatched.length > 0 && (
          <section className="mn-row">
            <h2 className="mn-row__title">Recently Watched</h2>
            <div className="mn-row__track">
              {recentlyWatched.map((movie) => (
                <div key={movie.id} className="mn-history-card" onClick={() => navigate(`/watch/${movie.id}`)}>
                  <div className="mn-history-card__img-wrapper">
                    <img 
                      src={movie.id === 'ang-huling-el-bimbo-play' ? '/images/el-bimbo.webp' : (movie.mobileThumbnail || movie.thumbnail || movie.banner)} 
                      alt={movie.title} 
                      className="mn-history-card__img" 
                    />
                    <div className="mn-history-card__overlay">
                      <div className="mn-history-card__actions">
                        <Share2 size={24} color="white" />
                        <MoreVertical size={24} color="white" />
                      </div>
                    </div>
                  </div>
                  <div className="mn-history-card__info">
                     <p className="mn-history-card__title">
                       {movie.episode_info ? `${movie.episode_info} ` : ''}{movie.title}
                     </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      
      {/* Bottom Sheet Menu */}
      {showMenu && (
        <div className="mn-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="mn-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mn-menu-content">
              <button className="mn-menu-item" onClick={() => { navigate('/?manage=true'); setShowMenu(false); }}>
                <Pencil size={24} />
                <span>Manage Profiles</span>
              </button>
              
              <button className="mn-menu-item">
                <Settings size={24} />
                <span>App Settings</span>
              </button>
              
              <button className="mn-menu-item" onClick={() => { navigate('/account'); setShowMenu(false); }}>
                <User size={24} />
                <span>Account</span>
              </button>
              
              <button className="mn-menu-item">
                <HelpCircle size={24} />
                <span>Help</span>
              </button>
              
              <button className="mn-menu-item" onClick={handleSignOut}>
                <LogOut size={24} />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="mn-menu-version">
              Version: 9.60.0 build 4
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal Overlay */}
      {showPinModal && selectedProfile && (
        <div className="mn-pin-overlay">
          <div className="mn-pin-modal">
            <button className="mn-pin-close" onClick={() => setShowPinModal(false)}>
              <X size={24} color="white" />
            </button>
            <h2 className="mn-pin-title">Profile Lock is on</h2>
            <p className="mn-pin-subtitle">Enter your PIN to access this profile.</p>

            <div className="mn-pin-boxes">
              {pinEntry.map((digit: string, i: number) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  className={`mn-pin-input ${pinError ? 'error' : ''}`}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {pinError && <p className="mn-pin-error">Incorrect PIN. Please try again.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
