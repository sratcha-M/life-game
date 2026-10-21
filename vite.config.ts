import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 npm run build → ไฟล์ HTML ไฟล์เดียว (ไว้แชร์ให้ลองเล่น)
export default defineConfig({
  plugins: [react({ jsxImportSource: '@emo' }), tailwindcss(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  base: process.env.BASE_PATH || '/',
  // Tailwind v4 เขียน breakpoint เป็น @media (width>=40rem) ซึ่ง Safari < 16.4 / Chrome < 104 อ่านไม่ออก
  // → แปลง CSS ให้มือถือรุ่นเก่า/เบราว์เซอร์ในแอป (LINE, Facebook) ใช้ responsive ได้
  build: { cssTarget: ['chrome87', 'safari14', 'firefox78', 'edge88'] },
  resolve: { alias: { '@emo': fileURLToPath(new URL('./src/emo', import.meta.url)) } },
})
