import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// A defineConfig a vitest/config-ból jön, nem a vite-ból: csak ez a
// változat ismeri a `test` blokkot, a vite sajátja típushibát adna rá.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Road Trip Game',
        short_name: 'RoadTrip',
        description: 'Team vs team games for long car journeys',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // A teljes játéktartalom a cache-be kerül, hogy alagútban,
        // térerő nélkül is elinduljon és játszható legyen az app.
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
      },
    }),
  ],
  test: {
    // A jsdom felállítása ~20 másodperc, a tesztek zöme viszont tiszta
    // logika és nem kér böngészőt. A komponens-tesztek egyenként kérnek
    // jsdom-ot egy "@vitest-environment jsdom" docblock-kal.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
