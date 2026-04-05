import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home.tsx';
import MovieDetail from './pages/MovieDetail.tsx';
import MinsanDetail from './pages/MinsanDetail.tsx';
import TindahanDetail from './pages/TindahanDetail.tsx';
import AlapaapDetail from './pages/AlapaapDetail.tsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ang-huling-el-bimbo-play" element={<MovieDetail />} />
        <Route path="/minsan" element={<MinsanDetail />} />
        <Route path="/tindahan" element={<TindahanDetail />} />
        <Route path="/alapaap" element={<AlapaapDetail />} />
      </Routes>

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
    </div>
  );
}

export default App;
