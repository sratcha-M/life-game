import { createElement, type ReactNode } from 'react'
import MAP from './emojiMap.json'

// ไอคอนอีโมจิแบบ 3 มิติ (Fluent Emoji 3D · MIT) แทนอีโมจิของระบบทุกที่ในเกม
const FILES = import.meta.glob('../assets/emoji/*.webp', { eager: true, import: 'default' }) as Record<string, string>
const M = MAP as Record<string, string>
const RE = /(?:\p{RI}\p{RI}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{EMod})?(?:‍\p{Extended_Pictographic}(?:️|\p{EMod})?)*)/gu
// อีโมจิเป็นไฟล์แยก (ไม่ฝังใน JS ให้ไฟล์เกมเล็ก) → เปิดเกมแล้วโหลดทั้งหมดมาแปลงเป็น data: URL เก็บในหน่วยความจำ
// เหตุผล: Chrome ทิ้งรูปออกจาก memory cache เองทุก ~30 วินาที (ถึงจะถือ reference ไว้) → <img> ที่สร้างใหม่ตอนนั้นว่างแวบหนึ่ง = ไอคอนกะพริบ
// ส่วน data: URL เบราว์เซอร์วาดได้ทันทีเสมอ (แบบเดียวกับตอนที่เคยฝังใน JS) · ระหว่างรอโหลดใช้ไฟล์ปกติไปก่อน
const DATA = new Map<string, string>()
if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
  const toData = (b: Blob) => new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = no; r.readAsDataURL(b) })
  void Promise.all(Object.values(FILES).map((u) => fetch(u).then((r) => r.blob()).then(toData).then((d) => { DATA.set(u, d) }).catch(() => {})))
    .then(() => CACHE.clear()) // ข้อความที่แยกไว้ก่อนหน้ายังชี้ไฟล์เดิม → ล้างให้ render ถัดไปใช้ data: URL
}
const urlOf = (e: string) => { const k = M[e.replace(/️/g, '')]; const f = k ? FILES[`../assets/emoji/${k}.webp`] : undefined; return f && (DATA.get(f) ?? f) }

// key ต้องคงที่ทุกครั้งที่ render ข้อความเดิม (เคยใช้ตัวนับรวม → React สร้าง <img> ใหม่ทุก render → ไอคอนกะพริบ)
// + แคชผลไว้ ข้อความเดิมไม่ต้องแยกใหม่
const CACHE = new Map<string, ReactNode>()
function split(s: string): ReactNode {
  const hit = CACHE.get(s)
  if (hit !== undefined) return hit
  if (CACHE.size > 3000) CACHE.clear()
  const r = splitRaw(s)
  CACHE.set(s, r)
  return r
}
function splitRaw(s: string): ReactNode {
  if (!RE.test(s)) return s
  RE.lastIndex = 0
  const out: ReactNode[] = []
  let last = 0
  for (const m of s.matchAll(RE)) {
    const url = urlOf(m[0])
    if (!url) continue
    if (m.index! > last) out.push(s.slice(last, m.index))
    out.push(createElement('img', { key: `e${m.index}`, src: url, alt: m[0], className: 'emo', draggable: false }))
    last = m.index! + m[0].length
  }
  if (!out.length) return s
  if (last < s.length) out.push(s.slice(last))
  return out
}
/** แปลงข้อความที่มีอีโมจิเป็นรูปไอคอน (ใช้ใน JSX runtime) */
export function emojify(c: unknown): unknown {
  if (typeof c === 'string') return split(c)
  if (Array.isArray(c)) {
    let changed = false
    const r = c.map((x) => { const y = emojify(x); if (y !== x) changed = true; return y })
    return changed ? r : c
  }
  return c
}
