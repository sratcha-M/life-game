import type { Fin, GameState, StatKey, Stats } from './types'
import { careerById, SELF_EMPLOYED } from './careers'
import { bodyMul, byAge, pct, PORTFOLIO, rural } from './realstats'

/**
 * ระบบการเงิน: เงินสด / เงินลงทุน / หนี้ (หน่วยบาท)
 * - ทุกครั้งที่เวลาผ่านไป จะคิดรายได้ − รายจ่าย, ดอกเบี้ยหนี้, ผลตอบแทนการลงทุน
 * - "เรื่องไม่คาดคิด" ทอยทุกปีตามโอกาสจริงจากสถิติ WHO / World Bank / UN ฯลฯ (ดู realstats.ts)
 * - ผลตอบแทนการลงทุนใช้ดัชนี SET ของปีจริงในอดีต
 */

export function rand(seed: number, id: string) {
  let h = seed
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2654435761)
  h ^= h >>> 15
  return ((h >>> 0) % 10000) / 10000
}

const has = (s: GameState, f: string) => s.flags.includes(f)
export const married = (s: GameState) => has(s, 'partner') && !has(s, 'divorced')

export const netWorth = (s: GameState) => (s.cash ?? 0) + (s.invest ?? 0) - (s.debt ?? 0)

/** ค่าสถานะ "เงิน" (0–15) คิดจากความมั่งคั่งสุทธิ */
export function moneyStat(net: number) {
  if (net <= 0) return 0
  return Math.max(0, Math.min(15, Math.round((Math.log10(net) - 3) * 2.5)))
}

/** หน่วยเงินของ effects.money ตามช่วงวัย */
export const moneyUnit = (age: number) => (age < 13 ? 2_000 : age < 19 ? 10_000 : age < 25 ? 30_000 : 80_000)

