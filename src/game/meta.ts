import { netWorth } from './finance'
import { unlockedAchs } from './goals'
import { bondOf } from './bonds'
import { PERSONA, personaPct, type PersonaKey } from './persona'
import type { Ancestor, Bonds, Ending, GameState, Gender, Stats } from './types'

const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const store = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

// ───────── อัลบั้มชีวิต ─────────
export interface LifeRecord {
  id: number
  at: string
  name: string
  gender: Gender
  age: number
  endingId: string
  emoji: string
  title: string
  kind: 'good' | 'bad' | 'weird'
  career: string | null
  net: number
  dream?: string
  dreamOk: boolean
  trait?: string
  life?: 1 | 2
  gen: number
  lineageId: string
  bonds: Bonds
  married: boolean
  kid: boolean
  history: { age: number; text: string }[]
  key?: string
}
const LIVES_KEY = 'lifepath.lives.v1'
export const lifeRecords = (): LifeRecord[] => load<LifeRecord[]>(LIVES_KEY, [])
export function recordLife(s: GameState, e: Ending, age: number, dreamOk: boolean, married: boolean): LifeRecord[] {
  const rec: LifeRecord = {
    id: Date.now(), at: new Date().toISOString(), name: s.name, gender: s.gender, age,
    endingId: e.id, emoji: e.emoji, title: e.title, kind: e.kind, career: s.career, net: netWorth(s),
    dream: s.dream, dreamOk, trait: s.trait, life: s.life, gen: s.gen ?? 1, lineageId: s.lineageId ?? String(s.seed),
    bonds: s.bonds ?? {}, married, kid: s.flags.includes('kid'), history: s.history.slice(-40), key: `${s.seed}-${s.gen ?? 1}-${s.life ?? 1}`,
  }
  if (lifeRecords().some((l) => l.key === rec.key)) return lifeRecords()
  const all = [rec, ...lifeRecords()].slice(0, 60)
  store(LIVES_KEY, all)
  return all
}

