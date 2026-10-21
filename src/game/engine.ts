import { SCENES as BASE } from './story'
import { EVENTS } from './events'
import { LIFE } from './life'
import { BECAUSE, DRAMA } from './drama'
import { BOND_SCENES } from './bonds'
import { CARDS } from './cards'
import { SECRET_SCENES } from './secrets'
import { THREADS } from './threads'
import { FLAG_SCENES } from './lifeflags'
import { FEAR_SCENES, KARMA_SCENES, ROAD_SCENES } from './karma'
import { JOB_SCENES } from './jobs'
import { CROSS, DAD_PASS, HEIR, JOBLESS, LATER, LOVE2, WEIRD2 } from './later'
import BASELINE from './statBaseline.json'
import { withTraitLines } from './personaHooks'
import { PARENT_AGE, parentGoneAt, pct, qx } from './realstats'
import { applyFin, netWorth } from './finance'
import { TRAITS } from './goals'
import { CAREER_STAT } from './careers'
export { fmtBaht, netWorth, passYears, married } from './finance'
import type { Bonds, BondId, Choice, Ending, GameState, Gender, Line, Lines, Scene, StatKey, Stats } from './types'

export const STAT_INFO: { key: StatKey; label: string; icon: string; color: string }[] = [
  { key: 'smart', label: 'ความรู้', icon: '📘', color: '#5b8def' },
  { key: 'body', label: 'ร่างกาย', icon: '💪', color: '#ef7d57' },
  { key: 'art', label: 'ศิลปะ', icon: '🎨', color: '#b06ee8' },
  { key: 'social', label: 'เข้าสังคม', icon: '🗣️', color: '#e8a33d' },
  { key: 'happy', label: 'ความสุข', icon: '😊', color: '#e86a9a' },
  { key: 'money', label: 'เงิน', icon: '💰', color: '#3fae78' },
]
export const HIDDEN_LABEL: Partial<Record<StatKey, string>> = {
  family: 'ครอบครัว', friend: 'มิตรภาพ', love: 'ความรัก',
}

// รวมฉากหลักกับเหตุการณ์พิเศษ เรียงตามอายุ
/**
 * ฉากที่ "ไม่จำเป็นต้องเกิดทุกชีวิต" → สุ่มเกิด เพื่อให้แต่ละรอบไม่ซ้ำเดิม
 * (ฉากหลัก เช่น เกิด สอบเข้า เลือกอาชีพ แต่งงาน เกษียณ วันเกิด 70 ยังเกิดเสมอ)
 */
const OPTIONAL: Record<string, number> = {
  kinder: 0.75, kindergame: 0.5, nong_born: 0.65, summer: 0.6, coco_found: 0.5, bully: 0.6, sportsday: 0.5,
  m1exam: 0.6, jay_meet: 0.55, exam: 0.5, yai_pass: 0.6, club: 0.6, crush: 0.7, skip: 0.5, parttime: 0.5,
  overtime: 0.55, parents: 0.6, house: 0.7, midlife: 0.55, tonreturn: 0.6, health: 0.65,
  nong_homework: 0.7, coco_walk: 0.6, jay_contest: 0.6, firstpay: 0.7, viral: 0.45, race: 0.5, scam: 0.5, crypto: 0.55,
}
/**
 * พ่อแม่จากไปเมื่อไหร่ = ทอยตามตารางชีพ UN (ไม่ใช่อายุตายตัว)
 * ฉากลาจากจึงมีหลายช่วงอายุ แต่จะเกิดแค่ช่วงที่ตรงกับปีที่พ่อ/แม่จากไปจริงในชีวิตนั้น
 */
