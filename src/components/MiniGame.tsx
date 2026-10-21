import { useCallback, useEffect, useRef, useState } from 'react'

/** จำนวนข้อสอบเลข (จำกัด ไม่ให้เดาไปเรื่อย ๆ) */
const MATH_Q = 8
export type MiniKind = 'tap' | 'math' | 'catch' | 'memory' | 'timing'

const INFO: Record<MiniKind, { icon: string; title: string; how: string; secs: number }> = {
  tap: { icon: '🏃', title: 'วิ่งแข่งกีฬาสี!', how: 'แตะรัว ๆ ให้เร็วที่สุด', secs: 5 },
  math: { icon: '✏️', title: 'สอบเข้า ม.1', how: `มี ${MATH_Q} ข้อ ตอบได้ข้อละครั้งเดียว`, secs: 20 },
  catch: { icon: '🧺', title: 'เก็บเงินพาร์ทไทม์', how: 'ลากตะกร้ารับเหรียญ 🪙 หลบบิล 🧾', secs: 10 },
  memory: { icon: '🃏', title: 'เกมจับคู่', how: 'เปิดการ์ดจับคู่ให้ครบ', secs: 25 },
  timing: { icon: '💓', title: 'จังหวะหัวใจ', how: 'แตะตอนหัวใจอยู่ในโซนชมพู', secs: 12 },
}

