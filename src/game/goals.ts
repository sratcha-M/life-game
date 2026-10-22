import { fmtBaht, married, netWorth } from './finance'
import type { Bonds, Ending, GameState, Stats } from './types'
import { bondOf } from './bonds'

const has = (s: GameState, f: string) => s.flags.includes(f)

// ───────── ไพ่ดวงชะตา (เลือกตอนเกิด) ─────────
export interface Trait {
  id: string
  icon: string
  name: string
  desc: string
  stats?: Partial<Stats>
  cash?: number
  flags?: string[]
  bonds?: Bonds
  /** ต้องปลดล็อกก่อน (id ใน UNLOCKS) */
  special?: boolean
}
export const TRAITS: Trait[] = [
  { id: 'genius', icon: '🧠', name: 'หัวไวตั้งแต่เกิด', desc: 'ความรู้ +3 · ความสุข +2', stats: { smart: 3, happy: 2 } },
  { id: 'athlete', icon: '💪', name: 'แข็งแรงเกินเด็ก', desc: 'ร่างกาย +3', stats: { body: 3 } },
  { id: 'artist', icon: '🎨', name: 'พรสวรรค์ศิลปะ', desc: 'ศิลปะ +3', stats: { art: 3 } },
  { id: 'charm', icon: '😎', name: 'เสน่ห์แรง', desc: 'เข้าสังคม +3 · ความรัก +1', stats: { social: 3, love: 1 } },
  { id: 'rich', icon: '💰', name: 'เกิดในบ้านรวย', desc: 'เงินตั้งต้น ฿500K · แต่พ่อแม่ไม่ค่อยว่าง', cash: 500_000, stats: { family: -2 } },
  { id: 'poor', icon: '🏚️', name: 'บ้านยากจน', desc: 'ไม่มีเงินเลย · แต่ครอบครัวรักกันมาก', cash: -2_000, stats: { family: 3, happy: 1 }, flags: ['poor'] },
  { id: 'lucky', icon: '🍀', name: 'ดวงดีเป็นพิเศษ', desc: 'ทางเสี่ยงมีโอกาสออกดีมากขึ้น', flags: ['lucky'] },
  { id: 'wild', icon: '😈', name: 'ซนสุดขีด', desc: 'สนุก +2 · แต่เจอเรื่องเสี่ยงบ่อย', stats: { happy: 2, social: 1, smart: -1 }, flags: ['wild'] },
  { id: 'frail', icon: '🤒', name: 'ร่างกายอ่อนแอ', desc: 'ร่างกาย −1 · ครอบครัวทุ่มเทดูแล +2', stats: { body: -1, family: 2 } },
  // ── ไพ่พิเศษ (ปลดล็อกจากการเล่น) ──
  { id: 'oldsoul', special: true, icon: '🪷', name: 'วิญญาณเก่า', desc: 'ทุกค่าสถานะ +1 · จำอะไรบางอย่างจากชาติก่อนได้', stats: { smart: 1, body: 1, art: 1, social: 1, happy: 1 } },
  { id: 'heir', special: true, icon: '👑', name: 'ทายาทตระกูลดัง', desc: 'เงินตั้งต้น ฿2M · แต่กดดันจากครอบครัว', cash: 2_000_000, stats: { family: -1, social: 1 } },
  { id: 'petpal', special: true, icon: '🐾', name: 'สัตว์รักเรา', desc: 'ความสุข +2 · สัตว์ทุกตัวชอบคุณ', stats: { happy: 2 }, bonds: { coco: 3 } },
  { id: 'stardust', special: true, icon: '👽', name: 'ฝุ่นดาว', desc: 'ความรู้ +2 · ศิลปะ +2 · เรื่องแปลกตามติด', stats: { smart: 2, art: 2 }, flags: ['wild'] },
  { id: 'iron', special: true, icon: '🛡️', name: 'ใจเหล็ก', desc: 'โหมดหาเงินเป้าต่ำลง 40% · ร่างกาย +1', stats: { body: 1 }, flags: ['iron'] },
  { id: 'bigfam', special: true, icon: '🫂', name: 'คนบ้านนี้รักกัน', desc: 'สนิทกับน้องฝนตั้งแต่เกิด · ครอบครัว +2', stats: { family: 2 }, bonds: { nong: 3, jay: 1 } },
]

