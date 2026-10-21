import type { ReactNode } from 'react'
import type { BgId } from '../game/types'

// ภาพที่ gen มาแล้ว (ใส่ไฟล์ src/assets/bg/<id>.webp แล้วเพิ่มในนี้ได้เลย)
const IMAGES = import.meta.glob('../assets/bg/*.webp', { eager: true, import: 'default' }) as Record<string, string>
export const bgImage = (id: string) => IMAGES[`../assets/bg/${id}.webp`]
const PIXEL: string[] = []

const W = 1600, H = 900

function Sky({ top, bottom, id }: { top: string; bottom: string; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </>
  )
}

function Clouds({ y = 120, color = '#fff', opacity = 0.85 }: { y?: number; color?: string; opacity?: number }) {
  return (
    <g fill={color} opacity={opacity}>
      {[0, 1, 2].map((i) => (
        <g key={i} className="cloud" style={{ animationDuration: `${70 + i * 25}s`, animationDelay: `${-i * 30}s` }}>
          <g transform={`translate(${-200} ${y + i * 70})`}>
            <ellipse cx="0" cy="0" rx="90" ry="34" />
            <ellipse cx="60" cy="-20" rx="60" ry="40" />
            <ellipse cx="-50" cy="-10" rx="50" ry="30" />
          </g>
        </g>
      ))}
    </g>
  )
}

function Tree({ x, y, s = 1, c = '#5aa86b' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-12" y="-20" width="24" height="120" fill="#8a5a3c" />
      <circle cx="0" cy="-60" r="80" fill={c} />
      <circle cx="-55" cy="-20" r="55" fill={c} />
      <circle cx="55" cy="-25" r="58" fill={c} />
      <circle cx="-20" cy="-90" r="40" fill="#fff" opacity=".08" />
    </g>
  )
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q 10 -120 -10 -260" stroke="#8c6a46" strokeWidth="16" fill="none" />
      {[-60, -20, 20, 60, 100, 140].map((a) => (
        <path key={a} d="M-10 -260 q 70 -30 130 30 q -70 -10 -130 -30" fill="#4f9a5c" transform={`rotate(${a} -10 -260)`} />
      ))}
    </g>
  )
}

function Window({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill="#e8dcc6" rx="6" />
      <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{children}</svg>
      <path d={`M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w}`} stroke="#e8dcc6" strokeWidth="10" />
    </g>
  )
}

