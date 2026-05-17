import React from 'react';
import { ArrowLeft, Home, PlaySquare, Search, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Games.css';

const Games: React.FC = () => {
  const navigate = useNavigate();



  // Street Fighter Cover SVG
  const StreetFighterIcon = () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="160" height="160" rx="28" fill="#7f1d1d" />
      <path d="M0 80h160v80H0z" fill="#1e3a8a" opacity="0.6" />
      
      {/* Ryu Styled Headband and Gloves */}
      <path d="M30 65h100v10H30z" fill="#ef4444" />
      <circle cx="80" cy="70" r="25" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
      
      {/* Spiky Hair */}
      <path d="M60 70l20-25 20 25-10 15h-20z" fill="#111827" />
      
      {/* Fighter Fist Glove */}
      <rect x="55" y="95" width="50" height="40" rx="8" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
      <circle cx="65" cy="115" r="6" fill="#facc15" />
      <circle cx="95" cy="115" r="6" fill="#facc15" />
      
      {/* Fist Bandage wrap effect */}
      <path d="M55 120h50v5H55zm0 8h50v5H55z" fill="#ffffff" opacity="0.9" />
    </svg>
  );

  // Sonic Mania Cover SVG
  const SonicIcon = () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="160" height="160" rx="28" fill="#eab308" />
      
      {/* Blue checkerboard pattern at the bottom */}
      <path d="M0 100h160v60H0z" fill="#1d4ed8" />
      <path d="M20 100h20v20H20zm40 0h20v20H40zm40 0h20v20H80zm40 0h20v20H120z" fill="#1e3a8a" opacity="0.5" />
      
      {/* Sonic Blue Hedgehog spikes outline */}
      <circle cx="80" cy="75" r="32" fill="#2563eb" />
      <path d="M80 43l35 15-5 35zM80 43l-35 15 5 35z" fill="#2563eb" />
      <circle cx="80" cy="75" r="24" fill="#ffedd5" /> {/* Face Area */}
      
      {/* Golden Rings */}
      <circle cx="80" cy="75" r="45" stroke="#facc15" strokeWidth="6" fill="none" />
      <circle cx="30" cy="40" r="12" stroke="#facc15" strokeWidth="4" fill="none" />
      <circle cx="130" cy="40" r="12" stroke="#facc15" strokeWidth="4" fill="none" />
    </svg>
  );

  // Bloons TD 6 Cover SVG
  const BloonsIcon = () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="160" height="160" rx="28" fill="#0284c7" />
      
      {/* Red headband dart monkey */}
      <circle cx="80" cy="85" r="30" fill="#78350f" />
      <circle cx="80" cy="85" r="22" fill="#ffedd5" />
      <path d="M60 70h40v8H60z" fill="#dc2626" /> {/* Red headband */}
      <circle cx="70" cy="82" r="4" fill="#000" />
      <circle cx="90" cy="82" r="4" fill="#000" />

      {/* Balloons */}
      <circle cx="45" cy="50" r="18" fill="#ef4444" />
      <path d="M45 68l-3 5h6z" fill="#ef4444" />
      <circle cx="115" cy="55" r="16" fill="#eab308" />
      <path d="M115 71l-3 5h6z" fill="#eab308" />
    </svg>
  );

  // TMNT Cover SVG
  const TMNTIcon = () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="160" height="160" rx="28" fill="#1b2a4a" />
      
      {/* Brick outline overlay */}
      <path d="M0 40h160M0 80h160M0 120h160" stroke="#1e1b4b" strokeWidth="2" opacity="0.3" />
      
      {/* Ninja Turtle Head */}
      <circle cx="80" cy="80" r="35" fill="#16a34a" />
      <path d="M45 75h70v12H45z" fill="#a855f7" /> {/* Donatello Purple Mask */}
      <circle cx="68" cy="81" r="5" fill="#ffffff" />
      <circle cx="68" cy="81" r="2" fill="#000000" />
      <circle cx="92" cy="81" r="5" fill="#ffffff" />
      <circle cx="92" cy="81" r="2" fill="#000000" />
      
      {/* Sewer grate ring */}
      <circle cx="80" cy="80" r="55" stroke="#4b5563" strokeWidth="4" fill="none" opacity="0.5" />
    </svg>
  );

  return (
    <div className="games-container-wrapper">
      {/* --- DESKTOP GAMES VIEW (Original) --- */}
      <div className="desktop-games-layout">
        <div className="games-page">
          {/* Hero Section */}
          <section className="games-hero">
            <div className="games-hero__bg-wrapper">
              <img 
                src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/Gemini_Generated_Image_phagbaphagbaphag.png" 
                alt="Ang Huling El Bimbo: The Game" 
                className="games-hero__bg"
              />
              <div className="games-hero__overlay"></div>
            </div>

            <div className="games-hero__content">
              <div className="games-hero__card">
                <div className="games-hero__card-top">
                  <img src="/images/huling-el-bimbo-logo.webp" alt="Game Icon" className="games-hero__icon" />
                  <div className="games-hero__info">
                    <h1 className="games-hero__title">Ang Huling El Bimbo: The Game</h1>
                    <p className="games-hero__meta">Mobile Game • Musical • Adventure</p>
                  </div>
                </div>
                
                <p className="games-hero__membership">Included with your membership</p>
                <p className="games-hero__description">
                  Experience the iconic musical like never before. 
                  Navigate through the stories of friendship, love, and loss in this interactive adventure.
                </p>

                <div className="games-hero__actions">
                  <button className="games-hero__btn games-hero__btn--primary">
                    Coming Soon
                  </button>
                  <button className="games-hero__btn games-hero__btn--secondary">
                    <Info size={20} />
                    More Info
                  </button>
                </div>
              </div>
            </div>

            <div className="games-hero__rating">
              <span className="games-hero__rating-box">13+</span>
            </div>
          </section>

          {/* Rows Section */}
          <section className="games-rows">
            <div className="games-row">
              <h2 className="games-row__title">Popular Mobile Games for You</h2>
              <div className="games-row__container">
                <div className="games-row__coming-soon">
                  Coming Soon...
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* --- MOBILE GAMES VIEW (Exact Replication) --- */}
      <div className="mobile-games-layout">
        
        {/* Sticky Header */}
        <header className="mobile-games-header">
          <button className="mobile-header-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#ffffff" />
          </button>
          <span className="mobile-header-title">Jogos</span>
        </header>

        {/* Hero Visual Area */}
        <div className="mobile-games-hero-section">
          <div className="mobile-hero-artwork-container">
            <img 
              src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/Gemini_Generated_Image_phagbaphagbaphag.png" 
              alt="Ang Huling El Bimbo: The Game" 
              className="mobile-games-hero-banner" 
            />
            <div className="mobile-hero-artwork-overlay"></div>
          </div>
          
          {/* Game Card Icon */}
          <div className="mobile-hero-icon-container">
            <img 
              src="/images/huling-el-bimbo-logo.webp" 
              alt="Ang Huling El Bimbo: The Game" 
              className="mobile-game-card-icon" 
            />
          </div>
        </div>

        {/* Hero Title & Sub-tags */}
        <div className="mobile-games-details">
          <h1 className="mobile-game-title">Ang Huling El Bimbo: The Game</h1>
          <p className="mobile-game-subtags">
            Mobile Game &bull; Musical &bull; Adventure
          </p>
        </div>

        {/* Arcade Games Section */}
        <section className="mobile-arcade-section">
          <h2 className="mobile-section-heading">Jogos de arcade</h2>
          
          <div className="mobile-horizontal-scroll">
            <div className="mobile-scroll-container">
              
              {/* Game 1: Street Fighter */}
              <div className="mobile-arcade-game-card">
                <div className="mobile-arcade-card-media">
                  <StreetFighterIcon />
                </div>
                <h3 className="mobile-arcade-game-title">Street Fighter IV CE</h3>
                <p className="mobile-arcade-game-sub">Luta</p>
              </div>

              {/* Game 2: Sonic */}
              <div className="mobile-arcade-game-card">
                <div className="mobile-arcade-card-media">
                  <SonicIcon />
                </div>
                <h3 className="mobile-arcade-game-title">Sonic Mania Plus</h3>
                <p className="mobile-arcade-game-sub">Plataforma</p>
              </div>

              {/* Game 3: Bloons TD 6 */}
              <div className="mobile-arcade-game-card">
                <div className="mobile-arcade-card-media">
                  <BloonsIcon />
                  <div className="mobile-top-10-badge">
                    <span className="badge-top-text">TOP</span>
                    <span className="badge-num-text">10</span>
                  </div>
                </div>
                <h3 className="mobile-arcade-game-title">Bloons TD 6</h3>
                <p className="mobile-arcade-game-sub">Defesa da torre</p>
              </div>

              {/* Game 4: TMNT */}
              <div className="mobile-arcade-game-card">
                <div className="mobile-arcade-card-media">
                  <TMNTIcon />
                </div>
                <h3 className="mobile-arcade-game-title">TMNT: Shredder's Revenge</h3>
                <p className="mobile-arcade-game-sub">Beat 'em up</p>
              </div>

            </div>
          </div>
        </section>

        {/* Sticky Bottom Tab Bar (Netflix Style) */}
        <nav className="mobile-games-bottom-navbar">
          <button className="mobile-nav-tab-item active" onClick={() => navigate('/browse')}>
            <Home size={22} />
            <span>Início</span>
          </button>
          <button className="mobile-nav-tab-item" onClick={() => navigate('/browse')}>
            <PlaySquare size={22} />
            <span>Clipes</span>
          </button>
          <button className="mobile-nav-tab-item" onClick={() => navigate('/browse')}>
            <Search size={22} />
            <span>Buscar</span>
          </button>
          <button className="mobile-nav-tab-item" onClick={() => navigate('/account')}>
            <div className="mobile-nav-avatar-circle">
              <img 
                src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/avatar-1.png" 
                alt="My Netflix" 
              />
            </div>
            <span>Minha Netflix</span>
          </button>
        </nav>

      </div>
    </div>
  );
};

export default Games;