// ───────── ของปลดล็อก ─────────
export interface Unlock {
  id: string
  kind: 'trait' | 'dream' | 'perk'
  icon: string
  name: string
  desc: string
  how: string
  ok: (c: { achs: string[]; endings: string[]; lives: number }) => boolean
}
export const UNLOCKS: Unlock[] = [
  { id: 'perk_card4', kind: 'perk', icon: '🃏', name: 'ไพ่ใบที่ 4', desc: 'ตอนเกิดเลือกไพ่ดวงชะตาจาก 4 ใบ', how: 'เล่นจบ 2 ชีวิต', ok: (c) => c.lives >= 2 },
  { id: 'perk_redraw', kind: 'perk', icon: '🔄', name: 'สับไพ่ใหม่', desc: 'สับไพ่ดวงชะตาใหม่ได้ 1 ครั้ง', how: 'เล่นจบ 4 ชีวิต', ok: (c) => c.lives >= 4 },
  { id: 'perk_dream4', kind: 'perk', icon: '🌠', name: 'ความฝันเพิ่ม', desc: 'เลือกความฝันได้จาก 4 ทาง', how: 'ทำความฝันสำเร็จครั้งแรก', ok: (c) => c.achs.includes('dream') },
  { id: 'oldsoul', kind: 'trait', icon: '🪷', name: 'ไพ่: วิญญาณเก่า', desc: 'ทุกค่าสถานะ +1', how: 'ผ่านโหมดสองชาติ', ok: (c) => c.achs.includes('reborn') },
  { id: 'heir', kind: 'trait', icon: '👑', name: 'ไพ่: ทายาทตระกูลดัง', desc: 'เงินตั้งต้น ฿2M', how: 'ส่งต่อตระกูลถึงรุ่นที่ 3', ok: (c) => c.achs.includes('gen3') },
  { id: 'petpal', kind: 'trait', icon: '🐾', name: 'ไพ่: สัตว์รักเรา', desc: 'สนิทกับโกโก้ตั้งแต่ต้น', how: 'ได้ฉากจบ 🐈 หรือถ้วย 🐶', ok: (c) => c.endings.includes('cat') || c.achs.includes('bond_coco') },
  { id: 'stardust', kind: 'trait', icon: '👽', name: 'ไพ่: ฝุ่นดาว', desc: 'ความรู้ +2 ศิลปะ +2', how: 'ได้ฉากจบ 👽 หรือ 👶 เกิดใหม่', ok: (c) => c.endings.includes('alien') || c.endings.includes('reborn') },
  { id: 'iron', kind: 'trait', icon: '🛡️', name: 'ไพ่: ใจเหล็ก', desc: 'โหมดหาเงินง่ายขึ้น', how: 'รอดจากโหมดหาเงิน', ok: (c) => c.achs.includes('survivor') },
  { id: 'bigfam', kind: 'trait', icon: '🫂', name: 'ไพ่: คนบ้านนี้รักกัน', desc: 'สนิทน้องฝนตั้งแต่เกิด', how: 'ได้ถ้วย 👧 พี่ที่ดีที่สุด', ok: (c) => c.achs.includes('bond_nong') },
  { id: 'dynasty', kind: 'dream', icon: '🏯', name: 'ฝัน: สร้างตระกูล', desc: 'ความฝันใหม่', how: 'ส่งต่อรุ่นลูกครั้งแรก', ok: (c) => c.achs.includes('gen2') },
  { id: 'bonds', kind: 'dream', icon: '🫶', name: 'ฝัน: สายใยไม่ขาด', desc: 'ความฝันใหม่', how: 'ได้ถ้วยความสัมพันธ์ 2 อัน', ok: (c) => ['bond_nong', 'bond_jay', 'bond_coco'].filter((a) => c.achs.includes(a)).length >= 2 },
]
const ctx = () => ({ achs: unlockedAchs(), endings: load<string[]>('lifepath.endings.v1', []), lives: lifeRecords().length })
export const unlockedIds = () => { const c = ctx(); return UNLOCKS.filter((u) => u.ok(c)).map((u) => u.id) }
export const hasUnlock = (id: string) => unlockedIds().includes(id)
const SEEN_KEY = 'lifepath.unlocks.seen.v1'
/** ของที่เพิ่งปลดล็อก (ยังไม่เคยแสดง) — แล้วจำว่าแสดงแล้ว */
export function freshUnlocks(): Unlock[] {
  const seen = load<string[]>(SEEN_KEY, [])
  const now = unlockedIds()
  const fresh = now.filter((i) => !seen.includes(i))
  if (fresh.length) store(SEEN_KEY, [...seen, ...fresh])
  return UNLOCKS.filter((u) => fresh.includes(u.id))
}

