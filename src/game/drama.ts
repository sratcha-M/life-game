import { married } from './finance'
import type { GameState, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
const mem = (s: GameState, re: RegExp) => s.history.find((h) => re.test(h.text))
const ago = (s: GameState, re: RegExp, fallback: string) => {
  const h = mem(s, re)
  return h ? `เพราะตอนอายุ ${h.age}: ${h.text}` : fallback
}

/** ฉากดราม่า + มินิเกมเพิ่ม (รวมกับฉากอื่นแล้วเรียงตามอายุอัตโนมัติ) */
export const DRAMA: Scene[] = [
  // ───────── มินิเกม ─────────
  {
    id: 'kindergame', age: 5, bg: 'classroom', title: 'เกมจับคู่ที่อนุบาล', minigame: 'memory',
    cast: ['me'], lines: [{ who: 'kru', text: 'ใครจับคู่ได้ครบก่อน ได้ดาวทองนะจ๊ะ!' }],
    reward: (p) => p >= 0.99
      ? { effects: { smart: 2, happy: 1 }, memory: 'ได้ดาวทองเกมจับคู่ตอนอนุบาล', text: '⭐ ได้ดาวทอง! ครูชมหน้าห้อง' }
      : p >= 0.5 ? { effects: { smart: 1 }, memory: 'เล่นเกมจับคู่ตอนอนุบาล', text: '🙂 เกือบครบแล้ว เก่งมาก' }
      : { effects: { happy: -1 }, memory: 'แพ้เกมจับคู่จนร้องไห้', text: '😢 จับคู่ไม่ทัน... ร้องไห้กลับบ้าน' },
  },
  {
    id: 'confess', age: 16, bg: 'park', title: 'สารภาพรัก', minigame: 'timing',
    when: (s) => s.stats.love >= 1 && !has(s, 'gave_up_fah'),
    because: (s) => ago(s, /ฟ้า/, 'เพราะใจเต้นแรงตั้งแต่วันที่ฟ้าย้ายมา'),
    cast: ['me', 'fah'], lines: [{ text: 'งานลอยกระทงคืนนี้... ถึงเวลาบอกความในใจแล้ว' }],
    reward: (p) => p >= 0.66
      ? { effects: { love: 4, happy: 2 }, flags: ['confessed'], memory: 'สารภาพรักกับฟ้าคืนลอยกระทง แล้วฟ้าตอบตกลง', text: '💘 ฟ้ายิ้มแล้วจับมือ... "เราก็ชอบนะ"' }
      : p >= 0.33 ? { effects: { love: 1 }, memory: 'พูดตะกุกตะกักตอนสารภาพรัก', text: '😳 พูดไม่รู้เรื่อง แต่ฟ้าหัวเราะเอ็นดู' }
      : { effects: { love: -2, happy: -2 }, memory: 'สารภาพรักพลาดจนอายไปทั้งเทอม', text: '💦 กระทงล่มต่อหน้าฟ้า... อายจนอยากหายตัว' },
  },

  // ───────── ดราม่า ─────────
  {
    id: 'yai_pass', mood: 'sad', age: 13, bg: 'hospital', title: 'วันที่ต้องเลือก', timer: 8,
    cast: ['yai', 'me'],
    lines: [{ who: 'yai', expr: 'sad', text: 'หลาน... ยายอยากเห็นหน้าหลานอีกสักครั้ง' }],
    because: (s) => (has(s, 'countryside') ? ago(s, /ยาย/, 'เพราะยายรักหลานคนนี้ที่สุด') : null),
    choices: [
      { text: '🏃 ทิ้งการแข่งขัน รีบไปหายาย', effects: { family: 3, smart: -1 }, flags: ['yai_goodbye'], memory: 'ได้กอดยายเป็นครั้งสุดท้าย',
        result: [{ who: 'yai', expr: 'happy', text: 'มาแล้วเหรอหลาน... ยายดีใจ' }] },
      { text: '🏆 แข่งให้จบก่อน แล้วค่อยไป', onTimeout: true, effects: { smart: 2, happy: -3 }, flags: ['missed_yai'], memory: 'ไปหายายไม่ทัน เพราะอยู่ที่สนามแข่ง',
        result: [{ text: 'ได้เหรียญทองมา... แต่ไปถึงโรงพยาบาลช้าไปสิบนาที' }] },
      { text: '📹 วิดีโอคอลหายายตอนพักครึ่ง', effects: { family: 1, smart: 1, happy: -1 }, memory: 'วิดีโอคอลคุยกับยายครั้งสุดท้ายจากสนามแข่ง',
        result: [{ who: 'yai', expr: 'happy', text: '(ยายยิ้มให้กล้องช้า ๆ) ...แข่งให้เต็มที่นะหลาน ยายดูอยู่' }] },
    ],
  },
  {
    id: 'ton_fah', age: 24, bg: 'park', title: 'เพื่อนรักกับคนที่รัก',
    when: (s) => !has(s, 'ignored_ton') && s.stats.love >= 2 && s.stats.friend >= 2,
    because: (s) => ago(s, /ฟ้า/, 'เพราะทั้งคุณและต้นสนิทกับฟ้ามาตั้งแต่ ม.ปลาย'),
    cast: ['ton', 'me'],
    lines: [{ who: 'ton', expr: 'sad', text: 'เราจะบอกอะไรอย่าง... เราชอบฟ้ามานานแล้ว เพื่อนจะว่าอะไรไหม' }],
    choices: [
      { text: '🫡 ถอยให้เพื่อน', effects: { friend: 4, love: -4, happy: -2 }, flags: ['gave_up_fah'], memory: 'ยอมถอยเรื่องฟ้าเพื่อต้น',
        result: [{ who: 'ton', expr: 'happy', text: 'เพื่อน... เราจะไม่ลืมเลย' }] },
      { text: '💥 บอกตรง ๆ ว่าเราก็ชอบ', effects: { friend: -4, love: 2 }, memory: 'แย่งความรักกับเพื่อนรัก',
        result: [{ who: 'ton', expr: 'angry', text: 'งั้นก็ต่างคนต่างไปแล้วกัน' }] },
      { text: '🎲 ให้ฟ้าเป็นคนเลือก', outcomes: [
        { chance: 0.5, effects: { love: 3, friend: -1 }, memory: 'ฟ้าเลือกเรา', result: [{ text: 'ฟ้าเลือกคุณ... ต้นยิ้มเศร้า ๆ แต่ยังเป็นเพื่อนกัน' }] },
        { chance: 0.5, effects: { love: -5, happy: -3 }, flags: ['gave_up_fah', 'fah_ton'], memory: 'ฟ้าเลือกต้น', result: [{ text: 'ฟ้าเลือกต้น... คืนนั้นยาวนานที่สุดในชีวิต' }] },
      ] },
    ],
  },
  {
    id: 'whistle', age: 34, bg: 'office', title: 'ความลับของบริษัท',
    when: (s) => ['office', 'dev'].includes(s.career ?? ''),
    cast: ['boss', 'me'],
    lines: [
      { text: 'ค่ำวันหนึ่ง คุณหยิบแฟ้มผิดจากเครื่องปริ้นเตอร์ส่วนกลาง... เป็นบัญชีลับที่บริษัทใช้โกงเงินลูกค้า มีลายเซ็นหัวหน้าอยู่ทุกหน้า' },
      { who: 'boss', text: 'คุณเห็นเอกสารนั่นแล้วสินะ... เก็บเงียบไว้ แล้วโบนัสปีนี้ 8 แสน' },
    ],
    choices: [
      { text: '🤐 รับเงิน เก็บเงียบ', fin: { cash: 800_000 }, flags: ['hush'], effects: { happy: -1 }, memory: 'รับเงินปิดปากเรื่องบริษัทโกง',
        result: [{ text: 'เงินก้อนโตเข้าบัญชี... แต่คืนนั้นนอนไม่หลับ' }] },
      { text: '📢 แฉต่อสื่อ', outcomes: [
        { chance: 0.5, effects: { social: 4, happy: 2 }, flags: ['hero', 'exposed_boss'], memory: 'แฉบริษัทโกงจนเป็นข่าวใหญ่', result: [{ text: 'ข่าวดังทั่วประเทศ! หัวหน้าโดนพักงานและถูกดำเนินคดี คุณกลายเป็นฮีโร่ของผู้เสียหาย' }] },
        { chance: 0.5, fin: { cash: -400_000 }, flags: ['fired'], effects: { happy: -3 }, memory: 'แฉบริษัทแล้วโดนฟ้องกลับ', result: [{ text: 'บริษัทฟ้องหมิ่นประมาท... ค่าทนายหมดไปหลายแสน' }] },
      ] },
      { text: '🚪 ลาออกเงียบ ๆ', flags: ['fired'], fin: { cash: -150_000 }, effects: { happy: 1 }, memory: 'ลาออกจากบริษัทที่โกง', result: [{ text: 'ไม่อยากมีส่วนร่วม ขอเริ่มใหม่ที่อื่นดีกว่า' }] },
    ],
  },
  {
    id: 'kid_sick', mood: 'sad', age: 40, bg: 'hospital', title: 'คืนที่ยาวที่สุด',
    when: (s) => has(s, 'kid'),
    because: () => 'เพราะคุณตัดสินใจมีลูกตอนอายุ 33',
    cast: (s) => (married(s) ? ['me', 'fah'] : ['me']),
    lines: [{ text: 'หมอบอกว่าลูกต้องผ่าตัดหัวใจด่วน ค่ารักษา 1.5 ล้าน' }],
    choices: [
      { text: '🏠 ขายบ้าน ขายทุกอย่าง', fin: { investMul: 0.2, cash: 300_000 }, effects: { family: 4, happy: -1 }, memory: 'ขายทุกอย่างรักษาลูก', result: [{ text: 'ผ่าตัดสำเร็จ... ลูกยิ้มให้เป็นครั้งแรกในรอบเดือน' }] },
      { text: '💳 กู้ทุกช่องทาง', fin: { debt: 1_500_000 }, effects: { family: 3 }, memory: 'กู้เงินล้านครึ่งรักษาลูก', result: [{ text: 'ลูกหายดี แต่หนี้ก้อนใหญ่จะตามไปอีกหลายปี' }] },
      { text: '🏥 รอคิวโรงพยาบาลรัฐ', outcomes: [
        { chance: 0.6, effects: { family: 2 }, memory: 'ได้ผ่าตัดลูกที่โรงพยาบาลรัฐทันเวลา', result: [{ text: 'ได้คิวผ่าตัดทันเวลา หมอรัฐเก่งไม่แพ้ใคร' }] },
        { chance: 0.4, effects: { family: -2, happy: -5, body: -1 }, flags: ['kid_weak'], memory: 'รอคิวนานจนลูกอาการทรุด', result: [{ text: 'กว่าจะได้คิว อาการลูกทรุดลงมาก... ต้องพักฟื้นอีกหลายปี' }] },
      ] },
    ],
  },
  {
    id: 'raid', age: 47, bg: 'office', title: 'ดีเอสไอบุก',
    when: (s) => has(s, 'hush'),
    because: (s) => ago(s, /ปิดปาก/, 'เพราะเงินปิดปากเมื่อหลายปีก่อน'),
    cast: ['me'], timer: 7,
    // ตำรวจ/ข้าราชการรับส่วยหรือเซ็นเบิกงบ → โดนค้นที่ทำงานราชการ ไม่ใช่บริษัท
    lines: (s) => [{ text: ['police', 'civil'].includes(s.career ?? '') ? 'เจ้าหน้าที่บุกค้นสำนักงาน! ชื่อของคุณอยู่ในบัญชีรับเงินใต้โต๊ะ' : 'เจ้าหน้าที่บุกค้นบริษัท! ชื่อของคุณอยู่ในบัญชีรับเงิน' }],
    choices: [
      { text: '🗣️ ให้การเป็นพยานซัดทอด', fin: { cash: -800_000 }, effects: { happy: -1, social: -1 }, memory: 'กลับใจเป็นพยานคดีทุจริต', result: [{ text: 'คืนเงินทั้งหมด แต่ได้รับการกันไว้เป็นพยาน รอดคุก' }] },
      { text: '🙅 ปฏิเสธทุกข้อกล่าวหา', onTimeout: true, outcomes: [
        { chance: 0.4, memory: 'รอดคดีทุจริตเพราะหลักฐานไม่พอ', result: [{ text: 'หลักฐานไม่พอ... รอดไปอย่างเฉียดฉิว' }] },
        { chance: 0.6, end: 'jail', memory: 'ติดคุกคดีร่วมฉ้อโกง', result: [{ text: 'ศาลตัดสินว่าร่วมกระทำผิด... เงินแปดแสนแลกกับอิสรภาพ' }] },
      ] },
    ],
  },
  {
    id: 'mom_pass', mood: 'sad', age: 56, bg: 'hospital', title: 'ลาก่อนแม่',
    cast: ['mom', 'me'],
    lines: (s) => s.stats.family >= 5
      ? [{ who: 'mom', expr: 'happy', text: 'แม่ภูมิใจในตัวลูกเสมอนะ... ไม่ต้องร้องนะ' }]
      : [{ who: 'mom', expr: 'sad', text: 'ลูกกลับมาแล้ว... แม่รอมานานเลยนะ' }],
    because: (s) => (s.stats.family >= 5 ? 'เพราะคุณดูแลครอบครัวมาตลอด แม่จึงจากไปอย่างอบอุ่น' : 'เพราะห่างบ้านไปนาน... เวลาที่เหลือกับแม่จึงน้อยนิด'),
    choices: [
      { text: '🤍 "ขอบคุณที่เป็นแม่ของ{chan}"', effects: { happy: 1, family: 2 }, memory: 'ได้บอกขอบคุณแม่ก่อนแม่จากไป', result: [{ text: 'แม่ยิ้ม แล้วหลับไปอย่างสงบ' }] },
      { text: '😭 "ขอโทษที่ไม่ค่อยกลับบ้าน"', effects: { happy: -1, family: 3 }, memory: 'ขอโทษแม่ในวันสุดท้าย', result: [{ who: 'mom', text: 'แม่ไม่เคยโกรธเลยลูก...' }] },
      { text: '🙏 ไม่พูดอะไร แค่กุมมือไว้', effects: { family: 1 }, memory: 'กุมมือแม่จนวินาทีสุดท้าย', result: [{ text: 'มือของแม่อุ่นอยู่อย่างนั้นอีกนาน' }] },
    ],
  },
]

/** ข้อความ "ผลจากอดีต" ของฉากเดิม ทำให้รู้สึกว่าทางเลือกมีผล */
export const BECAUSE: Record<string, (s: GameState) => string | null> = {
  tonreturn: (s) => (has(s, 'ignored_ton') ? ago(s, /เดินผ่าน/, '') : has(s, 'helped_ton') ? ago(s, /ให้ต้นยืม|ระดมทุน/, '') : s.stats.friend >= 5 ? 'เพราะคุณดูแลมิตรภาพนี้มาตลอด' : null),
  love: (s) => (s.stats.love >= 2 ? ago(s, /ฟ้า|สารภาพ/, 'เพราะคุณใจดีกับฟ้าตั้งแต่ ม.ปลาย') : null),
  lottery: (s) => (has(s, 'ghost_numbers') ? ago(s, /ผี|เลขเด็ด/, '') : null),
  ufo: (s) => ago(s, /หินอุกกาบาต/, ''),
  police: (s) => ago(s, /แชร์ลูกโซ่/, ''),
  divorce: (s) => (has(s, 'cheated') ? ago(s, /นอกใจ|แชท/, '') : has(s, 'workaholic') ? ago(s, /ยกเลิกนัด|เลือกงาน/, 'เพราะคุณให้เวลากับงานมากกว่าบ้าน') : 'เพราะความรักที่ไม่ได้ดูแล'),
  loanshark: (s) => ago(s, /หนี้พนัน|คริปโต|หมดตัว/, 'เพราะเงินหมดกระเป๋า'),
  burnout: (s) => (has(s, 'workaholic') ? ago(s, /ยกเลิกนัด|เลือกงาน/, '') : null),
  chestpain: (s) => ago(s, /ไม่สนใจผลตรวจ|ดื่มคนเดียว/, 'เพราะไม่ค่อยดูแลร่างกาย'),
  guarantor: (s) => ago(s, /ต้น/, ''),
  lonely: () => 'เพราะคุณค่อย ๆ ห่างจากทุกคน',
  debtcrisis: (s) => ago(s, /กู้|หนี้|ผ่อนรถ|คริปโต/, ''),
  hardship: (s) => (has(s, 'poor') ? 'เพราะคุณเกิดในบ้านยากจน' : null),
  wedding: (s) => ago(s, /คบกับฟ้า/, ''),
  career: (s) => {
    const p = s.history.filter((h) => /เรียน|ชมรม|ทุน|ติว/.test(h.text)).slice(-2).map((h) => h.text)
    return p.length ? `ทางเลือกที่ผ่านมา: ${p.join(' · ')}` : null
  },
}
