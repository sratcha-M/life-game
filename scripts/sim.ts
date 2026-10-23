// จำลองเล่นสุ่ม N รอบ (เดินตามลูปจริงใน App: ขายทรัพย์สินเมื่อเงินสดหมด · โหมดหาเงิน · ล้มละลายเมื่อหมดตัวเกิน 7 ครั้ง)
// ดูการกระจายฉากจบ ความมั่งคั่ง และอัตราล้มละลายแยกอาชีพ: npx tsx scripts/sim.ts [รอบ=3000]
import { applyChoice, getScene, newGame, nextSceneId, passYears, pickEnding, visibleChoices, netWorth } from '../src/game/engine'
import { DREAMS, TRAITS } from '../src/game/goals'
import { isBroke, priceAt } from '../src/game/finance'
import type { GameState } from '../src/game/types'
const N = Number(process.argv[2] ?? 3000)
const HUSTLE_MAX = 7
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const count: Record<string, number> = {}
const nets: number[] = []
const moneys: number[] = []
const reals: number[] = []
const byCareer: Record<string, { n: number; bankrupt: number; nets: number[] }> = {}
let hustled = 0
for (let n = 0; n < N; n++) {
  let s: GameState = newGame('x', n % 2 ? 'boy' : 'girl', '#000', pick(TRAITS.slice(0, 15)).id, pick(DREAMS).id)
  s = { ...s, avoid: undefined, visited: [s.sceneId] }
  for (let guard = 0; guard < 300; guard++) {
    const sc = getScene(s.sceneId)
    if (sc.reward) { const r = sc.reward(Math.random()); s = applyChoice(s, { text: 'mini', effects: r.effects, flags: r.flags, memory: r.memory }, sc.age, sc.id).state }
    const ch = visibleChoices(sc, s).filter((c) => !c.lock?.(s))
    if (ch.length) s = applyChoice(s, pick(ch), sc.age, sc.id).state
    if (s.endId) break
    const id0 = nextSceneId(s)
    if (!id0) break
    const aged = passYears(s, sc.age, getScene(id0).age).state
    const id = nextSceneId(aged) ?? id0
    const age = getScene(id).age
    s = { ...aged, sceneId: id, visited: [...(aged.visited ?? []), id] }
    // เหมือน App.enter(): เงินสดหมด → ขายทรัพย์สินก่อน → ยังไม่พอ = หมดตัว เข้าโหมดหาเงิน (สมมติว่าหาได้ครบเป้า)
    if (isBroke(s, age) && s.invest > 0) {
      const sell = Math.min(s.invest, 100_000 - s.cash), keep = 1 - sell / s.invest
      s = { ...s, cash: s.cash + sell, invest: s.invest - sell, stocks: Math.round((s.stocks ?? 0) * keep), stockIn: Math.round((s.stockIn ?? 0) * keep) }
    }
    if (isBroke(s, age)) {
      const h = (s.hustles ?? 0) + 1
      if (h > HUSTLE_MAX && s.debt > 0) { s = { ...s, endId: 'bankrupt', endAge: age }; break }
      const target = Math.round(Math.max(40_000, Math.min(250_000, s.debt * 0.08)) / 1000) * 1000
      s = applyChoice({ ...s, hustles: h }, { text: 'hustle', fin: { cash: target } }, age, s.sceneId).state
    }
  }
  const e = pickEnding(s).id
  const net = netWorth(s)
  nets.push(net)
  if (!s.endId) { moneys.push(s.stats.money); reals.push(net / priceAt(70)) }
  if (s.hustles) hustled++
  count[e] = (count[e] ?? 0) + 1
  const c = (byCareer[s.career ?? '-'] ??= { n: 0, bankrupt: 0, nets: [] })
  c.n++; c.nets.push(net); if (e === 'bankrupt') c.bankrupt++
}
const q = (a: number[], p: number) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(p * (b.length - 1))] }
const K = (v: number) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v / 1000) + 'K')
console.table(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ending: k, pct: ((v / N) * 100).toFixed(1) + '%' })))
console.log('net worth p10/p50/p90:', [0.1, 0.5, 0.9].map((p) => K(q(nets, p))).join(' / '))
console.log('มูลค่าจริง (ราคาอายุ 22) ตอน 70 p10/p25/p50/p75/p90/p99:', [0.1, 0.25, 0.5, 0.75, 0.9, 0.99].map((p) => K(q(reals, p))).join(' / '))
console.log('💰 money stat ตอน 70 (p10/p50/p90/max):', [0.1, 0.5, 0.9, 1].map((p) => q(moneys, p)).join(' / '))
console.log('เคยหมดตัวอย่างน้อยครั้งเดียว:', ((hustled / N) * 100).toFixed(1) + '%')
console.table(Object.entries(byCareer).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => ({ career: k, n: v.n, bankrupt: ((v.bankrupt / v.n) * 100).toFixed(0) + '%', p50: K(q(v.nets, 0.5)) })))
