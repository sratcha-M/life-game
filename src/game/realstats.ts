import type { GameState } from './types'

/**
 * 📚 สถิติจริงที่ใช้เป็นฐานของ "เรื่องไม่คาดคิด"
 * ทุกเหตุการณ์มีโอกาส "ต่อปี" ตามอายุ คิดจากข้อมูลของหน่วยงานด้านล่าง
 * แล้วปรับขึ้น/ลงตามชีวิตผู้เล่น (ร่างกาย ประกัน อาชีพ ที่อยู่) — ไม่ได้สุ่มลอย ๆ อีกต่อไป
 */
export interface Source { id: string; org: string; title: string; year: string; url: string }
export const SOURCES: Record<string, Source> = {
  who_road: { id: 'who_road', org: 'WHO', title: 'Global Status Report on Road Safety 2023 — ประเทศไทย: ตาย 25.4 ต่อแสนคน, กลุ่มเสี่ยงสุดอายุ 15–29, 83.8% เป็นผู้ขับขี่จักรยานยนต์', year: '2021', url: 'https://www.who.int/thailand/our-work/road-safety' },
  rsc_injury: { id: 'rsc_injury', org: 'ThaiRSC (ศูนย์ข้อมูลอุบัติเหตุ)', title: 'ผู้บาดเจ็บจากอุบัติเหตุทางถนน ~600,000 คนใน 9 เดือนแรกของปี 2567 (≈1.1% ของประชากรต่อปี)', year: '2024', url: 'https://www.malaymail.com/news/world/2024/10/02/explainer-why-are-thailands-roads-so-deadly/152379' },
  ddc_dengue: { id: 'ddc_dengue', org: 'กรมควบคุมโรค / WHO', title: 'ไข้เลือดออก 119,465 ราย (1 ม.ค.–26 ต.ค. 2566) ≈ 0.2% ของประชากรต่อปีในปีระบาด', year: '2023', url: 'https://www.ddc.moph.go.th/uploads/publish/1496320231110040110.pdf' },
  globocan: { id: 'globocan', org: 'WHO / IARC (GLOBOCAN)', title: 'มะเร็งรายใหม่ 176,951 รายต่อปี — โอกาสเป็นมะเร็งก่อนอายุ 75 ปี = 15.0%', year: '2024', url: 'https://gco.iarc.who.int/media/globocan/factsheets/populations/764-thailand-fact-sheet.pdf' },
  whf_cvd: { id: 'whf_cvd', org: 'World Heart Federation (ข้อมูล WHO/IHME)', title: 'โรคหัวใจและหลอดเลือดรายใหม่ 442 ต่อแสนคนต่อปี · ความดันสูง 29.1% · เบาหวาน 11.7% ของผู้ใหญ่', year: '2019–2024', url: 'https://world-heart-federation.org/world-heart-observatory/countries/thailand/' },
  iof_hip: { id: 'iof_hip', org: 'International Osteoporosis Foundation', title: 'กระดูกสะโพกหัก 212–239 ต่อแสนคนต่อปี (การศึกษาจังหวัดน่าน 2558–2560)', year: '2015–2017', url: 'https://www.osteoporosis.foundation/sites/iofbonehealth/files/2025-11/Thailand_Final.pdf' },
  wb_flood: { id: 'wb_flood', org: 'World Bank', title: 'มหาอุทกภัย 2554 กระทบ 13.6 ล้านคน (≈20% ของประชากร) ความเสียหาย 1.43 ล้านล้านบาท', year: '2011', url: 'https://en.wikipedia.org/wiki/2011_Thailand_floods' },
  wb_unemp: { id: 'wb_unemp', org: 'World Bank / ILO', title: 'อัตราว่างงานของไทย 0.91% (ตกงานเฉลี่ยราว 3–4 เดือน ⇒ โอกาสถูกเลิกจ้าง ≈3% ต่อปี)', year: '2023', url: 'https://www.theglobaleconomy.com/Thailand/Unemployment_rate/' },
  wb_life: { id: 'wb_life', org: 'World Bank', title: 'อายุขัยเฉลี่ยคนไทยแรกเกิด 76.4 ปี', year: '2023', url: 'https://fred.stlouisfed.org/series/SPDYNLE00INTHA' },
  set: { id: 'set', org: 'ตลาดหลักทรัพย์ฯ (SET)', title: 'ผลตอบแทนดัชนี SET รายปี 1994–2024: ร่วงเกิน 25% 4 ปีจาก 31 ปี, พุ่งเกิน 40% 3 ปี', year: '1994–2024', url: 'https://1stock1.com/1stock1_2626.htm' },
  scam: { id: 'scam', org: 'Thai PBS (ข้อมูลตำรวจไซเบอร์)', title: 'คดีหลอกลวงออนไลน์ ~990,000 คดี (มี.ค. 2565–ก.ค. 2568) ≈ 0.5% ของผู้ใหญ่ต่อปี เสียหายเฉลี่ย 37,549 บาท', year: '2022–2025', url: 'https://www.thaipbs.or.th/thevisual/en/dataviz/thescammer/' },
  wb_covid: { id: 'wb_covid', org: 'World Bank', title: 'โควิด-19: GDP ไทยปี 2563 หดตัว −6.1% · วิกฤตระดับโลกแบบนี้เกิดราว 1–2 ครั้งในชั่วชีวิต', year: '2020', url: 'https://thedocs.worldbank.org/en/doc/7f8dad261b84d44587bbf18f1e393089-0140012025/original/Thailand.pdf' },
  un_wpp: { id: 'un_wpp', org: 'UN (World Population Prospects)', title: 'ตารางชีพประเทศไทย: โอกาสเสียชีวิตรายปีตามอายุและเพศ · คนไทยรอดถึงอายุ 70 = 74.3% (ชาย 65.8%, หญิง 83.1%) · อายุขัย 77.1 ปี', year: '2024–2026', url: 'https://georank.org/life-expectancy/thailand' },
  un_birth: { id: 'un_birth', org: 'UN (World Population Prospects 2024)', title: 'อายุเฉลี่ยของแม่ตอนมีลูก 28.4 ปี', year: '2024', url: 'https://measuredworld.com/countries/thailand/births/childbearing-patterns' },
  depress: { id: 'depress', org: 'งานวิจัยประชากรไทย (HART cohort, PMC)', title: 'โรคซึมเศร้า 2.5% ของผู้ใหญ่ไทย · วัยกลางคน–สูงวัยเกิดอาการซึมเศร้าใหม่ 9.8% ใน 2 ปี', year: '2015–2017', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10228276/' },
  game: { id: 'game', org: 'ข้อมูลในเกม', title: 'เรื่องเล็ก ๆ ในชีวิตที่ไม่มีสถิติทางการ — กำหนดโอกาสเองให้สมเหตุสมผล', year: '-', url: '' },
}

/** SET รายปี (ไม่รวมปันผล) — ใช้สุ่มผลตอบแทนการลงทุนแบบ "ปีจริงในอดีต" */
export const SET_RETURNS: { year: number; pct: number }[] = [
  [1994, -19.18], [1995, -5.83], [1996, -35.07], [1997, -55.18], [1998, -4.53], [1999, 35.44], [2000, -44.14], [2001, 12.88],
  [2002, 17.32], [2003, 116.6], [2004, -13.48], [2005, 6.83], [2006, -4.75], [2007, 26.22], [2008, -47.56], [2009, 63.25],
  [2010, 40.6], [2011, -0.72], [2012, 35.76], [2013, -6.7], [2014, 15.32], [2015, -14.0], [2016, 19.79], [2017, 13.66],
  [2018, -10.82], [2019, 1.02], [2020, -8.26], [2021, 14.37], [2022, 0.67], [2023, -15.15], [2024, -1.1],
].map(([year, pct]) => ({ year, pct }))

const has = (s: GameState, f: string) => s.flags.includes(f)
/** ตัวคูณตามร่างกาย: ร่างกายแข็งแรงเสี่ยงน้อยลง */
export const bodyMul = (s: GameState) => (s.stats.body <= 2 ? 1.6 : s.stats.body <= 4 ? 1.2 : s.stats.body >= 9 ? 0.6 : s.stats.body >= 7 ? 0.8 : 1)
export const rural = (s: GameState) => has(s, 'countryside') || s.career === 'farmer'

/** ขั้นบันไดตามอายุ: [[อายุเริ่ม, โอกาส/ปี], ...] */
export const byAge = (age: number, steps: [number, number][]) => {
  let v = 0
  for (const [a, p] of steps) if (age >= a) v = p
  return v
}
export const pct = (p: number) => (p >= 0.1 ? `${Math.round(p * 100)}%` : p >= 0.01 ? `${(p * 100).toFixed(1)}%` : `${(p * 100).toFixed(2)}%`)

// ───────── ตารางชีพ UN: โอกาสเสียชีวิตต่อปี (ค่ากลางของช่วงอายุ 5 ปี) ─────────
const QX: Record<'m' | 'f', [number, number][]> = {
  f: [[40, 0.002], [45, 0.0029], [50, 0.004], [55, 0.0051], [60, 0.0067], [65, 0.010], [70, 0.0166], [75, 0.029], [80, 0.051], [85, 0.086], [90, 0.136], [95, 0.21], [100, 0.266]],
  m: [[40, 0.0058], [45, 0.0072], [50, 0.0088], [55, 0.011], [60, 0.0146], [65, 0.021], [70, 0.031], [75, 0.047], [80, 0.072], [85, 0.108], [90, 0.158], [95, 0.227], [100, 0.275]],
}
export const qx = (age: number, sex: 'm' | 'f') => byAge(age, QX[sex])
const roll = (seed: number, id: string) => {
  let h = seed
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2654435761)
  h ^= h >>> 15
  return ((h >>> 0) % 100000) / 100000
}
/** อายุแม่/พ่อตอนผู้เล่นเกิด: แม่ 28 ปี (UN), พ่อแก่กว่า 3 ปี (ประมาณ) */
export const PARENT_AGE = { mom: 28, dad: 31 }
/** พ่อแม่อยู่ถึงลูกอายุ 30 เสมอ (เพื่อเนื้อเรื่องวัยเด็ก) แล้วทอยตามตารางชีพ UN ทีละปี → คืน "อายุของผู้เล่น" ตอนที่พ่อ/แม่จากไป */
export function parentGoneAt(s: GameState, who: 'mom' | 'dad'): number {
  const sex = who === 'mom' ? 'f' : 'm'
  for (let a = 30; a < 75; a++) if (roll(s.seed, `${who}_life_${a}`) < qx(PARENT_AGE[who] + a, sex)) return a
  return 99
}
