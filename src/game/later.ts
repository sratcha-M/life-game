import { rand } from './finance'
import { SELF_EMPLOYED } from './careers'
import { bondOf } from './bonds'
import type { BgId, CharId, Choice, GameState, Line, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)
const married = (s: GameState) => has(s, 'partner') && !has(s, 'divorced')
const R = (text: string, who?: CharId): Line[] => [{ text, who }]
const mateWord = (s: GameState) => (s.gender === 'girl' ? 'ภพ' : 'แพร')

// ═════════ ช่องเวลากลาง–ปลายชีวิต: ทุกช่องเกิดแน่ 1 เรื่อง สุ่มจากตัวเลือกที่ "เข้ากับชีวิตตอนนั้น" ═════════
interface Opt { id: string; mood?: 'sad'; bg: BgId; cast: CharId[] | ((s: GameState) => CharId[]); title: string; cond?: (s: GameState) => boolean; lines: Line[] | ((s: GameState) => Line[]); choices: Choice[] }
function slot(key: string, age: number, opts: Opt[]): Scene[] {
  const pick = (s: GameState) => {
    const ok = opts.map((o, i) => (!o.cond || o.cond(s) ? i : -1)).filter((i) => i >= 0)
    return ok.length ? ok[Math.floor(rand(s.seed, 'slot' + key) * ok.length)] : -1
  }
  return opts.map((o, i) => ({ id: `life_${o.id}`, age, mood: o.mood, bg: o.bg, cast: o.cast, title: o.title, when: (s: GameState) => pick(s) === i, lines: o.lines, choices: o.choices }))
}