/** มินิเกม: เรียก onDone(score 0–1) เมื่อจบ */
export function MiniGame({ kind, onDone, title, icon, how }: { kind: MiniKind; onDone: (score: number) => void; title?: string; icon?: string; how?: string }) {
  const info = { ...INFO[kind], ...(title ? { title } : {}), ...(icon ? { icon } : {}), ...(how ? { how } : {}) }
  const [stage, setStage] = useState<'intro' | 'count' | 'play' | 'done'>('intro')
  const [count, setCount] = useState(3)
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(info.secs)
  const scoreRef = useRef(0)
  const add = useCallback((n: number) => { scoreRef.current = Math.max(0, scoreRef.current + n); setScore(scoreRef.current) }, [])
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  // เริ่มเองถ้าไม่แตะ
  useEffect(() => {
    if (stage !== 'intro') return
    const t = setTimeout(() => setStage('count'), 2500)
    return () => clearTimeout(t)
  }, [stage])
  useEffect(() => {
    if (stage !== 'count') return
    if (count <= 0) { setStage('play'); return }
    const t = setTimeout(() => setCount((c) => c - 1), 550)
    return () => clearTimeout(t)
  }, [stage, count])
  useEffect(() => {
    if (stage !== 'play') return
    const end = Date.now() + info.secs * 1000
    const t = setInterval(() => {
      const l = (end - Date.now()) / 1000
      setLeft(Math.max(0, l))
      if (l <= 0) { clearInterval(t); setStage('done') }
    }, 100)
    return () => clearInterval(t)
  }, [stage, info.secs])
  const target = kind === 'tap' ? 32 : kind === 'math' ? MATH_Q : kind === 'memory' ? 6 : kind === 'timing' ? 3 : 14
  useEffect(() => {
    if (stage !== 'done') return
    const t = setTimeout(() => doneRef.current(Math.min(1, scoreRef.current / target)), 1300)
    return () => clearTimeout(t)
  }, [stage, target])

  const pct = Math.min(1, score / target)
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1d1a2b]/55 p-4 backdrop-blur-[2px]" onClick={(e) => e.stopPropagation()}>
      <div className="popin relative w-full max-w-md overflow-hidden rounded-[28px] border-4 border-white bg-white/95 p-5 text-center shadow-2xl">
        {stage === 'intro' && (
          <button className="popin flex w-full flex-col items-center gap-2 py-6" onClick={() => setStage('count')}>
            <span className="text-7xl">{info.icon}</span>
            <span className="font-display text-2xl text-[#3a2433]">{info.title}</span>
            <span className="text-[#7a5a66]">{info.how}</span>
            <span className="mt-2 rounded-2xl bg-[#e0707f] px-8 py-3 font-display text-xl text-white shadow-lg">เริ่ม!</span>
          </button>
        )}
        {stage === 'count' && <div className="popin py-16 font-display text-8xl text-[#e0707f]" key={count}>{count || 'ไป!'}</div>}
        {stage === 'play' && (
          <>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[#ffd166] transition-[width] duration-100 ease-linear" style={{ width: `${(left / info.secs) * 100}%` }} /></div>
              <span className="w-8 font-display text-lg text-[#5a3443]">{Math.ceil(left)}</span>
            </div>
            {kind === 'tap' && <TapRace pct={pct} onTap={() => add(1)} />}
            {kind === 'math' && <MathQuiz score={score} onAnswer={(ok) => add(ok ? 1 : 0)} onEnd={() => setStage('done')} />}
            {kind === 'catch' && <CatchCoins onCatch={add} score={score} />}
            {kind === 'memory' && <Memory onPair={() => add(1)} onAll={() => setStage('done')} />}
            {kind === 'timing' && <Timing onHit={(ok) => add(ok ? 1 : 0)} onEnd={() => setStage('done')} />}
          </>
        )}
        {stage === 'done' && (
          <div className="popin flex flex-col items-center gap-2 py-8">
            <span className="text-7xl">{pct >= 0.8 ? '🏆' : pct >= 0.5 ? '👍' : '😅'}</span>
            <span className="font-display text-2xl text-[#3a2433]">{pct >= 0.8 ? 'สุดยอด!' : pct >= 0.5 ? 'ทำได้ดี!' : 'ไม่เป็นไรนะ'}</span>
            <span className="text-[#7a5a66]">ได้ {score} คะแนน</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TapRace({ pct, onTap }: { pct: number; onTap: () => void }) {
  return (
    <button className="popin relative block h-56 w-full touch-manipulation overflow-hidden rounded-2xl bg-[#c9a36d] active:bg-[#bf9760]" onPointerDown={onTap}>
      {[0, 1, 2].map((i) => <div key={i} className="absolute inset-x-0 h-0.5 bg-white/60" style={{ top: `${30 + i * 25}%` }} />)}
      <div className="absolute right-6 top-0 h-full w-2 bg-[repeating-linear-gradient(0deg,#fff_0_8px,#333_8px_16px)]" />
      <span className="absolute text-5xl transition-[left] duration-150" style={{ left: `calc(${pct * 82}% )`, top: '38%', transform: 'scaleX(-1)' }}>🏃</span>
      <span className="absolute text-4xl" style={{ left: `${Math.min(80, 20 + pct * 50)}%`, top: '10%', transform: 'scaleX(-1)' }}>🏃‍♂️</span>
      <span className="absolute bottom-3 inset-x-0 font-display text-lg text-white drop-shadow">แตะ! แตะ! แตะ!</span>
    </button>
  )
}

function MathQuiz({ score, onAnswer, onEnd }: { score: number; onAnswer: (ok: boolean) => void; onEnd: () => void }) {
  const make = () => {
    const op = Math.random() < 0.5 ? '+' : '×'
    const a = op === '+' ? 5 + Math.floor(Math.random() * 40) : 2 + Math.floor(Math.random() * 8)
    const b = op === '+' ? 5 + Math.floor(Math.random() * 40) : 2 + Math.floor(Math.random() * 8)
    const ans = op === '+' ? a + b : a * b
    const opts = new Set([ans])
    while (opts.size < 4) opts.add(ans + (Math.floor(Math.random() * 11) - 5 || 7))
    return { q: `${a} ${op} ${b}`, ans, opts: [...opts].sort(() => Math.random() - 0.5) }
  }
  const [q, setQ] = useState(make)
  const [flash, setFlash] = useState<null | boolean>(null)
  const [n, setN] = useState(1)
  const answer = (v: number) => {
    if (flash !== null) return // ตอบแล้ว รอข้อถัดไป
    const ok = v === q.ans
    onAnswer(ok); setFlash(ok)
    setTimeout(() => {
      setFlash(null)
      if (n >= MATH_Q) return onEnd()
      setN(n + 1); setQ(make())
    }, 450)
  }
  return (
    <div>
      <div className={`rounded-2xl py-6 font-display text-5xl transition-colors ${flash === true ? 'bg-[#d6f5e3] text-[#2f8f5a]' : flash === false ? 'bg-[#ffe0e5] text-[#c0505f]' : 'bg-[#2f5a46] text-white'}`}>{q.q} = ?</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {q.opts.map((o) => (
          <button key={o} disabled={flash !== null} onClick={() => answer(o)} className={`${flash !== null && o === q.ans ? 'ring-4 ring-[#3fae78]' : ''} popin rounded-2xl bg-[#fde8ed] py-4 font-display text-3xl text-[#4a2c38] shadow active:scale-95`}>{o}</button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-sm text-[#7a5a66]"><span>ข้อ {n}/{MATH_Q}</span><span>ถูก {score} ข้อ</span></div>
      {flash === false && <div className="text-xs text-[#c0505f]">เฉลย: {q.ans}</div>}
    </div>
  )
}

function CatchCoins({ onCatch, score }: { onCatch: (n: number) => void; score: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0.5)
  const xRef = useRef(0.5)
  type It = { id: number; x: number; y: number; bad: boolean; v: number }
  const [items, setItems] = useState<It[]>([])
  const itemsRef = useRef<It[]>([])
  const [pop, setPop] = useState<{ id: number; x: number; t: string }[]>([])
  useEffect(() => {
    let id = Date.now(), raf = 0, last = performance.now(), spawn = 0
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      spawn -= dt
      let next = itemsRef.current.map((it) => ({ ...it, y: it.y + it.v * dt }))
      if (spawn <= 0) { spawn = 0.45; next.push({ id: id++, x: 0.08 + Math.random() * 0.84, y: -0.1, bad: Math.random() < 0.25, v: 0.45 + Math.random() * 0.35 }) }
      const caught = next.filter((it) => it.y > 0.78 && it.y < 0.95 && Math.abs(it.x - xRef.current) < 0.13)
      caught.forEach((it) => { onCatch(it.bad ? -2 : 1); setPop((p) => [...p.slice(-4), { id: it.id, x: it.x, t: it.bad ? '-2' : '+1' }]) })
      next = next.filter((it) => !caught.includes(it) && it.y < 1.1)
      itemsRef.current = next
      setItems(next)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [onCatch])
  const move = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    const v = Math.min(0.92, Math.max(0.08, (clientX - r.left) / r.width))
    xRef.current = v; setX(v)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { xRef.current = Math.max(0.08, xRef.current - 0.1); setX(xRef.current) }
      if (e.key === 'ArrowRight') { xRef.current = Math.min(0.92, xRef.current + 0.1); setX(xRef.current) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <div ref={box} className="relative h-72 touch-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#bfe6ff] to-[#fef3d6]"
      onPointerMove={(e) => move(e.clientX)} onPointerDown={(e) => move(e.clientX)}>
      {items.map((it) => <span key={it.id} className="absolute -translate-x-1/2 text-3xl" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}>{it.bad ? '🧾' : '🪙'}</span>)}
      {pop.map((p) => <span key={p.id} className="toast absolute -translate-x-1/2 font-display text-lg text-[#3a2433]" style={{ left: `${p.x * 100}%`, top: '62%' }}>{p.t}</span>)}
      <span className="absolute -translate-x-1/2 text-5xl" style={{ left: `${x * 100}%`, top: '80%' }}>🧺</span>
      <span className="absolute left-3 top-2 font-display text-[#5a3443]">🪙 {score}</span>
    </div>
  )
}

function Memory({ onPair, onAll }: { onPair: () => void; onAll: () => void }) {
  const [cards] = useState(() => {
    const e = ['🧸', '🎈', '🍭', '🐶', '🚗', '⭐']
    return [...e, ...e].sort(() => Math.random() - 0.5)
  })
  const [open, setOpen] = useState<number[]>([])
  const [got, setGot] = useState<number[]>([])
  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || got.includes(i)) return
    const o = [...open, i]
    setOpen(o)
    if (o.length === 2) {
      if (cards[o[0]] === cards[o[1]]) {
        const g = [...got, ...o]
        setTimeout(() => { setGot(g); setOpen([]); onPair(); if (g.length === cards.length) setTimeout(onAll, 400) }, 250)
      } else setTimeout(() => setOpen([]), 650)
    }
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((c, i) => {
        const up = open.includes(i) || got.includes(i)
        return (
          <button key={i} onClick={() => flip(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-3xl shadow transition duration-200 ${got.includes(i) ? 'scale-95 bg-[#d6f5e3]' : up ? 'bg-white' : 'bg-gradient-to-br from-[#f6a6b8] to-[#e0707f] active:scale-90'}`}
            style={{ transform: up ? 'rotateY(0)' : 'rotateY(180deg)' }}>
            {up ? c : <span className="text-xl text-white/80">?</span>}
          </button>
        )
      })}
    </div>
  )
}

function Timing({ onHit, onEnd }: { onHit: (ok: boolean) => void; onEnd: () => void }) {
  const [x, setX] = useState(0)
  const [tries, setTries] = useState(0)
  const [flash, setFlash] = useState<null | boolean>(null)
  const zone = useRef({ a: 0.55 + Math.random() * 0.2, w: 0.16 })
  const xr = useRef(0)
  useEffect(() => {
    let raf = 0; const t0 = performance.now()
    const loop = (t: number) => {
      const speed = 0.9 + tries * 0.35
      const v = (Math.sin(((t - t0) / 1000) * speed * Math.PI) + 1) / 2
      xr.current = v; setX(v); raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tries])
  const tap = () => {
    if (tries >= 3 || flash !== null) return
    const z = zone.current
    const ok = xr.current >= z.a && xr.current <= z.a + z.w
    onHit(ok); setFlash(ok)
    setTimeout(() => {
      setFlash(null)
      const n = tries + 1
      setTries(n)
      zone.current = { a: 0.15 + Math.random() * 0.6, w: Math.max(0.09, 0.16 - n * 0.03) }
      if (n >= 3) setTimeout(onEnd, 300)
    }, 600)
  }
  return (
    <button onPointerDown={tap} className="block w-full touch-manipulation rounded-2xl bg-[#fff1f4] p-5">
      <div className="relative h-14 overflow-hidden rounded-full bg-[#f3e0e6]">
        <div className="absolute inset-y-0 rounded-full bg-[#f6a6b8]" style={{ left: `${zone.current.a * 100}%`, width: `${zone.current.w * 100}%` }} />
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl" style={{ left: `${x * 100}%` }}>💓</span>
      </div>
      <div className="mt-3 font-display text-lg text-[#5a3443]">
        {flash === true ? '💘 ใช่เลย!' : flash === false ? '💦 พลาด!' : `แตะ! (${tries}/3)`}
      </div>
    </button>
  )
}
