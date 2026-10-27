// สร้างสคริปต์พากย์จากเนื้อเรื่องทั้งหมด: npx tsx scripts/voice-script.ts <outdir>
// - เขียน src/game/voiceIds.json (ข้อความ → ชื่อไฟล์) ให้เกมรู้ว่าบทไหนใช้ไฟล์เสียงอะไร
// - เขียน voice-script.csv และ voice-script.md ไว้ส่งให้นักพากย์ / โปรแกรม TTS
// - เขียน voice-template.csv (file,prio,who,voice,prompt,age,mood,gender,text) เฉพาะบทที่ยังไม่มีไฟล์เสียง
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { newGame, resolveLines, SCENES } from '../src/game/engine'
import type { GameState, Line, Lines } from '../src/game/types'

const out = process.argv[2] || '.'
// (คัดลอกจาก src/art/Character.tsx เพราะไฟล์นั้นใช้ import.meta.glob ซึ่งรันนอก Vite ไม่ได้)
const NAMES: Record<string, string> = { me: '', mom: 'แม่', dad: 'พ่อ', yai: 'ยาย', ton: 'ต้น', kru: 'ครูสมศรี', fah: 'ฟ้า', boss: 'หัวหน้า', kid: 'หลานน้ำ', nong: 'น้องฝน', jay: 'เจ', coco: 'โกโก้' }
const charAge = (id: string, a: number) => ({ mom: a + 27, dad: a + 29, yai: a + 58, kru: 34, boss: 52, kid: 7, nong: Math.max(0, a - 6), coco: 3 } as Record<string, number>)[id] ?? a

// สถานะตัวอย่างหลายแบบ เพื่อดึงบทพูดทุกเวอร์ชัน
const base = newGame('{name}', 'girl', '#000')
const variants: GameState[] = [
  base,
  { ...base, gender: 'boy' },
  { ...base, flags: ['ignored_ton', 'path_work', 'partner', 'kid'], stats: { ...base.stats, love: 5, friend: 0 } },
  { ...base, flags: ['helped_ton', 'partner'], stats: { ...base.stats, friend: 8, love: 0, smart: 9, art: 7 } },
  { ...base, flags: ['partner'], stats: { ...base.stats, friend: 3 } },
  { ...base, flags: ['met_nong', 'nong_kind', 'saved_ton', 'kru_tree', 'coco'], flagAt: { nong_kind: 6, saved_ton: 9, kru_tree: 8 }, bonds: { nong: 8, jay: 7, coco: 8 }, stats: { ...base.stats, friend: 6, social: 8 } },
  { ...base, flags: ['met_nong', 'nong_hurt', 'olympiad', 'hush'], flagAt: { nong_hurt: 6, olympiad: 16 }, bonds: { nong: 1, jay: 2 }, debt: 2_000_000 },
]

const EXPR: Record<string, string> = { happy: 'ดีใจ', sad: 'เศร้า', surprised: 'ตกใจ', angry: 'โกรธ', neutral: 'ปกติ' }
type Row = { prio: number; id: string; scene: string; age: number; key: string; voiceAgeN: number; raw: string; who: string; voiceAge: string; mood: string; text: string; note: string }
const rows: Row[] = []
const map: Record<string, string> = {}
// บทเดิมใช้ชื่อไฟล์เดิมต่อ เพื่อไม่ให้ไฟล์เสียงที่อัดไว้แล้วหลุด
const OLD: Record<string, string> = existsSync('src/game/voiceIds.json') ? JSON.parse(readFileSync('src/game/voiceIds.json', 'utf8')) : {}
const oldIds = new Set(Object.values(OLD))

