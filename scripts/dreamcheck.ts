// เช็กว่า "ทุกความฝัน" มีทางไปถึงได้จริงในทุก seed (beam search หาทางเลือกที่ดีที่สุด): npx tsx scripts/dreamcheck.ts [seeds] [dreamId]
import { applyChoice, getScene, newGame, nextSceneId, passYears, pickEnding, statProfile, visibleChoices, netWorth, married, endingRules, weirdRules } from '../src/game/engine'
import { DREAMS } from '../src/game/goals'
import { bondOf } from '../src/game/bonds'
import { CAREER_STAT } from '../src/game/careers'
import type { GameState } from '../src/game/types'

const N = Number(process.argv[2] ?? 40)
const ONLY = process.argv[3]
const BEAM = Number(process.env.BEAM ?? 150)
const has = (s: GameState, f: string) => s.flags.includes(f)
const ruleScore = (s: GameState, id: string) => { const r = endingRules(s).find((x) => x.id === id)!; return r.checks.filter((c) => c.ok).length / Math.max(1, r.checks.length) }
const KEYS = ['smart', 'body', 'art', 'social', 'happy', 'money', 'family', 'friend', 'love'] as const
/** ระยะที่ค่ากลุ่ม mine นำค่าที่ดีที่สุดนอกกลุ่ม skip (บวก = ติดอันดับ) */
const margin = (s: GameState, mine: (typeof KEYS)[number][], skip: (typeof KEYS)[number][] = []) => {
  const P = statProfile(s)
  return Math.max(...mine.map(P.score)) - Math.max(...KEYS.filter((k) => !mine.includes(k) && !skip.includes(k)).map(P.score))
}

/** ค่าความใกล้ความฝัน (ยิ่งมากยิ่งดี) */
const H: Record<string, (s: GameState) => number> = {
  rich: (s) => Math.log10(Math.max(1, netWorth(s) + 1)),
  legend: (s) => { const cs = s.career ? CAREER_STAT[s.career] : null; const P = statProfile(s); return cs ? 5 + P.score(cs) - Math.max(...(['smart', 'body', 'art', 'social', 'happy', 'money', 'family', 'friend', 'love'] as const).filter((k) => k !== cs).map(P.score)) : 0 },
  family: (s) => s.stats.family + (married(s) ? 5 : 0) + (has(s, 'kid') ? 5 : 0) + s.stats.love * 0.3 - (has(s, 'divorced') ? 30 : 0),
  friend: (s) => s.stats.friend - (has(s, 'betrayed') || has(s, 'ignored_ton') ? 30 : 0),
  long: (s) => ruleScore(s, 'centenarian') * 10 + (s.visited ?? []).filter((v) => v.startsWith('long_')).length * 5 + Math.min(0.5, margin(s, ['body'])) + Math.min(0.5, margin(s, ['happy'], ['body'])) * 2 + (has(s, 'healthy') ? 2 : 0) - (has(s, 'workaholic') ? 2 : 0),
  happy: (s) => s.stats.happy,
  weird: (s) => Math.max(...weirdRules(s).map((r) => r.checks.filter((c) => c.ok).length)) * 3 + Math.min(5, s.stats.smart) * 0.3,
  home: (s) => ruleScore(s, 'home') * 10 + (has(s, 'countryside') || s.career === 'farmer' ? 3 : 0) + Math.min(0.5, margin(s, ['family', 'happy'])) * 3,
  dynasty: (s) => (has(s, 'kid') ? 5 : 0) + Math.log10(Math.max(1, netWorth(s) + 1)) + Math.min(7, s.stats.family),
  bonds: (s) => Math.min(...(['nong', 'jay', 'coco'] as const).map((b) => bondOf(s, b))) * 3 + (['nong', 'jay', 'coco'] as const).reduce((a, b) => a + bondOf(s, b), 0),
}

