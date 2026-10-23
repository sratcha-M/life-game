import { married } from './finance'
import { variant } from './cards'
import type { GameState, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
const L: Record<string, string> = { smart: '📘 ความรู้', body: '💪 ร่างกาย', art: '🎨 ศิลปะ', social: '🗣️ เข้าสังคม', money: '💰 เงิน', happy: '😊 ความสุข' }
/** ต้องมีค่าสถานะถึงเกณฑ์ */
const need = (s: GameState, req: Record<string, number>) => {
  const miss = Object.entries(req).filter(([k, v]) => s.stats[k as keyof typeof s.stats] < v)
  return miss.length ? 'ต้องมี ' + miss.map(([k, v]) => `${L[k]} ${v}+`).join(', ') : false
}

/**
 * เนื้อเรื่องทั้งหมด เรียงตามลำดับเวลา
 * - when: เงื่อนไขที่ฉากจะเกิด
 * - chance: โอกาสเกิด (เหตุการณ์สุ่ม)
 * - {name} จะถูกแทนด้วยชื่อผู้เล่น
 */
export const SCENES: Scene[] = [
  // ───────────── วัยทารก ─────────────
  {
    id: 'birth', age: 0, bg: 'hospital', title: 'แรกเกิด',
    when: (s) => variant(s, 'birth', 3) === 0,
    cast: ['mom', 'me', 'dad'],
    lines: [
      { who: 'mom', expr: 'happy', text: 'สวัสดีนะลูก ยินดีต้อนรับสู่โลกใบนี้' },
      { who: 'dad', expr: 'happy', text: 'ตั้งชื่อลูกว่า "{name}" กันนะ!' },
    ],
  },
  {
    id: 'grab', age: 1, bg: 'home', title: 'พิธีจับของ',
    cast: ['yai', 'me', 'mom'],
    lines: [{ who: 'yai', expr: 'happy', text: 'ครบขวบแล้ว! จับของชิ้นไหนก่อน โตไปจะเป็นแบบนั้นนะ' }],
    choices: [
      { text: '📚 คว้าหนังสือ', effects: { smart: 2 }, memory: 'ขวบแรกจับหนังสือ',
        result: [{ who: 'yai', expr: 'happy', text: 'โอ้โห โตไปต้องเป็นด็อกเตอร์แน่ ๆ!' }] },
      { text: '🖍️ คว้าดินสอสี', effects: { art: 2 }, memory: 'ขวบแรกจับดินสอสี',
        result: [{ who: 'yai', expr: 'happy', text: 'หลานยายมีหัวศิลปะนี่นา ขีดเขียนผนังบ้านแน่เลยงานนี้' }] },
      { text: '⚽ คลานไปหาลูกบอล', effects: { body: 2 }, memory: 'ขวบแรกจับลูกบอล',
        result: [{ who: 'dad', expr: 'happy', text: 'นักเตะทีมชาติมาแล้ว!' }] },
      { text: '🐷 กอดกระปุกออมสิน', effects: { money: 2 }, memory: 'ขวบแรกกอดกระปุกออมสิน',
        result: [{ who: 'yai', expr: 'happy', text: 'ฮ่า ๆ หลานยายจะรวยแล้ว เลี้ยงยายด้วยนะ' }] },
      { text: '🎤 ถือไมค์ส่งเสียงอ้อแอ้', effects: { social: 2 }, memory: 'ขวบแรกจับไมค์',
        result: [{ who: 'mom', expr: 'happy', text: 'ช่างพูดเหมือนแม่เลย ต่อไปคงเป็นคนมีเพื่อนเยอะ' }] },
    ],
  },

  // ───────────── วัยเด็ก ─────────────
  {
    id: 'kinder', age: 4, bg: 'classroom', title: 'วันแรกที่อนุบาล',
    cast: ['mom', 'me', 'ton'],
    lines: [{ who: 'ton', expr: 'sad', text: 'ฮือ... เค้าอยากกลับบ้าน... (เด็กข้าง ๆ ชื่อต้น)' }],
    choices: [
      { text: '🍬 ยื่นขนม ชวนต้นเล่น', effects: { social: 1, friend: 2, happy: 1 }, memory: 'ได้เพื่อนรักคนแรกชื่อต้น',
        result: [{ who: 'ton', expr: 'happy', text: 'ขอบใจนะ! เราเป็นเพื่อนกันนะ ตลอดไปเลย!' }] },
      { text: '😭 ร้องไห้กอดขาแม่', effects: { family: 2, social: -1 }, memory: 'ร้องไห้หนักมากวันแรกที่อนุบาล',
        result: [{ who: 'mom', expr: 'sad', text: 'โอ๋ ๆ ไม่ต้องกลัวนะลูก แม่อยู่ตรงนี้' }, { text: 'สุดท้ายแม่ต้องนั่งเฝ้าอยู่หน้าห้องจนบ่าย' }] },
      { text: '🖍️ นั่งวาดรูปคนเดียว', effects: { art: 2 }, memory: 'ชอบนั่งวาดรูปคนเดียว',
        result: [{ who: 'kru', text: 'ภาพสวยจังเลย คุณครูขอติดบอร์ดนะจ๊ะ' }] },
    ],
  },
  {
    id: 'summer', age: 7, bg: 'village', title: 'ปิดเทอมบ้านยาย',
    cast: ['yai', 'me'],
    lines: [{ who: 'yai', expr: 'happy', text: 'ปิดเทอมนี้มาอยู่กับยายนะหลาน!' }],
    choices: [
      { text: '🌾 ช่วยยายปลูกข้าว', effects: { body: 1, family: 2 }, flags: ['countryside'], memory: 'ช่วยยายดำนาตอนปิดเทอม',
        result: [{ who: 'yai', expr: 'happy', text: 'เก่งมากหลาน! ข้าวที่เราปลูกเอง กินแล้วอร่อยที่สุดในโลก' }] },
      { text: '🐟 ปีนต้นไม้ จับปลา', effects: { body: 2, happy: 1, social: 1 }, flags: ['countryside'], memory: 'ซนจนตัวดำทั้งปิดเทอม',
        result: [{ text: 'กลับกรุงเทพฯ มาตัวดำปี๋ แต่ยิ้มแป้นทั้งวัน' }] },
      { text: '📖 นอนอ่านหนังสือ', effects: { smart: 2, happy: 1 }, memory: 'อ่านหนังสือหมดตู้บ้านยาย',
        result: [{ who: 'yai', text: 'อ่านหมดตู้แล้วรึ ปีหน้ายายจะหาเล่มใหม่มาไว้ให้นะ' }] },
    ],
  },
  {
    id: 'bully', age: 9, bg: 'schoolyard', title: 'ป.3 กับเรื่องในสนามเด็กเล่น', timer: 6,
    when: (s) => !has(s, 'saved_ton'),
    cast: ['me', 'ton'],
    lines: [{ who: 'ton', expr: 'sad', text: 'พี่ ป.6 แย่งเงินค่าขนมเราไป... ช่วยด้วย!' }],
    choices: [
      { text: '✋ เข้าไปขวาง!', effects: { friend: 3, social: 1, body: 1, happy: -1 }, flags: ['saved_ton'], memory: 'เข้าไปช่วยต้นจากพี่ ๆ ที่แกล้ง',
        result: [{ text: 'โดนผลักล้มเข่าถลอก แต่พี่ ๆ ก็ยอมถอยไปเพราะคนเริ่มมุง' }, { who: 'ton', expr: 'happy', text: '{name}... ขอบใจนะ เราจะไม่ลืมเลย' }] },
      { text: '🏃 ไปตามครู', effects: { friend: 2, smart: 1 }, flags: ['saved_ton'], memory: 'ไปตามครูมาช่วยต้น',
        result: [{ who: 'kru', expr: 'angry', text: 'นั่นทำอะไรกันน่ะ! ไปห้องปกครองเดี๋ยวนี้!' }, { who: 'ton', expr: 'happy', text: 'ขอบใจนะที่ไปตามครูมา' }] },
      { text: '🙈 ทำเป็นไม่เห็น', onTimeout: true, effects: { friend: -3 }, flags: ['ignored_ton'], memory: 'เดินผ่านตอนต้นโดนแกล้ง',
        result: [{ text: 'ต้นมองตามหลังมาด้วยสายตาที่ {name} ยังจำได้ไปอีกนาน' }] },
    ],
  },
  {
    id: 'm1exam', age: 11, bg: 'home', title: 'เตรียมสอบเข้า ม.1',
    cast: ['mom', 'me', 'dad'],
    lines: [{ who: 'mom', text: 'ปีหน้าสอบเข้า ม.1 แล้ว ลูกอยากทำอะไร?' }],
    choices: [
      { text: '✏️ ติวหนัก', effects: { smart: 3, happy: -1 }, flags: ['top_school'], memory: 'ติวหนักจนสอบติดโรงเรียนดัง',
        result: [{ text: 'หลายเดือนผ่านไป... ประกาศผลออกมา {name} สอบติดโรงเรียนชื่อดังของจังหวัด!' }, { who: 'mom', expr: 'happy', text: 'แม่ภูมิใจในตัวลูกที่สุดเลย!' }] },
      { text: '🎹 เรียนดนตรี-วาดรูป', effects: { art: 3, happy: 1 }, memory: 'เลือกเรียนศิลปะแทนกวดวิชา',
        result: [{ who: 'dad', expr: 'happy', text: 'ได้สิลูก ทำสิ่งที่รักแล้วจะทำได้ดีเอง' }] },
      { text: '🏸 เข้าทีมกีฬา', effects: { body: 3, social: 1 }, memory: 'เข้าทีมกีฬาโรงเรียนตอน ป.5',
        result: [{ text: 'ซ้อมทุกเย็นจนได้เหรียญทองแข่งกีฬาระดับเขต' }] },
    ],
  },
  {
    id: 'hardship', age: 12, bg: 'home', title: 'ปีที่บ้านลำบาก', chance: 0.6,
    cast: ['dad', 'me', 'mom'],
    lines: [{ who: 'dad', expr: 'sad', text: 'โรงงานพ่อปิดแล้วลูก... ช่วงนี้บ้านเราอาจลำบากหน่อย' }],
    choices: [
      { text: '🧁 ขายขนมช่วยแม่', effects: { money: 2, family: 2, social: 1 }, flags: ['hustle'], memory: 'ขายขนมช่วยที่บ้านตอนพ่อตกงาน',
        result: [{ who: 'mom', expr: 'happy', text: 'ขายหมดอีกแล้ว! ลูกแม่มีหัวการค้าจริง ๆ' }] },
      { text: '🎓 สอบชิงทุน', effects: { smart: 2, family: 1 }, memory: 'สอบได้ทุนเรียนดีตอนที่บ้านลำบาก',
        result: [{ text: '{name} สอบได้ทุนเรียนดี ช่วยแบ่งเบาภาระพ่อแม่ไปได้มาก' }] },
      { text: '😶 เก็บไว้คนเดียว', effects: { happy: -2, art: 1 }, memory: 'แอบเครียดเรื่องเงินคนเดียว',
        result: [{ text: 'บางคืน {name} นั่งเขียนไดอารี่จนดึก ระบายสิ่งที่ไม่กล้าพูดกับใคร' }] },
    ],
  },

  // ───────────── วัยรุ่น ─────────────
  {
    id: 'club', age: 14, bg: 'schoolyard', title: 'ม.2 เลือกชมรม',
    cast: ['ton', 'me'],
    lines: (s) => [
      has(s, 'ignored_ton')
        ? { text: 'ขึ้น ม.2 ต้องเลือกชมรมแล้ว!' }
        : { who: 'ton', expr: 'happy', text: 'ขึ้น ม.2 แล้ว! {name} จะเข้าชมรมไหน?' },
    ],
    choices: [
      { text: '🔬 ชมรมวิทย์-คอม', effects: { smart: 2 }, memory: 'อยู่ชมรมวิทย์-คอม',
        result: [{ text: 'ได้ไปแข่งเขียนโปรแกรมระดับภาค ได้รางวัลชมเชยกลับมา' }] },
      { text: '🎸 ชมรมดนตรีและศิลปะ', effects: { art: 2, social: 1 }, memory: 'อยู่ชมรมดนตรี',
        result: [{ text: 'ได้ขึ้นเล่นดนตรีงานกีฬาสี เสียงกรี๊ดดังกว่าที่คิด' }] },
      { text: '⚽ ชมรมกีฬา', effects: { body: 2, friend: 1 }, memory: 'อยู่ชมรมกีฬา',
        result: [{ text: 'ซ้อมหนักจนได้ติดตัวจริงทีมโรงเรียน' }] },
      { text: '📣 สภานักเรียน', effects: { social: 2, smart: 1 }, memory: 'เป็นกรรมการสภานักเรียน',
        result: [{ text: 'ได้จัดงานโรงเรียนหลายงาน รู้จักคนทั้งโรงเรียน' }] },
    ],
  },
  {
    id: 'crush', age: 15, bg: 'classroom', title: 'นักเรียนย้ายมาใหม่', timer: 7,
    cast: ['me', 'fah'],
    lines: [{ who: 'fah', expr: 'happy', text: 'สวัสดี เราชื่อฟ้า ย้ายมาใหม่ ฝากตัวด้วยนะ' }],
    choices: [
      { text: '🚶 พาเดินดูโรงเรียน', effects: { love: 3, social: 1, happy: 1 }, memory: 'พาฟ้าเดินดูโรงเรียนวันแรก',
        result: [{ who: 'fah', expr: 'happy', text: 'ขอบคุณนะ {name} ใจดีจัง เดี๋ยวพักเที่ยงไปกินข้าวด้วยกันไหม' }] },
      { text: '👫 ชวนเข้าแก๊ง', effects: { love: 1, social: 2 }, memory: 'ได้ฟ้ามาเป็นเพื่อนในกลุ่ม',
        result: [{ text: 'ฟ้าเข้ากับทุกคนได้ดี กลายเป็นสมาชิกประจำแก๊ง' }] },
      { text: '😳 เขิน ก้มหน้าอ่านหนังสือ', onTimeout: true, effects: { smart: 2, love: -1 }, memory: 'เขินจนไม่กล้าคุยกับฟ้า',
        result: [{ who: 'fah', expr: 'neutral', text: '...อ้อ โอเค' }] },
    ],
  },
  {
    id: 'viral', age: 16, bg: 'home', title: 'คลิปดังข้ามคืน', chance: 0.5,
    cast: ['me'],
    lines: [{ who: 'me', expr: 'surprised', text: 'คลิปที่โพสต์เล่น ๆ เมื่อคืน... ยอดวิวทะลุล้าน!?' }],
    choices: [
      { text: '🎬 ทำคลิปต่อ ดังให้สุด!', effects: { social: 3, money: 1, smart: -1 }, flags: ['creator'], memory: 'กลายเป็นคนดังในโซเชียลตอน ม.4',
        result: [{ text: 'ผู้ติดตามทะลุแสน เริ่มมีแบรนด์ส่งของมาให้รีวิว' }] },
      { text: '😌 ช่างมัน ใช้ชีวิตปกติ', effects: { happy: 1, smart: 1 }, memory: 'เคยมีคลิปดังแต่เลือกอยู่เงียบ ๆ',
        result: [{ text: 'สามวันผ่านไปทุกคนก็ลืม แต่ก็เป็นเรื่องเล่าขำ ๆ ไปอีกนาน' }] },
    ],
  },
  {
    id: 'skip', age: 17, bg: 'schoolyard', title: 'ม.5 กับคำชวนโดดเรียน',
    cast: ['ton', 'me', 'fah'],
    lines: (s) => [
      has(s, 'ignored_ton')
        ? { text: 'เพื่อนชวนโดดเรียนบ่ายนี้ไปเที่ยวห้าง' }
        : { who: 'ton', expr: 'happy', text: 'บ่ายนี้โดดเรียนไปห้างกันป่ะ!' },
    ],
    choices: [
      { text: '🛍️ ไปด้วย!', effects: { happy: 2, social: 1, friend: 1, smart: -2 }, memory: 'เคยโดดเรียนไปเที่ยวห้างกับเพื่อน',
        result: [{ text: 'บ่ายนั้นสนุกที่สุดในเทอม... แต่ผลสอบกลางภาคออกมาไม่ค่อยสวยนัก' }] },
      { text: '📚 ไม่ไป อ่านหนังสือ', effects: { smart: 2 }, memory: 'ไม่ยอมโดดเรียนตามเพื่อน',
        result: [{ who: 'fah', expr: 'happy', text: 'งั้นเราไปอ่านด้วยคน' }] },
      { text: '☕ ชวนไปติวที่คาเฟ่', effects: { smart: 1, social: 1, friend: 1, love: 1 }, memory: 'ชวนเพื่อนติวหนังสือที่คาเฟ่',
        result: [{ text: 'กลายเป็นติวไปเม้าท์ไป แต่ทุกคนก็สอบผ่านกันหมด' }] },
    ],
  },
  {
    id: 'tcas', age: 18, bg: 'home', title: 'TCAS — ทางแยกครั้งใหญ่',
    cast: ['mom', 'me', 'dad'],
    lines: [{ who: 'mom', text: 'ถึงเวลาเลือกคณะแล้ว แม่อยากให้เป็นหมอ... แต่ลูกเลือกเองนะ' }],
    choices: [
      { text: '🩺 แพทยศาสตร์', hint: 'ใช้ความรู้สูง', flags: ['path_med'], effects: { smart: 1 }, memory: 'เลือกสอบหมอ',
        result: (s) => s.stats.smart >= 7
          ? [{ text: 'ประกาศผล... "ยินดีด้วย คุณผ่านการคัดเลือก คณะแพทยศาสตร์"' }, { who: 'mom', expr: 'happy', text: 'ลูกแม่จะเป็นหมอแล้ว!!' }]
          : [{ text: 'คะแนนขาดไปนิดเดียว... {name} ได้ที่คณะวิทยาศาสตร์แทน' }, { who: 'dad', text: 'ไม่เป็นไรลูก เส้นทางมีอีกหลายทาง' }] },
      { text: '💻 วิศวกรรม / คอมพิวเตอร์', hint: 'ใช้ความรู้', flags: ['path_eng'], effects: { smart: 1 }, memory: 'เข้าเรียนวิศวะคอม',
        result: [{ text: 'สอบติดวิศวะคอมพิวเตอร์ ได้เพื่อนใหม่ที่เขียนโค้ดเก่ง ๆ เต็มไปหมด' }] },
      { text: '🎨 ศิลปกรรม / ออกแบบ', hint: 'ใช้ศิลปะ', flags: ['path_art'], effects: { art: 1 }, memory: 'เข้าเรียนศิลปกรรม',
        result: (s) => [{ text: s.stats.art >= 5 ? 'ส่งพอร์ตโฟลิโอแล้วได้คะแนนสูงสุดของรอบ!' : 'ฝึกวาดหนักทั้งปิดเทอมจนสอบติดศิลปกรรม' }] },
      { text: '🏃 วิทยาศาสตร์การกีฬา', hint: 'ใช้ร่างกาย', flags: ['path_sport'], effects: { body: 1 }, memory: 'เข้าเรียนวิทย์กีฬา',
        result: [{ text: 'ได้ทุนนักกีฬาเข้ามหาวิทยาลัย ต้องซ้อมควบคู่กับเรียน' }] },
      { text: '📊 บริหารธุรกิจ', hint: 'ใช้การเข้าสังคม/เงิน', flags: ['path_biz'], effects: { social: 1 }, memory: 'เข้าเรียนบริหารธุรกิจ',
        result: [{ text: 'สอบติดคณะบริหาร ได้เรียนเรื่องธุรกิจตั้งแต่ปีหนึ่ง' }] },
      { text: '🛵 ไม่เรียนต่อ ทำงานเลย', flags: ['path_work'], effects: { money: 2, smart: -1 }, memory: 'ไม่เรียนมหาลัย ออกมาทำงานเลย',
        result: [{ who: 'mom', expr: 'sad', text: 'แน่ใจนะลูก...' }, { who: 'me', text: 'แน่ใจ{krub}แม่ {chan}จะพิสูจน์ให้ดูเอง' }] },
    ],
  },

  // ───────────── วัยหนุ่มสาว ─────────────
  {
    id: 'uni', age: 19, bg: 'campus', title: 'ชีวิตปีหนึ่ง',
    when: (s) => !has(s, 'path_work'),
    cast: ['me'],
    lines: [{ text: 'ปีหนึ่ง! ไม่มีใครบังคับอะไรแล้ว จะใช้ชีวิตยังไงดี?' }],
    choices: [
      { text: '🎉 ลุยกิจกรรม', effects: { social: 3, happy: 1, smart: -1 }, memory: 'เป็นตัวตึงกิจกรรมมหาลัย',
        result: [{ text: 'ได้เป็นประธานรุ่น เดินไปไหนก็มีคนทัก' }] },
      { text: '🏅 ล่าเกียรตินิยม', effects: { smart: 3 }, memory: 'เรียนจบเกียรตินิยม',
        result: [{ text: 'เกรดเฉลี่ย 3.8 อาจารย์ชวนไปช่วยทำวิจัย' }] },
      { text: '💼 ทำพาร์ทไทม์', effects: { money: 3, body: 1 }, flags: ['hustle'], memory: 'ทำงานพาร์ทไทม์ตลอดสี่ปี',
        result: [{ text: 'เสิร์ฟร้านอาหารตอนกลางคืน สอนพิเศษวันเสาร์ จบมามีเงินเก็บก้อนแรก' }] },
    ],
  },
  {
    id: 'street', age: 19, bg: 'city', title: 'เมืองใหญ่',
    when: (s) => has(s, 'path_work'),
    cast: ['me'],
    lines: [{ text: 'ย้ายเข้ากรุงเทพฯ เริ่มจากห้องเช่าเล็ก ๆ' }],
    choices: [
      { text: '📦 ขายของออนไลน์', effects: { money: 3, social: 1 }, flags: ['hustle'], memory: 'เริ่มขายของออนไลน์ตอนอายุ 19',
        result: [{ text: 'เดือนแรกขายได้สามชิ้น เดือนที่หกออเดอร์เข้าวันละร้อย!' }] },
      { text: '🍳 ทำงานในครัว', effects: { body: 1, art: 1, money: 1 }, flags: ['cook'], memory: 'ทำงานในครัวร้านอาหาร',
        result: [{ text: 'เชฟใหญ่บอกว่า {name} มีลิ้นที่ดีมาก' }] },
      { text: '🌙 ทำงาน+เรียนภาคค่ำ', effects: { smart: 2, happy: -1 }, memory: 'ทำงานกลางวัน เรียนกลางคืน',
        result: [{ text: 'เหนื่อยแทบขาดใจ แต่ก็ได้ใบปริญญามาในที่สุด' }] },
    ],
  },
  {
    id: 'tonloan', age: 21, bg: 'park', title: 'ต้นมีเรื่องขอร้อง', timer: 8,
    when: (s) => !has(s, 'ignored_ton') && s.stats.friend >= 1,
    cast: ['ton', 'me'],
    lines: [{ who: 'ton', expr: 'sad', text: 'แม่เราต้องผ่าตัด ขาดเงินสามหมื่น... ช่วยเราได้ไหม' }],
    choices: [
      { text: '💸 ให้ยืมเลย', effects: { money: -2, friend: 3, happy: 1 }, flags: ['helped_ton'], memory: 'ให้ต้นยืมเงินรักษาแม่',
        result: [{ who: 'ton', expr: 'happy', text: 'บุญคุณครั้งนี้ เราจะตอบแทนให้ได้สักวัน' }] },
      { text: '📢 ช่วยระดมทุน', effects: { social: 1, friend: 2 }, flags: ['helped_ton'], memory: 'ช่วยต้นระดมทุนรักษาแม่',
        result: [{ text: 'ยอดบริจาคครบภายในสองวัน ต้นโทรมาร้องไห้ขอบคุณ' }] },
      { text: '🙅 ปฏิเสธ', onTimeout: true, effects: { friend: -2 }, memory: 'ปฏิเสธไม่ให้ต้นยืมเงิน',
        result: [{ who: 'ton', expr: 'sad', text: 'ไม่เป็นไร... เราเข้าใจ' }, { text: 'หลังจากนั้นต้นก็โทรมาน้อยลงเรื่อย ๆ' }] },
    ],
  },
  {
    id: 'career', age: 22, bg: 'campus', title: 'งานแรกในชีวิต',
    cast: ['me'],
    lines: (s) => [{ text: has(s, 'path_work') ? 'ถึงเวลาเลือกอาชีพจริงจังแล้ว!' : 'เรียนจบแล้ว! งานแรกจะเป็นอะไรดี?' }],
    choices: [
      { text: '🩺 แพทย์โรงพยาบาลรัฐ', lock: (s) => (!has(s, 'path_med') ? 'ต้องเรียนแพทย์' : need(s, { smart: 7 })), career: 'doctor', effects: { smart: 2, money: 2, happy: -1 }, memory: 'เป็นหมอ',
        result: [{ text: 'ใช้ทุนที่โรงพยาบาลชุมชน เวรดึกแทบทุกคืน แต่รอยยิ้มของคนไข้ทำให้หายเหนื่อย' }] },
      { text: '💻 โปรแกรมเมอร์บริษัทเทค', lock: (s) => (!has(s, 'path_eng') && !has(s, 'path_med') ? 'ต้องเรียนวิศวะ/คอม' : need(s, { smart: 5 })), career: 'dev', effects: { money: 3 }, memory: 'เป็นโปรแกรมเมอร์',
        result: [{ text: 'ได้งานบริษัทเทคเงินเดือนดี ทำงานที่บ้านได้ด้วย' }] },
      { text: '🎨 นักวาด / ดีไซเนอร์', lock: (s) => need(s, { art: 5 }), career: 'artist', effects: { art: 2, happy: 2 }, memory: 'เป็นนักวาด',
        result: [{ text: 'รับงานวาดปกนิยาย ออกแบบโลโก้ ทำงานที่รักทุกวัน' }] },
      { text: '🎤 นักดนตรี / ศิลปิน', lock: (s) => need(s, { art: 6, social: 4 }), career: 'musician', effects: { art: 1, social: 2, happy: 2, money: -1 }, memory: 'เป็นนักดนตรี',
        result: [{ text: 'เล่นดนตรีตามร้านทุกคืน ฝันว่าสักวันจะได้ขึ้นเวทีคอนเสิร์ตใหญ่' }] },
      { text: '🏅 นักกีฬาอาชีพ', lock: (s) => need(s, { body: 6 }), career: 'athlete', effects: { body: 2, social: 1 }, memory: 'เป็นนักกีฬาอาชีพ',
        result: [{ text: 'เซ็นสัญญากับสโมสรอาชีพ! ชื่อของ {name} เริ่มขึ้นหน้าข่าวกีฬา' }] },
      { text: '📱 ครีเอเตอร์', lock: (s) => !has(s, 'creator') && need(s, { social: 7 }), career: 'creator', effects: { social: 2, money: 2, happy: 1 }, memory: 'เป็นครีเอเตอร์',
        result: [{ text: 'ช่องของ {name} มีผู้ติดตามแตะล้านคน' }] },
      { text: '🍜 เปิดร้านอาหารของตัวเอง', lock: (s) => !has(s, 'cook') && !has(s, 'hustle') && need(s, { money: 5 }), career: 'chef', effects: { money: 1, happy: 1 }, memory: 'เปิดร้านอาหารของตัวเอง',
        result: [{ text: 'ร้านเล็ก ๆ หน้าปากซอย คิวยาวตั้งแต่วันแรก' }] },
      { text: '📚 ครู', lock: (s) => (has(s, 'path_work') ? 'ต้องเรียนจบปริญญา' : s.stats.smart < 4 && s.stats.social < 5 ? 'ต้องมี 📘 ความรู้ 4+ หรือ 🗣️ เข้าสังคม 5+' : false), career: 'teacher', effects: { social: 1, happy: 1 }, memory: 'เป็นครู',
        result: [{ text: 'สอบบรรจุได้ที่โรงเรียนประถมแห่งหนึ่ง เด็ก ๆ เรียก "ครู{name}" กันทั้งวัน' }] },
      { text: '🌾 ทำเกษตรบ้านยาย', lock: (s) => !has(s, 'countryside') && 'ต้องเคยไปช่วยงานบ้านยาย', career: 'farmer', effects: { body: 1, family: 2, happy: 2, money: -1 }, memory: 'กลับบ้านเกิดไปทำสวน',
        result: (s) => s.flags.some((f) => f === 'yai_goodbye' || f === 'missed_yai') ? [{ text: 'บ้านไม้ของยายยังรออยู่... ต้นมะม่วงที่ยายปลูกออกลูกเต็มต้น' }] : [{ who: 'yai', expr: 'happy', text: 'หลานกลับมาแล้ว! สวนนี้ยายยกให้หลานนะ' }] },
      { text: '👩‍⚕️ พยาบาล', lock: (s) => (has(s, 'path_work') ? 'ต้องเรียนจบปริญญา' : need(s, { smart: 5 })), career: 'nurse', effects: { smart: 1, family: 1, happy: 1 }, memory: 'เป็นพยาบาล',
        result: [{ text: 'เข้าเวรดึกที่ห้องฉุกเฉิน มือเย็น ใจนิ่ง คนไข้เรียก "พี่พยาบาลใจดี"' }] },
      { text: '🐾 สัตวแพทย์', lock: (s) => (!has(s, 'path_med') && !has(s, 'coco') ? 'ต้องเรียนแพทย์ หรือเคยเลี้ยงโกโก้' : need(s, { smart: 6 })), career: 'vet', effects: { smart: 1, happy: 2 }, memory: 'เป็นสัตวแพทย์',
        result: [{ text: 'เปิดคลินิกรักษาสัตว์ หมาแมวทั้งซอยรู้จัก {name}' }] },
      { text: '🏗️ วิศวกร', lock: (s) => (!has(s, 'path_eng') ? 'ต้องเรียนวิศวะ' : need(s, { smart: 6 })), career: 'engineer', effects: { smart: 1, money: 2 }, memory: 'เป็นวิศวกร',
        result: [{ text: 'คุมงานก่อสร้างสะพานข้ามแม่น้ำ ใส่หมวกเหลืองกลางแดดทุกวัน' }] },
      { text: '✈️ นักบิน', lock: (s) => (has(s, 'path_work') ? 'ต้องเรียนจบปริญญา' : need(s, { smart: 7, body: 5 })), career: 'pilot', effects: { smart: 1, money: 3, family: -1 }, memory: 'เป็นนักบิน',
        result: [{ text: 'สอบผ่านโรงเรียนการบิน! ได้ขับเครื่องบินข้ามทวีปเป็นครั้งแรก' }] },
      { text: '⚖️ ทนายความ', lock: (s) => (has(s, 'path_work') ? 'ต้องเรียนจบปริญญา' : need(s, { smart: 7, social: 5 })), career: 'lawyer', effects: { smart: 1, social: 1, money: 2 }, memory: 'เป็นทนายความ',
        result: [{ text: 'ว่าความคดีแรกชนะ! ลูกความยกมือไหว้ขอบคุณทั้งน้ำตา' }] },
      { text: '🏛️ ข้าราชการ', lock: (s) => (has(s, 'path_work') ? 'ต้องเรียนจบปริญญา' : need(s, { smart: 5 })), career: 'civil', effects: { family: 2, happy: 1 }, memory: 'สอบติดข้าราชการ',
        result: [{ who: 'mom', expr: 'happy', text: 'ลูกแม่เป็นข้าราชการแล้ว! มั่นคง มีบำนาญ แม่ภูมิใจที่สุด' }] },
      { text: '👮 ตำรวจ', lock: (s) => need(s, { body: 5 }), career: 'police', effects: { body: 1, social: 1 }, memory: 'เป็นตำรวจ',
        result: [{ text: 'จบโรงเรียนนายสิบ ใส่เครื่องแบบครั้งแรก พ่อยืนตัวตรงทำความเคารพ' }] },
      { text: '🎬 นักแสดง', lock: (s) => need(s, { art: 5, social: 6 }), career: 'actor', effects: { social: 2, art: 1, happy: 1 }, memory: 'เป็นนักแสดง',
        result: [{ text: 'แคสติ้งผ่าน! ได้บทพระรองในละครหลังข่าว' }] },
      { text: '🎮 สตรีมเมอร์เกม', lock: (s) => need(s, { social: 4 }), career: 'streamer', effects: { happy: 2, body: -1 }, memory: 'เป็นสตรีมเมอร์เกม',
        result: [{ text: 'ไลฟ์เกมทุกคืน คนดูหลักพันเริ่มส่งโดเนทมา' }] },
      { text: '📈 เทรดเดอร์', lock: (s) => need(s, { smart: 5, money: 4 }), career: 'trader', effects: { money: 2, happy: -1 }, memory: 'เป็นเทรดเดอร์',
        result: [{ text: 'จอหกจอ กราฟแดงเขียวทั้งวัน หัวใจเต้นตามตลาด' }] },
      { text: '📦 ขายของออนไลน์', career: 'seller', effects: { social: 1, money: 1 }, memory: 'ขายของออนไลน์',
        result: [{ text: 'ไลฟ์ขายของทุกคืน "CF ได้เลยค่า!" ออเดอร์เด้งไม่หยุด' }] },
      { text: '🛵 ไรเดอร์ส่งอาหาร', career: 'rider', effects: { body: 1 }, memory: 'เป็นไรเดอร์ส่งอาหาร',
        result: [{ text: 'อิสระ ไม่มีหัวหน้า แต่ฝนตกเมื่อไหร่ก็ต้องลุย' }] },
      // ผู้ชายบวชพระ (ขานนาคต้องตอบว่าไม่มีหนี้ — อนโณสิ) · ผู้หญิงบวชแม่ชี (คณะสงฆ์ไทยไม่บวชภิกษุณี)
      { text: '🙏 ออกบวช', lock: (s) => (s.stats.happy < 4 ? 'ใจยังไม่สงบพอ (😊 ความสุข 4+)' : s.gender === 'boy' && s.debt > 0 ? 'ยังมีหนี้ — คนมีหนี้บวชพระไม่ได้' : false),
        career: 'monk', unflags: ['partner', 'mate'], effects: { happy: 3, family: 1, social: -1 }, memory: 'ออกบวชถือศีล',
        result: (s) => [{ text: s.gender === 'boy'
          ? 'พ่อแม่จูงนาคเวียนโบสถ์สามรอบ โกนผมห่มผ้าเหลือง ตื่นตีสี่ออกบิณฑบาตทุกเช้า'
          : 'ปลงผม นุ่งขาวห่มขาว รับศีลแปดเป็นแม่ชี ตื่นตีสี่ทำวัตรเช้าทุกวัน' }, ...(s.flagAt?.partner !== undefined ? [{ text: 'ก่อนบวช... ต้องบอกลาคนที่คบอยู่ ทางของเราแยกกันตรงนี้' }] : [])] },
      { text: '🏢 พนักงานบริษัท', career: 'office', effects: { money: 2 }, memory: 'เป็นพนักงานออฟฟิศ',
        result: [{ text: 'งานมั่นคง เงินเดือนออกตรงเวลา ชีวิตเรียบง่ายแบบมนุษย์เงินเดือน' }] },
    ],
  },

  // ───────────── วัยทำงาน ─────────────
  {
    id: 'overtime', age: 25, bg: 'office', title: 'ศุกร์ที่เหนื่อยล้า',
    cast: ['boss', 'me'],
    lines: [{ who: 'boss', text: 'งานด่วน! เสาร์อาทิตย์นี้ช่วยเคลียร์หน่อย (แต่นัดเพื่อนไว้แล้ว...)' }],
    choices: [
      { text: '💻 ยกเลิกนัด ทำงาน', effects: { money: 2, friend: -1, happy: -1 }, flags: ['workaholic'], memory: 'ยกเลิกนัดเพื่อนเพื่อทำงาน',
        result: [{ who: 'boss', expr: 'happy', text: 'เยี่ยมมาก! สิ้นปีนี้ผมจะดันเรื่องโบนัสให้' }] },
      { text: '🍻 ไปเจอเพื่อนก่อน', effects: { friend: 1, happy: 1, body: -1 }, memory: 'ทำงานเสร็จทั้งที่ไม่พลาดนัดเพื่อน',
        result: [{ text: 'ได้หัวเราะเต็มที่ แล้วนั่งทำงานยันตีสามคืนวันอาทิตย์' }] },
      { text: '🗣️ ขอเลื่อนเป็นวันอังคาร', effects: { happy: 2, money: -1 }, memory: 'กล้าปฏิเสธงานนอกเวลา',
        result: [{ who: 'boss', text: '...ก็ได้ วันอังคารแล้วกัน' }, { text: 'ทุกอย่างไม่ได้แย่อย่างที่กลัว' }] },
    ],
  },
  {
    id: 'love', age: 27, bg: 'park', title: 'คนคุ้นเคย',
    when: (s) => !s.flags.includes('fah_ton'),
    cast: ['me', 'fah'],
    lines: (s) => [
      { who: 'fah', expr: 'happy', text: s.stats.love >= 2 ? 'ไม่เจอกันนานเลย... จริง ๆ ตอน ม.ปลาย เราแอบชอบ {name} นะ' : 'อ้าว {name}! ฟ้าเองไง จำได้ไหม คุยกันถูกคอจัง' },
    ],
    choices: [
      { text: '💕 ขอคบจริงจัง', effects: { love: 3, happy: 2 }, flags: ['partner'], memory: 'เริ่มคบกับฟ้า',
        result: [{ who: 'fah', expr: 'happy', text: 'ตกลง... รอคำนี้มานานแล้วนะ' }] },
      { text: '🤝 เป็นเพื่อนกันดีแล้ว', effects: { social: 1 }, memory: 'ยังเป็นเพื่อนกับฟ้า',
        result: [{ who: 'fah', expr: 'neutral', text: 'อืม... เป็นเพื่อนกันก็ดีเหมือนกัน' }] },
      { text: '📈 ขอโฟกัสงานก่อน', effects: { money: 2, love: -2 }, flags: ['workaholic'], memory: 'เลือกงานมากกว่าความรัก',
        result: [{ text: 'ฟ้าย้ายไปทำงานต่างประเทศในปีถัดมา' }] },
    ],
  },
  {
    id: 'lottery', age: 29, bg: 'home', title: 'เลขเด็ด', chance: 0.25, timer: 10,
    force: (s) => has(s, 'ghost_numbers'),
    cast: ['me'],
    lines: [{ who: 'me', expr: 'surprised', text: 'เลขนี้... ถูกหวยรางวัลที่สอง!!' }],
    choices: [
      { text: '📊 เก็บไว้ลงทุน', onTimeout: true, effects: { money: 4 }, memory: 'ถูกหวยรางวัลที่สองแล้วเก็บไว้ลงทุน',
        result: [{ text: 'ปรึกษานักวางแผนการเงิน กระจายลงทุนอย่างใจเย็น' }] },
      { text: '🏠 ซื้อบ้านให้พ่อแม่', effects: { money: 1, family: 3, happy: 2 }, memory: 'ถูกหวยแล้วซื้อบ้านให้พ่อแม่',
        result: [{ who: 'mom', expr: 'happy', text: 'ลูกคนนี้... แม่ไม่เคยคิดว่าจะได้มีบ้านสวย ๆ แบบนี้' }] },
      { text: '✈️ เที่ยวรอบโลก!', effects: { happy: 3, social: 1 }, memory: 'ถูกหวยแล้วไปเที่ยวรอบโลก',
        result: [{ text: 'สามเดือนใน 12 ประเทศ ความทรงจำที่ซื้อด้วยเงินอื่นไม่ได้' }] },
    ],
  },
  {
    id: 'wedding', age: 30, bg: 'wedding', title: 'วันวิวาห์',
    when: (s) => has(s, 'partner'),
    cast: ['me', 'fah'],
    lines: [{ who: 'fah', expr: 'happy', text: 'เราจะแต่งงานกันแล้ว! อยากจัดงานแบบไหนดี' }],
    choices: [
      { text: '🪷 จัดเต็มตามประเพณี', effects: { money: -2, family: 3, social: 1 }, memory: 'จัดงานแต่งงานแบบไทยเต็มรูปแบบ',
        result: [{ text: 'แห่ขันหมาก รดน้ำสังข์ ญาติมาครบทั้งตระกูล แม่ร้องไห้ด้วยความดีใจ' }] },
      { text: '🕯️ จัดเล็ก ๆ อบอุ่น', effects: { happy: 2, friend: 1 }, memory: 'แต่งงานเล็ก ๆ อบอุ่น',
        result: [{ text: 'งานเล็กแต่อบอุ่น มีแค่คนที่รักจริง ๆ' }] },
      { text: '🏝️ จดทะเบียน แล้วไปเที่ยว', effects: { money: 1, happy: 2 }, memory: 'จดทะเบียนแล้วไปฮันนีมูน',
        result: [{ text: 'ฮันนีมูนที่ทะเลใต้ ดูพระอาทิตย์ตกด้วยกันทุกเย็น' }] },
    ],
  },
  {
    id: 'kids', age: 33, bg: 'home', title: 'สมาชิกใหม่',
    when: (s) => has(s, 'partner'),
    cast: ['me', 'fah'],
    lines: [
      { who: 'fah', text: 'เราว่า... ถึงเวลาที่จะมีลูกกันหรือยังนะ' },
    ],
    choices: [
      { text: '👶 มีลูกกัน', effects: { family: 3, happy: 2, money: -2 }, flags: ['kid'], memory: 'ได้เป็นพ่อแม่คน',
        result: [{ text: 'หนึ่งปีต่อมา เสียงร้องไห้ของทารกดังขึ้นอีกครั้ง... คราวนี้ {name} เป็นคนอุ้ม' }] },
      { text: '💑 อยู่กันสองคน', effects: { happy: 1, money: 2 }, memory: 'เลือกใช้ชีวิตคู่แบบไม่มีลูก',
        result: [{ text: 'ใช้ชีวิตคู่แบบอิสระ เดินทางทุกปี' }] },
      { text: '🐈 เลี้ยงแมวก่อน', effects: { happy: 2 }, flags: ['cat'], memory: 'รับแมวส้มมาเลี้ยง',
        result: [{ text: 'แมวส้มตัวอ้วนกลายเป็นเจ้าของบ้านตัวจริง' }] },
    ],
  },
  {
    id: 'single', age: 33, bg: 'city', title: 'ชีวิตคนโสด',
    when: (s) => !has(s, 'partner'),
    cast: ['me'],
    lines: [{ text: 'ญาติถามทุกครั้งที่เจอ "เมื่อไหร่จะมีแฟน?"' }],
    choices: [
      { text: '📱 ลองแอปหาคู่', outcomes: [
        { chance: 0.45, effects: { love: 3, happy: 2 }, flags: ['partner', 'mate'], memory: 'เจอ{fah}จากแอปหาคู่ เดตแรกคุยกันจนร้านปิด',
          result: [{ text: 'เดตที่เจ็ด... คนตรงหน้าหัวเราะกับมุกแป้ก ๆ ของ {name} จนร้านจะปิด' }, { text: 'ชื่อ {fah} — และนี่คือเดตสุดท้ายในแอปแล้ว' }] },
        { chance: 0.55, effects: { social: 1, love: 1, happy: 1 }, memory: 'ลองเล่นแอปหาคู่ ได้เพื่อนดี ๆ เพิ่ม',
          result: [{ text: 'เดตไปหลายครั้ง ได้เพื่อนดี ๆ เพิ่มมาหลายคน ยังไม่เจอคนที่ใช่... แต่ก็ยังไม่สาย' }] },
      ] },
      { text: '👶 รับเด็กมาเป็นลูกบุญธรรม', lock: (s) => s.stats.money < 4 && 'ต้องมี 💰 เงิน 4+', fin: { cash: -80_000 }, effects: { family: 3, happy: 2, money: -1 }, flags: ['kid', 'adopted'], memory: 'รับเด็กหญิงจากบ้านเด็กกำพร้ามาเป็นลูก',
        result: [{ text: 'วันแรกที่บ้าน เด็กน้อยจับมือ {name} แน่นไม่ยอมปล่อย' }, { text: 'ครอบครัวไม่จำเป็นต้องเริ่มจากคู่รักเสมอไป' }] },
      { text: '😎 โสดก็สุขได้', effects: { money: 2, art: 1, happy: 1 }, memory: 'มีความสุขกับชีวิตโสด',
        result: [{ text: 'ใช้ชีวิตเต็มที่ ทำทุกอย่างที่อยากทำ' }] },
      { text: '🐈 รับแมวมาเลี้ยง', effects: { happy: 2 }, flags: ['cat'], memory: 'รับแมวส้มมาเลี้ยง',
        result: [{ text: 'แมวส้มตัวอ้วนกลายเป็นเจ้าของบ้านตัวจริง' }] },
    ],
  },
  {
    id: 'midlife', age: 38, bg: 'office', title: 'ทางแยกกลางชีวิต',
    cast: ['boss', 'me'],
    lines: [{ who: 'boss', text: 'ไปคุมสาขาต่างประเทศไหม? เงินเดือนเท่าตัว แต่ต้องอยู่ห่างบ้านหลายปี' }],
    choices: [
      { text: '✈️ ไปต่างประเทศ', effects: { money: 4, smart: 1, family: -2, happy: -1 }, flags: ['abroad'], memory: 'ย้ายไปทำงานต่างประเทศ',
        result: [{ text: 'ประสบความสำเร็จอย่างมาก แต่วิดีโอคอลกลับบ้านเริ่มห่างขึ้นเรื่อย ๆ' }] },
      { text: '🏡 อยู่ใกล้ครอบครัว', effects: { family: 2, happy: 1 }, memory: 'ปฏิเสธงานต่างประเทศเพื่อครอบครัว',
        result: [{ text: 'ได้กินข้าวเย็นกับครอบครัวทุกวัน สิ่งเล็ก ๆ ที่มีค่ามหาศาล' }] },
      { text: '🌈 ลาออกไปทำตามฝัน', effects: { happy: 3, money: -2, art: 1 }, flags: ['dreamer', 'own_boss'], memory: 'ลาออกตอน 38 เพื่อทำตามฝัน',
        result: [{ text: 'เปิดคาเฟ่เล็ก ๆ ข้างแม่น้ำ แขวนผลงานของตัวเองไว้เต็มผนัง' }] },
    ],
  },
  {
    id: 'dadsick', mood: 'sad', age: 45, bg: 'hospital', title: 'ข่าวจากบ้าน',
    cast: ['dad', 'me', 'mom'],
    lines: [{ who: 'mom', expr: 'sad', text: 'ลูก... พ่อล้ม หมอบอกเป็นเส้นเลือดในสมอง' }],
    choices: [
      { text: '🤲 กลับมาดูแลเอง', effects: { family: 3, money: -2, happy: -1 }, memory: 'กลับมาดูแลพ่อตอนป่วย',
        result: [{ text: 'หลายเดือนของการทำกายภาพ จนพ่อกลับมาเดินได้อีกครั้ง' }, { who: 'dad', expr: 'happy', text: 'ขอบใจนะลูก... พ่อโชคดีที่มีลูกคนนี้' }] },
      { text: '👩‍⚕️ จ้างคนดูแล+แวะทุกเสาร์', effects: { money: -1, family: 1 }, memory: 'จ้างผู้ดูแลพ่อแล้วแวะมาทุกเสาร์อาทิตย์',
        result: [{ text: 'พ่อได้รับการดูแลอย่างดี และรอคอยวันเสาร์ทุกสัปดาห์' }] },
      { text: '💵 ส่งแต่เงิน', effects: { family: -2, money: -1 }, memory: 'ส่งแต่เงินตอนพ่อป่วย',
        result: [{ who: 'mom', expr: 'sad', text: 'พ่อเขาถามหาลูกทุกวันนะ...' }] },
    ],
  },
  {
    id: 'tonreturn', age: 50, bg: 'park', title: 'เพื่อนเก่า',
    cast: ['ton', 'me'],
    lines: (s) => {
      if (has(s, 'ignored_ton')) return [{ who: 'ton', text: 'อ้อ... {name} สินะ (ยังจำเรื่องสนามเด็กเล่นได้)' }]
      if (s.stats.friend >= 5) return [{ who: 'ton', expr: 'happy', text: 'เพื่อนรัก! ธุรกิจเราไปได้ดี มาเป็นหุ้นส่วนกันไหม?' }]
      return [{ who: 'ton', text: 'เฮ้ย {name}! ไม่เจอกันนานเลย สบายดีไหม' }]
    },
    choices: [
      { text: '🙏 ขอโทษเรื่องในอดีต', when: (s) => has(s, 'ignored_ton'), effects: { friend: 3, happy: 2 }, memory: 'ขอโทษต้นหลังผ่านไป 40 ปี',
        result: [{ who: 'ton', expr: 'surprised', text: '{name} ยังจำเรื่องนั้นได้ด้วยเหรอ...' }, { who: 'ton', expr: 'happy', text: 'ขอบคุณนะ ที่พูดออกมา เราเริ่มใหม่กันนะ' }] },
      { text: '🤝 เป็นหุ้นส่วน!', when: (s) => !has(s, 'ignored_ton') && s.stats.friend >= 5, effects: { money: 3, friend: 2, happy: 1 }, memory: 'ทำธุรกิจกับเพื่อนรักวัยเด็ก',
        result: [{ text: 'สองเพื่อนจากห้องอนุบาลเดียวกัน กลายเป็นหุ้นส่วนที่ไว้ใจกันที่สุด' }] },
      { text: '☕ นั่งคุยกันจนดึก', when: (s) => !has(s, 'ignored_ton'), effects: { friend: 2, happy: 2 }, memory: 'นั่งรำลึกความหลังกับต้น',
        result: [{ who: 'ton', expr: 'happy', text: 'ไม่ว่าอีกกี่ปี เราก็ยังเป็นเพื่อนกันนะ' }] },
      { text: '👋 ทักแล้วแยกย้าย', effects: { happy: -1 }, memory: 'ทักทายต้นแค่สั้น ๆ',
        result: [{ text: 'บางความสัมพันธ์ ถ้าไม่รดน้ำก็ค่อย ๆ เหี่ยวไปเอง' }] },
    ],
  },
  {
    id: 'health', age: 55, bg: 'park', title: 'ร่างกายเริ่มส่งสัญญาณ',
    cast: ['me'],
    lines: [{ text: 'หมอบอก: ความดันสูง น้ำตาลเกิน ต้องเปลี่ยนแล้วนะ' }],
    choices: [
      { text: '🏃 วิ่ง + กินผัก', effects: { body: 3, happy: 1 }, flags: ['healthy'], memory: 'เริ่มวิ่งตอนอายุ 55',
        result: [{ text: 'อีกสองปีต่อมา {name} วิ่งมินิมาราธอนจนจบเป็นครั้งแรก!' }] },
      { text: '🧘 โยคะ + สมาธิ', effects: { body: 1, happy: 2 }, flags: ['healthy'], memory: 'ฝึกโยคะและสมาธิ',
        result: [{ text: 'ใจสงบขึ้น นอนหลับง่ายขึ้น ความดันค่อย ๆ ลดลง' }] },
      { text: '🍰 ช่างมัน กินก่อน', effects: { happy: 1, body: -3 }, memory: 'ไม่สนใจผลตรวจสุขภาพ',
        result: [{ text: 'อร่อยทุกมื้อ... แต่ต้องกินยาเพิ่มขึ้นทุกปี' }] },
    ],
  },

  // ───────────── วัยเกษียณ ─────────────
  {
    id: 'retire', age: 60, bg: 'garden', title: 'เกษียณ',
    cast: (s) => (married(s) ? ['me', 'fah'] : ['me']),
    lines: [{ text: 'เกษียณแล้ว! เวลาว่างเหลือเฟือ จะทำอะไรดี?' }],
    choices: [
      { text: '🥬 ปลูกผักที่บ้านเกิด', effects: { happy: 2, body: 1, family: 1 }, flags: ['retire_farm'], memory: 'เกษียณไปปลูกผักที่บ้านเกิด',
        result: [{ text: 'บ้านไม้หลังเดิมของยาย ต้นมะม่วงต้นเดิม และความสงบที่ตามหามาทั้งชีวิต' }] },
      { text: '🌍 เที่ยวรอบโลก', lock: (s) => need(s, { money: 6 }), effects: { happy: 3, social: 1 }, memory: 'เกษียณแล้วเที่ยวรอบโลก',
        result: [{ text: 'ดูแสงเหนือที่ไอซ์แลนด์ ล่องเรือในญี่ปุ่น ทุกที่ที่เคยฝันไว้' }] },
      { text: '🧑‍🏫 อาสาสอนเด็ก', effects: { happy: 2, social: 2 }, flags: ['mentor'], memory: 'เป็นอาสาสอนเด็กหลังเกษียณ',
        result: [{ text: 'ถ่ายทอดทุกอย่างที่เรียนรู้มาทั้งชีวิตให้คนรุ่นใหม่' }] },
      { text: '💪 ทำงานต่อ!', flags: ['work_after_60'], effects: { money: 3, happy: -1 }, memory: 'ทำงานต่อหลังอายุ 60',
        result: [{ text: 'งานยังคงเป็นส่วนหนึ่งของตัวตน ที่ทิ้งไม่ลง' }] },
    ],
  },
  {
    id: 'finale', age: 70, bg: 'festival', title: 'วันเกิดปีที่ 70',
    cast: (s) => {
      const c: ('me' | 'fah' | 'ton' | 'kid')[] = []
      if (s.stats.friend >= 4) c.push('ton')
      c.push('me')
      if (married(s)) c.push('fah')
      if (has(s, 'kid')) c.push('kid')
      return c
    },
    lines: (s) => [
      has(s, 'kid') ? { who: 'kid', expr: 'happy', text: 'สุขสันต์วันเกิด 70 ปีนะ! อยากฝากอะไรถึงพวกหนูไหม?' }
        : married(s) ? { who: 'fah', expr: 'happy', text: 'เจ็ดสิบปีแล้วนะ {name} อยากฝากอะไรถึงคนรุ่นหลังไหม?' }
        : { text: 'วันเกิดปีที่ 70... ถ้าฝากคำพูดถึงคนรุ่นหลังได้ จะพูดว่าอะไร?' },
    ],
    choices: [
      { text: '✨ "กล้าตามฝัน"', effects: { happy: 1 }, memory: 'ฝากไว้ว่า จงกล้าเดินตามความฝัน' },
      { text: '❤️ "ดูแลคนที่รัก"', effects: { family: 1 }, memory: 'ฝากไว้ว่า ดูแลคนที่รักให้ดีที่สุด' },
      { text: '⛰️ "ขยันและอดทน"', effects: { money: 1 }, memory: 'ฝากไว้ว่า ขยันและอดทน' },
      { text: '🎊 "ใช้ชีวิตให้สนุก"', effects: { happy: 1 }, memory: 'ฝากไว้ว่า ใช้ชีวิตให้สนุก' },
    ],
  },
]

export const stageOf = (age: number) =>
  age < 3 ? 'วัยทารก' : age < 13 ? 'วัยเด็ก' : age < 19 ? 'วัยรุ่น' : age < 30 ? 'วัยหนุ่มสาว' : age < 60 ? 'วัยทำงาน' : 'วัยเกษียณ'
