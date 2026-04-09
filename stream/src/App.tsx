import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home.tsx';
import MovieDetail from './pages/MovieDetail.tsx';
import MinsanDetail from './pages/MinsanDetail.tsx';
import TindahanDetail from './pages/TindahanDetail.tsx';
import AlapaapDetail from './pages/AlapaapDetail.tsx';
import SpoliariumDetail from './pages/SpoliariumDetail.tsx';
import PareKoDetail from './pages/PareKoDetail.tsx';
import TamaKaDetail from './pages/TamaKaDetail.tsx';
import ElBimboDetail from './pages/ElBimboDetail.tsx';

import VideoPlayer from './pages/VideoPlayer.tsx';
import TrailerPlayer from './pages/TrailerPlayer.tsx';
import './App.css';

function App() {
  const { pathname } = useLocation();
  const isVideoPlayer = pathname.startsWith('/watch') || pathname.startsWith('/trailer');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      {!isVideoPlayer && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ang-huling-el-bimbo-play" element={<MovieDetail />} />
        <Route path="/minsan" element={<MinsanDetail />} />
        <Route path="/tindahan" element={<TindahanDetail />} />
        <Route path="/alapaap" element={<AlapaapDetail />} />
        <Route path="/spoliarium" element={<SpoliariumDetail />} />
        <Route path="/pare-ko" element={<PareKoDetail />} />
        <Route path="/tama-ka" element={<TamaKaDetail />} />
        <Route path="/el-bimbo" element={<ElBimboDetail />} />

        <Route path="/watch/:id" element={<VideoPlayer />} />
        <Route path="/trailer/:id" element={<TrailerPlayer />} />
      </Routes>

      {!isVideoPlayer && (
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
