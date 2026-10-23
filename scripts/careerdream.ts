// ตาราง อาชีพ × ความฝัน: ล็อกอาชีพไว้ (ห้ามเปลี่ยนอาชีพกลางทาง) แล้ว beam search หาทางไปถึงความฝัน: npx tsx scripts/careerdream.ts [seeds=3] [careerId] [dreamId]
import { applyChoice, getScene, newGame, nextSceneId, passYears, pickEnding, statProfile, visibleChoices, netWorth, married, endingRules, weirdRules } from '../src/game/engine'
import { DREAMS } from '../src/game/goals'
import { bondOf } from '../src/game/bonds'
import { CAREER_LIST, CAREER_STAT } from '../src/game/careers'
import type { GameState } from '../src/game/types'

const N = Number(process.argv[2] ?? 3)
const ONLY_C = process.argv[3]
const ONLY_D = process.argv[4]
const BEAM = Number(process.env.BEAM ?? 150)
const has = (s: GameState, f: string) => s.flags.includes(f)
const ruleScore = (s: GameState, id: string) => { const r = endingRules(s).find((x) => x.id === id)!; return r.checks.filter((c) => c.ok).length / Math.max(1, r.checks.length) }
const KEYS = ['smart', 'body', 'art', 'social', 'happy', 'money', 'family', 'friend', 'love'] as const
const margin = (s: GameState, mine: (typeof KEYS)[number][], skip: (typeof KEYS)[number][] = []) => {
  const P = statProfile(s)
  return Math.max(...mine.map(P.score)) - Math.max(...KEYS.filter((k) => !mine.includes(k) && !skip.includes(k)).map(P.score))
}
/** เหมือน dreamcheck.ts */
const H: Record<string, (s: GameState) => number> = {
  rich: (s) => Math.log10(Math.max(1, netWorth(s) + 1)),
  legend: (s) => { const cs = s.career ? CAREER_STAT[s.career] : null; const P = statProfile(s); return cs ? 5 + P.score(cs) - Math.max(...KEYS.filter((k) => k !== cs).map(P.score)) : 0 },
  family: (s) => s.stats.family + (married(s) ? 5 : 0) + (has(s, 'kid') ? 5 : 0) + s.stats.love * 0.3 - (has(s, 'divorced') ? 30 : 0),
  friend: (s) => s.stats.friend - (has(s, 'betrayed') || has(s, 'ignored_ton') ? 30 : 0),
  long: (s) => ruleScore(s, 'centenarian') * 10 + (s.visited ?? []).filter((v) => v.startsWith('long_')).length * 5 + Math.min(0.5, margin(s, ['body'])) + Math.min(0.5, margin(s, ['happy'], ['body'])) * 2 + (has(s, 'healthy') ? 2 : 0) - (has(s, 'workaholic') ? 2 : 0),
  happy: (s) => s.stats.happy,
  weird: (s) => Math.max(...weirdRules(s).map((r) => r.checks.filter((c) => c.ok).length)) * 3 + Math.min(5, s.stats.smart) * 0.3,
  home: (s) => ruleScore(s, 'home') * 10 + (has(s, 'countryside') || s.career === 'farmer' ? 3 : 0) + Math.min(0.5, margin(s, ['family', 'happy'])) * 3,
  dynasty: (s) => (has(s, 'kid') ? 5 : 0) + Math.log10(Math.max(1, netWorth(s) + 1)) + Math.min(7, s.stats.family),
  bonds: (s) => Math.min(...(['nong', 'jay', 'coco'] as const).map((b) => bondOf(s, b))) * 3 + (['nong', 'jay', 'coco'] as const).reduce((a, b) => a + bondOf(s, b), 0),
}

/** เงื่อนไขปลดล็อกอาชีพตอนอายุ 22 (ตาม story.ts ฉาก career) → ใช้ดันให้ beam เดินไปทางที่ปลดล็อกได้ */
const REQ: Record<string, { any?: string[]; degree?: boolean; st?: Partial<Record<(typeof KEYS)[number], number>> }> = {
  doctor: { any: ['path_med'], st: { smart: 7 } }, dev: { any: ['path_eng', 'path_med'], st: { smart: 5 } }, artist: { st: { art: 5 } },
  musician: { st: { art: 6, social: 4 } }, athlete: { st: { body: 6 } }, creator: { st: { social: 7 } }, chef: { st: { money: 4 } },
  teacher: { degree: true, st: { smart: 4 } }, farmer: { any: ['countryside'] }, nurse: { degree: true, st: { smart: 5 } },
  vet: { any: ['path_med', 'coco'], st: { smart: 6 } }, engineer: { any: ['path_eng'], st: { smart: 6 } }, pilot: { degree: true, st: { smart: 7, body: 5 } },
  lawyer: { degree: true, st: { smart: 7, social: 5 } }, civil: { degree: true, st: { smart: 5 } }, police: { st: { body: 5 } },
  actor: { st: { art: 5, social: 6 } }, streamer: { st: { social: 4 } }, trader: { st: { smart: 5, money: 3 } },
  monk: { st: { happy: 4 } }, laity: { st: { happy: 4 } }, seller: {}, rider: {}, office: {},
}
const closeness = (s: GameState, c: string) => {
  const r = REQ[c] ?? {}
  let v = 0, n = 0
  if (r.any) { n++; v += r.any.some((f) => has(s, f)) ? 1 : 0 }
  if (r.degree) { n++; v += has(s, 'path_work') ? 0 : 1 }
  for (const [k, need] of Object.entries(r.st ?? {})) { n++; v += Math.min(1, s.stats[k as (typeof KEYS)[number]] / need!) }
  return n ? v / n : 1
}
/** อาชีพตอนนี้ยังอยู่ในเส้นทางของอาชีพเป้าหมายไหม (ฆราวาสต้องผ่านการบวชก่อน) */
const onTrack = (s: GameState, target: string) => !s.career || s.career === target || (target === 'laity' && s.career === 'monk')

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
      if (getScene(id).age >= 19 && n.cash < 10_000) n = { ...n, cash: n.cash + Math.max(40_000, Math.min(250_000, n.debt * 0.08)) }
      out.push({ s: n, done: false })
    }
  }
  return out
}

