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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
