import React from 'react';
import { Info } from 'lucide-react';
import './Games.css';

const Games: React.FC = () => {
  return (
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
  );
};

export default Games;