type Result = { ok: boolean; unlocked: boolean; best?: GameState }
function solve(career: string, dreamId: string, i: number): Result {
  const d = DREAMS.find((x) => x.id === dreamId)!
  const g0 = newGame('x', i % 2 ? 'girl' : 'boy', '#000', undefined, dreamId)
  const start = { ...g0, seed: 1000 + i * 7919, avoid: undefined, visited: [g0.sceneId] }
  const score = (s: GameState) => H[dreamId](s) + (s.career ? 40 : 30 * closeness(s, career)) + (career === 'laity' && s.career === 'laity' ? 5 : 0)
  const good = (s: GameState) => s.career === career && d.check(s, pickEnding(s))
  let beam = [start]
  let unlocked = false, best = -Infinity, bestS: GameState | undefined
  for (let step = 0; step < 200 && beam.length; step++) {
    const next: GameState[] = []
    const seen = new Set<string>()
    for (const s of beam) for (const { s: n, done } of expand(s)) {
      if (!onTrack(n, career)) continue
      if (n.career) unlocked = true
      if (done) {
        if (good(n)) return { ok: true, unlocked: true }
        if (n.career === career) { const h = H[dreamId](n); if (h > best) { best = h; bestS = n } }
        continue
      }
      const k = n.sceneId + JSON.stringify(n.stats) + n.flags.join() + JSON.stringify(n.bonds) + n.career
      if (!seen.has(k)) { seen.add(k); next.push(n) }
    }
    next.sort((a, b) => score(b) - score(a))
    beam = next.slice(0, BEAM)
  }
  // beam พลาดได้ → สุ่มเล่นเพิ่ม (เฉพาะทางที่ยังอยู่ในอาชีพเป้าหมาย)
  for (let n = 0; n < 300; n++) {
    let s = start
    for (let step = 0; step < 200; step++) {
      const xs = expand(s).filter((x) => onTrack(x.s, career))
      if (!xs.length) break
      const x = xs[Math.floor(Math.random() * xs.length)]
      if (x.s.career) unlocked = true
      if (x.done) { if (good(x.s)) return { ok: true, unlocked: true }; break }
      s = x.s
    }
  }
  return { ok: false, unlocked, best: bestS }
}

const careers = CAREER_LIST.map((c) => c.id).filter((c) => !ONLY_C || c === ONLY_C)
const dreams = DREAMS.filter((d) => !ONLY_D || d.id === ONLY_D)
console.log('career   ' + dreams.map((d) => d.id.padEnd(8)).join(''))
const fails: string[] = []
for (const c of careers) {
  const row: string[] = []
  for (const d of dreams) {
    let ok = 0, locked = 0
    for (let i = 0; i < N; i++) {
      const r = solve(c, d.id, i)
      if (r.ok) ok++
      else if (!r.unlocked) locked++
      else if (r.best) {
        const b = r.best, e = pickEnding(b)
        fails.push(`${c} × ${d.id} seed ${i}: end=${e.id} stats=${JSON.stringify(b.stats)} kid=${has(b, 'kid')} married=${married(b)} net=${Math.round(netWorth(b) / 1e5) / 10}M\n    ${endingRules(b).filter((r) => r.checks.some((x) => x.ok)).map((r) => `${r.id}:${r.checks.map((x) => (x.ok ? '✓' : '✗')).join('')}`).join(' ')}`)
      }
    }
    row.push((ok === N ? '✅' : ok ? `🟡${ok}/${N}` : locked === N ? '🔒' : '❌').padEnd(8))
  }
  console.log(c.padEnd(9) + row.join(''))
}
console.log('\n✅ ทุก seed ผ่าน · 🟡 บาง seed · ❌ ปลดล็อกอาชีพได้แต่ไปไม่ถึงความฝัน · 🔒 ปลดล็อกอาชีพไม่ได้เลย')
if (process.env.DEBUG) for (const f of fails) console.log(f)
