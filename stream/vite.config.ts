import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // 1. ONLY precache the absolute essentials to guarantee install success
        globPatterns: ['**/*.{js,css,html,ico}'],
        
        // 2. Reduce file size limit to 3MB
        maximumFileSizeToCacheInBytes: 3000000,
        
        navigateFallback: 'index.html',
        // Exclude API-like paths from the SPA fallback
        navigateFallbackDenylist: [/^\/sw/, /^\/workbox/, /\.(?:m3u8|ts|aac|vtt|json|xml)$/i],
        
        // Temporarily remove importScripts to ensure your custom SW isn't crashing the install
        // importScripts: ['sw-hls.js'],
        
        runtimeCaching: [
          // HLS streams from GitHub Pages — ONLY match actual media file extensions.
          {
            urlPattern: /^https:\/\/boycanad\.github\.io\/.*\.(m3u8|ts|aac)(\?.*)?$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hls-offline-v1',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 5000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Supabase-hosted subtitle VTT files
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*\.vtt$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hls-offline-v1',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Google Fonts stylesheet
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Local images (public folder)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Supabase storage (images, GIFs, thumbnails, banners)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Supabase REST API (movie metadata, profiles)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Supabase Auth (allow offline graceful fail)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-auth-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] }
            }
          },
          // Raw GitHub (external images)
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'github-raw-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        short_name: "LSFPlus",
        name: "LSFPlus Streaming",
        icons: [
          {
            src: "favicon.png",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/png"
          },
          {
            src: "/images/huling-el-bimbo-logo.webp",
            type: "image/webp",
            sizes: "512x512",
            purpose: "any maskable"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#000000"
      },
      devOptions: {
        enabled: false, // Disabled to avoid the "Vite Dev Mode Trap"
        type: 'module',
      }
    })
  ],
  optimizeDeps: {
    include: ['lucide-react', 'framer-motion']
  }
})
