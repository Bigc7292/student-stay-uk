/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 2,
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // Test exclusions
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'server',
      'brightdata-mcp'
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/test/**',
        '**/__tests__/**',
        '**/mock*',
        'public/',
        'server/',
        'brightdata-mcp/',
        'src/tests/',
        'src/**/*.test.*',
        'src/**/*.spec.*'
      ],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],

    // Output files
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_APP_VERSION: '1.0.0-test'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
