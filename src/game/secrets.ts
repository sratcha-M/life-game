import type { Choice, GameState, Scene } from './types'

/**
 * 🔒 SECRET EVENTS — ฉากลับที่เกิดเมื่อเงื่อนไขหลายอย่างตรงกันพอดี
 * ผู้เล่นจะไม่รู้เงื่อนไขจนกว่าจะค้นพบ (ในอัลบั้มมีแค่คำใบ้)
 */
const has = (s: GameState, f: string) => s.flags.includes(f)
const mem = (s: GameState, re: RegExp) => s.history.some((h) => re.test(h.text))

export interface Secret { no: number; title: string; hint: string; conds: string[] }
export const SECRETS: Secret[] = [
  { no: 1, title: 'คนแปลกหน้าที่คุณเคยช่วย', hint: 'ความดีที่เคยทำ อาจย้อนกลับมาในวันที่ลำบากที่สุด', conds: ['เงินสดเหลือต่ำกว่า ฿1,000', 'มีเพื่อนสนิท (มิตรภาพ 5+ หรือสนิทใครสักคน 6+)', 'เคยช่วยคนแปลกหน้า (ช่วยคนเจ็บ / คืนกระเป๋าเงิน)'] },
  { no: 2, title: 'กล่องไม้ของยาย', hint: 'คนที่อยู่ข้างเราในวันสุดท้าย มักทิ้งอะไรไว้ให้', conds: ['อยู่ข้างยายในวันสุดท้าย', 'ครอบครัว 7+', 'อายุ 40'] },
  { no: 3, title: 'หมาตัวเดิมในชาติใหม่', hint: 'ความผูกพันบางอย่าง ข้ามชาติได้', conds: ['โหมดชาติที่ 2', 'ชาติก่อนสนิทกับโกโก้มาก'] },
  { no: 4, title: 'เพื่อนจากดวงดาว', hint: 'มีบางคนบนฟ้า ยังจำครอบครัวคุณได้', conds: ['ชาติก่อน หรือบรรพบุรุษ ขึ้นยานไปกับเอเลี่ยน'] },
  { no: 5, title: 'ห้องใต้หลังคาของทวด', hint: 'ตระกูลที่ยืนยาว ย่อมมีของเก่าซ่อนอยู่', conds: ['ตระกูลรุ่นที่ 3 ขึ้นไป'] },
  { no: 6, title: 'คอนเสิร์ตรวมวง', hint: 'วงดนตรีสมัยเรียน... ยังไม่เคยเล่นเพลงสุดท้าย', conds: ['เคยตั้งวงดนตรีกับต้นตอน ม.ปลาย', 'มิตรภาพ 6+', 'อายุ 45'] },
  { no: 7, title: 'รางวัลคนธรรมดา', hint: 'คนที่ไม่เคยคิดว่าตัวเองเป็นคนดี', conds: ['ซื่อสัตย์ (คืนของ/สารภาพผิด)', 'เคยช่วยชีวิตคน', 'ไม่เคยรับเงินปิดปาก'] },
  { no: 8, title: 'เราเคยเจอกันมาก่อนไหม?', hint: 'รักในชาติก่อน อาจจำกันได้ในชาตินี้', conds: ['โหมดชาติที่ 2', 'ชาติก่อนแต่งงานกับฟ้า'] },
]

const SEC_KEY = 'lifepath.secrets.v1'
export const foundSecrets = (): number[] => { try { return JSON.parse(localStorage.getItem(SEC_KEY) || '[]') } catch { return [] } }
/** คืน true ถ้าเพิ่งค้นพบครั้งแรก */
export function discoverSecret(no: number) {
  const f = foundSecrets()
  if (f.includes(no)) return false
  try { localStorage.setItem(SEC_KEY, JSON.stringify([...f, no])) } catch { /* ignore */ }
  return true
}
export const secretNo = (sceneId: string) => (sceneId.startsWith('secret') ? +sceneId.slice(6, 8) : 0)
export const secretTag = (no: number) => `🔒 SECRET EVENT ${String(no).padStart(2, '0')}`

/** สร้างฉากลับ (อาจเกิดได้หลายช่วงอายุ แต่เกิดครั้งเดียวต่อชีวิต) */
function secret(no: number, ages: number[], base: Omit<Scene, 'id' | 'age' | 'title'>, cond: (s: GameState, age: number) => boolean): Scene[] {
  const flag = `secret_${no}`
  const tag = (c: Choice): Choice => ({ ...c, flags: [...(c.flags ?? []), flag] })
  return ages.map((age) => ({
    ...base, id: `secret${String(no).padStart(2, '0')}_${age}`, age, title: secretTag(no),
    when: (s: GameState) => !has(s, flag) && cond(s, age),
    choices: base.choices?.map(tag),
    reward: base.reward,
  }))
}

