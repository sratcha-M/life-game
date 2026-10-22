/**
 * 🖼️ การ์ดผลชีวิต (รูป PNG 1080×1350 สัดส่วนโพสต์ IG/FB) — วาดด้วย canvas ในเครื่อง ไม่ต้องใช้เซิร์ฟเวอร์
 * ใช้แชร์ผลชีวิตเป็นรูปแทนข้อความ
 */
import { spriteFor } from '../art/Character'
import { endingArtOf } from '../art/endingArt'
import { CAREERS, netWorth } from '../game/engine'
import { fmtBaht } from '../game/finance'
import { dreamOf } from '../game/goals'
import { personaSentence } from '../game/personaHooks'
import type { Ending, GameState } from '../game/types'
import type { LifeRecord } from '../game/meta'

const W = 1080, H = 1350
const THEME = {
  good: { bg: ['#ffe3ec', '#fff3e0'], accent: '#e0707f', ink: '#4a2c38', soft: '#8a6a76', tag: '#3fae78', tagText: 'ฉากจบดี' },
  bad: { bg: ['#d9d3de', '#efe9ea'], accent: '#6a5a72', ink: '#2e2433', soft: '#6f6475', tag: '#5a4a5e', tagText: 'ฉากจบแย่' },
  weird: { bg: ['#d8ccff', '#f3e9ff'], accent: '#7b5cd6', ink: '#2f2552', soft: '#6a5a92', tag: '#7b5cd6', tagText: 'ฉากจบแปลก' },
}
/** เหตุการณ์สำคัญที่ควรขึ้นการ์ด (เหมือนสมุดชีวิต) */
const MAJOR = /แต่งงาน|มีลูก|เรียนจบ|ได้งาน|เกษียณ|ล้มละลาย|ติดคุก|เปิดร้าน|เลื่อนตำแหน่ง|ปลดหนี้|ย้ายไป|บวช|หย่า|ถูกหวย|ขึ้นยาน/u

const loadImg = (src: string) => new Promise<HTMLImageElement | null>((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })

/** ตัดบรรทัดภาษาไทย: แยกคำด้วย Intl.Segmenter (ถ้ามี) ไม่งั้นตัดทีละตัวอักษร */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter
  const parts = Seg ? [...new Seg('th', { granularity: 'word' }).segment(text)].map((x) => x.segment) : Array.from(text)
  const lines: string[] = []
  let cur = ''
  for (const p of parts) {
    if (ctx.measureText(cur + p).width > maxW && cur) { lines.push(cur.trim()); cur = p.trimStart() } else cur += p
  }
  if (cur.trim()) lines.push(cur.trim())
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/u, '') + '…' }
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

