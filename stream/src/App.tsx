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
import ElBimboCollection from './pages/ElBimboCollection';

import VideoPlayer from './pages/VideoPlayer';
import TrailerPlayer from './pages/TrailerPlayer';
import ClipPlayer from './pages/ClipPlayer';
import ProfilePicker from './pages/ProfilePicker';
import ManageProfile from './pages/ManageProfile';
import EditProfile from './pages/EditProfile';
import IconPicker from './pages/IconPicker';
import Auth from './pages/Auth';
import Downloads from './pages/Downloads';
import CreateProfile from './pages/CreateProfile';
import ProfileLock from './pages/ProfileLock';
import Account from './pages/Account';
import './App.css';

function App() {
  const { pathname } = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isVideoPlayer = pathname.startsWith('/watch') || pathname.startsWith('/trailer') || /\/clip\//.test(pathname);
  const isProfilePicker = pathname === '/';
  const isManageProfile = pathname.startsWith('/ManageProfile') || pathname.startsWith('/EditProfile') || pathname.startsWith('/IconPicker') || pathname === '/CreateProfile' || pathname.startsWith('/ProfileLock');
  const isAuth = pathname === '/login';
  const isAccount = pathname === '/account';
  const showNavAndFooter = !isVideoPlayer && !isProfilePicker && !isManageProfile && !isAuth && !isAccount;

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
        <Route path="/tindahan-ni-aling-nena" element={<TindahanDetail />} />
        <Route path="/alapaap-overdrive" element={<AlapaapDetail />} />
        <Route path="/spoliarium-graduation" element={<SpoliariumDetail />} />
        <Route path="/pare-ko" element={<PareKoDetail />} />
        <Route path="/tama-ka-ligaya" element={<TamaKaDetail />} />
        <Route path="/ang-huling-el-bimbo" element={<ElBimboDetail />} />
        <Route path="/collections/el-bimbo" element={<ElBimboCollection />} />

        <Route path="/watch/:id" element={session ? <VideoPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/trailer/:id" element={session ? <TrailerPlayer /> : <Navigate to="/login" replace />} />
        <Route path="/:movieSlug/clip/:clipId" element={<ClipPlayer />} />
        <Route path="/downloads" element={session ? <Downloads /> : <Navigate to="/login" replace />} />
        <Route path="/account" element={session ? <Account /> : <Navigate to="/login" replace />} />
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