const closeFriend = (s: GameState) => s.stats.friend >= 5 || Object.values(s.bonds ?? {}).some((v) => (v ?? 0) >= 6)
const helpedStranger = (s: GameState) => has(s, 'hero') || has(s, 'honest') || mem(s, /ช่วยชีวิต|เอาไปคืน|ช่วยคนประสบ/)
const pastAlien = (s: GameState) => s.past?.endingId === 'alien' || !!s.lineage?.some((a) => a.endingId === 'alien')

export const SECRET_SCENES: Scene[] = [
  ...secret(1, [27, 34, 41, 48, 55, 62], {
    bg: 'city', cast: ['me'],
    lines: [
      { text: 'เงินในบัญชีเหลือไม่ถึงพัน... มีชายใส่สูทยืนรออยู่หน้าห้อง' },
      { text: '"จำผมได้ไหมครับ? วันนั้นคุณช่วยผมไว้ ผมตามหาคุณมาหลายปี"' },
    ],
    choices: [
      { text: '🤝 รับความช่วยเหลือ', fin: { cash: 500_000 }, effects: { happy: 3 }, memory: 'คนแปลกหน้าที่เคยช่วยไว้ กลับมาช่วยในวันที่หมดตัว',
        result: [{ text: '"ถือว่าผมคืนบุญคุณนะครับ" เขายื่นซองหนาให้แล้วเดินจากไป' }] },
      { text: '💼 ขอแค่โอกาสทำงาน', effects: { smart: 1, social: 2, happy: 1 }, flags: ['promoted'], memory: 'คนแปลกหน้าที่เคยช่วย เสนองานที่ดีที่สุดในชีวิตให้',
        result: [{ text: 'เขาเป็นเจ้าของบริษัทใหญ่... ตำแหน่งใหม่พร้อมเงินเดือนสองเท่า' }] },
      { text: '🙏 ให้เขาไปช่วยคนอื่นต่อ', effects: { happy: 2, family: 1 }, flags: ['pay_forward'], memory: 'ขอให้คนแปลกหน้าส่งต่อความดีให้คนอื่นแทน',
        result: [{ text: 'สามเดือนต่อมา มีข่าวมูลนิธิใหม่ชื่อเดียวกับคุณ' }] },
    ],
  }, (s) => s.cash < 1_000 && closeFriend(s) && helpedStranger(s)),

  ...secret(2, [40], {
    bg: 'village', cast: ['me', 'mom'],
    lines: [{ who: 'mom', text: 'แม่เจอกล่องไม้ใต้ถุนบ้านยาย... ข้างบนเขียนว่า "ให้หลานคนที่มาหายายวันสุดท้าย"' }],
    choices: [
      { text: '📦 เปิดกล่อง', fin: { invest: 400_000 }, effects: { family: 2, happy: 2 }, memory: 'เปิดกล่องของยาย เจอทองคำกับจดหมายลายมือยาย',
        result: [{ text: 'สร้อยทองสามเส้นกับจดหมาย "ยายรักหลานที่สุดในโลก"' }] },
    ],
  }, (s) => has(s, 'yai_goodbye') && s.stats.family >= 7),

  ...secret(3, [9, 14], {
    bg: 'park', cast: ['me', 'coco'],
    lines: [{ text: 'หมาจรตัวหนึ่งวิ่งตรงมาหา ทำท่านั่งรอแบบที่โกโก้เคยทำเป๊ะ...' }, { who: 'coco', text: 'โฮ่ง! (มันพาไปที่ต้นมะม่วง ตรงที่โกโก้ชาติก่อนนอน)' }],
    choices: [
      { text: '🐶 "โกโก้... ใช่ไหม?"', flags: ['coco'], bond: { coco: 7 }, effects: { happy: 3 }, memory: 'เจอโกโก้อีกครั้งในชาติใหม่',
        result: [{ text: 'หางกระดิกรัว ๆ... บางความผูกพันก็ข้ามชาติได้จริง ๆ' }] },
    ],
  }, (s) => s.life === 2 && !!s.past?.history.some((h) => /โกโก้/.test(h.text)) && !has(s, 'coco')),

  ...secret(4, [20, 45], {
    bg: 'sky', cast: ['me'],
    lines: [{ text: 'แสงสีฟ้าลงมากลางสนาม เสียงในหัวพูดว่า "เราเคยพาคนในตระกูลของคุณไป... ครั้งนี้คุณจะมาด้วยไหม?"' }],
    choices: [
      { text: '🛸 ขอคุยกับบรรพบุรุษ', effects: { smart: 3, happy: 2 }, memory: 'ได้คุยกับคนในตระกูลที่อยู่บนดาวอื่นผ่านยานเอเลี่ยน',
        result: [{ text: 'ภาพโฮโลแกรมของคนที่คุ้นหน้าโบกมือ "สบายดีนะ ที่นี่วิวสวยมาก"' }] },
      { text: '🌍 ขออยู่บนโลกต่อ', effects: { family: 2 }, memory: 'ปฏิเสธเพื่อนจากดวงดาว',
        result: [{ text: 'ยานทิ้งก้อนหินเรืองแสงไว้ให้เป็นที่ระลึก' }] },
    ],
  }, (s) => pastAlien(s)),

  ...secret(5, [30], {
    bg: 'home', cast: ['me'],
    lines: [{ text: 'ซ่อมหลังคาบ้านเก่าของตระกูล เจอหีบเหล็กสลักชื่อทวด...' }],
    choices: [
      { text: '🗝️ งัดหีบ', fin: { invest: 1_500_000 }, effects: { family: 2, smart: 1 }, memory: 'เจอหีบสมบัติของทวดบนหลังคาบ้านตระกูล',
        result: [{ text: 'โฉนดที่ดินเก่ากับสมุดบันทึกของทุกรุ่นในตระกูล' }] },
    ],
  }, (s) => (s.gen ?? 1) >= 3),

  ...secret(6, [45], {
    bg: 'festival', cast: ['ton', 'me'],
    lines: [{ who: 'ton', expr: 'happy', text: 'ร้านเหล้าเก่าจะปิดตัว เจ้าของขอให้วงเรามาเล่นเป็นวงสุดท้าย!' }],
    choices: [
      { text: '🎸 เล่นเพลงที่แต่งไว้ตอน ม.5', effects: { happy: 4, friend: 2, art: 2 }, memory: 'วงดนตรีสมัยเรียนรวมตัวเล่นคืนสุดท้าย',
        result: [{ text: 'คนทั้งร้านร้องตาม... เพลงที่ไม่เคยมีใครฟังเมื่อ 30 ปีก่อน' }] },
    ],
  }, (s) => mem(s, /วงดนตรี/) && s.stats.friend >= 6),

  ...secret(7, [60, 66], {
    bg: 'festival', cast: ['me'],
    lines: [{ text: 'จดหมายเชิญ: "รางวัลคนธรรมดาที่เปลี่ยนชีวิตคนอื่น" ผู้เสนอชื่อคือคนที่คุณเคยช่วยไว้' }],
    choices: [
      { text: '🏅 ไปรับรางวัล', effects: { social: 3, happy: 3 }, memory: 'ได้รับรางวัลคนธรรมดาที่เปลี่ยนชีวิตคนอื่น',
        result: [{ text: 'บนเวที คนที่เคยได้รับความช่วยเหลือยืนเต็มแถว' }] },
      { text: '🙏 ขอไม่ออกสื่อ', effects: { happy: 2, family: 1 }, memory: 'ปฏิเสธรางวัลคนดีอย่างถ่อมตัว',
        result: [{ text: 'รางวัลถูกส่งมาที่บ้านเงียบ ๆ พร้อมการ์ดขอบคุณร้อยใบ' }] },
    ],
  }, (s) => has(s, 'honest') && helpedStranger(s) && (has(s, 'hero') || mem(s, /ช่วยชีวิต/)) && !has(s, 'hush')),

  ...secret(8, [17, 26], {
    bg: 'park', cast: ['me', 'fah'],
    lines: [{ who: 'fah', expr: 'surprised', text: 'ขอโทษนะ... เราเคยเจอกันมาก่อนไหม? รู้สึกเหมือนรู้จักกันมานานมาก' }],
    choices: [
      { text: '💞 "ชาติก่อนมั้ง"', effects: { love: 5, happy: 2 }, memory: 'ฟ้าจำความรู้สึกจากชาติก่อนได้',
        result: [{ who: 'fah', expr: 'happy', text: '(ฟ้าหัวเราะ แล้วไม่ยอมปล่อยมืออีกเลย)' }] },
      { text: '🚶 ชาตินี้ขอเดินทางอื่น', effects: { happy: 1 }, flags: ['gave_up_fah'], memory: 'เลือกไม่ทักฟ้าในชาติใหม่',
        result: [{ text: 'มองตามหลังฟ้าไป... บางเรื่องปล่อยให้เป็นความทรงจำก็สวยแล้ว' }] },
    ],
  }, (s) => s.life === 2 && !!s.past?.history.some((h) => /ฟ้า/.test(h.text) && /แต่ง|คบ/.test(h.text))),
]
