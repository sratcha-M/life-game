import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { bgImage } from '../art/Background'
import { sfx } from '../lib/sound'
import cardBack from '../assets/minigame/card_back.webp'

/** จำนวนข้อสอบเลข (จำกัด ไม่ให้เดาไปเรื่อย ๆ) */
const MATH_Q = 8
export type MiniKind = 'tap' | 'math' | 'catch' | 'memory' | 'timing'

const INFO: Record<MiniKind, { icon: string; title: string; how: string; secs: number; color: string; dark: string; bg: string }> = {
  tap: { icon: '🏃', title: 'วิ่งแข่งกีฬาสี!', how: 'แตะรัว ๆ ให้เร็วที่สุด', secs: 5, color: '#f4a261', dark: '#b4602a', bg: 'racetrack' },
  math: { icon: '✏️', title: 'สอบเข้า ม.1', how: `มี ${MATH_Q} ข้อ ตอบได้ข้อละครั้งเดียว`, secs: 20, color: '#3f9a70', dark: '#245a42', bg: 'chalkboard' },
  catch: { icon: '🧺', title: 'เก็บเงินพาร์ทไทม์', how: 'ลากตะกร้ารับเหรียญ 🪙 หลบบิล 🧾', secs: 10, color: '#4aa3df', dark: '#24668f', bg: 'city' },
  memory: { icon: '🧠', title: 'เกมจับคู่', how: 'เปิดการ์ดจับคู่ให้ครบ', secs: 25, color: '#9b7fd1', dark: '#5e4796', bg: 'classroom' },
  timing: { icon: '💓', title: 'จังหวะหัวใจ', how: 'แตะตอนหัวใจอยู่ในโซนชมพู', secs: 12, color: '#e0707f', dark: '#a8404f', bg: 'love' },
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
    sfx('tap')
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
    const p = scoreRef.current / target
    sfx(p >= 0.8 ? 'unlock' : p >= 0.5 ? 'good' : 'loss')
    const t = setTimeout(() => doneRef.current(Math.min(1, scoreRef.current / target)), 1800)
    return () => clearTimeout(t)
  }, [stage, target])

  const pct = Math.min(1, score / target)
  const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : pct > 0.2 ? 1 : 0
  const bg = bgImage(info.bg)
  const theme = { '--mg': info.color, '--mg-dark': info.dark } as CSSProperties
  return (
    <div className="fadein absolute inset-0 z-30 flex items-center justify-center bg-[#1d1a2b]/65 p-3 backdrop-blur-[3px]" style={theme} onClick={(e) => e.stopPropagation()}>
      <div className="popin relative w-full max-w-md overflow-hidden rounded-[28px] border-4 border-white bg-[#fffaf6] text-center shadow-[0_20px_60px_rgba(0,0,0,.45)]">
        {/* หัวการ์ด: ภาพฉาก + ชื่อเกม */}
        <div className="relative h-20 overflow-hidden" style={{ background: 'var(--mg)' }}>
          {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" draggable={false} />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, var(--mg-dark))' }} />
          <div className="relative flex h-full items-center gap-3 px-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow">{info.icon}</span>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate font-display text-xl leading-tight text-white drop-shadow">{info.title}</div>
              <div className="text-xs text-white/85">มินิเกม</div>
            </div>
            {stage === 'play' && <TimerRing left={left} total={info.secs} />}
          </div>
        </div>

        <div className="p-4">
          {stage === 'intro' && (
            <button className="popin flex w-full flex-col items-center gap-3 py-4" onClick={() => setStage('count')}>
              <span className="bob flex h-28 w-28 items-center justify-center rounded-full text-7xl shadow-inner" style={{ background: 'radial-gradient(circle, #fff 30%, color-mix(in srgb, var(--mg) 30%, #fff))' }}>{info.icon}</span>
              <span className="rounded-full bg-[#f3ebe6] px-4 py-1.5 text-[#5a3443]">👆 {info.how}</span>
              <span className="text-sm text-[#9a7a86]">⏰ {info.secs} วินาที</span>
              <span className="relative mt-1 w-full max-w-60 overflow-hidden rounded-2xl py-3 font-display text-xl text-white shadow-lg transition active:scale-95" style={{ background: 'var(--mg)', boxShadow: '0 5px 0 var(--mg-dark)' }}>
                <span className="absolute inset-y-0 left-0 bg-white/25" style={{ animation: 'grow 2.5s linear both' }} />
                <span className="relative">เริ่มเลย!</span>
              </span>
            </button>
          )}
          {stage === 'count' && (
            <div className="flex h-60 items-center justify-center">
              <div key={count} className="popin flex h-36 w-36 items-center justify-center rounded-full border-8 font-display text-7xl" style={{ borderColor: 'var(--mg)', color: 'var(--mg-dark)' }}>{count || 'ไป!'}</div>
            </div>
          )}
          {stage === 'play' && (
            <>
              {kind === 'tap' && <TapRace pct={pct} t={1 - left / info.secs} onTap={() => { add(1); sfx('tap') }} />}
              {kind === 'math' && <MathQuiz score={score} onAnswer={(ok) => { add(ok ? 1 : 0); sfx(ok ? 'good' : 'bad') }} onEnd={() => setStage('done')} />}
              {kind === 'catch' && <CatchCoins onCatch={add} score={score} />}
              {kind === 'memory' && <Memory score={score} onPair={() => { add(1); sfx('good') }} onAll={() => setStage('done')} />}
              {kind === 'timing' && <Timing onHit={(ok) => { add(ok ? 1 : 0); sfx(ok ? 'heart' : 'bad') }} onEnd={() => setStage('done')} />}
            </>
          )}
          {stage === 'done' && (
            <div className="popin flex flex-col items-center gap-2 py-4">
              <div className="flex items-end gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`popin text-5xl ${i === 1 ? '-translate-y-2 text-6xl' : ''} ${i < stars ? '' : 'opacity-25 grayscale'}`} style={{ animationDelay: `${0.15 + i * 0.18}s` }}>⭐</span>
                ))}
              </div>
              <span className="font-display text-3xl text-[#3a2433]">{pct >= 0.8 ? 'สุดยอด! 🏆' : pct >= 0.5 ? 'ทำได้ดี! 👍' : 'ไม่เป็นไรนะ 😅'}</span>
              <div className="mt-1 w-full max-w-64">
                <div className="h-3 overflow-hidden rounded-full bg-black/10">
                  <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: 'var(--mg)', animation: 'grow .8s ease-out both' }} />
                </div>
                <div className="mt-1 text-sm text-[#7a5a66]">ได้ <b className="font-display text-[#3a2433]">{score}</b> / {target} คะแนน</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** วงเวลาถอยหลัง (แดงกะพริบเมื่อเหลือ ≤ 3 วิ) */
