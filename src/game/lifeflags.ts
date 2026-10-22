import type { GameState, Scene } from './types'

/**
 * 🚩 ธงชีวิต (Life Flags) — ทางเลือกสำคัญจะ "ปักธง" ไว้
 * แล้วฉากในอนาคตจะตรวจธงเหล่านี้ (เกิด / ไม่เกิด / เปลี่ยนผล)
 */
export interface LifeFlag { icon: string; label: string; tone: 'good' | 'bad' | 'neutral'; effect: string }
export const LIFE_FLAGS: Record<string, LifeFlag> = {
  nong_kind: { icon: '👧', label: 'ดีกับน้องฝน', tone: 'good', effect: 'น้องฝนจะจำความดีนี้ไว้' },
  nong_hurt: { icon: '💔', label: 'ทำร้ายใจน้องฝน', tone: 'bad', effect: 'น้องฝนอาจไม่ลืม' },
  nong_t1_visit: { icon: '❤️', label: 'ไปหาน้องฝนตอนเธอโทรมา', tone: 'good', effect: 'อาจถูกขอให้อยู่ในวันสำคัญของเธอ' },
  nong_t1_ignore: { icon: '📵', label: 'ไม่รับสายน้องฝน', tone: 'bad', effect: 'ความห่างเหินจะตามมา' },
  nong_t2_repaid: { icon: '💸', label: 'คืนเงินน้องพร้อมดอก', tone: 'good', effect: 'ความไว้ใจงอกเงย' },
  saved_ton: { icon: '✋', label: 'ช่วยต้นตอนโดนแกล้ง', tone: 'good', effect: 'ต้นจะไม่มีวันลืม' },
  ignored_ton: { icon: '🙈', label: 'ทิ้งต้นตอนโดนแกล้ง', tone: 'bad', effect: 'มิตรภาพมีรอยร้าว' },
  helped_ton: { icon: '🤝', label: 'ช่วยแม่ของต้น', tone: 'good', effect: 'ครอบครัวต้นเป็นหนี้บุญคุณ' },
  yai_goodbye: { icon: '👵', label: 'อยู่ข้างยายวันสุดท้าย', tone: 'good', effect: 'ยายทิ้งอะไรไว้ให้...' },
  missed_yai: { icon: '🥀', label: 'ไปหายายไม่ทัน', tone: 'bad', effect: 'ความเสียดายติดตัว' },
  path_work: { icon: '🎓', label: 'ไม่เรียนต่อมหาลัย', tone: 'neutral', effect: 'วันหนึ่งอาจได้โอกาสเรียนอีกครั้ง' },
  saver: { icon: '🐷', label: 'ออมตั้งแต่เงินเดือนแรก', tone: 'good', effect: 'ดอกเบี้ยทบต้นกำลังทำงาน' },
  insured: { icon: '🛡️', label: 'ทำประกันไว้', tone: 'good', effect: 'เรื่องร้ายจะเบาลง' },
  spender: { icon: '🛍️', label: 'ใช้เงินเดือนหมดทุกเดือน', tone: 'bad', effect: 'ไม่มีเงินสำรองยามฉุกเฉิน' },
  cofounder: { icon: '🚀', label: 'ร่วมก่อตั้งบริษัทกับเจ', tone: 'good', effect: 'หุ้นส่วนตลอดชีวิต' },
  jay_betray: { icon: '🗡️', label: 'โดนเจหักหลัง', tone: 'bad', effect: 'แผลในใจรอวันสะสาง' },
  betrayed_jay: { icon: '🦊', label: 'หักหลังเจ', tone: 'bad', effect: 'เจจะไม่ช่วยคุณอีก' },
  honest: { icon: '🪙', label: 'ซื่อสัตย์', tone: 'good', effect: 'ความดีอาจย้อนกลับมา' },
  hero: { icon: '🦸', label: 'เคยช่วยชีวิตคน', tone: 'good', effect: 'มีคนตามหาคุณอยู่' },
  hush: { icon: '🤐', label: 'รับเงินปิดปาก', tone: 'bad', effect: 'ความลับไม่มีวันตาย' },
  scammer: { icon: '🃏', label: 'หลอกคนลงแชร์', tone: 'bad', effect: 'กรรมตามทัน' },
  cheated: { icon: '💋', label: 'นอกใจคนรัก', tone: 'bad', effect: 'ความสัมพันธ์เปราะบาง' },
  divorced: { icon: '💔', label: 'หย่าร้าง', tone: 'bad', effect: 'บ้านเงียบลง' },
  kid: { icon: '👶', label: 'มีลูก', tone: 'good', effect: 'ส่งต่อตระกูลได้' },
  coco: { icon: '🐶', label: 'รับโกโก้มาเลี้ยง', tone: 'good', effect: 'เพื่อนสี่ขาจะปกป้องบ้าน' },
  missed_coco: { icon: '🐾', label: 'ไม่ได้ลาโกโก้', tone: 'bad', effect: 'ความรู้สึกผิดเล็ก ๆ' },
  kru_tree: { icon: '🌳', label: 'เล่นเป็นต้นไม้ที่ดีที่สุด', tone: 'good', effect: 'ครูยังจำได้' },
  olympiad: { icon: '🥉', label: 'ไปค่ายโอลิมปิก', tone: 'good', effect: 'ครูภูมิใจตลอดไป' },
  camp_library: { icon: '⛺', label: 'สร้างห้องสมุดบนดอย', tone: 'good', effect: 'เด็กบนดอยคนหนึ่งจำคุณได้' },
  exchanged: { icon: '🗾', label: 'ไปแลกเปลี่ยนญี่ปุ่น', tone: 'good', effect: 'มีเพื่อนต่างแดน' },
  sibling_war: { icon: '⚖️', label: 'ฟ้องมรดกกับน้อง', tone: 'bad', effect: 'พี่น้องตัดขาด' },
  cut_family: { icon: '🚪', label: 'ตัดขาดครอบครัว', tone: 'bad', effect: 'ไม่มีใครรอที่บ้าน' },
  rebel: { icon: '✊', label: 'กล้าเถียงระบบ', tone: 'neutral', effect: 'คนจะจำความกล้านี้' },
  donor: { icon: '🙏', label: 'บริจาคสร้างศาลา', tone: 'good', effect: 'บุญหนุนนำ' },
  back_to_school: { icon: '📜', label: 'กลับไปเรียนจนจบ', tone: 'good', effect: 'ไม่สายเกินไป' },
}
export const labeledFlags = (s: GameState) => s.flags.filter((f) => LIFE_FLAGS[f]).map((f) => ({ id: f, ...LIFE_FLAGS[f], age: s.flagAt?.[f] }))

