import type { GameState } from './types'

/**
 * 🕯️ ช่วงหยุดคิด: พอชีวิตในเกมผ่านอายุเหล่านี้ เกมจะหยุดถามคำถามสั้น ๆ ถึง "ตัวผู้เล่นจริง" (ไม่ใช่ตัวละคร)
 * ตอบสั้น ๆ หรือข้ามก็ได้ — คำตอบเก็บไว้ในเซฟของชีวิตนั้น โชว์ตอนจบ (ไม่ส่งขึ้นฟีด/สถิติ)
 * แต่ละคำถามถามแค่ครั้งเดียวตลอดทุกชีวิต (ตอบหรือข้ามก็นับว่าถามแล้ว) · ปิดทั้งหมดได้จากเมนู
 */
export const REFLECTIONS: { age: number; q: string; hint: string }[] = [
  { age: 5, q: 'ตอนเด็ก ๆ คุณเคยอยากเป็นอะไรตอนโต?', hint: 'เช่น นักบินอวกาศ ครู เจ้าของร้านขนม...' },
  { age: 15, q: 'ตอนอายุ 15 อะไรสำคัญกับคุณที่สุด?', hint: 'คน สิ่งของ ความฝัน หรืออะไรก็ได้' },
  { age: 30, q: 'ถ้าได้คุยกับตัวเองตอนเด็ก อยากบอกอะไร?', hint: 'ประโยคเดียวพอ' },
  { age: 50, q: 'มีใครที่คุณอยากขอบคุณ แต่ยังไม่เคยได้บอก?', hint: 'บางทีวันนี้อาจเป็นวันที่ดีที่จะบอก' },
  { age: 70, q: 'ถ้าชีวิตจริงของคุณเหลือแค่ปีเดียว จะใช้มันทำอะไร?', hint: 'ไม่มีคำตอบผิด' },
]

// ───────── จำไว้ข้ามชีวิต: ถามข้อไหนไปแล้ว / ปิดไว้ไหม ─────────
const KEY = 'lifepath.reflect.v1'
interface Pref { asked: number[]; off?: boolean }
const read = (): Pref => { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return { asked: Array.isArray(v.asked) ? v.asked : [], off: !!v.off } } catch { return { asked: [] } } }
const write = (p: Pref) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* โหมดส่วนตัว */ } }

export const reflectOn = () => !read().off
export const setReflectOn = (on: boolean) => write({ ...read(), off: !on })
/** ถามแล้ว (ตอบหรือข้าม) → ชีวิตต่อ ๆ ไปไม่ถามข้อนี้อีก */
export const markAsked = (age: number) => { const p = read(); if (!p.asked.includes(age)) write({ ...p, asked: [...p.asked, age] }) }
/** ล้างประวัติ ให้ถามใหม่ทุกข้อ (ตอนเปิดกลับจากเมนู) */
export const resetAsked = () => write({ ...read(), asked: [] })

/** อายุที่เพิ่งข้ามไป (from < age ≤ to) ที่ยังไม่เคยถาม (ทั้งในชีวิตนี้และชีวิตก่อน ๆ) */
export function reflectionAt(s: GameState, from: number, to: number) {
  const p = read()
  if (p.off) return undefined
  return REFLECTIONS.find((r) => from < r.age && r.age <= to && !p.asked.includes(r.age) && !s.reflections?.some((x) => x.age === r.age))
}
