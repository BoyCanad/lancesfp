import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { allMovies } from '../data/movies';
import './WindowsXP.css';

interface XPWindow {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  zIndex: number;
}

interface VirtualFile {
  name: string;
  icon: string;
  target: string;
  movieId?: string;
  content?: string;
}

export default function WindowsXP() {
  const navigate = useNavigate();
  
  // --- Profile / Auth State ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  // Login flow
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // --- Windows & Desktop State ---
  const [windows, setWindows] = useState<XPWindow[]>([
    { id: 'myComputerWin', title: 'My Computer', icon: '💻', isOpen: false, isMinimized: false, isMaximized: false, x: 100, y: 60, width: 680, height: 460, zIndex: 10 },
    { id: 'notepadWin', title: 'Untitled - Notepad', icon: '📝', isOpen: false, isMinimized: false, isMaximized: false, x: 200, y: 150, width: 480, height: 350, zIndex: 11 },
    { id: 'ieWin', title: 'Internet Explorer', icon: '🌐', isOpen: false, isMinimized: false, isMaximized: false, x: 150, y: 80, width: 800, height: 550, zIndex: 12 },
    { id: 'paintWin', title: 'Paint', icon: '🎨', isOpen: false, isMinimized: false, isMaximized: false, x: 250, y: 90, width: 550, height: 450, zIndex: 13 },
    { id: 'wmpWin', title: 'Windows Media Player', icon: '🎬', isOpen: false, isMinimized: false, isMaximized: false, x: 180, y: 110, width: 600, height: 420, zIndex: 14 }
  ]);
  
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // Virtual Explorer State
  const [currentPath, setCurrentPath] = useState('My Computer');
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [explorerAddress, setExplorerAddress] = useState('My Computer');
  
  // Virtual Notepad State
  const [notepadText, setNotepadText] = useState('');
  
  // Virtual Internet Explorer State
  const [ieUrl, setIeUrl] = useState('https://en.wikipedia.org/wiki/Windows_XP');
  const [ieInputUrl, setIeInputUrl] = useState('https://en.wikipedia.org/wiki/Windows_XP');
  
  // Paint State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  
  // Windows Media Player state
  const [wmpVideoUrl, setWmpVideoUrl] = useState('');
  const [wmpTitle, setWmpTitle] = useState('Welcome to Windows Media Player');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Turn off computer modal / shutdown animation
  const [showTurnOffModal, setShowTurnOffModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [shutdownMessage, setShutdownMessage] = useState('');
  
  // Dragging states
  const [draggingWin, setDraggingWin] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const zIndexCounter = useRef(20);

  // --- Initialize Time ---
  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      setCurrentTime(`${hours}:${minStr} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Fetch User Profiles ---
  useEffect(() => {
    getProfiles()
      .then((data) => {
        setProfiles(data || []);
      })
      .catch((err) => {
        console.warn("XP: Fetching profiles failed, checking fallback cache...", err);
        try {
          const raw = localStorage.getItem('lsfplus_profiles_cache');
          if (raw) {
            setProfiles(JSON.parse(raw));
          } else {
            // Default mock profiles for demonstration if offline
            setProfiles([
              { id: '1', name: 'Administrator', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png', locked: false, user_id: 'mock', display_order: 0 },
              { id: '2', name: 'Guest', image: 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif', locked: false, user_id: 'mock', display_order: 1 }
            ]);
          }
        } catch (e) {
          console.error(e);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Virtual File System Structure ---
  const fileSystem: { [key: string]: VirtualFile[] } = {
    'My Computer': [
      { name: 'Local Disk (C:)', icon: '💽', target: 'C:' },
      { name: 'DVD-RW Drive (D:)', icon: '💿', target: 'D:' },
      { name: 'Shared Documents', icon: '📁', target: 'Shared Documents' },
      { name: 'My Documents', icon: '📁', target: 'My Documents' }
    ],
    'C:': [
      { name: 'Program Files', icon: '📁', target: 'Program Files' },
      { name: 'WINDOWS', icon: '📁', target: 'WINDOWS' },
      { name: 'boot.ini', icon: '📄', target: 'file', content: '[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS\n[operating systems]\nmulti(0)disk(0)rdisk(0)partition(1)\\WINDOWS="Microsoft Windows XP Professional" /noexecute=optin /fastdetect' }
    ],
    'D:': [
      { name: '11-STEM-A-Video-Archive.iso', icon: '💿', target: 'file', content: 'Virtual DVD ISO file containing high definition recordings and clips.' }
    ],
    'Shared Documents': [
      { name: 'Shared Music', icon: '📁', target: 'Shared Music' },
      { name: 'Shared Videos', icon: '📁', target: 'Shared Videos' }
    ],
    'My Documents': [
      { name: 'My Videos', icon: '📁', target: 'My Videos' },
      { name: 'Secret Passwords.txt', icon: '📝', target: 'file', content: 'Netflix: password123\nSpotify: rockstar99\nSupabase DB: SuperSecurePass!!!' }
    ],
    'Program Files': [
      { name: 'Internet Explorer', icon: '🌐', target: 'app', content: 'ieWin' },
      { name: 'MS Paint', icon: '🎨', target: 'app', content: 'paintWin' },
      { name: 'Windows Media Player', icon: '🎬', target: 'app', content: 'wmpWin' }
    ],
    'WINDOWS': [
      { name: 'System32', icon: '📁', target: 'System32' },
      { name: 'explorer.exe', icon: '⚙️', target: 'file', content: 'Windows Desktop Explorer core component.' }
    ],
    'System32': [
      { name: 'drivers', icon: '📁', target: 'empty' },
      { name: 'cmd.exe', icon: '⚙️', target: 'file', content: 'Microsoft Windows XP Command Prompt' }
    ],
    'Shared Music': [],
    'Shared Videos': [],
    'empty': []
  };

  // Dynamically populate 'My Videos' with media inside the database
  const getDirectoryFiles = (path: string): VirtualFile[] => {
    if (path === 'My Videos') {
      return allMovies.map(movie => ({
        name: `${movie.title}.mp4`,
        icon: '🎬',
        target: 'media',
        movieId: movie.id
      }));
    }
    
    if (path === 'Shared Videos') {
      return allMovies.slice(0, 3).map(movie => ({
        name: `Shared_${movie.title.replace(/\s+/g, '_')}.mp4`,
        icon: '🎬',
        target: 'media',
        movieId: movie.id
      }));
    }

    return fileSystem[path] || [];
  };

  // --- Drag Window Management ---
  const startDrag = (winId: string, e: React.MouseEvent) => {
    setFocusedWindowId(winId);
    setWindows(prev => prev.map(w => {
      if (w.id === winId) {
        zIndexCounter.current += 1;
        return { ...w, zIndex: zIndexCounter.current };
      }
      return w;
    }));

    const win = windows.find(w => w.id === winId);
    if (win && !win.isMaximized) {
      setDraggingWin(winId);
      dragOffsetRef.current = {
        x: e.clientX - win.x,
        y: e.clientY - win.y
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingWin) {
        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;
        setWindows(prev => prev.map(w => {
          if (w.id === draggingWin) {
            return { ...w, x: newX, y: newY };
          }
          return w;
        }));
      }
    };

    const handleMouseUp = () => {
      if (draggingWin) {
        setDraggingWin(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingWin]);

  // --- Window Operations ---
  const openApp = (winId: string) => {
    setStartMenuOpen(false);
    setFocusedWindowId(winId);
    setWindows(prev => prev.map(w => {
      if (w.id === winId) {
        zIndexCounter.current += 1;
        return { ...w, isOpen: true, isMinimized: false, zIndex: zIndexCounter.current };
      }
      return w;
    }));
  };

  const closeWindow = (winId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === winId) {
        return { ...w, isOpen: false };
      }
      return w;
    }));
    
    if (focusedWindowId === winId) {
      setFocusedWindowId(null);
    }

    // Stop video playing if WMP is closed
    if (winId === 'wmpWin') {
      setWmpVideoUrl('');
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  const minimizeWindow = (winId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === winId) {
        return { ...w, isMinimized: true };
      }
      return w;
    }));
    if (focusedWindowId === winId) {
      setFocusedWindowId(null);
    }
  };

  const toggleMaximizeWindow = (winId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === winId) {
        return { ...w, isMaximized: !w.isMaximized };
      }
      return w;
    }));
  };

  const toggleTaskbarWindow = (winId: string) => {
    const win = windows.find(w => w.id === winId);
    if (!win) return;

    if (win.isMinimized || focusedWindowId !== winId) {
      // Restore and focus
      setFocusedWindowId(winId);
      setWindows(prev => prev.map(w => {
        if (w.id === winId) {
          zIndexCounter.current += 1;
          return { ...w, isMinimized: false, zIndex: zIndexCounter.current };
        }
        return w;
      }));
    } else {
      // Minimize
      minimizeWindow(winId);
    }
  };

  // --- Profile Select / Login Screen Logic ---
  const handleProfileClick = (profile: Profile) => {
    setPinError(false);
    setPinInput('');
    if (profile.locked) {
      setSelectedProfileForLogin(profile);
    } else {
      loginAsProfile(profile);
    }
  };

  const loginAsProfile = (profile: Profile) => {
    setActiveProfile(profile);
    setSelectedProfileForLogin(null);
    
    // Set localStorage activeProfile to match rest of LSFPlus site!
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    window.dispatchEvent(new Event('profileChanged'));

    // Play startup sound
    const startupSound = new Audio('https://www.myinstants.com/media/sounds/windows-xp-startup.mp3');
    startupSound.volume = 0.4;
    startupSound.play().catch(e => console.log("Audio play blocked.", e));

    setLoggedIn(true);
    
    // Automatically open My Videos as a neat welcome
    setTimeout(() => {
      renderExplorer('My Videos');
      openApp('myComputerWin');
    }, 1200);
  };

  const handlePinSubmit = () => {
    if (selectedProfileForLogin && pinInput === selectedProfileForLogin.pin) {
      loginAsProfile(selectedProfileForLogin);
    } else {
      setPinError(true);
      setPinInput('');
      const errorSound = new Audio('https://www.myinstants.com/media/sounds/windows-xp-error.mp3');
      errorSound.volume = 0.3;
      errorSound.play().catch(() => {});
    }
  };

  // --- Explorer Navigation Logic ---
  const renderExplorer = (path: string) => {
    setCurrentPath(path);
    setExplorerAddress(path);
  };

  const handleExplorerDblClick = (item: VirtualFile) => {
    if (item.target === 'file') {
      alert(`[Notepad Reader]\nOpening file: ${item.name}\n\n${item.content || 'Empty file.'}`);
    } else if (item.target === 'app') {
      if (item.content) openApp(item.content);
    } else if (item.target === 'media' && item.movieId) {
      const movie = allMovies.find(m => m.id === item.movieId);
      if (movie) {
        setWmpTitle(movie.title);
        setWmpVideoUrl(movie.trailerUrl || movie.videoUrl || '');
        openApp('wmpWin');
      }
    } else {
      setNavHistory(prev => [...prev, currentPath]);
      renderExplorer(item.target);
    }
  };

  const navigateBack = () => {
    if (navHistory.length > 0) {
      const previous = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      renderExplorer(previous);
    }
  };

  // --- Paint Canvas Drawing Logic ---
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsPainting(true);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsPainting(false);
  };

  const clearPaintCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // --- Shut Down Operations ---
  const triggerShutdown = () => {
    setStartMenuOpen(false);
    setShowTurnOffModal(false);
    setIsShuttingDown(true);
    setShutdownMessage('Logging off...');
    
    // Play shutdown sound
    const shutdownSound = new Audio('https://www.myinstants.com/media/sounds/windows-xp-shutdown.mp3');
    shutdownSound.volume = 0.4;
    shutdownSound.play().catch(() => {});

    // Stage 1: Log off
    setTimeout(() => {
      setShutdownMessage('Shutting down...');
      // Stage 2: Turn off
      setTimeout(() => {
        setShutdownMessage('It is now safe to turn off your computer.');
      }, 2500);
    }, 2500);
  };

  const logOffUser = () => {
    setStartMenuOpen(false);
    setShowTurnOffModal(false);
    
    const logoffSound = new Audio('https://www.myinstants.com/media/sounds/windows-xp-logoff.mp3');
    logoffSound.volume = 0.3;
    logoffSound.play().catch(() => {});

    setIsShuttingDown(true);
    setShutdownMessage('Logging off...');
    setTimeout(() => {
      setLoggedIn(false);
      setActiveProfile(null);
      setIsShuttingDown(false);
      setShutdownMessage('');
    }, 2000);
  };

  return (
    <div className={`xp-os-wrapper ${isShuttingDown ? 'xp-shutdown-overlay' : ''}`}>
      
      {/* SHUTDOWN / BLISS SAFE SCREEN */}
      {isShuttingDown && (
        <div className="xp-shutdown-screen">
          <div className="xp-shutdown-logo">
            <div className="xp-logo-text">Microsoft<br />Windows <span>XP</span></div>
          </div>
          <div className="xp-shutdown-msg">{shutdownMessage}</div>
          {shutdownMessage.includes('safe to turn off') && (
            <div className="xp-shutdown-actions">
              <button className="xp-retro-button" onClick={() => navigate('/browse')}>Return to Site</button>
              <button className="xp-retro-button" onClick={() => {
                setIsShuttingDown(false);
                setShutdownMessage('');
                setLoggedIn(false);
                setActiveProfile(null);
              }}>Go to Login Screen</button>
            </div>
          )}
        </div>
      )}

      {/* LOGIN SCREEN */}
      {!loggedIn && !isShuttingDown && (
        <div id="loginScreen">
          <div className="login-top"></div>
          <div className="login-divider-top"></div>
          <div className="login-middle">
            <div className="login-left">
              <div className="xp-logo-text">Microsoft<br />Windows <span>XP</span></div>
              <div className="welcome-text">To begin, click your user name</div>
            </div>
            
            <div className="login-right">
              {loading ? (
                <div style={{ color: 'white', fontSize: '18px' }}>Loading profiles...</div>
              ) : (
                <div className="user-accounts-list">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="user-account-container">
                      <div 
                        className={`user-account ${selectedProfileForLogin?.id === profile.id ? 'selected' : ''}`}
                        onClick={() => handleProfileClick(profile)}
                      >
                        <img 
                          src={profile.image} 
                          alt={profile.name} 
                          className="user-avatar" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png';
                          }}
                        />
                        <div className="user-info-text">
                          <div className="user-name">{profile.name}</div>
                          {profile.locked && <div className="user-locked-badge">🔒 Locked</div>}
                        </div>
                      </div>

                      {/* XP-Skinned PIN Prompt below clicked profile */}
                      {selectedProfileForLogin?.id === profile.id && (
                        <div className="xp-pin-prompt">
                          <div className="pin-prompt-label">Type your PIN:</div>
                          <div className="pin-input-group">
                            <input 
                              type="password" 
                              maxLength={4}
                              value={pinInput}
                              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                              className="xp-pin-input-field" 
                              autoFocus 
                            />
                            <button className="xp-pin-submit-btn" onClick={handlePinSubmit}>➔</button>
                          </div>
                          {pinError && <div className="xp-pin-error">Incorrect PIN!</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="login-divider-bottom"></div>
          <div className="login-bottom">
            <div className="turn-off-btn" onClick={() => navigate('/browse')}>
              <div className="turn-off-icon">➔</div> Back to LSFPlus
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP ENVIRONMENT */}
      {loggedIn && !isShuttingDown && (
        <div className="xp-desktop">
          
          {/* Desktop Shortcuts */}
          <div className="desktop-icons">
            <div className="icon" onDoubleClick={() => { renderExplorer('My Computer'); openApp('myComputerWin'); }}>
              <div className="icon-badge">💻</div>
              <span>My Computer</span>
            </div>
            <div className="icon" onDoubleClick={() => openApp('notepadWin')}>
              <div className="icon-badge">📝</div>
              <span>Notepad</span>
            </div>
            <div className="icon" onDoubleClick={() => openApp('ieWin')}>
              <div className="icon-badge">🌐</div>
              <span>Internet</span>
            </div>
            <div className="icon" onDoubleClick={() => openApp('paintWin')}>
              <div className="icon-badge">🎨</div>
              <span>Paint</span>
            </div>
            <div className="icon animate-glow" onDoubleClick={() => { renderExplorer('My Videos'); openApp('myComputerWin'); }}>
              <div className="icon-badge">🎬</div>
              <span style={{ fontWeight: 'bold', color: '#FFF' }}>My Video Library</span>
            </div>
          </div>

          {/* 1. My Computer Window (Virtual Explorer) */}
          {windows.find(w => w.id === 'myComputerWin')?.isOpen && (
            <div 
              className={`window ${windows.find(w => w.id === 'myComputerWin')?.isMaximized ? 'maximized' : ''} ${focusedWindowId === 'myComputerWin' ? 'focused' : ''}`}
              style={{
                left: windows.find(w => w.id === 'myComputerWin')?.isMaximized ? 0 : windows.find(w => w.id === 'myComputerWin')?.x,
                top: windows.find(w => w.id === 'myComputerWin')?.isMaximized ? 0 : windows.find(w => w.id === 'myComputerWin')?.y,
                width: windows.find(w => w.id === 'myComputerWin')?.isMaximized ? '100%' : windows.find(w => w.id === 'myComputerWin')?.width,
                height: windows.find(w => w.id === 'myComputerWin')?.isMaximized ? 'calc(100% - 30px)' : windows.find(w => w.id === 'myComputerWin')?.height,
                zIndex: windows.find(w => w.id === 'myComputerWin')?.zIndex,
                display: windows.find(w => w.id === 'myComputerWin')?.isMinimized ? 'none' : 'flex'
              }}
              onClick={() => setFocusedWindowId('myComputerWin')}
            >
              <div className="title-bar" onMouseDown={(e) => startDrag('myComputerWin', e)}>
                <span className="title-text">💻 {currentPath}</span>
                <div className="window-controls">
                  <button className="control-btn minimize" onClick={() => minimizeWindow('myComputerWin')}>_</button>
                  <button className="control-btn maximize" onClick={() => toggleMaximizeWindow('myComputerWin')}>🗖</button>
                  <button className="control-btn close" onClick={() => closeWindow('myComputerWin')}>X</button>
                </div>
              </div>
              
              <div className="explorer-toolbar">
                <button className="explorer-btn" onClick={navigateBack} disabled={navHistory.length === 0}>
                  ⬅️ Back
                </button>
                <div className="toolbar-separator"></div>
                <div className="address-bar">
                  <span className="address-label">Address</span>
                  <input type="text" className="address-input" value={explorerAddress} readOnly />
                </div>
              </div>

              <div className="explorer-body">
                <div className="explorer-sidebar">
                  <div className="sidebar-box">
                    <div className="sidebar-header">System Tasks</div>
                    <div className="sidebar-content">
                      <div className="sidebar-link" onClick={() => renderExplorer('My Computer')}>▶ View my drives</div>
                      <div className="sidebar-link" onClick={() => renderExplorer('My Documents')}>▶ View my files</div>
                      <div className="sidebar-link" onClick={() => navigate('/browse')}>▶ Back to LSFPlus</div>
                    </div>
                  </div>
                  <div className="sidebar-box">
                    <div className="sidebar-header">Active Profile</div>
                    <div className="sidebar-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px' }}>
                      <img src={activeProfile?.image} style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #7F9DB9' }} alt="" />
                      <div>
                        <strong style={{ fontSize: '11px', color: '#003399' }}>{activeProfile?.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="explorer-main">
                  {getDirectoryFiles(currentPath).length === 0 ? (
                    <div className="empty-folder-msg">This folder is empty.</div>
                  ) : (
                    getDirectoryFiles(currentPath).map((item, idx) => (
                      <div key={idx} className="explorer-item" onDoubleClick={() => handleExplorerDblClick(item)}>
                        <div className="item-icon">{item.icon}</div>
                        <div className="item-name">{item.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Notepad Window */}
          {windows.find(w => w.id === 'notepadWin')?.isOpen && (
            <div 
              className={`window ${windows.find(w => w.id === 'notepadWin')?.isMaximized ? 'maximized' : ''} ${focusedWindowId === 'notepadWin' ? 'focused' : ''}`}
              style={{
                left: windows.find(w => w.id === 'notepadWin')?.isMaximized ? 0 : windows.find(w => w.id === 'notepadWin')?.x,
                top: windows.find(w => w.id === 'notepadWin')?.isMaximized ? 0 : windows.find(w => w.id === 'notepadWin')?.y,
                width: windows.find(w => w.id === 'notepadWin')?.isMaximized ? '100%' : windows.find(w => w.id === 'notepadWin')?.width,
                height: windows.find(w => w.id === 'notepadWin')?.isMaximized ? 'calc(100% - 30px)' : windows.find(w => w.id === 'notepadWin')?.height,
                zIndex: windows.find(w => w.id === 'notepadWin')?.zIndex,
                display: windows.find(w => w.id === 'notepadWin')?.isMinimized ? 'none' : 'flex'
              }}
              onClick={() => setFocusedWindowId('notepadWin')}
            >
              <div className="title-bar" onMouseDown={(e) => startDrag('notepadWin', e)}>
                <span className="title-text">📝 Notepad</span>
                <div className="window-controls">
                  <button className="control-btn minimize" onClick={() => minimizeWindow('notepadWin')}>_</button>
                  <button className="control-btn maximize" onClick={() => toggleMaximizeWindow('notepadWin')}>🗖</button>
                  <button className="control-btn close" onClick={() => closeWindow('notepadWin')}>X</button>
                </div>
              </div>
              <div className="window-menu-bar">
                <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
              </div>
              <div className="window-content" style={{ padding: 0, margin: 0, border: 'none' }}>
                <textarea 
                  className="notepad-textarea" 
                  value={notepadText} 
                  onChange={(e) => setNotepadText(e.target.value)}
                  placeholder="Type something here..."
                />
              </div>
            </div>
          )}

          {/* 3. Internet Explorer Window */}
          {windows.find(w => w.id === 'ieWin')?.isOpen && (
            <div 
              className={`window ${windows.find(w => w.id === 'ieWin')?.isMaximized ? 'maximized' : ''} ${focusedWindowId === 'ieWin' ? 'focused' : ''}`}
              style={{
                left: windows.find(w => w.id === 'ieWin')?.isMaximized ? 0 : windows.find(w => w.id === 'ieWin')?.x,
                top: windows.find(w => w.id === 'ieWin')?.isMaximized ? 0 : windows.find(w => w.id === 'ieWin')?.y,
                width: windows.find(w => w.id === 'ieWin')?.isMaximized ? '100%' : windows.find(w => w.id === 'ieWin')?.width,
                height: windows.find(w => w.id === 'ieWin')?.isMaximized ? 'calc(100% - 30px)' : windows.find(w => w.id === 'ieWin')?.height,
                zIndex: windows.find(w => w.id === 'ieWin')?.zIndex,
                display: windows.find(w => w.id === 'ieWin')?.isMinimized ? 'none' : 'flex'
              }}
              onClick={() => setFocusedWindowId('ieWin')}
            >
              <div className="title-bar" onMouseDown={(e) => startDrag('ieWin', e)}>
                <span className="title-text">🌐 Internet Explorer</span>
                <div className="window-controls">
                  <button className="control-btn minimize" onClick={() => minimizeWindow('ieWin')}>_</button>
                  <button className="control-btn maximize" onClick={() => toggleMaximizeWindow('ieWin')}>🗖</button>
                  <button className="control-btn close" onClick={() => closeWindow('ieWin')}>X</button>
                </div>
              </div>
              <div className="explorer-toolbar">
                <button className="explorer-btn" onClick={() => { setIeUrl('https://en.wikipedia.org/wiki/Windows_XP'); setIeInputUrl('https://en.wikipedia.org/wiki/Windows_XP'); }}>🏠 Home</button>
                <div className="toolbar-separator"></div>
                <div className="address-bar">
                  <span className="address-label">Address</span>
                  <input 
                    type="text" 
                    className="address-input" 
                    value={ieInputUrl} 
                    onChange={(e) => setIeInputUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setIeUrl(ieInputUrl)}
                  />
                  <button className="ie-go-btn" onClick={() => setIeUrl(ieInputUrl)}>Go</button>
                </div>
              </div>
              <div className="window-content" style={{ padding: 0, margin: 0, overflow: 'hidden' }}>
                <iframe src={ieUrl} className="ie-iframe" title="Virtual Internet Explorer Browser"></iframe>
              </div>
            </div>
          )}

          {/* 4. Paint Window */}
          {windows.find(w => w.id === 'paintWin')?.isOpen && (
            <div 
              className={`window ${windows.find(w => w.id === 'paintWin')?.isMaximized ? 'maximized' : ''} ${focusedWindowId === 'paintWin' ? 'focused' : ''}`}
              style={{
                left: windows.find(w => w.id === 'paintWin')?.isMaximized ? 0 : windows.find(w => w.id === 'paintWin')?.x,
                top: windows.find(w => w.id === 'paintWin')?.isMaximized ? 0 : windows.find(w => w.id === 'paintWin')?.y,
                width: windows.find(w => w.id === 'paintWin')?.isMaximized ? '100%' : windows.find(w => w.id === 'paintWin')?.width,
                height: windows.find(w => w.id === 'paintWin')?.isMaximized ? 'calc(100% - 30px)' : windows.find(w => w.id === 'paintWin')?.height,
                zIndex: windows.find(w => w.id === 'paintWin')?.zIndex,
                display: windows.find(w => w.id === 'paintWin')?.isMinimized ? 'none' : 'flex'
              }}
              onClick={() => setFocusedWindowId('paintWin')}
            >
              <div className="title-bar" onMouseDown={(e) => startDrag('paintWin', e)}>
                <span className="title-text">🎨 Paint</span>
                <div className="window-controls">
                  <button className="control-btn minimize" onClick={() => minimizeWindow('paintWin')}>_</button>
                  <button className="control-btn maximize" onClick={() => toggleMaximizeWindow('paintWin')}>🗖</button>
                  <button className="control-btn close" onClick={() => closeWindow('paintWin')}>X</button>
                </div>
              </div>
              <div className="window-menu-bar">
                <span onClick={clearPaintCanvas} style={{ cursor: 'pointer', color: '#003399', fontWeight: 'bold' }}>🗑️ Clear Canvas</span>
              </div>
              <div className="paint-canvas-container">
                <canvas 
                  ref={canvasRef} 
                  width={530} 
                  height={350} 
                  className="paint-canvas-element"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUpOrLeave}
                  onMouseLeave={handleCanvasMouseUpOrLeave}
                />
              </div>
            </div>
          )}

          {/* 5. Windows Media Player Window */}
          {windows.find(w => w.id === 'wmpWin')?.isOpen && (
            <div 
              className={`window wmp-window ${windows.find(w => w.id === 'wmpWin')?.isMaximized ? 'maximized' : ''} ${focusedWindowId === 'wmpWin' ? 'focused' : ''}`}
              style={{
                left: windows.find(w => w.id === 'wmpWin')?.isMaximized ? 0 : windows.find(w => w.id === 'wmpWin')?.x,
                top: windows.find(w => w.id === 'wmpWin')?.isMaximized ? 0 : windows.find(w => w.id === 'wmpWin')?.y,
                width: windows.find(w => w.id === 'wmpWin')?.isMaximized ? '100%' : windows.find(w => w.id === 'wmpWin')?.width,
                height: windows.find(w => w.id === 'wmpWin')?.isMaximized ? 'calc(100% - 30px)' : windows.find(w => w.id === 'wmpWin')?.height,
                zIndex: windows.find(w => w.id === 'wmpWin')?.zIndex,
                display: windows.find(w => w.id === 'wmpWin')?.isMinimized ? 'none' : 'flex'
              }}
              onClick={() => setFocusedWindowId('wmpWin')}
            >
              <div className="title-bar wmp-titlebar" onMouseDown={(e) => startDrag('wmpWin', e)}>
                <span className="title-text">🎬 Windows Media Player - {wmpTitle}</span>
                <div className="window-controls">
                  <button className="control-btn minimize" onClick={() => minimizeWindow('wmpWin')}>_</button>
                  <button className="control-btn maximize" onClick={() => toggleMaximizeWindow('wmpWin')}>🗖</button>
                  <button className="control-btn close" onClick={() => closeWindow('wmpWin')}>X</button>
                </div>
              </div>
              <div className="wmp-content">
                <div className="wmp-display-area">
                  {wmpVideoUrl ? (
                    <video 
                      ref={videoRef}
                      src={wmpVideoUrl} 
                      className="wmp-video-screen"
                      controls
                      autoPlay
                    />
                  ) : (
                    <div className="wmp-placeholder">
                      <div className="wmp-logo-disc">💿</div>
                      <div className="wmp-placeholder-text">Double click an .mp4 file in My Videos to play media</div>
                    </div>
                  )}
                </div>
                <div className="wmp-controls-panel">
                  <div className="wmp-track-info">{wmpTitle}</div>
                  <div className="wmp-buttons-row">
                    <button className="wmp-btn" onClick={() => videoRef.current?.play()}>▶ Play</button>
                    <button className="wmp-btn" onClick={() => videoRef.current?.pause()}>⏸ Pause</button>
                    <button className="wmp-btn" onClick={() => { setWmpVideoUrl(''); setWmpTitle('Welcome to Windows Media Player'); }}>⏹ Stop</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start Menu */}
          {startMenuOpen && (
            <div className="start-menu" id="startMenu">
              <div className="start-menu-header">
                <img 
                  src={activeProfile?.image} 
                  className="start-menu-avatar" 
                  alt="" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png';
                  }}
                />
                <span className="start-menu-username">{activeProfile?.name || 'Administrator'}</span>
              </div>
              <div className="start-menu-body">
                <div className="start-menu-left">
                  <div className="start-menu-section-title">Programs</div>
                  <div className="menu-item" onClick={() => openApp('ieWin')}>
                    <span className="menu-item-icon">🌐</span>
                    <span>Internet Explorer</span>
                  </div>
                  <div className="menu-item" onClick={() => openApp('notepadWin')}>
                    <span className="menu-item-icon">📝</span>
                    <span>Notepad</span>
                  </div>
                  <div className="menu-item" onClick={() => openApp('paintWin')}>
                    <span className="menu-item-icon">🎨</span>
                    <span>Paint</span>
                  </div>
                  <div className="menu-item" onClick={() => openApp('wmpWin')}>
                    <span className="menu-item-icon">🎬</span>
                    <span>Windows Media Player</span>
                  </div>
                  <div className="menu-item" onClick={() => { renderExplorer('My Videos'); openApp('myComputerWin'); }}>
                    <span className="menu-item-icon">🍿</span>
                    <strong style={{ color: '#0055EA' }}>Movie Library</strong>
                  </div>
                </div>
                <div className="start-menu-right">
                  <div className="menu-item right-item" onClick={() => { renderExplorer('My Documents'); openApp('myComputerWin'); }}>
                    <span>My Documents</span>
                  </div>
                  <div className="menu-item right-item" onClick={() => { renderExplorer('My Videos'); openApp('myComputerWin'); }}>
                    <span>My Videos</span>
                  </div>
                  <div className="menu-item right-item" onClick={() => { renderExplorer('My Computer'); openApp('myComputerWin'); }}>
                    <span>My Computer</span>
                  </div>
                  <div className="menu-item right-item" onClick={() => openApp('ieWin')}>
                    <span>Web Search</span>
                  </div>
                  <div className="menu-item right-item" onClick={() => navigate('/browse')}>
                    <strong>🚀 Exit to LSFPlus</strong>
                  </div>
                </div>
              </div>
              <div className="start-menu-footer">
                <button className="start-footer-btn" onClick={logOffUser}>
                  <div className="footer-btn-icon logoff">🔑</div> Log Off
                </button>
                <button className="start-footer-btn" onClick={() => setShowTurnOffModal(true)}>
                  <div className="footer-btn-icon turnoff">⏻</div> Turn Off Computer
                </button>
              </div>
            </div>
          )}

          {/* Turn Off Computer Classic Dialog */}
          {showTurnOffModal && (
            <div className="xp-turnoff-dialog-overlay">
              <div className="xp-turnoff-dialog">
                <div className="dialog-title">Turn off computer</div>
                <div className="dialog-buttons">
                  <div className="dialog-btn-container" onClick={() => { setShowTurnOffModal(false); alert('Standby mode activated. Double-click to wake.'); }}>
                    <div className="dialog-icon standby">☾</div>
                    <span>Standby</span>
                  </div>
                  <div className="dialog-btn-container" onClick={triggerShutdown}>
                    <div className="dialog-icon turnoff">⏻</div>
                    <span>Turn Off</span>
                  </div>
                  <div className="dialog-btn-container" onClick={() => { setShowTurnOffModal(false); logOffUser(); }}>
                    <div className="dialog-icon restart">↻</div>
                    <span>Restart</span>
                  </div>
                </div>
                <div className="dialog-footer">
                  <button className="retro-btn" onClick={() => setShowTurnOffModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Taskbar */}
          <div className="taskbar">
            <div 
              className={`start-btn ${startMenuOpen ? 'active' : ''}`} 
              onClick={() => setStartMenuOpen(!startMenuOpen)}
            >
              Start
            </div>

            {/* Taskbar Open Windows tabs */}
            <div className="taskbar-windows-tabs">
              {windows.filter(w => w.isOpen).map((win) => (
                <div 
                  key={win.id} 
                  className={`taskbar-tab ${focusedWindowId === win.id ? 'active' : ''}`}
                  onClick={() => toggleTaskbarWindow(win.id)}
                >
                  <span className="tab-icon">{win.icon}</span>
                  <span className="tab-title">{win.title}</span>
                </div>
              ))}
            </div>

            {/* System Tray Clock */}
            <div className="system-tray">
              <span className="tray-time">{currentTime}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