export async function drawLifeCard(s: GameState, ending: Ending, age: number, dreamOk: boolean): Promise<Blob> {
  const t = THEME[ending.kind]
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  await Promise.all(['600 64px Mitr', '400 40px Mitr', '400 34px Sarabun'].map((f) => document.fonts?.load(f).catch(() => null)))
  const F = (size: number, w = 400, fam = 'Mitr') => `${w} ${size}px ${fam}, "Noto Sans Thai", sans-serif`

  // พื้นหลัง
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1])
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 0.18; ctx.fillStyle = t.accent
  ctx.beginPath(); ctx.arc(W - 120, 170, 300, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(80, H - 160, 220, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // ตัวละคร (ขวา) — จางลงด้านล่าง
  const art = endingArtOf(ending.id, ending.kind)
  const sp = spriteFor('me', age, s)
  const img = await loadImg(art.src ?? sp?.hd ?? sp?.url ?? '')
  if (img) {
    // ย่อให้อยู่ในกรอบคอลัมน์ขวา (กว้าง ≤ 440, สูง ≤ 740) ชิดขวาล่าง — รูปกว้าง ๆ (เช่น โบกมือ) จะไม่ล้นมาทับข้อความ
    const sc = Math.min(440 / img.width, 740 / img.height)
    const w = img.width * sc, h = Math.round(img.height * sc)
    const x = W - w - 10, y = 990 - h
    const tmp = document.createElement('canvas'); tmp.width = Math.ceil(w); tmp.height = h
    const tc = tmp.getContext('2d')!
    if (art.filter) tc.filter = art.filter
    if (sp?.pixel && !art.src) tc.imageSmoothingEnabled = false
    tc.drawImage(img, 0, 0, w, h)
    tc.globalCompositeOperation = 'destination-in'
    const fade = tc.createLinearGradient(0, 0, 0, h); fade.addColorStop(0.7, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)')
    tc.fillStyle = fade; tc.fillRect(0, 0, w, h)
    ctx.globalAlpha = 0.95; ctx.drawImage(tmp, x, y); ctx.globalAlpha = 1
  }

  // ข้อความคอลัมน์ซ้าย: เรืองขาวจาง ๆ ให้อ่านออกแม้ตัวละครเฉียดมาใกล้
  ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = 14
  // หัว
  ctx.textBaseline = 'top'
  ctx.fillStyle = t.soft; ctx.font = F(32, 500)
  ctx.fillText('🌱 เส้นทางชีวิต · LIFE PATH', 70, 64)
  ctx.font = F(30, 500)
  const tw = ctx.measureText(t.tagText).width + 44
  roundRect(ctx, 70, 120, tw, 54, 27); ctx.fillStyle = t.tag; ctx.fill()
  ctx.fillStyle = '#fff'; ctx.fillText(t.tagText, 92, 130)

  // ฉากจบ
  ctx.font = F(120); ctx.fillText(ending.emoji, 62, 200)
  ctx.fillStyle = t.ink; ctx.font = F(76, 600)
  let y = 350
  for (const line of wrap(ctx, ending.title, 560, 2)) { ctx.fillText(line, 70, y); y += 92 }
  ctx.fillStyle = t.soft; ctx.font = F(38)
  ctx.fillText(`ชีวิตของ ${s.name} · ${age} ปี`, 70, y + 6)
  y += 80

  // ประโยคบุคลิก
  ctx.fillStyle = t.ink; ctx.font = F(36, 400, 'Sarabun')
  for (const line of wrap(ctx, `“${personaSentence(s)}”`, 540, 3)) { ctx.fillText(line, 70, y); y += 50 }
  y += 24

  // ข้อมูลหลัก
  const dream = dreamOf(s)
  const rows: [string, string][] = [
    ['💼', s.career ? CAREERS[s.career] : 'ยังค้นหาตัวเองอยู่'],
    ['💰', `ทรัพย์สิน ${fmtBaht(netWorth(s))}`],
    ...(dream ? [['⭐', `${dream.name} ${dreamOk ? '✅ สำเร็จ' : '— ยังไปไม่ถึง'}`] as [string, string]] : []),
  ]
  ctx.font = F(38)
  for (const [ic, txt] of rows) { ctx.fillStyle = t.ink; ctx.fillText(wrap(ctx, `${ic}  ${txt}`, 560, 1)[0] ?? '', 70, y); y += 58 }
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0

  // เหตุการณ์สำคัญ
  const major = s.history.filter((h) => h.age > 0 && MAJOR.test(h.text))
  // ชีวิตสั้น/ไม่มีเหตุการณ์ใหญ่ → ใช้เหตุการณ์ล่าสุดแทน การ์ดจะได้ไม่โล่ง
  const mem = (major.length >= 2 ? major : s.history.filter((h) => h.age > 0 && !/^(🕯️|🧬)/u.test(h.text))).slice(-4)
  if (mem.length) {
    const top = Math.max(y + 20, 1000)
    roundRect(ctx, 50, top, W - 100, 60 + mem.length * 50, 32); ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fill()
    ctx.font = F(30, 400, 'Sarabun')
    let my = top + 30
    for (const h of mem) {
      ctx.fillStyle = t.soft; ctx.fillText(`${h.age} ปี`, 84, my)
      ctx.fillStyle = t.ink
      ctx.fillText(wrap(ctx, h.text.replace(/\s*\(.*\)$/, ''), W - 300, 1)[0] ?? '', 200, my)
      my += 50
    }
  }

  // ท้าย
  ctx.fillStyle = t.accent; ctx.font = F(32, 500)
  const url = typeof location !== 'undefined' ? location.host : ''
  const foot = `ลองใช้ชีวิตของคุณดูบ้าง → ${url}`
  ctx.fillText(foot, (W - ctx.measureText(foot).width) / 2, H - 70)

  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('toBlob failed'))), 'image/png'))
}

/** การ์ดย้อนหลังจากอัลบั้มชีวิต: สร้าง GameState ย่อ ๆ จากบันทึกชีวิตที่เล่นจบแล้ว */
export function drawRecordCard(rec: LifeRecord): Promise<Blob> {
  const s: GameState = {
    name: rec.name, gender: rec.gender, hair: '', career: rec.career, history: rec.history, sceneId: '', seed: 0,
    stats: { smart: 0, body: 0, art: 0, social: 0, happy: 0, money: 0, family: 0, friend: 0, love: 0 },
    flags: [...(rec.married ? ['partner'] : []), ...(rec.kid ? ['kid'] : [])],
    cash: rec.net, invest: 0, debt: 0, dream: rec.dream, trait: rec.trait, persona: rec.persona, bonds: rec.bonds, life: rec.life, gen: rec.gen,
  }
  return drawLifeCard(s, { id: rec.endingId, kind: rec.kind, emoji: rec.emoji, title: rec.title, desc: '' }, rec.age, rec.dreamOk)
}
