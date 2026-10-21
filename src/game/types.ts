export type StatKey =
  | 'smart' // ความรู้
  | 'body' // ร่างกาย
  | 'art' // ศิลปะ
  | 'social' // เข้าสังคม
  | 'happy' // ความสุข
  | 'money' // เงิน
  | 'family' // ครอบครัว (ค่าซ่อน)
  | 'friend' // มิตรภาพกับต้น (ค่าซ่อน)
  | 'love' // ความรัก (ค่าซ่อน)

export type Stats = Record<StatKey, number>

export type CharId = 'me' | 'mom' | 'dad' | 'yai' | 'ton' | 'kru' | 'fah' | 'boss' | 'kid' | 'nong' | 'jay' | 'coco'
/** ตัวละครที่ผูกสัมพันธ์ได้ */
export type BondId = 'nong' | 'jay' | 'coco'
export type Bonds = Partial<Record<BondId, number>>
export type Expr = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry'

export type BgId =
  | 'hospital' | 'home' | 'village' | 'classroom' | 'schoolyard' | 'campus'
  | 'city' | 'office' | 'park' | 'wedding' | 'garden' | 'festival' | 'sky'

export type Gender = 'boy' | 'girl'

export interface GameState {
  name: string
  gender: Gender
  hair: string
  stats: Stats
  flags: string[]
  career: string | null
  /** อายุที่เริ่มอาชีพปัจจุบัน (คิดขึ้นเงินเดือน) */
  careerSince?: number
  history: { age: number; text: string }[]
  sceneId: string
  seed: number
  /** ฉากจบที่บังคับ (ตายก่อนวัย / ติดคุก / เอเลี่ยน ฯลฯ) */
  endId?: string
  endAge?: number
  /** เงินสด / เงินลงทุน / หนี้ (บาท) */
  cash: number
  invest: number
  debt: number
  /** ความฝัน (เป้าหมายชีวิต) และไพ่ดวงชะตาตอนเกิด */
  dream?: string
  trait?: string
  /** ทางเลือกที่เลือกไปแล้ว (sceneId|text) */
  picks?: string[]
  /** โหมดสองชาติ */
  mode?: 'reborn'
  life?: 1 | 2
  past?: PastLife
  /** ความสัมพันธ์กับตัวละครใหม่ 0–10 */
  bonds?: Bonds
  /** ฉากที่ผ่านมาแล้วในชีวิตนี้ / ฉากที่ชีวิตก่อนเจอ (ลดโอกาสซ้ำ) */
  visited?: string[]
  /** อายุที่ได้ flag แต่ละตัว (ใช้กับเส้นเรื่องต่อเนื่อง) */
  flagAt?: Record<string, number>
  /** บุคลิกที่สะสมจากการเลือก */
  persona?: Partial<Record<'kind' | 'greed' | 'brave' | 'smart' | 'selfish' | 'funny' | 'endure' | 'fragile', number>>
  /** ทางที่ไม่ได้เลือก */
  roads?: { age: number; scene: string; chose: string; other: string; who?: CharId }[]
  avoid?: string[]
  /** รุ่นต่อรุ่น */
  gen?: number
  lineageId?: string
  lineage?: Ancestor[]
  heirloom?: string
}

/** บรรพบุรุษ (รุ่นก่อน ๆ ในตระกูล) */
export interface Ancestor {
  name: string
  gender: Gender
  age: number
  endingId: string
  emoji: string
  title: string
  kind: 'good' | 'bad' | 'weird'
  career: string | null
  net: number
  heirloom?: string
  words?: string
  history: { age: number; text: string }[]
}

export interface PastLife {
  name: string
  gender: Gender
  endingId: string
  endingTitle: string
  emoji: string
  kind: 'good' | 'bad' | 'weird'
  career: string | null
  age: number
  net: number
  dream?: string
  dreamOk: boolean
  karma: number
  picks: string[]
  history: { age: number; text: string }[]
  flags?: string[]
}

/** การเปลี่ยนแปลงทางการเงิน (บาท) */
export interface Fin {
  cash?: number
  invest?: number
  debt?: number
  cashMul?: number
  investMul?: number
}

export interface Line {
  who?: CharId // ไม่ใส่ = คำบรรยาย
  text: string
  expr?: Expr
}

export type Lines = Line[] | ((s: GameState) => Line[])

export interface Outcome {
  chance: number
  effects?: Partial<Stats>
  flags?: string[]
  result?: Lines
  end?: string
  memory?: string
  fin?: Fin
  bond?: Bonds
}

export interface Choice {
  text: string
  hint?: string
  /** ตัวเลือกพิเศษที่ปลดล็อกจากนิสัยเด่น */
  trait?: 'kind' | 'greed' | 'brave' | 'smart' | 'selfish' | 'funny' | 'endure' | 'fragile'
  when?: (s: GameState) => boolean
  effects?: Partial<Stats>
  flags?: string[]
  career?: string
  result?: Lines
  /** ใส่สั้น ๆ ไว้สรุปชีวิตตอนจบ */
  memory?: string
  /** จบเกมทันทีด้วยฉากจบนี้ */
  end?: string
  /** เงินเข้า/ออก/หนี้ (บาท) */
  fin?: Fin
  /** ความสัมพันธ์ +/− */
  bond?: Bonds
  /** ลบธง (เช่น แต่งงานใหม่หลังหย่า) */
  unflags?: string[]
  /** ล็อกทางเลือก: คืนข้อความเหตุผล (เช่น "ต้องมีความรู้ 7+") ถ้ายังเลือกไม่ได้ */
  lock?: (s: GameState) => string | false | undefined
  /** ถ้าหมดเวลา จะถูกเลือกอัตโนมัติ */
  onTimeout?: boolean
  /** ผลแบบสุ่ม (เสี่ยงดวง) — สุ่มเลือกหนึ่งอันตาม chance */
  outcomes?: Outcome[]
}

export interface Scene {
  id: string
  age: number
  bg: BgId
  title?: string
  /** ตัวละครบนฉาก (ซ้าย→ขวา) */
  cast?: CharId[] | ((s: GameState) => CharId[])
  when?: (s: GameState) => boolean
  /** โอกาสเกิด 0–1 สำหรับเหตุการณ์สุ่ม */
  chance?: number
  /** ถ้าเงื่อนไขนี้จริง ฉากจะเกิดแน่นอน (ข้าม chance) */
  force?: (s: GameState) => boolean
  lines: Lines
  choices?: Choice[]
  /** จำกัดเวลาเลือก (วินาที) */
  timer?: number
  /** มินิเกมแทนการเลือก: ให้รางวัลตามคะแนน 0–1 */
  minigame?: 'tap' | 'math' | 'catch' | 'memory' | 'timing'
  /** ข้อความ "ผลจากอดีต" — บอกว่าฉากนี้เกิดเพราะทางเลือกไหน */
  because?: (s: GameState) => string | null | undefined | false
  /** ฉากโทรศัพท์/แชต */
  call?: { who: CharId; kind: 'call' | 'chat'; time?: string }
  /** ป้ายพิเศษบนการ์ดอายุ เช่น กรรม / เหตุการณ์น่ากลัว */
  mark?: 'karma' | 'fear' | 'memory'
  reward?: (score: number) => { effects: Partial<Stats>; memory: string; flags?: string[]; text: string; bond?: Bonds }
}

export interface Ending {
  id: string
  kind: 'good' | 'bad' | 'weird'
  title: string
  emoji: string
  desc: string
}
