import type { BgId, CharId, Choice, GameState, Line, Scene } from './types'

/**
 * 🧵 เส้นเรื่องต่อเนื่อง — ทางเลือกในอดีตย้อนกลับมาหลายปีต่อมา
 * (โทรศัพท์ / แชต / เจอตัว) และส่งผลต่อเป็นทอด ๆ
 * ทุกฉากอ้างถึง "เรื่องที่เกิดจริง" ในชีวิตนี้ (อายุ + ความทรงจำ)
 */
const has = (s: GameState, f: string) => s.flags.includes(f)
const at = (s: GameState, f: string) => s.flagAt?.[f]
/** ความทรงจำตอนที่ได้ flag นั้น */
const memAt = (s: GameState, f: string) => {
  const a = at(s, f)
  return a === undefined ? undefined : [...s.history].reverse().find((h) => h.age === a)?.text
}
const yearsAgo = (s: GameState, f: string, age: number) => age - (at(s, f) ?? age)

interface Step {
  id: string
  /** flag ต้นทาง (ต้องมีอย่างน้อยหนึ่งอัน) — ใช้ตัวแรกที่มีเป็นจุดอ้างอิงเวลา */
  from: string[]
  /** ต้องผ่านไปกี่ปีหลังจากต้นทาง */
  delay: number
  /** ช่วงอายุที่ฉากเกิดได้ */
  ages: [number, number]
  extra?: (s: GameState) => boolean
  bg: BgId
  cast: CharId[]
  call?: { who: CharId; kind: 'call' | 'chat' }
  title: string
  lines: (s: GameState, origin: string, age: number) => Line[]
  choices: Choice[]
}

function thread(st: Step): Scene[] {
  const done = `th_${st.id}`
  const origin = (s: GameState) => st.from.find((f) => has(s, f))
  const out: Scene[] = []
  for (let age = st.ages[0]; age <= st.ages[1]; age += 2) {
    out.push({
      id: `th_${st.id}_${age}`, age, bg: st.bg, cast: st.cast, call: st.call, title: st.title,
      when: (s) => {
        const o = origin(s)
        return !!o && !has(s, done) && age - (at(s, o) ?? 0) >= st.delay && (!st.extra || st.extra(s))
      },
      because: (s) => {
        const o = origin(s)!
        const m = memAt(s, o)
        return m ? `⏳ ${yearsAgo(s, o, age)} ปีก่อน ตอนอายุ ${at(s, o)}: ${m}` : null
      },
      lines: (s) => st.lines(s, origin(s)!, age),
      choices: st.choices.map((c) => ({ ...c, flags: [...(c.flags ?? []), done] })),
    })
  }
  return out
}

const nongAge = (age: number) => age - 6