function add(id: string, sceneId: string, sceneAge: number, l: Line) {
  if (map[l.text]) return
  id = OLD[l.text] ?? (oldIds.has(id) ? `${id}_x` : id)
  map[l.text] = id
  const who = l.who ? (l.who === 'me' ? 'ตัวเอก' : NAMES[l.who]) : 'ผู้บรรยาย'
  const a = l.who ? charAge(l.who, sceneAge) : 0
  const voiceAge = !l.who ? '-' : a < 3 ? 'ทารก' : a < 13 ? `เด็ก ${a} ขวบ` : a < 19 ? `วัยรุ่น ${a}` : a < 60 ? `ผู้ใหญ่ ${a}` : `คนแก่ ${a}`
  const notes: string[] = []
  if (l.text.includes('{name}')) notes.push('มีชื่อผู้เล่น: อ่านข้ามชื่อ หรือใช้คำว่า "ลูก / เพื่อน / เธอ" แทน')
  if (/\{krub\}|\{chan\}/.test(l.text)) notes.push('ขึ้นกับเพศผู้เล่น: อัด 2 แบบ (ผม/ครับ และ หนู/ค่ะ) ต่อท้ายไฟล์ _m และ _f')
  if (l.who === 'me' || l.who === 'fah') notes.push('มีทั้งเสียงหญิงและชาย: อัด 2 แบบ ต่อท้าย _m และ _f')
  rows.push({ prio: /_c\d|_m\d/.test(id) ? 2 : 1, id, scene: sceneId, age: sceneAge, key: l.who ?? '', voiceAgeN: a, raw: l.text, who, voiceAge, mood: EXPR[l.expr ?? 'neutral'], text: l.text.replace(/\(.*?\)/g, '').trim(), note: notes.join(' · ') })
}
function collect(prefix: string, sceneId: string, age: number, ls: Lines | undefined) {
  if (!ls) return
  const seen = new Set<string>()
  const all = typeof ls === 'function' ? variants.flatMap((v) => { try { return resolveLines(ls, v) } catch { return [] } }) : ls
  all.forEach((l) => {
    if (seen.has(l.text)) return
    seen.add(l.text)
    add(`${prefix}${seen.size > 1 || typeof ls === 'function' ? `_${seen.size}` : ''}`, sceneId, age, l)
  })
}

for (const sc of SCENES) {
  collect(sc.id, sc.id, sc.age, sc.lines)
  sc.choices?.forEach((c, ci) => {
    collect(`${sc.id}_c${ci + 1}`, sc.id, sc.age, c.result)
    c.outcomes?.forEach((o, oi) => collect(`${sc.id}_c${ci + 1}o${oi + 1}`, sc.id, sc.age, o.result))
  })
  if (sc.reward) [0.9, 0.6, 0.2].forEach((p, i) => {
    const t = sc.reward!(p).text.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
    add(`${sc.id}_m${i + 1}`, sc.id, sc.age, { text: t })
  })
}

// บทเดิมที่สถานะตัวอย่างข้างบนไม่ได้สร้าง (เช่น ข้อความที่ขึ้นกับอาชีพ) ต้องอยู่ต่อ ไม่งั้นไฟล์เสียงที่อัดไว้แล้วจะหลุด
for (const [k, v] of Object.entries(OLD)) if (!map[k]) map[k] = v
writeFileSync('src/game/voiceIds.json', JSON.stringify(map, null, 0))

/**
 * บทย้อนอดีตที่มีอายุในประโยค: สถานะตัวอย่างไม่มีอายุจริง จึงได้ "undefined" / "0 ปี" → ให้เสียงพูดคำกลาง ๆ แทนตัวเลข
 * (เกมจับคู่บทเหล่านี้ด้วยตัวเลขอะไรก็ได้ ดู AGED ใน src/lib/voice.ts)
 */
const spoken = (t: string) => t
  .replace(/ตั้งแต่อายุ undefined/g, 'ตั้งแต่ยังหนุ่มสาว')
  .replace(/เมื่ออายุ undefined/g, 'เมื่อหลายปีก่อน')
  .replace(/ตอน(?:เรา|เธอ|พี่|นาย|ฉัน|หนู)?อายุ undefined/g, 'ตอนนั้น')
  .replace(/เมื่อ 0 ปีก่อน/g, 'เมื่อหลายปีก่อน')
  .replace(/ครบ 0 ปีที่/g, 'ครบรอบวันที่')
  .replace(/อายุ undefined/g, 'ตอนนั้น')

