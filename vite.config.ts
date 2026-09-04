import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';
import fs from 'fs';

// Ensure local workspace temp dir is used to avoid EPERM on system temp
const localTemp = path.resolve(__dirname, '.temp');
fs.mkdirSync(localTemp, { recursive: true });
process.env.TEMP = localTemp;
process.env.TMP = localTemp;

// Plugin to prevent accidental imports of server-side client files into the frontend bundle
const preventServerSideImports = () => ({
  name: 'prevent-server-side-imports',
  enforce: 'pre' as const,
  resolveId(source: string, importer: string | undefined) {
    if (
      source.includes('elevenlabs/client') &&
      importer &&
      !importer.includes('server.ts') &&
      !importer.includes('jobs.js') &&
      !importer.includes('jobs.ts')
    ) {
      throw new Error(
        `Security Error: Cannot import server-side module (${source}) from client-side code (${importer}).`
      );
    }
    return null;
  },
});

export default defineConfig({
  define: {
    'process.env': {},
    'process.browser': true,
    global: 'globalThis',
  },
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 75 },
      jpg: { quality: 75 },
      webp: { quality: 75 },
      avif: { quality: 60 },
      svg: {
        multipass: true,
      },
    }),
    preventServerSideImports(),
    VitePWA({
      disable: process.env.DISABLE_PWA === 'true',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: '3WM SONIK - AI Music Production Platform',
        short_name: '3WM SONIK',
        description: 'Cinematic AI-native music production platform with The Three Wise Men',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:wav|mp3|ogg|flac)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:glb|gltf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: '3d-models',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 1, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      three: path.resolve(import.meta.dirname, './node_modules/three'),
    },
    dedupe: ['three'],
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching — specific before generic.
          // NOTE: lucide-react / @react-three / radix-ui all contain "react" so they
          // must be tested before the generic react catch-all.
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('tone')) {
              return 'tone-vendor';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            return 'vendor';
          }

          // Audio engine chunks
          if (id.includes('/src/audio/')) {
            if (id.includes('engine') || id.includes('transportBridge')) {
              return 'audio-core';
            }
            if (id.includes('offlineBounce')) {
              return 'audio-bounce';
            }
            return 'audio';
          }

          // Agent chunks — tools are dynamic imports, let them split
          if (id.includes('/src/agents/')) {
            if (
              id.includes('emarTools') ||
              id.includes('rickyTools') ||
              id.includes('kingpinTools')
            ) {
              return undefined;
            }
            return 'agents';
          }

          // Collaboration chunks
          if (id.includes('/src/collaboration/')) {
            return 'collaboration';
          }

          // Design system
          if (id.includes('/src/design-system/')) {
            return 'design-system';
          }

          // Components — let lazy-loaded views get their own natural chunks
          if (id.includes('/src/components/')) {
            // Heavy views are lazy-loaded and should NOT be grouped into a single chunk.
            // React.lazy + dynamic import() will create per-view chunks automatically.
            if (id.includes('/src/components/views/')) {
              return undefined; // Let Rollup handle per-view splitting
            }
            return 'components';
          }
        },
        // Optimize chunk size warnings
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Enable tree shaking
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Source maps for production
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
    // CSS code splitting
    cssCodeSplit: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // hmr: {
    //   clientPort: 443,
    //   protocol: 'wss',
    // },
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