// ───────── ความฝัน (เป้าหมายชีวิต) ─────────
export interface Dream {
  id: string
  icon: string
  name: string
  desc: string
  check: (s: GameState, end: Ending) => boolean
  progress: (s: GameState) => string
  special?: boolean
  /** ฉากประตูสู่ความฝันนี้ — เลือกฝันนี้แล้วจะได้เจอแน่นอน (ไม่ต้องลุ้นดวง) แต่ยังต้องเลือกทางให้ถูกเอง */
  needs?: string[]
  /** ฉากจบวันเกิด 70 ที่เป็นความฝันนี้ — ถ้าเงื่อนไขครบ ฉากจบนี้ชนะฉากจบอื่น */
  ending?: string
  /** แนวทางสั้น ๆ ว่าควรเลือกทางแบบไหน (โชว์ในเข็มทิศ) */
  tip: string
  /** เช็กลิสต์ของความฝันนี้ — ความฝันที่ผูกฉากจบ/ฉากจบแปลก ใช้เงื่อนไขฉากจบจาก engine แทน (คำนวณใน App) */
  steps?: (s: GameState) => { label: string; ok: boolean }[]
}
/** เป้าความสุขของความฝัน "ใช้ชีวิตให้สุด" (ค่ากลางของชีวิตทั่วไปตอนจบ ~24) */
const HAPPY_GOAL = 28
export const DREAMS: Dream[] = [
  { id: 'rich', tip: 'ลงทุนหุ้นเมื่อมีโอกาส · อาชีพรายได้สูงหรือทำธุรกิจ · อย่าก่อหนี้เกินตัว', steps: (s) => [{ label: `💰 ทรัพย์สินสุทธิ ฿10M (ตอนนี้ ${fmtBaht(netWorth(s))})`, ok: netWorth(s) >= 10_000_000 }], icon: '💎', name: 'เศรษฐีสิบล้าน', desc: 'มีทรัพย์สินสุทธิ ฿10 ล้านขึ้นไป',
    check: (s) => netWorth(s) >= 10_000_000, progress: (s) => `${Math.max(0, Math.round(netWorth(s) / 100_000) / 10)}M / 10M` },
  { id: 'legend', tip: 'เลือกอาชีพ แล้วทำให้ทักษะหลักของอาชีพนั้นเด่นที่สุดในชีวิต', icon: '🏆', name: 'สุดยอดในอาชีพ', desc: 'ไปให้ถึงตำนานแห่งวงการ',
    ending: 'legend', check: (_s, e) => e.id === 'legend', progress: (s) => (s.career ? 'กำลังไต่เต้า' : 'ยังไม่มีอาชีพ') },
  { id: 'family', tip: 'เปิดใจเรื่องความรัก แต่งงาน มีลูก และเลือกใช้เวลากับครอบครัว', steps: (s) => [{ label: '💍 มีคู่ชีวิตและไม่หย่า', ok: married(s) }, { label: '👶 มีลูก', ok: has(s, 'kid') }, { label: `🏠 ครอบครัว 7+ (ตอนนี้ ${s.stats.family})`, ok: s.stats.family >= 7 }], icon: '🏡', name: 'ครอบครัวอบอุ่น', desc: 'แต่งงาน มีลูก ไม่หย่า และครอบครัวรักกัน',
    check: (s) => married(s) && has(s, 'kid') && s.stats.family >= 7, progress: (s) => [married(s) ? '💍' : '○', has(s, 'kid') ? '👶' : '○', s.stats.family >= 7 ? '❤️' : '○'].join(' ') },
  { id: 'friend', tip: 'ดีกับต้นตั้งแต่อนุบาล · อย่าทิ้งหรือหักหลังเพื่อน', steps: (s) => [{ label: `🤝 มิตรภาพกับต้น 8+ (ตอนนี้ ${s.stats.friend})`, ok: s.stats.friend >= 8 }, { label: '🚫 ไม่เคยทิ้ง/หักหลังต้น', ok: !has(s, 'betrayed') && !has(s, 'ignored_ton') }], icon: '🤝', name: 'เพื่อนแท้ตลอดชีวิต', desc: 'มิตรภาพกับต้นแน่นแฟ้นจนแก่',
    check: (s) => s.stats.friend >= 8 && !has(s, 'betrayed') && !has(s, 'ignored_ton'), progress: (s) => (has(s, 'betrayed') ? '💔 พังแล้ว' : '❤️'.repeat(Math.min(5, Math.ceil(s.stats.friend / 2))) || '○'), needs: ['kinder', 'bully', 'tonreturn'] },
  { id: 'long', tip: 'ดูแลสุขภาพจริงจัง (ฉากตรวจสุขภาพอายุ 55) · ไม่บ้างาน · อย่าอยู่ตัวคนเดียว', icon: '🎂', name: 'อายุยืนร้อยปี', desc: 'ร่างกายแข็งแรงและมีความสุขจนถึง 100',
    ending: 'centenarian', check: (_s, e) => e.id === 'centenarian', progress: (s) => `💪${s.stats.body} 😊${s.stats.happy}`, needs: ['health'] },
  { id: 'happy', tip: 'เลือกทางที่ทำให้มีความสุข ทำตามฝัน และไม่ปล่อยให้เครียดสะสม', steps: (s) => [{ label: `😊 ความสุข ${HAPPY_GOAL}+ ตอนจบ (ตอนนี้ ${s.stats.happy})`, ok: s.stats.happy >= HAPPY_GOAL }], icon: '🌈', name: 'ใช้ชีวิตให้สุด', desc: `ความสุข ${HAPPY_GOAL} ขึ้นไปตอนจบ`,
    check: (s) => s.stats.happy >= HAPPY_GOAL, progress: (s) => `😊 ${s.stats.happy}/${HAPPY_GOAL}` },
  { id: 'weird', tip: 'เก็บหินอุกกาบาตตอนเด็ก แล้วตามเรื่องแปลก ๆ ที่เจอไปเรื่อย ๆ', icon: '👽', name: 'ชีวิตไม่ธรรมดา', desc: 'ได้ฉากจบแบบแปลก ๆ',
    check: (_s, e) => e.kind === 'weird', progress: () => '???', needs: ['meteor'] },
  { id: 'home', tip: 'ไปบ้านยายตอนปิดเทอม แล้วเลือกกลับบ้านเกิดตอนเกษียณ', icon: '🌾', name: 'กลับบ้านเกิด', desc: 'เกษียณไปใช้ชีวิตที่บ้านยาย',
    ending: 'home', check: (_s, e) => e.id === 'home', progress: (s) => (has(s, 'countryside') ? '🌾 เคยไปบ้านยาย' : '○'), needs: ['summer'] },
  // ── ความฝันพิเศษ (ปลดล็อก) ──
  { id: 'dynasty', tip: 'มีลูก สร้างทรัพย์สิน ฿5M และดูแลครอบครัว', steps: (s) => [{ label: '👶 มีลูก', ok: has(s, 'kid') }, { label: `💰 ทรัพย์สิน ฿5M (ตอนนี้ ${fmtBaht(netWorth(s))})`, ok: netWorth(s) >= 5_000_000 }, { label: `🏠 ครอบครัว 7+ (ตอนนี้ ${s.stats.family})`, ok: s.stats.family >= 7 }], special: true, icon: '🏯', name: 'สร้างตระกูล', desc: 'มีลูก ทรัพย์สิน ฿5M+ และครอบครัวรักกัน',
    check: (s) => has(s, 'kid') && netWorth(s) >= 5_000_000 && s.stats.family >= 7, progress: (s) => [has(s, 'kid') ? '👶' : '○', netWorth(s) >= 5_000_000 ? '💰' : '○', s.stats.family >= 7 ? '❤️' : '○'].join(' ') },
  { id: 'bonds', tip: 'ใช้เวลากับน้องฝน เจ และโกโก้ทุกครั้งที่มีโอกาส', steps: (s) => (['nong', 'jay', 'coco'] as const).map((b) => ({ label: `${{ nong: '👧 น้องฝน', jay: '🧑‍🎓 เจ', coco: '🐶 โกโก้' }[b]} 7+ (ตอนนี้ ${bondOf(s, b)})`, ok: bondOf(s, b) >= 7 })), special: true, icon: '🫶', name: 'สายใยไม่ขาด', desc: 'สนิทกับน้องฝน เจ และโกโก้ ทั้งสามคน (7+)',
    check: (s) => (['nong', 'jay', 'coco'] as const).every((b) => bondOf(s, b) >= 7), progress: (s) => `👧${bondOf(s, 'nong')} 🧑‍🎓${bondOf(s, 'jay')} 🐶${bondOf(s, 'coco')}`,
    needs: ['nong_born', 'nong_homework', 'jay_meet', 'jay_contest', 'coco_found', 'coco_walk', 'jay_help'] },
]
export const dreamOf = (s: GameState) => DREAMS.find((d) => d.id === s.dream)
/** ฉากนี้เป็นประตูสู่ความฝันที่เลือกไว้ไหม */
export const dreamNeeds = (s: GameState, sceneId: string) => !!dreamOf(s)?.needs?.includes(sceneId)