const PASS_SLOTS = [32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68]
function passVariants(base: Scene, who: 'mom' | 'dad'): Scene[] {
  return PASS_SLOTS.map((age, i) => {
    const inWin = (s: GameState) => { const d = parentGoneAt(s, who); return d > (PASS_SLOTS[i - 1] ?? 29) && d <= age }
    return {
      ...base, id: `${base.id}_${age}`, age,
      when: (s: GameState) => inWin(s) && (!base.when || base.when(s)),
      force: inWin,
      because: (s: GameState) => {
        const pAge = PARENT_AGE[who] + parentGoneAt(s, who)
        const note = `📊 ${who === 'mom' ? 'แม่' : 'พ่อ'}อายุ ${pAge} ปี — ตามตารางชีพ UN ${who === 'mom' ? 'ผู้หญิง' : 'ผู้ชาย'}ไทยวัยนี้มีโอกาสจากไป ${pct(qx(pAge, who === 'mom' ? 'f' : 'm'))} ต่อปี`
        const b = base.because?.(s)
        return b ? `${b} · ${note}` : note
      },
      choices: (base.choices ?? []).map((c) => ({ ...c, flags: [...(c.flags ?? []), `${who}_gone`] })),
    }
  })
}
const MOM_PASS = DRAMA.find((sc) => sc.id === 'mom_pass')!
const PARENT_SCENES = [...passVariants(MOM_PASS, 'mom'), ...passVariants(DAD_PASS, 'dad')]

export const SCENES = [...KARMA_SCENES, ...BASE, ...EVENTS, ...LIFE, ...DRAMA.filter((sc) => sc.id !== 'mom_pass'), ...PARENT_SCENES, ...BOND_SCENES, ...CARDS, ...SECRET_SCENES, ...THREADS, ...FLAG_SCENES, ...FEAR_SCENES, ...ROAD_SCENES, ...JOB_SCENES, ...LATER, ...LOVE2, ...CROSS, ...WEIRD2, ...HEIR, ...JOBLESS]
  .map(withTraitLines)
  .map((sc) => (BECAUSE[sc.id] && !sc.because ? { ...sc, because: BECAUSE[sc.id] } : sc))
  .map((sc) => (OPTIONAL[sc.id] !== undefined ? { ...sc, chance: OPTIONAL[sc.id] * 0.8 } : sc))
  .sort((a, b) => a.age - b.age)

export { CAREERS } from './careers'

export function newGame(name: string, gender: Gender, hair: string, traitId?: string, dream?: string): GameState {
  const g: GameState = {
    name, gender, hair,
    stats: { smart: 1, body: 1, art: 1, social: 1, happy: 5, money: 1, family: 3, friend: 0, love: 0 },
    flags: [], career: null, history: [], sceneId: SCENES[0].id,
    seed: Math.floor(Math.random() * 1e9),
    cash: 2_000, invest: 0, debt: 0, dream, trait: traitId, bonds: {},
    avoid: lastScenes(),
  }
  g.sceneId = SCENES.find((sc) => sceneAvailable(sc, g))?.id ?? SCENES[0].id
  const t = TRAITS.find((x) => x.id === traitId)
  if (t) {
    for (const [k, v] of Object.entries(t.stats ?? {})) g.stats[k as StatKey] = Math.max(0, g.stats[k as StatKey] + (v ?? 0))
    g.cash = Math.max(0, g.cash + (t.cash ?? 0))
    g.flags = [...(t.flags ?? [])]
    g.bonds = { ...(t.bonds ?? {}) }
    g.history = [{ age: 0, text: `${t.icon} เกิดมาพร้อมไพ่ "${t.name}"` }]
  }
  return g
}

// สุ่มแบบมี seed เพื่อให้โหลดเซฟแล้วได้เหตุการณ์เดิม
function rand(seed: number, id: string) {
  let h = seed
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2654435761)
  return ((h >>> 0) % 10000) / 10000
}

export const getScene = (id: string) => SCENES.find((s) => s.id === id)!