export const LATER: Scene[] = [
  // ── 37 ──
  ...slot('37', 37, [
    { id: 'kid_school', bg: 'schoolyard', cast: ['me', 'kid'], title: 'วันแรกของลูก', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', expr: 'sad', text: 'ไม่อยากไปโรงเรียน... อยู่กับพ่อแม่ได้ไหม' }],
      choices: [
        { text: '🤝 นั่งรอหน้าห้องจนเที่ยง', effects: { family: 2, money: -1 }, flags: ['kid_kind'], memory: 'นั่งรอลูกหน้าห้องเรียนวันแรก', result: R('พอถึงเที่ยง ลูกวิ่งออกมาพร้อมเพื่อนใหม่สามคน') },
        { text: '🎒 เล่านิทานเรื่องวันแรกของตัวเอง', effects: { family: 2, art: 1 }, flags: ['kid_art'], memory: 'เล่าเรื่องวันแรกที่โรงเรียนของตัวเองให้ลูกฟัง', result: R('ลูกหัวเราะ "พ่อแม่ก็เคยร้องไห้เหรอ!" แล้วเดินเข้าห้องอย่างกล้าหาญ') },
      ] },
    { id: 'reunion_old', bg: 'city', cast: ['me'], title: 'สังคมใหม่', lines: [{ text: 'เพื่อนสมัยมหาลัยตั้งกลุ่มตีกอล์ฟทุกเสาร์ คนในกลุ่มเป็นผู้บริหารทั้งนั้น' }],
      choices: [
        { text: '⛳ เข้ากลุ่ม', effects: { social: 2, money: 1, family: -1 }, memory: 'เข้ากลุ่มตีกอล์ฟกับผู้บริหาร', result: R('ได้ดีลงานใหญ่จากสนามกอล์ฟ แต่เสาร์อาทิตย์หายไปจากบ้าน') },
        { text: '🏠 เสาร์อาทิตย์คือของครอบครัว', effects: { family: 2, happy: 1 }, memory: 'ปฏิเสธสังคมใหม่ เก็บวันหยุดไว้ให้ครอบครัว', result: R('ทำกับข้าวด้วยกันทุกวันอาทิตย์ กลายเป็นธรรมเนียมบ้าน') },
      ] },
    { id: 'parents_house', bg: 'home', cast: ['dad', 'me', 'mom'], title: 'บ้านเก่าทรุด', cond: (s) => !has(s, 'cut_family'),
      lines: [{ who: 'dad', text: 'หลังคาบ้านรั่วทุกครั้งที่ฝนตก... พ่อกับแม่ซ่อมไม่ไหวแล้วลูก' }],
      choices: [
        { text: '🔨 ซ่อมให้ทั้งหลัง', fin: { cash: -250_000 }, effects: { family: 3 }, memory: 'ซ่อมบ้านเก่าให้พ่อแม่ทั้งหลัง', result: R('พ่อลูบเสาบ้านใหม่ "บ้านหลังนี้จะอยู่ไปถึงรุ่นหลานแล้ว"', 'dad') },
        { text: '🏢 ชวนย้ายมาอยู่คอนโดใกล้ ๆ', fin: { cash: -100_000 }, effects: { family: 1, happy: 1 }, memory: 'ชวนพ่อแม่ย้ายมาอยู่ใกล้ ๆ', result: R('แม่บ่นคิดถึงต้นมะม่วง แต่ได้เจอหลานทุกวัน') },
      ] },
  ]),
  // ── 43 ──
  ...slot('43', 43, [
    { id: 'midcrisis', bg: 'city', cast: ['me'], title: 'วิกฤตวัยกลางคน', lines: [{ text: 'ตื่นมาเช้าวันเกิดอายุ 43... ชีวิตนี้ทำอะไรไปแล้วบ้างนะ' }],
      choices: [
        { text: '🏍️ ซื้อบิ๊กไบค์', fin: { cash: -400_000 }, effects: { happy: 3, family: -1 }, memory: 'ซื้อบิ๊กไบค์ตอนอายุ 43', result: R('ลมปะทะหน้าบนถนนเขาใหญ่ รู้สึกยี่สิบอีกครั้ง') },
        { text: '🎓 สมัครเรียนปริญญาโท', fin: { cash: -200_000 }, effects: { smart: 3, happy: 1 }, memory: 'กลับไปเรียนปริญญาโทตอน 43', result: R('นั่งเรียนกับเด็กอายุ 23... และได้ที่หนึ่งของรุ่น') },
        { text: '🧘 บวชระยะสั้น/ปฏิบัติธรรม', effects: { happy: 2, body: 1 }, memory: 'ไปปฏิบัติธรรมสิบวัน', result: R('สิบวันที่ไม่ได้จับมือถือ คำตอบหลายข้ออยู่ในความเงียบ') },
      ] },
    { id: 'kid_draw', bg: 'home', cast: ['kid', 'me'], title: 'รูปครอบครัว', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', expr: 'happy', text: 'ดูสิ! หนูวาดรูปครอบครัวเราส่งครู ได้ดาวทองด้วย!' }],
      choices: [
        { text: '🖼️ เอาไปใส่กรอบติดผนัง', effects: { family: 3, happy: 2 }, flags: ['kid_art'], memory: 'ใส่กรอบรูปวาดครอบครัวของลูก', result: R('รูปนั้นแขวนอยู่กลางบ้าน... ทุกคนในรูปยิ้มกว้างเกินจริง') },
        { text: '🎨 สมัครเรียนวาดรูปให้ลูก', fin: { cash: -30_000 }, effects: { family: 2 }, flags: ['kid_art'], memory: 'ส่งลูกเรียนศิลปะ', result: R('ทุกเสาร์ลูกกลับมาพร้อมภาพใหม่ บ้านกลายเป็นแกลเลอรี') },
      ] },
    { id: 'alone_holiday', bg: 'home', cast: ['me'], title: 'สงกรานต์คนเดียว', cond: (s) => !married(s),
      lines: [{ text: 'สงกรานต์ปีนี้ทุกคนกลับบ้านหมด... คอนโดเงียบจนได้ยินเสียงตู้เย็น' }],
      choices: [
        { text: '✈️ จองตั๋วเที่ยวคนเดียว', fin: { cash: -60_000 }, effects: { happy: 3, social: 1 }, flags: ['dreamer'], memory: 'เที่ยวคนเดียวช่วงสงกรานต์', result: R('ได้เพื่อนใหม่ในโฮสเทลที่ลาว นั่งคุยกันริมโขงจนเช้า') },
        { text: '🏡 กลับไปหาพ่อแม่', effects: { family: 3 }, memory: 'กลับบ้านไปรดน้ำดำหัวพ่อแม่', result: R('แม่ทำแกงที่ชอบรอไว้ตั้งแต่เมื่อวาน') },
      ] },
  ]),
  // ── 49 ──
  ...slot('49', 49, [
    { id: 'kid_abroad', bg: 'sky', cast: ['kid', 'me'], title: 'ลูกอยากไปไกล', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', text: 'หนูได้ทุนไปเรียนที่ญี่ปุ่น... แต่ต้องอยู่ที่นั่นสี่ปีนะ' }],
      choices: [
        { text: '✈️ ไปเลยลูก', effects: { family: 2, happy: -1 }, flags: ['kid_smart'], memory: 'ส่งลูกไปเรียนต่อต่างประเทศ', result: R('สนามบินตอนตีห้า ลูกกอดแน่น "หนูจะวิดีโอคอลทุกวัน"') },
        { text: '🏠 เรียนในไทยก่อนดีไหม', effects: { family: -1 }, memory: 'ขอให้ลูกเรียนในประเทศ', result: R('ลูกยอม... แต่สายตาตอนเก็บจดหมายตอบรับนั้นลืมไม่ลง') },
      ] },
    { id: 'checkup', bg: 'hospital', cast: ['me'], title: 'ผลตรวจประจำปี', lines: [{ text: 'หมอยื่นผลตรวจ "ความดัน ไขมัน น้ำตาล... ขึ้นหมดเลยนะ"' }],
      choices: [
        { text: '🚭 เลิกเหล้าบุหรี่ วิ่งทุกเช้า', effects: { body: 3, happy: -1 }, flags: ['healthy'], memory: 'เลิกเหล้าบุหรี่หลังผลตรวจสุขภาพ', result: R('หกเดือนต่อมา ค่าทุกอย่างกลับมาปกติ หมอยังตกใจ') },
        { text: '💊 กินยาตามหมอพอ', effects: { body: 1 }, memory: 'เริ่มกินยาความดัน', result: R('ยาเม็ดเล็ก ๆ กลายเป็นเพื่อนประจำมื้อเช้า') },
      ] },
    { id: 'mentor', bg: 'office', cast: ['me'], title: 'เด็กฝึกงาน', lines: [{ text: 'เด็กฝึกงานคนหนึ่งชอบมาถามงานคุณทุกวัน... เหมือนตัวเองตอนอายุยี่สิบ' }],
      choices: [
        { text: '🧑‍🏫 สอนทุกอย่างที่รู้', effects: { social: 2, happy: 2 }, flags: ['mentor'], memory: 'สอนงานเด็กฝึกงานจนเก่งกว่าตัวเอง', result: R('สิบปีต่อมา เด็กคนนั้นขึ้นเวทีรับรางวัล แล้วเอ่ยชื่อคุณเป็นคนแรก') },
        { text: '😐 สอนเท่าที่จำเป็น', effects: { money: 1 }, memory: 'สอนงานเด็กฝึกงานเท่าที่จำเป็น', result: R('เด็กฝึกงานย้ายไปบริษัทอื่นเมื่อจบโครงการ') },
      ] },
  ]),
  // ── 53 ──
  ...slot('53', 53, [
    { id: 'kid_grad', bg: 'campus', cast: ['me', 'kid'], title: 'ลูกรับปริญญา', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', expr: 'happy', text: 'ถ่ายรูปกับหนูหน่อย! ชุดครุยนี้ส่วนหนึ่งเป็นของพ่อแม่นะ' }],
      choices: [
        { text: '📸 ถ่ายรูปจนแบตหมด', effects: { family: 3, happy: 3 }, memory: 'ไปงานรับปริญญาของลูก', result: R('รูปที่ลูกอุ้มดอกไม้ยิ้มกว้าง... กลายเป็นวอลเปเปอร์มือถือไปอีกสิบปี') },
        { text: '💌 เขียนจดหมายให้ลูก', effects: { family: 3, art: 1 }, flags: ['kid_kind'], memory: 'เขียนจดหมายยาวให้ลูกในวันรับปริญญา', result: R('ลูกอ่านจบแล้วร้องไห้กลางมหาลัย... เก็บจดหมายไว้ในกระเป๋าสตางค์ตลอดไป') },
      ] },
    { id: 'friend_loss', mood: 'sad', bg: 'garden', cast: ['me'], title: 'งานศพเพื่อน', lines: [{ text: 'เพื่อนร่วมรุ่นคนแรกจากไปด้วยโรคหัวใจ... อายุเท่ากันเลย' }],
      choices: [
        { text: '📞 โทรหาเพื่อนเก่าทุกคน', effects: { friend: 2, social: 2, happy: 1 }, memory: 'โทรหาเพื่อนเก่าทุกคนหลังเพื่อนจากไป', result: R('นัดเจอกันทุกเดือนตั้งแต่นั้น "ไม่รู้จะได้เจอกันอีกกี่ครั้ง"') },
        { text: '📝 ทำรายการสิ่งที่อยากทำก่อนตาย', effects: { happy: 2 }, flags: ['dreamer'], memory: 'เขียนรายการสิ่งที่อยากทำก่อนตาย', result: R('ข้อแรก: ดูทะเลหมอกที่ภูชี้ฟ้า... ทำได้ในเดือนถัดมา') },
      ] },
  ]),
  // ── 57 ──
  ...slot('57', 57, [
    { id: 'kid_wed', bg: 'wedding', cast: ['me', 'kid'], title: 'ลูกแต่งงาน', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', text: 'วันนี้วันแต่งงานหนู... อยากให้ช่วยพูดอะไรหน่อยบนเวที' }],
      choices: [
        { text: '🎤 เล่าเรื่องวันที่ลูกเกิด', effects: { family: 3, happy: 2 }, memory: 'กล่าวอวยพรในงานแต่งลูก', result: R('ทั้งงานเงียบ แล้วปรบมือดังที่สุดของคืน') },
        { text: '😭 พูดไม่จบเพราะร้องไห้', effects: { family: 3 }, memory: 'ร้องไห้กลางเวทีงานแต่งลูก', result: R('ลูกขึ้นมากอด... ไม่ต้องพูดอะไรเลยก็เข้าใจ') },
      ] },
    { id: 'old_home', bg: 'village', cast: ['me'], title: 'บ้านเกิด', lines: [{ text: 'มีคนขอซื้อที่ดินบ้านยายเก่า... หรือจะกลับไปซ่อมไว้อยู่ตอนแก่?' }],
      choices: [
        { text: '🌾 เก็บไว้ จะกลับไปอยู่', flags: ['countryside'], effects: { family: 1, happy: 2 }, memory: 'ตัดสินใจเก็บบ้านเกิดไว้กลับไปอยู่ตอนแก่', result: R('ปลูกมะม่วงต้นใหม่ข้างต้นเดิม') },
        { text: '💰 ขาย', fin: { cash: 1_200_000 }, effects: { family: -1 }, memory: 'ขายที่ดินบ้านเกิด', result: R('ได้เงินก้อนโต... แต่ไม่มีที่ให้กลับไปอีกแล้ว') },
      ] },
  ]),
  // ── 61 ──
  ...slot('61', 61, [
    { id: 'anniv', bg: 'wedding', cast: ['me', 'fah'], title: 'ครบรอบ', cond: married,
      lines: [{ who: 'fah', expr: 'happy', text: 'อยู่ด้วยกันมาตั้งนาน... ไปเที่ยวทะเลที่ไปฮันนีมูนกันอีกไหม {name}' }],
      choices: [
        { text: '🌅 ไปทะเลที่เดิม', fin: { cash: -50_000 }, effects: { love: 3, happy: 3 }, memory: 'ฉลองครบรอบกับ{fah}ที่ทะเลเดิม', result: R('ร้านข้าวต้มริมหาดยังอยู่ เจ้าของร้านจำได้!') },
        { text: '💌 เขียนจดหมายรักฉบับแรกในชีวิต', effects: { love: 3, art: 1 }, memory: 'เขียนจดหมายรักให้{fah}ตอนอายุ 61', result: R('{fah}อ่านแล้วเงียบไปนาน... เก็บไว้ใต้หมอนทุกคืน') },
      ] },
    { id: 'volunteer', bg: 'village', cast: ['me'], title: 'จิตอาสา', lines: [{ text: 'มูลนิธิหาคนสอนหนังสือเด็กในชุมชนแออัด ไม่มีค่าจ้าง' }],
      choices: [
        { text: '🧑‍🏫 สมัครทันที', effects: { happy: 3, social: 2 }, flags: ['mentor'], memory: 'เป็นจิตอาสาสอนเด็กหลังเกษียณ', result: (s) => R(`เด็ก ๆ เรียกว่า "${s.career === 'monk' ? (s.gender === 'boy' ? 'หลวงตาครู' : 'แม่ชีครู') : s.gender === 'boy' ? 'คุณตาครู' : 'คุณยายครู'}" ทุกเย็น`) },
        { text: '🎨 เรียนวาดรูปเองดีกว่า', effects: { art: 3, happy: 2 }, memory: 'เริ่มเรียนวาดรูปสีน้ำตอนอายุ 61', result: R('ภาพแรกห่วยมาก ภาพที่ร้อยติดผนังร้านกาแฟในซอย') },
      ] },
  ]),
  // ── 64 ──
  ...slot('64', 64, [
    { id: 'eyes', bg: 'hospital', cast: ['me'], title: 'โลกที่ชัดอีกครั้ง', lines: [{ text: 'ผ่าตัดต้อกระจกเสร็จ เปิดผ้าปิดตา... สีของโลกสดกว่าที่จำได้' }],
      choices: [
        { text: '🌸 ออกไปดูดอกไม้', effects: { happy: 3, body: 1 }, memory: 'ผ่าตัดต้อกระจกแล้วเห็นโลกชัดอีกครั้ง', result: R('ดอกเฟื่องฟ้าหน้าบ้าน สวยขนาดนี้มาตลอดเลยเหรอ') },
        { text: '📖 อ่านหนังสือที่ค้างไว้', effects: { smart: 2, happy: 1 }, memory: 'กลับมาอ่านหนังสือได้อีกครั้ง', result: R('อ่านจบสามเล่มในอาทิตย์เดียว') },
      ] },
    { id: 'teach_grand', bg: 'garden', cast: ['me', 'kid'], title: 'สอนหลาน', cond: (s) => has(s, 'kid'),
      lines: [{ who: 'kid', expr: 'happy', text: 'สอนหนูทำอันนั้นหน่อย อันที่ทำเก่งที่สุดในชีวิตน่ะ!' }],
      choices: [
        { text: '🍳 สอนทำอาหารสูตรประจำบ้าน', effects: { family: 3 }, flags: ['family_recipe'], memory: 'สอนสูตรอาหารประจำบ้านให้หลาน', result: R('สูตรนี้จะอยู่ต่อไปอีกหลายรุ่น') },
        { text: '🌱 สอนปลูกต้นไม้', effects: { family: 2, happy: 1 }, memory: 'พาหลานปลูกต้นมะม่วง', result: R('"ต้นนี้จะโตไปพร้อมหนูนะ"') },
      ] },
  ]),
  // ── 67 ──
  ...slot('67', 67, [
    { id: 'memoir', bg: 'home', cast: ['me'], title: 'บันทึกชีวิต', lines: [{ text: 'มีคนบอกว่าเรื่องชีวิตคุณน่าเขียนเป็นหนังสือ...' }],
      choices: [
        { text: '✍️ เขียนเลย', effects: { art: 3, happy: 2 }, flags: ['dreamer'], memory: 'เขียนหนังสือเล่าชีวิตตัวเอง', result: (s) => R(`พิมพ์ได้ร้อยเล่ม แจกญาติหมด... ${has(s, 'kid') || has(s, 'met_nong') ? 'หลาน' : 'เด็กข้างบ้าน'}อ่านแล้วบอกว่า "เท่มาก"`) },
        { text: '🎙️ อัดเสียงเล่าให้หลานฟัง', when: (s) => has(s, 'kid') || has(s, 'met_nong'), effects: { family: 3 }, memory: 'อัดเสียงเล่าเรื่องชีวิตไว้ให้ลูกหลาน', result: R('ไฟล์เสียงหกชั่วโมง ที่ลูกหลานจะเปิดฟังในวันที่คิดถึง') },
        { text: '🎙️ อัดเสียงเล่าเก็บไว้', when: (s) => !has(s, 'kid') && !has(s, 'met_nong'), effects: { family: 1, happy: 2 }, memory: 'อัดเสียงเล่าเรื่องชีวิตเก็บไว้ให้คนรุ่นหลัง', result: R('ไฟล์เสียงหกชั่วโมง เผื่อวันหนึ่งจะมีใครอยากฟัง') },
      ] },
    { id: 'last_trip', bg: 'sky', cast: ['me'], title: 'ทริปสุดท้าย', lines: [{ text: 'ขายังเดินไหว... มีที่หนึ่งที่อยากไปมาตลอดชีวิต' }],
      choices: [
        { text: '🏔️ ไปเนปาลดูเอเวอเรสต์', fin: { cash: -150_000 }, effects: { happy: 4, body: -1 }, memory: 'ไปดูยอดเขาเอเวอเรสต์ตอนอายุ 67', result: R('ยอดเขาสีชมพูตอนพระอาทิตย์ขึ้น... คุ้มทุกก้าว') },
        { text: '🏡 ไปเยี่ยมทุกคนที่เคยรู้จัก', effects: { friend: 2, family: 2, social: 2 }, memory: 'ตระเวนเยี่ยมทุกคนที่เคยผูกพัน', result: R('สามเดือน สิบเจ็ดจังหวัด ห้าสิบบ้าน กอดนับไม่ถ้วน') },
      ] },
  ]),
  // ── 69 ──
  ...slot('69', 69, [
    { id: 'letter', bg: 'home', cast: ['me'], title: 'จดหมายถึงตัวเองตอนเด็ก', lines: [{ text: 'ถ้าส่งจดหมายไปหาตัวเองตอนอายุเจ็ดขวบได้ จะเขียนว่าอะไร?' }],
      choices: [
        { text: '"อย่ากลัวเลย ทุกอย่างจะผ่านไป"', effects: { happy: 2 }, memory: 'เขียนจดหมายบอกตัวเองตอนเด็กว่าไม่ต้องกลัว', result: R('น้ำตาหยดลงบนกระดาษ... ทับคำว่า "ไม่ต้องกลัว"') },
        { text: '"กอดพ่อแม่ให้บ่อยกว่านี้"', effects: { family: 2 }, memory: 'เขียนจดหมายบอกตัวเองให้กอดพ่อแม่บ่อย ๆ', result: R('พับจดหมายใส่ขวด วางไว้ข้างรูปพ่อแม่') },
      ] },
    { id: 'will', bg: 'home', cast: ['me', 'kid'], title: 'แบ่งมรดก', cond: (s) => has(s, 'kid'),
      lines: [{ text: 'ถึงเวลาเขียนพินัยกรรม... จะทิ้งอะไรไว้ให้ลูกหลานดี?' }],
      choices: [
        { text: '💰 แบ่งเงินให้ลูกหลานเท่า ๆ กัน', effects: { family: 2 }, memory: 'เขียนพินัยกรรมแบ่งให้ลูกหลานเท่ากัน', result: R('ไม่มีใครทะเลาะกัน... นี่คือมรดกที่ดีที่สุด') },
        { text: '🏫 บริจาคครึ่งหนึ่งตั้งทุนการศึกษา', fin: { cashMul: 0.6 }, effects: { happy: 3, social: 2 }, flags: ['donor'], memory: 'ตั้งทุนการศึกษาในชื่อตัวเอง', result: R('ทุกปีจะมีเด็กยากจนสิบคนได้เรียนฟรีในชื่อของคุณ') },
      ] },
  ]),
]