export const THREADS: Scene[] = [
  // ═════════ น้องฝน ═════════
  ...thread({
    id: 'nong1', from: ['nong_kind', 'nong_hurt'], delay: 10, ages: [20, 34], extra: (s) => has(s, 'met_nong'),
    bg: 'city', cast: ['me', 'nong'], call: { who: 'nong', kind: 'call' }, title: '📱 สายเรียกเข้า',
    lines: (s, o, age) => has(s, 'nong_kind') && o === 'nong_kind'
      ? [{ who: 'nong', expr: 'happy', text: `พี่ {name}... จำเรื่องตอนเด็กได้ไหม หนู${nongAge(age) < 22 ? 'สอบติดมหาลัยแล้ว' : 'ได้งานแรกแล้ว'} หนูอยากขอบคุณพี่` }]
      : [{ who: 'nong', expr: 'sad', text: 'พี่... หนูยังจำวันที่พี่ไม่สนใจหนูได้นะ แต่หนูอยากคุยกับพี่สักครั้ง' }],
    choices: [
      { text: '❤️ ไปหาเธอ', flags: ['nong_t1_visit'], bond: { nong: 3 }, effects: { family: 1, happy: 1 }, memory: 'ไปหาน้องฝนหลังจากเธอโทรมาขอบคุณ',
        result: [{ who: 'nong', expr: 'happy', text: 'พี่มาจริงด้วย! ร้านหมูกระทะเดิมนะ หนูเลี้ยงเอง' }] },
      { text: '💰 ขอให้ช่วยเรื่องเงิน', flags: ['nong_t1_money'], fin: { cash: 80_000 }, bond: { nong: -1 }, memory: 'ขอยืมเงินน้องฝนตอนเธอโทรมา',
        result: [{ who: 'nong', text: '...ได้สิพี่ หนูโอนให้แปดหมื่นนะ (เสียงเงียบไปนิดหนึ่ง)' }] },
      { text: '😶 ไม่รับสาย', onTimeout: true, flags: ['nong_t1_ignore'], bond: { nong: -3 }, memory: 'ไม่รับสายน้องฝน',
        result: [{ text: 'มิสคอล 3 สาย... แล้วโทรศัพท์ก็เงียบไป' }] },
    ],
  }),
  ...thread({
    id: 'nong2a', from: ['nong_t1_visit'], delay: 9, ages: [30, 48],
    bg: 'wedding', cast: ['me', 'nong'], title: '💌 การ์ดแต่งงาน',
    lines: (s, o) => [{ who: 'nong', expr: 'happy', text: `ตั้งแต่วันที่พี่มาหาหนูตอนอายุ ${at(s, o)}... หนูก็รู้ว่าพี่คือคนที่หนูอยากให้จูงมือเข้างานแต่ง` }],
    choices: [
      { text: '🤵 จูงน้องเข้าพิธี', flags: ['nong_t2_wed'], bond: { nong: 3 }, effects: { family: 2, happy: 3 }, memory: 'จูงมือน้องฝนเข้าพิธีแต่งงาน',
        result: [{ text: 'แม่ร้องไห้ตั้งแต่เพลงแรก... พี่ก็ด้วย' }] },
      { text: '🎤 ขอเป็นพิธีกรแทน', flags: ['nong_t2_wed'], bond: { nong: 2 }, effects: { social: 2, happy: 2 }, memory: 'เป็นพิธีกรงานแต่งน้องฝน',
        result: [{ text: 'เล่าเรื่องน้องตอนเด็กจนแขกหัวเราะทั้งงาน' }] },
      { text: '💼 ติดงานไปไม่ได้', bond: { nong: -3 }, effects: { money: 1, family: -2 }, memory: 'ไม่ได้ไปงานแต่งน้องฝน',
        result: [{ who: 'nong', expr: 'sad', text: '(รูปงานแต่งในไลน์กลุ่ม... มีเก้าอี้ว่างอยู่ตัวหนึ่ง)' }] },
    ],
  }),
  ...thread({
    id: 'nong3a', from: ['nong_t2_wed'], delay: 8, ages: [40, 60],
    bg: 'hospital', cast: ['nong', 'me'], call: { who: 'nong', kind: 'chat' }, title: '💬 ข้อความใหม่',
    lines: (s) => [{ who: 'nong', expr: 'happy', text: `พี่! หนูคลอดแล้ว เป็นลูก${s.gender === 'girl' ? 'สาว' : 'ชาย'} หนูตั้งชื่อเล่นว่า "${s.name}" ตามพี่นะ 🥹` }],
    choices: [
      { text: '🍼 รีบไปโรงพยาบาล', bond: { nong: 2 }, effects: { family: 3, happy: 3 }, memory: `น้องฝนตั้งชื่อลูกตามเรา`,
        result: [{ text: 'อุ้มหลานตัวน้อยที่ชื่อเดียวกับตัวเอง... นิ้วเล็ก ๆ จับนิ้วเราแน่น' }] },
      { text: '🎁 ส่งของขวัญชุดใหญ่', fin: { cash: -30_000 }, bond: { nong: 1 }, effects: { happy: 2 }, memory: 'ส่งของขวัญรับขวัญหลานที่ชื่อเดียวกับเรา',
        result: [{ who: 'nong', text: 'น่ารักมากพี่! โตขึ้นจะเล่าให้ฟังว่าชื่อมาจากใคร' }] },
    ],
  }),
  ...thread({
    id: 'nong2b', from: ['nong_t1_money'], delay: 8, ages: [30, 50],
    bg: 'home', cast: ['nong', 'me'], call: { who: 'nong', kind: 'call' }, title: '📱 สายเรียกเข้า',
    lines: (s, o) => [{ who: 'nong', expr: 'sad', text: `พี่... ตอนอายุ ${at(s, o)} หนูให้พี่ยืมแปดหมื่น ตอนนี้หนูโดนเลิกจ้าง ขอคืนได้ไหม` }],
    choices: [
      { text: '💸 คืนพร้อมดอก', flags: ['nong_t2_repaid'], fin: { cash: -120_000 }, bond: { nong: 4 }, effects: { family: 1 }, memory: 'คืนเงินน้องฝนพร้อมดอกเบี้ยในวันที่เธอลำบาก',
        result: [{ who: 'nong', expr: 'happy', text: 'พี่ให้เกินมานะ... ขอบคุณที่ไม่ลืม' }] },
      { text: '⏳ ขอผัดไปก่อน', bond: { nong: -3 }, effects: { family: -1 }, memory: 'ผัดหนี้น้องฝน',
        result: [{ who: 'nong', expr: 'angry', text: 'ตอนพี่ลำบากหนูไม่เคยผัดเลยนะ' }] },
    ],
  }),
  ...thread({
    id: 'nong3b', from: ['nong_t2_repaid'], delay: 8, ages: [40, 62],
    bg: 'city', cast: ['nong', 'me'], title: '☕ ร้านกาแฟของน้อง',
    lines: (s, o) => [{ who: 'nong', expr: 'happy', text: `เงินที่พี่คืนให้ตอนอายุ ${at(s, o)} หนูเอาไปเปิดร้านกาแฟ ตอนนี้มีสามสาขาแล้ว! พี่มาถือหุ้นด้วยกันนะ` }],
    choices: [
      { text: '🤝 ถือหุ้นด้วย', fin: { invest: 600_000 }, bond: { nong: 2 }, effects: { happy: 2 }, memory: 'ถือหุ้นร้านกาแฟของน้องฝน',
        result: [{ text: 'ป้ายหน้าร้านเขียนว่า "ร้านนี้เริ่มจากเงินที่พี่คืน"' }] },
    ],
  }),
  ...thread({
    id: 'nong2c', from: ['nong_t1_ignore'], delay: 8, ages: [30, 54],
    bg: 'home', cast: ['me'], call: { who: 'nong', kind: 'chat' }, title: '💬 ข้อความใหม่',
    lines: (s, o) => [{ who: 'nong', text: `แม่ป่วยหนัก พี่ไม่ต้องมาก็ได้ ${yearsAgo(s, o, s.history.at(-1)?.age ?? 0) > 0 ? 'เหมือนตอนที่พี่ไม่รับสายหนู' : ''}` }],
    choices: [
      { text: '🏃 รีบกลับบ้าน', bond: { nong: 4 }, effects: { family: 3 }, memory: 'กลับไปหาแม่และน้องฝนหลังห่างเหินมานาน',
        result: [{ who: 'nong', expr: 'sad', text: '(น้องฝนเปิดประตู แล้วกอดแน่นโดยไม่พูดอะไร)' }] },
      { text: '💸 โอนเงินค่ารักษา', fin: { cash: -200_000 }, effects: { family: 1 }, memory: 'โอนค่ารักษาแม่แต่ไม่ได้กลับไป',
        result: [{ text: 'ข้อความสุดท้ายในแชต: "ได้รับแล้ว"' }] },
      { text: '📵 อ่านแล้วไม่ตอบ', onTimeout: true, bond: { nong: -4 }, effects: { family: -3, happy: -2 }, flags: ['cut_family'], memory: 'อ่านข้อความน้องฝนแล้วไม่ตอบ',
        result: [{ text: 'ขึ้นว่า "อ่านแล้ว" ...และไม่มีข้อความมาอีกเลย' }] },
    ],
  }),

  // ═════════ ต้น ═════════
  ...thread({
    id: 'ton1', from: ['saved_ton'], delay: 12, ages: [21, 33], extra: (s) => !has(s, 'ignored_ton'),
    bg: 'city', cast: ['me', 'ton'], call: { who: 'ton', kind: 'call' }, title: '📱 สายเรียกเข้า',
    lines: (s, o) => [{ who: 'ton', expr: 'happy', text: `จำวันที่สนามเด็กเล่นตอนเราอายุ ${at(s, o)} ได้ไหม? ถ้าวันนั้นนายไม่ช่วย เราคงไม่มีวันนี้... เราสอบติดนายร้อยตำรวจแล้ว!` }],
    choices: [
      { text: '🍻 ฉลองกันคืนนี้', flags: ['ton_t1'], effects: { friend: 3, happy: 2 }, memory: 'ฉลองกับต้นที่สอบติดนายร้อย',
        result: [{ who: 'ton', expr: 'happy', text: 'แก้วนี้ให้เพื่อนที่ยืนบังเราไว้!' }] },
      { text: '👍 ยินดีด้วยนะ', effects: { friend: 1 }, memory: 'แสดงความยินดีกับต้นทางโทรศัพท์',
        result: [{ who: 'ton', text: 'ไว้ว่างมาเจอกันนะเพื่อน' }] },
    ],
  }),
  ...thread({
    id: 'ton2', from: ['ton_t1'], delay: 10, ages: [32, 52],
    bg: 'city', cast: ['ton', 'me'], title: '🚨 คืนที่ไม่คาดคิด',
    lines: (s, o) => s.debt > 300_000 || has(s, 'hush') || has(s, 'scammer')
      ? [{ who: 'ton', text: `เรื่องของนายถึงโต๊ะเราแล้ว... ตั้งแต่คืนฉลองตอนอายุ ${at(s, o)} เราสัญญากับตัวเองว่าจะช่วยนายทุกครั้ง` }]
      : [{ who: 'ton', expr: 'happy', text: `เราได้เลื่อนยศแล้ว! ยังจำคืนฉลองตอนอายุ ${at(s, o)} ได้ไหม มาอีกรอบสิ` }],
    choices: [
      { text: '🙏 ขอบใจเพื่อน', effects: { friend: 2, happy: 2 }, fin: { debt: -200_000 }, memory: 'ต้นช่วยเคลียร์ปัญหาให้ในวันที่ลำบาก',
        result: [{ who: 'ton', text: 'เพื่อนกัน ไม่ต้องขอบใจ' }] },
      { text: '🎉 ฉลองอีกรอบ', effects: { friend: 2, happy: 2, body: -1 }, memory: 'ฉลองยศใหม่ของต้น',
        result: [{ text: 'ร้านเดิม โต๊ะเดิม แต่ผมหงอกกันทั้งคู่แล้ว' }] },
    ],
  }),
  ...thread({
    id: 'tonloan2', from: ['helped_ton'], delay: 12, ages: [31, 45], extra: (s) => !has(s, 'betrayed'),
    bg: 'home', cast: ['me', 'ton'], call: { who: 'ton', kind: 'chat' }, title: '💬 ข้อความใหม่',
    lines: (s, o) => [{ who: 'ton', expr: 'happy', text: `แม่เราเพิ่งฉลองอายุ 70 นะ ถ้าไม่ใช่เพราะนายช่วยตอนเราอายุ ${at(s, o)} แม่คงไม่อยู่ถึงวันนี้ แม่ฝากขนมมาให้ 🥹` }],
    choices: [
      { text: '🎂 ไปอวยพรแม่ต้น', effects: { friend: 2, happy: 2, family: 1 }, memory: 'ไปงานวันเกิด 70 ปีของแม่ต้น',
        result: [{ text: 'แม่ต้นจับมือแน่น "ลูกอีกคนของแม่"' }] },
      { text: '❤️ ส่งสติกเกอร์หัวใจ', effects: { friend: 1 }, memory: 'ตอบข้อความต้นด้วยสติกเกอร์',
        result: [{ who: 'ton', text: '(ส่งรูปแม่ยิ้มถือป้าย "ขอบคุณ {name}" กลับมา)' }] },
    ],
  }),

  // ═════════ ครู ═════════
  ...thread({
    id: 'kru1', from: ['kru_tree', 'olympiad'], delay: 15, ages: [24, 40],
    bg: 'classroom', cast: ['kru', 'me'], call: { who: 'kru', kind: 'call' }, title: '📱 เบอร์ที่ไม่คุ้น',
    lines: (s, o) => [{ who: 'kru', expr: 'happy', text: o === 'kru_tree'
      ? `ครูสมศรีเองจ้ะ ครูจะเกษียณแล้ว... ครูยังเก็บรูปเธอตอนเล่นเป็นต้นไม้ไว้นะ ตอนนั้นเธออายุ ${at(s, o)} เอง`
      : `ครูสมศรีเองจ้ะ ครูจะเกษียณแล้ว... ครูยังภูมิใจเรื่องค่ายโอลิมปิกตอนเธออายุ ${at(s, o)} ไม่หาย` }],
    choices: [
      { text: '🌷 ไปงานเกษียณครู', effects: { happy: 2, social: 1 }, flags: ['kru_t1'], memory: 'ไปงานเกษียณครูสมศรี',
        result: [{ who: 'kru', expr: 'happy', text: 'ลูกศิษย์ที่ครูรักที่สุดมาแล้ว!' }] },
      { text: '📦 ส่งของขวัญไปแทน', fin: { cash: -3_000 }, effects: { happy: 1 }, memory: 'ส่งของขวัญเกษียณให้ครูสมศรี',
        result: [{ text: 'ครูส่งรูปถือของขวัญยิ้มกว้างกลับมา' }] },
      { text: '🤔 ใครนะ...', effects: { happy: -1 }, memory: 'จำครูสมศรีไม่ได้', result: [{ who: 'kru', expr: 'sad', text: '...ไม่เป็นไรจ้ะ ครูดีใจที่เธอสบายดี' }] },
    ],
  }),
  ...thread({
    id: 'kru2', from: ['kru_t1'], delay: 12, ages: [38, 56],
    bg: 'hospital', cast: ['me'], title: '📜 จดหมายจากครู',
    lines: (s, o) => [{ text: `จดหมายลายมือสั่น ๆ: "วันที่เธอมางานเกษียณครูเมื่อ ${(s.history.at(-1)?.age ?? 0) - (at(s, o) ?? 0)} ปีก่อน เป็นวันที่ครูมีความสุขที่สุด ครูขอฝากหนังสือทั้งตู้ไว้กับเธอ"` }],
    choices: [
      { text: '📚 เปิดห้องสมุดชื่อครู', fin: { cash: -50_000 }, effects: { smart: 2, happy: 2, social: 1 }, memory: 'เปิดห้องสมุดชุมชนชื่อครูสมศรี',
        result: [{ text: 'ป้ายไม้หน้าห้องสมุด: "ห้องสมุดครูสมศรี"' }] },
      { text: '📖 เก็บไว้อ่านเอง', effects: { smart: 2 }, memory: 'เก็บหนังสือของครูไว้อ่าน',
        result: [{ text: 'ในหนังสือทุกเล่มมีลายมือครูขีดเส้นใต้ไว้' }] },
    ],
  }),

  // ═════════ ค่ายอาสา / แลกเปลี่ยน / หุ้นส่วน ═════════
  ...thread({
    id: 'camp', from: ['camp_library'], delay: 18, ages: [30, 50],
    bg: 'village', cast: ['me'], call: { who: 'me', kind: 'chat' }, title: '💬 ข้อความจากคนแปลกหน้า',
    lines: (s, o) => [{ text: `"สวัสดีครับ ผมเป็นเด็กบนดอยที่พี่มาสร้างห้องสมุดให้ตอนพี่อายุ ${at(s, o)} ตอนนี้ผมเป็นหมอแล้วครับ ผมตามหาพี่มาหลายปี"` }],
    choices: [
      { text: '⛰️ ขึ้นดอยไปเจอ', effects: { happy: 4, social: 1 }, flags: ['hero'], memory: 'กลับไปที่ดอยแล้วเจอเด็กที่เคยสอนซึ่งโตเป็นหมอ',
        result: [{ text: 'ห้องสมุดไม้หลังเดิมยังอยู่... มีชื่อพี่ค่ายทุกคนเขียนไว้ที่ผนัง' }] },
      { text: '💌 ตอบกลับด้วยน้ำตา', effects: { happy: 3 }, memory: 'ได้ข้อความขอบคุณจากเด็กบนดอยที่โตเป็นหมอ',
        result: [{ text: 'อ่านซ้ำสิบรอบ แล้วแคปเก็บไว้' }] },
    ],
  }),
  ...thread({
    id: 'japan', from: ['exchanged'], delay: 14, ages: [33, 50],
    bg: 'city', cast: ['me'], call: { who: 'me', kind: 'chat' }, title: '💬 ข้อความภาษาญี่ปุ่น',
    lines: (s, o) => [{ text: `"ฮารุโตะเองนะ! เพื่อนตอนแลกเปลี่ยนเมื่ออายุ ${at(s, o)} จำได้ไหม ฉันจะมาเที่ยวไทยกับครอบครัว ขอแวะไปหาได้ไหม?"` }],
    choices: [
      { text: '🛕 พาเที่ยวทั้งอาทิตย์', fin: { cash: -40_000 }, effects: { happy: 3, social: 2 }, flags: ['japan_friend'], memory: 'พาเพื่อนญี่ปุ่นสมัยแลกเปลี่ยนเที่ยวไทย',
        result: [{ text: 'ฮารุโตะร้องไห้ตอนกินส้มตำ... เพราะเผ็ด' }] },
      { text: '🍜 นัดกินข้าวมื้อเดียว', effects: { happy: 1, social: 1 }, memory: 'นัดกินข้าวกับเพื่อนญี่ปุ่น',
        result: [{ text: 'คุยกันสามภาษาปนกันจนร้านปิด' }] },
    ],
  }),
  ...thread({
    id: 'japan2', from: ['japan_friend'], delay: 10, ages: [44, 64],
    bg: 'sky', cast: ['me'], call: { who: 'me', kind: 'chat' }, title: '✈️ ตั๋วเครื่องบิน',
    lines: (s, o) => [{ text: `ฮารุโตะส่งตั๋วเครื่องบินมาให้: "ตอนอายุ ${at(s, o)} นายพาฉันเที่ยวไทย ครั้งนี้ตาฉันพาเที่ยวญี่ปุ่นบ้าง!"` }],
    choices: [
      { text: '🗻 ไปญี่ปุ่น!', effects: { happy: 4, body: 1 }, memory: 'บินไปเที่ยวญี่ปุ่นกับเพื่อนที่คบกันมาสามสิบปี',
        result: [{ text: 'ใต้ต้นซากุระต้นเดิมที่เคยถ่ายรูปกันตอนหนุ่มสาว' }] },
    ],
  }),
  ...thread({
    id: 'cofounder', from: ['cofounder'], delay: 10, ages: [36, 56], extra: (s) => !has(s, 'jay_betray'),
    bg: 'office', cast: ['jay', 'me'], call: { who: 'jay', kind: 'chat' }, title: '💬 ข้อความจากเจ',
    lines: (s, o) => [{ who: 'jay', expr: 'happy', text: `ครบ ${(s.history.at(-1)?.age ?? 0) - (at(s, o) ?? 0)} ปีที่เราก่อตั้งบริษัทด้วยกันตอนอายุ ${at(s, o)}! คืนนี้มีงานฉลอง พนักงานอยากเจอผู้ก่อตั้งอีกคน` }],
    choices: [
      { text: '🥂 ไปขึ้นเวทีด้วยกัน', bond: { jay: 2 }, effects: { social: 2, happy: 2 }, memory: 'ขึ้นเวทีฉลองครบรอบบริษัทกับเจ',
        result: [{ who: 'jay', expr: 'happy', text: 'สองคนที่เคยแข่งกันตอนป.5... ตอนนี้ยืนบนเวทีเดียวกัน' }] },
      { text: '💰 ขายหุ้นออก', fin: { invest: 2_000_000 }, bond: { jay: -1 }, effects: { happy: 1 }, memory: 'ขายหุ้นบริษัทที่ก่อตั้งกับเจ',
        result: [{ who: 'jay', text: 'เข้าใจ... ขอบคุณที่สร้างมันมาด้วยกันนะ' }] },
    ],
  }),
]
