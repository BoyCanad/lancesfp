import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import MinsanDetail from './pages/MinsanDetail';
import TindahanDetail from './pages/TindahanDetail';
import AlapaapDetail from './pages/AlapaapDetail';
import SpoliariumDetail from './pages/SpoliariumDetail';
import PareKoDetail from './pages/PareKoDetail';
import TamaKaDetail from './pages/TamaKaDetail';
import ElBimboDetail from './pages/ElBimboDetail';

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
import './App.css';

function App() {
  const { pathname } = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isVideoPlayer = pathname.startsWith('/watch') || pathname.startsWith('/trailer') || /\/clip\//.test(pathname);
  const isProfilePicker = pathname === '/';
  const isManageProfile = pathname.startsWith('/ManageProfile') || pathname.startsWith('/EditProfile') || pathname.startsWith('/IconPicker') || pathname === '/CreateProfile' || pathname.startsWith('/ProfileLock');
  const isAuth = pathname === '/login';
  const showNavAndFooter = !isVideoPlayer && !isProfilePicker && !isManageProfile && !isAuth;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (checkingAuth) {
    return <div style={{ backgroundColor: '#141414', height: '100vh' }}></div>;
  }

  return (
    <div className="app">
      {showNavAndFooter && <Navbar />}

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
        <Route path="/tindahan" element={<TindahanDetail />} />
        <Route path="/alapaap" element={<AlapaapDetail />} />
        <Route path="/spoliarium" element={<SpoliariumDetail />} />
        <Route path="/pare-ko" element={<PareKoDetail />} />
        <Route path="/tama-ka" element={<TamaKaDetail />} />
        <Route path="/el-bimbo" element={<ElBimboDetail />} />

        <Route path="/watch/:id" element={session ? <VideoPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/trailer/:id" element={session ? <TrailerPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/:movieSlug/clip/:clipId" element={session ? <ClipPlayer /> : <Navigate to="/login" replace />} />
      </Routes>

      {showNavAndFooter && (
        <>
          <footer className="app__footer">
            <div className="app__footer-logo">
              LSFPlus
            </div>
            <p className="app__footer-text">
              © 2025 LSFPlus, Inc. All rights reserved.
            </p>
          </footer>
          {/* Bottom Navigation for Mobile */}
          <MobileNav />
        </>
      )}
    </div>
  );
}

export default App;
