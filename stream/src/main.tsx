import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

// Self-healing: unregister any stale/broken service workers from old builds.
// Old SWs that pre-cached assets with now-dead hashed filenames cause
// "bad-precaching-response" errors that loop forever on refresh.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      const swUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      // If the registered SW is a stale workbox SW (not the current one), kill it.
      // The new one will be re-registered automatically by vite-plugin-pwa.
      const isStaleWorkbox = swUrl.includes('workbox-') && !swUrl.includes('sw.js');
      if (isStaleWorkbox) {
        reg.unregister();
      }
    });
  }).catch(() => { /* silently ignore */ });
}

// ============================================================================
// GLOBAL MOBILE VIDEO PROTECTION: Prevent "Download Video" popup everywhere
// (Clips, Trailer Player, Live Player, Video Player, Music Player, etc.)
// ============================================================================
if (typeof window !== 'undefined') {
  // 1. Intercept long-press / right-click menu globally in capture phase
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement | null;
    if (
      target instanceof HTMLVideoElement ||
      target instanceof HTMLImageElement ||
      target?.closest('video') ||
      target?.closest('.video-container') ||
      target?.closest('.video-element') ||
      target?.closest('.clip-player') ||
      target?.closest('.trailer-player')
    ) {
      e.preventDefault();
    }
  }, { capture: true });

  // 2. Automatically apply nodownload and disablePictureInPicture to any <video> in the DOM
  const secureVideoElement = (video: HTMLVideoElement) => {
    video.setAttribute('controlsList', 'nodownload noplaybackrate');
    video.setAttribute('disablePictureInPicture', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
  };

  const videoObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLVideoElement) {
          secureVideoElement(node);
        } else if (node instanceof HTMLElement) {
          node.querySelectorAll('video').forEach(secureVideoElement);
        }
      }
    }
  });

  videoObserver.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll('video').forEach(secureVideoElement);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
