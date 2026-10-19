import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
          // Radix primitives behind shadcn/ui, plus the icon set
          'vendor-ui': ['radix-ui', 'lucide-react', 'sonner', 'cmdk'],
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
          // Utilities. `xlsx` is deliberately NOT listed here: it is ~357KB raw and
          // is only reachable from the lazy CreateDeodapBillPage. Naming it in a
          // manualChunks group would hoist it onto the eager critical path.
          'vendor-utils': [
            'date-fns',
          ],
        },
      },
    },
  },
})
