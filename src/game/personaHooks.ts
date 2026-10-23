import type { Choice, GameState, Line, Scene } from './types'
import { PERSONA, personaPct, personaScore, type PersonaKey } from './persona'

/**
 * 🧬 ทำให้บุคลิก "มีผล" โดยไม่ต้องเพิ่มฉาก
 * 1) ตัวเลือกพิเศษที่โผล่เฉพาะคนที่มีนิสัยนั้นเด่น
 * 2) บทพูดในฉากเดิมเปลี่ยนตามนิสัยเด่นของเรา
 * 3) ประโยคสรุปชีวิตตอนจบ
 */

const count = (s: GameState, k: PersonaKey) => s.persona?.[k] ?? 0
/** นิสัยเด่น = ติด 2 อันดับแรกของตัวเอง และสะสมมาแล้วอย่างน้อย 2 ครั้ง */
export function hasTrait(s: GameState, k: PersonaKey) {
  const c = count(s, k)
  if (c < 2) return false
  const sc = personaScore(s, k)
  const higher = (Object.keys(PERSONA) as PersonaKey[]).filter((x) => personaScore(s, x) > sc).length
  return higher < 2
}
/** นิสัยเด่นที่สุด (ถ้ายังไม่มีอะไรเด่นชัด → undefined) */
export function topTrait(s: GameState): PersonaKey | undefined {
  const [a] = personaPct(s)
  return a && count(s, a.k) >= 2 ? a.k : undefined
}

// ───────── 1) ตัวเลือกพิเศษตามนิสัย ─────────
const WHY: Record<PersonaKey, string> = {
  kind: '❤️ เพราะคุณใจดี', greed: '💰 เพราะคุณทะเยอทะยาน', brave: '🔥 เพราะคุณกล้า', smart: '🧠 เพราะคุณคิดเป็นระบบ',
  selfish: '😈 เพราะคุณรักตัวเองก่อน', funny: '😂 เพราะคุณกวนเป็นนิสัย', endure: '💪 เพราะคุณอดทน', fragile: '💔 เพราะคุณกล้ายอมรับความรู้สึก',
}
const R = (text: string, who?: Line['who'], expr?: Line['expr']): Line[] => [{ text, who, expr }]
const T = (trait: PersonaKey, c: Choice): Choice => ({ ...c, trait, hint: WHY[trait], when: (s) => hasTrait(s, trait) && (!c.when || c.when(s)) })