/** ตกงาน/เป็นนายตัวเอง → ไม่มีเจ้านาย ไม่มีออฟฟิศ */
const noBoss = (s: GameState) => s.flags.includes('fired') || s.flags.includes('own_boss')
const bossScene = (sc: Scene) => (Array.isArray(sc.cast) && sc.cast.includes('boss')) || sc.bg === 'office' || sc.id.startsWith('f_hr')
/** ฉากที่มีพ่อ/แม่อยู่ → ไม่เกิดหลังพ่อ/แม่จากไปแล้ว */
const mentions = (sc: Scene, who: string) => {
  if (sc.id.startsWith('mom_pass') || sc.id.startsWith('dad_pass')) return false
  const cast = typeof sc.cast === 'function' ? sc.cast.toString() : JSON.stringify(sc.cast ?? [])
  const lines = typeof sc.lines === 'function' ? sc.lines.toString() : JSON.stringify(sc.lines ?? [])
  const res = JSON.stringify((sc.choices ?? []).map((c) => [c.result, c.outcomes]))
  return new RegExp(`['"]${who}['"]`).test(cast) || new RegExp(`who['"]?: ?['"]${who}['"]`).test(lines + res)
}
const PARENT_OF: Record<string, ('mom' | 'dad')[]> = Object.fromEntries(
  SCENES.map((sc) => [sc.id, (['mom', 'dad'] as const).filter((w) => sc.age >= 30 && mentions(sc, w))]).filter(([, w]) => (w as string[]).length),
)
export function sceneAvailable(sc: Scene, s: GameState) {
  if (sc.when && !sc.when(s)) return false
  for (const w of PARENT_OF[sc.id] ?? []) if (sc.age >= parentGoneAt(s, w)) return false
  if (noBoss(s) && bossScene(sc) && !sc.id.startsWith('heir_')) return false
  if (sc.force?.(s)) return true
  if (sc.chance !== undefined) {
    // ชีวิตก่อนเคยเจอแล้ว → โอกาสเกิดลดลง, ยังไม่เคยเจอ → โอกาสเพิ่มขึ้น
    const c = s.avoid?.includes(sc.id) ? sc.chance * 0.5 : s.avoid ? Math.min(0.95, sc.chance * 1.3) : sc.chance
    if (rand(s.seed, sc.id) > c) return false
  }
  return paced(sc, s)
}

// ───────── คุมจังหวะ: ไม่ให้เหตุการณ์รอง / โทรศัพท์ โผล่ติด ๆ กัน ─────────
let BY_ID: Map<string, Scene> | null = null
const byId = (id: string) => (BY_ID ??= new Map(SCENES.map((x) => [x.id, x]))).get(id)
/** ฉากรอง = ฉากสุ่ม / เส้นเรื่องย้อนกลับ / ความทรงจำ / เหตุการณ์น่ากลัว (ฉากหลัก กรรม และความลับไม่นับ) */
const isMinor = (sc: Scene) => !/^(k_|secret)/.test(sc.id) && (sc.chance !== undefined || /^(th_|fl_|memory_|f_)/.test(sc.id))
const isCall = (sc: Scene) => !!sc.call || sc.id.startsWith('memory_')
export const PACE = { callGap: 6, maxCalls: 1, maxMemories: 2, perAge: 1, window: 3, perWindow: 2, fearGap: 8 }
function paced(sc: Scene, s: GameState) {
  if (!isMinor(sc) && !isCall(sc)) return true
  const past = (s.visited ?? []).map(byId).filter((x): x is Scene => !!x && x.id !== sc.id)
  if (isCall(sc)) {
    const calls = past.filter(isCall)
    if (calls.length >= PACE.maxCalls) return false
    if (calls.some((x) => sc.age - x.age < PACE.callGap)) return false
    if (sc.id.startsWith('memory_') && past.filter((x) => x.id.startsWith('memory_')).length >= PACE.maxMemories) return false
  }
  if (sc.mark === 'fear' && past.some((x) => x.mark === 'fear' && sc.age - x.age < PACE.fearGap)) return false
  if (isMinor(sc)) {
    const minor = past.filter(isMinor)
    if (minor.filter((x) => x.age === sc.age).length >= PACE.perAge) return false
    if (minor.filter((x) => sc.age - x.age < PACE.window).length >= PACE.perWindow) return false
  }
  return true
}

