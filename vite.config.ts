import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Content hashes in filenames are the primary cache-busting mechanism.
        // Browsers cache JS/CSS assets long-term (safe because URL changes with content),
        // while index.html is never cached (via meta tags) so new hashes are always picked up.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // MUI - largest dependency, split into its own chunk
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Data fetching and state management
          'vendor-data': [
            '@tanstack/react-query',
            'axios',
            'zustand',
          ],
          // Form handling
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          // Utilities
          'vendor-utils': [
            'date-fns',
            'xlsx',
          ],
        },
      },
    },
  },
})