export function pickFew<T>(arr: T[], n: number) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// ───────── ถ้วยรางวัล ─────────
export interface Ach { id: string; icon: string; name: string; desc: string }
export const ACHS: Ach[] = [
  { id: 'first', icon: '🐣', name: 'ชีวิตแรก', desc: 'เล่นจบครั้งแรก' },
  { id: 'dream', icon: '⭐', name: 'ฝันเป็นจริง', desc: 'ทำความฝันสำเร็จ' },
  { id: 'dream3', icon: '🌟', name: 'นักล่าฝัน', desc: 'ทำความฝันสำเร็จ 3 แบบ' },
  { id: 'young', icon: '🕯️', name: 'จากไปไว', desc: 'เสียชีวิตก่อนอายุ 30' },
  { id: 'jail', icon: '⛓️', name: 'เข้าคุก', desc: 'จบชีวิตหลังลูกกรง' },
  { id: 'million', icon: '💎', name: 'เศรษฐี', desc: 'มีทรัพย์สินสุทธิ ฿10M' },
  { id: 'broke', icon: '📉', name: 'หมดตัว', desc: 'เข้าโหมดหาเงินครั้งแรก' },
  { id: 'survivor', icon: '💪', name: 'ดิ้นรนจนรอด', desc: 'หาเงินทันในโหมดหาเงิน' },
  { id: 'divorce', icon: '💔', name: 'รักร้าว', desc: 'หย่าร้าง' },
  { id: 'betrayed', icon: '🗡️', name: 'โดนหักหลัง', desc: 'เพื่อนหนีหนี้' },
  { id: 'alien', icon: '👽', name: 'นักเดินทางอวกาศ', desc: 'ขึ้นยานไปกับเอเลี่ยน' },
  { id: 'cat', icon: '🐈', name: 'เหมียว', desc: 'เลือกเป็นแมวตลอดไป' },
  { id: 'ace', icon: '🎮', name: 'มือโปรมินิเกม', desc: 'ได้คะแนน 80%+ ในมินิเกม' },
  { id: 'lucky', icon: '🎰', name: 'ดวงเฮง', desc: 'ถูกหวยหรือแจ็กพอต' },
  { id: 'love', icon: '💕', name: 'รักแรกคือรักสุดท้าย', desc: 'แต่งงานกับฟ้าและไม่หย่า' },
  { id: 'endings5', icon: '📖', name: 'หลายชีวิต', desc: 'ปลดล็อกฉากจบ 5 แบบ' },
  { id: 'reborn', icon: '♾️', name: 'สองชาติ', desc: 'ผ่านโหมดสองชาติ (จบต่างกัน)' },
  { id: 'reborn_master', icon: '🪷', name: 'บรรลุ', desc: 'โหมดสองชาติ: ทำความฝันสำเร็จทั้งสองชาติ' },
  { id: 'bond_nong', icon: '👧', name: 'พี่ที่ดีที่สุด', desc: 'สนิทกับน้องฝน 8+' },
  { id: 'bond_jay', icon: '🤜', name: 'คู่แข่งตลอดกาล', desc: 'สนิทกับเจ 8+' },
  { id: 'bond_coco', icon: '🐶', name: 'เพื่อนสี่ขา', desc: 'สนิทกับโกโก้ 8+' },
  { id: 'gen2', icon: '🧬', name: 'ส่งต่อรุ่นลูก', desc: 'เล่นต่อเป็นลูกของตัวเอง' },
  { id: 'gen3', icon: '🌳', name: 'สามรุ่น', desc: 'ตระกูลสืบทอดถึงรุ่นที่ 3' },
  { id: 'dynasty', icon: '🏯', name: 'ตระกูลมั่งคั่ง', desc: 'รุ่นที่ 2+ มีทรัพย์สิน ฿10M' },
  { id: 'lives10', icon: '📸', name: 'อัลบั้มเต็มเล่ม', desc: 'เล่นจบครบ 10 ชีวิต' },
  { id: 'secret1', icon: '🔓', name: 'ความลับแรก', desc: 'ค้นพบ SECRET EVENT ครั้งแรก' },
  { id: 'secret4', icon: '🗝️', name: 'นักล่าความลับ', desc: 'ค้นพบ SECRET EVENT 4 อัน' },
]
const ACH_KEY = 'lifepath.ach.v1'
const DREAM_KEY = 'lifepath.dreams.v1'
const load = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const store = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
export const unlockedAchs = () => load(ACH_KEY)
/** ปลดล็อก — คืนรายการที่เพิ่งได้ใหม่ */
export function unlockAch(...ids: string[]): Ach[] {
  const got = load(ACH_KEY)
  const fresh = ids.filter((i) => !got.includes(i))
  if (fresh.length) store(ACH_KEY, [...got, ...fresh])
  return ACHS.filter((a) => fresh.includes(a.id))
}
export function recordDream(id: string) {
  const d = [...new Set([...load(DREAM_KEY), id])]
  store(DREAM_KEY, d)
  return d.length
}

