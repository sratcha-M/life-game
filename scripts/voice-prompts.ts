// สร้าง docs/voice-prompts.csv จาก docs/voice-missing.csv: เพิ่มคอลัมน์ prompt สำหรับวางให้ AI (Google AI Studio TTS) อ่าน
// ข้ามไฟล์ที่อัดแล้ว · แยกบรรทัดที่ต้องอัด 2 เสียงเป็น _m / _f · แทน {name} {fah} {krub} {chan} ด้วยคำที่อ่านได้
// ใช้: npx tsx scripts/voice-prompts.ts
import fs from 'node:fs'

const root = new URL('..', import.meta.url)
const VOICE_DIR = new URL('src/assets/voice/', root)

/** แยก CSV (รองรับช่องที่มี "..." และ "" ข้างใน) */
function parseCsv(t: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}
const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)

const recorded = (file: string) => fs.existsSync(new URL(file, VOICE_DIR))

const TONE: Record<string, string> = {
  ปกติ: 'a calm, natural',
  ดีใจ: 'a happy, bright',
  เศร้า: 'a sad, soft',
  ตกใจ: 'a startled, surprised',
  โกรธ: 'an angry, tense',
}
const ROLE: Record<string, string> = {
  ครูสมศรี: 'a kind schoolteacher', ต้น: 'the hero\'s best friend', น้องฝน: 'the hero\'s younger sister', พ่อ: 'the hero\'s father',
  แม่: 'the hero\'s mother', ยาย: 'the hero\'s grandmother', หลานน้ำ: 'the hero\'s grandchild', หัวหน้า: 'a strict office boss',
  เจ: 'the hero\'s rival friend', ฟ้า: 'the hero\'s sweetheart', ตัวเอก: 'the main character',
}
/** เพศของตัวละคร (ฟ้า/ตัวเอก/หลานน้ำ ขึ้นกับไฟล์ _m/_f) */
const FIXED: Record<string, 'm' | 'f'> = { ครูสมศรี: 'f', ต้น: 'm', น้องฝน: 'f', พ่อ: 'm', แม่: 'f', ยาย: 'f', หัวหน้า: 'm', เจ: 'm' }

function who(char: string, age: string, g: 'm' | 'f' | null) {
  if (char === 'ผู้บรรยาย') return 'a warm Thai female storyteller narrating a life story'
  if (char === 'โกโก้') return 'a small playful puppy (dog sounds only)'
  const sex = g ?? FIXED[char] ?? 'f'
  const n = Number(age.match(/\d+/)?.[0] ?? 30)
  const person = n <= 1 ? 'baby' : n < 13 ? (sex === 'm' ? 'boy' : 'girl') : n < 20 ? (sex === 'm' ? 'teenage boy' : 'teenage girl') : n >= 60 ? (sex === 'm' ? 'elderly man' : 'elderly woman') : sex === 'm' ? 'man' : 'woman'
  return `${n === 8 || n === 11 || n === 18 || (n >= 80 && n < 90) ? 'an' : 'a'} ${n}-year-old Thai ${person}, ${ROLE[char] ?? char}`
}

/** แทนตัวแปรในบท → คำที่ AI อ่านได้ (ชื่อผู้เล่นเปลี่ยนเป็นคำเรียกตามคนพูด) */
function fill(text: string, char: string, g: 'm' | 'f' | null) {
  const call = char === 'แม่' || char === 'พ่อ' ? 'ลูก' : char === 'ยาย' ? 'หลาน' : char === 'หลานน้ำ' ? '' : 'เธอ'
  return text
    .replaceAll('{name}', call)
    .replaceAll('{fah}', 'เขา')
    .replaceAll('{krub}', g === 'f' ? 'ค่ะ' : 'ครับ')
    .replaceAll('{chan}', g === 'f' ? 'หนู' : 'ผม')
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ใส่คำสั่งเป็นภาษาอังกฤษ + บทไทยในเครื่องหมายคำพูด → AI ไม่เผลออ่านคำสั่งออกมา (เคยต้องตัดหัวไฟล์ทิ้ง 14 ไฟล์)
const prompt = (char: string, age: string, mood: string, g: 'm' | 'f' | null, line: string) =>
  `Speak only the Thai line in quotes, in ${TONE[mood] ?? TONE['ปกติ']} voice of ${who(char, age, g)}. Do not read these instructions: "${line}"`

const [head, ...rows] = parseCsv(fs.readFileSync(new URL('docs/voice-missing.csv', root), 'utf8').replace(/^﻿/, ''))
const col = (k: string) => head.indexOf(k)
const out: string[][] = [['ลำดับ', 'ไฟล์', 'ฉาก', 'ตัวละคร', 'วัยของเสียง', 'อารมณ์', 'บทพูด', 'prompt']]
let skipped = 0
for (const r of rows) {
  const [order, file, scene, char, age, mood, text, note] = [r[col('ลำดับ')], r[col('ไฟล์')], r[col('ฉาก')], r[col('ตัวละคร')], r[col('วัยของเสียง')], r[col('อารมณ์')], r[col('บทพูด')], r[col('หมายเหตุ')] ?? '']
  const two = note.includes('_m และ _f') || /\{krub\}|\{chan\}/.test(text)
  const variants: ['m' | 'f' | null, string][] = two ? [['m', file.replace('.mp3', '_m.mp3')], ['f', file.replace('.mp3', '_f.mp3')]] : [[null, file]]
  for (const [g, f] of variants) {
    if (recorded(f)) { skipped++; continue }
    const line = fill(text, char, g)
    if (!line) continue
    out.push([order, f.replace('.mp3', '.wav'), scene, char, age, mood, line, prompt(char, age, mood, g, line)])
  }
}
fs.writeFileSync(new URL('docs/voice-prompts.csv', root), '﻿' + out.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n')
const first = out.filter((r) => r[0] === 'ทำก่อน').length
console.log(`voice-prompts.csv: ${out.length - 1} ไฟล์ (ทำก่อน ${first} · ทีหลัง ${out.length - 1 - first}) · ข้ามที่อัดแล้ว ${skipped}`)