// บทที่ยังไม่มีไฟล์เสียง → ใส่ลงหน้า voice-studio.html (สร้างเสียงด้วย Gemini TTS)
const have = new Set(readdirSync('src/assets/voice').map((f) => f.replace(/\.\w+$/, '')))
const todo = rows.flatMap((r) => {
  if (have.has(r.id)) return []
  const split = r.key === 'me' || r.key === 'fah' || /\{krub\}|\{chan\}/.test(r.raw)
  return (split ? (['m', 'f'] as const) : ([''] as const)).filter((g) => !have.has(g ? `${r.id}_${g}` : r.id)).map((g) => {
    // ไฟล์ _m = ผู้เล่นชาย ยกเว้นบทของฟ้า (_m = ฟ้าเป็นผู้ชาย = ผู้เล่นหญิง) ดู speak() ใน src/lib/voice.ts
    const boy = r.key === 'fah' ? g === 'f' : g !== 'f'
    const text = spoken(r.raw).replace(/\(.*?\)/g, '').replaceAll('{name}', '').replaceAll('{fah}', 'แฟน')
      .replaceAll('{krub}', boy ? 'ครับ' : 'ค่ะ').replaceAll('{chan}', boy ? 'ผม' : 'หนู')
      .replace(/""|“”/g, '').replace(/\s+([!?.,…])/g, '$1').replace(/\s{2,}/g, ' ').trim()
    return { file: g ? `${r.id}_${g}` : r.id, id: r.id, prio: r.prio, who: r.key, whoName: r.who, age: r.voiceAgeN, voice: g || 'm', mood: r.mood, text }
  })
})
writeFileSync(`${out}/voice-studio.html`, readFileSync('scripts/voice-studio.html', 'utf8').replace('/*TODO*/[]', JSON.stringify(todo)))
console.log('voice-studio:', todo.length, 'files to generate')
const esc = (s: string) => `"${s.replace(/"/g, '""')}"`

