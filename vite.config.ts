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
    // Enable source maps for debugging in development only
    sourcemap: mode === 'development',
    // Target modern browsers for better optimization
    target: 'esnext',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@tanstack') || id.includes('react-query')) {
              return 'query-vendor';
            }
            if (id.includes('@sentry')) {
              return 'monitoring-vendor';
            }
            return 'vendor';
          }

          // Feature chunks
          if (id.includes('/services/maps') || id.includes('/components/InteractiveMaps')) {
            return 'maps-chunk';
          }
          if (id.includes('/services/ai') || id.includes('/components/AIChatbot')) {
            return 'ai-chunk';
          }
          if (id.includes('/services/') && (id.includes('Property') || id.includes('Rent'))) {
            return 'api-chunk';
          }
        },
      },
    },
    // Optimize for production
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Optimize CSS
    cssCodeSplit: true,
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
      'react-router-dom',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@tanstack/react-query',
    ],
    exclude: [
      // Exclude large dependencies that should be loaded on demand
      '@sentry/react',
      'apify-client',
    ],
  },
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}));