/** ฉากถัดไป หรือ null ถ้าจบชีวิตแล้ว */
export function nextSceneId(s: GameState): string | null {
  const i = SCENES.findIndex((x) => x.id === s.sceneId)
  for (let j = i + 1; j < SCENES.length; j++) if (sceneAvailable(SCENES[j], s)) return SCENES[j].id
  return null
}

export function resolveLines(l: Lines | undefined, s: GameState): Line[] {
  if (!l) return []
  return typeof l === 'function' ? l(s) : l
}

/** ชื่อคู่ชีวิต: ฟ้า หรือคนรักใหม่ (ภพ/แพร) */
export const partnerName = (s: GameState) => (s.flags.includes('mate') ? (s.gender === 'girl' ? 'ภพ' : 'แพร') : 'ฟ้า')

export function fillText(t: string, s: GameState) {
  return t
    .replaceAll('{name}', s.name)
    .replaceAll('{fah}', partnerName(s))
    .replaceAll('{krub}', s.gender === 'boy' ? 'ครับ' : 'ค่ะ')
    .replaceAll('{chan}', s.gender === 'boy' ? 'ผม' : 'หนู')
}

/** เลือกทางเลือก → คืนสถานะใหม่ + ผลลัพธ์ที่ใช้จริง (กรณีสุ่ม) */
export function applyChoice(s: GameState, c: Choice, age: number, sceneId: string) {
  let eff = c.effects ?? {}
  let flags = c.flags ?? []
  let result = c.result
  let end = c.end
  let memory = c.memory
  let fin = c.fin
  let bond: Bonds = c.bond ?? {}
  if (c.outcomes?.length) {
    let r = rand(s.seed, sceneId + c.text) * (s.flags.includes('lucky') ? 0.55 : 1)
    const o = c.outcomes.find((x) => (r -= x.chance) < 0) ?? c.outcomes[c.outcomes.length - 1]
    eff = { ...eff, ...(o.effects ?? {}) }
    flags = [...flags, ...(o.flags ?? [])]
    result = o.result ?? result
    end = o.end ?? end
    memory = o.memory ?? memory
    fin = o.fin ? { ...fin, ...o.fin } : fin
    if (o.bond) bond = { ...bond, ...o.bond }
  }
  const stats = { ...s.stats } as Stats
  for (const [k, v] of Object.entries(eff)) if (k !== 'money') stats[k as StatKey] = Math.max(0, stats[k as StatKey] + (v ?? 0))
  const before = netWorth(s)
  const ns0: GameState = applyFin({ ...s, stats }, fin, eff.money ?? 0, age)
  const ns: GameState = {
    ...ns0,
    flags: [...new Set([...s.flags, ...flags])].filter((f) => !(c.unflags ?? []).includes(f) && !(c.career && f === 'fired')),
    flagAt: { ...(s.flagAt ?? {}), ...Object.fromEntries(flags.filter((f) => !s.flags.includes(f)).map((f) => [f, age])) },
    bonds: addBonds(s.bonds, bond),
    career: c.career ?? s.career,
    ...(c.career && c.career !== s.career ? { careerSince: age } : {}),
    history: memory ? [...s.history, { age, text: fillText(memory, s) }] : s.history,
    ...(end ? { endId: end, endAge: age } : {}),
  }
  const { money: _m, ...rest } = eff
  void _m
  return { state: ns, effects: rest, bondDelta: bond, cashDelta: netWorth(ns) - before, result: resolveLines(result, ns) as Line[] }
}

export function addBonds(b: Bonds | undefined, d: Bonds): Bonds {
  const o: Bonds = { ...(b ?? {}) }
  for (const [k, v] of Object.entries(d)) o[k as BondId] = Math.max(0, Math.min(10, (o[k as BondId] ?? 0) + (v ?? 0)))
  return o
}

