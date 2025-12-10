import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/head': path.resolve(__dirname, './src/shims/Head.tsx'),
      'next/router': path.resolve(__dirname, './src/shims/router.ts'),
      'next/link': path.resolve(__dirname, './src/shims/Link.tsx'),
      'next/image': path.resolve(__dirname, './src/shims/Image.tsx'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})

