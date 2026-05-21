import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SpeedInsights } from "@vercel/speed-insights/react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