export const visibleChoices = (sc: Scene, s: GameState) => (sc.choices ?? []).filter((c) => !c.when || c.when(s))

// ───────── ฉากจบ ─────────
export const ENDINGS: Ending[] = [
  { id: 'legend', kind: 'good', emoji: '🏆', title: 'ตำนานแห่งวงการ', desc: 'ฝีมือและความทุ่มเทพาคุณไปถึงจุดสูงสุดของอาชีพ ชื่อของคุณถูกจดจำไปอีกนาน' },
  { id: 'family', kind: 'good', emoji: '🏡', title: 'บ้านที่อบอุ่นที่สุด', desc: 'ความสำเร็จที่แท้จริงของคุณคือรอยยิ้มของคนในครอบครัว' },
  { id: 'friend', kind: 'good', emoji: '🤝', title: 'เพื่อนตายตลอดชีวิต', desc: 'จากห้องอนุบาลจนผมหงอก มิตรภาพนี้ไม่เคยจางหาย' },
  { id: 'free', kind: 'good', emoji: '🌈', title: 'ชีวิตที่เลือกเอง', desc: 'คุณกล้าทำตามหัวใจ และไม่เคยเสียใจกับทางที่เลือก' },
  { id: 'home', kind: 'good', emoji: '🌾', title: 'กลับสู่รากเหง้า', desc: 'ต้นมะม่วงหลังบ้านยายยังอยู่ และตอนนี้มันเป็นของคุณ' },
  { id: 'centenarian', kind: 'good', emoji: '🎂', title: 'ร้อยปียังแจ๋ว', desc: 'ร่างกายแข็งแรง ใจเป็นสุข คุณอยู่จนได้เป่าเค้กร้อยเล่ม' },
  { id: 'ordinary', kind: 'good', emoji: '☀️', title: 'ชีวิตธรรมดาที่ไม่ธรรมดา', desc: 'ไม่หวือหวา แต่ทุกวันมีความหมายในแบบของมันเอง' },
  { id: 'lonelyrich', kind: 'bad', emoji: '💎', title: 'เศรษฐีผู้เดียวดาย', desc: 'มีทุกอย่างที่เงินซื้อได้ แต่บ้านหลังใหญ่กลับเงียบเกินไป' },
  { id: 'regret', kind: 'bad', emoji: '🌧️', title: 'ถ้าย้อนเวลากลับไปได้', desc: 'ชีวิตมีหลายสิ่งที่อยากแก้ไข แต่ทุกบทเรียนก็ทำให้คุณเป็นคุณในวันนี้' },
  { id: 'accident', kind: 'bad', emoji: '🕯️', title: 'จากไปไวเกินไป', desc: 'คืนนั้นความเร็วพาคุณไปไกลเกินกว่าจะกลับมา ชีวิตจบลงก่อนจะได้เริ่ม' },
  { id: 'jail', kind: 'bad', emoji: '⛓️', title: 'ชีวิตหลังลูกกรง', desc: 'เงินง่าย ๆ ที่หามาได้ ต้องแลกกับอิสรภาพหลายปี' },
  { id: 'fugitive', kind: 'bad', emoji: '🏃', title: 'ผู้หลบหนี', desc: 'คุณหนีพ้นตำรวจ แต่ไม่เคยได้กลับบ้านอีกเลย' },
  { id: 'bankrupt', kind: 'bad', emoji: '📉', title: 'หนี้ท่วมหัว', desc: 'ดอกเบี้ยวิ่งเร็วกว่าคุณ ชีวิตที่เหลือคือการหนีเจ้าหนี้' },
  { id: 'overwork', kind: 'bad', emoji: '🥀', title: 'งานคือชีวิต', desc: 'คุณล้มลงที่โต๊ะทำงานกลางดึก อีเมลฉบับสุดท้ายยังส่งไม่ออก' },
  { id: 'heart', kind: 'bad', emoji: '💔', title: 'หัวใจที่ไม่ได้ดูแล', desc: 'สัญญาณเตือนมาหลายครั้ง แต่คุณเลือกจะรอพรุ่งนี้' },
  { id: 'alien', kind: 'weird', emoji: '👽', title: 'ไปเที่ยวดาวอื่น', desc: 'คุณขึ้นยานไปกับเพื่อนต่างดาว และกลายเป็นมนุษย์คนแรกบนดาว Kepler-442b' },
  { id: 'cat', kind: 'weird', emoji: '🐈', title: 'ชาตินี้ขอเป็นแมว', desc: 'นอนวันละ 16 ชั่วโมง มีคนป้อนข้าว ไม่ต้องจ่ายภาษี ชีวิตที่สมบูรณ์แบบ' },
  { id: 'ghost', kind: 'weird', emoji: '👻', title: 'เพื่อนเก่าใต้ถุนบ้าน', desc: 'คืนก่อนวันเกิดเจ็ดสิบ ยายทวดโปร่งแสงคนเดิมมายืนรอที่ปลายเตียง "ไปเที่ยวกันไหมหลาน" แล้วคุณก็เดินตามไปอย่างไม่กลัวเลย' },
  { id: 'reborn', kind: 'weird', emoji: '👶', title: 'เกิดใหม่อีกครั้ง', desc: 'ภูติในตะเกียงทำตามคำขอ คุณลืมตาตื่นในเปลอีกครั้ง พร้อมความทรงจำทั้งหมด' },
]


