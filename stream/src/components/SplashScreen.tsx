import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState(() => {
    return window.innerWidth <= 768 ? '/videos/splash_m.mp4' : '/videos/splash_d.mp4';
  });

  useEffect(() => {
    // Choose video based on screen width
    const updateVideoSrc = () => {
      const newSrc = window.innerWidth <= 768 ? '/videos/splash_m.mp4' : '/videos/splash_d.mp4';
      if (newSrc !== videoSrc) {
        setVideoSrc(newSrc);
      }
    };

    updateVideoSrc();
    window.addEventListener('resize', updateVideoSrc);

    // Safety timeout in case video fails to load or play
    const safetyTimeout = setTimeout(() => {
      handleComplete();
    }, 5000); // Max 5 seconds

    return () => {
      window.removeEventListener('resize', updateVideoSrc);
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
      {videoSrc && (
        <video
          key={videoSrc}
          ref={videoRef}
          className="splash-video"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          onError={handleComplete}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default SplashScreen;
