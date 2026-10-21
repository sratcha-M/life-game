import { createElement, type ReactNode } from 'react'
import MAP from './emojiMap.json'

// ไอคอนอีโมจิแบบ 3 มิติ (Fluent Emoji 3D · MIT) แทนอีโมจิของระบบทุกที่ในเกม
const FILES = import.meta.glob('../assets/emoji/*.webp', { eager: true, import: 'default' }) as Record<string, string>
const M = MAP as Record<string, string>
const RE = /(?:\p{RI}\p{RI}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{EMod})?(?:‍\p{Extended_Pictographic}(?:️|\p{EMod})?)*)/gu
const urlOf = (e: string) => { const k = M[e.replace(/️/g, '')]; return k ? FILES[`../assets/emoji/${k}.webp`] : undefined }

let n = 0
function split(s: string): ReactNode {
  if (!RE.test(s)) return s
  RE.lastIndex = 0
  const out: ReactNode[] = []
  let last = 0
  for (const m of s.matchAll(RE)) {
    const url = urlOf(m[0])
    if (!url) continue
    if (m.index! > last) out.push(s.slice(last, m.index))
    out.push(createElement('img', { key: `e${n++}`, src: url, alt: m[0], className: 'emo', draggable: false }))
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