/**
 * 🎯 ฉากจบดูจาก "ค่าที่เด่นที่สุด" ของชีวิตนั้น ไม่ใช่เกณฑ์ตัวเลขตายตัว
 * - เรียงค่าทั้ง 9 จากมากไปน้อย → ฉากจบเป็นของค่าที่อยู่ 2 อันดับแรก
 * - "เด่น" = อยู่ 2 อันดับแรก และสูงกว่าค่ากลาง (median) ของตัวเองอย่างชัดเจน
 * - ค่าที่อยู่ท้ายตาราง ใช้ตัดสินฉากจบแย่
 * จึงไม่พังเมื่อเพิ่มเนื้อหาจนค่าโดยรวมสูงขึ้น และสะท้อนว่าชีวิตนั้นให้น้ำหนักกับอะไร
 */
const RANKED: StatKey[] = ['smart', 'body', 'art', 'social', 'happy', 'money', 'family', 'friend', 'love']
export function statProfile(s: GameState) {
  const st = s.stats
  const base = BASELINE as Record<string, number>
  /** คะแนนเทียบชีวิตทั่วไป: 1.0 = เท่าค่าปกติตอนอายุ 70 (ดู scripts/calibrate.ts) */
  const score = (k: StatKey) => (st[k] + 4) / (Math.max(1, base[k] ?? 1) + 4)
  const vals = RANKED.map(score).sort((a, b) => a - b)
  const median = vals[Math.floor(vals.length / 2)]
  /** อันดับแบบมีค่าเท่ากัน (1 = เด่นที่สุด) */
  const rank = (k: StatKey) => 1 + RANKED.filter((x) => score(x) > score(k)).length
  /** อันดับจากท้าย (1 = อ่อนที่สุด) */
  const low = (k: StatKey) => 1 + RANKED.filter((x) => score(x) < score(k)).length
  const top2 = (k: StatKey) => rank(k) <= 2
  /** เด่นจริง = ติด 2 อันดับแรก และสูงกว่าค่ากลางของตัวเองอย่างน้อย 25% */
  const lead = (k: StatKey) => top2(k) && score(k) >= median * 1.25 && st[k] > 0
  const top = [...RANKED].sort((a, b) => score(b) - score(a)).slice(0, 2)
  return { median, score, rank, low, top2, lead, top }
}

export function pickEnding(s: GameState): Ending {
  const byId = (id: string) => ENDINGS.find((e) => e.id === id)!
  if (s.endId) return byId(s.endId)
  return byId(endingRules(s).find((r) => r.checks.every((c) => c.ok))!.id)
}