// ═════════ ความรักทางอื่น (ไม่ใช่แค่ฟ้า) ═════════
export const LOVE2: Scene[] = [
  {
    id: 'love_work', age: 29, bg: 'office', title: 'คนในออฟฟิศ', cast: ['me'],
    // อาชีพอิสระไม่มีแผนก/เพื่อนร่วมงาน → ไม่มีรักในออฟฟิศ
    when: (s) => !has(s, 'partner') && !!s.career && !SELF_EMPLOYED.includes(s.career),
    lines: (s) => [{ text: `${mateWord(s)} เพื่อนร่วมงานแผนกข้าง ๆ เอากาแฟมาวางให้ทุกเช้ามาสามเดือนแล้ว... วันนี้มีโน้ตแปะมาด้วย "เย็นนี้ว่างไหม?"` }],
    choices: [
      { text: '💕 ไปกินข้าวเย็นด้วย', flags: ['partner', 'mate'], effects: { love: 4, happy: 2 }, memory: 'เริ่มคบกับเพื่อนร่วมงานที่ชื่อ{fah}', result: R('ข้าวเย็นมื้อนั้นยาวสี่ชั่วโมง... ร้านต้องไล่ปิด') },
      { text: '🙂 ขอเป็นเพื่อนดีกว่า', effects: { social: 1 }, memory: 'ปฏิเสธเพื่อนร่วมงานอย่างสุภาพ', result: R('กาแฟยังวางอยู่ทุกเช้า... แต่ไม่มีโน้ตอีกแล้ว') },
    ],
  },
  {
    id: 'love_late', age: 46, bg: 'park', title: 'รักครั้งใหม่', cast: ['me'],
    when: (s) => !married(s),
    because: (s) => (has(s, 'divorced') ? 'เพราะหัวใจยังไม่ปิด แม้จะเคยเจ็บมาแล้ว' : null),
    lines: (s) => [{ text: `ในชมรมวิ่งตอนเช้า มีคนหนึ่งชื่อ${mateWord(s)} วิ่งเพซเดียวกันทุกวัน... วันนี้ชวนไปกินโจ๊กหลังวิ่ง` }],
    choices: [
      { text: '💞 ลองเปิดใจอีกครั้ง', flags: ['partner', 'mate', 'late_love'], unflags: ['divorced'], effects: { love: 4, happy: 3, body: 1 }, memory: 'เปิดใจคบกับ{fah}ตอนอายุ 46', result: R('ไม่มีงานแต่งใหญ่ มีแค่สองคนวิ่งเคียงกันทุกเช้าจนแก่') },
      { text: '🏃 วิ่งคนเดียวสบายใจกว่า', effects: { body: 1, happy: 1 }, memory: 'เลือกใช้ชีวิตคนเดียวต่อ', result: R('ชีวิตคนเดียวก็มีจังหวะของมัน') },
    ],
  },
]