export const TRAIT_CHOICES: Record<string, Choice[]> = {
  bully: [T('kind', { text: '🍪 แบ่งขนมให้พี่ ป.6 แล้วชวนคุยดี ๆ', effects: { friend: 3, social: 2 }, flags: ['saved_ton'], memory: 'ใช้ขนมกับคำพูดดี ๆ ช่วยต้นจากพี่ ป.6',
    result: [{ text: 'พี่ ป.6 งงไปพักหนึ่ง... แล้วก็คืนเงินให้ต้น "น้องคนนี้แปลกดีว่ะ"' }, { who: 'ton', expr: 'happy', text: 'นายนี่มันใจดีเกินไปแล้ว... แต่ขอบใจนะ!' }] })],
  crush: [T('brave', { text: '💬 บอกตรง ๆ "เราว่าเธอน่ารักนะ"', effects: { love: 4, happy: 1, social: 1 }, memory: 'บอกฟ้าตรง ๆ ตั้งแต่วันแรกว่าน่ารัก',
    result: [{ who: 'fah', expr: 'surprised', text: 'เอ๋!? ...ไม่เคยมีใครพูดแบบนี้ตั้งแต่วันแรกเลยนะ' }, { who: 'fah', expr: 'happy', text: 'งั้น... พักเที่ยงนั่งด้วยกันไหม' }] })],
  tonloan: [T('smart', { text: '📝 นั่งทำบัญชีหาทางออกกับต้น', effects: { friend: 2, smart: 1 }, memory: 'ช่วยต้นวางแผนการเงินแทนการให้ยืม',
    result: R('ตารางเอ็กเซลคืนนั้นทำให้ต้นเห็นว่าปัญหาไม่ได้ใหญ่อย่างที่คิด') })],
  ton_fah: [T('kind', { text: '🫂 ชวนสามคนคุยกันตรง ๆ', effects: { friend: 2, love: 1, happy: 1 }, memory: 'นั่งคุยสามคนกับต้นและฟ้าอย่างเปิดใจ',
    result: R('คุยกันจนร้านปิด... ไม่มีใครเสียเพื่อน และทุกคนรู้ใจตัวเองมากขึ้น') })],
  jay_startup: [T('greed', { text: '📈 ลงทุนแบบมีสัญญาถือหุ้น', fin: { cash: -300_000 }, outcomes: [
    { chance: 0.55, fin: { invest: 1_800_000 }, effects: { money: 1, social: 1 }, memory: 'ลงทุนในบริษัทเจแบบมีสัญญาจนได้กำไรงาม', result: R('อ่านสัญญาทุกบรรทัดคุ้มค่า บริษัทโตและหุ้นของคุณโตตาม') },
    { chance: 0.45, effects: { happy: -1 }, memory: 'ลงทุนบริษัทเจแต่บริษัทไปไม่รอด', result: R('สัญญาดีแค่ไหนก็กันบริษัทเจ๊งไม่ได้') },
  ] })],
  love: [T('brave', { text: '💍 "คบกันเถอะ แล้วแต่งงานกันเลย"', effects: { love: 5, happy: 2 }, flags: ['partner'], memory: 'ขอฟ้าคบพร้อมขอแต่งงานในประโยคเดียว',
    result: [{ who: 'fah', expr: 'surprised', text: 'ห๊ะ!? ...บ้าที่สุดเลย' }, { who: 'fah', expr: 'happy', text: '...แต่ตกลง' }] })],
  whistle: [T('selfish', { text: '💼 "สองล้าน แล้วผมจะลืมทุกอย่าง"', outcomes: [
    { chance: 0.5, fin: { cash: 2_000_000 }, flags: ['hush'], effects: { happy: -2 }, memory: 'ต่อรองค่าปิดปากได้สองล้าน', result: R('หัวหน้ากัดฟันโอนให้... คืนนั้นเงินเยอะ แต่นอนไม่หลับเลย') },
    { chance: 0.5, flags: ['fired'], effects: { happy: -2, social: -1 }, memory: 'เรียกค่าปิดปากจนโดนไล่ออก', result: R('"คุณกำลังขู่บริษัทเหรอ?" ...ข้าวของถูกใส่กล่องภายในชั่วโมง') },
  ] })],
  blame: [T('smart', { text: '🧾 ส่งอีเมลคำสั่งหัวหน้าให้ผู้บริหารเงียบ ๆ', outcomes: [
    { chance: 0.75, flags: ['promoted'], effects: { social: 1, happy: 2 }, memory: 'ใช้หลักฐานอีเมลพลิกสถานการณ์ในที่ทำงาน', result: R('ผู้บริหารอ่านแล้วเรียกหัวหน้าเข้าห้อง... สัปดาห์ต่อมาคุณได้ตำแหน่งแทน') },
    { chance: 0.25, effects: { happy: -1 }, memory: 'ส่งหลักฐานแล้วเรื่องเงียบหาย', result: R('ผู้บริหารตอบกลับแค่ "รับทราบ"... แล้วทุกอย่างก็เงียบ') },
  ] })],
  divorce: [T('kind', { text: '💌 เขียนจดหมายขอบคุณทุกอย่างที่ผ่านมา', effects: { love: 4, happy: 1 }, memory: 'เขียนจดหมายขอบคุณ{fah}จนเปลี่ยนใจไม่หย่า',
    result: [{ text: '{fah}อ่านจนจบ เงียบไปนาน...' }, { who: 'fah', expr: 'sad', text: 'เรายังจำได้ว่าทำไมถึงรักกัน... ลองใหม่อีกครั้งนะ' }] })],
  burnout: [T('fragile', { text: '😢 ยอมรับว่าไม่ไหว แล้วขอความช่วยเหลือ', fin: { cash: -30_000 }, effects: { happy: 3, family: 1, body: 1 }, memory: 'ยอมรับว่าหมดไฟ และไปพบจิตแพทย์',
    result: R('การบอกว่า "ไม่ไหว" ครั้งแรกในชีวิต... กลับทำให้ตัวเบาที่สุด') })],
  dadsick: [T('endure', { text: '💪 ย้ายกลับบ้าน ดูแลพ่อเต็มเวลา', effects: { family: 4, body: -1, money: -2 }, memory: 'ย้ายกลับบ้านมาดูแลพ่อเต็มเวลา',
    result: [{ text: 'กายภาพทุกเช้า ป้อนข้าวทุกมื้อ... จนพ่อลุกเดินได้เอง' }, { who: 'dad', expr: 'happy', text: 'ลูกพ่อนี่อึดกว่าพ่อซะอีก' }] })],
  jay_sorry: [T('kind', { text: '🍜 พาเจไปกินก๋วยเตี๋ยวร้านเดิม เหมือนไม่เคยมีอะไร', flags: ['forgave_jay'], bond: { jay: 8 }, effects: { happy: 4, friend: 2 }, memory: 'พาเจไปกินก๋วยเตี๋ยวร้านเดิมแทนคำให้อภัย',
    result: [{ who: 'jay', expr: 'sad', text: 'นายยังจำร้านนี้ได้อีกเหรอ...' }, { text: 'สองคนนั่งกินเงียบ ๆ เหมือนตอนอายุยี่สิบ ไม่มีใครพูดคำว่าขอโทษอีกเลย' }] })],
  lonely: [T('funny', { text: '🎤 ไลฟ์คาราโอเกะฉลองวันเกิดตัวเอง', effects: { social: 2, happy: 3 }, memory: 'ไลฟ์ร้องคาราโอเกะวันเกิดจนคนแปลกหน้ามาอวยพรเพียบ',
    result: R('คนดูสามคน... สามสิบ... สามร้อย! ข้อความ "HBD!" เด้งไม่หยุด') })],
  nong_fight: [T('smart', { text: '📜 ชวนน้องไปหาผู้ไกล่เกลี่ย แบ่งตามที่แม่ตั้งใจ', bond: { nong: 3 }, effects: { family: 2, smart: 1 }, memory: 'ไกล่เกลี่ยมรดกแม่กับน้องจนจบด้วยดี',
    result: R('ในลิ้นชักแม่มีโน้ตเขียนไว้ว่าอยากให้ใครได้อะไร... ทุกคนร้องไห้ แล้วก็ยิ้ม') })],
  retire: [T('brave', { text: '🎓 สมัครเรียนปริญญาโทตอน 60', fin: { cash: -150_000 }, effects: { smart: 3, happy: 2, social: 1 }, memory: 'กลับไปเรียนปริญญาโทตอนอายุ 60',
    result: R('เพื่อนร่วมชั้นอายุน้อยกว่าลูก... แต่คุณได้เกรดดีที่สุดในห้อง') })],
}

