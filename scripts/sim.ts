// จำลองเล่นสุ่ม 3000 รอบ ดูการกระจายของฉากจบ: npx tsx scripts/sim.ts
import { applyChoice, getScene, newGame, nextSceneId, passYears, pickEnding, visibleChoices, netWorth } from '../src/game/engine'
const count: Record<string, number> = {}
const nets: number[] = []
for (let n = 0; n < 3000; n++) {
  let s = newGame('x', n % 2 ? 'boy' : 'girl', '#000')
  for (let guard = 0; guard < 100; guard++) {
    const sc = getScene(s.sceneId)
    if (sc.reward) { const r = sc.reward(Math.random()); s = applyChoice(s, { text: 'mini', effects: r.effects, flags: r.flags, memory: r.memory }, sc.age, sc.id).state }
    const ch = visibleChoices(sc, s).filter((c) => !c.lock?.(s))
    if (ch.length) s = applyChoice(s, ch[Math.floor(Math.random() * ch.length)], sc.age, sc.id).state
    if (s.endId) break
    const id0 = nextSceneId(s)
    if (!id0) break
    s = passYears(s, sc.age, getScene(id0).age).state
    s = { ...s, sceneId: nextSceneId(s) ?? id0 }
  }
  const e = pickEnding(s).id
  nets.push(netWorth(s))
  count[e] = (count[e] ?? 0) + 1
}
console.table(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ending: k, pct: (v / 30).toFixed(1) + '%' })))
nets.sort((a, b) => a - b)
console.log('net worth p10/p50/p90:', [0.1, 0.5, 0.9].map((q) => Math.round(nets[Math.floor(q * nets.length)] / 1000) + 'K').join(' / '))
