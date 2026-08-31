import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/,
// so the CI build sets VITE_BASE=/family-chore-chart/. Local dev/preview uses '/'.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Family Chore Chart',
        short_name: 'Chores',
        description: 'A fun, private, offline chore & reward chart for the whole family.',
        theme_color: '#f6a5c0',
        background_color: '#1b1424',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: base + 'index.html'
      }
    })
  ]
})
