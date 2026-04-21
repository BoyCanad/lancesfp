import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import ElBimboCollection from './pages/ElBimboCollection';
import MusicPlayer from './pages/MusicPlayer';
import LivePlayer from './pages/LivePlayer';
import AfterHoursDetail from './pages/AfterHoursDetail';
import StemADetail from './pages/StemADetail';
import Search from './pages/Search';
import MyList from './pages/MyList';
import CategoryPage from './pages/CategoryPage';

import VideoPlayer from './pages/VideoPlayer';
import TrailerPlayer from './pages/TrailerPlayer';
import Clips from './pages/Clips';
import ClipPlayer from './pages/ClipPlayer';
import ProfilePicker from './pages/ProfilePicker';
import ManageProfile from './pages/ManageProfile';
import EditProfile from './pages/EditProfile';
import IconPicker from './pages/IconPicker';
import Auth from './pages/Auth';
import CreateProfile from './pages/CreateProfile';
import ProfileLock from './pages/ProfileLock';
import Account from './pages/Account';
import MyNetflix from './pages/MyNetflix';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

function App() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const isVideoPlayer = pathname.startsWith('/watch') || pathname.startsWith('/trailer') || /\/clip\//.test(pathname) || pathname.startsWith('/music') || pathname === '/live' || pathname === '/clips';
  const isProfilePicker = pathname === '/';
  const isManageProfile = pathname.startsWith('/ManageProfile') || pathname.startsWith('/EditProfile') || pathname.startsWith('/IconPicker') || pathname === '/CreateProfile' || pathname.startsWith('/ProfileLock');
  const isAuth = pathname === '/login';
  const isForgotPassword = pathname === '/forgot-password';
  const isAccount = pathname === '/account';
  const isMyNetflix = pathname === '/my-lsfplus';
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
    '/beyond-the-last-dance',
    '/after-hours',
    '/bukang-liwayway-takipsilim',
    '/a-day-in-my-life-stem',
    '/11-stem-a'
  ].includes(pathname);

  const isGenrePage = pathname.startsWith('/genre');

  const showNavAndFooter = (!isVideoPlayer && !isProfilePicker && !isManageProfile && !isAuth && !isForgotPassword && !isAccount && !isDetailPage) || isMyNetflix || isGenrePage;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setCheckingAuth(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/account', { state: { recover: true } });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [prevPath, setPrevPath] = useState(pathname);
  const [transitionProfile, setTransitionProfile] = useState<string | null>(null);

  useEffect(() => {
    // Clean transition profile on mount to ensure fresh starts are generic
    setTransitionProfile(null);
  }, []);

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    
    const locState = (location as any).state;
    // Only show profile icon if specifically transitioning FROM a profile selection TO a browse/content page
    const isProfileSwap = (prevPath === '/' || locState?.fromProfileSwap) && pathname === '/browse';
    
    if (isProfileSwap) {
      const stored = localStorage.getItem('activeProfile');
      const img = locState?.profileImage || (stored ? JSON.parse(stored!)?.image : null);
      setTransitionProfile(img);
    } else {
      setTransitionProfile(null);
    }
    
    const isSearchTransition = pathname === '/search' || (prevPath === '/search' && pathname === '/browse');
    
    if (!isSearchTransition) {
      setPageLoading(true);
    } else {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Auto-dismiss loading spinner
    const locState = (location as any).state;
    const isProfileTransition = transitionProfile !== null || locState?.fromProfileSwap;
    const isInit = prevPath === pathname;
    const delay = isProfileTransition ? 1400 : (isInit ? 1500 : 800);

    const timer = setTimeout(() => {
      setPageLoading(false);
    }, delay); 
    
    return () => clearTimeout(timer);
  }, [pathname, transitionProfile, location]);

  if (checkingAuth) {
    // Show spinner during auth check too
    return <LoadingSpinner visible={true} />;
  }

  return (
    <div className="app">
      <LoadingSpinner visible={pageLoading} profileImage={transitionProfile} />
      {showNavAndFooter && !isMyNetflix && !isGenrePage && <Navbar />}

      <Routes>
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={session ? <ProfilePicker /> : <Navigate to="/browse" replace />} />
        <Route path="/CreateProfile" element={session ? <CreateProfile /> : <Navigate to="/login" replace />} />
        <Route path="/ProfileLock/:id" element={session ? <ProfileLock /> : <Navigate to="/login" replace />} />
        <Route path="/ManageProfile/:id" element={session ? <ManageProfile /> : <Navigate to="/login" replace />} />
        <Route path="/EditProfile/:id" element={session ? <EditProfile /> : <Navigate to="/login" replace />} />
        <Route path="/IconPicker/:id" element={session ? <IconPicker /> : <Navigate to="/login" replace />} />
        
        <Route path="/browse" element={<Home />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/search" element={<Search />} />
        <Route path="/genre/:genreId" element={<CategoryPage />} />
        <Route path="/ang-huling-el-bimbo-play" element={<MovieDetail />} />
        <Route path="/minsan" element={<MovieDetail />} />
        <Route path="/tindahan-ni-aling-nena" element={<MovieDetail />} />
        <Route path="/alapaap-overdrive" element={<MovieDetail />} />
        <Route path="/spoliarium-graduation" element={<MovieDetail />} />
        <Route path="/pare-ko" element={<MovieDetail />} />
        <Route path="/tama-ka-ligaya" element={<MovieDetail />} />
        <Route path="/ang-huling-el-bimbo" element={<MovieDetail />} />
        <Route path="/beyond-the-last-dance" element={<MovieDetail />} />
        <Route path="/after-hours" element={<AfterHoursDetail />} />
        <Route path="/bukang-liwayway-takipsilim" element={<MovieDetail />} />
        <Route path="/a-day-in-my-life-stem" element={<MovieDetail />} />
        <Route path="/11-stem-a" element={<StemADetail />} />
        <Route path="/collections/el-bimbo" element={<ElBimboCollection />} />
        <Route path="/watch/:id" element={session ? <VideoPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/trailer/:id" element={session ? <TrailerPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/clips" element={session ? <Clips /> : <Navigate to="/login" replace />} />
        <Route path="/:movieSlug/clip/:clipId" element={<ClipPlayer />} />
        <Route path="/music/:id" element={<MusicPlayer />} />
        <Route path="/music" element={<MusicPlayer />} />
        <Route path="/live" element={session ? <LivePlayer /> : <Navigate to="/login" replace />} />

        <Route path="/account" element={session ? <Account /> : <Navigate to="/login" replace />} />
        <Route path="/my-lsfplus" element={session ? <MyNetflix /> : <Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>

      {showNavAndFooter && (
        <>
          {!isMyNetflix && (
            <footer className="app__footer">
              <div className="app__footer-logo">
                LSFPlus
              </div>
              <p className="app__footer-text">
                © 2025 LSFPlus, Inc. All rights reserved.
              </p>
            </footer>
          )}
          <MobileNav />
        </>
      )}
    </div>
  );
}

export default App;
