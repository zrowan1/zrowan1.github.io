import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Backend origin for the dev proxy (so `npm run dev` talks to Fastify).
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // Custom service worker so we can handle Web Push in addition to precache.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Huishouden - Rowan & Jamie-Lee',
        short_name: 'Huishouden',
        description: 'Taakverdeling en kookplanning voor thuis',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FDF8F3',
        theme_color: '#8B7355',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        // App shell + assets are precached; API calls are handled at runtime.
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