export function fmtBaht(n: number, sign = false) {
  const s = sign && n > 0 ? '+' : n < 0 ? '−' : ''
  const a = Math.abs(n)
  const v = a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}K` : a.toLocaleString('th-TH')
  return `${s}฿${v}`
}

/** ใช้ Fin + เงินจาก effects.money แล้วจัดการติดลบ → กลายเป็นหนี้ */
export function applyFin(s: GameState, fin: Fin | undefined, moneyEff: number, age: number): GameState {
  let cash = s.cash ?? 0, invest = s.invest ?? 0, debt = s.debt ?? 0, stocks = s.stocks ?? 0, stockIn = s.stockIn ?? 0
  if (fin?.cashMul !== undefined) cash *= fin.cashMul
  if (fin?.investMul !== undefined) { invest *= fin.investMul; stocks *= fin.investMul; stockIn *= fin.investMul }
  cash += (fin?.cash ?? 0) + moneyEff * moneyUnit(age)
  invest += (fin?.invest ?? 0) + (fin?.stock ?? 0)
  stocks += fin?.stock ?? 0
  stockIn += fin?.stock ?? 0
  debt += fin?.debt ?? 0
  if (invest < 0) { cash += invest; invest = 0 }
  // หุ้นถูกขาย/หายไปพร้อมทรัพย์สิน → เงินต้นลดตามสัดส่วน
  const kept = Math.max(0, Math.min(stocks, invest))
  if (stocks > 0 && kept < stocks) stockIn *= kept / stocks
  stocks = kept
  if (cash < 0) { if (age >= 19) debt += -cash; cash = 0 } // เด็กไม่มีหนี้
  if (debt < 0) { cash += -debt; debt = 0 }
  const ns = { ...s, cash: Math.round(cash), invest: Math.round(invest), stocks: Math.round(stocks), stockIn: stocks > 0 ? Math.round(stockIn) : 0, debt: Math.round(debt), debtMax: debt > 0 ? Math.max(s.debtMax ?? 0, Math.round(debt)) : 0 }
  // ปลดหนี้หมด → บันทึกลงสมุดชีวิต
  const peak = s.debtMax || s.debt
  const history = s.debt > 0 && ns.debt === 0 && peak >= 10_000 ? [...s.history, { age, text: `🎉 ปลดหนี้หมดแล้ว! (เคยมีหนี้สูงสุด ${fmtBaht(peak)})` }] : s.history
  return { ...ns, history, stats: { ...ns.stats, money: moneyStat(netWorth(ns)) } }
}

/** เงินเดือน (บาท/เดือน) ตามอาชีพ อายุงาน และโบนัสพิเศษ */
export function salaryOf(s: GameState, age: number): { monthly: number; label: string } {
  if (age < 19) return { monthly: 0, label: '' }
  if (age < 22) return has(s, 'path_work') ? { monthly: 12_000, label: 'งานพาร์ทไทม์เต็มเวลา' } : { monthly: 2_500, label: 'งานพิเศษช่วงเรียน' }
  const c = careerById(s.career)
  // นักบวชไม่มีเงินเดือน/ไม่เกษียณ — ปัจจัยที่ญาติโยมถวายเป็นค่ายาค่าเดินทาง
  if (s.career === 'monk') return { monthly: c!.monthly, label: 'ปัจจัยจากญาติโยม' }
  if (age >= 60) {
    if (has(s, 'work_after_60') && c) return { monthly: Math.round(c.monthly * 0.6), label: `ทำงานต่อ (${c.name})` }
    return { monthly: c?.pension ?? 6_000, label: c?.pension ? 'บำนาญ' : 'เบี้ยยังชีพ + เงินออม' }
  }
  if (!c) return { monthly: 15_000, label: 'งานรับจ้างทั่วไป' }
  if (has(s, 'fired')) return { monthly: 9_000, label: 'ตกงาน (รับจ้างรายวัน)' }
  const years = Math.max(0, age - (s.careerSince ?? 22))
  let m = c.monthly * Math.min(c.cap ?? 2, Math.pow(1 + c.growth, years))
  if (c.id === 'athlete' && age >= 35) m *= 0.5 // หมดยุครุ่ง
  if (has(s, 'promoted')) m *= 1.4
  if (has(s, 'abroad')) m *= 1.8
  if (has(s, 'dreamer')) m *= 0.7
  return { monthly: Math.round(m / 100) * 100, label: c.name }
}

/** ค่าใช้จ่าย (บาท/เดือน) */
export function livingCost(s: GameState, age: number) {
  if (age < 22) return 0
  if (s.career === 'monk') return 2_500 // ชีวิตนักบวชเรียบง่าย อาหารจากบิณฑบาต รักษาฟรีที่ รพ.สงฆ์
  if (age >= 60) return Math.round((150_000 + (s.stats.body <= 3 ? 80_000 : 0)) / 12)
  let cost = 190_000
  if (has(s, 'spender')) cost += 110_000
  if (has(s, 'saver')) cost -= 50_000
  if (has(s, 'support')) cost += 60_000
  if (has(s, 'kid') && age >= 34) cost += 130_000
  if (married(s)) cost -= 40_000
  // ใช้ชีวิตตามรายได้: เงินเดือนส่วนที่เกิน 20,000 ใช้เพิ่ม ~70%
  const extra = Math.max(0, salaryOf(s, age).monthly - 20_000) * (has(s, 'saver') ? 0.55 : has(s, 'spender') ? 0.85 : 0.7)
  return Math.round(cost / 12 + extra)
}

/** รายได้/รายจ่ายต่อปี = เงินเดือน × 12 */
export function yearly(s: GameState, age: number) {
  const { monthly } = salaryOf(s, age)
  return { income: monthly * 12, cost: livingCost(s, age) * 12 }
}

// ───────── เรื่องไม่คาดคิด (โอกาสต่อปีจากสถิติจริง — ดู realstats.ts) ─────────
export interface Shock {
  id: string
  icon: string
  text: string
  min: number
  max: number
  /** แหล่งข้อมูล (คีย์ใน SOURCES) */
  src: string
  /** อธิบายว่าคิดโอกาสมาอย่างไร */
  basis: string
  /** โอกาสเกิดต่อปี ตามอายุและชีวิตผู้เล่น */
  p: (age: number, s: GameState) => number
  /** เหตุผลสั้น ๆ ว่าทำไมตัวละครนี้เสี่ยงกว่าปกติ (อิงตัวคูณใน p) */
  why?: (age: number, s: GameState) => (string | false | undefined)[]
  when?: (s: GameState) => boolean
  fin?: (s: GameState) => Fin
  effects?: Partial<Stats>
  flags?: string[]
}
const CAREER_NAME = (s: GameState) => careerById(s.career)?.name ?? 'บริษัท'
const OFFICE = ['office', 'dev', 'chef', 'creator', 'musician', 'engineer', 'trader', 'lawyer']
export const SHOCKS: Shock[] = [
  { id: 'dengue', icon: '🦟', text: 'ป่วยไข้เลือดออก นอนโรงพยาบาลหนึ่งอาทิตย์', min: 3, max: 70, src: 'ddc_dengue', basis: 'ผู้ป่วย ≈0.2% ของประชากรต่อปี · เด็กวัยเรียนเสี่ยงกว่าราว 2.5 เท่า (ประมาณ) · ต่างจังหวัด ×1.3',
    why: (a, s) => [a >= 5 && a <= 14 && 'เด็กวัยเรียนเสี่ยงไข้เลือดออกมากที่สุด', rural(s) && 'อยู่ต่างจังหวัดใกล้แหล่งยุงลาย'], p: (a, s) => 0.002 * (a >= 5 && a <= 14 ? 2.5 : 1) * (rural(s) ? 1.3 : 1), effects: { body: -1 }, fin: () => ({ cash: -3_000 }) },
  { id: 'carcrash', icon: '🛵', text: 'ประสบอุบัติเหตุบนถนน บาดเจ็บต้องพักฟื้น', min: 15, max: 70, src: 'rsc_injury', basis: 'บาดเจ็บ ≈1.1% ต่อปี · อายุ 15–29 เสี่ยงสุด ×1.6 (WHO) · อายุ 60+ ×0.8',
    why: (a) => [a <= 29 && 'คนอายุ 15–29 ประสบอุบัติเหตุบนถนนมากที่สุด'], p: (a) => 0.011 * (a <= 29 ? 1.6 : a >= 60 ? 0.8 : 1), effects: { body: -1 }, fin: (s) => ({ cash: has(s, 'insured') ? -10_000 : -150_000 }) },
  { id: 'layoff', icon: '📉', text: 'เศรษฐกิจทรุด บริษัทเลิกจ้าง ตกงานครึ่งปี', min: 24, max: 55, src: 'wb_unemp', basis: 'ว่างงาน 0.91% × ระยะตกงานเฉลี่ย 3–4 เดือน ⇒ ≈3% ต่อปี (เฉพาะงานบริษัท/ธุรกิจ)',
    when: (s) => OFFICE.includes(s.career ?? ''), why: (_a, s) => [`งาน${CAREER_NAME(s)}โดนผลกระทบเศรษฐกิจก่อนใคร`], p: () => 0.03, effects: { happy: -2 }, fin: (s) => ({ cash: -(yearly(s, 30).income * 0.5) }) },
  { id: 'pandemic', icon: '😷', text: 'โรคระบาดทั่วโลก รายได้หายไปเกือบปี', min: 20, max: 60, src: 'wb_covid', basis: 'วิกฤตระดับโลกแบบโควิด-19 (GDP −6.1%) ≈1–2 ครั้งในชั่วชีวิต ⇒ ≈2% ต่อปี (ประมาณ)',
    p: () => 0.02, effects: { happy: -2 }, fin: (s) => ({ cash: -(yearly(s, 30).income * 0.7) }) },
  { id: 'flood', icon: '🌊', text: 'น้ำท่วมบ้าน ของเสียหายเกือบหมด', min: 20, max: 70, src: 'wb_flood', basis: 'น้ำท่วมใหญ่ระดับปี 2554 กระทบ ≈20% ของคนไทย ≈1 ครั้งใน 30 ปี + น้ำท่วมระดับภูมิภาค ⇒ ≈1% ต่อปี · ต่างจังหวัด ×1.5',
    when: (s) => has(s, 'home') || rural(s), why: (_a, s) => [rural(s) && 'บ้านอยู่ต่างจังหวัด เสี่ยงน้ำท่วมกว่าในเมือง'], p: (_a, s) => 0.01 * (rural(s) ? 1.5 : 1), effects: { happy: -2 }, fin: () => ({ cash: -250_000 }) },
  { id: 'scammed', icon: '💳', text: 'โดนแก๊งคอลเซ็นเตอร์/มิจฉาชีพออนไลน์หลอกโอนเงิน', min: 20, max: 70, src: 'scam', basis: 'คดีหลอกลวงออนไลน์ ≈0.5% ของผู้ใหญ่ต่อปี · อายุ 60+ ×1.3 · เสียหายเฉลี่ย 37,549 บาท',
    why: (a) => [a >= 60 && 'ผู้สูงวัยตกเป็นเป้าของมิจฉาชีพมากกว่า'], p: (a) => 0.005 * (a >= 60 ? 1.3 : 1), effects: { happy: -1 }, fin: (s) => ({ cash: -Math.min(Math.max(37_500, s.cash * 0.05), 300_000) }) },
  { id: 'diabetes', icon: '🩸', text: 'ตรวจสุขภาพประจำปี เจอเบาหวาน ต้องคุมอาหารตลอดชีวิต', min: 30, max: 70, src: 'whf_cvd', basis: 'ผู้ใหญ่ไทยเป็นเบาหวาน 11.7% · โอกาสเป็นใหม่เพิ่มตามอายุ 0.3–1.2% ต่อปี (ประมาณจากความชุก) · ปรับตามร่างกาย',
    why: (a, s) => [s.stats.body <= 4 && `ร่างกายอ่อนแอ (💪 ${s.stats.body})`, a >= 45 && 'อายุเกิน 45 ความเสี่ยงเบาหวานเพิ่มขึ้นมาก'], p: (a, s) => byAge(a, [[30, 0.003], [45, 0.008], [55, 0.012]]) * bodyMul(s), effects: { body: -1, happy: -1 }, fin: () => ({ cash: -20_000 }) },
  { id: 'heart', icon: '🫀', text: 'เจ็บแน่นหน้าอก ตรวจเจอหลอดเลือดหัวใจตีบ ต้องทำบอลลูน', min: 35, max: 70, src: 'whf_cvd', basis: 'โรคหัวใจและหลอดเลือดรายใหม่ 442 ต่อแสนคนต่อปี (≈0.44%) · กระจายตามอายุ 0.1% (35+) ถึง 1.4% (65+) · ร่างกายอ่อนแอ ×1.6, แข็งแรง ×0.6',
    why: (a, s) => [s.stats.body <= 4 && `ร่างกายอ่อนแอ (💪 ${s.stats.body})`, a >= 55 && 'อายุเกิน 55 หลอดเลือดเริ่มเสื่อม'], p: (a, s) => byAge(a, [[35, 0.001], [45, 0.003], [55, 0.007], [65, 0.014]]) * bodyMul(s), effects: { body: -2, happy: -1 }, fin: (s) => ({ cash: has(s, 'insured') ? -30_000 : -350_000 }) },
  { id: 'sick', icon: '🎗️', text: 'ตรวจเจอมะเร็ง ต้องผ่าตัดและรักษาต่อเนื่อง', min: 25, max: 70, src: 'globocan', basis: 'โอกาสเป็นมะเร็งก่อนอายุ 75 = 15% · กระจายตามอายุ 0.08% (25+) ถึง 1.1% (70) ต่อปี',
    why: (a, s) => [s.stats.body <= 4 && `ร่างกายอ่อนแอ (💪 ${s.stats.body})`, a >= 50 && 'อายุเกิน 50 โอกาสเป็นมะเร็งสูงขึ้นหลายเท่า'], p: (a, s) => byAge(a, [[25, 0.0008], [40, 0.0015], [50, 0.004], [60, 0.007], [70, 0.011]]) * Math.sqrt(bodyMul(s)), effects: { body: -2, happy: -2 }, fin: (s) => ({ cash: has(s, 'insured') ? -50_000 : -600_000 }) },
  { id: 'depress', icon: '🌧️', text: 'ป่วยเป็นโรคซึมเศร้า ต้องพบจิตแพทย์และพักงานช่วงหนึ่ง', min: 18, max: 70, src: 'depress', basis: 'ผู้ใหญ่ไทยเป็นโรคซึมเศร้า 2.5% ⇒ ป่วยใหม่ ≈0.6% ต่อปี (ประมาณ) · ความสุขต่ำ (≤3) ×2.5, สูง (≥9) ×0.5',
    why: (_a, s) => [s.stats.happy <= 3 && `ความสุขต่ำมานาน (😊 ${s.stats.happy})`], p: (_a, s) => 0.006 * (s.stats.happy <= 3 ? 2.5 : s.stats.happy >= 9 ? 0.5 : 1), effects: { happy: -2 }, fin: (s) => ({ cash: -Math.round(yearly(s, 30).income * 0.15) - 15_000 }) },
  { id: 'fall', icon: '🦴', text: 'ลื่นล้มในห้องน้ำ สะโพกหัก', min: 60, max: 70, src: 'iof_hip', basis: 'กระดูกสะโพกหัก ≈0.22% ต่อปีในผู้สูงวัย · ร่างกายอ่อนแอ ×1.6',
    why: (_a, s) => [s.stats.body <= 4 && `ร่างกายอ่อนแอ (💪 ${s.stats.body})`], p: (_a, s) => 0.0022 * bodyMul(s), effects: { body: -2 }, fin: (s) => ({ cash: has(s, 'insured') ? -20_000 : -120_000 }) },
  // เรื่องเล็ก ๆ ที่ไม่มีสถิติทางการ
  { id: 'luckydraw', icon: '🎁', text: 'ส่งฝาน้ำอัดลมชิงโชค ได้จักรยานคันใหม่!', min: 6, max: 15, src: 'game', basis: '3% ต่อปี', p: () => 0.03, effects: { happy: 2 } },
  { id: 'phone', icon: '📱', text: 'ทำมือถือตกน้ำ ต้องเก็บเงินซื้อใหม่', min: 12, max: 22, src: 'game', basis: '8% ต่อปี', p: () => 0.08, fin: () => ({ cash: -8_000 }), effects: { happy: -1 } },
  { id: 'bonus', icon: '🎉', text: 'บริษัทกำไรดี แจกโบนัส 6 เดือน!', min: 24, max: 58, src: 'game', basis: '4% ต่อปี (เฉพาะคนมีงานประจำ)', when: (s) => !!s.career, p: () => 0.04, effects: { happy: 2 }, fin: (s) => ({ cash: yearly(s, 30).income * 0.5 }) },
  { id: 'promote', icon: '📈', text: 'ได้เลื่อนตำแหน่งแบบไม่ทันตั้งตัว', min: 27, max: 50, src: 'game', basis: '5% ต่อปี', when: (s) => !has(s, 'promoted') && !!s.career, p: () => 0.05, flags: ['promoted'], effects: { happy: 1, social: 1 } },
  { id: 'inherit', icon: '📜', text: 'ญาติห่าง ๆ ที่ไม่เคยเจอ ทิ้งมรดกไว้ให้!', min: 30, max: 65, src: 'game', basis: '0.3% ต่อปี', p: () => 0.003, effects: { happy: 2 }, fin: () => ({ cash: 1_200_000 }) },
  { id: 'reunion', icon: '🍲', text: 'ครอบครัวกลับมากินข้าวพร้อมหน้ากันครั้งแรกในรอบหลายปี', min: 20, max: 70, src: 'game', basis: '5% ต่อปี', p: () => 0.05, effects: { family: 2, happy: 1 } },
]
/** ตลาดหุ้น: พอร์ตไทย 50% + โลก 50% ของปีจริงในอดีต (สุ่มปี) — ร่วง ≥20% หรือพุ่ง ≥30% จะแจ้งเป็นเหตุการณ์ */
const CRASH = -20, BOOM = 30
export const MARKET_BASIS = {
  src: 'set', crashPct: CRASH, boomPct: BOOM,
  crash: PORTFOLIO.filter((x) => x.pct <= CRASH).length / PORTFOLIO.length,
  boom: PORTFOLIO.filter((x) => x.pct >= BOOM).length / PORTFOLIO.length,
  /** ผลตอบแทนเฉลี่ยทบต้นต่อปี (%) */
  avg: Math.round((Math.pow(PORTFOLIO.reduce((m, x) => m * (1 + x.pct / 100), 1), 1 / PORTFOLIO.length) - 1) * 1000) / 10,
}

export interface YearReport {
  years: number
  net: number
  salary: number
  salaryLabel: string
  cost: number
  shock?: { icon: string; text: string; cash: number; odds: string; src: string; more: number; why?: string }
}

/** เวลาผ่านไปจากอายุ from → to: คิดเงิน + สุ่มเรื่องไม่คาดคิด */
export function passYears(s: GameState, from: number, to: number): { state: GameState; report: YearReport } {
  let st = { ...s, cash: s.cash ?? 0, invest: s.invest ?? 0, debt: s.debt ?? 0 }
  const before = netWorth(st)
  const hits: { icon: string; text: string; cash: number; odds: string; src: string; age: number; why?: string }[] = []
  for (let a = from; a < to; a++) {
    const { income, cost } = yearly(st, a)
    let cash = st.cash + income - cost
    let debt = st.debt * 1.07
    if (debt > 0 && cash > 0) { const pay = Math.min(cash, Math.max(debt * 0.12, 60_000)); cash -= pay; debt -= pay }
    // ผลตอบแทน: เฉพาะเงินที่ตั้งใจลงหุ้น (stocks) = หุ้นไทย 50% + หุ้นโลก 50% ของปีจริงในอดีต (รวมปันผล)
    // ทรัพย์สินอื่น (บ้าน ที่ดิน ธุรกิจ ทอง มรดก) โตคงที่ 3.5%/ปี — ไม่มีเหตุการณ์ "หุ้นพุ่ง/ร่วง" ถ้าไม่เคยเลือกลงทุนหุ้น
    const m = PORTFOLIO[Math.floor(rand(st.seed, 'inv' + a) * PORTFOLIO.length)]
    const stock0 = Math.min(st.stocks ?? 0, st.invest)
    const stocks = stock0 * (1 + m.pct / 100)
    const invest = (st.invest - stock0) * 1.035 + stocks
    if (stock0 > 50_000 && (m.pct <= CRASH || m.pct >= BOOM) && Math.abs(stocks - stock0) >= 100_000) {
      const crash = m.pct < 0
      const text = `หุ้นที่ลงทุนไว้${crash ? 'ร่วง ' : 'พุ่ง +'}${m.pct.toFixed(0)}% แบบปี ${m.year + 543} (ไทย ${m.th > 0 ? '+' : ''}${m.th}% · โลก ${m.world > 0 ? '+' : ''}${m.world}%)`
      hits.push({ icon: crash ? '🔻' : '🚀', text, cash: Math.round(stocks - stock0), odds: pct(crash ? MARKET_BASIS.crash : MARKET_BASIS.boom), src: 'set', age: a + 1 })
      st = { ...st, history: [...st.history, { age: a + 1, text: `${crash ? '🔻' : '🚀'} ${text}` }] }
    }
    const stockLog = stock0 > 0 ? [...(st.stockLog ?? []), { age: a + 1, year: m.year + 543, pct: Math.round(m.pct), th: m.th, world: m.world }].slice(-12) : st.stockLog
    st = applyFin({ ...st, cash, debt, invest, stocks, stockLog }, undefined, 0, a)
    // เรื่องไม่คาดคิด: แต่ละเรื่องทอยตามโอกาสจริงของปีนั้น (เกิดได้ครั้งเดียวต่อชีวิต)
    const age = a + 1
    for (const sh of SHOCKS) {
      if (age < sh.min || age > sh.max || st.flags.includes('shock_' + sh.id)) continue
      if (sh.when && !sh.when(st)) continue
      if (['layoff', 'bonus', 'promote'].includes(sh.id) && (has(st, 'fired') || has(st, 'own_boss') || SELF_EMPLOYED.includes(st.career ?? ''))) continue
      const p = sh.p(age, st)
      if (rand(st.seed, `shock_${sh.id}_${age}`) >= p) continue
      const b = netWorth(st)
      const prev = st
      const stats = { ...st.stats }
      for (const [k, v] of Object.entries(sh.effects ?? {})) stats[k as StatKey] = Math.max(0, stats[k as StatKey] + (v ?? 0))
      // นักบวชรักษาฟรีที่ รพ.สงฆ์ / บัตรทอง
      const free = st.career === 'monk' && ['dengue', 'carcrash', 'diabetes', 'heart', 'sick', 'depress', 'fall'].includes(sh.id)
      st = applyFin({ ...st, stats, flags: [...st.flags, 'shock_' + sh.id, ...(sh.flags ?? [])], history: [...st.history, { age, text: `${sh.icon} ${sh.text}` }] }, free ? undefined : sh.fin?.(st), 0, age)
      const whys = (sh.why?.(age, prev) ?? []).filter((x): x is string => !!x)
      const ins = free ? 'นักบวชรักษาฟรีที่โรงพยาบาลสงฆ์' : sh.fin && ['carcrash', 'heart', 'sick', 'fall'].includes(sh.id) ? (has(prev, 'insured') ? 'มีประกัน เลยจ่ายเองแค่ส่วนน้อย' : 'ไม่มีประกัน จึงจ่ายเองเต็ม ๆ') : undefined
      const why = whys.length ? `เพราะ${whys.join(' และ')}` : sh.src === 'game' ? undefined : 'ไม่ได้มาจากการเลือกของคุณ — เป็นความเสี่ยงที่คนไทยทุกคนมีเท่ากัน'
      const why2 = [why, ins].filter(Boolean).join(' · ') || undefined
      if (why2) st = { ...st, history: st.history.map((h, i) => (i === st.history.length - 1 ? { ...h, text: `${h.text} (${why2})` } : h)) }
      hits.push({ icon: sh.icon, text: sh.text, cash: netWorth(st) - b, odds: pct(p), src: sh.src, age, why: why2 })
    }
  }
  // แสดงเรื่องที่หนักที่สุดในช่วงนี้ (เรื่องอื่นบันทึกลงสมุดชีวิต)
  const top = [...hits].sort((x, y) => Math.abs(y.cash) - Math.abs(x.cash))[0]
  const shock: YearReport['shock'] = top ? { icon: top.icon, text: top.text, cash: top.cash, odds: top.odds, src: top.src, more: hits.length - 1, why: top.why } : undefined
  const shockCash = hits.reduce((n, h) => n + (h.src === 'set' ? 0 : h.cash), 0)
  const sal = salaryOf(st, Math.max(from, to - 1))
  return { state: st, report: { years: to - from, net: netWorth(st) - before - shockCash, shock, salary: sal.monthly, salaryLabel: sal.label, cost: livingCost(st, Math.max(from, to - 1)) } }
}