const has = (s: GameState, f: string) => s.flags.includes(f)
const at = (s: GameState, f: string) => s.flagAt?.[f]

/** ฉากที่ "ตรวจธง" เพิ่มเติม */
export const FLAG_SCENES: Scene[] = [
  // ถ้า ดีกับน้องฝน → ฝนช่วยตอนชีวิตตกต่ำ
  ...[30, 36, 42, 48, 54, 60].map((age): Scene => ({
    id: `fl_rain_${age}`, age, bg: 'home', cast: ['nong', 'me'], call: { who: 'nong', kind: 'call' }, title: '📱 น้องฝนโทรมา',
    when: (s) => (has(s, 'nong_kind') || has(s, 'nong_t1_visit')) && !has(s, 'sibling_war') && !has(s, 'fl_rain') && (s.cash < 10_000 || s.debt > 1_000_000),
    because: (s) => `🚩 ธง "ดีกับน้องฝน" ตั้งแต่อายุ ${at(s, 'nong_kind') ?? at(s, 'nong_t1_visit')}`,
    lines: () => [{ who: 'nong', text: 'หนูรู้นะว่าพี่กำลังลำบาก... ตอนหนูเด็กพี่ดูแลหนู ตอนนี้ให้หนูดูแลพี่บ้าง' }],
    choices: [
      { text: '🥹 รับความช่วยเหลือ', flags: ['fl_rain'], fin: { cash: 250_000 }, effects: { family: 2, happy: 2 }, bond: { nong: 2 }, memory: 'น้องฝนช่วยในวันที่ชีวิตตกต่ำที่สุด',
        result: [{ who: 'nong', expr: 'happy', text: 'ไม่ต้องคืนนะพี่ ถือว่าหนูคืนตุ๊กตาตัวนั้น' }] },
      { text: '🙏 ขอแค่กำลังใจพอ', flags: ['fl_rain'], effects: { happy: 3 }, bond: { nong: 3 }, memory: 'ขอแค่กำลังใจจากน้องฝน',
        result: [{ text: 'คุยโทรศัพท์จนตีสอง หัวใจเบาขึ้นมาก' }] },
    ],
  })),
  // ถ้า ไม่เรียนต่อ → โอกาสกลับไปเรียน
  ...[32, 38, 44].map((age): Scene => ({
    id: `fl_school_${age}`, age, bg: 'campus', cast: ['me'], title: '🎓 โอกาสครั้งที่สอง',
    when: (s) => has(s, 'path_work') && !has(s, 'fl_school'),
    because: (s) => `🚩 ธง "ไม่เรียนต่อมหาลัย" ตั้งแต่อายุ ${at(s, 'path_work')}`,
    lines: [{ text: 'มหาวิทยาลัยเปิดหลักสูตรเรียนวันเสาร์-อาทิตย์สำหรับคนทำงาน... ยังทันไหมนะ?' }],
    choices: [
      { text: '📚 สมัครเรียน', flags: ['fl_school', 'back_to_school'], fin: { cash: -120_000 }, effects: { smart: 3, happy: 1, body: -1 }, memory: 'กลับไปเรียนปริญญาตรีตอนโต',
        result: [{ text: 'สี่ปีต่อมา ใส่ชุดครุยถ่ายรูปกับพ่อแม่ที่ผมหงอกแล้ว' }] },
      { text: '🙅 ชีวิตนี้ดีอยู่แล้ว', flags: ['fl_school'], effects: { happy: 1 }, memory: 'ไม่กลับไปเรียนต่อ',
        result: [{ text: 'ประสบการณ์ก็คือมหาลัยของชีวิต' }] },
    ],
  })),
  // ถ้า ออมตั้งแต่เงินเดือนแรก → ดอกเบี้ยทบต้นออกผล
  {
    id: 'fl_saver', age: 45, bg: 'office', cast: ['me'], title: '📈 พลังดอกเบี้ยทบต้น',
    when: (s) => has(s, 'saver'),
    because: (s) => `🚩 ธง "ออมตั้งแต่เงินเดือนแรก" ตั้งแต่อายุ ${at(s, 'saver')}`,
    lines: (s) => [{ text: `เปิดดูพอร์ตที่ออมไว้ตั้งแต่อายุ ${at(s, 'saver')}... ตัวเลขทำให้ต้องขยี้ตา` }],
    choices: [
      { text: '🏖️ เกษียณเร็ว', fin: { invest: 1_500_000 }, effects: { happy: 3 }, flags: ['early_retire'], memory: 'เงินออมทบต้นทำให้เกษียณเร็วได้',
        result: [{ text: 'อายุ 45 ก็มีอิสรภาพทางการเงินแล้ว' }] },
      { text: '📈 ลงทุนต่อ', fin: { stock: 2_000_000 }, effects: { money: 1 }, memory: 'เงินออมตั้งแต่หนุ่มสาวงอกเงยเป็นล้าน',
        result: [{ text: 'ตัวเองตอนอายุ 23 คือคนที่ต้องขอบคุณที่สุด' }] },
    ],
  },
]
