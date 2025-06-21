import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Enable HMR for faster development
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Performance optimizations
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
          'icons-vendor': ['lucide-react'],

          // Feature chunks - only include actual imports
          'maps-chunk': ['./src/services/mapsService.ts'],
          'ai-chunk': ['./src/services/aiService.ts'],
          'api-chunk': ['./src/services/realPropertyService.ts'],
        },
      },
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production only
        drop_debugger: true,
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Preview server configuration
  preview: {
    port: 8080,
    host: "::",
  },
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
    ],
  },
}));
