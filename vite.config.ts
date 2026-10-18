import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages needs the repo name as base, e.g. /weekboard/
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
})