// ───────── 2) บทพูดที่เปลี่ยนตามนิสัยเด่น ─────────
/** มีหลาน (ลูกของเรา หรือลูกของน้องฝน) */
const hasGrandkid = (s: GameState) => s.flags.includes('kid') || s.flags.includes('met_nong')
/** บทพูดตามนิสัย: ใส่เป็นฟังก์ชันได้ ถ้าต้องเช็คสถานะ (คืน null = ไม่ใส่บทพูดนี้) */
type TraitLine = Line | ((s: GameState) => Line | null)
export const TRAIT_LINES: Record<string, Partial<Record<PersonaKey, TraitLine>>> = {
  bully: {
    kind: { who: 'ton', expr: 'sad', text: '(ต้นมองมาเหมือนรู้ว่า {name} ต้องช่วยแน่ ๆ)' },
    selfish: { who: 'ton', expr: 'sad', text: '...แต่นายคงไม่ช่วยเราหรอก ใช่ไหม' },
    fragile: { text: '{name} มือสั่น... ภาพพี่ ป.6 ตัวใหญ่กว่าเราสองเท่า' },
  },
  crush: {
    funny: { who: 'fah', expr: 'happy', text: 'เห็นเธอหัวเราะเสียงดังที่สุดในห้องเลย ขอนั่งใกล้ ๆ ได้ไหม' },
    smart: { who: 'fah', expr: 'neutral', text: 'ได้ยินว่าเธอเรียนเก่งที่สุดในห้อง... ติวให้หน่อยสิ' },
    brave: { who: 'fah', expr: 'happy', text: 'เธอคือคนที่ยกมือเถียงครูเมื่อเช้าใช่ไหม เท่ดีนะ' },
  },
  tcas: {
    greed: { who: 'dad', text: 'พ่อรู้ว่าลูกอยากรวย... แต่เลือกสิ่งที่ทำได้นาน ๆ นะ' },
    kind: { who: 'mom', expr: 'happy', text: 'ลูกชอบช่วยคนอื่น แม่ว่าเลือกอะไรก็ไปได้ดี' },
    fragile: { who: 'mom', text: 'ไม่ต้องกดดันตัวเองนะลูก สอบไม่ติดก็ยังมีทางอื่น' },
  },
  tonloan: {
    kind: { who: 'ton', expr: 'sad', text: 'เราไม่รู้จะไปหาใคร... นายเป็นคนเดียวที่ไม่เคยทิ้งเรา' },
    greed: { who: 'ton', expr: 'sad', text: 'รู้ว่านายเก็บเงินเก่ง... ขอยืมหน่อยได้ไหม จะคืนพร้อมดอก' },
    selfish: { who: 'ton', expr: 'sad', text: 'รู้ว่านายไม่ชอบเรื่องเงิน... แต่เราไม่มีทางแล้วจริง ๆ' },
  },
  career: {
    brave: { text: 'ใจหนึ่งอยากลองอะไรที่ไม่มีใครกล้าทำ...' },
    smart: { text: 'เปิดตารางเปรียบเทียบเงินเดือนทุกอาชีพที่ทำไว้ตั้งแต่ปีสาม...' },
    endure: { text: 'งานไหนก็ได้ ขอแค่ได้เริ่ม — ที่เหลือจะอดทนเอาเอง' },
  },
  love: {
    brave: { who: 'fah', expr: 'happy', text: 'เธอยังเป็นคนพูดตรงเหมือนเดิมไหม? ...เพราะเรามีเรื่องอยากได้ยินตรง ๆ' },
    fragile: { who: 'fah', expr: 'neutral', text: 'ไม่ต้องรีบตอบนะ เรารู้ว่าเธอคิดเยอะ' },
    funny: { who: 'fah', expr: 'happy', text: 'ยังเล่นมุกแป้กเหมือนเดิมเลยนะ ฮ่า ๆ คิดถึงจัง' },
  },
  wedding: {
    kind: { who: 'mom', expr: 'happy', text: 'ลูกแม่ใจดีกับทุกคนมาตลอด วันนี้ถึงตาลูกได้รับบ้างแล้วนะ' },
    // ต้นขึ้นพูดได้เฉพาะตอนยังเป็นเพื่อนกันอยู่ (ไม่ได้แตกหักกันเรื่องฟ้า/เงิน)
    funny: (s) => (s.stats.friend >= 2 && !s.flags.includes('betrayed') ? { who: 'ton', expr: 'happy', text: 'สุนทรพจน์เจ้าบ่าวเจ้าสาวต้องฮาแน่ คนนี้กวนมาตั้งแต่ ป.1' } : null),
    greed: { who: 'dad', text: 'งบงานแต่งพ่อดูแล้ว... ลูกคุมได้ดีกว่าพ่ออีก' },
  },
  blame: {
    brave: { who: 'boss', expr: 'angry', text: 'และอย่าคิดจะเถียงเหมือนทุกครั้งนะ!' },
    fragile: { who: 'boss', expr: 'angry', text: 'ร้องไห้ก็ไม่ช่วยอะไรหรอก!' },
    smart: { who: 'boss', expr: 'angry', text: 'ไม่ต้องมาเปิดเอกสารอะไรทั้งนั้น ผมรู้ว่าคุณจดทุกอย่าง!' },
  },
  divorce: {
    selfish: { who: 'fah', expr: 'sad', text: 'ตลอดมาเราเป็นคนเดียวที่พยายาม...' },
    endure: { who: 'fah', expr: 'sad', text: 'เธออดทนกับทุกอย่าง... ยกเว้นการคุยกับเรา' },
    kind: { who: 'fah', expr: 'sad', text: 'เธอใจดีกับทุกคนในโลก... แต่ลืมใจดีกับเราไปหรือเปล่า' },
  },
  burnout: {
    endure: { text: '"แค่นี้ยังไหว" — ประโยคเดิมที่พูดกับตัวเองมาสิบปี' },
    greed: { text: 'เป้ายอดขายไตรมาสหน้ายังลอยอยู่ในหัว แม้กำลังนอนให้น้ำเกลือ' },
    funny: { text: 'พยาบาลถามว่าเป็นอะไร... ตอบว่า "เป็นพนักงานดีเด่นครับ" แล้วหัวเราะคนเดียว' },
  },
  dadsick: {
    kind: { who: 'mom', expr: 'sad', text: 'แม่รู้ว่าลูกต้องรีบกลับมาแน่ ๆ' },
    greed: { who: 'mom', expr: 'sad', text: 'แม่รู้ว่าลูกงานยุ่ง... แต่พ่ออยากเห็นหน้าลูก' },
    selfish: { who: 'mom', expr: 'sad', text: 'ไม่ได้โทรหาตั้งนาน... แต่ครั้งนี้แม่ต้องโทร' },
  },
  lonely: {
    kind: { text: 'แปลก... ทุกปีเป็นคนจำวันเกิดทุกคน แต่ปีนี้ไม่มีใครจำของเรา' },
    greed: { text: 'บัญชีมีเงินมากกว่าที่เคยฝัน... แต่โทรศัพท์เงียบกว่าที่เคยเป็น' },
    brave: { text: 'เคยคิดว่าอยู่คนเดียวได้สบาย... จนถึงคืนนี้' },
  },
  retire: {
    endure: { text: 'สี่สิบปีที่ไม่เคยลาป่วย... พรุ่งนี้ไม่ต้องตั้งนาฬิกาปลุกแล้ว' },
    funny: { text: 'งานเลี้ยงเกษียณ เพื่อนร่วมงานทำคลิปรวมมุกของคุณยาวยี่สิบนาที' },
    greed: { text: 'เงินเก็บพอแล้วจริงเหรอ? นิสัยเก่ายังคำนวณไม่หยุด' },
  },
  finale: {
    kind: { text: 'คนที่มาร่วมงานวันนี้... เกินครึ่งคือคนที่คุณเคยช่วยไว้' },
    brave: { text: 'แขกในงานเล่าวีรกรรมบ้า ๆ ของคุณกันไม่หยุด' },
    smart: (s) => ({ text: `${hasGrandkid(s) ? 'หลาน' : 'เด็กข้างบ้าน'}ถามว่า "ทำไมคุณรู้ทุกเรื่องเลย" ทั้งงานหัวเราะ` }),
    endure: { text: 'ไม่มีใครในงานไม่เคยเห็นคุณสู้... และไม่มีใครเคยเห็นคุณยอมแพ้' },
    fragile: { text: 'คุณร้องไห้ตั้งแต่ยังไม่ได้เป่าเค้ก... และทุกคนก็ร้องตาม' },
    funny: (s) => ({ text: `เค้กรูปหน้าคุณทำหน้าทะเล้น — ไอเดียของ${hasGrandkid(s) ? 'หลาน' : 'เด็ก ๆ ข้างบ้าน'}` }),
    greed: { text: 'ของขวัญกองโต... แต่คุณมองหาแค่ใบหน้าคนที่รัก' },
    selfish: { text: 'งานเลี้ยงที่คุณจัดเอง เลือกเพลงเอง เมนูที่ชอบเองทั้งหมด' },
  },
}