// ───────── รุ่นต่อรุ่น ─────────
export interface Heirloom { id: string; icon: string; name: string; desc: string; stats?: Partial<Stats>; flags?: string[]; invest?: number }
const CAREER_HEIR: Record<string, Heirloom> = {
  doctor: { id: 'stetho', icon: '🩺', name: 'หูฟังแพทย์', desc: 'ความรู้ +2', stats: { smart: 2 } },
  dev: { id: 'laptop', icon: '💻', name: 'แล็ปท็อปเครื่องแรก', desc: 'ความรู้ +1 · ศิลปะ +1', stats: { smart: 1, art: 1 } },
  artist: { id: 'brush', icon: '🖌️', name: 'พู่กันด้ามเก่า', desc: 'ศิลปะ +2', stats: { art: 2 } },
  musician: { id: 'guitar', icon: '🎸', name: 'กีตาร์ตัวแรก', desc: 'ศิลปะ +1 · ความสุข +1', stats: { art: 1, happy: 1 } },
  athlete: { id: 'medal', icon: '🏅', name: 'เหรียญทอง', desc: 'ร่างกาย +2', stats: { body: 2 } },
  creator: { id: 'channel', icon: '📱', name: 'ช่องที่มีคนติดตาม', desc: 'เข้าสังคม +2', stats: { social: 2 } },
  chef: { id: 'recipe', icon: '📖', name: 'สูตรลับประจำร้าน', desc: 'เข้าสังคม +1 · ความสุข +1', stats: { social: 1, happy: 1 }, flags: ['family_recipe'] },
  teacher: { id: 'books', icon: '📚', name: 'ตู้หนังสือ', desc: 'ความรู้ +2', stats: { smart: 2 } },
  farmer: { id: 'land', icon: '🌾', name: 'ที่นาของตระกูล', desc: 'ที่ดินมูลค่า ฿800K', invest: 800_000, flags: ['countryside'] },
  office: { id: 'watch', icon: '⌚', name: 'นาฬิกาเกษียณ', desc: 'ความรู้ +1 · เข้าสังคม +1', stats: { smart: 1, social: 1 } },
}
const END_HEIR: Record<string, Heirloom> = {
  legend: { id: 'fame', icon: '👑', name: 'ชื่อเสียงของตระกูล', desc: 'เข้าสังคม +2 · ความรู้ +1', stats: { social: 2, smart: 1 } },
  centenarian: { id: 'genes', icon: '🧬', name: 'ยีนอายุยืน', desc: 'ร่างกาย +3', stats: { body: 3 } },
  jail: { id: 'shame', icon: '⛓️', name: 'คดีของพ่อแม่', desc: 'เข้าสังคม −2 · คนในซอยซุบซิบ', stats: { social: -2 }, flags: ['family_shame'] },
  fugitive: { id: 'shame', icon: '🏃', name: 'พ่อแม่ที่หายตัวไป', desc: 'ครอบครัว −2 · ความสุข −1', stats: { family: -2, happy: -1 } },
  bankrupt: { id: 'ious', icon: '📜', name: 'กองสัญญาหนี้', desc: 'หนี้ตกทอดถึงลูก', stats: { happy: -1 } },
  alien: { id: 'ufo', icon: '🛸', name: 'ชิ้นส่วนยานแม่', desc: 'ความรู้ +2 · เรื่องแปลกตามมา', stats: { smart: 2 }, flags: ['wild'] },
  cat: { id: 'cat', icon: '🐈', name: 'แมวของพ่อแม่', desc: 'ความสุข +2', stats: { happy: 2 } },
  family: { id: 'album', icon: '📷', name: 'อัลบั้มครอบครัว', desc: 'ครอบครัว +3', stats: { family: 3 } },
  home: { id: 'mango', icon: '🥭', name: 'ต้นมะม่วงบ้านยาย', desc: 'ครอบครัว +1 · ที่ดิน ฿500K', stats: { family: 1 }, invest: 500_000, flags: ['countryside'] },
}
export function heirloomOf(s: GameState, e: Ending): Heirloom {
  return END_HEIR[e.id] ?? (s.career ? CAREER_HEIR[s.career] : undefined)
    ?? { id: 'photo', icon: '🖼️', name: 'รูปถ่ายเก่าของพ่อแม่', desc: 'ความสุข +1 · ครอบครัว +1', stats: { happy: 1, family: 1 } }
}
/** มรดก: ครึ่งหนึ่งของทรัพย์สินหลังหักภาษี/งานศพ หรือหนี้ตกทอด 30% */
export function inheritanceOf(s: GameState) {
  const n = netWorth(s)
  return n >= 0 ? { cash: Math.round((n * 0.5) / 1000) * 1000, debt: 0 } : { cash: 0, debt: Math.round((-n * 0.3) / 1000) * 1000 }
}
export function ancestorOf(s: GameState, e: Ending, age: number, heir: Heirloom): Ancestor {
  const words = [...s.history].reverse().find((h) => h.text.startsWith('ฝากไว้ว่า'))?.text
  return {
    name: s.name, gender: s.gender, age, endingId: e.id, emoji: e.emoji, title: e.title, kind: e.kind, career: s.career,
    net: netWorth(s), heirloom: `${heir.icon} ${heir.name}`, words, history: s.history.slice(-40),
  }
}
export const canPassOn = (s: GameState) => s.flags.includes('kid') && !['alien', 'reborn', 'cat', 'ghost'].includes(s.endId ?? '')
export const bondSummary = (s: GameState) => ({ nong: bondOf(s, 'nong'), jay: bondOf(s, 'jay'), coco: bondOf(s, 'coco') })

