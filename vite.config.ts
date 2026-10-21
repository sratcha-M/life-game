import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 npm run build → ไฟล์ HTML ไฟล์เดียว (ไว้แชร์ให้ลองเล่น)
export default defineConfig({
  plugins: [react({ jsxImportSource: '@emo' }), tailwindcss(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  base: process.env.BASE_PATH || '/',
  resolve: { alias: { '@emo': fileURLToPath(new URL('./src/emo', import.meta.url)) } },
})