/** เงื่อนไขฉากจบวันเกิด 70 — ใช้ทั้งตัดสินจริงและแสดงผล (บนสุดที่ครบชนะ) */
export interface EndRule { id: string; checks: { label: string; ok: boolean }[]; bad?: boolean }
export function endingRules(s: GameState): EndRule[] {
  const has = (f: string) => s.flags.includes(f)
  const P = statProfile(s)
  const name = (k: StatKey) => { const i = STAT_INFO.find((x) => x.key === k); return i ? `${i.icon} ${i.label}` : { family: '🏠 ครอบครัว', friend: '🤝 เพื่อน', love: '❤️ ความรัก' }[k as string] ?? k }
  const isLead = (k: StatKey) => ({ label: `${name(k)} เด่นติด 2 อันดับแรก (ตอนนี้อันดับ ${P.rank(k)}${P.top2(k) && !P.lead(k) ? ' · ยังไม่ทิ้งค่ากลางพอ' : ''})`, ok: P.lead(k) })
  const isTop2 = (k: StatKey) => ({ label: `${name(k)} ติด 2 อันดับแรก (ตอนนี้อันดับ ${P.rank(k)})`, ok: P.top2(k) })
  const isLow = (k: StatKey, n: number) => ({ label: `${name(k)} อยู่ ${n} อันดับท้าย (ตอนนี้อันดับ ${P.low(k)} จากท้าย)`, ok: P.low(k) <= n })
  const below = (k: StatKey) => ({ label: `${name(k)} อ่อนกว่าค่ากลางของชีวิตนี้`, ok: P.score(k) < P.median })
  const cs = s.career ? CAREER_STAT[s.career] : null
  return [
    { id: 'centenarian', checks: [isLead('body'), isTop2('happy')] },
    { id: 'regret', bad: true, checks: [isLow('happy', 3), isLow('family', 3)] },
    { id: 'lonelyrich', bad: true, checks: [isLead('money'), below('family'), below('love')] },
    { id: 'legend', checks: cs ? [{ ...isLead(cs), label: `⭐ ทักษะอาชีพ (${name(cs)}) เด่นอันดับ 1 (ตอนนี้อันดับ ${P.rank(cs)})`, ok: P.lead(cs) && P.rank(cs) === 1 }] : [{ label: '⭐ ต้องมีอาชีพก่อน', ok: false }] },
    { id: 'home', checks: [{ label: '🌾 ตัดสินใจกลับไปอยู่บ้านเกิดตอนเกษียณ', ok: has('retire_farm') }, { label: '🏡 มีรากที่ต่างจังหวัด / เป็นชาวนา', ok: has('countryside') || s.career === 'farmer' }, { label: `🏠 ครอบครัว หรือ 😊 ความสุข ติด 3 อันดับแรก (ตอนนี้อันดับ ${Math.min(P.rank('family'), P.rank('happy'))})`, ok: Math.min(P.rank('family'), P.rank('happy')) <= 3 }] },
    { id: 'family', checks: [isLead('family'), { label: '💍 มีคู่ชีวิตและไม่หย่า', ok: has('partner') && !has('divorced') }] },
    { id: 'friend', checks: [isLead('friend')] },
    { id: 'free', checks: [{ ...isLead('happy'), label: `${name('happy')} เด่นติด 2 อันดับแรก (ตอนนี้อันดับ ${P.rank('happy')}) — หรือเลือกทางนักฝันและความสุขติด 3 อันดับแรก`, ok: P.lead('happy') || (has('dreamer') && P.rank('happy') <= 3) }] },
    { id: 'regret', bad: true, checks: [{ ...isLow('happy', 1), label: `${name('happy')} ต่ำที่สุดในชีวิต (ตอนนี้อันดับ ${P.low('happy')} จากท้าย)` }] },
    { id: 'ordinary', checks: [] },
  ]
}
/** ฉากจบประหลาด: ต้องเก็บธงหลายอัน */
export function weirdRules(s: GameState): EndRule[] {
  const has = (f: string) => s.flags.includes(f)
  return [
    { id: 'alien', checks: [{ label: '🪨 เก็บหินอุกกาบาต (10 ขวบ)', ok: has('alien_rock') }, { label: '📡 ถอดรหัสสัญญาณ (22)', ok: has('decoded') }, { label: '🛸 ขึ้นยาน (35)', ok: s.endId === 'alien' }] },
    { id: 'cat', checks: [{ label: '🐶 รู้จักโกโก้', ok: has('coco') || has('coco_gone') }, { label: '🐈 สลับร่างแล้วตามเสียงโกโก้ (34)', ok: has('cat_coco') }, { label: '🐾 เคยเลี้ยงแมว หรือสนิทโกโก้ 6+', ok: has('cat') || (s.bonds?.coco ?? 0) >= 6 }] },
    { id: 'ghost', checks: [{ label: '👻 เป็นเพื่อนผีใต้ถุนบ้าน (7)', ok: has('ghost_friend') }, { label: '🌙 กลับบ้านยายตามความฝัน (40)', ok: has('ghost_call') }, { label: '🎂 รอถึงคืนก่อนวันเกิด 70', ok: s.endId === 'ghost' }] },
    { id: 'reborn', checks: [{ label: `🔮 เจอเรื่องแปลก ≥2 (ตอนนี้ ${['ghost_friend', 'decoded', 'cat_coco', 'alien_rock', 'ghost_call'].filter(has).length})`, ok: ['ghost_friend', 'decoded', 'cat_coco', 'alien_rock', 'ghost_call'].filter(has).length >= 2 }, { label: '🪔 เจอตะเกียงภูติ (65)', ok: s.endId === 'reborn' }] },
  ]
}
/** ฉากจบที่ใกล้ที่สุดตอนนี้ + ความคืบหน้า */
export function nearestEndings(s: GameState) {
  const rules = endingRules(s)
  const now = rules.find((r) => r.checks.every((c) => c.ok))!
  const above = rules.slice(0, rules.indexOf(now)).filter((r) => !r.bad)
  const score = (r: EndRule) => r.checks.filter((c) => c.ok).length / r.checks.length
  const close = [...above].sort((a, b) => score(b) - score(a)).slice(0, 2)
  return { now, close }
}

