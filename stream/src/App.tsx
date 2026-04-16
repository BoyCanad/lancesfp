import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import MinsanDetail from './pages/MinsanDetail';
import TindahanDetail from './pages/TindahanDetail';
import AlapaapDetail from './pages/AlapaapDetail';
import SpoliariumDetail from './pages/SpoliariumDetail';
import PareKoDetail from './pages/PareKoDetail';
import TamaKaDetail from './pages/TamaKaDetail';
import ElBimboDetail from './pages/ElBimboDetail';
import ElBimboCollection from './pages/ElBimboCollection';
import BeyondLastDanceDetail from './pages/BeyondLastDanceDetail';

import VideoPlayer from './pages/VideoPlayer';
import TrailerPlayer from './pages/TrailerPlayer';
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

  const isVideoPlayer = pathname.startsWith('/watch') || pathname.startsWith('/trailer') || /\/clip\//.test(pathname);
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
    '/beyond-the-last-dance'
  ].includes(pathname);

  const showNavAndFooter = (!isVideoPlayer && !isProfilePicker && !isManageProfile && !isAuth && !isForgotPassword && !isAccount && !isDetailPage) || isMyNetflix;

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
    
    setPageLoading(true);
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
      {showNavAndFooter && !isMyNetflix && <Navbar />}

      <Routes>
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={session ? <ProfilePicker /> : <Navigate to="/browse" replace />} />
        <Route path="/CreateProfile" element={session ? <CreateProfile /> : <Navigate to="/login" replace />} />
        <Route path="/ProfileLock/:id" element={session ? <ProfileLock /> : <Navigate to="/login" replace />} />
        <Route path="/ManageProfile/:id" element={session ? <ManageProfile /> : <Navigate to="/login" replace />} />
        <Route path="/EditProfile/:id" element={session ? <EditProfile /> : <Navigate to="/login" replace />} />
        <Route path="/IconPicker/:id" element={session ? <IconPicker /> : <Navigate to="/login" replace />} />
        
        <Route path="/browse" element={<Home />} />
        <Route path="/ang-huling-el-bimbo-play" element={<MovieDetail />} />
        <Route path="/minsan" element={<MinsanDetail />} />
        <Route path="/tindahan-ni-aling-nena" element={<TindahanDetail />} />
        <Route path="/alapaap-overdrive" element={<AlapaapDetail />} />
        <Route path="/spoliarium-graduation" element={<SpoliariumDetail />} />
        <Route path="/pare-ko" element={<PareKoDetail />} />
        <Route path="/tama-ka-ligaya" element={<TamaKaDetail />} />
        <Route path="/ang-huling-el-bimbo" element={<ElBimboDetail />} />
        <Route path="/beyond-the-last-dance" element={<BeyondLastDanceDetail />} />
        <Route path="/collections/el-bimbo" element={<ElBimboCollection />} />
        <Route path="/watch/:id" element={session ? <VideoPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/trailer/:id" element={session ? <TrailerPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/:movieSlug/clip/:clipId" element={<ClipPlayer />} />
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
