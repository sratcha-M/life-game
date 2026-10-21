import type { Expr } from '../game/types'

/**
 * ภาพตัวละครตอนจบตามฉากจบ — ใส่ src (เช่น import รูปจาก ../assets/ending/legend.webp) เพื่อใช้รูปเฉพาะ
 * ถ้าไม่มี src จะใช้ตัวละครเดิม แต่เปลี่ยนสีหน้าตาม expr
 */
export interface EndingArt { src?: string; expr?: Expr; filter?: string }
export const ENDING_ART: Record<string, EndingArt> = {
  legend: { expr: 'happy' },
  family: { expr: 'happy' },
  friend: { expr: 'happy' },
  free: { expr: 'happy' },
  home: { expr: 'happy' },
  centenarian: { expr: 'happy' },
  ordinary: { expr: 'neutral' },
  lonelyrich: { expr: 'sad' },
  regret: { expr: 'sad' },
  accident: { expr: 'sad', filter: 'grayscale(1) opacity(.75)' },
  overwork: { expr: 'sad', filter: 'grayscale(1) opacity(.75)' },
  heart: { expr: 'sad', filter: 'grayscale(1) opacity(.75)' },
  jail: { expr: 'sad' },
  fugitive: { expr: 'surprised' },
  bankrupt: { expr: 'sad' },
  alien: { expr: 'surprised' },
  cat: { expr: 'happy' },
  ghost: { expr: 'surprised' },
  reborn: { expr: 'surprised' },
}
export const endingArtOf = (id: string, kind: 'good' | 'bad' | 'weird'): EndingArt =>
  ENDING_ART[id] ?? { expr: kind === 'bad' ? 'sad' : kind === 'weird' ? 'surprised' : 'happy' }
