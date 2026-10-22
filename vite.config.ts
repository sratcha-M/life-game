import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'
import pkg from './package.json' with { type: 'json' }

// SINGLE=1 npm run build → ไฟล์ HTML ไฟล์เดียว (ไว้แชร์ให้ลองเล่น)
const single = !!process.env.SINGLE
export default defineConfig({
  plugins: [react({ jsxImportSource: '@emo' }), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  base: process.env.BASE_PATH || '/',
  // เวอร์ชันเกม: แก้ที่ package.json ที่เดียว → โชว์หน้าแรก + แนบไปกับสถิติการเล่น
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    // Tailwind v4 เขียน breakpoint เป็น @media (width>=40rem) ซึ่ง Safari < 16.4 / Chrome < 104 อ่านไม่ออก
    // → แปลง CSS ให้มือถือรุ่นเก่า/เบราว์เซอร์ในแอป (LINE, Facebook) ใช้ responsive ได้
    cssTarget: ['chrome87', 'safari14', 'firefox78', 'edge88'],
    // อีโมจิ 3D ~300 ไฟล์เล็ก ๆ: ไม่ฝัง base64 ใน JS (เคยทำให้ JS โตขึ้น ~1.1MB) → แยกไฟล์ โหลดเมื่อใช้ + แคชได้
    ...(single ? {} : {
      assetsInlineLimit: (file: string) => (file.includes('/assets/emoji/') ? false : undefined),
      // แยก library ที่ไม่ค่อยเปลี่ยนออกจากโค้ดเกม → อัปเดตเกมแล้วผู้เล่นไม่ต้องโหลด React/Firebase ใหม่
      rolldownOptions: { output: { codeSplitting: { groups: [
        { name: 'firebase', test: /node_modules[/\\](@firebase|firebase)[/\\]/ },
        { name: 'react', test: /node_modules[/\\](react|react-dom|scheduler)[/\\]/ },
      ] } } },
    }),
  },
  resolve: { alias: { '@emo': fileURLToPath(new URL('./src/emo', import.meta.url)) } },
})
