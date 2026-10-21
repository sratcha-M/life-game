import { useState } from 'react'
import { fmtBaht, married, rand } from '../game/finance'
import { bondOf } from '../game/bonds'
import type { Bonds, GameState } from '../game/types'
import { MiniGame, type MiniKind } from './MiniGame'

/** ผลรวมของโหมดหาเงิน ส่งกลับไปให้เกมบันทึก */
export interface HustleResult {
  cash: number
  debt: number
  effects: { body?: number; happy?: number; family?: number; smart?: number; love?: number; friend?: number }
  bond?: Bonds
  ok: boolean
  memory: string
}

interface Job {
  id: string
  icon: string
  name: string
  desc: string
  kind?: MiniKind
  how?: string
  pay: number
  lock?: (s: GameState) => string | false
  once?: boolean
  /** แสดงเฉพาะเมื่อเงื่อนไขจริง */
  when?: (s: GameState, age: number) => boolean
  /** โอกาสที่อีกฝ่ายยอมให้ยืม (ขึ้นกับความสัมพันธ์ในเส้นทางนี้) */
  chance?: (s: GameState) => number
}

const JOBS: Job[] = [
  { id: 'rider', icon: '🛵', name: 'ไรเดอร์ส่งอาหาร', desc: 'รับเหรียญ หลบบิล', kind: 'catch', how: 'ลากกล่องรับเงินค่าส่ง หลบบิลค่าปรับ', pay: 30_000 },
  { id: 'tutor', icon: '🧮', name: 'สอนพิเศษ', desc: 'ตอบเลขให้ไว', kind: 'math', how: 'ตอบให้ถูก ได้ค่าสอนเยอะ', pay: 40_000, lock: (s) => s.stats.smart < 4 && 'ต้องมี 📘 ความรู้ 4+' },
  { id: 'labor', icon: '📦', name: 'แบกของที่โกดัง', desc: 'แตะรัว ๆ', kind: 'tap', how: 'ยกกล่องให้ได้มากที่สุด', pay: 25_000 },
  { id: 'parents', icon: '🙏', name: 'ขอยืมพ่อแม่', desc: 'ได้เงินทันที แต่เสียความรู้สึก', pay: 60_000, once: true, when: (_s, age) => age < 35, lock: (s) => s.stats.family < 4 && 'ครอบครัวไม่อยากช่วยแล้ว' },
  { id: 'nong', icon: '👧', name: 'ขอยืมน้องฝน', desc: 'น้องจะให้ไหม ขึ้นกับว่าดีกับน้องแค่ไหน', pay: 90_000, once: true,
    when: (s, age) => age >= 35 && s.flags.includes('met_nong'),
    lock: (s) => s.flags.includes('sibling_war') && 'ไม่ได้คุยกับน้องตั้งแต่ฟ้องมรดก',
    chance: (s) => Math.min(0.95, 0.15 + bondOf(s, 'nong') * 0.08) },
  { id: 'partner', icon: '💑', name: 'ขอยืมแฟน/คู่ชีวิต', desc: 'คู่ชีวิตจะช่วยไหม ขึ้นกับความรัก', pay: 120_000, once: true,
    when: (s, age) => age >= 35 && married(s),
    chance: (s) => Math.min(0.95, 0.2 + s.stats.love * 0.07) },
  { id: 'jay', icon: '🧑‍🎓', name: 'ขอยืมเจ', desc: 'เพื่อนเก่าที่ตอนนี้รวย', pay: 150_000, once: true,
    when: (s, age) => age >= 28 && s.flags.includes('met_jay'),
    lock: (s) => (s.flags.includes('betrayed_jay') ? '🚩 คุณเคยหักหลังเจ' : s.flags.includes('jay_betray') ? '🚩 เจเคยหักหลังคุณ' : false),
    chance: (s) => Math.min(0.9, 0.05 + bondOf(s, 'jay') * 0.09) },
  { id: 'friend', icon: '🤝', name: 'ขอยืมต้น', desc: 'เพื่อนเก่าจะยังช่วยไหม', pay: 70_000, once: true,
    when: (s, age) => age >= 35 && !married(s) && !s.flags.includes('met_nong') && !s.flags.includes('betrayed'),
    chance: (s) => Math.min(0.9, 0.1 + s.stats.friend * 0.08) },
  { id: 'shark', icon: '🦈', name: 'กู้นอกระบบ', desc: 'ได้ทันที หนี้เพิ่ม 2 เท่า', pay: 80_000, once: true },
  { id: 'lotto', icon: '🎟️', name: 'ซื้อหวยแก้ดวง', desc: 'ลุ้น 1 ใน 10', pay: 0 },
]