// ───────── เซฟ ─────────
const LAST_KEY = 'lifepath.lastscenes.v1'
/** ฉากสุ่มที่เจอในชีวิตก่อน (ใช้ลดโอกาสเจอซ้ำ) */
export function lastScenes(): string[] | undefined {
  try { const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); return Array.isArray(v) ? v : undefined } catch { return undefined }
}
export function rememberScenes(ids: string[]) {
  try { localStorage.setItem(LAST_KEY, JSON.stringify(ids.filter((i) => SCENES.find((x) => x.id === i)?.chance !== undefined))) } catch { /* ignore */ }
}
const SAVE_KEY = 'lifepath.save.v1'
const ENDINGS_KEY = 'lifepath.endings.v1'
export function save(s: GameState | null) {
  try { s ? localStorage.setItem(SAVE_KEY, JSON.stringify(s)) : localStorage.removeItem(SAVE_KEY) } catch { /* ignore */ }
}
export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (!s || !SCENES.some((x) => x.id === s.sceneId)) return null
    return { cash: 0, invest: 0, debt: 0, bonds: {}, ...s }
  } catch { return null }
}
export function unlockedEndings(): string[] {
  try { return JSON.parse(localStorage.getItem(ENDINGS_KEY) || '[]') } catch { return [] }
}
export function unlockEnding(id: string) {
  try { localStorage.setItem(ENDINGS_KEY, JSON.stringify([...new Set([...unlockedEndings(), id])])) } catch { /* ignore */ }
}
