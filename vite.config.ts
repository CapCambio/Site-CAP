
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from 'rollup-plugin-visualizer';
import path from "path";

export default defineConfig({
  plugins: [
    react(),
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
  // Configuração de base URL para CDN ou /tv para TV Caxias
  base: process.env.CDN_URL || (process.env.TV_CAXIAS_MODE === 'true' ? '/tv/' : '/'),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
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
