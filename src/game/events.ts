import { SELF_EMPLOYED } from './careers'
import type { GameState, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
const lockMoney = (n: number) => (s: GameState) => s.stats.money < n && `ต้องมี 💰 เงิน ${n}+`

/**
 * เหตุการณ์พิเศษ: เสี่ยงดวง เรื่องแปลก และทางที่พาไปสู่ฉากจบแย่ ๆ
 * (จะถูกรวมกับ story.ts แล้วเรียงตามอายุอัตโนมัติ)
 */
export const EVENTS: Scene[] = [
  // ───────── มินิเกม ─────────
  {
    id: 'sportsday', age: 10, bg: 'schoolyard', title: 'กีฬาสี', minigame: 'tap',
    cast: ['me'], lines: [{ text: 'วิ่ง 100 เมตร!' }],
    reward: (p) => p >= 0.8
      ? { effects: { body: 3, social: 1, happy: 1 }, memory: 'ได้ที่หนึ่งวิ่งแข่งกีฬาสี', text: '🥇 ที่หนึ่ง! ทั้งสีกรี๊ดลั่น' }
      : p >= 0.5 ? { effects: { body: 2 }, memory: 'วิ่งแข่งกีฬาสีได้ที่สาม', text: '🥉 ได้ที่สาม ไม่เลว!' }
      : { effects: { body: 1, happy: -1 }, memory: 'วิ่งแข่งกีฬาสีได้ที่โหล่', text: '🐢 เข้าที่โหล่... แต่ก็วิ่งจนจบนะ' },
  },
  {
    id: 'exam', age: 12, bg: 'classroom', title: 'สอบเข้า ม.1', minigame: 'math',
    cast: ['me'], lines: [{ text: 'วันสอบเข้า ม.1!' }],
    reward: (p) => p >= 0.8
      ? { effects: { smart: 3, happy: 1 }, flags: ['top_school'], memory: 'สอบติดโรงเรียนอันดับหนึ่งของจังหวัด', text: '🎉 ติดโรงเรียนดังอันดับหนึ่ง!' }
      : p >= 0.5 ? { effects: { smart: 2 }, memory: 'สอบเข้า ม.1 ได้โรงเรียนดี', text: '😊 ติดโรงเรียนอันดับสอง' }
      : { effects: { smart: 1, happy: -1 }, memory: 'สอบเข้า ม.1 ไม่ติดที่หวัง', text: '😢 ไม่ติดที่หวัง ได้เรียนโรงเรียนใกล้บ้าน' },
  },
  {
    id: 'parttime', age: 20, bg: 'city', title: 'งานพาร์ทไทม์', minigame: 'catch',
    cast: ['me'], lines: [{ text: 'งานพิเศษช่วงปิดเทอม!' }],
    reward: (p) => p >= 0.8
      ? { effects: { money: 3, body: 1 }, memory: 'ทำพาร์ทไทม์ได้เงินก้อนโต', text: '💰 เงินเต็มกระเป๋า!' }
      : p >= 0.5 ? { effects: { money: 2 }, memory: 'ทำพาร์ทไทม์ได้เงินพอใช้', text: '🪙 ได้เงินพอใช้' }
      : { effects: { money: 1, happy: -1 }, memory: 'ทำพาร์ทไทม์แทบไม่ได้เงิน', text: '🧾 บิลเยอะกว่าเงินอีก...' },
  },

  // ───────── เรื่องแปลก ─────────
  {
    id: 'ghost', age: 7, bg: 'village', title: 'เสียงใต้ถุนบ้าน', chance: 0.5, timer: 6,
    when: (s) => has(s, 'countryside'),
    cast: ['me'],
    lines: [{ who: 'me', expr: 'surprised', text: 'ตีสอง... มีเสียงเรียกชื่อ {name} มาจากใต้ถุนบ้านยาย!' }],
    choices: [
      { text: '🔦 ลงไปดู', outcomes: [
        { chance: 0.5, effects: { happy: 1 }, memory: 'ลงไปดูใต้ถุนบ้าน เจอแค่แมวดำ', result: [{ text: 'แค่แมวดำตัวหนึ่ง... มันมองหน้าแล้วเดินหายไปในความมืด' }] },
        { chance: 0.5, effects: { happy: 1 }, flags: ['ghost_numbers', 'ghost_friend'], memory: 'ผียายทวดกระซิบเลขเด็ดให้ แล้วบอกว่า "เดี๋ยวเจอกันใหม่"', result: [{ text: 'หญิงชราตัวโปร่งแสงยิ้มให้ แล้วกระซิบตัวเลขหกตัว... "จำไว้นะหลาน"' }] },
      ] },
      { text: '🙏 ไหว้แล้วนอนต่อ', effects: { family: 1 }, flags: ['ghost_friend'], memory: 'ได้ยินเสียงผีแต่ไหว้แล้วนอนต่อ', result: [{ who: 'yai', text: 'ดีแล้วหลาน ผีบ้านผีเรือนเขาแค่มาทักทาย' }] },
      { text: '😱 วิ่งไปกอดยาย', onTimeout: true, effects: { family: 2, happy: -1 }, memory: 'กลัวผีจนวิ่งไปกอดยาย', result: [{ text: 'คืนนั้นนอนกอดยายแน่นจนเช้า' }] },
    ],
  },
  {
    id: 'meteor', age: 10, bg: 'schoolyard', title: 'หินเรืองแสง', chance: 0.35,
    cast: ['me'],
    lines: [{ who: 'me', expr: 'surprised', text: 'อุกกาบาตลูกเล็กตกหลังโรงเรียน! ก้อนหินยังเรืองแสงสีฟ้าอยู่เลย' }],
    choices: [
      { text: '🪨 แอบเก็บไว้เอง', flags: ['alien_rock'], effects: { happy: 1 }, memory: 'แอบเก็บหินอุกกาบาตเรืองแสงไว้', result: [{ text: 'บางคืนหินก้อนนั้นกะพริบเป็นจังหวะ... เหมือนกำลังส่งสัญญาณ' }] },
      { text: '🔬 ส่งให้นักวิทยาศาสตร์', effects: { smart: 2, social: 2 }, memory: 'ส่งอุกกาบาตให้นักวิทยาศาสตร์จนได้ออกข่าว', result: [{ text: 'ได้ออกข่าวช่องใหญ่! "เด็ก ป.4 ค้นพบแร่ชนิดใหม่"' }] },
      { text: '💰 ขายออนไลน์', effects: { money: 3 }, memory: 'ขายหินอุกกาบาตออนไลน์', result: [{ text: 'มีคนต่างชาติซื้อไปในราคาที่พ่อตกใจ' }] },
    ],
  },
  {
    id: 'bodyswap', age: 34, bg: 'home', title: 'เช้าวันประหลาด', chance: 0.2,
    force: (s) => has(s, 'cat'),
    cast: ['me'],
    lines: [{ who: 'me', expr: 'surprised', text: 'ตื่นมา... ทำไมมีหนวด มีหาง แล้วตัวเล็กนิดเดียว!? เราสลับร่างกับแมวส้ม!' }],
    choices: [
      { text: '😹 ใช้ชีวิตแมวสักวัน', effects: { happy: 3 }, memory: 'สลับร่างเป็นแมวหนึ่งวัน', result: [{ text: 'นอนกลางแดดทั้งวัน... แล้วตื่นมาเป็นคนเหมือนเดิม' }] },
      { text: '🐾 ตามเสียงเห่าที่คุ้นหู', lock: (s) => (has(s, 'coco') || has(s, 'coco_gone') || (s.bonds?.coco ?? 0) >= 3 ? false : 'ยังไม่รู้จักโกโก้'), flags: ['cat_coco'], effects: { happy: 2 }, memory: 'ในร่างแมว ได้ยินเสียงเห่าของโกโก้อีกครั้ง', result: [{ text: 'ในร่างแมว คุณได้ยินเสียงสัตว์ทั้งซอยคุยกัน... แล้วก็มีเสียงเห่าหนึ่งที่คุ้นหูมาก' }, { text: '"โกโก้!?" เงาหมาสีน้ำตาลจาง ๆ กระดิกหางอยู่ปลายซอย ก่อนหายไปพร้อมเสียงเห่าว่า "ไว้เจอกันใหม่นะ"' }] },
      { text: '🏃 รีบหาทางกลับร่าง', effects: { smart: 1 }, memory: 'สลับร่างกับแมวแต่รีบหาทางกลับ', result: [{ text: 'กระโดดใส่หน้าตัวเองจนสลับกลับมาได้ ทั้งคนทั้งแมวมองหน้ากันงง ๆ' }] },
    ],
  },
  {
    id: 'ufo', age: 35, bg: 'park', title: 'แสงบนฟ้า', timer: 7,
    when: (s) => has(s, 'alien_rock'),
    cast: ['me'],
    lines: [{ text: 'ยานรูปจานบินลงจอดกลางสวน "มนุษย์ เจ้าเก็บหินบ้านของเราไว้ 25 ปีแล้วนะ"' }],
    choices: [
      { text: '🤲 คืนหินให้', effects: { happy: 2, smart: 1 }, memory: 'คืนหินให้มนุษย์ต่างดาว', result: [{ text: 'เอเลี่ยนโค้งขอบคุณ แล้วทิ้งรูปวาดประหลาดไว้บนสนามหญ้า' }] },
      { text: '🛸 ขอไปด้วย!', lock: (s) => (has(s, 'decoded') ? false : 'ต้องเคยถอดรหัสสัญญาณจากหิน'), end: 'alien', memory: 'ขึ้นยานไปกับมนุษย์ต่างดาว', result: [{ text: 'ประตูยานเปิดออก... โลกค่อย ๆ เล็กลงจนเป็นจุดสีฟ้า' }] },
      { text: '📸 ไม่คืน แอบถ่ายคลิป', onTimeout: true, outcomes: [
        { chance: 0.5, effects: { social: 4, money: 3 }, memory: 'คลิปยูเอฟโอดังทั่วโลก', result: [{ text: 'คลิปยูเอฟโอยอดวิวพันล้าน! สื่อทั่วโลกขอสัมภาษณ์' }] },
        { chance: 0.5, effects: { happy: -2, smart: -1 }, memory: 'ถูกเอเลี่ยนลบความทรงจำ', result: [{ text: 'แสงสว่างวาบ... ตื่นมาในสวน จำอะไรไม่ได้เลย' }] },
      ] },
    ],
  },
  {
    id: 'genie', age: 65, bg: 'garden', title: 'ตะเกียงเก่าในสวน', chance: 0.3,
    cast: ['me'],
    lines: [{ text: 'ขุดดินปลูกผัก เจอตะเกียงทองเหลือง ถูนิดเดียว ภูติตัวเขียวก็โผล่ออกมา "ขอพรได้หนึ่งข้อ!"' }],
    choices: [
      { text: '💰 ขอรวยล้นฟ้า', effects: { money: 10 }, memory: 'ขอพรให้รวยจากภูติ', result: [{ text: 'ทองคำไหลออกจากตะเกียงไม่หยุด...' }] },
      { text: '❤️ ขอให้คนที่รักมีความสุข', effects: { family: 3, happy: 3, friend: 2 }, memory: 'ขอพรให้คนที่รักมีความสุข', result: [{ text: 'ภูติยิ้ม "คำขอที่ดีที่สุดในรอบพันปี"' }] },
      { text: '👶 ขอกลับไปเป็นเด็ก', lock: (s) => (['ghost_friend', 'decoded', 'cat_coco', 'alien_rock', 'ghost_call'].filter((f) => has(s, f)).length >= 2 ? false : 'ต้องเคยเจอเรื่องแปลกอย่างน้อย 2 เรื่อง'), end: 'reborn', memory: 'ขอพรให้ได้เกิดใหม่', result: [{ text: 'ทุกอย่างหมุนติ้ว... เสียงร้องไห้ดังลั่นห้องคลอดอีกครั้ง' }] },
    ],
  },

  // ───────── ทางเสี่ยง / จบแย่ ─────────
  {
    id: 'race', age: 16, bg: 'city', title: 'แข่งรถกลางคืน', chance: 0.6, timer: 6,
    cast: (s) => (has(s, 'ignored_ton') ? ['me'] : ['ton', 'me']),
    lines: [{ text: 'แก๊งรุ่นพี่ชวนไปแข่งมอเตอร์ไซค์บนถนนเปลี่ยวตอนตีหนึ่ง เดิมพันห้าพัน' }],
    choices: [
      { text: '🏠 ไม่ไป นอนดีกว่า', effects: { smart: 1 }, memory: 'ปฏิเสธไปแข่งรถ' },
      { text: '👀 ไปดูเฉย ๆ', onTimeout: true, effects: { social: 1 }, memory: 'ไปดูเพื่อนแข่งรถ', result: [{ text: 'เสียงท่อดังลั่น ตำรวจมาไล่ ทุกคนวิ่งหนีกระเจิง' }] },
      { text: '🏍️ ลงแข่งเอง!', hint: 'เสี่ยง', outcomes: [
        { chance: 0.6, effects: { social: 2, happy: 2, money: 1 }, memory: 'ชนะแข่งรถตอน ม.4', result: [{ text: 'เข้าเส้นชัยเป็นคนแรก! ชื่อ {name} ดังทั้งอำเภอ' }] },
        { chance: 0.28, effects: { body: -3, family: 1, happy: -1 }, memory: 'แข่งรถล้มจนขาหัก', result: [{ text: 'รถล้มกลางโค้ง ขาหัก นอนโรงพยาบาลเป็นเดือน แม่ร้องไห้ทุกวัน' }] },
        { chance: 0.12, end: 'accident', memory: 'อุบัติเหตุจากการแข่งรถ', result: [{ text: 'ไฟหน้ารถบรรทุกสว่างจ้า... แล้วทุกอย่างก็มืดลง' }] },
      ] },
    ],
  },
  {
    id: 'scam', age: 20, bg: 'home', title: 'ลงทุนรวยเร็ว', chance: 0.6,
    cast: ['me'],
    lines: [{ text: 'เพื่อนในเน็ตชวน "ลงทุนกับเรา ได้ผลตอบแทน 30% ทุกเดือน! ชวนเพื่อนได้ค่าคอมเพิ่ม"' }],
    choices: [
      { text: '🚫 ไม่สน ฟังดูไม่จริง', effects: { smart: 1 }, memory: 'ไม่หลงแชร์ลูกโซ่' },
      { text: '💸 ลองลงนิดหน่อย', effects: { money: -2, smart: 1 }, memory: 'โดนแชร์ลูกโซ่หลอก', result: [{ text: 'เดือนที่สอง แอดมินปิดกลุ่มหนี เงินหายเกลี้ยง' }] },
      { text: '📢 ลงเยอะ + ชวนคนอื่นมาลงด้วย', effects: { money: 4, social: 1 }, flags: ['scammer'], memory: 'ชวนคนอื่นลงแชร์ลูกโซ่', result: [{ text: 'ค่าคอมไหลเข้าบัญชีทุกวัน... ชีวิตดีเกินจริง' }] },
    ],
  },
  {
    id: 'police', age: 26, bg: 'home', title: 'เสียงเคาะประตู', timer: 5,
    when: (s) => has(s, 'scammer'),
    cast: ['me'],
    lines: [{ text: '"ตำรวจครับ! คุณ{name} มีหมายจับข้อหาฉ้อโกงประชาชน ผู้เสียหายสามร้อยราย"' }],
    choices: [
      { text: '🙇 รับสารภาพ', onTimeout: true, outcomes: [
        { chance: 0.5, effects: { money: -4, happy: -3, family: -1, social: -2 }, memory: 'รับสารภาพคดีแชร์ลูกโซ่ ศาลให้รอลงอาญา', result: [{ text: 'ศาลเห็นว่ารับสารภาพและเป็นความผิดครั้งแรก... ให้รอลงอาญา แต่ต้องชดใช้ผู้เสียหายจนหมดตัว' }] },
        { chance: 0.5, end: 'jail', memory: 'ถูกจับคดีแชร์ลูกโซ่', result: [{ text: 'ศาลพิพากษาจำคุก... ประตูเหล็กปิดลงเสียงดังกึง' }] },
      ] },
      { text: '🏃 ปีนหน้าต่างหนี', outcomes: [
        { chance: 0.5, end: 'fugitive', memory: 'หนีหมายจับไปต่างประเทศ', result: [{ text: 'ข้ามชายแดนกลางดึก... ไม่มีวันได้กลับบ้านอีก' }] },
        { chance: 0.5, end: 'jail', memory: 'หนีไม่พ้นตำรวจ', result: [{ text: 'วิ่งได้สามซอยก็โดนรวบ โทษหนักกว่าเดิม' }] },
      ] },
      { text: '💵 คืนเงินผู้เสียหายทั้งหมด', lock: lockMoney(6), effects: { money: -6, happy: -2, smart: 1 }, memory: 'ยอมคืนเงินผู้เสียหายจนหมดตัว', result: [{ text: 'ยอมความได้ แต่ต้องเริ่มชีวิตใหม่จากศูนย์' }] },
    ],
  },
  {
    id: 'casino', age: 24, bg: 'city', title: 'คาสิโนชายแดน', chance: 0.45,
    cast: ['me'],
    lines: [{ text: 'เพื่อนร่วมงานชวนไปเที่ยวคาสิโนชายแดน "ไปลองเสี่ยงดวงกันหน่อย!"' }],
    choices: [
      { text: '🙅 ไม่เล่นการพนัน', effects: { smart: 1 }, memory: 'ปฏิเสธไปคาสิโน' },
      { text: '🎲 เล่นนิดเดียวพอ', outcomes: [
        { chance: 0.5, effects: { money: 1, happy: 1 }, memory: 'ได้เงินจากคาสิโนนิดหน่อย', result: [{ text: 'ได้มาสองพัน รีบเลิกตอนกำลังดี' }] },
        { chance: 0.5, effects: { money: -1 }, memory: 'เสียเงินที่คาสิโนนิดหน่อย', result: [{ text: 'เสียไปสองพัน ถือว่าค่าประสบการณ์' }] },
      ] },
      { text: '🎰 หมดหน้าตัก!', hint: 'เสี่ยง', outcomes: [
        { chance: 0.25, effects: { money: 7, happy: 2 }, memory: 'แจ็กพอตแตกที่คาสิโน', result: [{ text: 'แจ็กพอตแตก!! เสียงเหรียญดังทั้งห้อง' }] },
        { chance: 0.75, effects: { money: -5, happy: -2 }, flags: ['debt'], memory: 'ติดหนี้พนันก้อนโต', result: [{ text: 'หมดตัว... แล้วยังยืมเงินนอกระบบมาเล่นต่ออีก' }] },
      ] },
    ],
  },
  {
    id: 'loanshark', age: 28, bg: 'home', title: 'หนี้นอกระบบ',
    when: (s) => has(s, 'debt') || s.stats.money <= 0,
    cast: ['me'],
    lines: [{ text: 'ชายใส่แว่นดำมายืนหน้าบ้าน "ดอกเบี้ยวันละ 20% นะครับ วันนี้ต้องได้"' }],
    choices: [
      { text: '🏠 สารภาพกับครอบครัว', lock: (s) => s.stats.family < 3 && 'ความสัมพันธ์กับครอบครัวไม่ดีพอ', effects: { family: -1, money: 2, happy: 1 }, memory: 'ครอบครัวช่วยปลดหนี้', result: [{ who: 'mom', expr: 'sad', text: 'ไม่เป็นไรลูก แม่ช่วยเอง... แต่สัญญานะว่าจะไม่ทำอีก' }] },
      { text: '💪 ทำงานสามกะใช้หนี้', effects: { body: -2, happy: -2, money: 2 }, memory: 'ทำงานสามกะใช้หนี้', result: [{ text: 'สองปีเต็มที่แทบไม่ได้นอน แต่ก็ใช้หนี้หมดในที่สุด' }] },
      { text: '🎲 ยืมอีกก้อนไปเล่นแก้มือ', outcomes: [
        { chance: 0.2, effects: { money: 5, happy: 2 }, memory: 'แก้มือพนันจนปลดหนี้ได้', result: [{ text: 'ปาฏิหาริย์! ได้คืนมาหมดพร้อมกำไร' }] },
        { chance: 0.35, effects: { money: -3, body: -2, happy: -3, family: -1 }, memory: 'แพ้พนันซ้ำ ต้องหนีเจ้าหนี้ไปทำงานต่างจังหวัด', result: [{ text: 'แพ้หมดอีกรอบ... ต้องหนีไปใช้แรงงานต่างจังหวัดหลายปีกว่าจะตั้งตัวได้' }] },
        { chance: 0.45, end: 'bankrupt', memory: 'หนี้พนันท่วมหัว', result: [{ text: 'หนี้พอกเป็นหลักล้าน... ต้องหนีออกจากบ้านกลางดึก' }] },
      ] },
    ],
  },
  {
    id: 'burnout', age: 42, bg: 'office', title: 'ร่างกายประท้วง',
    when: (s) => has(s, 'workaholic') || s.stats.happy <= 3,
    cast: ['me'],
    lines: [{ who: 'me', expr: 'sad', text: 'ตีสาม ทำงานติดกันมาเดือนครึ่ง... มือเริ่มสั่น หัวใจเต้นแปลก ๆ' }],
    choices: [
      { text: '🏖️ ลาพักยาวสามเดือน', effects: { happy: 3, money: -2, body: 1 }, memory: 'ลาพักยาวเพราะหมดไฟ', result: [{ text: 'ได้กลับมาหายใจเต็มปอดอีกครั้ง' }] },
      { text: '🧘 ไปบวช / ปฏิบัติธรรม', effects: { happy: 4, smart: 1, money: -1 }, memory: 'ไปบวชตอนหมดไฟ', result: [{ text: 'ความเงียบในวัดตอบคำถามที่หาไม่เจอมาทั้งชีวิต' }] },
      { text: '☕ กาแฟอีกแก้ว ทำต่อ', hint: 'เสี่ยง', outcomes: [
        { chance: 0.55, effects: { money: 3, happy: -2, body: -2 }, memory: 'ฝืนทำงานหนักจนงานสำเร็จ',
          result: (s) => [{ text: SELF_EMPLOYED.includes(s.career ?? '') ? 'งานเสร็จทันกำหนด รายได้ปีนี้พุ่ง... แต่ร่างกายทรุดลงชัดเจน' : 'โปรเจกต์สำเร็จ ได้เลื่อนตำแหน่ง... แต่ร่างกายทรุดลงชัดเจน' }] },
        { chance: 0.45, end: 'overwork', memory: 'หัวใจหยุดเต้นที่โต๊ะทำงาน', result: [{ text: 'แก้วกาแฟหล่นลงพื้น... หน้าจอยังเปิดค้างอยู่จนเช้า' }] },
      ] },
    ],
  },
  {
    id: 'chestpain', mood: 'sad', age: 58, bg: 'home', title: 'เจ็บหน้าอกกลางดึก', timer: 6,
    when: (s) => s.stats.body <= 3,
    cast: ['me'],
    lines: [{ who: 'me', expr: 'sad', text: 'แน่นหน้าอก ร้าวไปถึงแขนซ้าย... เหงื่อออกเต็มตัว' }],
    choices: [
      { text: '🚑 เรียกรถพยาบาลทันที', effects: { body: 2, money: -2 }, flags: ['healthy'], memory: 'รอดจากหัวใจวายเพราะไปโรงพยาบาลทัน', result: [{ text: 'หมอบอกว่า "มาทันพอดี อีกครึ่งชั่วโมงคงไม่รอด"' }] },
      { text: '😴 นอนพัก พรุ่งนี้ค่อยไป', onTimeout: true, hint: 'เสี่ยง', outcomes: [
        { chance: 0.5, effects: { body: -1 }, memory: 'รอดจากอาการหัวใจแบบเฉียดฉิว', result: [{ text: 'ตื่นมาอย่างอ่อนเพลีย... โชคดีที่ยังได้ตื่น' }] },
        { chance: 0.5, end: 'heart', memory: 'หัวใจวายตอนหลับ', result: [{ text: 'คืนนั้นเงียบมาก... และเป็นคืนสุดท้าย' }] },
      ] },
      { text: '📞 โทรปลุกคนข้างบ้านให้ขับไปส่ง', effects: { body: 1, social: 1, money: -1 }, flags: ['healthy'], memory: 'รอดจากหัวใจวายเพราะเพื่อนบ้านขับไปส่งโรงพยาบาล', result: [{ text: 'ลุงข้างบ้านขับฝ่าไฟแดงสามแยก... ถึงโรงพยาบาลทันแบบเฉียดฉิว' }] },
    ],
  },
]
