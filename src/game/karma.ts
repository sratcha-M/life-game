import type { GameState, Line, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
const past = (s: GameState, ...f: string[]) => s.life === 2 && !!s.past?.flags && f.some((x) => s.past!.flags!.includes(x))
const pastMem = (s: GameState, re: RegExp) => s.past?.history.find((h) => re.test(h.text))
const karmaBanner = (kind: string, s: GameState, re: RegExp) => {
  const m = pastMem(s, re)
  return `🔮 กรรม${kind}กำลังทำงาน${m ? ` — ชาติก่อน ตอนอายุ ${m.age}: ${m.text}` : ''}`
}

// ═════════════ 🔮 กรรมข้ามชาติ (ชาติที่ 2 เปลี่ยนจริง) ═════════════
export const KARMA_SCENES: Scene[] = [
  {
    id: 'k_pet', age: 7, bg: 'village', cast: ['me'], title: '🔮 สัตว์ตัวนั้น', mark: 'karma',
    when: (s) => past(s, 'coco', 'coco_hero') || (s.life === 2 && !!pastMem(s, /ลูกหมา|โกโก้/)),
    because: (s) => karmaBanner('เมตตา', s, /ลูกหมา|โกโก้/),
    lines: [{ text: 'แมวจรตัวหนึ่งเดินตามกลับบ้านทุกวัน... มันนั่งมองคุณนิ่ง ๆ เหมือนเคยรู้จักกันมาก่อน' }, { text: '🐱 เหมียว... (มันเอาหัวมาถูขา ไม่ยอมไปไหน)' }],
    choices: [
      { text: '🐱 "เธอเคยรู้จักเราใช่ไหม"', flags: ['karma_pet', 'coco'], bond: { coco: 5 }, effects: { happy: 3 }, memory: 'แมวจรที่เหมือนเคยรู้จักกันมาก่อนตามมาอยู่ด้วย',
        result: [{ text: 'คืนนั้นฝันถึงหมาสีน้ำตาลตัวหนึ่ง... ตื่นมาแมวนอนอยู่ตรงเท้า' }] },
      { text: '🚪 ไล่ไป กลัวแม่ดุ', effects: { happy: -1 }, memory: 'ไล่แมวจรที่ตามมาไป', result: [{ text: 'มันนั่งรอหน้าบ้านอีกสามวัน แล้วก็หายไป' }] },
    ],
  },
  {
    id: 'k_love', age: 28, bg: 'park', cast: ['me', 'fah'], title: '🔮 กรรมความสัมพันธ์', mark: 'karma',
    when: (s) => past(s, 'divorced', 'cheated') && has(s, 'partner'),
    because: (s) => karmaBanner('ความสัมพันธ์', s, /หย่า|นอกใจ|เลิก/),
    lines: [{ text: '{fah}รักคุณมาก... แต่ทุกครั้งที่{fah}กลับบ้านช้า คุณกลับรู้สึกเหมือนเขากำลังจะทิ้งคุณไป' }, { who: 'fah', expr: 'sad', text: 'ทำไมถึงไม่เชื่อใจเราเลยล่ะ?' }],
    timer: 10,
    choices: [
      { text: '🫂 เปิดใจเล่าความกลัว', effects: { love: 3, happy: 2 }, flags: ['karma_healed'], memory: 'ยอมเปิดใจเรื่องความกลัวถูกทิ้ง กรรมความสัมพันธ์คลายลง',
        result: [{ who: 'fah', expr: 'happy', text: 'เราไม่ไปไหนหรอก... สัญญา' }] },
      { text: '📱 แอบเช็กมือถือ{fah}', onTimeout: true, effects: { love: -3, happy: -2 }, memory: 'ระแวงจนแอบเช็กมือถือคนรัก',
        result: [{ who: 'fah', expr: 'angry', text: 'เราเหนื่อยกับความระแวงนี้แล้วนะ' }] },
      { text: '🏃 ทิ้งก่อนจะโดนทิ้ง', effects: { love: -5, happy: -3 }, flags: ['divorced'], memory: 'เลิกกับ{fah}ก่อนเพราะกลัวถูกทิ้ง วงจรกรรมซ้ำรอย',
        result: [{ text: 'วงจรเดิม... หมุนกลับมาอีกครั้ง' }] },
    ],
  },
  {
    id: 'k_bully', age: 9, bg: 'schoolyard', cast: ['me', 'ton'], title: '🔮 สนามเด็กเล่น', mark: 'karma',
    when: (s) => past(s, 'ignored_ton'),
    because: (s) => karmaBanner('มิตรภาพ', s, /เดินผ่านตอนต้น/),
    lines: [{ text: 'ชาตินี้... คุณคือคนที่โดนพี่ ๆ รุมแกล้ง ทุกคนเดินผ่านไม่มีใครช่วย' }, { who: 'ton', text: 'หยุดนะ! (เด็กคนหนึ่งวิ่งเข้ามายืนบังคุณ)' }],
    choices: [
      { text: '🥹 ขอบคุณที่ช่วย', effects: { friend: 4, family: 1 }, flags: ['saved_ton'], memory: 'ชาตินี้เป็นฝ่ายถูกช่วย และไม่ลืมความรู้สึกนั้น',
        result: [{ who: 'ton', expr: 'happy', text: 'เป็นเพื่อนกันนะ!' }] },
    ],
  },
  {
    id: 'k_grandma', age: 13, bg: 'hospital', cast: ['me', 'yai'], title: '🔮 นาฬิกาที่เดินช้าลง', mark: 'karma', timer: 6,
    when: (s) => past(s, 'missed_yai'),
    because: (s) => karmaBanner('ความเสียใจ', s, /ไปหายายไม่ทัน/),
    lines: [{ text: 'โทรศัพท์ดัง: ยายเข้าโรงพยาบาล... ใจเต้นแรงเหมือนเคยเจอเรื่องนี้มาก่อน' }],
    choices: [
      { text: '🏃 วิ่งไปหายายทันที', flags: ['yai_goodbye'], effects: { family: 4, happy: 1 }, memory: 'ชาตินี้วิ่งไปหายายทัน ได้กอดยายครั้งสุดท้าย',
        result: [{ who: 'yai', expr: 'happy', text: 'มาแล้วเหรอหลาน... ยายรอหลานมาตั้งนาน' }] },
      { text: '📚 เดี๋ยวค่อยไป', onTimeout: true, flags: ['missed_yai'], effects: { happy: -4 }, memory: 'พลาดอีกครั้ง... ไปหายายไม่ทันเหมือนชาติก่อน',
        result: [{ text: 'ประวัติศาสตร์ซ้ำรอย... ไปถึงช้าไปห้านาที' }] },
    ],
  },
  {
    id: 'k_money', age: 31, bg: 'city', cast: ['me'], title: '🔮 เงินที่ไม่ใช่ของเรา', mark: 'karma',
    when: (s) => past(s, 'hush', 'scammer', 'betrayed_jay'),
    because: (s) => karmaBanner('การเงิน', s, /ปิดปาก|แชร์|ขโมยไอเดีย/),
    lines: [{ text: 'บริษัทที่คุณฝากเงินทั้งหมดไว้... ผู้บริหารหอบเงินหนีไปต่างประเทศ' }],
    choices: [
      { text: '⚖️ รวมตัวผู้เสียหายฟ้อง', fin: { cashMul: 0.5 }, effects: { social: 2, happy: -1 }, memory: 'โดนโกงเงินแล้วรวมตัวผู้เสียหายสู้คดี', result: [{ text: 'ได้คืนมาครึ่งเดียว... แต่เข้าใจแล้วว่าคนที่โดนโกงรู้สึกยังไง' }] },
      { text: '😶 ยอมรับมัน', fin: { cashMul: 0.3 }, effects: { happy: -2, smart: 1 }, memory: 'ยอมรับการถูกโกงเหมือนเป็นการชดใช้', result: [{ text: 'บางอย่างที่เคยทำ... ต้องชดใช้สักทาง' }] },
    ],
  },
  {
    id: 'k_scholar', age: 18, bg: 'campus', cast: ['me'], title: '🔮 ทุนจากคนแปลกหน้า', mark: 'karma',
    when: (s) => past(s, 'hero', 'donor', 'pay_forward', 'gave_inherit'),
    because: (s) => karmaBanner('ความดี', s, /ช่วยชีวิต|บริจาค|ส่งต่อ|ยกมรดก/),
    lines: [{ text: 'จดหมายแจ้งว่าได้ทุนเรียนฟรีสี่ปี จากมูลนิธิที่มีชื่อคุ้นหูอย่างประหลาด...' }],
    choices: [
      { text: '🎓 รับทุนด้วยความขอบคุณ', fin: { cash: 300_000 }, effects: { smart: 2, happy: 2 }, memory: 'ได้ทุนเรียนจากมูลนิธิที่เหมือนเคยผูกพันกัน', result: [{ text: 'บนผนังมูลนิธิ มีรูปผู้ก่อตั้งที่หน้าตาคุ้นมาก...' }] },
    ],
  },
  {
    id: 'k_sibling', age: 6, bg: 'hospital', cast: ['mom', 'nong', 'me'], title: '🔮 น้องคนนี้', mark: 'karma',
    when: (s) => past(s, 'sibling_war', 'nong_hurt', 'nong_t1_ignore') && !has(s, 'met_nong'),
    because: (s) => karmaBanner('พี่น้อง', s, /น้องฝน/),
    lines: [{ text: 'วินาทีแรกที่เห็นน้องสาวคนใหม่ ใจหนึ่งอยากกอด อีกใจรู้สึกผิดอะไรสักอย่างที่จำไม่ได้' }],
    choices: [
      { text: '🤲 สัญญาว่าจะดูแลน้อง', flags: ['met_nong', 'nong_kind'], bond: { nong: 5 }, effects: { family: 2 }, memory: 'สัญญากับตัวเองว่าชาตินี้จะดูแลน้องให้ดี', result: [{ who: 'mom', expr: 'happy', text: 'ทำไมลูกร้องไห้ล่ะ... ดีใจขนาดนั้นเลยเหรอ' }] },
      { text: '😐 ทำเฉย ๆ', flags: ['met_nong'], bond: { nong: -1 }, memory: 'รู้สึกแปลก ๆ กับน้องคนใหม่', result: [{ text: 'ความรู้สึกแปลก ๆ นั้นติดอยู่ในใจนาน' }] },
    ],
  },
]

// ═════════════ 😨 เหตุการณ์ที่ผู้เล่นกลัว ═════════════
const married = (s: GameState) => has(s, 'partner') && !has(s, 'divorced')
export const FEAR_SCENES: Scene[] = [
  ...[27, 33, 39].map((age): Scene => ({
    id: `f_call_${age}`, age, bg: 'home', cast: ['me'], title: '📱 01:23 น.', mark: 'fear', chance: 0.35,
    call: { who: 'mom', kind: 'call', time: '01:23' }, timer: 7,
    when: (s) => !has(s, 'f_call'),
    lines: [{ who: 'mom', expr: 'sad', text: 'ลูก... แม่มีเรื่องอยากคุยด้วย' }],
    choices: [
      { text: '📞 รับสาย', flags: ['f_call', 'f_call_ans'], memory: 'รับสายแม่ตอนตีหนึ่ง', result: [{ who: 'mom', expr: 'sad', text: 'พ่อเข้าโรงพยาบาล...' }] },
      { text: '📵 ไม่รับ พรุ่งนี้ค่อยโทรกลับ', onTimeout: true, flags: ['f_call', 'f_call_miss'], effects: { family: -2, happy: -2 }, memory: 'ไม่รับสายแม่ตอนตีหนึ่ง คืนที่พ่อเข้าโรงพยาบาล',
        result: [{ text: 'เช้ามาเห็นมิสคอล 9 สาย... พ่อผ่าตัดไปแล้วโดยที่คุณไม่รู้' }] },
    ],
  })),
  ...[27, 33, 39].map((age): Scene => ({
    id: `f_bill_${age}`, age, bg: 'hospital', cast: ['me', 'mom'], title: '💰 ค่ารักษา ฿80,000', mark: 'fear', timer: 12,
    when: (s) => has(s, 'f_call_ans') && !has(s, 'f_bill'),
    lines: [{ who: 'mom', expr: 'sad', text: 'หมอบอกต้องผ่าตัดด่วน ค่ารักษา 80,000 บาท... แม่ไม่มีเงินพอ' }],
    choices: [
      { text: '💰 จ่ายเอง', flags: ['f_bill'], lock: (s) => (s.cash >= 80_000 ? false : 'เงินสดไม่ถึง ฿80,000'), fin: { cash: -80_000 }, effects: { family: 3 }, memory: 'จ่ายค่าผ่าตัดพ่อเองทั้งหมด', result: [{ text: 'ผ่าตัดสำเร็จ พ่อจับมือแน่นตอนฟื้น' }] },
      { text: '💳 กู้เงิน', flags: ['f_bill'], fin: { debt: 95_000, cash: 0 }, effects: { family: 2, happy: -1 }, memory: 'กู้เงินมารักษาพ่อ', result: [{ text: 'พ่อรอดแล้ว... ส่วนหนี้ค่อยว่ากัน' }] },
      { text: '💑 ขอความช่วยเหลือจากแฟน', flags: ['f_bill'], when: married, outcomes: [
        { chance: 0.7, effects: { love: 2, family: 2 }, memory: '{fah}ช่วยจ่ายค่ารักษาพ่อโดยไม่ลังเล', result: [{ who: 'fah', text: 'พ่อเธอก็คือพ่อเรา ไม่ต้องคิดมาก' }] },
        { chance: 0.3, effects: { love: -2 }, fin: { debt: 80_000 }, memory: 'ขอเงินแฟนรักษาพ่อแล้วทะเลาะกัน', result: [{ who: 'fah', expr: 'angry', text: 'เงินเก็บเราก็มีแค่นี้นะ!' }] },
      ] },
      { text: '👧 หารกับน้องฝน', flags: ['f_bill'], when: (s) => has(s, 'met_nong') && !has(s, 'sibling_war'), fin: { cash: -40_000 }, bond: { nong: 2 }, effects: { family: 2 }, memory: 'หารค่ารักษาพ่อกับน้องฝน', result: [{ who: 'nong', text: 'คนละครึ่งนะพี่ เราช่วยกัน' }] },
      { text: '🏥 รักษาตามสิทธิ', flags: ['f_bill'], onTimeout: true, outcomes: [
        { chance: 0.6, effects: { family: 1 }, memory: 'พ่อรักษาตามสิทธิบัตรทองจนหาย', result: [{ text: 'รอคิวนาน แต่หมอโรงพยาบาลรัฐดูแลดีมาก' }] },
        { chance: 0.4, effects: { family: -2, happy: -3 }, flags: ['dad_weak'], memory: 'รอคิวรักษานานจนพ่ออาการทรุด', result: [{ text: 'กว่าจะได้ผ่าตัด อาการพ่อทรุดลงมาก...' }] },
      ] },
    ],
  })),
  ...[36, 48, 58].map((age): Scene => ({
    id: `f_biopsy_${age}`, age, bg: 'hospital', cast: ['me'], title: '🩺 ผลชิ้นเนื้อ', mark: 'fear', chance: 0.25,
    when: (s) => !has(s, 'f_biopsy'),
    lines: [{ text: 'พยาบาลเรียกชื่อคุณ... "คุณหมอขอคุยเรื่องผลชิ้นเนื้อเป็นการส่วนตัวค่ะ"' }],
    choices: [
      { text: '😰 ฟังคนเดียว', flags: ['f_biopsy'], outcomes: [
        { chance: 0.7, effects: { happy: 2 }, memory: 'ผลชิ้นเนื้อออกมาไม่เป็นอะไร', result: [{ text: 'หมอยิ้ม "ไม่ใช่เนื้อร้ายครับ" ...ขาอ่อนจนต้องนั่ง' }] },
        { chance: 0.3, effects: { body: -2, happy: -3 }, fin: { cash: -300_000 }, flags: ['cancer'], memory: 'ตรวจเจอมะเร็งระยะแรก', result: [{ text: 'มะเร็งระยะแรก... หมอบอกยังรักษาหายได้' }] },
      ] },
      { text: '🤝 ขอให้ครอบครัวมาฟังด้วย', flags: ['f_biopsy'], effects: { family: 2 }, outcomes: [
        { chance: 0.7, effects: { happy: 2 }, memory: 'ฟังผลชิ้นเนื้อพร้อมครอบครัว ไม่เป็นอะไร', result: [{ text: 'หมอยิ้ม "ไม่ใช่เนื้อร้ายครับ"' }, { text: 'ทุกคนกอดกันกลางห้องตรวจ' }] },
        { chance: 0.3, effects: { body: -2, happy: -1 }, fin: { cash: -300_000 }, flags: ['cancer'], memory: 'ตรวจเจอมะเร็งระยะแรก แต่มีครอบครัวอยู่ข้าง ๆ', result: [{ text: 'ข่าวร้าย... แต่มีมือหลายมือจับไว้' }] },
      ] },
      { text: '🙈 ไม่อยากรู้ กลับบ้าน', flags: ['f_biopsy'], effects: { happy: 1 }, outcomes: [
        { chance: 0.7, memory: 'หนีไม่ฟังผลชิ้นเนื้อ (โชคดีที่ไม่เป็นอะไร)', result: [{ text: 'ปีถัดมาตรวจใหม่... ไม่เป็นอะไร โล่งอก' }] },
        { chance: 0.3, effects: { body: -4 }, end: 'heart', memory: 'หนีไม่ฟังผลชิ้นเนื้อ จนสายเกินไป', result: [{ text: 'กว่าจะกลับไปหาหมอ... ก็สายเกินไปแล้ว' }] },
      ] },
    ],
  })),
  ...[30, 42, 52].map((age): Scene => ({
    id: `f_hr_${age}`, age, bg: 'office', cast: ['me', 'boss'], title: '📩 อีเมลจาก HR', mark: 'fear', chance: 0.3,
    when: (s) => !has(s, 'f_hr') && ['office', 'dev', 'engineer', 'trader', 'lawyer'].includes(s.career ?? ''),
    lines: [{ text: '"ขอพบคุณที่ห้องประชุม 3 เวลา 9:00 น. พรุ่งนี้ — HR" ...คืนนั้นนอนไม่หลับ' }, { who: 'boss', text: 'บริษัทต้องลดคน... คุณมีสองทางเลือก' }],
    choices: [
      { text: '📦 รับเงินชดเชยแล้วไป', flags: ['f_hr', 'fired'], fin: { cash: 400_000 }, effects: { happy: -2 }, memory: 'โดนเลิกจ้าง รับเงินชดเชยก้อนใหญ่', result: [{ text: 'เดินออกจากตึกพร้อมกล่องกระดาษหนึ่งใบ' }] },
      { text: '💪 ขอลดเงินเดือนอยู่ต่อ', flags: ['f_hr', 'dreamer'], effects: { happy: -1, social: 1 }, memory: 'ยอมลดเงินเดือนเพื่อไม่ตกงาน', result: [{ text: 'ได้อยู่ต่อ... แต่เงินเดือนหายไป 30%' }] },
    ],
  })),
  ...[48, 52].map((age): Scene => ({
    id: `f_kid_${age}`, age, bg: 'home', cast: ['me'], title: '📱 02:10 น.', mark: 'fear', chance: 0.4, timer: 8,
    call: { who: 'kid', kind: 'chat', time: '02:10' },
    when: (s) => has(s, 'kid') && !has(s, 'f_kid'),
    lines: [{ text: 'ตีสองแล้ว ลูกยังไม่กลับบ้าน โทรไม่ติด... ข้อความสุดท้ายเมื่อ 4 ชั่วโมงก่อน: "อยู่กับเพื่อน"' }],
    choices: [
      { text: '🚗 ขับรถออกไปตามหา', flags: ['f_kid'], effects: { family: 2, body: -1 }, memory: 'ขับรถตามหาลูกตอนตีสอง', result: [{ text: 'เจอลูกนั่งร้องไห้ที่ป้ายรถเมล์ เพิ่งอกหัก... กอดกันทั้งคืน' }] },
      { text: '👮 แจ้งตำรวจ', flags: ['f_kid'], effects: { family: 1 }, memory: 'แจ้งตำรวจตามหาลูก', result: [{ text: 'ตำรวจพากลับมาตอนตีสาม ลูกงอนที่โดนแจ้งความ แต่ปลอดภัย' }] },
      { text: '😤 นอน พรุ่งนี้ค่อยว่ากัน', onTimeout: true, flags: ['f_kid'], effects: { family: -3, happy: -2 }, memory: 'ไม่ได้ออกไปตามหาลูกคืนนั้น', result: [{ text: 'เช้ามาลูกกลับบ้านตาบวม... และไม่ยอมเล่าอะไรอีกเลย' }] },
    ],
  })),
]

// ═════════════ 🛤️ สิ่งที่ไม่ได้เลือก (ความทรงจำย้อนหลัง) ═════════════
const roadOf = (s: GameState, age: number) => (s.roads ?? []).filter((r) => age - r.age >= 9 && age - r.age <= 25 && r.who).sort((a, b) => a.age - b.age)[0]
  ?? (s.roads ?? []).filter((r) => age - r.age >= 9).sort((a, b) => a.age - b.age)[0]
export const ROAD_SCENES: Scene[] = [29, 38, 47, 56, 65].map((age): Scene => ({
  id: `memory_${age}`, age, bg: 'home', cast: ['me'], title: '📱 ความทรงจำในวันนี้', mark: 'memory', chance: 0.4,
  call: { who: 'me', kind: 'chat' },
  when: (s) => !!roadOf(s, age),
  lines: (s): Line[] => {
    const r = roadOf(s, age)!
    const chose = r.chose.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
    const other = r.other.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
    return [
      { text: `📱 ความทรงจำ: เมื่อ ${age - r.age} ปีก่อนวันนี้ ตอนอายุ ${r.age} คุณเลือก "${chose}"` },
      { text: `ถ้าวันนั้นคุณเลือก "${other}"... ชีวิตอาจแตกต่างออกไป` },
    ]
  },
  choices: [
    { text: '🙂 ยิ้มให้อดีต', effects: { happy: 1 }, memory: 'ยิ้มให้ความทรงจำเก่า ไม่เสียดายทางที่เลือก', result: [{ text: 'ทุกทางที่เลือก พาให้มาเป็นคนในวันนี้' }] },
    { text: '💭 คิดถึงมันทั้งคืน', effects: { happy: -1, art: 1 }, memory: 'นอนคิดถึงทางที่ไม่ได้เลือก', result: [{ text: 'ถ้าวันนั้น... คำนี้วนอยู่ในหัวจนเช้า' }] },
  ],
}))
