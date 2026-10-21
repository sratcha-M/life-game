import { useEffect, useRef, useState } from 'react'
import type { Choice } from '../game/types'

export function splitIcon(text: string, i = 0) {
  const m = text.match(/^(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)\s*(.*)$/u)
  return m ? { icon: m[1], label: m[2] } : { icon: ['🌟', '💭', '🍀'][i % 3], label: text }
}

type Dir = 'left' | 'right' | 'up'
const DIRS: Dir[] = ['left', 'right', 'up']
const ARROW: Record<Dir, string> = { left: '←', right: '→', up: '↑' }

/**
 * การ์ดปัดแบบ Reigns: ปัดซ้าย = ทางเลือกแรก, ขวา = ทางเลือกที่สอง, ขึ้น = ทางเลือกที่สาม
 */
export function SwipeChoice({ speaker, text, choices, fill, lockOf, onPick, onLocked }: {
  speaker?: string
  text: string
  choices: Choice[]
  fill: (t: string) => string
  lockOf: (c: Choice) => string | null
  onPick: (c: Choice) => void
  onLocked: (reason: string) => void
}) {
  const [d, setD] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)
  const [gone, setGone] = useState<Dir | null>(null)
  const start = useRef({ x: 0, y: 0 })
  const byDir = (dir: Dir) => choices[DIRS.indexOf(dir)]

  const hover: Dir | null = gone ?? (d.y < -50 && Math.abs(d.y) > Math.abs(d.x) && choices[2] ? 'up' : d.x < -40 ? 'left' : d.x > 40 ? 'right' : null)

  const commit = (dir: Dir) => {
    const c = byDir(dir)
    if (!c) return reset()
    const lock = lockOf(c)
    if (lock) { onLocked(lock); return reset() }
    setGone(dir)
    setD(dir === 'left' ? { x: -700, y: 60 } : dir === 'right' ? { x: 700, y: 60 } : { x: 0, y: -800 })
    setTimeout(() => onPick(c), 230)
  }
  const reset = () => setD({ x: 0, y: 0 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gone) return
      if (e.key === 'ArrowLeft') commit('left')
      if (e.key === 'ArrowRight') commit('right')
      if (e.key === 'ArrowUp' && choices[2]) commit('up')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const hc = hover ? byDir(hover) : null
  const hIcon = hc ? splitIcon(fill(hc.text)) : null
  const hLocked = hc ? lockOf(hc) : null

  return (
    <div className="flex w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative w-[min(88vw,25rem)] sm:w-[min(70vw,30rem)] lg:w-[min(60vw,36rem)] touch-none select-none"
        style={{
          transform: `translate(${d.x}px, ${d.y}px) rotate(${d.x / 18}deg)`,
          transition: drag ? 'none' : 'transform .25s cubic-bezier(.2,.8,.3,1.2)',
          cursor: drag ? 'grabbing' : 'grab',
        }}
        onPointerDown={(e) => { if (gone) return; setDrag(true); start.current = { x: e.clientX - d.x, y: e.clientY - d.y }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId) }}
        onPointerMove={(e) => drag && setD({ x: e.clientX - start.current.x, y: Math.min(40, e.clientY - start.current.y) })}
        onPointerUp={() => {
          if (!drag) return
          setDrag(false)
          if (d.y < -90 && Math.abs(d.y) > Math.abs(d.x) && choices[2]) commit('up')
          else if (d.x < -90) commit('left')
          else if (d.x > 90) commit('right')
          else reset()
        }}
        onPointerCancel={() => { setDrag(false); reset() }}
      >
        <div className="popin relative overflow-hidden rounded-[28px] border-4 border-white bg-white/95 px-6 pb-6 pt-5 text-center shadow-2xl">
          {speaker && <div className="mb-1 font-display text-sm tracking-wide text-[#e0707f]">{speaker}</div>}
          <p className="font-display text-xl leading-snug text-[#3a2433] sm:text-2xl">{text}</p>
          {/* ทางเลือกที่กำลังปัดไป */}
          <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[24px] transition-opacity ${hLocked ? 'bg-[#3a3346]/92' : 'bg-[#fff1f4]/95'}`}
            style={{ opacity: hc ? Math.min(1, (Math.abs(d.x) + Math.abs(d.y)) / 120) : 0 }}>
            <span className="text-6xl">{hLocked ? '🔒' : hIcon?.icon}</span>
            <span className={`px-4 font-display text-xl ${hLocked ? 'text-white/80' : 'text-[#4a2c38]'}`}>{hIcon?.label}</span>
            {hLocked && <span className="text-sm text-[#ffd6de]">{hLocked}</span>}
          </div>
        </div>
      </div>
      {/* ปุ่มกดแทนการปัด */}
      <div className="flex w-[min(96vw,32.5rem)] sm:w-[min(80vw,36rem)] lg:w-[min(80vw,44rem)] items-stretch justify-center gap-2">
        {DIRS.filter((dir) => byDir(dir)).map((dir) => {
          const c = byDir(dir)!
          const { icon, label } = splitIcon(fill(c.text))
          const locked = lockOf(c)
          return (
            <button key={dir} onClick={() => commit(dir)}
              className={`popin flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-center shadow-lg sm:py-3 lg:gap-1 lg:py-4 transition active:scale-95 ${dir === 'up' ? 'order-2' : dir === 'right' ? 'order-3' : 'order-1'} ${locked ? 'bg-[#3a3346]/85 text-white/60' : 'bg-white/90 text-[#4a2c38] hover:bg-white'}`}>
              <span className={`text-2xl sm:text-3xl lg:text-4xl ${locked ? 'grayscale' : ''}`}>{locked ? '🔒' : icon}</span>
              <span className="line-clamp-2 font-display text-[.8125rem] leading-tight sm:text-base lg:text-lg">{label}</span>
              <span className="text-[.75rem] text-[#c0909c]">{ARROW[dir]}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-white/80 drop-shadow">ปัดการ์ด หรือแตะปุ่มด้านบน</p>
    </div>
  )
}
