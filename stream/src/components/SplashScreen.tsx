import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Choose format based on browser (Safari doesn't support WebM alpha channel)
    const ua = navigator.userAgent.toLowerCase();
    const isSafariBrowser = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
    setIsSafari(isSafariBrowser);

    let timer: NodeJS.Timeout;
    if (isSafariBrowser) {
      // The WebP animation duration is 5.56 seconds. We trigger completion then.
      timer = setTimeout(() => {
        handleComplete();
      }, 5560);
    }

    // Safety timeout in case video fails to load or play
    const safetyTimeout = setTimeout(() => {
      handleComplete();
    }, 6000); // Max 6 seconds

    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleComplete = () => {
    setIsVisible(false);
    // Wait for fade animation before calling onComplete
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleVideoEnded = () => {
    handleComplete();
  };

  return (
    <div className={`splash-screen ${!isVisible ? 'splash-screen--hidden' : ''}`}>
      {isSafari ? (
        <img
          src="/videos/splash.webp"
          alt="Loading..."
          className="splash-video"
        />
      ) : (
        <video
          ref={videoRef}
          className="splash-video"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          onError={handleComplete}
        >
          <source src="/videos/splash.webm" type="video/webm" />
          <source src="/videos/splash_d.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default SplashScreen;