// ── voice-template.csv: แบบฟอร์มเดียวกับ lifepath_voice_template.csv (เสียง Gemini ตามตาราง DEFAULT_VOICES ใน voice-studio.html) ──
const VOICES = Object.fromEntries([...readFileSync('scripts/voice-studio.html', 'utf8').matchAll(/^\s+(\w+): \['(\w+)', '([^']*)'\],?$/gm)].map((m) => [m[1], { name: m[2], style: m[3] }]))
const voiceKey = (who: string, a: number, g: string) => {
  const life = a < 3 ? 'baby' : a < 13 ? 'kid' : a < 19 ? 'teen' : a < 60 ? 'adult' : 'old'
  const k = who === '' ? 'narr' : who === 'me' ? `me_${life}_${g}` : who === 'fah' ? `fah_${g}`
    : ['ton', 'nong', 'jay'].includes(who) ? `${who}_${(who === 'nong' ? a < 13 : a < 19) ? 'kid' : 'adult'}` : who
  return VOICES[k] ? k : 'narr'
}
const MOOD_TH: Record<string, string> = { 'ดีใจ': 'ดีใจ ตื่นเต้น', 'เศร้า': 'เศร้า เสียงสั่นเล็กน้อย', 'ตกใจ': 'ตกใจ', 'โกรธ': 'โกรธ ไม่พอใจ', 'ปกติ': 'เป็นธรรมชาติ' }
/** ตัดบรรทัดตามจังหวะหายใจ: หลัง "..." "?" "!" (ถ้าประโยคยาว) */
const breath = (t: string) => (t.length > 60 ? t.replace(/(\.\.\.|[?!])\s+/g, '$1\n') : t)
const tpl = todo.map((j) => {
  const k = voiceKey(j.who, j.age, j.voice)
  const v = VOICES[k]
  const gender = k === 'narr' || /หญิง|คุณแม่|คุณยาย|ครูผู้หญิง/.test(v.style) ? 'female' : /ชาย|คุณพ่อ|หัวหน้า/.test(v.style) ? 'male' : j.voice === 'f' ? 'female' : 'male'
  const who = j.who === '' ? 'ผู้บรรยาย' : j.who === 'me' ? `ตัวเอก${j.voice === 'f' ? 'หญิง' : 'ชาย'}` : j.whoName
  return [j.file, j.prio, who, v.name, breath(j.text), j.who === '' ? 40 : j.age, MOOD_TH[j.mood] ?? 'เป็นธรรมชาติ', gender, j.text]
}).sort((a, b) => Number(a[1]) - Number(b[1]))
writeFileSync(`${out}/voice-template.csv`, '﻿' + [['file', 'prio', 'who', 'voice', 'prompt', 'age', 'mood', 'gender', 'text'], ...tpl].map((r) => r.map((x) => esc(String(x))).join(',')).join('\n'))
console.log('voice-template:', tpl.length, 'lines')
writeFileSync(`${out}/voice-script.csv`, '﻿' + ['ลำดับ,ไฟล์,ฉาก,อายุตัวเอก,ตัวละคร,วัยของเสียง,อารมณ์,บทพูด,หมายเหตุ',
  ...rows.map((r) => [r.prio === 1 ? 'ทำก่อน' : 'ทีหลัง', r.id + '.mp3', r.scene, r.age, r.who, r.voiceAge, r.mood, r.text, r.note].map((x) => esc(String(x))).join(','))].join('\n'))

// แบบอ่านง่าย: ทำก่อน (บทเปิดฉาก) → ทีหลัง (บทผลลัพธ์) แล้วแยกตามตัวละคร
const order = ['ตัวเอก', 'แม่', 'พ่อ', 'ยาย', 'ต้น', 'ฟ้า', 'น้องฝน', 'เจ', 'โกโก้', 'ครูสมศรี', 'หัวหน้า', 'หลานน้ำ', 'ผู้บรรยาย']
const p1 = rows.filter((r) => r.prio === 1).length
let md = `# สคริปต์พากย์ — เส้นทางชีวิต\n\nทั้งหมด ${rows.length} ประโยค (ทำก่อน ${p1} · ทีหลัง ${rows.length - p1})\n\n`
md += `**วิธีใช้**\n- ตั้งชื่อไฟล์ตามคอลัมน์ "ไฟล์" เป็น .mp3 เช่น \`bully.mp3\` แล้วส่งกลับมา\n- บทของ **ตัวเอก** และ **ฟ้า** อัด 2 เสียง ต่อท้ายชื่อไฟล์ \`_m\` (ชาย) และ \`_f\` (หญิง) เช่น \`viral_m.mp3\`, \`viral_f.mp3\`\n- \`{name}\` คือชื่อผู้เล่น ให้อ่านข้ามหรือใช้คำว่า ลูก / เพื่อน / เธอ แทน\n- บทไหนยังไม่มีไฟล์ เกมจะใช้เสียงอ่านอัตโนมัติแทน ทยอยทำได้\n\n`
for (const [prio, title] of [[1, '🎬 ทำก่อน — บทเปิดฉาก (ได้ยินทุกรอบ)'], [2, '🎞️ ทีหลัง — บทหลังเลือก']] as const) {
  md += `# ${title}\n\n`
  for (const who of order) {
    const rs = rows.filter((r) => r.prio === prio && r.who === who)
    if (!rs.length) continue
    md += `## ${who} (${rs.length})\n\n| ไฟล์ | วัยเสียง | อารมณ์ | บทพูด |\n|---|---|---|---|\n`
    rs.forEach((r) => { md += `| \`${r.id}\` | ${r.voiceAge} | ${r.mood} | ${r.text}${r.note ? ` <br>⚠️ ${r.note}` : ''} |\n` })
    md += '\n'
  }
}
writeFileSync(`${out}/voice-script.md`, md)
console.log('lines:', rows.length, 'priority1:', p1)