/** ใส่บทพูดตามนิสัยไว้ก่อนบรรทัดสุดท้าย (บรรทัดสุดท้ายคือคำถามของฉาก) */
export function withTraitLines(sc: Scene): Scene {
  const map = TRAIT_LINES[sc.id]
  const extra = TRAIT_CHOICES[sc.id]
  if (!map && !extra) return sc
  const base = sc.lines
  return {
    ...sc,
    ...(extra ? { choices: [...(sc.choices ?? []), ...extra] } : {}),
    ...(map ? {
      lines: (s: GameState, o?: unknown) => {
        const ls = typeof base === 'function' ? (base as (s: GameState, o?: unknown) => Line[])(s, o) : base ?? []
        const t = topTrait(s)
        const m = t && map[t]
        const l = typeof m === 'function' ? m(s) : m
        if (!l) return ls
        return ls.length <= 1 ? [l, ...ls] : [...ls.slice(0, -1), l, ls[ls.length - 1]]
      },
    } : {}),
  }
}

// ───────── 3) ประโยคสรุปชีวิต ─────────
const HIGH: Record<PersonaKey, string> = {
  kind: 'คนใจดีที่ไม่เคยทิ้งใคร', greed: 'นักไล่ล่าความสำเร็จ', brave: 'คนใจกล้าที่ไม่เคยถอย', smart: 'นักคิดที่วางแผนทุกก้าว',
  selfish: 'คนที่รักตัวเองเป็นอันดับแรก', funny: 'ตัวตลกที่ทำให้ทุกคนหัวเราะ', endure: 'นักสู้ที่ไม่เคยยอมแพ้', fragile: 'หัวใจอ่อนไหวที่รู้สึกทุกอย่างลึกกว่าใคร',
}
const LOW: Partial<Record<PersonaKey, string>> = {
  brave: 'ไม่กล้าเสี่ยง', kind: 'ไม่ค่อยเผื่อแผ่ใคร', smart: 'ไม่ค่อยคิดก่อนทำ', endure: 'ยอมแพ้ง่าย',
  funny: 'จริงจังกับชีวิตเกินไป', greed: 'ไม่สนเรื่องเงินเลย',
}
const AND: Record<PersonaKey, string> = {
  kind: 'ใจดีกับทุกคน', greed: 'ไม่เคยพอใจแค่นี้', brave: 'กล้าได้กล้าเสีย', smart: 'คิดก่อนทำเสมอ',
  selfish: 'เลือกตัวเองก่อนเสมอ', funny: 'หัวเราะได้ในทุกสถานการณ์', endure: 'อดทนกว่าใคร', fragile: 'ร้องไห้ง่ายแต่ลุกได้ทุกครั้ง',
}
/** "คุณใช้ชีวิตแบบคนใจดีที่ไม่เคยทิ้งใคร แต่ไม่กล้าเสี่ยง" */
export function personaSentence(s: GameState): string {
  const ps = personaPct(s)
  const [a, b] = ps
  if (!a || a.pct === 0) return 'คุณใช้ชีวิตแบบไหลไปตามกระแส ไม่ได้เลือกอะไรชัด ๆ สักทาง'
  const weak = ps.filter((p) => p.k !== a.k && LOW[p.k] && p.pct <= Math.max(15, a.pct * 0.25)).pop()
  if (weak) return `คุณใช้ชีวิตแบบ${HIGH[a.k]} แต่${LOW[weak.k]}`
  if (b && b.pct >= a.pct * 0.6) return `คุณใช้ชีวิตแบบ${HIGH[a.k]} และ${AND[b.k]}`
  return `คุณใช้ชีวิตแบบ${HIGH[a.k]}`
}