function TimerRing({ left, total }: { left: number; total: number }) {
  const r = 20, c = 2 * Math.PI * r
  const low = left <= 3
  return (
    <div className={`relative h-14 w-14 shrink-0 ${low ? 'blink' : ''}`}>
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="rgba(255,255,255,.92)" stroke="rgba(0,0,0,.12)" strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={low ? '#ff5a6e' : '#ffd166'} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} style={{ transition: 'stroke-dashoffset .1s linear' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-display text-xl ${low ? 'text-[#e0405a]' : 'text-[#3a2433]'}`}>{Math.ceil(left)}</span>
    </div>
  )
}

function TapRace({ pct, t, onTap }: { pct: number; t: number; onTap: () => void }) {
  const [hits, setHits] = useState<{ id: number; x: number; y: number }[]>([])
  const rival = Math.min(1, t * 0.82)
  const lead = pct >= rival
  const runner = (p: number) => `calc(${p * 78}% + 4%)`
  const stands = bgImage('racetrack')
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className={`rounded-full px-3 py-0.5 font-display ${lead ? 'bg-[#d6f5e3] text-[#2f8f5a]' : 'bg-[#ffe0e5] text-[#c0505f]'}`}>{lead ? '🔥 นำอยู่!' : '💨 ตามให้ทัน!'}</span>
        <span className="font-display text-[#5a3443]">{Math.round(pct * 100)}%</span>
      </div>
      <button className="relative block h-56 w-full touch-manipulation select-none overflow-hidden rounded-2xl bg-[#d9744a] shadow-inner active:brightness-95"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setHits((h) => [...h.slice(-5), { id: e.timeStamp, x: e.clientX - r.left, y: e.clientY - r.top }])
          onTap()
        }}>
        {/* อัฒจันทร์ + ลู่วิ่ง */}
        {stands && <img src={stands} alt="" className="absolute inset-x-0 top-0 h-[34%] w-full object-cover object-[50%_30%]" draggable={false} />}
        <div className="absolute inset-x-0 top-[34%] h-1.5 bg-white" />
        {[66].map((y) => <div key={y} className="absolute inset-x-0 h-1 bg-white/80" style={{ top: `${y}%` }} />)}
        <div className="absolute right-[6%] top-[34%] h-full w-3 bg-[repeating-linear-gradient(0deg,#fff_0_10px,#222_10px_20px)]" />
        <span className="absolute right-[2%] top-[22%] text-2xl">🏁</span>
        {/* คู่แข่ง (เลนบน) */}
        <span className="absolute text-4xl opacity-80 transition-[left] duration-100 ease-linear" style={{ left: runner(rival), top: '38%', transform: 'scaleX(-1) translateX(50%)' }}>🏃‍♂️</span>
        {/* เรา (เลนล่าง) */}
        <span className="absolute text-5xl transition-[left] duration-150" style={{ left: runner(pct), top: '68%', transform: 'scaleX(-1) translateX(50%)' }}>🏃</span>
        <span className="absolute rounded-full bg-white px-1.5 text-xs font-bold text-[#c0505f]" style={{ left: runner(pct), top: '91%', transform: 'translateX(-50%)' }}>คุณ</span>
        {hits.map((h) => <span key={h.id} className="toast pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-display text-xl text-white drop-shadow" style={{ left: h.x, top: h.y, animationDuration: '.6s' }}>+1</span>)}
        <span className="blink absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-4 py-0.5 font-display text-lg text-white">👆 แตะ! แตะ! แตะ!</span>
      </button>
    </div>
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
  const [picked, setPicked] = useState<number | null>(null)
  const [n, setN] = useState(1)
  const [log, setLog] = useState<boolean[]>([])
  const board = bgImage('chalkboard')
  const answer = (v: number) => {
    if (flash !== null) return // ตอบแล้ว รอข้อถัดไป
    const ok = v === q.ans
    onAnswer(ok); setFlash(ok); setPicked(v); setLog((l) => [...l, ok])
    setTimeout(() => {
      setFlash(null); setPicked(null)
      if (n >= MATH_Q) return onEnd()
      setN(n + 1); setQ(make())
    }, ok ? 450 : 800)
  }
  return (
    <div>
      {/* ความคืบหน้ารายข้อ */}
      <div className="mb-3 flex justify-center gap-1.5">
        {Array.from({ length: MATH_Q }, (_, i) => (
          <span key={i} className={`h-2.5 flex-1 rounded-full ${i < log.length ? (log[i] ? 'bg-[#3fae78]' : 'bg-[#e0707f]') : i === log.length ? 'bg-[#ffd166]' : 'bg-black/10'}`} />
        ))}
      </div>
      {/* กระดานดำ */}
      <div key={n} className={`popin relative overflow-hidden rounded-2xl border-[6px] border-[#a7774a] bg-[#3d6b4f] py-7 font-display text-5xl text-white shadow-inner ${flash === false ? 'shake' : ''}`}
        style={board ? { backgroundImage: `url(${board})`, backgroundSize: '125%', backgroundPosition: '50% 45%' } : undefined}>
        <div className={`absolute inset-0 transition-colors ${flash === true ? 'bg-[#2f8f5a]/75' : flash === false ? 'bg-[#a8404f]/75' : 'bg-[#2f5a46]/35'}`} />
        <span className="absolute left-3 top-1.5 text-xs text-white/70">ข้อ {n}/{MATH_Q}</span>
        <span className="relative drop-shadow-[0_2px_0_rgba(0,0,0,.25)]">{q.q} = {flash === null ? '?' : <span className="text-[#ffd166]">{q.ans}</span>}</span>
        {flash !== null && <span className="popin absolute right-3 top-1.5 text-2xl">{flash ? '✅' : '❌'}</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {q.opts.map((o) => {
          const right = flash !== null && o === q.ans
          const wrong = flash === false && o === picked
          return (
            <button key={o} disabled={flash !== null} onClick={() => answer(o)}
              className={`rounded-2xl py-4 font-display text-3xl shadow-[0_4px_0_rgba(0,0,0,.12)] transition active:translate-y-0.5 active:shadow-none ${right ? 'bg-[#d6f5e3] text-[#2f8f5a] ring-4 ring-[#3fae78]' : wrong ? 'bg-[#ffe0e5] text-[#c0505f] ring-4 ring-[#e0707f]' : flash !== null ? 'bg-[#f3ebe6] text-[#b8a0a8]' : 'bg-white text-[#4a2c38] hover:bg-[#fff1e8]'}`}>{o}</button>
          )
        })}
      </div>
      <div className="mt-2 text-sm text-[#7a5a66]">✅ ถูก {score} ข้อ</div>
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
  const [pop, setPop] = useState<{ id: number; x: number; t: string; bad: boolean }[]>([])
  const [hit, setHit] = useState<{ n: number; bad: boolean }>({ n: 0, bad: false })
  useEffect(() => {
    let id = Date.now(), raf = 0, last = performance.now(), spawn = 0
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      spawn -= dt
      let next = itemsRef.current.map((it) => ({ ...it, y: it.y + it.v * dt }))
      if (spawn <= 0) { spawn = 0.45; next.push({ id: id++, x: 0.08 + Math.random() * 0.84, y: -0.1, bad: Math.random() < 0.25, v: 0.45 + Math.random() * 0.35 }) }
      const caught = next.filter((it) => it.y > 0.78 && it.y < 0.95 && Math.abs(it.x - xRef.current) < 0.13)
      caught.forEach((it) => {
        onCatch(it.bad ? -2 : 1)
        sfx(it.bad ? 'loss' : 'coin')
        setHit((h) => ({ n: h.n + 1, bad: it.bad }))
        setPop((p) => [...p.slice(-4), { id: it.id, x: it.x, t: it.bad ? '-2' : '+1', bad: it.bad }])
      })
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
  const bg = bgImage('city')
  return (
    <div ref={box} className="relative h-72 touch-none select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#bfe6ff] to-[#fef3d6] shadow-inner"
      onPointerMove={(e) => move(e.clientX)} onPointerDown={(e) => move(e.clientX)}>
      {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" draggable={false} />}
      <div className="absolute inset-x-0 bottom-0 h-[12%] bg-[#8a8a96]"><div className="mt-[3%] h-1 bg-[repeating-linear-gradient(90deg,#fff_0_18px,transparent_18px_36px)]" /></div>
      {hit.n > 0 && <div key={hit.n} className={`pointer-events-none absolute inset-0 ${hit.bad ? 'flash-red' : ''}`} />}
      {items.map((it) => (
        <span key={it.id} className="absolute -translate-x-1/2 text-3xl drop-shadow" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, transform: `translateX(-50%) rotate(${it.bad ? (it.y * 300) % 40 - 20 : 0}deg)` }}>{it.bad ? '🧾' : '🪙'}</span>
      ))}
      {pop.map((p) => <span key={p.id} className={`toast absolute -translate-x-1/2 font-display text-2xl drop-shadow ${p.bad ? 'text-[#e0405a]' : 'text-[#c98a00]'}`} style={{ left: `${p.x * 100}%`, top: '60%', animationDuration: '.9s' }}>{p.t}</span>)}
      <span key={`b${hit.n}`} className={`absolute text-5xl ${hit.n ? (hit.bad ? 'shake' : 'hop') : ''}`} style={{ left: `${x * 100}%`, top: '76%', marginLeft: '-0.6em' }}>🧺</span>
      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-3 py-0.5 font-display text-[#5a3443] shadow">🪙 {score}</span>
      <span className="absolute right-2 top-2 rounded-full bg-white/70 px-2 py-0.5 text-xs text-[#7a5a66]">หลบ 🧾 −2</span>
    </div>
  )
}

function Memory({ score, onPair, onAll }: { score: number; onPair: () => void; onAll: () => void }) {
  const [cards] = useState(() => {
    const e = ['🧸', '🎈', '🍭', '🐶', '🚗', '⭐']
    return [...e, ...e].sort(() => Math.random() - 0.5)
  })
  const [open, setOpen] = useState<number[]>([])
  const [got, setGot] = useState<number[]>([])
  const [miss, setMiss] = useState<number[]>([])
  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || got.includes(i)) return
    sfx('tap')
    const o = [...open, i]
    setOpen(o)
    if (o.length === 2) {
      if (cards[o[0]] === cards[o[1]]) {
        const g = [...got, ...o]
        setTimeout(() => { setGot(g); setOpen([]); onPair(); if (g.length === cards.length) setTimeout(onAll, 400) }, 250)
      } else {
        setTimeout(() => setMiss(o), 350)
        setTimeout(() => { setOpen([]); setMiss([]) }, 750)
      }
    }
  }
  return (
    <div>
      <div className="grid grid-cols-4 gap-2" style={{ perspective: 600 }}>
        {cards.map((c, i) => {
          const up = open.includes(i) || got.includes(i)
          const face: CSSProperties = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }
          return (
            <button key={i} onClick={() => flip(i)} className={`relative aspect-[3/4] active:scale-95 ${miss.includes(i) ? 'shake' : ''}`}>
              <div className="absolute inset-0 transition-transform duration-300" style={{ transformStyle: 'preserve-3d', transform: up ? 'rotateY(0)' : 'rotateY(180deg)' }}>
                <div className={`absolute inset-0 flex items-center justify-center rounded-2xl text-4xl shadow ${got.includes(i) ? 'bg-[#d6f5e3] ring-2 ring-[#3fae78]' : 'bg-white'}`} style={face}>{c}</div>
                <div className="absolute inset-0 rounded-2xl bg-cover bg-center shadow"
                  style={{ ...face, transform: 'rotateY(180deg)', backgroundImage: `url(${cardBack})` }} />
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: cards.length / 2 }, (_, i) => <span key={i} className={`h-2.5 w-6 rounded-full ${i < score ? 'bg-[#3fae78]' : 'bg-black/10'}`} />)}
      </div>
    </div>
  )
}

function Timing({ onHit, onEnd }: { onHit: (ok: boolean) => void; onEnd: () => void }) {
  const [x, setX] = useState(0)
  const [tries, setTries] = useState(0)
  const [flash, setFlash] = useState<null | boolean>(null)
  const [log, setLog] = useState<boolean[]>([])
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
    onHit(ok); setFlash(ok); setLog((l) => [...l, ok])
    setTimeout(() => {
      setFlash(null)
      const n = tries + 1
      setTries(n)
      zone.current = { a: 0.15 + Math.random() * 0.6, w: Math.max(0.09, 0.16 - n * 0.03) }
      if (n >= 3) setTimeout(onEnd, 300)
    }, 600)
  }
  const z = zone.current
  const park = bgImage('love')
  return (
    <button onPointerDown={tap} className="relative block w-full touch-manipulation select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff1f4] to-[#ffe0e8] p-5 shadow-inner">
      {park && <img src={park} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/45 to-white/70" />
      <div className="relative mb-4 flex justify-center gap-3">
        {[0, 1, 2].map((i) => <span key={i} className={`text-3xl ${i < log.length ? 'popin' : 'opacity-70'}`}>{i < log.length ? (log[i] ? '💘' : '💔') : '🤍'}</span>)}
      </div>
      <div className={`relative h-16 rounded-full bg-[#f3dde4] shadow-inner ${flash === false ? 'shake' : ''}`}>
        <div className={`absolute inset-y-1 rounded-full transition-[left,width] duration-300 ${flash === true ? 'bg-[#3fae78]' : 'bg-[#f6a6b8]'}`}
          style={{ left: `${z.a * 100}%`, width: `${z.w * 100}%`, boxShadow: '0 0 16px 2px rgba(246,166,184,.9)' }} />
        <div className="absolute inset-y-2 w-0.5 bg-white/80" style={{ left: `${(z.a + z.w / 2) * 100}%` }} />
        <span className={`absolute top-1/2 text-5xl ${flash === true ? 'scale-125' : ''}`} style={{ left: `${x * 100}%`, transform: 'translate(-50%, -50%)' }}>💓</span>
      </div>
      <div className="relative mt-4 font-display text-xl text-[#5a3443] drop-shadow-[0_1px_0_#fff]">
        {flash === true ? '💘 ใช่เลย!' : flash === false ? '💦 พลาด!' : '👆 แตะตอนอยู่ในโซนชมพู!'}
      </div>
    </button>
  )
}