/** เช็กถ้วยรางวัลระหว่างเล่น */
export function checkAchs(prev: GameState, s: GameState): Ach[] {
  const ids: string[] = []
  const newFlag = (f: string) => s.flags.includes(f) && !prev.flags.includes(f)
  if (netWorth(s) >= 10_000_000) ids.push('million')
  if (newFlag('divorced')) ids.push('divorce')
  if (newFlag('betrayed')) ids.push('betrayed')
  if (bondOf(s, 'nong') >= 8) ids.push('bond_nong')
  if (bondOf(s, 'jay') >= 8) ids.push('bond_jay')
  if (bondOf(s, 'coco') >= 8) ids.push('bond_coco')
  if ((s.gen ?? 1) >= 2 && netWorth(s) >= 10_000_000) ids.push('dynasty')
  if (s.history.some((h) => /ถูกหวย|แจ็กพอต/.test(h.text))) ids.push('lucky')
  return ids.length ? unlockAch(...ids) : []
}

// ───────── โหมดสองชาติ ─────────
/** กรรมจากชาติก่อน: ทำดี +, ทำร้ายคนอื่น − */
export function karmaOf(s: GameState): { score: number; good: string[]; bad: string[] } {
  const good: string[] = [], bad: string[] = []
  const f = (flag: string, msg: string, list: string[]) => { if (s.flags.includes(flag)) list.push(msg) }
  f('saved_ton', 'ช่วยเพื่อนตอนโดนแกล้ง', good)
  f('helped_ton', 'ช่วยแม่ของต้น', good)
  f('support', 'เลี้ยงดูพ่อแม่', good)
  f('yai_goodbye', 'อยู่ข้างยายวันสุดท้าย', good)
  f('hero', 'แฉความโกงช่วยผู้เสียหาย', good)
  f('mentor', 'สอนเด็ก ๆ หลังเกษียณ', good)
  f('gave_up_fah', 'เสียสละเพื่อเพื่อน', good)
  f('ignored_ton', 'ทิ้งเพื่อนตอนลำบาก', bad)
  f('scammer', 'หลอกคนลงแชร์ลูกโซ่', bad)
  f('cheated', 'นอกใจคนรัก', bad)
  f('hush', 'รับเงินปิดปากเรื่องโกง', bad)
  f('missed_yai', 'ไม่ไปหายายวันสุดท้าย', bad)
  f('gave_inherit', 'ยกมรดกให้น้อง', good)
  f('forgave_jay', 'ให้อภัยคนที่หักหลัง', good)
  f('coco', 'รับหมาจรมาเลี้ยง', good)
  f('sibling_war', 'ฟ้องแย่งมรดกกับน้อง', bad)
  f('missed_coco', 'ไม่กลับไปลาโกโก้', bad)
  if (bondOf(s, 'nong') >= 8) good.push('ดูแลน้องอย่างดี')
  if (s.stats.family >= 8) good.push('ครอบครัวรักกันมาก')
  if (s.stats.family <= 1) bad.push('ตัดขาดครอบครัว')
  if (s.endId === 'jail' || s.endId === 'fugitive') bad.push('ใช้ชีวิตผิดกฎหมาย')
  return { score: good.length - bad.length, good, bad }
}
/** ไพ่ชาติที่สองตามกรรม */
export function rebornTrait(karma: number): string {
  if (karma >= 3) return pickFew(['genius', 'lucky', 'charm', 'rich'], 1)[0]
  if (karma >= 1) return pickFew(['athlete', 'artist', 'charm'], 1)[0]
  if (karma <= -2) return pickFew(['poor', 'frail'], 1)[0]
  return pickFew(['wild', 'artist', 'athlete'], 1)[0]
}
export const choiceKey = (sceneId: string, text: string) => `${sceneId}|${text}`
