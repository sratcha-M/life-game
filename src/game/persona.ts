import type { Bonds, Choice, GameState, Stats } from './types'

/**
 * 🧬 บุคลิก — เกมแอบนับจากทุกการเลือก แล้วสรุปตอนจบพร้อมฉายา
 */
export type PersonaKey = 'kind' | 'greed' | 'brave' | 'smart' | 'selfish' | 'funny' | 'endure' | 'fragile'
export const PERSONA: Record<PersonaKey, { icon: string; name: string }> = {
  kind: { icon: '❤️', name: 'เมตตา' },
  greed: { icon: '💰', name: 'ทะเยอทะยาน' },
  brave: { icon: '🔥', name: 'กล้า' },
  smart: { icon: '🧠', name: 'ฉลาด' },
  selfish: { icon: '😈', name: 'เห็นแก่ตัว' },
  funny: { icon: '😂', name: 'กวน' },
  endure: { icon: '💪', name: 'อดทน' },
  fragile: { icon: '💔', name: 'เปราะบาง' },
}
const KW: Record<PersonaKey, RegExp> = {
  kind: /ช่วย|ให้ยืม|ยกให้|บริจาค|ขอโทษ|ให้อภัย|ดูแล|อุ้ม|ปลอบ|คืน|สอน|เลี้ยง|ไปหา|กอด/,
  greed: /ลงทุน|รวย|หุ้น|เงิน|โบนัส|ขาย|คริปโต|เทรด|ผู้บริหาร|รับตำแหน่ง|ป้ายแดง|คอนโด/,
  brave: /แฉ|เถียง|ลุย|ท้า|กล้า|สารภาพ|ขวาง|ฟ้อง|ไปเลย|สมัคร|ลาออก|ขึ้นยาน/,
  smart: /เรียน|อ่าน|ติว|แผน|คิด|วิเคราะห์|ประกัน|ออม/,
  selfish: /ไม่ให้|ปฏิเสธ|ไม่รับ|ไม่ว่าง|ทำเป็นไม่เห็น|โทษ|ขโมย|เก็บไว้|ไม่ไป|ไม่ตอบ|อ่านแล้ว/,
  funny: /แมว|เมา|ปาร์ตี้|หวย|เต้น|เกม|ติ๊กต็อก|โยน|เล่น|แซว|มั่ว/,
  endure: /อดทน|ทำงาน|ซ้อม|สู้|ทน|ล้มแล้วลุก|วิ่ง|ฝึก|ทำต่อ/,
  fragile: /ร้องไห้|กลัว|หนี|เศร้า|ไม่ไหว|ซ่อน|อาย/,
}

export function personaDelta(c: Choice, eff: Partial<Stats>, cashDelta: number, bond: Bonds, timedOut: boolean): Partial<Record<PersonaKey, number>> {
  const t = c.text
  const d: Partial<Record<PersonaKey, number>> = {}
  const add = (k: PersonaKey, v: number) => { d[k] = (d[k] ?? 0) + v }
  for (const k of Object.keys(KW) as PersonaKey[]) if (KW[k].test(t)) add(k, 1)
  const rel = (eff.friend ?? 0) + (eff.family ?? 0) + (eff.love ?? 0) + Object.values(bond).reduce((a, b) => a + (b ?? 0), 0)
  if (rel >= 2) add('kind', 1)
  if (rel <= -2) add('selfish', 1)
  if (cashDelta >= 100_000 || (eff.money ?? 0) >= 2) add('greed', 1)
  if (c.outcomes?.length) add('brave', 1)
  if ((eff.smart ?? 0) >= 2) add('smart', 1)
  if ((eff.body ?? 0) >= 2 || ((eff.happy ?? 0) < 0 && ((eff.money ?? 0) > 0 || (eff.smart ?? 0) > 0))) add('endure', 1)
  if ((eff.happy ?? 0) >= 2 && (eff.social ?? 0) >= 1) add('funny', 1)
  if (timedOut) add('fragile', 2)
  if ((eff.happy ?? 0) <= -2) add('fragile', 1)
  return d
}
export const addPersona = (s: GameState, d: Partial<Record<PersonaKey, number>>) => {
  const p = { ...(s.persona ?? {}) }
  for (const [k, v] of Object.entries(d)) p[k as PersonaKey] = (p[k as PersonaKey] ?? 0) + (v ?? 0)
  return p
}

/**
 * ค่ากลางของแต่ละด้านในชีวิตทั่วไป (จากชีวิตจำลอง) — ตัวเลือกในเกมมีแบบ "ใจดี" เยอะกว่าด้านอื่นตามธรรมชาติ
 * จึงเทียบกับค่าปกติก่อน เพื่อให้ "นิสัยเด่น" สะท้อนว่าคุณต่างจากคนทั่วไปตรงไหน
 */
export const PERSONA_BASE: Record<PersonaKey, number> = { kind: 21, greed: 7, brave: 7, smart: 6, selfish: 7, funny: 4, endure: 7, fragile: 3 }
/** แต้มนิสัยหลังเทียบค่าปกติ (สเกลเดียวกันทุกด้าน: ค่าปกติ = 7) */
export const personaScore = (s: GameState, k: PersonaKey) => ((s.persona?.[k] ?? 0) * 7) / PERSONA_BASE[k]

/** เปอร์เซ็นต์ต่อด้าน (0–99) */
export function personaPct(s: GameState) {
  return (Object.keys(PERSONA) as PersonaKey[])
    .map((k) => ({ k, ...PERSONA[k], pct: Math.min(99, Math.round(100 * (1 - Math.exp(-personaScore(s, k) / 8)))) }))
    .sort((a, b) => b.pct - a.pct)
}

const SOLO: Record<PersonaKey, string> = {
  kind: '🌱 คนที่ช่วยคนอื่นจนลืมตัวเอง',
  greed: '💰 นักธุรกิจผู้ไม่มีวันพอ',
  brave: '🔥 คนกล้าที่ไม่เคยถอย',
  smart: '🧠 นักคิดผู้วางแผนทุกก้าว',
  selfish: '😈 คนที่รักตัวเองที่สุดในโลก',
  funny: '😂 คนบ้าที่รอดมาได้ทุกสถานการณ์',
  endure: '💪 นักสู้ที่ไม่ยอมล้ม',
  fragile: '💔 หัวใจแก้วที่ยังเดินต่อ',
}
const COMBO: Record<string, string> = {
  'fragile+kind': '🕊️ คนใจดีที่เจ็บง่าย',
  'brave+greed': '🎲 นักเสี่ยงโชคตัวจริง',
  'greed+selfish': '🦈 ฉลามในคราบมนุษย์',
  'endure+kind': '🌳 ต้นไม้ใหญ่ของครอบครัว',
  'brave+funny': '🤪 สายลุยไม่สนโลก',
  'greed+smart': '♟️ นักวางหมากผู้ทะเยอทะยาน',
  'kind+smart': '📚 ครูของทุกคน',
  'endure+fragile': '🌧️ คนที่ยิ้มทั้งน้ำตา',
  'brave+kind': '🦸 ฮีโร่ที่ไม่มีใครรู้จัก',
  'funny+selfish': '🐈 แมวในร่างคน',
}
export function personaTitle(s: GameState) {
  const [a, b] = personaPct(s)
  if (!a || a.pct === 0) return '☁️ คนธรรมดาที่ไหลไปตามชีวิต'
  return (b && b.pct >= a.pct * 0.7 && COMBO[[a.k, b.k].sort().join('+')]) || SOLO[a.k]
}
