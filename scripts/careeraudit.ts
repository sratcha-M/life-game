// เล่นสุ่มโดยบังคับอาชีพทีละอาชีพ (ปลดล็อกให้ถ้าค่าไม่ถึง) แล้วตรวจฉาก/เหตุการณ์ที่ไม่เข้ากับอาชีพ: npx tsx scripts/careeraudit.ts [รอบต่ออาชีพ=300] [careerId]
import { applyChoice, fillText, getScene, newGame, nextSceneId, passYears, resolveLines, visibleChoices } from '../src/game/engine'
import { DREAMS } from '../src/game/goals'
import { CAREER_LIST, SELF_EMPLOYED } from '../src/game/careers'
import type { Choice, GameState, Scene } from '../src/game/types'

const R = Number(process.argv[2] ?? 300)
const ONLY = process.argv[3]
const WORK = /หัวหน้า|เจ้านาย|บอส|HR|ออฟฟิศ|บริษัท|ประชุม|โบนัส|เงินเดือนขึ้น|เลื่อนตำแหน่ง|เลื่อนขั้น/
const MONK_BAD = /แฟน|แต่งงาน|ภรรยา|สามี|เหล้า|เบียร์|ผับ|เดท|จีบ|ออฟฟิศ|เงินเดือน/
/** อาชีพที่ไม่มีสายบังคับบัญชาแบบบริษัท → "เลื่อนตำแหน่ง" / "บริษัทแจกโบนัส" ฟังแปลก */
const NO_LADDER = ['artist', 'musician', 'actor', 'athlete', 'creator', 'chef', 'trader']
const BAD_TEXT = /\{[a-z_]+\}|undefined|NaN|null/
const castOf = (sc: Scene, s: GameState) => (typeof sc.cast === 'function' ? sc.cast(s) : sc.cast ?? [])
const has = (s: GameState, f: string) => s.flags.includes(f)
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const texts = (ls: Parameters<typeof resolveLines>[0] | undefined, s: GameState) => (ls ? resolveLines(ls, s).map((l) => fillText(l.text, s)).join(' ') : '')

/** ทำให้เลือกอาชีพเป้าหมายได้ (ถ้าค่า/ธงไม่ถึง ก็โกงให้ถึง) */
function unlock(s: GameState, c: Choice): GameState {
  if (!c.lock?.(s)) return s
  const flags = s.flags.filter((f) => f !== 'path_work' && f !== 'creator' && f !== 'cook' && f !== 'hustle').concat('path_med', 'path_eng', 'countryside', 'coco')
  const stats = Object.fromEntries(Object.entries(s.stats).map(([k, v]) => [k, Math.max(v, 8)])) as GameState['stats']
  return { ...s, flags, stats, debt: 0 }
}

