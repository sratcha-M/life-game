// ตรวจลำดับเหตุการณ์แปลก ๆ: หลังลาออก/โดนไล่ออก/เป็นนายตัวเอง แล้วยังเจอฉากหัวหน้า/ออฟฟิศ/ฉากอาชีพเดิม: npx tsx scripts/audit.ts
import { applyChoice, getScene, newGame, nextSceneId, passYears, resolveLines, visibleChoices } from '../src/game/engine'
import type { GameState, Scene } from '../src/game/types'
const WORK = /หัวหน้า|เลื่อน|เจ้านาย|บอส|HR|ออฟฟิศ|บริษัท|ประชุม|โบนัส|เงินเดือนขึ้น|ตำแหน่ง/
const castOf = (sc: Scene, s: GameState) => (typeof sc.cast === 'function' ? sc.cast(s) : sc.cast ?? [])
const issues: Record<string, { n: number; ex: string }> = {}
const note = (k: string, ex: string) => { (issues[k] ??= { n: 0, ex }).n++ }
const N = 4000
for (let n = 0; n < N; n++) {
  let s = newGame('x', n % 2 ? 'boy' : 'girl', '#000')
  const log: string[] = []
  for (let g = 0; g < 200; g++) {
    const sc = getScene(s.sceneId)
    const quit = s.flags.includes('own_boss') || s.flags.includes('fired')
    if (quit && s.career !== 'monk') {
      const why = s.flags.includes('own_boss') ? 'own_boss' : 'fired'
      const text = resolveLines(sc.lines, s).map((l) => l.text).join(' ')
      const hit = sc.id.startsWith('job_') ? `ฉากอาชีพเดิม (${s.career})`
        : castOf(sc, s).includes('boss') ? 'มีบอสในฉาก'
        : sc.bg === 'office' ? 'ฉากออฟฟิศ'
        : WORK.test(text) ? `ข้อความเรื่องงานประจำ: "${text.match(WORK)![0]}"` : null
      if (hit) note(`${why} → ${sc.id}: ${hit}`, `${log.slice(-4).join(' → ')} → [${sc.age}] ${sc.id}`)
    }
    log.push(`[${sc.age}] ${sc.id}`)
    if (sc.reward) { const r = sc.reward(Math.random()); s = applyChoice(s, { text: 'mini', effects: r.effects, flags: r.flags, memory: r.memory }, sc.age, sc.id).state }
    const ch = visibleChoices(sc, s).filter((c) => !c.lock?.(s))
    if (ch.length) {
      const c = ch[Math.floor(Math.random() * ch.length)]
      s = applyChoice(s, c, sc.age, sc.id).state
      log[log.length - 1] += `(${c.text.slice(0, 18)})`
    }
    if (s.endId) break
    const id0 = nextSceneId(s); if (!id0) break
    const wasQuit = s.flags.includes('own_boss') || s.flags.includes('fired')
    const r = passYears(s, sc.age, getScene(id0).age)
    if (wasQuit) for (const h of r.report.shock ? [r.report.shock] : []) if (/เลื่อนตำแหน่ง|โบนัส|ขึ้นเงินเดือน/.test(h.text)) note(`เหตุการณ์การเงินหลังลาออก: ${h.text}`, log.slice(-3).join(' → '))
    s = { ...r.state, sceneId: nextSceneId(r.state) ?? id0 }
  }
}
const rows = Object.entries(issues).sort((a, b) => b[1].n - a[1].n)
for (const [k, v] of rows) console.log(`${(v.n / N * 100).toFixed(2)}%  ${k}\n        เช่น ${v.ex}`)
console.log(rows.length ? `\n${rows.length} แบบ` : 'ไม่เจอปัญหา')
