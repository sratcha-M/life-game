import type { BondId, GameState, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
export const bondOf = (s: GameState, id: BondId) => s.bonds?.[id] ?? 0
const needBond = (s: GameState, id: BondId, n: number) => (bondOf(s, id) >= n ? false : `ต้องสนิทกับ${BOND_INFO[id].name} ${n}+`)

export const BOND_INFO: Record<BondId, { name: string; icon: string; role: string; met: (s: GameState) => boolean }> = {
  nong: { name: 'น้องฝน', icon: '👧', role: 'น้องสาว', met: (s) => has(s, 'met_nong') },
  jay: { name: 'เจ', icon: '🧑‍🎓', role: 'คู่แข่ง/เพื่อน', met: (s) => has(s, 'met_jay') },
  coco: { name: 'โกโก้', icon: '🐶', role: 'หมาของบ้าน', met: (s) => has(s, 'coco') },
}

/** ฉากของตัวละครที่ผูกสัมพันธ์ได้ (รวมกับฉากอื่นแล้วเรียงตามอายุอัตโนมัติ) */
export const BOND_SCENES: Scene[] = [
  // ───────── น้องฝน ─────────
  {
    id: 'nong_born', age: 6, bg: 'hospital', title: 'น้องคนใหม่',
    when: (s) => !s.flags.includes('met_nong'),
    cast: ['mom', 'nong', 'me'],
    lines: [{ who: 'mom', expr: 'happy', text: '{name} นี่น้องฝนนะลูก จากนี้เป็นพี่แล้วนะ' }],
    choices: [
      { text: '🤗 ขออุ้มน้อง', flags: ['met_nong', 'nong_kind'], bond: { nong: 3 }, effects: { family: 1 }, memory: 'ได้น้องสาวชื่อฝน และขออุ้มเป็นคนแรก',
        result: [{ who: 'nong', expr: 'happy', text: '(น้องฝนจับนิ้ว {name} แน่นไม่ยอมปล่อย)' }] },
      { text: '🧸 ยกตุ๊กตาให้น้อง', flags: ['met_nong', 'nong_kind'], bond: { nong: 2 }, effects: { happy: -1, family: 1 }, memory: 'ยกตุ๊กตาตัวโปรดให้น้องฝน',
        result: [{ who: 'mom', expr: 'happy', text: 'ใจดีที่สุดเลย พี่ของน้องฝน' }] },
      { text: '😤 อิจฉา แม่ไม่สนใจเรา', flags: ['met_nong', 'nong_hurt'], bond: { nong: -1 }, effects: { happy: -1 }, memory: 'แอบอิจฉาตอนน้องฝนเกิด',
        result: [{ text: 'ทั้งบ้านรุมล้อมน้อง... ไม่มีใครถามถึง {name} เลย' }] },
    ],
  },
  {
    id: 'nong_homework', age: 14, bg: 'home', title: 'พี่ช่วยหน่อย',
    when: (s) => has(s, 'met_nong'),
    cast: ['nong', 'me'],
    lines: [{ who: 'nong', text: 'พี่ {name}~ การบ้านเลขข้อนี้ทำยังไงอะ พรุ่งนี้ต้องส่งแล้ว' }],
    choices: [
      { text: '📚 นั่งสอนจนเข้าใจ', flags: ['nong_kind'], bond: { nong: 2 }, effects: { smart: 1, social: -1 }, memory: 'นั่งสอนการบ้านน้องฝนจนดึก',
        result: [{ who: 'nong', expr: 'happy', text: 'เข้าใจแล้ว! พี่สอนเข้าใจกว่าครูอีก' }] },
      { text: '🏃 ไม่ว่าง ไปหาเพื่อน', flags: ['nong_hurt'], bond: { nong: -2 }, effects: { social: 1 }, memory: 'ทิ้งน้องไปเที่ยวกับเพื่อน',
        result: [{ who: 'nong', expr: 'sad', text: 'ไม่เป็นไร... หนูทำเองก็ได้' }] },
      { text: '✍️ ทำให้เลย เร็วดี', bond: { nong: 1 }, effects: { happy: 1 }, memory: 'แอบทำการบ้านให้น้อง',
        result: [{ text: 'น้องได้เต็ม... แต่สอบจริงตกทั้งห้อง' }] },
    ],
  },
  {
    id: 'nong_loan', age: 29, bg: 'city', title: 'น้องขอยืมเงิน',
    when: (s) => has(s, 'met_nong'),
    because: (s) => (bondOf(s, 'nong') >= 5 ? 'เพราะน้องฝนไว้ใจพี่ที่สุดในบ้าน' : null),
    cast: ['me', 'nong'],
    lines: [{ who: 'nong', text: 'พี่... หนูอยากเปิดร้านกาแฟ ขอยืม 2 แสนได้ไหม สัญญาว่าจะคืน' }],
    choices: [
      { text: '💸 ให้ยืมเลย', outcomes: [
        { chance: 0.6, fin: { cash: 200_000 }, bond: { nong: 3 }, effects: { happy: 2 }, memory: 'ให้น้องฝนยืมเงินเปิดร้าน ร้านรุ่งจนคืนเป็นสองเท่า', result: [{ who: 'nong', expr: 'happy', text: 'ร้านขายดีมาก! หนูคืนให้สองเท่าเลยนะพี่' }] },
        { chance: 0.4, fin: { cash: -200_000 }, bond: { nong: 2 }, effects: { family: 1 }, memory: 'ให้น้องยืมเงินเปิดร้าน แต่ร้านเจ๊ง', result: [{ who: 'nong', expr: 'sad', text: 'ร้านเจ๊งแล้วพี่... ขอโทษนะ หนูจะค่อย ๆ ผ่อนคืน' }] },
      ] },
      { text: '💡 ช่วยทำแผนธุรกิจ', lock: (s) => (s.stats.smart >= 6 ? false : 'ต้องมี 📘 ความรู้ 6+'), bond: { nong: 2 }, effects: { smart: 1 }, fin: { cash: -50_000 }, memory: 'ช่วยน้องฝนวางแผนเปิดร้าน',
        result: [{ who: 'nong', expr: 'happy', text: 'แผนพี่เป๊ะมาก ธนาคารอนุมัติเงินกู้ให้หนูแล้ว!' }] },
      { text: '🙅 ไม่ให้ หาเอาเอง', bond: { nong: -3 }, memory: 'ปฏิเสธไม่ให้น้องยืมเงิน',
        result: [{ who: 'nong', expr: 'angry', text: 'ก็ได้... ไม่ต้องห่วง หนูไม่มาขออีกแล้ว' }] },
    ],
  },
  {
    id: 'nong_care', age: 53, bg: 'home', title: 'ใครจะดูแลแม่',
    when: (s) => has(s, 'met_nong') && !has(s, 'mom_gone'),
    cast: (s) => (bondOf(s, 'nong') >= 5 ? ['nong', 'me', 'mom'] : ['nong', 'me']),
    lines: (s) => [bondOf(s, 'nong') >= 5
      ? { who: 'nong', text: 'แม่เริ่มเดินไม่ไหวแล้ว เราผลัดกันดูแลนะพี่ หนูรับวันธรรมดาเอง' }
      : { who: 'nong', expr: 'angry', text: 'หนูดูแลแม่คนเดียวมาสามปีแล้ว พี่เคยกลับมาบ้านบ้างไหม?' }],
    choices: [
      { text: '🤝 ผลัดกันดูแล', bond: { nong: 2 }, effects: { family: 2, money: -1 }, memory: 'ผลัดกับน้องฝนดูแลแม่',
        result: [{ text: 'ทุกเสาร์อาทิตย์ บ้านเก่ากลับมามีเสียงหัวเราะอีกครั้ง' }] },
      { text: '💰 ส่งเงินให้แทน', fin: { cash: -300_000 }, bond: { nong: -1 }, effects: { family: 1 }, memory: 'ส่งเงินให้น้องดูแลแม่แทนตัวเอง',
        result: [{ who: 'nong', text: 'เงินซื้อเวลาไม่ได้หรอกนะพี่' }] },
      { text: '🏠 รับแม่มาอยู่ด้วย', lock: (s) => (s.cash + s.invest >= 1_000_000 ? false : 'ต้องมีเงิน ฿1M+'), bond: { nong: 3 }, effects: { family: 3, happy: -1 }, memory: 'รับแม่มาอยู่ด้วยที่บ้าน',
        result: [{ who: 'nong', expr: 'happy', text: 'ขอบคุณนะพี่... หนูได้พักบ้างแล้ว' }] },
    ],
  },
  {
    id: 'nong_fight', age: 57, bg: 'home', title: 'มรดกของแม่',
    when: (s) => has(s, 'met_nong') && bondOf(s, 'nong') <= 3,
    because: (s) => (has(s, 'met_nong') ? 'เพราะความสัมพันธ์พี่น้องที่ร้าวมาตลอดหลายปี' : null),
    cast: ['nong', 'me'], timer: 9,
    lines: [{ who: 'nong', expr: 'angry', text: 'บ้านกับที่ดินของแม่ หนูควรได้มากกว่า เพราะหนูเป็นคนดูแลแม่!' }],
    choices: [
      { text: '⚖️ ฟ้องศาลแบ่งครึ่ง', fin: { invest: 1_200_000, cash: -200_000 }, bond: { nong: -5 }, flags: ['sibling_war'], effects: { family: -3, happy: -2 }, memory: 'ฟ้องศาลแย่งมรดกกับน้องฝน',
        result: [{ text: 'ชนะคดี ได้ที่ดินครึ่งหนึ่ง... แต่ไม่ได้คุยกับน้องอีกเลย' }] },
      { text: '🤲 ยกให้น้องทั้งหมด', bond: { nong: 4 }, flags: ['gave_inherit'], effects: { family: 2, happy: 1 }, memory: 'ยกมรดกของแม่ให้น้องฝนทั้งหมด',
        result: [{ who: 'nong', expr: 'sad', text: '(น้องฝนร้องไห้) ...ขอโทษนะพี่ หนูพูดแรงไป' }] },
      { text: '🍜 ชวนกินข้าวคุยกัน', lock: (s) => (s.stats.social >= 7 ? false : 'ต้องมี 🗣️ เข้าสังคม 7+'), bond: { nong: 5 }, fin: { invest: 500_000 }, effects: { family: 3 }, memory: 'คืนดีกับน้องฝนในวงข้าว',
        result: [{ who: 'nong', expr: 'happy', text: 'นานแล้วนะที่เราไม่ได้กินก๋วยเตี๋ยวด้วยกัน... แบ่งกันคนละครึ่งเถอะพี่' }] },
    ],
  },
  {
    id: 'nong_trip', age: 63, bg: 'village', title: 'ทริปพี่น้อง',
    when: (s) => bondOf(s, 'nong') >= 7,
    because: () => 'เพราะพี่น้องที่ดูแลกันมาตลอดชีวิต',
    cast: ['me', 'nong'],
    lines: [{ who: 'nong', expr: 'happy', text: 'พี่! ไปเที่ยวบ้านยายด้วยกันไหม ต้นมะม่วงยังอยู่นะ' }],
    choices: [
      { text: '🚐 ไปสิ ขับรถไปกันสองคน', effects: { happy: 3, family: 1 }, flags: ['countryside'], memory: 'นั่งรถไปบ้านยายกับน้องฝน เล่าเรื่องสมัยเด็กทั้งทาง',
        result: [{ text: 'ใต้ต้นมะม่วงต้นเดิม สองพี่น้องหัวเราะเหมือนตอนเจ็ดขวบ' }] },
      { text: '📞 ไม่ไหว แต่โทรคุยทุกวัน', effects: { happy: 1 }, bond: { nong: 1 }, memory: 'โทรคุยกับน้องฝนทุกเย็น',
        result: [{ text: 'วิดีโอคอลทุกเย็น น้องส่งรูปมะม่วงมาให้ดู' }] },
    ],
  },

  // ───────── เจ (คู่แข่ง → เพื่อน/หุ้นส่วน) ─────────
  {
    id: 'jay_meet', age: 11, bg: 'classroom', title: 'เด็กใหม่ไฟแรง',
    cast: ['me', 'jay'],
    lines: [{ who: 'jay', expr: 'angry', text: 'ได้ยินว่า {name} ได้ที่หนึ่งของห้องเหรอ? เทอมนี้เราจะเอาชนะให้ได้!' }],
    choices: [
      { text: '🔥 รับคำท้า!', flags: ['met_jay', 'rival'], bond: { jay: 2 }, effects: { smart: 1 }, memory: 'รับคำท้าแข่งคะแนนกับเจเด็กใหม่',
        result: [{ who: 'jay', expr: 'happy', text: 'ดี! งั้นมาดูกัน ใครจะเก่งกว่า' }] },
      { text: '🤝 ชวนติวด้วยกัน', flags: ['met_jay'], bond: { jay: 3 }, effects: { smart: 1, social: 1 }, memory: 'ชวนเจคู่แข่งมาติวด้วยกัน',
        result: [{ who: 'jay', expr: 'surprised', text: 'เอ๊ะ... ก็ได้ แต่อย่าคิดว่าเราจะออมมือนะ' }] },
      { text: '🙄 ไม่สนใจ', flags: ['met_jay'], bond: { jay: -1 }, memory: 'เมินเจที่มาท้าแข่ง',
        result: [{ who: 'jay', expr: 'angry', text: 'หยิ่งนักนะ! เดี๋ยวเจอกัน' }] },
    ],
  },
  {
    id: 'jay_contest', age: 17, bg: 'schoolyard', title: 'ศึกตอบปัญหา', minigame: 'math',
    when: (s) => has(s, 'met_jay'),
    because: (s) => (has(s, 'rival') ? 'เพราะรับคำท้าของเจตั้งแต่ ป.5' : 'เพราะเจคือคู่แข่งตลอดกาล'),
    cast: ['me', 'jay'], lines: [{ who: 'jay', text: 'รอบชิงชนะเลิศ! คนที่ตอบเร็วที่สุดได้ทุนเรียนต่อ' }],
    reward: (p) => p >= 0.7
      ? { effects: { smart: 2, social: 1 }, bond: { jay: 2 }, memory: 'ชนะเจในศึกตอบปัญหา ได้ทุนเรียนต่อ', text: '🏆 ชนะ! เจยื่นมือมาจับ "ยอมรับเลยว่าเก่ง"' }
      : p >= 0.4 ? { effects: { smart: 1 }, bond: { jay: 1 }, memory: 'แพ้เจไปแบบหายใจรดต้นคอ', text: '🤏 แพ้ไปคะแนนเดียว เจบอก "ปีหน้าแก้มือนะ"' }
      : { effects: { happy: -1 }, bond: { jay: -1 }, memory: 'แพ้ศึกตอบปัญหาให้เจขาดลอย', text: '😞 เจชนะขาดลอย แล้วหัวเราะเยาะ' },
  },
  {
    id: 'jay_startup', age: 26, bg: 'city', title: 'สตาร์ทอัพของเจ',
    when: (s) => has(s, 'met_jay') && bondOf(s, 'jay') >= 2,
    because: (s) => (bondOf(s, 'jay') >= 6 ? 'เพราะคุณกับเจผ่านอะไรมาด้วยกันเยอะ' : 'เพราะเจยังจำคู่แข่งคนนี้ได้'),
    cast: ['jay', 'me'],
    lines: [{ who: 'jay', expr: 'happy', text: 'เราจะทำแอปส่งอาหารริมทาง! ขาดอีก 5 แสน มาเป็นหุ้นส่วนกันไหม?' }],
    choices: [
      { text: '🚀 ลงทุน 5 แสน', fin: { cash: -500_000 }, outcomes: [
        { chance: 0.4, fin: { invest: 3_000_000 }, bond: { jay: 3 }, flags: ['cofounder'], effects: { happy: 2 }, memory: 'ลงทุนสตาร์ทอัพกับเจ แล้วบริษัทถูกซื้อกิจการ', result: [{ who: 'jay', expr: 'happy', text: 'บริษัทใหญ่ขอซื้อกิจการ! หุ้นของนายตอนนี้ 3 ล้าน!' }] },
        { chance: 0.35, bond: { jay: 1 }, effects: { happy: -1 }, memory: 'สตาร์ทอัพกับเจเจ๊ง เงินหายหมด', result: [{ who: 'jay', expr: 'sad', text: 'เงินทุนหมดแล้ว... ขอโทษนะที่ทำให้เสียเงิน' }] },
        { chance: 0.25, bond: { jay: -6 }, flags: ['jay_betray'], effects: { happy: -3 }, memory: 'โดนเจเตะออกจากบริษัทที่ร่วมก่อตั้ง', result: [{ text: 'วันหนึ่งชื่อคุณหายไปจากรายชื่อผู้ถือหุ้น... เจไม่รับสายอีกเลย' }] },
      ] },
      { text: '🤝 เป็นหุ้นส่วนเต็มตัว', lock: (s) => needBond(s, 'jay', 6) || (s.stats.smart >= 7 ? false : 'ต้องมี 📘 ความรู้ 7+'),
        fin: { cash: -500_000 }, outcomes: [
          { chance: 0.65, fin: { invest: 5_000_000 }, bond: { jay: 3 }, flags: ['cofounder'], effects: { happy: 3, social: 2 }, memory: 'ร่วมก่อตั้งสตาร์ทอัพยูนิคอร์นกับเจ', result: [{ who: 'jay', expr: 'happy', text: 'เราทำได้! ยูนิคอร์นตัวแรกของเรา!' }] },
          { chance: 0.35, bond: { jay: 2 }, effects: { smart: 1 }, memory: 'สตาร์ทอัพกับเจไม่รอด แต่ยังเป็นเพื่อนกัน', result: [{ who: 'jay', text: 'เจ๊งก็เจ๊ง แต่ทำกับนายสนุกที่สุดแล้ว' }] },
        ] },
      { text: '🦊 ขโมยไอเดียไปทำเอง', flags: ['betrayed_jay'], bond: { jay: -8 }, outcomes: [
        { chance: 0.45, fin: { invest: 2_500_000 }, effects: { happy: 1, social: -1 }, memory: 'ขโมยไอเดียของเจไปเปิดบริษัทเองจนรวย', result: [{ who: 'jay', expr: 'angry', text: 'นายมันเลว! ไม่ต้องมาเรียกเราว่าเพื่อนอีก' }] },
        { chance: 0.55, fin: { cash: -300_000 }, effects: { happy: -2, social: -2 }, memory: 'ขโมยไอเดียเจแล้วเจ๊ง แถมเสียเพื่อน', result: [{ text: 'บริษัทเจ๊งในปีเดียว... และเจบล็อกทุกช่องทาง' }] },
      ] },
      { text: '🙏 อวยพร แต่ไม่ร่วม', bond: { jay: -1 }, memory: 'ปฏิเสธลงทุนสตาร์ทอัพของเจ',
        result: [{ who: 'jay', text: 'ไม่เป็นไร ถ้าดังแล้วอย่ามาเสียดายนะ!' }] },
    ],
  },
  {
    id: 'jay_help', age: 46, bg: 'city', title: 'มือที่ยื่นมา',
    when: (s) => bondOf(s, 'jay') >= 5 && !has(s, 'jay_betray') && !has(s, 'betrayed_jay'),
    force: (s) => s.debt >= 800_000 && bondOf(s, 'jay') >= 5,
    chance: 0.5,
    because: (s) => (s.debt >= 800_000 ? 'เพราะหนี้ท่วม และเพื่อนเก่ายังจำคุณได้' : 'เพราะมิตรภาพที่สะสมมาตั้งแต่เด็ก'),
    cast: ['jay', 'me'],
    lines: (s) => [s.debt >= 800_000
      ? { who: 'jay', text: 'ได้ยินว่าเจอหนี้หนัก... ให้เราช่วยเถอะ ไม่ต้องรีบคืน' }
      : { who: 'jay', expr: 'happy', text: 'ไปตกปลากันไหม เหมือนสมัยมหาลัย คิดถึงว่ะ' }],
    choices: [
      { text: '🙏 รับน้ำใจเพื่อน', when: (s) => s.debt >= 800_000, fin: { debt: -700_000 }, bond: { jay: 1 }, effects: { happy: 2 }, memory: 'เจช่วยปลดหนี้ตอนชีวิตตกต่ำ',
        result: [{ who: 'jay', expr: 'happy', text: 'เพื่อนกันนี่หว่า สมัยก่อนนายก็เคยช่วยเรา' }] },
      { text: '😤 ศักดิ์ศรีค้ำคอ', when: (s) => s.debt >= 800_000, effects: { happy: -1 }, bond: { jay: -1 }, memory: 'ปฏิเสธความช่วยเหลือจากเจ',
        result: [{ text: 'ไม่อยากให้ใครเห็นตอนล้ม... แม้แต่เพื่อนสนิท' }] },
      { text: '🎣 ไปตกปลากัน!', when: (s) => s.debt < 800_000, effects: { happy: 2, body: 1 }, bond: { jay: 2 }, memory: 'ไปตกปลากับเจเหมือนสมัยเรียน',
        result: [{ text: 'ปลาไม่กินเหยื่อสักตัว แต่หัวเราะกันจนท้องแข็ง' }] },
      { text: '📅 ไว้ก่อนนะ งานยุ่ง', when: (s) => s.debt < 800_000, bond: { jay: -2 }, effects: { money: 1 }, memory: 'เลื่อนนัดเจไปเรื่อย ๆ',
        result: [{ who: 'jay', expr: 'sad', text: 'โอเค... ไว้ว่างแล้วทักมานะ' }] },
    ],
  },
  {
    id: 'jay_sorry', age: 50, bg: 'park', title: 'คำขอโทษที่มาช้า',
    when: (s) => has(s, 'jay_betray'),
    because: () => 'เพราะวันที่เจเตะคุณออกจากบริษัท',
    cast: ['jay', 'me'],
    lines: [{ who: 'jay', expr: 'sad', text: 'เราเป็นมะเร็ง... ก่อนไป อยากขอโทษเรื่องบริษัทวันนั้น' }],
    choices: [
      { text: '🫂 ให้อภัย', flags: ['forgave_jay'], bond: { jay: 6 }, effects: { happy: 3 }, memory: 'ให้อภัยเจในวันสุดท้าย',
        result: [{ who: 'jay', expr: 'happy', text: 'ขอบใจ... นายคือคู่แข่งที่ดีที่สุดในชีวิตเรา' }] },
      { text: '💰 ขอส่วนแบ่งคืน', fin: { cash: 1_500_000 }, effects: { happy: -1 }, memory: 'เรียกเงินคืนจากเจที่หักหลัง',
        result: [{ text: 'ได้เงินคืนครบ... แต่ใจยังหนักอึ้ง' }] },
      { text: '🚶 เดินจากไป', effects: { happy: -2 }, memory: 'ไม่ยอมฟังคำขอโทษของเจ',
        result: [{ text: 'สามเดือนต่อมา ได้ข่าวว่าเจจากไปแล้ว' }] },
    ],
  },

  // ───────── โกโก้ (หมา) ─────────
  {
    id: 'coco_found', age: 8, bg: 'village', title: 'ลูกหมากลางสายฝน',
    when: (s) => !s.flags.includes('coco'),
    cast: ['me', 'coco'],
    lines: [{ text: 'ระหว่างทางกลับบ้าน ลูกหมาตัวเปียกโชกนั่งสั่นอยู่ใต้ศาลา' }],
    choices: [
      { text: '🐶 อุ้มกลับบ้าน', flags: ['coco'], bond: { coco: 4 }, effects: { happy: 2, family: -1 }, memory: 'เก็บลูกหมาชื่อโกโก้มาเลี้ยง',
        result: [{ who: 'mom', expr: 'angry', text: 'ใครจะเลี้ยง!? ...ก็ได้ ๆ ตั้งชื่อว่าโกโก้แล้วกัน' }] },
      { text: '🍞 แบ่งขนมให้แล้วไป', bond: { coco: 1 }, effects: { happy: 1 }, memory: 'แบ่งขนมปังให้ลูกหมาข้างทาง',
        result: [{ text: 'ลูกหมากระดิกหาง มองตามจนลับสายตา' }] },
      { text: '🙈 เดินผ่านไป', effects: { happy: -1 }, memory: 'เดินผ่านลูกหมาที่สั่นอยู่กลางฝน',
        result: [{ text: 'เสียงครางเบา ๆ ตามมาในความฝันคืนนั้น' }] },
    ],
  },
  {
    id: 'coco_walk', age: 12, bg: 'park', title: 'โกโก้อยากเล่น', minigame: 'catch',
    when: (s) => has(s, 'coco'),
    cast: ['me', 'coco'], lines: [{ who: 'coco', text: 'โฮ่ง! โฮ่ง! (คาบจานร่อนมาวางที่เท้า)' }],
    reward: (p) => p >= 0.6
      ? { effects: { body: 2, happy: 2 }, bond: { coco: 3 }, memory: 'เล่นจานร่อนกับโกโก้ทุกเย็น', text: '🥏 โกโก้กระโดดรับจานร่อนกลางอากาศ!' }
      : { effects: { body: 1, happy: 1 }, bond: { coco: 1 }, memory: 'พาโกโก้วิ่งเล่นที่สวน', text: '🐾 วิ่งจนเหนื่อยทั้งคนทั้งหมา' },
  },
  {
    id: 'coco_fire', age: 15, bg: 'home', title: 'คืนไฟไหม้',
    when: (s) => has(s, 'coco') && bondOf(s, 'coco') >= 5,
    chance: 0.6,
    because: () => 'เพราะคุณรับโกโก้มาเลี้ยงตั้งแต่ 8 ขวบ',
    cast: ['coco', 'me'], timer: 6,
    lines: [{ who: 'coco', text: 'โฮ่ง!! โฮ่ง!! (ตีสองแล้ว โกโก้เห่าไม่หยุด... ได้กลิ่นควันไฟ!)' }],
    choices: [
      { text: '🔥 ปลุกทุกคนหนี!', bond: { coco: 2 }, effects: { family: 3 }, flags: ['coco_hero'], memory: 'โกโก้เห่าปลุกทั้งบ้านหนีไฟทัน',
        result: [{ text: 'ทั้งบ้านหนีออกมาทัน! โกโก้กลายเป็นฮีโร่ของซอย' }] },
      { text: '😴 เงียบน่า! นอนต่อ', onTimeout: true, fin: { cash: -50_000 }, effects: { family: -1, body: -1 }, bond: { coco: -1 }, memory: 'ไม่ฟังเสียงเห่าเตือนไฟไหม้',
        result: [{ text: 'กว่าจะรู้ตัว ครัวไหม้ไปครึ่งหลัง... โชคดีที่ทุกคนรอด' }] },
    ],
  },
  {
    id: 'coco_old', age: 21, bg: 'home', title: 'โกโก้แก่แล้ว',
    when: (s) => has(s, 'coco'),
    cast: ['me', 'coco'],
    lines: [{ text: 'โกโก้อายุ 13 ปีแล้ว เดินช้าลงทุกวัน หมอบอกว่าไตเริ่มไม่ไหว' }],
    choices: [
      { text: '💉 รักษาเต็มที่', fin: { cash: -60_000 }, bond: { coco: 2 }, effects: { happy: -1 }, flags: ['coco_gone'], memory: 'อยู่ข้างโกโก้จนลมหายใจสุดท้าย',
        result: [{ who: 'coco', text: '(โกโก้เลียมือเป็นครั้งสุดท้าย แล้วหลับไปอย่างสงบ)' }] },
      { text: '🏡 พากลับบ้านให้อยู่สบาย', bond: { coco: 1 }, effects: { happy: -2, family: 1 }, flags: ['coco_gone'], memory: 'พาโกโก้กลับบ้านไปหลับใต้ต้นไม้',
        result: [{ text: 'โกโก้หลับใต้ต้นมะม่วงที่มันชอบนอนทุกบ่าย' }] },
      { text: '📚 ยุ่งเรื่องเรียน ฝากที่บ้าน', bond: { coco: -2 }, effects: { happy: -3, smart: 1 }, flags: ['coco_gone', 'missed_coco'], memory: 'ไม่ได้กลับไปลาโกโก้',
        result: [{ who: 'mom', expr: 'sad', text: 'โกโก้นอนรอที่หน้าประตูทุกวัน... จนวันสุดท้าย' }] },
    ],
  },
  {
    id: 'coco_pup', age: 36, bg: 'park', title: 'หน้าคุ้น ๆ',
    when: (s) => has(s, 'coco_gone') && bondOf(s, 'coco') >= 6,
    chance: 0.7,
    because: () => 'เพราะความรักที่มีให้โกโก้ไม่เคยหายไป',
    cast: ['me', 'coco'],
    lines: [{ text: 'ที่สวนสาธารณะ ลูกหมาสีน้ำตาลวิ่งมาซบขา... หน้าเหมือนโกโก้ไม่มีผิด' }],
    choices: [
      { text: '🐾 รับมาเลี้ยง ชื่อ "โกโก้ 2"', effects: { happy: 3, family: 1 }, bond: { coco: 2 }, memory: 'รับโกโก้ 2 มาเลี้ยง',
        result: [{ who: 'coco', text: 'โฮ่ง! (กระดิกหางรัว ๆ)' }] },
      { text: '🥲 ลูบหัวแล้วยิ้ม', effects: { happy: 1 }, memory: 'เจอลูกหมาหน้าเหมือนโกโก้',
        result: [{ text: 'บางทีโกโก้คงแวะมาทักทาย' }] },
    ],
  },
]
