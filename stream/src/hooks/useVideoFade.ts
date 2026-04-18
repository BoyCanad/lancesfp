import { useEffect, useRef } from 'react';

export function useVideoFade(videoRef: React.RefObject<HTMLVideoElement | null>, isMuted: boolean, isActive: boolean) {
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // fade in and play
          if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
          video.play().catch(() => {});
          
          const targetVolume = isMuted ? 0 : 1;
          if (targetVolume > 0) {
            // Only fade up if not muted
            fadeIntervalRef.current = window.setInterval(() => {
              if (video.volume < targetVolume - 0.05) {
                video.volume = Math.min(targetVolume, video.volume + 0.05);
              } else {
                video.volume = targetVolume;
                if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
              }
            }, 50);
          } else {
            video.volume = 0;
          }
        } else {
          // fade out and pause
          if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
          
          if (video.volume > 0 && !isMuted) {
            fadeIntervalRef.current = window.setInterval(() => {
              if (video.volume > 0.1) {
                video.volume = Math.max(0, video.volume - 0.1);
              } else {
                video.volume = 0;
                video.pause();
                if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
              }
            }, 50);
          } else {
            video.pause();
          }
        }
      });
    }, { threshold: 0.3 }); // Use 0.3 threshold so it triggers when mostly out

    observer.observe(video);

    return () => {
      observer.disconnect();
      if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
    };
  }, [videoRef, isMuted, isActive]);
}
