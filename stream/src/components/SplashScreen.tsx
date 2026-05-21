import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [bgReady, setBgReady] = useState(false); // true once video starts → black bg fades out
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSafari] = useState(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
  });

  // Detect mobile: narrow viewport OR touch UA
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent.toLowerCase());

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;
    if (isSafari) {
      // The WebP animation duration is 5.56 seconds. We trigger completion then.
      timer = setTimeout(() => {
        if (active) handleComplete();
      }, 5560);
    }

    // Safety timeout in case video fails to load or play
    const safetyTimeout = setTimeout(() => {
      if (active) handleComplete();
    }, 15000); // Safety: max 15s if video never ends/errors

    // Autoplay fix for mobile (iOS/Android):
    // Force muted on the actual DOM element and trigger play programmatically
    const playVideo = async () => {
      // Small delay to ensure the DOM element is fully ready
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!active) return;
      const video = videoRef.current;
      if (video) {
        video.defaultMuted = true;
        video.muted = true;
        try {
          await video.play();
        } catch (error: any) {
          if (!active) return;
          if (error?.name === 'AbortError') {
            // Ignore abort errors caused by React 18 StrictMode unmounting/remounting
            return;
          }
          console.warn("Autoplay prevented or video play failed:", error);
          // Don't bypass immediately; let the browser attempt the next <source> fallback.
          // handleComplete(); 
        }
      }
    };

    if (!isSafari || isMobile) {
      playVideo();
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      clearTimeout(safetyTimeout);
    };
  }, [isMobile, isSafari]);

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

  const handleVideoPlay = () => {
    setBgReady(true); // video is playing — fade out the black blocker
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Ignore errors from individual <source> elements (e.g. Chrome rejecting .mov)
    // Only complete if the actual <video> element failed completely
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'source') {
      return; 
    }
    const video = videoRef.current;
    if (video && video.networkState === 3) { // NETWORK_NO_SOURCE
      handleComplete();
    } else if (target.tagName.toLowerCase() === 'video') {
      handleComplete();
    }
  };

  return (
    <div className={`splash-screen ${!isVisible ? 'splash-screen--hidden' : ''}`}>
      {/* Black blocker — fades out once video starts playing, so alpha channel shows page */}
      <div className={`splash-bg ${bgReady ? 'splash-bg--hidden' : ''}`} />

      {isMobile ? (
        // Mobile Safari/Chrome: splash_m.mov with HEVC alpha channel
        <video
          ref={videoRef}
          className="splash-video"
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        >
          <source src="/videos/splash_m.mov" type="video/quicktime" />
          {/* WebM fallback for Android & Chrome DevTools simulating mobile */}
          <source src="/videos/splash_m.webm" type="video/webm" />
        </video>
      ) : isSafari ? (
        // Desktop Safari: animated WebP (no WebM alpha support on desktop Safari)
        <img
          src="/videos/splash.webp"
          alt="Loading..."
          className="splash-video"
          onLoad={handleVideoPlay}
        />
      ) : (
        // Desktop Chrome/Firefox/Edge + Android Chrome: WebM with alpha
        <video
          ref={videoRef}
          className="splash-video"
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        >
          <source src="/videos/splash.webm" type="video/webm" />
          <source src="/videos/splash_d.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default SplashScreen;
