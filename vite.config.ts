import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/makelottonumber/', // GitHub Pages를 위한 상대 경로 설정
  build: {
    outDir: 'dist'
  }
})
