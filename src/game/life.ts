import { fmtBaht, married, netWorth } from './finance'
import type { GameState, Scene } from './types'

const has = (s: GameState, f: string) => s.flags.includes(f)

/**
 * ฉากเรื่องเงิน + ความสัมพันธ์ที่ทำให้ชีวิตพังได้
 * (รวมกับฉากอื่นแล้วเรียงตามอายุอัตโนมัติ)
 */
export const LIFE: Scene[] = [
  // ───────── เงิน ─────────
  {
    id: 'firstpay', age: 23, bg: 'office', title: 'เงินเดือนแรก',
    when: (s) => !!s.career,
    cast: ['me'],
    lines: [{ who: 'me', expr: 'happy', text: 'เงินเดือนแรกเข้าบัญชีแล้ว! จะจัดการยังไงดี?' }],
    choices: [
      { text: '🐷 ออมก่อนใช้ 30%', flags: ['saver'], effects: { happy: -1, smart: 1 }, memory: 'ออมเงินตั้งแต่เงินเดือนแรก', result: [{ text: 'ชีวิตเรียบง่าย แต่เงินเก็บโตขึ้นทุกเดือน' }] },
      { text: '🛍️ ใช้ให้สุด เดี๋ยวก็มีใหม่', flags: ['spender'], effects: { happy: 2, social: 1 }, memory: 'ใช้เงินเดือนหมดทุกเดือน', result: [{ text: 'ชีวิตดี๊ดี... แต่สิ้นเดือนกินมาม่าทุกครั้ง' }] },
      { text: '🚗 ผ่อนรถป้ายแดง', flags: ['car'], fin: { debt: 750_000 }, effects: { happy: 2, social: 1 }, memory: 'ผ่อนรถคันแรก', result: [{ text: 'รถสวยมาก! ค่างวดเดือนละหมื่นห้า...' }] },
      { text: '🛡️ ทำประกัน + ลงทุนกองทุน', flags: ['insured'], fin: { cash: -60_000, stock: 60_000 }, effects: { smart: 1 }, memory: 'ทำประกันสุขภาพและเริ่มลงทุน', result: [{ text: 'ไม่สนุกตอนนี้ แต่ตัวเองในอนาคตจะขอบคุณ' }] },
    ],
  },
  {
    id: 'parents', age: 25, bg: 'home', title: 'แม่ขอความช่วยเหลือ',
    cast: ['mom', 'me'],
    lines: [{ who: 'mom', expr: 'sad', text: 'ช่วงนี้ค่าใช้จ่ายบ้านเยอะ... ลูกพอช่วยแม่ได้ไหม' }],
    choices: [
      { text: '💝 ส่งให้ทุกเดือน', flags: ['support'], effects: { family: 3, happy: 1 }, memory: 'ส่งเงินให้พ่อแม่ทุกเดือน', result: [{ who: 'mom', expr: 'happy', text: 'ขอบใจนะลูก แม่ภูมิใจมาก' }] },
      { text: '🤏 ช่วยบ้างตามไหว', fin: { cash: -30_000 }, effects: { family: 1 }, memory: 'ช่วยเงินพ่อแม่บ้างเป็นครั้งคราว', result: [{ who: 'mom', text: 'แค่นี้แม่ก็ดีใจแล้ว' }] },
      { text: '🙅 ตัวเองยังไม่พอเลย', effects: { family: -3 }, memory: 'ปฏิเสธช่วยเงินแม่', result: [{ who: 'mom', expr: 'sad', text: 'อืม... ไม่เป็นไรลูก' }] },
    ],
  },
  {
    id: 'house', age: 31, bg: 'city', title: 'บ้านหลังแรก',
    cast: (s) => (married(s) ? ['me', 'fah'] : ['me']),
    lines: [{ text: 'คอนโดใหม่ใกล้รถไฟฟ้า ราคา 3.5 ล้าน ผ่อน 30 ปี' }],
    choices: [
      { text: '🏠 กู้ซื้อเลย!', flags: ['home'], fin: { debt: 3_200_000, invest: 3_500_000, cash: -300_000 }, effects: { happy: 2 }, memory: 'กู้ซื้อคอนโดหลังแรก', result: [{ text: 'ได้กุญแจห้องแรกในชีวิต! หนี้ 30 ปีก็มาพร้อมกัน' }],
        lock: (s) => s.cash < 300_000 && 'ต้องมีเงินดาวน์ ฿300K' },
      { text: '🏢 เช่าต่อไป ยืดหยุ่นกว่า', effects: { happy: 1 }, fin: { stock: 100_000, cash: -100_000 }, memory: 'เลือกเช่าบ้านแล้วเอาเงินไปลงทุน', result: [{ text: 'ไม่มีหนี้ก้อนโต เอาเงินไปลงทุนแทน' }] },
      { text: '👪 กลับไปอยู่กับพ่อแม่', effects: { family: 2, happy: -1 }, fin: { cash: 150_000 }, memory: 'กลับไปอยู่บ้านพ่อแม่เก็บเงิน', result: [{ text: 'ประหยัดได้เยอะ แต่แม่ยังถามทุกคืนว่ากลับกี่โมง' }] },
    ],
  },
  {
    id: 'crypto', age: 44, bg: 'office', title: 'เหรียญมหัศจรรย์', chance: 0.7,
    cast: ['me'],
    lines: [{ text: 'ทุกคนในออฟฟิศพูดถึงเหรียญคริปโตตัวใหม่ "ขึ้นมา 50 เท่าแล้ว!"' }],
    choices: [
      { text: '🙈 ไม่ยุ่ง', effects: { smart: 1 }, memory: 'ไม่ตามกระแสคริปโต' },
      { text: '🪙 ลงนิดหน่อยพอ', fin: { cash: -50_000 }, outcomes: [
        { chance: 0.4, fin: { cash: 200_000 }, memory: 'ได้กำไรคริปโตนิดหน่อย', result: [{ text: 'ได้กำไรสี่เท่า! ขายทันที' }] },
        { chance: 0.6, memory: 'ขาดทุนคริปโตนิดหน่อย', result: [{ text: 'เหรียญร่วงเหลือศูนย์... โชคดีที่ลงไม่เยอะ' }] },
      ] },
      { text: '🎰 ทุ่มหมดตัว + กู้เพิ่ม', hint: 'เสี่ยงมาก', outcomes: [
        // ทุ่มทั้งเงินที่มี + เงินกู้ → กำไรก้อนใหญ่จากเงินกู้ด้วย (ไม่ใช่แค่คูณเงินสดที่อาจเหลือศูนย์)
        { chance: 0.2, fin: { cashMul: 6, investMul: 3, cash: 3_000_000 }, effects: { happy: 3 }, flags: ['crypto_rich'], memory: 'รวยจากคริปโตชั่วข้ามคืน',
          result: (s) => [{ text: '🚀 ขึ้นอีกร้อยเท่า! ขายทิ้งทั้งหมด ใช้หนี้ที่กู้มาเล่นแล้วยังเหลือเพียบ' }, { text: `💰 ตอนนี้มีเงินสด ${fmtBaht(s.cash)} · เงินลงทุน ${fmtBaht(s.invest)}${s.debt > 0 ? ` · หนี้ ${fmtBaht(s.debt)}` : ''}` }] },
        { chance: 0.8, fin: { cashMul: 0, investMul: 0.3, debt: 1_500_000 }, effects: { happy: -4, family: -2 }, flags: ['debt'], memory: 'คริปโตล่ม หมดตัวและติดหนี้', result: [{ text: '📉 เหรียญล่มในคืนเดียว... หมดตัวแถมติดหนี้ล้านครึ่ง' }] },
      ] },
    ],
  },
  {
    id: 'debtcrisis', age: 46, bg: 'home', title: 'จดหมายจากศาล',
    when: (s) => s.debt > 1_000_000 && s.debt > s.cash + s.invest + 500_000,
    cast: ['me'],
    lines: [{ text: '"หมายศาล: ท่านค้างชำระหนี้ ต้องชำระภายใน 30 วัน มิฉะนั้นจะถูกยึดทรัพย์"' }],
    choices: [
      { text: '🏠 ขายทุกอย่างใช้หนี้', fin: { investMul: 0, debt: -1_000_000 }, effects: { happy: -2 }, memory: 'ขายทรัพย์สินทั้งหมดใช้หนี้', result: [{ text: 'เหลือแต่ตัว แต่ได้นอนหลับสนิทอีกครั้ง' }],
        lock: (s) => s.invest < 300_000 && 'ไม่มีทรัพย์สินพอขาย' },
      { text: '🙏 ขอให้ครอบครัวช่วย', fin: { debt: -800_000 }, effects: { family: -2, happy: 1 }, memory: 'ครอบครัวช่วยใช้หนี้ก้อนโต', result: [{ who: 'mom', expr: 'sad', text: 'แม่เอาเงินเก็บทั้งชีวิตมาให้... ครั้งเดียวนะลูก' }],
        lock: (s) => s.stats.family < 6 && 'ความสัมพันธ์กับครอบครัวไม่ดีพอ' },
      { text: '⚖️ ยื่นล้มละลาย', end: 'bankrupt', memory: 'ถูกพิพากษาให้ล้มละลาย', result: [{ text: 'ทรัพย์สินทุกอย่างถูกยึด ชื่อติดแบล็กลิสต์ไปอีกหลายปี' }] },
    ],
  },
  {
    id: 'callcenter', age: 66, bg: 'garden', title: 'สายด่วนจาก "ตำรวจ"', chance: 0.6, timer: 8,
    cast: ['me'],
    lines: [{ text: '📞 "ผมตำรวจนะครับ บัญชีของท่านพัวพันการฟอกเงิน ต้องโอนเงินมาตรวจสอบด่วน!"' }],
    choices: [
      { text: '💸 รีบโอนตามที่บอก', onTimeout: true, fin: { cashMul: 0.15 }, effects: { happy: -3 }, memory: 'ถูกแก๊งคอลเซ็นเตอร์หลอกเงินเกือบหมด', result: [{ text: 'วางสายแล้วถึงรู้ตัว... เงินเก็บทั้งชีวิตหายไป' }] },
      { text: '📵 วางสายทันที', effects: { smart: 1 }, memory: 'ไม่หลงกลแก๊งคอลเซ็นเตอร์', result: [{ text: 'แก๊งคอลเซ็นเตอร์อีกแล้ว! บล็อกเบอร์ซะ' }] },
      { text: '📞 โทรถามลูกหลานก่อน', effects: { family: 1 }, memory: 'โทรปรึกษาลูกหลานจนรอดจากมิจฉาชีพ', result: [{ text: '"นั่นมิจฉาชีพนะ! ดีแล้วที่โทรมาถาม"' }] },
    ],
  },

  // ───────── ความสัมพันธ์ที่ทำให้ชีวิตพังได้ ─────────
  {
    id: 'guarantor', age: 33, bg: 'park', title: 'ลายเซ็นเดียว',
    when: (s) => !has(s, 'ignored_ton') && s.stats.friend >= 2,
    cast: ['ton', 'me'],
    lines: [{ who: 'ton', text: 'เพื่อน... ช่วยค้ำประกันเงินกู้ให้เราหน่อย 2 ล้าน ขยายร้าน รับรองไม่มีปัญหา!' }],
    choices: [
      { text: '✍️ เซ็นค้ำให้', outcomes: [
        { chance: 0.5, effects: { friend: 2, happy: 1 }, memory: 'ค้ำประกันให้ต้น ต้นผ่อนครบ', result: [{ who: 'ton', expr: 'happy', text: 'ร้านไปได้สวย! ผ่อนหมดแล้วนะเพื่อน ขอบใจมาก' }] },
        { chance: 0.5, fin: { debt: 2_000_000 }, effects: { friend: -10, happy: -4 }, flags: ['betrayed', 'debt'], memory: 'ต้นหนีหนี้ ต้องใช้หนี้แทน 2 ล้าน', result: [{ text: 'ต้นหายตัวไป... จดหมายทวงหนี้ 2 ล้านส่งมาที่บ้าน {name} แทน' }] },
      ] },
      { text: '💵 ให้ยืมเงินตัวเองแทน', fin: { cash: -200_000 }, outcomes: [
        { chance: 0.6, fin: { cash: 220_000 }, effects: { friend: 2 }, memory: 'ต้นคืนเงินพร้อมดอกเบี้ย', result: [{ who: 'ton', expr: 'happy', text: 'คืนครบแถมดอกเบี้ย! ไว้ใจได้เสมอ' }] },
        { chance: 0.4, effects: { friend: -2, happy: -1 }, memory: 'ให้ต้นยืมเงินแล้วไม่ได้คืน', result: [{ text: 'สองแสนนั้น... ไม่เคยได้คืน' }] },
      ] },
      { text: '🙅 เรื่องเงิน ขอไม่ยุ่ง', effects: { friend: -2 }, memory: 'ปฏิเสธค้ำประกันให้ต้น', result: [{ who: 'ton', expr: 'sad', text: 'ไม่เป็นไร... เข้าใจ' }] },
    ],
  },
  {
    id: 'blame', age: 35, bg: 'office', title: 'แพะรับบาป',
    when: (s) => ['office', 'dev', 'teacher', 'doctor'].includes(s.career ?? ''),
    cast: ['boss', 'me'],
    lines: [{ who: 'boss', expr: 'angry', text: 'โปรเจกต์พังเพราะคุณ! (ทั้งที่หัวหน้าสั่งเอง)' }],
    choices: [
      { text: '😤 เถียงกลับต่อหน้าทุกคน', outcomes: [
        { chance: 0.45, flags: ['promoted'], effects: { social: 2, happy: 2 }, memory: 'สู้หัวหน้าจนได้ความยุติธรรม', result: [{ text: 'ผู้บริหารเห็นหลักฐาน หัวหน้าโดนย้าย {name} ได้ตำแหน่งแทน!' }] },
        { chance: 0.55, fin: { cash: -250_000 }, flags: ['fired'], effects: { happy: -3 }, memory: 'โดนไล่ออกเพราะเถียงหัวหน้า', result: [{ text: 'โดนเชิญออกภายในวันนั้น... ตกงานหลายเดือน' }] },
      ] },
      { text: '😶 ก้มหน้ายอมรับ', effects: { happy: -2 }, memory: 'ยอมเป็นแพะให้หัวหน้า', result: [{ text: 'งานยังอยู่ แต่ไฟในใจดับลงไปนิดหนึ่ง' }] },
      { text: '📁 เก็บหลักฐานส่ง HR', effects: { smart: 1 }, outcomes: [
        { chance: 0.7, effects: { happy: 2 }, memory: 'ร้องเรียน HR สำเร็จ', result: [{ text: 'HR ตรวจสอบแล้ว หัวหน้าถูกตักเตือน' }] },
        { chance: 0.3, effects: { happy: -2, social: -1 }, memory: 'ร้องเรียน HR แล้วโดนกลั่นแกล้ง', result: [{ text: 'HR เข้าข้างหัวหน้า... บรรยากาศที่ทำงานแย่ลงทุกวัน' }] },
      ] },
    ],
  },
  {
    id: 'temptation', age: 36, bg: 'city', title: 'ข้อความกลางดึก', chance: 0.5,
    when: (s) => married(s),
    cast: ['me'],
    lines: [{ text: '💬 เพื่อนร่วมงานคนใหม่ทักมาตอนเที่ยงคืน "ยังไม่นอนเหรอ? คุยด้วยหน่อยสิ"' }],
    choices: [
      { text: '🚫 ตัดบทชัดเจน', effects: { love: 2 }, memory: 'ปฏิเสธคนที่เข้ามาตอนแต่งงานแล้ว', result: [{ text: 'วางมือถือ แล้วหันไปกอด{fah}' }] },
      { text: '😏 แค่คุยเล่นนิดหน่อย', outcomes: [
        { chance: 0.6, effects: { love: -1 }, memory: 'แอบคุยกับคนอื่นแต่ไม่มีใครรู้', result: [{ text: 'ไม่มีใครรู้... ครั้งนี้' }] },
        { chance: 0.4, effects: { love: -5, happy: -2 }, flags: ['cheated'], memory: '{fah}เจอแชทกับคนอื่น', result: [{ who: 'fah', expr: 'angry', text: 'นี่มันอะไรกัน!? {name} อธิบายมาเดี๋ยวนี้!' }] },
      ] },
      { text: '🔥 ไปต่อ', effects: { love: -6, happy: 1 }, flags: ['cheated'], memory: 'นอกใจ{fah}', result: [{ text: 'ความลับไม่มีในโลก...' }] },
    ],
  },
  {
    id: 'divorce', age: 40, bg: 'home', title: 'บ้านที่เงียบเกินไป',
    when: (s) => married(s) && (s.stats.love <= 3 || has(s, 'cheated') || (has(s, 'workaholic') && s.stats.love <= 6)),
    cast: ['fah', 'me'],
    lines: [{ who: 'fah', expr: 'sad', text: 'เราไม่ได้คุยกันจริง ๆ มานานแค่ไหนแล้ว... เราหย่ากันเถอะ' }],
    choices: [
      { text: '💔 ตกลง แยกทางกัน', flags: ['divorced'], fin: { cashMul: 0.5, investMul: 0.5 }, effects: { happy: -4, love: -5 }, memory: 'หย่ากับ{fah} แบ่งทรัพย์สินครึ่งหนึ่ง', result: [{ text: 'เซ็นใบหย่า แบ่งทุกอย่างคนละครึ่ง... รวมถึงความทรงจำ' }] },
      { text: '🙏 ขอโอกาสอีกครั้ง', outcomes: [
        { chance: 0.5, effects: { love: 4, happy: 2 }, memory: 'ขอโอกาส{fah}จนกลับมาดีกัน', result: [{ who: 'fah', text: 'ครั้งสุดท้ายนะ...' }] },
        { chance: 0.5, flags: ['divorced'], fin: { cashMul: 0.5, investMul: 0.5 }, effects: { happy: -5, love: -5 }, memory: 'ขอโอกาสแล้วแต่{fah}ไม่ให้', result: [{ who: 'fah', expr: 'sad', text: 'สายไปแล้ว... ลาก่อน' }] },
      ] },
      { text: '🛋️ ไปหาจิตแพทย์คู่รัก', fin: { cash: -60_000 }, lock: (s) => s.cash < 60_000 && 'ต้องมีเงิน ฿60K', effects: { love: 3, happy: 1 }, memory: 'ไปบำบัดคู่รักจนเข้าใจกันมากขึ้น', result: [{ text: 'ได้ฟังกันจริง ๆ เป็นครั้งแรกในรอบหลายปี' }] },
    ],
  },
  {
    id: 'lonely', age: 52, bg: 'home', title: 'วันเกิดที่ไม่มีใครโทรมา',
    when: (s) => s.stats.family <= 2 && s.stats.friend <= 2 && !married(s),
    cast: ['me'],
    lines: [{ who: 'me', expr: 'sad', text: 'วันเกิดปีนี้... มือถือเงียบทั้งวัน' }],
    choices: [
      { text: '📞 โทรหาแม่ก่อน', effects: { family: 3, happy: 2 }, memory: 'กลับไปง้อครอบครัวตอนอายุ 52', result: [{ who: 'mom', expr: 'happy', text: 'ลูก! แม่คิดถึงมากเลย' }] },
      { text: '🧑‍🤝‍🧑 สมัครชมรมอาสา', effects: { social: 2, friend: 2, happy: 2 }, memory: 'หาเพื่อนใหม่ในชมรมอาสา', result: [{ text: 'ได้เพื่อนวัยเดียวกันกลุ่มใหม่' }] },
      { text: '🍺 ดื่มคนเดียว', effects: { body: -2, happy: -2 }, memory: 'จมอยู่กับความเหงา', result: [{ text: 'แก้วแล้วแก้วเล่า... ความเงียบยังดังเหมือนเดิม' }] },
    ],
  },
  {
    id: 'rich_family', age: 62, bg: 'garden', title: 'ญาติที่เพิ่งจำได้',
    when: (s) => netWorth(s) > 8_000_000,
    cast: ['me'],
    lines: [{ text: 'ญาติที่ไม่เคยติดต่อมา 20 ปี มาหาพร้อมของฝาก "ช่วยลงทุนธุรกิจหน่อยสิ"' }],
    choices: [
      { text: '💰 ช่วยลงทุนให้', fin: { cash: -1_500_000 }, outcomes: [
        { chance: 0.3, fin: { cash: 2_500_000 }, effects: { family: 2 }, memory: 'ลงทุนกับญาติแล้วได้กำไร', result: [{ text: 'ธุรกิจรุ่ง! ญาติแบ่งกำไรให้อย่างดี' }] },
        { chance: 0.7, effects: { happy: -2, family: -1 }, memory: 'ญาติเชิดเงินหนี', result: [{ text: 'เงินล้านครึ่งหายไปพร้อมญาติ...' }] },
      ] },
      { text: '🙂 ปฏิเสธอย่างสุภาพ', effects: { family: -1 }, memory: 'ปฏิเสธญาติที่มาขอเงิน' },
    ],
  },
]