const scenes: Record<BgId, () => ReactNode> = {
  hospital: () => (
    <>
      <rect width={W} height={H} fill="#dff0ea" />
      <rect y="640" width={W} height="260" fill="#c4dcd5" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 140} y="640" width="138" height="260" fill="none" stroke="#b3cfc7" strokeWidth="2" />)}
      <Window x={980} y={150} w={420} h={300}>
        <rect width="420" height="300" fill="#a8d8f0" />
        <circle cx="330" cy="70" r="40" fill="#fff3b0" />
        <Tree x={80} y={300} s={0.8} />
      </Window>
      <rect x="140" y="80" width="40" height="560" fill="#f3b8c7" opacity=".8" />
      <rect x="180" y="80" width="40" height="560" fill="#f7c9d5" opacity=".8" />
      <rect x="100" y="70" width="560" height="12" rx="6" fill="#9bb" />
      <g transform="translate(420 160)"><rect width="120" height="120" rx="14" fill="#fff" /><path d="M48 20h24v28h28v24h-28v28h-24v-28h-28v-24h28z" fill="#ef6f7f" /></g>
    </>
  ),
  home: () => (
    <>
      <rect width={W} height={H} fill="#d9a873" />
      {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={i * 80} y="0" width="78" height="680" fill={i % 2 ? '#d29f69' : '#ddae7a'} />)}
      <rect y="680" width={W} height="220" fill="#a8703f" />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} y={680 + i * 38} width={W} height="2" fill="#8f5c31" />)}
      <Window x={560} y={130} w={480} h={320}>
        <rect width="480" height="320" fill="#bfe6ff" />
        <Tree x={90} y={330} s={0.9} c="#69b56f" />
        <Tree x={380} y={360} s={1.1} c="#5aa86b" />
      </Window>
      <g transform="translate(180 150)"><rect width="180" height="130" fill="#7a4b2a" rx="6" /><rect x="12" y="12" width="156" height="106" fill="#f6e3c3" /><circle cx="70" cy="60" r="22" fill="#e6b48d" /><circle cx="110" cy="62" r="20" fill="#e6b48d" /></g>
      <g transform="translate(1200 380)"><rect width="260" height="300" fill="#8a5a36" rx="8" />{[0, 1, 2].map((i) => <rect key={i} x="14" y={20 + i * 95} width="232" height="80" fill="#6d4426" rx="4" />)}<rect x="30" y="35" width="20" height="60" fill="#e76f51" /><rect x="55" y="40" width="18" height="55" fill="#2a9d8f" /><rect x="78" y="30" width="22" height="65" fill="#e9c46a" /><circle cx="190" cy="150" r="30" fill="#7fbf7f" /></g>
      <g transform="translate(800 40)"><path d="M0 0 v60" stroke="#444" strokeWidth="6" /><ellipse cx="0" cy="70" rx="160" ry="14" fill="#555" opacity=".6" /></g>
    </>
  ),
  village: () => (
    <>
      <Sky top="#7cc6f2" bottom="#d8f1ff" id="vsky" />
      <circle cx="1350" cy="150" r="70" fill="#fff4b8" />
      <Clouds y={110} />
      <path d="M0 470 Q200 330 420 440 Q620 300 860 450 Q1100 320 1320 430 Q1480 360 1600 420 V560 H0Z" fill="#8cc3a0" />
      <rect y="520" width={W} height="380" fill="#9fd36b" />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M0 ${560 + i * 40} H${W}`} stroke="#86bf55" strokeWidth="6" />)}
      {Array.from({ length: 40 }).map((_, i) => <path key={i} d={`M${(i * 97) % W} ${600 + ((i * 53) % 260)} l-6 -22 M${(i * 97) % W} ${600 + ((i * 53) % 260)} l6 -22`} stroke="#5f9e3b" strokeWidth="4" />)}
      <g transform="translate(1060 270)">
        <path d="M-40 120 L180 -30 L400 120 Z" fill="#9a4b32" />
        <rect x="0" y="120" width="360" height="160" fill="#b88554" />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 40} y="120" width="2" height="160" fill="#93653a" />)}
        <rect x="140" y="170" width="80" height="110" fill="#6b4226" />
        {[0, 120, 240, 350].map((x) => <rect key={x} x={x} y="280" width="12" height="90" fill="#7a4f2d" />)}
      </g>
      <Palm x={180} y={560} s={1.1} />
      <Palm x={320} y={540} s={0.85} />
      <Tree x={900} y={520} s={0.9} c="#4e9a5e" />
    </>
  ),
  classroom: () => (
    <>
      <rect width={W} height={H} fill="#f4ecd2" />
      <rect y="650" width={W} height="250" fill="#c99a6b" />
      <rect x="260" y="110" width="760" height="360" rx="10" fill="#7a5233" />
      <rect x="280" y="130" width="720" height="320" fill="#2f5a46" />
      <path d="M340 220 q60 -40 120 0 t120 0" stroke="#e8f0e0" strokeWidth="6" fill="none" opacity=".8" />
      <text x="360" y="330" fill="#e8f0e0" fontSize="52" fontFamily="Mitr" opacity=".85">ก ข ค  1 + 1 = 2</text>
      <rect x="280" y="450" width="720" height="16" fill="#8c6646" />
      <g transform="translate(1180 120)"><circle r="56" fill="#fff" stroke="#555" strokeWidth="8" /><path d="M0 0 V-34 M0 0 H24" stroke="#333" strokeWidth="6" strokeLinecap="round" /></g>
      <Window x={1120} y={260} w={360} h={260}><rect width="360" height="260" fill="#bfe6ff" /><Tree x={180} y={300} s={0.8} /></Window>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${150 + i * 360} 690)`}><rect width="240" height="26" fill="#d6ad7a" /><rect x="10" y="26" width="14" height="120" fill="#777" /><rect x="216" y="26" width="14" height="120" fill="#777" /></g>
      ))}
    </>
  ),
  schoolyard: () => (
    <>
      <Sky top="#8fd3ff" bottom="#e6f6ff" id="ssky" />
      <Clouds y={90} />
      <g transform="translate(120 160)">
        <rect width="1000" height="420" fill="#f2e3c6" />
        <rect y="-30" width="1000" height="40" fill="#c0563f" />
        {Array.from({ length: 3 }).map((_, r) => Array.from({ length: 8 }).map((_, c) => (
          <rect key={`${r}${c}`} x={40 + c * 120} y={40 + r * 125} width="80" height="80" fill="#9fd0ea" stroke="#fff" strokeWidth="6" />
        )))}
      </g>
      <rect y="580" width={W} height="320" fill="#c9a36d" />
      <path d="M0 640 H1600" stroke="#fff" strokeWidth="6" opacity=".5" />
      <g transform="translate(1300 100)"><rect x="0" width="10" height="480" fill="#bbb" /></g>
      <Tree x={1380} y={560} s={1.3} c="#4f9e5d" />
    </>
  ),
  campus: () => (
    <>
      <Sky top="#f6b38e" bottom="#ffe6c7" id="csky" />
      <Clouds y={100} color="#fff3e8" />
      <g transform="translate(380 180)">
        <path d="M-40 90 L420 -40 L880 90 Z" fill="#a8574a" />
        <rect y="90" width="840" height="360" fill="#efe4d0" />
        {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={40 + i * 120} y="110" width="40" height="320" fill="#fff" stroke="#d8ccb6" strokeWidth="3" />)}
        <rect x="360" y="290" width="120" height="160" fill="#7a4b33" rx="60" />
      </g>
      <rect y="630" width={W} height="270" fill="#82c26d" />
      <path d="M700 900 L780 630 H820 L900 900 Z" fill="#e8d9b8" />
      <Tree x={160} y={640} s={1.3} c="#5a9e58" />
      <Tree x={1420} y={650} s={1.2} c="#6aa85f" />
    </>
  ),
  city: () => (
    <>
      <Sky top="#2a2f5c" bottom="#e47d6c" id="cisky" />
      <circle cx="1200" cy="420" r="90" fill="#ffc28a" opacity=".85" />
      {[[40, 260, 160], [220, 180, 120], [360, 320, 180], [560, 140, 140], [720, 240, 200], [940, 200, 130], [1090, 300, 170], [1280, 160, 150], [1450, 260, 150]].map(([x, h, w], i) => (
        <g key={i}>
          <rect x={x} y={650 - h - 200} width={w} height={h + 200} fill={i % 2 ? '#3a3f6e' : '#454a7d'} />
          {Array.from({ length: Math.floor((h + 180) / 50) }).map((_, r) => Array.from({ length: Math.floor(w / 40) }).map((_, c) => (
            <rect key={`${r}${c}`} x={x + 12 + c * 40} y={650 - h - 180 + r * 50} width="18" height="24" fill="#ffd98a" opacity={(r * 7 + c * 3 + i) % 4 ? 0.85 : 0.15} />
          )))}
        </g>
      ))}
      <rect y="600" width={W} height="40" fill="#5b5f86" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 140 + 40} y="640" width="30" height="260" fill="#4a4e74" />)}
      <g transform="translate(300 560)"><rect width="520" height="44" rx="20" fill="#e9eef5" /><rect y="14" width="520" height="12" fill="#2f8f6a" />{Array.from({ length: 9 }).map((_, i) => <rect key={i} x={24 + i * 54} y="4" width="36" height="12" rx="3" fill="#9fd0ea" />)}</g>
      <rect y="760" width={W} height="140" fill="#3a3d5c" />
    </>
  ),
  office: () => (
    <>
      <rect width={W} height={H} fill="#e9edf3" />
      <Window x={240} y={100} w={1120} h={440}>
        <rect width="1120" height="440" fill="#9cc7ea" />
        {[[30, 200], [180, 140], [300, 260], [460, 120], [620, 220], [780, 160], [930, 240]].map(([x, h], i) => <rect key={i} x={x} y={440 - h} width="120" height={h} fill={i % 2 ? '#7ea6c9' : '#6c94b8'} />)}
      </Window>
      <rect y="620" width={W} height="280" fill="#cfd6e0" />
      <rect x="0" y="600" width={W} height="40" fill="#8d6e55" />
      <g transform="translate(140 470)"><rect width="230" height="140" rx="8" fill="#2d3340" /><rect x="10" y="10" width="210" height="110" fill="#5ab0e8" /><rect x="100" y="140" width="30" height="30" fill="#555" /></g>
      <g transform="translate(1300 420)"><path d="M0 180 L20 60 H90 L110 180Z" fill="#c98a5a" /><circle cx="55" cy="40" r="50" fill="#62a56c" /><circle cx="20" cy="70" r="30" fill="#5a9a62" /><circle cx="90" cy="70" r="32" fill="#6ab074" /></g>
    </>
  ),
  park: () => (
    <>
      <Sky top="#f0905f" bottom="#ffd6a0" id="psky" />
      <circle cx="800" cy="470" r="110" fill="#ffe7a8" opacity=".9" />
      <rect y="500" width={W} height="400" fill="#6fae7a" />
      <ellipse cx="800" cy="560" rx="620" ry="70" fill="#f5b78a" opacity=".85" />
      <ellipse cx="800" cy="560" rx="620" ry="70" fill="none" stroke="#5b9e68" strokeWidth="10" />
      <Tree x={150} y={560} s={1.4} c="#4b8f5a" />
      <Tree x={1450} y={580} s={1.5} c="#4f9660" />
      {[420, 1180].map((x) => <g key={x}><rect x={x} y="340" width="10" height="300" fill="#444" /><circle cx={x + 5} cy="330" r="22" fill="#ffe9a8" /><circle cx={x + 5} cy="330" r="60" fill="#ffe9a8" opacity=".2" /></g>)}
      <g transform="translate(620 700)"><rect width="360" height="20" rx="6" fill="#8b5a3c" /><rect y="-50" width="360" height="16" rx="6" fill="#8b5a3c" /><rect x="20" y="20" width="14" height="60" fill="#555" /><rect x="326" y="20" width="14" height="60" fill="#555" /></g>
    </>
  ),
  wedding: () => (
    <>
      <rect width={W} height={H} fill="#fbeee6" />
      <rect y="660" width={W} height="240" fill="#e9cdb8" />
      <path d="M380 660 V260 Q800 -20 1220 260 V660" fill="none" stroke="#d4a640" strokeWidth="26" />
      {Array.from({ length: 22 }).map((_, i) => {
        const t = i / 21, a = Math.PI * (1 - t)
        return <circle key={i} cx={800 + Math.cos(a) * 420} cy={300 - Math.sin(a) * 260 + 0} r="22" fill={i % 2 ? '#f6a6b8' : '#fff'} />
      })}
      {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M${100 + i * 110} 0 v${120 + (i % 3) * 40}`} stroke="#f3d27a" strokeWidth="4" />)}
      {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={100 + i * 110} cy={120 + (i % 3) * 40} r="14" fill="#fff5c8" />)}
      <g opacity=".85">{[[160, 620], [1440, 620]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><rect x="-50" y="-10" width="100" height="120" fill="#d4a640" />{[-30, 0, 30].map((dx) => <circle key={dx} cx={dx} cy="-30" r="34" fill="#f6a6b8" />)}</g>)}</g>
    </>
  ),
  garden: () => (
    <>
      <Sky top="#ffb878" bottom="#ffe4b8" id="gsky" />
      <Clouds y={120} color="#fff1e0" opacity={0.7} />
      <path d="M0 460 Q400 360 800 440 T1600 420 V600 H0Z" fill="#a7c98a" />
      <rect y="560" width={W} height="340" fill="#8bbf6a" />
      <g transform="translate(80 260)"><rect width="520" height="320" fill="#b98a5a" /><path d="M-40 0 L260 -140 L560 0Z" fill="#8e4a35" /><rect x="40" y="80" width="140" height="120" fill="#ffe7b0" /><rect x="320" y="120" width="120" height="200" fill="#6b4226" /></g>
      {Array.from({ length: 6 }).map((_, i) => <g key={i} transform={`translate(${720 + i * 140} 700)`}><rect x="-50" y="0" width="100" height="40" fill="#7a4b2d" />{[-30, 0, 30].map((dx) => <circle key={dx} cx={dx} cy="-6" r="18" fill={i % 2 ? '#5a9e4b' : '#77b45a'} />)}</g>)}
      <Tree x={1420} y={570} s={1.3} c="#5d9b4f" />
    </>
  ),
  festival: () => (
    <>
      <Sky top="#1b1f45" bottom="#4a3a6e" id="fsky" />
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={(i * 173) % W} cy={(i * 97) % 380} r={(i % 3) + 1.5} fill="#fff" style={{ animation: `twinkle ${2 + (i % 4)}s ${i * 0.2}s infinite` }} />)}
      <rect y="600" width={W} height="300" fill="#2f4a3a" />
      <Tree x={160} y={620} s={1.4} c="#2c5a3e" />
      <Tree x={1450} y={630} s={1.5} c="#2c5a3e" />
      <path d="M0 200 Q400 320 800 220 T1600 230" stroke="#555" strokeWidth="3" fill="none" />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = i * 106 + 20, y = 200 + Math.sin(i * 0.8) * 50 + 40
        const c = ['#ffcf5c', '#ff8fa3', '#8fd3ff', '#b6f09c'][i % 4]
        return <g key={i}><circle cx={x} cy={y} r="14" fill={c} /><circle cx={x} cy={y} r="40" fill={c} opacity=".18" /></g>
      })}
      <g transform="translate(700 640)"><rect width="200" height="16" fill="#8b5a3c" /><rect x="40" y="-60" width="120" height="60" rx="10" fill="#fff0f3" /><rect x="40" y="-60" width="120" height="16" rx="8" fill="#ff8fa3" />{[60, 100, 140].map((x) => <g key={x}><rect x={x - 3} y="-90" width="6" height="30" fill="#ffd166" /><ellipse cx={x} cy="-96" rx="5" ry="9" fill="#ffb347" /></g>)}</g>
    </>
  ),
  sky: () => (
    <>
      <Sky top="#ff9a8b" bottom="#ffe5b4" id="eksky" />
      <circle cx="800" cy="620" r="180" fill="#fff1c1" opacity=".9" />
      <Clouds y={160} color="#fff" opacity={0.6} />
      <path d="M0 700 Q400 620 800 690 T1600 680 V900 H0Z" fill="#f1b48a" />
    </>
  ),
}

export function Background({ id }: { id: BgId | 'title' }) {
  const img = bgImage(id)
  if (img)
    return (
      <img src={img} alt="" draggable={false}
        className="kenburns absolute inset-0 h-full w-full object-cover"
        style={{ imageRendering: PIXEL.includes(id) ? 'pixelated' : undefined }} />
    )
  if (id === 'title') return null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {scenes[id]()}
    </svg>
  )
}