// ═════════ ตัวละครข้ามเส้นเรื่องมาเจอกัน ═════════
export const CROSS: Scene[] = [
  {
    id: 'x_nongjay', age: 32, bg: 'city', title: 'น้องฝนกับเจ!?', cast: ['nong', 'jay'],
    when: (s) => has(s, 'met_nong') && has(s, 'met_jay') && bondOf(s, 'nong') >= 3 && bondOf(s, 'jay') >= 3 && !has(s, 'jay_betray') && !has(s, 'betrayed_jay'),
    because: () => 'เพราะคุณเป็นคนแนะนำให้สองคนนี้รู้จักกันในงานวันเกิด',
    lines: [{ who: 'nong', expr: 'happy', text: 'พี่... หนูกับพี่เจคบกันมาครึ่งปีแล้วนะ ไม่โกรธใช่ไหม' }],
    choices: [
      { text: '🎉 เชียร์สุดตัว', flags: ['nongjay'], bond: { nong: 2, jay: 2 }, effects: { family: 1, happy: 2 }, memory: 'รู้ว่าน้องฝนคบกับเจแล้วเชียร์สุดตัว', result: R('คู่แข่งตอนเด็ก กำลังจะกลายเป็นน้องเขย!') },
      { text: '😤 ไม่เห็นด้วย', bond: { nong: -3, jay: -3 }, memory: 'ไม่เห็นด้วยที่น้องฝนคบกับเจ', result: R('ทั้งคู่เงียบไป... และคบกันต่อโดยไม่บอกคุณอีก') },
    ],
  },
  {
    id: 'x_nongjay2', age: 38, bg: 'wedding', title: 'งานแต่งที่ไม่คาดคิด', cast: ['jay', 'me', 'nong'],
    when: (s) => has(s, 'nongjay'),
    because: (s) => `เพราะตอนอายุ ${s.flagAt?.nongjay}: คุณเชียร์น้องฝนกับเจ`,
    lines: [{ who: 'jay', expr: 'happy', text: 'จากคู่แข่งตอน ป.5 วันนี้ต้องเรียกนายว่าพี่แล้วสินะ!' }],
    choices: [
      { text: '🎤 เป็นพิธีกรงานแต่ง', flags: ['jay_family'], bond: { nong: 2, jay: 3 }, effects: { family: 3, happy: 3, social: 1 }, memory: 'เป็นพิธีกรงานแต่งน้องฝนกับเจ', result: R('เล่าเรื่องศึกตอบปัญหาตอน ม.5 จนเจหน้าแดงทั้งงาน') },
    ],
  },
  {
    id: 'x_tonjay', age: 36, bg: 'city', title: 'เพื่อนสองคนของคุณ', cast: ['ton', 'me', 'jay'],
    when: (s) => s.stats.friend >= 4 && has(s, 'met_jay') && bondOf(s, 'jay') >= 4 && !has(s, 'betrayed') && !has(s, 'jay_betray'),
    lines: [{ who: 'ton', text: 'เจที่นายเล่าบ่อย ๆ ใช่คนนี้ไหม? ร้านเราอยากทำระบบสั่งออนไลน์พอดี!' }],
    choices: [
      { text: '🤝 จับสองคนทำงานด้วยกัน', fin: { invest: 400_000 }, bond: { jay: 2 }, effects: { friend: 2, social: 2 }, memory: 'แนะนำต้นกับเจให้ทำธุรกิจด้วยกัน', result: R('ร้านต้นยอดขายเพิ่มสามเท่า เจได้ลูกค้ารายแรกที่จ่ายตรงเวลา') },
      { text: '🍻 แค่ชวนดื่มด้วยกัน', bond: { jay: 1 }, effects: { friend: 1, happy: 2 }, memory: 'นั่งดื่มกับต้นและเจจนดึก', result: R('เถียงกันเรื่องฟุตบอลจนร้านปิด') },
    ],
  },
  {
    id: 'x_aunt', age: 45, bg: 'park', title: 'ป้าฝนกับหลาน', cast: ['nong', 'kid'],
    when: (s) => has(s, 'kid') && has(s, 'met_nong') && bondOf(s, 'nong') >= 5,
    lines: [{ who: 'nong', expr: 'happy', text: 'ขอยืมหลานไปเที่ยวสวนสัตว์วันเสาร์นะพี่! ป้าฝนจะเลี้ยงเอง' }],
    choices: [
      { text: '🦒 ฝากเลย', flags: ['aunt_nong'], bond: { nong: 2 }, effects: { family: 2, happy: 1 }, memory: 'น้องฝนพาลูกไปเที่ยวสวนสัตว์', result: R('ลูกกลับมาพร้อมตุ๊กตายีราฟ "ป้าฝนเท่ที่สุดในโลก!"') },
    ],
  },
  {
    id: 'x_uncle', age: 48, bg: 'schoolyard', title: 'ลุงต้น', cast: ['ton', 'kid'],
    when: (s) => has(s, 'kid') && s.stats.friend >= 6 && !has(s, 'betrayed'),
    lines: [{ who: 'ton', expr: 'happy', text: 'ลูกนายเตะบอลเหมือนนายตอน ป.3 เลย ให้ลุงต้นสอนเองนะ!' }],
    choices: [
      { text: '⚽ ฝากด้วยนะเพื่อน', flags: ['uncle_ton', 'kid_sport'], effects: { friend: 2, family: 1 }, memory: 'ต้นสอนลูกเตะบอลทุกเย็น', result: R('ลูกติดทีมโรงเรียน! วิ่งมากอดลุงต้นก่อนกอดพ่อแม่ซะอีก') },
    ],
  },
  {
    id: 'x_intern', age: 51, bg: 'office', title: 'ลุงเจ', cast: ['jay', 'kid'],
    when: (s) => has(s, 'kid') && has(s, 'met_jay') && bondOf(s, 'jay') >= 6 && !has(s, 'betrayed_jay'),
    lines: [{ who: 'jay', text: 'ส่งลูกมาฝึกงานบริษัทลุงเจได้เลย จะสอนให้เก่งกว่าพ่อแม่อีก!' }],
    choices: [
      { text: '💼 ส่งไปฝึกงาน', flags: ['uncle_jay', 'kid_smart'], bond: { jay: 1 }, effects: { family: 1 }, memory: 'ลูกไปฝึกงานกับเจ', result: R('ลูกกลับมาเล่าทุกเย็น "ลุงเจบอกว่าพ่อแม่เคยชนะเขาตอนสอบด้วย!"') },
    ],
  },
]

