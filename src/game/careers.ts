import type { StatKey } from './types'

/**
 * อาชีพทั้งหมด: เงินเดือนเริ่มต้น (บาท/เดือน), ขึ้นเงินเดือนต่อปี, ค่าสถานะที่ใช้วัดความสำเร็จ, บำนาญหลังเกษียณ
 */
export interface Career {
  id: string
  icon: string
  name: string
  monthly: number
  growth: number
  stat: StatKey
  pension?: number
  /** เพดานเงินเดือนเทียบเงินเริ่มต้น */
  cap?: number
}

export const CAREER_LIST: Career[] = [
  { id: 'doctor', icon: '🩺', name: 'แพทย์', monthly: 50_000, growth: 0.06, stat: 'smart', pension: 28_000 },
  { id: 'nurse', icon: '👩‍⚕️', name: 'พยาบาล', monthly: 25_000, growth: 0.05, stat: 'smart', pension: 15_000 },
  { id: 'vet', icon: '🐾', name: 'สัตวแพทย์', monthly: 35_000, growth: 0.05, stat: 'smart' },
  { id: 'dev', icon: '💻', name: 'โปรแกรมเมอร์', monthly: 40_000, growth: 0.07, stat: 'smart' },
  { id: 'engineer', icon: '🏗️', name: 'วิศวกร', monthly: 38_000, growth: 0.05, stat: 'smart' },
  { id: 'pilot', icon: '✈️', name: 'นักบิน', monthly: 80_000, growth: 0.04, stat: 'smart', cap: 2.5 },
  { id: 'lawyer', icon: '⚖️', name: 'ทนายความ', monthly: 45_000, growth: 0.06, stat: 'smart' },
  { id: 'civil', icon: '🏛️', name: 'ข้าราชการ', monthly: 18_000, growth: 0.04, stat: 'smart', pension: 22_000 },
  { id: 'teacher', icon: '📚', name: 'ครู', monthly: 18_000, growth: 0.045, stat: 'social', pension: 20_000 },
  { id: 'police', icon: '👮', name: 'ตำรวจ', monthly: 22_000, growth: 0.04, stat: 'body', pension: 20_000 },
  { id: 'artist', icon: '🎨', name: 'นักวาด / ดีไซเนอร์', monthly: 22_000, growth: 0.05, stat: 'art' },
  { id: 'musician', icon: '🎤', name: 'นักดนตรี', monthly: 15_000, growth: 0.06, stat: 'art' },
  { id: 'actor', icon: '🎬', name: 'นักแสดง', monthly: 40_000, growth: 0.05, stat: 'art' },
  { id: 'athlete', icon: '🏅', name: 'นักกีฬาอาชีพ', monthly: 35_000, growth: 0.03, stat: 'body' },
  { id: 'creator', icon: '📱', name: 'คอนเทนต์ครีเอเตอร์', monthly: 30_000, growth: 0.06, stat: 'social' },
  { id: 'streamer', icon: '🎮', name: 'สตรีมเมอร์เกม', monthly: 20_000, growth: 0.08, stat: 'social', cap: 4 },
  { id: 'seller', icon: '📦', name: 'แม่ค้า/พ่อค้าออนไลน์', monthly: 25_000, growth: 0.06, stat: 'social' },
  { id: 'chef', icon: '🍜', name: 'เจ้าของร้านอาหาร', monthly: 28_000, growth: 0.05, stat: 'money' },
  { id: 'trader', icon: '📈', name: 'เทรดเดอร์', monthly: 35_000, growth: 0.07, stat: 'money' },
  { id: 'office', icon: '🏢', name: 'พนักงานบริษัท', monthly: 25_000, growth: 0.04, stat: 'money' },
  { id: 'rider', icon: '🛵', name: 'ไรเดอร์ส่งอาหาร', monthly: 18_000, growth: 0.01, stat: 'body', cap: 1.3 },
  { id: 'farmer', icon: '🌾', name: 'เกษตรกร', monthly: 14_000, growth: 0.03, stat: 'body' },
  { id: 'monk', icon: '🙏', name: 'นักบวช', monthly: 3_000, growth: 0, stat: 'happy' },
  { id: 'laity', icon: '🏠', name: 'ฆราวาส (อดีตนักบวช)', monthly: 15_000, growth: 0.02, stat: 'happy' },
]
export const careerById = (id: string | null | undefined) => CAREER_LIST.find((c) => c.id === id)
export const CAREERS: Record<string, string> = Object.fromEntries(CAREER_LIST.map((c) => [c.id, c.name]))
export const CAREER_STAT: Record<string, StatKey> = Object.fromEntries(CAREER_LIST.map((c) => [c.id, c.stat]))
/** อาชีพอิสระ — ไม่มีเจ้านาย ไม่มีออฟฟิศ (ไม่เจอฉากหัวหน้า/HR/เลื่อนขั้น/โดนเลิกจ้าง) */
export const SELF_EMPLOYED = ['farmer', 'monk', 'rider', 'streamer', 'seller']