// ───────── สิ่งที่ลูกได้จากชีวิตพ่อแม่ ─────────
export interface Gift { kind: 'habit' | 'skill' | 'contact'; icon: string; name: string; desc: string; stats?: Partial<Stats>; flags?: string[]; cash?: number }
const HABIT_STAT: Record<PersonaKey, Partial<Stats>> = {
  kind: { family: 1, friend: 1 }, greed: { money: 1 }, brave: { body: 1 }, smart: { smart: 1 },
  selfish: { happy: 1 }, funny: { social: 1 }, endure: { body: 1 }, fragile: { art: 1 },
}
const KID_GIFTS: { flag: string; gift: Gift }[] = [
  { flag: 'kid_art', gift: { kind: 'skill', icon: '🎨', name: 'มือที่วาดรูปเก่ง', desc: 'ศิลปะ +2 — เพราะคุณเคยเอารูปลูกใส่กรอบ', stats: { art: 2 } } },
  { flag: 'kid_smart', gift: { kind: 'skill', icon: '📘', name: 'นิสัยรักการเรียน', desc: 'ความรู้ +2 — เพราะคุณเปิดทางให้ลูกไปไกล', stats: { smart: 2 } } },
  { flag: 'kid_sport', gift: { kind: 'skill', icon: '⚽', name: 'ขาแข็งแรงจากลุงต้น', desc: 'ร่างกาย +2', stats: { body: 2 } } },
  { flag: 'kid_kind', gift: { kind: 'skill', icon: '🤝', name: 'ใจที่รู้ว่ามีคนรออยู่', desc: 'ครอบครัว +1 · ความสุข +1', stats: { family: 1, happy: 1 } } },
  { flag: 'family_recipe', gift: { kind: 'skill', icon: '🍳', name: 'สูตรอาหารประจำบ้าน', desc: 'ทำกับข้าวเป็นตั้งแต่เด็ก · เข้าสังคม +1', stats: { social: 1 }, flags: ['family_recipe'] } },
]
const CONTACTS: { flag: string; gift: Gift }[] = [
  { flag: 'aunt_nong', gift: { kind: 'contact', icon: '👩', name: 'ป้าฝน', desc: 'ป้าที่เคยพาไปเที่ยวสวนสัตว์ จะคอยช่วยตอนลำบาก', flags: ['h_aunt'] } },
  { flag: 'uncle_ton', gift: { kind: 'contact', icon: '🧔', name: 'ลุงต้น', desc: 'เพื่อนซี้ของพ่อแม่ สอนเตะบอลและจะคอยดูแล', flags: ['h_ton'] } },
  { flag: 'uncle_jay', gift: { kind: 'contact', icon: '💼', name: 'ลุงเจ', desc: 'มีเส้นสายในบริษัท ช่วยเรื่องงานแรก', flags: ['h_jay'] } },
  { flag: 'jay_family', gift: { kind: 'contact', icon: '👫', name: 'ครอบครัวลุงเจกับป้าฝน', desc: 'ญาติที่แน่นแฟ้น · ครอบครัว +1', stats: { family: 1 }, flags: ['h_aunt', 'h_jay'] } },
]
/** ลูกได้อะไรจากชีวิตพ่อแม่ (นิสัย · ทักษะ · คนรู้จัก) */
export function giftsOf(s: GameState): Gift[] {
  const out: Gift[] = []
  for (const p of personaPct(s).filter((x) => x.pct >= 35).slice(0, 2))
    out.push({ kind: 'habit', icon: p.icon, name: `นิสัย${PERSONA[p.k].name}`, desc: `ติดมาจากพ่อแม่ (${p.pct}%) · ${Object.entries(HABIT_STAT[p.k]).map(([k, v]) => `${STAT_TH[k]} +${v}`).join(' · ')}`, stats: HABIT_STAT[p.k], flags: [`h_${p.k}`] })
  for (const k of KID_GIFTS) if (s.flags.includes(k.flag)) out.push(k.gift)
  const seen = new Set<string>()
  for (const c of CONTACTS) if (s.flags.includes(c.flag) && !seen.has(c.gift.name)) { seen.add(c.gift.name); out.push(c.gift) }
  return out
}
const STAT_TH: Record<string, string> = { smart: 'ความรู้', body: 'ร่างกาย', art: 'ศิลปะ', social: 'เข้าสังคม', happy: 'ความสุข', money: 'เงิน', family: 'ครอบครัว', friend: 'เพื่อน', love: 'ความรัก' }
/** ถ่ายนิสัยพ่อแม่ให้ลูก 30% */
export const inheritedPersona = (s: GameState) => Object.fromEntries(Object.entries(s.persona ?? {}).map(([k, v]) => [k, Math.round((v ?? 0) * 0.3)]))