// ═════════ เรื่องแปลกที่เชื่อมต่อกัน ═════════
export const WEIRD2: Scene[] = [
  {
    id: 'rock_signal', age: 22, bg: 'home', title: 'หินส่งสัญญาณ', cast: ['me'],
    when: (s) => has(s, 'alien_rock'),
    because: () => 'เพราะคุณแอบเก็บหินอุกกาบาตไว้ตั้งแต่ ป.4',
    lines: [{ text: 'หินเรืองแสงในลิ้นชักกะพริบเป็นจังหวะยาว-สั้น... เหมือนรหัสมอร์ส' }],
    choices: [
      { text: '🧮 นั่งถอดรหัสทั้งคืน', lock: (s) => (s.stats.smart >= 5 ? false : 'ต้องมี 📘 ความรู้ 5+'), flags: ['decoded'], effects: { smart: 2 }, memory: 'ถอดรหัสสัญญาณจากหินอุกกาบาตได้', result: R('ข้อความเดียวซ้ำไปมา: "เราจะกลับมารับ อีกสิบสามปี"') },
      { text: '📦 ใส่กล่องเก็บใต้เตียง', effects: { happy: -1 }, memory: 'เก็บหินเรืองแสงใส่กล่อง', result: R('เสียงกะพริบยังดังเบา ๆ ใต้เตียงทุกคืน') },
    ],
  },
  {
    id: 'ghost_dream', age: 40, bg: 'village', title: 'ฝันถึงบ้านยาย', cast: ['me'],
    when: (s) => has(s, 'ghost_friend'),
    because: () => 'เพราะผียายทวดเคยกระซิบกับคุณตอน 7 ขวบ',
    lines: [{ text: 'สามคืนติด ฝันเห็นหญิงชราโปร่งแสงยืนใต้ต้นมะม่วง กวักมือเรียก "กลับบ้านมาหน่อยหลาน"' }],
    choices: [
      { text: '🏡 กลับไปทำบุญบ้านยาย', flags: ['ghost_call', 'countryside'], effects: { family: 2, happy: 1 }, memory: 'กลับไปทำบุญบ้านยายตามความฝัน', result: R('ใต้ต้นมะม่วงมีกล่องสังกะสีฝังอยู่... ข้างในเป็นรูปถ่ายเก่าของคุณตอนเด็ก') },
      { text: '😴 แค่ฝันน่า', effects: { happy: -1 }, memory: 'ไม่สนใจความฝันประหลาด', result: R('คืนที่สี่... ไม่ฝันอีกเลย') },
    ],
  },
  {
    id: 'ghost_return', age: 69, bg: 'village', title: 'เพื่อนเก่ามารับ', cast: ['me'],
    when: (s) => has(s, 'ghost_friend'),
    because: () => 'เพราะเพื่อนผีตั้งแต่ 7 ขวบไม่เคยลืมคุณ',
    lines: [{ text: 'คืนก่อนวันเกิด 70 ผียายทวดนั่งอยู่ปลายเตียง ยิ้มเหมือนตอนเจอกันครั้งแรก "ไปเที่ยวด้วยกันไหมหลาน"' }],
    choices: [
      { text: '👻 จับมือไปด้วยกัน', end: 'ghost', lock: (s) => (has(s, 'ghost_call') ? false : 'ต้องเคยกลับไปบ้านยายตามความฝัน'), memory: 'จับมือเพื่อนผีเดินทางไปด้วยกัน', result: R('ร่างกายเบาหวิว... ต้นมะม่วงบ้านยายโบกกิ่งลาเป็นครั้งสุดท้าย') },
      { text: '🎂 ขออยู่ฉลองวันเกิดก่อนนะ', effects: { happy: 2, family: 1 }, memory: 'บอกเพื่อนผีว่าขอฉลองวันเกิด 70 ก่อน', result: R('ผียายทวดหัวเราะ "งั้นเจอกันปีหน้า" แล้วจางหายไป') },
    ],
  },
  {
    id: 'cat_bridge', age: 36, bg: 'garden', title: 'สะพานสายรุ้ง', cast: ['coco'],
    when: (s) => has(s, 'cat_coco'),
    because: () => 'เพราะในร่างแมว คุณได้ยินเสียงเห่าที่คุ้นเคย',
    lines: [{ text: 'สองปีหลังวันสลับร่าง จู่ ๆ คุณก็หลับไปแล้วตื่นมาในร่างแมวส้มอีกครั้ง... คราวนี้อยู่บนทุ่งหญ้าสีรุ้ง' }, { who: 'coco', text: 'โฮ่ง! (โกโก้วิ่งมาเลียหน้า... ตรงนี้คือที่ที่สัตว์ทุกตัวรอคนที่รัก)' }],
    choices: [
      { text: '🐾 ไม่ขอกลับแล้ว อยู่กับโกโก้', end: 'cat', lock: (s) => (has(s, 'cat') || bondOf(s, 'coco') >= 6 ? false : 'ใจยังผูกกับโลกมนุษย์ (ต้องเคยเลี้ยงแมว หรือสนิทโกโก้ 6+)'), memory: 'เลือกอยู่กับโกโก้ในโลกของแมวตลอดไป', result: R('แมวส้มในร่างคนไปทำงานแทน... ส่วนคุณนอนอาบแดดข้างโกโก้ตลอดไป') },
      { text: '🏠 กอดโกโก้แล้วกลับไป', bond: { coco: 3 }, effects: { happy: 4 }, memory: 'ได้กอดโกโก้อีกครั้งแล้วกลับมาเป็นคน', result: R('ตื่นมาในร่างคนพร้อมขนสีน้ำตาลติดเสื้อหนึ่งเส้น') },
    ],
  },
]

