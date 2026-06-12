
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Configuração do PWA e Service Worker
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'optimized/android-chrome-192x192.webp',
        'optimized/android-chrome-512x512.webp',
        'optimized/apple-touch-icon.webp',
        'optimized/favicon-16x16.webp',
        'optimized/favicon-32x32.webp',
        'optimized/favicon-64x64.webp',
        'optimized/favicon.webp',
        'optimized/cap-logo-fundo-optimized.webp'
      ],
      manifest: {
        name: 'CAP Cotações',
        short_name: 'CAP Cotações',
        description: 'Acompanhe as cotações de moedas em tempo real',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/optimized/android-chrome-192x192.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: '/optimized/android-chrome-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: '/optimized/apple-touch-icon.webp',
            sizes: '180x180',
            type: 'image/webp',
            purpose: 'any'
          }
        ]
      },
      // Workbox desativado - usando SW personalizado integrado
      // O service worker em client/public/sw.js já gerencia cache e notificações
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      selfDestroying: false,
    }),
    // Visualizar o bundle (opcional, apenas para análise)
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      filename: 'bundle-analyzer-report.html',
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Configuração de base URL para CDN
  base: process.env.CDN_URL || '/',
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Aumentar o limite de aviso para 1000KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Agrupar dependências grandes em chunks separados
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'react-chartjs-2'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          utils: ['date-fns', 'axios', 'zod'],
        },
      },
    },
    // Ativar minificação e tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  },
  // Otimizações de pré-carregamento
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    esbuildOptions: {
      // Habilita o tree shaking
      treeShaking: true,
    },
  },
});