const ROUNDS = 5

export function HustleMode({ s, target, age, onDone }: { s: GameState; target: number; age: number; onDone: (r: HustleResult) => void }) {
  const scale = age < 25 ? 0.7 : age < 60 ? 1 : 0.6
  const [earned, setEarned] = useState(0)
  const [debt, setDebt] = useState(0)
  const [eff, setEff] = useState<HustleResult['effects']>({})
  const [bond, setBond] = useState<Bonds>({})
  const [round, setRound] = useState(0)
  const [used, setUsed] = useState<string[]>([])
  const [playing, setPlaying] = useState<Job | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const done = earned >= target
  const over = !done && round >= ROUNDS

  const bump = (k: keyof HustleResult['effects'], v: number) => setEff((e) => ({ ...e, [k]: (e[k] ?? 0) + v }))
  const gain = (n: number, text: string) => {
    setEarned((x) => x + n)
    setRound((r) => r + 1)
    setMsg(text)
    setTimeout(() => setMsg(null), 1600)
  }

  const start = (j: Job) => {
    if (j.kind) return setPlaying(j)
    setUsed((u) => [...u, j.id])
    if (j.chance) {
      const p = j.chance(s)
      const yes = rand(s.seed, `borrow-${j.id}-${age}`) < p
      const amt = Math.round((j.pay * scale) / 1000) * 1000
      if (j.id === 'nong') { setBond((b) => ({ ...b, nong: (b.nong ?? 0) - (yes ? 1 : 2) })); bump('family', yes ? 0 : -1) }
      if (j.id === 'partner') bump('love', yes ? -1 : -2)
      if (j.id === 'friend') bump('friend', yes ? -1 : -2)
      if (!yes) bump('happy', -1)
      const who = j.id === 'nong' ? 'น้องฝน' : j.id === 'partner' ? 'คู่ชีวิต' : j.id === 'jay' ? 'เจ' : 'ต้น'
      if (j.id === 'jay') setBond((b) => ({ ...b, jay: (b.jay ?? 0) - (yes ? 0 : 1) }))
      return gain(yes ? amt : 0, yes ? `${j.icon} ${who}โอนให้ ${fmtBaht(amt)} "คืนเมื่อไหร่ก็ได้นะ"` : `${j.icon} ${who}ปฏิเสธ... "ช่วงนี้ไม่ไหวจริง ๆ"`)
    }
    if (j.id === 'parents') { bump('family', -2); return gain(j.pay * scale, `🙏 แม่โอนให้ ${fmtBaht(j.pay * scale)} พร้อมถอนหายใจ`) }
    if (j.id === 'shark') { setDebt((d) => d + j.pay * 2); bump('happy', -1); return gain(j.pay, `🦈 ได้เงินสด ${fmtBaht(j.pay)} แต่หนี้เพิ่ม ${fmtBaht(j.pay * 2)}`) }
    if (j.id === 'lotto') {
      const win = Math.random() < 0.1
      const prize = win ? target * 1.5 : 0
      if (!win) bump('happy', -1)
      return gain(prize - 2_000, win ? `🎉 ถูกหวย! ได้ ${fmtBaht(prize)}` : '🎟️ กินแห้ว... เสียไป ฿2,000')
    }
  }

  const finishGame = (score: number) => {
    const j = playing!
    setPlaying(null)
    const pay = Math.round(j.pay * scale * (0.3 + score))
    if (j.id === 'labor') bump('body', score > 0.6 ? 1 : -1)
    if (j.id === 'tutor') bump('smart', 1)
    bump('happy', -1)
    gain(pay, `${j.icon} ${j.name} ได้ ${fmtBaht(pay)}`)
  }

  const finish = (ok: boolean) => onDone({
    cash: earned, debt, ok, bond,
    effects: { ...eff, ...(ok ? {} : { happy: (eff.happy ?? 0) - 3, family: (eff.family ?? 0) - 1 }) },
    memory: ok ? `💸 เงินหมดตอนอายุ ${age} แต่ดิ้นรนหาเงินจนรอด` : `💸 เงินหมดตอนอายุ ${age} หาเงินไม่ทัน ชีวิตลำบากหนัก`,
  })

  if (playing) return <MiniGame kind={playing.kind!} title={playing.name} icon={playing.icon} how={playing.how} onDone={finishGame} />

  const pct = Math.min(1, earned / target)
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2a1520]/80 p-3 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="popin w-full max-w-lg rounded-[28px] border-4 border-[#ffd166] bg-white p-5 shadow-2xl">
        <div className="text-center">
          <div className="text-5xl">💸</div>
          <h2 className="font-display text-2xl text-[#c0505f]">เงินหมด! โหมดหาเงิน</h2>
          <p className="text-sm text-[#7a5a66]">หาให้ได้ <b>{fmtBaht(target)}</b> ภายใน {ROUNDS} รอบ ไม่งั้นชีวิตลำบาก</p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#f3e6ea]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ffd166] to-[#3fae78] transition-all duration-500" style={{ width: `${pct * 100}%` }} />
          </div>
          <span className="w-24 text-right font-display text-sm text-[#3a2433]">{fmtBaht(earned)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-[#8a6a76]">
          <span>รอบ {Math.min(round, ROUNDS)}/{ROUNDS}</span>
          {debt > 0 && <span className="text-[#c0505f]">หนี้นอกระบบ +{fmtBaht(debt)}</span>}
        </div>

        {msg && <div className="popin mt-3 rounded-2xl bg-[#fff6dc] px-4 py-2 text-center font-display text-[#5a4300]">{msg}</div>}

        {!done && !over && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {JOBS.filter((j) => !j.when || j.when(s, age)).map((j) => {
              const lock = (j.lock?.(s) || (j.once && used.includes(j.id) && 'ใช้ไปแล้ว')) || null
              return (
                <button key={j.id} disabled={!!lock || !!msg} onClick={() => start(j)}
                  className={`popin flex flex-col items-center gap-0.5 rounded-2xl border-2 p-3 text-center transition ${lock ? 'border-transparent bg-[#eee8ec] opacity-60' : 'border-[#f6d6de] bg-[#fff8fa] hover:-translate-y-0.5 hover:border-[#e0707f] active:scale-95'}`}>
                  <span className="text-3xl">{lock ? '🔒' : j.icon}</span>
                  <span className="font-display text-sm text-[#3a2433]">{j.name}</span>
                  <span className="text-[11px] leading-tight text-[#8a6a76]">{lock || j.desc}</span>
                  {!lock && j.chance && <span className="rounded-full bg-[#f3eef7] px-2 text-[10px] text-[#7a5a96]">โอกาสให้ยืม ~{Math.round(j.chance(s) * 10) * 10}%</span>}
                </button>
              )
            })}
          </div>
        )}

        {(done || over) && (
          <div className="popin mt-4 text-center">
            <div className="text-5xl">{done ? '🎉' : '😞'}</div>
            <div className="font-display text-xl text-[#3a2433]">{done ? 'รอดแล้ว! กลับไปใช้ชีวิตต่อ' : 'หาเงินไม่ทัน... ชีวิตลำบากหนัก'}</div>
            {!done && <div className="text-sm text-[#8a6a76]">ความสุข −3 · ครอบครัว −1</div>}
            <button onClick={() => finish(done)} className="popin mt-3 w-full rounded-2xl bg-[#e0707f] py-3 font-display text-lg text-white shadow-lg active:scale-95">ไปต่อ</button>
          </div>
        )}
      </div>
    </div>
  )
}