// ═════════ รุ่นลูก: คนรู้จักและนิสัยที่พ่อแม่ทิ้งไว้ ═════════
const parentWord = (s: GameState) => (s.lineage?.[s.lineage.length - 1]?.gender === 'girl' ? 'แม่' : 'พ่อ')
const parentName = (s: GameState) => s.lineage?.[s.lineage.length - 1]?.name ?? ''
export const HEIR: Scene[] = [
  {
    id: 'heir_aunt', age: 13, bg: 'home', title: 'ป้าฝนมาหา', cast: ['me'],
    when: (s) => has(s, 'h_aunt'),
    because: (s) => `เพราะ${parentWord(s)}เคยฝากคุณให้ป้าฝนพาไปเที่ยวตอนเด็ก`,
    lines: (s) => [{ text: `ป้าฝน น้องของ${parentWord(s)}${parentName(s)} แวะมาพร้อมถุงขนม "ได้ข่าวว่าโดนเพื่อนแกล้งที่โรงเรียนเหรอ เล่าให้ป้าฟังหน่อย"` }],
    choices: [
      { text: '🗣️ เล่าทุกอย่าง', effects: { family: 2, happy: 2 }, memory: 'ป้าฝนช่วยคุยกับครูเรื่องโดนแกล้ง', result: R('ป้าฝนไปคุยกับครูให้ แล้วพาไปกินบิงซูปลอบใจ "ตอนเด็ก พ่อแม่หนูก็เคยปกป้องป้าแบบนี้แหละ"') },
      { text: '🙂 บอกว่าไม่เป็นไร', effects: { body: 1, family: 1 }, memory: 'ป้าฝนสอนให้ยืนหยัดด้วยตัวเอง', result: R('ป้าฝนยิ้ม "เหมือนพ่อแม่หนูเปี๊ยบ ดื้อแบบเดียวกัน"') },
    ],
  },
  {
    id: 'heir_ton', age: 16, bg: 'schoolyard', title: 'ลุงต้นที่สนามบอล', cast: ['me'],
    when: (s) => has(s, 'h_ton'),
    because: (s) => `เพราะลุงต้นคือเพื่อนตายของ${parentWord(s)}`,
    lines: [{ text: 'ลุงต้นผมหงอกแล้วแต่ยังยืนตะโกนข้างสนาม "ส่งบอลแบบที่พ่อแม่เราเคยส่งให้ลุงสิ!"' }],
    choices: [
      { text: '⚽ ซ้อมกับลุงทุกเย็น', effects: { body: 2, friend: 2 }, memory: 'ลุงต้นสอนเตะบอลทุกเย็น', result: R('ทีมโรงเรียนได้แชมป์จังหวัด ลุงต้นร้องไห้ข้างสนามเหมือนเด็ก') },
      { text: '🍜 ฟังลุงเล่าเรื่องพ่อแม่ตอนเด็ก', effects: { family: 2, happy: 1 }, memory: 'ฟังลุงต้นเล่าวีรกรรมของพ่อแม่สมัยเรียน', result: R('ไม่เคยรู้เลยว่าพ่อแม่เคยโดดเรียนไปกินก๋วยเตี๋ยวกับลุงต้น!') },
    ],
  },
  {
    id: 'heir_jay', age: 23, bg: 'office', title: 'ลุงเจโทรมา', cast: ['me'],
    when: (s) => has(s, 'h_jay'),
    because: (s) => `เพราะ${parentWord(s)}เคยส่งคุณไปฝึกงานกับลุงเจ`,
    lines: [{ text: 'ลุงเจส่งข้อความมา "บริษัทลุงเปิดรับคนพอดี ส่งเรซูเม่มาเลย ลุงไม่ลืมบุญคุณพ่อแม่เราหรอก"' }],
    choices: [
      { text: '💼 รับโอกาสนี้', fin: { cash: 60_000 }, effects: { social: 2, money: 1 }, memory: 'ได้งานแรกผ่านลุงเจ', result: R('งานแรกเงินดีกว่าเพื่อนรุ่นเดียวกัน... แต่ก็ต้องพิสูจน์ว่าไม่ใช่แค่เด็กเส้น') },
      { text: '🙅 ขอลองด้วยตัวเองก่อน', effects: { smart: 1, happy: 1 }, memory: 'ปฏิเสธเส้นสายลุงเจ ขอหางานเอง', result: R('ลุงเจหัวเราะ "เหมือนพ่อแม่เราเลย ดื้อแต่เท่"') },
    ],
  },
  {
    id: 'heir_habit', age: 26, bg: 'home', title: 'เหมือนใครนะ', cast: ['me'],
    when: (s) => (s.gen ?? 1) >= 2 && ['h_kind', 'h_greed', 'h_brave', 'h_smart', 'h_selfish', 'h_funny', 'h_endure', 'h_fragile'].some((f) => has(s, f)),
    because: (s) => `เพราะนิสัยนี้ติดมาจาก${parentWord(s)}`,
    lines: (s) => {
      const t = has(s, 'h_kind') ? 'ยกเงินเดือนครึ่งหนึ่งให้เพื่อนที่ลำบากโดยไม่ทันคิด'
        : has(s, 'h_greed') ? 'นั่งคิดแผนธุรกิจตอนตีสามจนนอนไม่หลับ'
          : has(s, 'h_brave') ? 'ลุกขึ้นเถียงหัวหน้ากลางที่ประชุม'
            : has(s, 'h_smart') ? 'ทำตารางเก็บเงินในเอ็กเซลละเอียดยิบ'
              : has(s, 'h_funny') ? 'เล่นมุกกลางงานศพจนญาติหัวเราะ'
                : has(s, 'h_endure') ? 'ทำงานต่อทั้งที่ไข้ขึ้น'
                  : has(s, 'h_fragile') ? 'แอบร้องไห้ในห้องน้ำหลังโดนติ'
                    : 'เลือกตัวเองก่อนทุกครั้ง'
      return [{ text: `วันนี้คุณ${t}... แล้วก็นึกขึ้นได้ว่า${parentWord(s)}${parentName(s)}ก็เคยทำแบบนี้เป๊ะ` }]
    },
    choices: [
      { text: '🪞 ยอมรับว่าเราเหมือนกัน', effects: { family: 2, happy: 1 }, memory: 'ยอมรับว่าตัวเองเหมือนพ่อแม่', result: R('เปิดอัลบั้มเก่าดูทั้งคืน... ยิ้มให้รูปพ่อแม่') },
      { text: '✂️ ขอเป็นตัวของตัวเอง', effects: { smart: 1, happy: 1 }, memory: 'ตั้งใจเขียนเรื่องของตัวเอง ไม่ซ้ำรอยพ่อแม่', result: R('นิสัยบางอย่างเลือกเกิดไม่ได้... แต่เลือกใช้ได้') },
    ],
  },
]