/** เล่นต่อหนึ่งฉาก → รายการสถานะถัดไป (null sceneId = จบชีวิต) */
function expand(s: GameState): { s: GameState; done: boolean }[] {
  const sc = getScene(s.sceneId)
  let starts = [s]
  if (sc.reward) starts = [1, 0.4].map((p) => { const r = sc.reward!(p); return applyChoice(s, { text: 'mini', effects: r.effects, flags: r.flags, memory: r.memory, bond: r.bond }, sc.age, sc.id).state })
  const out: { s: GameState; done: boolean }[] = []
  for (const st of starts) {
    const ch = visibleChoices(sc, st).filter((c) => !c.lock?.(st))
    const nexts = ch.length ? ch.map((c) => applyChoice(st, c, sc.age, sc.id).state) : [st]
    for (let n of nexts) {
      if (n.endId) { out.push({ s: n, done: true }); continue }
      const id0 = nextSceneId(n)
      if (!id0) { out.push({ s: n, done: true }); continue }
      n = passYears(n, sc.age, getScene(id0).age).state
      const id = nextSceneId(n) ?? id0
      n = { ...n, sceneId: id, visited: [...(n.visited ?? []), id] }
      // โหมดหาเงิน: สมมติว่าหาเงินทันพอดีเป้า
      if (getScene(id).age >= 19 && n.cash < 10_000) n = { ...n, cash: n.cash + Math.max(40_000, Math.min(250_000, n.debt * 0.08)) }
      out.push({ s: n, done: false })
    }
  }
  return out
}

function solve(dreamId: string, i: number) {
  const d = DREAMS.find((x) => x.id === dreamId)!
  const g0 = newGame('x', i % 2 ? 'girl' : 'boy', '#000', undefined, dreamId)
  let beam = [{ ...g0, seed: 1000 + i * 7919, avoid: undefined, visited: [g0.sceneId] }]
  let best = -Infinity, bestS: GameState | null = null
  for (let step = 0; step < 200 && beam.length; step++) {
    const next: GameState[] = []
    const seen = new Set<string>()
    for (const s of beam) for (const { s: n, done } of expand(s)) {
      if (done) { if (d.check(n, pickEnding(n))) return true; const h = H[dreamId](n); if (h > best) { best = h; bestS = n } continue }
      const k = n.sceneId + JSON.stringify(n.stats) + n.flags.join() + JSON.stringify(n.bonds) + n.career
      if (!seen.has(k)) { seen.add(k); next.push(n) }
    }
    next.sort((a, b) => H[dreamId](b) - H[dreamId](a))
    beam = next.slice(0, BEAM)
    if (process.env.TRACE) console.log(step, beam.length, beam[0] && getScene(beam[0].sceneId).age, beam[0]?.sceneId)
  }
  // beam search พลาดได้ → ลองเล่นสุ่มอีกหลายรอบก่อนสรุปว่าไปไม่ถึง
  for (let n = 0; n < 2000; n++) {
    let s: GameState = { ...g0, seed: 1000 + i * 7919, avoid: undefined, visited: [g0.sceneId] }
    for (let step = 0; step < 200; step++) {
      const xs = expand(s)
      const x = xs[Math.floor(Math.random() * xs.length)]
      if (x.done) { if (d.check(x.s, pickEnding(x.s))) return true; break }
      s = x.s
    }
  }
  if (process.env.DEBUG && !bestS) console.log(`  seed ${i}: no life finished`)
  if (process.env.DEBUG && bestS) {
    const e = pickEnding(bestS)
    console.log(`  seed ${i}: end=${e.id} endId=${bestS.endId ?? '-'} career=${bestS.career} stats=${JSON.stringify(bestS.stats)} bonds=${JSON.stringify(bestS.bonds)}`)
    console.log('   flags:', bestS.flags.join(' '))
    console.log('   ', endingRules(bestS).map((r) => `${r.id}:${r.checks.map((c) => (c.ok ? '✓' : '✗')).join('')}`).join('  '))
  }
  return false
}

for (const d of DREAMS) {
  if (ONLY && d.id !== ONLY) continue
  const fails: number[] = []
  for (let i = 0; i < N; i++) if (!solve(d.id, i)) fails.push(i)
  console.log(`${d.icon} ${d.id.padEnd(8)} ${N - fails.length}/${N}${fails.length ? '  fail seeds: ' + fails.slice(0, 10).join(',') : ''}`)
}