type Issue = { n: number; ex: string }
const all: Record<string, Record<string, Issue>> = {}
for (const career of CAREER_LIST.map((c) => c.id).filter((c) => !ONLY || c === ONLY)) {
  const issues: Record<string, Issue> = (all[career] = {})
  const note = (k: string, ex: string) => { (issues[k] ??= { n: 0, ex }).n++ }
  let switched = 0, reached = 0
  for (let n = 0; n < R; n++) {
    const dream = DREAMS[n % DREAMS.length].id
    let s: GameState = newGame('x', n % 2 ? 'boy' : 'girl', '#000', undefined, dream)
    s = { ...s, avoid: undefined, visited: [s.sceneId] }
    const log: string[] = []
    try {
      for (let g = 0; g < 300; g++) {
        const sc = getScene(s.sceneId)
        const where = () => `[${dream}] ${log.slice(-3).join(' → ')} → [${sc.age}] ${sc.id}`
        // ตรวจเฉพาะช่วงที่ยังอยู่ในอาชีพเป้าหมาย (ยังไม่ลาออก/โดนไล่ออก)
        const inCareer = s.career === career && !has(s, 'fired') && !has(s, 'own_boss')
        if (inCareer) {
          const line = texts(sc.lines, s)
          const chs = visibleChoices(sc, s)
          const all = line + ' ' + chs.map((c) => fillText(c.text, s)).join(' ')
          if (sc.id.startsWith('job_') && !sc.id.startsWith(`job_${career}_`)) note(`ฉากอาชีพอื่น ${sc.id}`, where())
          if (SELF_EMPLOYED.includes(career)) {
            if (castOf(sc, s).includes('boss') && !sc.id.startsWith('job_')) note(`อาชีพอิสระแต่มีบอส: ${sc.id}`, where())
            else if (sc.bg === 'office') note(`อาชีพอิสระแต่ฉากออฟฟิศ: ${sc.id}`, where())
            else if (WORK.test(line)) note(`อาชีพอิสระแต่ข้อความเรื่องงานบริษัท "${line.match(WORK)![0]}": ${sc.id}`, where())
          }
          if (career === 'monk' && MONK_BAD.test(all)) note(`นักบวชเจอคำว่า "${all.match(MONK_BAD)![0]}": ${sc.id}`, where())
          if (BAD_TEXT.test(all)) note(`ข้อความเสีย "${all.match(BAD_TEXT)![0]}": ${sc.id}`, where())
        }
        if (sc.reward) { const r = sc.reward(Math.random()); s = applyChoice(s, { text: 'mini', effects: r.effects, flags: r.flags, memory: r.memory }, sc.age, sc.id).state }
        let ch = visibleChoices(sc, s).filter((c) => !c.lock?.(s))
        let c: Choice | undefined
        if (sc.id === 'career') {
          const want = visibleChoices(sc, s).find((x) => x.career === (career === 'laity' ? 'monk' : career))
          if (!want) { note('ไม่มีตัวเลือกอาชีพนี้ในฉาก career', where()); break }
          s = unlock(s, want)
          c = want
        } else {
          // ฆราวาส: ถ้ามีทางลาบวชให้เลือกเสมอ · อาชีพอื่น: เลี่ยงทางที่เปลี่ยนอาชีพ (อยากเห็นชีวิตในอาชีพนั้นนาน ๆ)
          const toLaity = ch.find((x) => x.career === 'laity')
          if (career === 'laity' && toLaity) c = toLaity
          else { const stay = ch.filter((x) => !x.career || x.career === s.career); c = stay.length ? pick(stay) : ch.length ? pick(ch) : undefined }
        }
        if (c) {
          if (s.career === career) {
            const res = typeof c.result === 'function' ? c.result(s) : c.result
            const rt = res ? texts(res, s) : ''
            if (BAD_TEXT.test(rt)) note(`ข้อความผลเสีย "${rt.match(BAD_TEXT)![0]}": ${sc.id}`, where())
          }
          s = applyChoice(s, c, sc.age, sc.id).state
          log.push(`[${sc.age}] ${sc.id}(${c.text.slice(0, 14)})`)
        }
        if (s.endId) break
        const id0 = nextSceneId(s)
        if (!id0) { if (sc.age < 70) note(`ชีวิตหยุดกลางทางที่อายุ ${sc.age} (${sc.id})`, where()); break }
        const before = s.history.length
        const wasIn = s.career === career && !has(s, 'fired') && !has(s, 'own_boss')
        s = passYears(s, sc.age, getScene(id0).age).state
        if (wasIn) for (const h of s.history.slice(before)) {
          if (NO_LADDER.includes(career) && /เลื่อนตำแหน่ง|บริษัทกำไรดี/.test(h.text)) note(`เหตุการณ์สุ่มไม่เข้ากับอาชีพ: ${h.text}`, `อายุ ${h.age}`)
          if (SELF_EMPLOYED.includes(career) && /เลื่อนตำแหน่ง|บริษัท|เลิกจ้าง/.test(h.text)) note(`อาชีพอิสระเจอเหตุการณ์: ${h.text}`, `อายุ ${h.age}`)
        }
        const id = nextSceneId(s) ?? id0
        s = { ...s, sceneId: id, visited: [...(s.visited ?? []), id] }
        if (s.career && s.career !== career && !(career === 'laity' && s.career === 'monk') && !log.some((l) => l.startsWith('switch'))) { switched++; note(`เปลี่ยนอาชีพเป็น ${s.career}`, log.slice(-3).join(" → ")); log.push(`switch→${s.career}`) }
        if (s.cash < 0 && getScene(id).age >= 19) s = { ...s, cash: 50_000 } // ข้ามโหมดหาเงิน
      }
      if (s.career === career) reached++
    } catch (e) {
      note(`💥 error: ${(e as Error).message}`, `${log.slice(-3).join(' → ')}`)
    }
  }
  const list = Object.entries(issues).sort((a, b) => b[1].n - a[1].n)
  console.log(`\n${CAREER_LIST.find((c) => c.id === career)!.icon} ${career}  (จบชีวิตในอาชีพนี้ ${reached}/${R} · เปลี่ยนอาชีพกลางทาง ${switched})`)
  if (!list.length) console.log('   ✅ ไม่พบปัญหา')
  for (const [k, v] of list.slice(0, 12)) console.log(`   ${((v.n / R) * 100).toFixed(1).padStart(5)}%  ${k}\n          เช่น ${v.ex}`)
}