// ═════════ หลังตกงาน: ต้องหางานใหม่ก่อน ถึงจะมีเจ้านาย/ออฟฟิศอีก ═════════
export const JOBLESS: Scene[] = [36, 39, 43, 47, 52].map((age): Scene => ({
  id: `jobless_${age}`, age, bg: 'city', title: 'หลังวันที่ตกงาน', cast: ['me'],
  when: (s) => has(s, 'fired') && (s.flagAt?.fired ?? 0) < age,
  force: (s) => has(s, 'fired') && (s.flagAt?.fired ?? 0) < age,
  because: (s) => `เพราะคุณออกจากงานเดิมตอนอายุ ${s.flagAt?.fired ?? '?'}`,
  lines: (s) => [{ text: `ตื่นมาไม่ต้องรีบไปไหนมา${age - (s.flagAt?.fired ?? age - 1) > 1 ? 'หลายเดือน' : 'สักพัก'}แล้ว... รับจ้างรายวันพอประทังไปก่อน เงินเก็บเริ่มบางลงทุกที` }],
  choices: [
    { text: '📨 สมัครงานบริษัทใหม่', unflags: ['fired'], flags: ['new_job'], outcomes: [
      { chance: 0.7, effects: { happy: 2, social: 1 }, memory: 'ได้งานใหม่หลังตกงาน', result: R('สัมภาษณ์รอบที่สิบสอง... ได้แล้ว! หัวหน้าใหม่ใจดีกว่าคนเก่าเยอะ') },
      { chance: 0.3, effects: { happy: -1, money: -1 }, memory: 'ได้งานใหม่แต่เงินเดือนน้อยลง', result: R('ได้งานแล้ว แต่ต้องเริ่มตำแหน่งต่ำกว่าเดิม... ก็ยังดีกว่าไม่มี') },
    ] },
    { text: '🛵 ทำงานอิสระ เป็นนายตัวเอง', unflags: ['fired'], flags: ['own_boss'], effects: { happy: 2, money: -1, art: 1 }, memory: 'ตกงานแล้วเลือกเป็นนายตัวเอง', result: R('รับงานฟรีแลนซ์ ขายของออนไลน์ เหนื่อยกว่าเดิมแต่ไม่ต้องมีใครมาสั่งอีก') },
    { text: '🛋️ ขอพักใจอีกสักพัก', effects: { happy: 1, money: -1 }, memory: 'ตกงานแล้วขอพักใจก่อน', result: R('ใช้เวลาอยู่กับตัวเอง... ยังไม่พร้อมกลับไปสนามรบ') },
  ],
}))

