// คำนวณ "ค่าปกติตอนอายุ 70" ของแต่ละค่าสถานะ จากชีวิตจำลอง → src/game/statBaseline.json
// รันใหม่ทุกครั้งที่เพิ่ม/แก้เนื้อหา: npx tsx scripts/calibrate.ts
import fs from 'node:fs'
import { applyChoice, getScene, newGame, nextSceneId, passYears, visibleChoices } from '../src/game/engine'
const KEYS = ['smart', 'body', 'art', 'social', 'happy', 'money', 'family', 'friend', 'love'] as const
const vals: Record<string, number[]> = Object.fromEntries(KEYS.map((k) => [k, []]))
for (let i = 0; i < 3000; i++) {
  let s: any = { ...newGame('x', i % 2 ? 'girl' : 'boy', '#000'), avoid: undefined }
  for (let g = 0; g < 150; g++) {
    const sc = getScene(s.sceneId)
    const ch = visibleChoices(sc, s).filter((c: any) => !c.lock?.(s))
    if (ch.length) s = applyChoice(s, ch[Math.floor(Math.random() * ch.length)], sc.age, sc.id).state
    if (s.endId) break
    const id0 = nextSceneId(s); if (!id0) break
    s = passYears(s, sc.age, getScene(id0).age).state
    s = { ...s, sceneId: nextSceneId(s) ?? id0 }
  }
  if (s.endId) continue
  for (const k of KEYS) vals[k].push(s.stats[k])
}
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)] }
const out = Object.fromEntries(KEYS.map((k) => [k, Math.max(1, med(vals[k]))]))
fs.writeFileSync(new URL('../src/game/statBaseline.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.log(vals.smart.length, 'lives', out)
