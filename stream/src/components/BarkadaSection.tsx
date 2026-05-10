import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const characters = [
  {
    id: 'marco',
    name: 'Marco',
    description: 'A dreamer and a musician, Marco is the heart of the barkada, driven by passion and a deep loyalty to his friends. His journey takes him through the highs of college life and the sobering realities of adulthood.',
    thumbnail: '/images/icon/1.webp',
    image: '/images/characters/marco.webp',
    portrait: '/images/marco.webp'
  },
  {
    id: 'joy',
    name: 'Joy',
    description: 'Strong, resilient, and full of life, Joy brings light to the barkada. Despite the challenges she faces, her unwavering spirit and infectious laughter leave a lasting impact on everyone she meets.',
    thumbnail: '/images/icon/2.webp',
    image: '/images/characters/joy.webp',
    portrait: '/images/joy.webp'
  },
  {
    id: 'pok',
    name: 'Pok',
    description: 'The pragmatic and sensible one, Pok provides a grounding presence. As he navigates career ambitions and personal expectations, his bond with his friends remains a vital part of his identity.',
    thumbnail: '/images/icon/3.webp',
    image: '/images/characters/pok.webp',
    portrait: '/images/pok.webp'
  },
  {
    id: 'nena',
    name: 'Aling Nena',
    description: 'With a quiet wisdom and steadfast dedication, Aling Nena is the supportive pillar of the group. Her sense of justice and commitment to doing what is right guide her through turbulent times.',
    thumbnail: '/images/icon/4.webp',
    image: '/images/characters/nena.webp',
    portrait: '/images/icon/nena.webp'
  },
  {
    id: 'xian',
    name: 'Xian',
    description: 'Energetic and always ready for an adventure, Xian brings a youthful intensity to the group. His ambition and drive to succeed push the barkada to reach for their dreams, no matter how distant they seem.',
    thumbnail: '/images/icon/5.webp',
    image: '/images/characters/xian.webp',
    portrait: '/images/icon/xian.webp'
  },
  {
    id: 'edrian',
    name: 'Edrian',
    description: 'The creative visionary of the circle, Edrian’s imagination knows no bounds. His ability to see the world differently often provides the barkada with the fresh perspective they need to overcome any obstacle.',
    thumbnail: '/images/icon/6.webp',
    image: '/images/characters/edrian.webp',
    portrait: '/images/icon/edrian.webp'
  },
  {
    id: 'jazzy',
    name: 'Jazzy',
    description: 'Vibrant and full of charisma, Jazzy is the social glue that keeps the group together. Her wit and charm can brighten even the darkest days, making her an indispensable part of the barkada.',
    thumbnail: '/images/icon/7.webp',
    image: '/images/characters/jazzy.webp',
    portrait: '/images/icon/jazzy.webp'
  },
  {
    id: 'aisha',
    name: 'Aisha',
    description: 'Thoughtful and observant, Aisha is the groups quiet strength. Her empathy and deep understanding of her friends makes her the person they turn to when they need someone who truly listens.',
    thumbnail: '/images/icon/8.webp',
    image: '/images/characters/aisha.webp',
    portrait: '/images/icon/aisha.webp'
  }
];
;

export default function BarkadaSection() {
  const [started, setStarted] = useState(false);
  const [activeChar, setActiveChar] = useState(characters[0]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollArrows();
    window.addEventListener('resize', updateScrollArrows);
    return () => window.removeEventListener('resize', updateScrollArrows);
  }, []);

  const handleCharClick = (char: typeof characters[0]) => {
    if (char.id === activeChar.id) return;
    // Instantly set new active character, CSS handles the crossfade
    setActiveChar(char);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // Partial scroll for mobile
        const pageWidth = scrollRef.current.clientWidth;
        const scrollAmount = dir === 'left' ? -pageWidth * 0.8 : pageWidth * 0.8;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else {
        // Full jump for desktop
        const target = dir === 'left' ? 0 : scrollRef.current.scrollWidth;
        scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
      }

      // Slightly delay check to let smooth scroll finish/start
      setTimeout(updateScrollArrows, 500);
    }
  };

  return (
    <div className="barkada-section">
      {/* Dynamic Character Backgrounds - Map all to fix image load flashing */}
      {characters.map(char => (
        <div 
          key={`bg-${char.id}`}
          className={`barkada-bg barkada-bg--char ${started && activeChar.id === char.id ? 'barkada-bg--visible' : 'barkada-bg--hidden'}`}
          style={{ backgroundImage: `url(${char.image})` }}
        />
      ))}
      
      {/* Static Base Background */}
      <div 
        className="barkada-bg barkada-bg--static"
        style={{ backgroundImage: "url('/images/bg.webp')" }}
      />

      <div className="barkada-bg-gradient"></div>
      <div className="barkada-bg-gradient-bottom"></div>
      <div className={`barkada-bg-gradient-top ${started ? 'barkada-bg-gradient-top--visible' : ''}`}></div>

      {characters.map(char => char.portrait && (
        <img 
          key={`portrait-${char.id}`}
          src={char.portrait} 
          alt={char.name} 
          className={`barkada-char-portrait ${!started ? 'barkada-char-portrait--initial' : ''} ${started && activeChar.id === char.id ? 'barkada-char-portrait--visible' : 'barkada-char-portrait--hidden'}`} 
        />
      ))}

      <div className={`barkada-intro ${started ? 'barkada-intro--shrunk' : ''}`}>
        <h2 className="barkada-title">Meet The Barkada</h2>
        {!started && (
          <button className="barkada-continue-btn" onClick={() => setStarted(true)}>
            Continue
          </button>
        )}
      </div>

      <div className={`barkada-content ${started ? 'barkada-content--visible' : ''}`}>
         {/* Map all character info to crossfade text instantly too */}
         <div className="barkada-info-container">
            {characters.map(char => (
              <div 
                key={`info-${char.id}`}
                className={`barkada-info ${activeChar.id === char.id ? 'barkada-info--active' : 'barkada-info--hidden'}`}
              >
                <div className="barkada-info-text">
                   <h3 className="barkada-char-name">{char.name}</h3>
                   <p className="barkada-char-desc">{char.description}</p>
                </div>
              </div>
            ))}
         </div>

         <div className="barkada-thumbnails-container">
            {showLeftArrow && (
              <button className="barkada-scroll-btn barkada-scroll-btn--left" onClick={() => scroll('left')}>
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="barkada-thumbnails" ref={scrollRef} onScroll={updateScrollArrows}>
                {characters.map(char => (
                  <div 
                    key={char.id} 
                    className={`barkada-thumb ${activeChar.id === char.id ? 'barkada-thumb--active' : ''}`}
                    onClick={() => handleCharClick(char)}
                  >
                    <img 
                      src={char.thumbnail} 
                      alt={char.name} 
                      onError={(e) => { 
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${char.name}&backgroundColor=111111`; 
                      }} 
                    />
                  </div>
                ))}
            </div>
            {showRightArrow && (
              <button className="barkada-scroll-btn barkada-scroll-btn--right" onClick={() => scroll('right')}>
                <ChevronRight size={24} />
              </button>
            )}
         </div>
      </div>
    </div>
  );
}