// ═════════ ความสุขหมดถัง: ใจที่ไม่มีแรง (ไม่ปล่อยให้ความสุข 0 ผ่านไปเฉย ๆ) ═════════
const lastBlue = (s: GameState) => Math.max(-99, ...(s.visited ?? []).filter((id) => id.startsWith('blue_')).map((id) => Number(id.slice(5))))
export const BLUE: Scene[] = [20, 23, 27, 32, 37, 43, 49, 56, 63].map((age): Scene => ({
  id: `blue_${age}`, age, mood: 'sad', bg: 'home', title: '🌧️ ใจที่ไม่มีแรง', cast: ['me'],
  when: (s) => s.stats.happy <= 1 && age - lastBlue(s) >= 8,
  force: (s) => s.stats.happy <= 1 && age - lastBlue(s) >= 8,
  because: (s) => `เพราะ 😊 ความสุขของคุณเหลือแค่ ${s.stats.happy} มาระยะหนึ่งแล้ว`,
  lines: [{ who: 'me', expr: 'sad', text: 'หลายเดือนแล้วที่ตื่นมาไม่อยากลุกจากเตียง... ของที่เคยชอบก็ไม่สนุกอีกต่อไป กินไม่ลง นอนไม่หลับ' }],
  choices: [
    { text: '🩺 ไปพบจิตแพทย์', fin: { cash: -20_000 }, effects: { happy: 3, body: 1 }, memory: 'ยอมรับว่าป่วยซึมเศร้า และไปพบจิตแพทย์',
      result: R('หมอบอกว่า "ดีแล้วที่มา การป่วยไม่ใช่ความอ่อนแอ" ...เดือนที่สามเริ่มกลับมายิ้มได้') },
    { text: '📞 โทรหาคนที่ไว้ใจ', effects: { happy: 2, family: 1, friend: 1 }, memory: 'โทรระบายกับคนที่ไว้ใจตอนใจไม่ไหว',
      result: R('เสียงปลายสายไม่ได้แก้ปัญหาทุกอย่าง แต่ทำให้รู้ว่าไม่ได้อยู่คนเดียว') },
    { text: '😶 เก็บไว้คนเดียว', effects: { body: -2, social: -1, family: -1 }, memory: 'เก็บความเศร้าไว้คนเดียวจนร่างกายทรุด',
      result: R('ยิ้มให้ทุกคนตามปกติ... แต่น้ำหนักหายไปห้ากิโลโดยไม่มีใครรู้') },
  ],
}))

// ═════════ พ่อจากไป (เวลาตามตารางชีพ UN — ดู parentGoneAt) ═════════
export const DAD_PASS: Scene = {
  id: 'dad_pass', mood: 'sad', age: 50, bg: 'hospital', title: 'ลาก่อนพ่อ', cast: ['dad', 'me'],
  lines: (s) => s.stats.family >= 5
    ? [{ who: 'dad', expr: 'happy', text: 'พ่อไม่เคยพูดเลยใช่ไหม... ว่าพ่อภูมิใจในตัว{name}ที่สุด' }]
    : [{ who: 'dad', expr: 'sad', text: 'มาแล้วเหรอลูก... พ่อนึกว่าจะไม่ทันได้เจอกันแล้ว' }],
  choices: [
    { text: '🤝 จับมือพ่อ "ขอบคุณที่ทำงานหนักเพื่อเรา"', effects: { family: 2, happy: 1 }, memory: 'ได้ขอบคุณพ่อก่อนพ่อจากไป', result: R('พ่อยิ้มมุมปากแบบที่ชอบทำ... แล้วหลับไปอย่างสงบ') },
    { text: '😭 "ขอโทษที่เคยทะเลาะกับพ่อ"', effects: { family: 3, happy: -1 }, memory: 'ขอโทษพ่อในวันสุดท้าย', result: R('"พ่อไม่เคยโกรธลูกจริง ๆ หรอก" มือหยาบ ๆ ลูบหัวเหมือนตอนเด็ก') },
    { text: '🙏 นั่งเงียบ ๆ ข้างเตียง', effects: { family: 1 }, memory: 'นั่งข้างเตียงพ่อจนวินาทีสุดท้าย', result: R('เสียงเครื่องวัดหัวใจค่อย ๆ ยาวขึ้น... ห้องเงียบลง') },
  ],
}
