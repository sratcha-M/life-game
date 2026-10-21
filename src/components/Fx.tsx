import { useMemo } from 'react'

export type FxKind = 'confetti' | 'hearts' | 'coins' | 'rain' | 'stars'

const SETS: Record<FxKind, { items: string[]; dir: 'up' | 'down'; n: number }> = {
  confetti: { items: ['🎉', '✨', '🎊', '⭐', '💫'], dir: 'down', n: 26 },
  hearts: { items: ['💕', '💗', '💖', '❤️'], dir: 'up', n: 18 },
  coins: { items: ['🪙', '💰', '💵'], dir: 'down', n: 22 },
  rain: { items: ['💧', '💧', '🌧️'], dir: 'down', n: 30 },
  stars: { items: ['⭐', '🌟', '✨'], dir: 'up', n: 16 },
}

/** อนุภาคอีโมจิลอย/ตก ทับฉาก (เล่นครั้งเดียวต่อ key) */
export function Fx({ kind }: { kind: FxKind }) {
  const set = SETS[kind]
  const parts = useMemo(() => Array.from({ length: set.n }, (_, i) => ({
    i, e: set.items[i % set.items.length],
    x: Math.random() * 100, d: Math.random() * 0.8, t: 1.6 + Math.random() * 1.4, s: 18 + Math.random() * 22, r: Math.random() * 360,
  })), [set])
  return (
    <div className="pointer-events-none absolute inset-0 z-[35] overflow-hidden">
      {parts.map((p) => (
        <span key={p.i} className={set.dir === 'up' ? 'fx-up' : 'fx-down'}
          style={{ left: `${p.x}%`, fontSize: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.t}s`, ['--r' as string]: `${p.r}deg` }}>
          {p.e}
        </span>
      ))}
    </div>
  )
}
