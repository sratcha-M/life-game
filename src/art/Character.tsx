import type { CharId, Expr, GameState } from '../game/types'

type HairStyle = 'short' | 'spiky' | 'long' | 'bob' | 'tied' | 'bun' | 'bald' | 'tuft' | 'clip' | 'shaved'
type Outfit =
  | 'uniform' | 'uniformGirl' | 'shirt' | 'suit' | 'blouse' | 'onesie' | 'flower' | 'coat'
  | 'hoodie' | 'jersey' | 'chef' | 'mohom' | 'cardigan' | 'tee' | 'jacket' | 'khaki' | 'wedding' | 'robe' | 'nun'

interface Look {
  skin: string
  hair: string
  style: HairStyle
  outfit: Outfit
  color: string
  glasses?: boolean
  freckles?: boolean
}

export const NAMES: Record<CharId, string> = {
  me: '', mom: 'แม่', dad: 'พ่อ', yai: 'ยาย', ton: 'ต้น', kru: 'ครูสมศรี', fah: 'ฟ้า', boss: 'หัวหน้า', kid: 'น้ำ', nong: 'น้องฝน', jay: 'เจ', coco: 'โกโก้',
}

// ฉากที่ 'kid' ไม่ใช่ลูกของผู้เล่น (หลาน / นักเรียน) → เด็ก 7 ขวบเสมอ และใช้ชื่อตามบทบาทนั้น
const OTHER_KID_SCENES: Record<string, string> = { ev_grandkid: 'หลานน้ำ', life_teach_grand: 'หลานน้ำ', job_teacher_a: 'นักเรียน' }

/** ชื่อบนป้าย: 'kid' ส่วนใหญ่คือลูกของผู้เล่น (เรียกเราว่าพ่อแม่) → ไม่ใช่ "หลาน" */
export const kidName = (sceneId?: string) => (sceneId && OTHER_KID_SCENES[sceneId]) || 'น้ำ'

/** อายุของตัวละครแต่ละตัว เทียบกับอายุผู้เล่น */
export function charAge(id: CharId, playerAge: number, s?: GameState, sceneId?: string) {
  switch (id) {
    case 'mom': return playerAge + 27
    case 'dad': return playerAge + 29
    case 'yai': return playerAge + 58
    case 'kru': return 34
    case 'boss': return 52
    case 'kid': {
      // ลูกโตตามจริง: เกิดหนึ่งปีหลังตัดสินใจมีลูก · ลูกบุญธรรมรับมาตอนราว 4 ขวบ
      const at = s?.flagAt?.kid
      if (at === undefined || (sceneId && OTHER_KID_SCENES[sceneId])) return 7
      return Math.max(0, playerAge - at + (s!.flags.includes('adopted') ? 4 : -1))
    }
    case 'nong': return Math.max(0, playerAge - 6)
    case 'coco': return Math.max(0, playerAge - 8)
    default: return playerAge
  }
}

const CAREER_OUTFIT: Record<string, [Outfit, string]> = {
  doctor: ['coat', '#ffffff'], dev: ['hoodie', '#4a5b7a'], artist: ['tee', '#e98aa8'], musician: ['jacket', '#3a3550'],
  athlete: ['jersey', '#e2563d'], creator: ['tee', '#ffc94a'], chef: ['chef', '#ffffff'], teacher: ['khaki', '#c7b48a'],
  farmer: ['mohom', '#2f3c66'], office: ['suit', '#36405a'],
  nurse: ['coat', '#ffffff'], vet: ['coat', '#ffffff'], engineer: ['shirt', '#e8a33d'], pilot: ['suit', '#1f2d4d'],
  lawyer: ['suit', '#1c1c24'], civil: ['khaki', '#c7b48a'], police: ['khaki', '#6b5636'], actor: ['jacket', '#c0305a'],
  streamer: ['hoodie', '#2b2b40'], trader: ['suit', '#2d4a3e'], seller: ['tee', '#ff8a5c'], rider: ['jacket', '#2fae5a'],
}

function lookFor(id: CharId, age: number, s: GameState, bg: string): Look {
  const skin = '#f3cfae'
  const school = age >= 4 && age < 19
  switch (id) {
    case 'me': {
      const girl = s.gender === 'girl'
      // พระห่มจีวรสีกรัก · แม่ชีนุ่งขาวห่มขาว — ทั้งคู่โกนผม
      if (s.career === 'monk' && age >= 22) return { skin, hair: '#3a3330', style: 'shaved', outfit: girl ? 'nun' : 'robe', color: girl ? '#fbfaf5' : '#d9822b' }
      let outfit: Outfit = 'shirt'
      let color = girl ? '#f2a6c2' : '#7cb7e8'
      if (age < 3) { outfit = 'onesie'; color = '#ffe08a' }
      else if (school) outfit = girl ? 'uniformGirl' : 'uniform'
      else if (bg === 'wedding') { outfit = 'wedding'; color = '#f4ead6' }
      else if (age >= 60) { outfit = 'cardigan'; color = '#9fb98a' }
      else if (age >= 22 && s.career && CAREER_OUTFIT[s.career]) [outfit, color] = CAREER_OUTFIT[s.career]
      else if (age >= 19 && bg === 'campus') { outfit = 'uniform' }
      const style: HairStyle = age < 3 ? 'tuft' : girl ? (age < 13 ? 'bob' : age >= 60 ? 'bun' : 'long') : 'short'
      return { skin, hair: s.hair, style, outfit, color }
    }
    case 'mom': return { skin, hair: '#2a1c18', style: 'tied', outfit: 'blouse', color: '#f08fa5' }
    case 'dad': return { skin: '#e9bf98', hair: '#1f1a1a', style: 'short', outfit: 'shirt', color: '#5d8fc9', glasses: true }
    case 'yai': return { skin: '#ecc6a4', hair: '#d8d4d0', style: 'bun', outfit: 'flower', color: '#b34a6a' }
    case 'ton': {
      let outfit: Outfit = 'tee'
      if (school) outfit = 'uniform'
      else if (age >= 40) outfit = 'jacket'
      return { skin: '#e2b48c', hair: '#1c1412', style: 'spiky', outfit, color: '#4caf7d', freckles: true }
    }
    case 'fah': {
      if (s.flags.includes('mate')) {
        const boy = s.gender === 'girl'
        return { skin: '#efc6a2', hair: grayed(boy ? '#1d1a1a' : '#5a2d1f', age), style: boy ? 'short' : 'long', outfit: age >= 60 ? 'cardigan' : boy ? 'shirt' : 'blouse', color: boy ? '#3d6b8f' : '#c06c84', glasses: boy }
      }
      const boyFah = s.gender === 'girl'
      let outfit: Outfit = boyFah ? 'shirt' : 'blouse'
      if (school) outfit = boyFah ? 'uniform' : 'uniformGirl'
      else if (bg === 'wedding') outfit = 'wedding'
      else if (age >= 60) outfit = 'cardigan'
      return { skin: '#f6d6b8', hair: '#3a2a20', style: boyFah ? 'short' : 'clip', outfit, color: boyFah ? '#7fb3a8' : '#8ec5e8' }
    }
    case 'kru': return { skin, hair: '#241a16', style: 'bob', outfit: 'khaki', color: '#c7b48a', glasses: true }
    case 'boss': return { skin: '#e8c09c', hair: '#2a2420', style: 'bald', outfit: 'suit', color: '#2e3346', glasses: true }
    case 'kid': return { skin, hair: '#2a1c18', style: 'tied', outfit: 'tee', color: '#ff9e7a' }
    case 'nong': {
      let outfit: Outfit = 'blouse'
      if (age < 3) outfit = 'onesie'
      else if (school) outfit = 'uniformGirl'
      else if (age >= 60) outfit = 'cardigan'
      return { skin: '#f6d2b4', hair: '#3a2418', style: age < 3 ? 'tuft' : age < 13 ? 'tied' : age >= 55 ? 'bun' : 'long', outfit, color: age < 3 ? '#ffd1dc' : '#ffb067' }
    }
    case 'jay': {
      let outfit: Outfit = 'jacket'
      if (school) outfit = 'uniform'
      else if (age >= 22) outfit = 'suit'
      return { skin: '#e9c29e', hair: '#151018', style: 'short', outfit, color: '#4b3f8f', glasses: true }
    }
    case 'coco': return { skin, hair: '#000', style: 'bald', outfit: 'tee', color: '#000' }
  }
}

function grayed(hair: string, age: number) {
  if (age >= 62) return '#d9d6d2'
  if (age >= 48) return '#7d7470'
  return hair
}

// ภาพตัวละครจาก AI: src/assets/char/<ชื่อ>.webp เช่น me_girl_teen, me_boy_kid, mom, ton_teen
const SPRITES = import.meta.glob('../assets/char/*.webp', { eager: true, import: 'default' }) as Record<string, string>
// รูปขยาย 2 เท่าด้วย Real-ESRGAN (anime) — โหลดเฉพาะจอความละเอียดสูง จอธรรมดา/เน็ตช้ายังใช้ไฟล์เล็กเดิม
const SPRITES_HD = import.meta.glob('../assets/char/hd/*.webp', { eager: true, import: 'default' }) as Record<string, string>
// ภาพเก่าแบบพิกเซลที่ยังไม่มีภาพใหม่มาแทน — วางภาพใหม่ชื่อเดิมแล้วลบออกจากรายการนี้
const PIXEL_SPRITES: string[] = []
const stageKey = (age: number) => (age < 3 ? 'baby' : age < 13 ? 'kid' : age < 19 ? 'teen' : age < 60 ? 'adult' : 'elder')
/**
 * หาภาพตัวละคร — ลองภาพตามสีหน้าก่อน เช่น me_boy_adult_sad.webp ไม่มีค่อยใช้ภาพปกติ
 * (ภาพปกติทุกภาพยิ้ม จึงต้องมีภาพ _sad / _angry / _surprised แยกถึงจะไม่ยิ้มในฉากเศร้า)
 */
export function spriteFor(id: CharId, age: number, s: GameState, expr: Expr = 'neutral') {
  const st = stageKey(age)
  const other = s.gender === 'girl' ? 'boy' : 'girl'
  const robed = id === 'me' && s.career === 'monk' && age >= 22
  const keys = robed ? [...(st === 'elder' ? [`me_${s.gender === 'boy' ? 'boy_monk' : 'girl_nun'}_elder`] : []), `me_${s.gender === 'boy' ? 'boy_monk' : 'girl_nun'}`]
    : id === 'me' ? [...(age >= 19 && age < 22 ? [`me_${s.gender}_uni`] : []), ...(age >= 40 && age < 60 ? [`me_${s.gender}_middle`] : []), `me_${s.gender}_${st}`]
    : id === 'fah' && s.flags.includes('mate') ? [`fah_mate_${other}_${st}`, `fah_mate_${other}_adult`]
    : id === 'fah' ? [`fah_${other}_${st}`, `fah_${other}`]
    // ลูกโตแล้ว: ยังไม่มีภาพ kid_teen/kid_adult → ยืมภาพน้องฝน (หน้าคล้ายกัน ไม่เคยอยู่ฉากเดียวกันตอนโต) ไปก่อน
    : id === 'kid' && age >= 13 ? [`kid_${st}`, `nong_${st}`]
    : [...(age >= (id === 'ton' ? 45 : 58) ? [`${id}_elder`] : []), `${id}_${st}`, id]
  for (const k of keys) {
    for (const v of expr === 'neutral' ? [k] : [`${k}_${expr}`, k]) {
      const url = SPRITES[`../assets/char/${v}.webp`]
      if (url) return { url, hd: SPRITES_HD[`../assets/char/hd/${v}.webp`], pixel: PIXEL_SPRITES.includes(v), exprMatched: v !== k }
    }
  }
  return null
}

export function Character({ id, playerAge, s, expr = 'neutral', bg, dim, sceneId }: {
  id: CharId; playerAge: number; s: GameState; expr?: Expr; bg: string; dim?: boolean; sceneId?: string
}) {
  const age = charAge(id, playerAge, s, sceneId)
  if (id === 'coco') {
    const sp = SPRITES['../assets/char/coco.webp'], spHd = SPRITES_HD['../assets/char/hd/coco.webp']
    if (sp) return <div className="flex h-full w-full items-end justify-center"><img src={sp} srcSet={spHd ? `${sp} 1x, ${spHd} 2x` : undefined} alt="โกโก้" draggable={false} className="h-[45%] w-full object-contain object-bottom drop-shadow-[0_8px_18px_rgba(0,0,0,.25)]" style={{ filter: dim ? 'brightness(.62)' : undefined }} /></div>
    return (
      <div className="flex h-full w-full items-end justify-center pb-[18%]" style={{ filter: dim ? 'brightness(.62)' : undefined }}>
        <span className="leading-none drop-shadow-[0_8px_14px_rgba(0,0,0,.3)]" style={{ fontSize: 'min(20vh, 22vw, 150px)', transform: age > 10 ? 'scaleX(-1)' : undefined }}>{age > 10 ? '🐕' : '🐶'}</span>
      </div>
    )
  }
  const sprite = spriteFor(id, age, s, expr)
  if (sprite) {
    const sc = age < 3 ? 0.62 : age < 8 ? 0.8 : age < 13 ? 0.88 : age < 17 ? 0.96 : 1
    // ยังไม่มีภาพหน้าเศร้า → อย่างน้อยลดสีให้หม่นลง ไม่สดใสเท่าฉากปกติ
    const somber = expr === 'sad' && !sprite.exprMatched
    const filter = [dim && 'brightness(.62) saturate(.8)', somber && 'saturate(.45) brightness(.9)'].filter(Boolean).join(' ') || undefined
    // ยึดความสูงเท่ากันทุกตัว (รูปกว้าง/แคบไม่ทำให้ตัวเล็กใหญ่ต่างกัน) — ล้นกรอบด้านข้างได้ไม่เกิน 35%
    // จอแคบ (มือถือหลายตัวละคร) ล้นเกินนั้น → ย่อลงพอดีกรอบแทน (เคยล้นไม่จำกัด → 3 คนกว้างรวม ~1000px บนจอ 390px ซ้อนกันหมด)
    return (
      <div className="flex h-full w-full items-end justify-center">
        <img src={sprite.url} srcSet={sprite.hd ? `${sprite.url} 1x, ${sprite.hd} 2x` : undefined} alt={id === 'me' ? s.name : id === 'kid' ? kidName(sceneId) : NAMES[id]} draggable={false}
          className="h-full w-auto max-w-[135%] shrink-0 object-contain object-bottom drop-shadow-[0_8px_18px_rgba(0,0,0,.25)]"
          style={{
            transform: `scale(${sc})`, transformOrigin: 'bottom center',
            imageRendering: sprite.pixel ? 'pixelated' : undefined,
            filter, transition: 'filter .3s',
          }} />
      </div>
    )
  }
  const L = lookFor(id, age, s, bg)
  const hair = id === 'yai' ? L.hair : grayed(L.hair, age)
  const scale = age < 3 ? 0.7 : age < 8 ? 0.8 : age < 13 ? 0.87 : age < 17 ? 0.95 : 1
  const r = age < 3 ? 70 : age < 13 ? 62 : 58
  const cx = 150, cy = age < 3 ? 205 : 185
  const w = age < 3 ? 78 : age < 13 ? 86 : age < 19 ? 98 : 108
  const elder = age >= 60

  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMax meet" className="h-full w-full overflow-visible drop-shadow-[0_8px_18px_rgba(0,0,0,.25)]"
      style={{ filter: dim ? 'brightness(.62) saturate(.8)' : undefined, transition: 'filter .3s' }}>
      <g transform={`translate(150 400) scale(${scale}) translate(-150 -400)`}>
        <BackHair style={L.style} c={hair} cx={cx} cy={cy} r={r} />
        <Body outfit={L.outfit} color={L.color} skin={L.skin} w={w} age={age} />
        {/* คอ */}
        <rect x={cx - r * 0.28} y={cy + r * 0.7} width={r * 0.56} height={r * 0.7} rx={r * 0.2} fill={L.skin} />
        <rect x={cx - r * 0.28} y={cy + r * 0.7} width={r * 0.56} height={r * 0.25} fill="#000" opacity=".08" />
        {/* หู */}
        <ellipse cx={cx - r * 0.93} cy={cy + r * 0.12} rx={r * 0.16} ry={r * 0.22} fill={L.skin} />
        <ellipse cx={cx + r * 0.93} cy={cy + r * 0.12} rx={r * 0.16} ry={r * 0.22} fill={L.skin} />
        {/* หน้า */}
        <ellipse cx={cx} cy={cy} rx={r * 0.95} ry={r} fill={L.skin} />
        <Face cx={cx} cy={cy} r={r} expr={expr} baby={age < 3} elder={elder} freckles={L.freckles} />
        {L.glasses && (
          <g fill="none" stroke="#3b2f2f" strokeWidth="3.5">
            <circle cx={cx - r * 0.36} cy={cy + r * 0.12} r={r * 0.22} />
            <circle cx={cx + r * 0.36} cy={cy + r * 0.12} r={r * 0.22} />
            <path d={`M${cx - r * 0.14} ${cy + r * 0.1} Q${cx} ${cy + r * 0.02} ${cx + r * 0.14} ${cy + r * 0.1}`} />
          </g>
        )}
        <FrontHair style={L.style} c={hair} cx={cx} cy={cy} r={r} />
      </g>
    </svg>
  )
}

function Face({ cx, cy, r, expr, baby, elder, freckles }: {
  cx: number; cy: number; r: number; expr: Expr; baby: boolean; elder: boolean; freckles?: boolean
}) {
  const ey = cy + r * (baby ? 0.2 : 0.12)
  const ex = r * 0.36
  const ink = '#3a2723'
  const eye = (x: number) => {
    if (expr === 'happy')
      return <path d={`M${x - r * 0.15} ${ey + 4} Q${x} ${ey - r * 0.16} ${x + r * 0.15} ${ey + 4}`} stroke={ink} strokeWidth="5" fill="none" strokeLinecap="round" />
    const big = expr === 'surprised' ? 1.25 : 1
    return (
      <g>
        <ellipse cx={x} cy={ey} rx={r * 0.11 * big} ry={r * 0.15 * big} fill={ink} />
        <circle cx={x + r * 0.04} cy={ey - r * 0.05} r={r * 0.045} fill="#fff" />
      </g>
    )
  }
  let mouth
  const my = cy + r * (baby ? 0.55 : 0.5)
  switch (expr) {
    case 'happy':
      mouth = <path d={`M${cx - r * 0.2} ${my - 4} Q${cx} ${my + r * 0.28} ${cx + r * 0.2} ${my - 4} Z`} fill="#b8434f" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      break
    case 'sad':
      mouth = <path d={`M${cx - r * 0.14} ${my + 6} Q${cx} ${my - 6} ${cx + r * 0.14} ${my + 6}`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      break
    case 'surprised':
      mouth = <ellipse cx={cx} cy={my + 2} rx={r * 0.09} ry={r * 0.12} fill="#b8434f" stroke={ink} strokeWidth="3" />
      break
    case 'angry':
      mouth = <path d={`M${cx - r * 0.14} ${my + 2} L${cx + r * 0.14} ${my + 2}`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
      break
    default:
      mouth = <path d={`M${cx - r * 0.13} ${my} Q${cx} ${my + r * 0.12} ${cx + r * 0.13} ${my}`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
  }
  return (
    <g>
      {eye(cx - ex)}
      {eye(cx + ex)}
      {expr === 'sad' && (
        <g stroke={ink} strokeWidth="4" strokeLinecap="round">
          <path d={`M${cx - ex - r * 0.14} ${ey - r * 0.24} L${cx - ex + r * 0.12} ${ey - r * 0.32}`} />
          <path d={`M${cx + ex + r * 0.14} ${ey - r * 0.24} L${cx + ex - r * 0.12} ${ey - r * 0.32}`} />
        </g>
      )}
      {expr === 'angry' && (
        <g stroke={ink} strokeWidth="5" strokeLinecap="round">
          <path d={`M${cx - ex - r * 0.14} ${ey - r * 0.34} L${cx - ex + r * 0.13} ${ey - r * 0.22}`} />
          <path d={`M${cx + ex + r * 0.14} ${ey - r * 0.34} L${cx + ex - r * 0.13} ${ey - r * 0.22}`} />
        </g>
      )}
      <ellipse cx={cx - r * 0.58} cy={ey + r * 0.26} rx={r * 0.15} ry={r * 0.08} fill="#ff8fa3" opacity=".45" />
      <ellipse cx={cx + r * 0.58} cy={ey + r * 0.26} rx={r * 0.15} ry={r * 0.08} fill="#ff8fa3" opacity=".45" />
      {freckles && (
        <g fill="#a86d4a" opacity=".6">
          {[-0.62, -0.5, -0.56, 0.5, 0.62, 0.56].map((dx, i) => <circle key={i} cx={cx + dx * r} cy={ey + r * (0.2 + (i % 3) * 0.06)} r="2.2" />)}
        </g>
      )}
      {elder && (
        <g stroke="#b88c6e" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".8">
          <path d={`M${cx - ex - r * 0.26} ${ey - 2} l-8 -4 M${cx - ex - r * 0.26} ${ey + 6} l-8 2`} />
          <path d={`M${cx + ex + r * 0.26} ${ey - 2} l8 -4 M${cx + ex + r * 0.26} ${ey + 6} l8 2`} />
          <path d={`M${cx - r * 0.3} ${cy + r * 0.42} q-6 10 -2 18 M${cx + r * 0.3} ${cy + r * 0.42} q6 10 2 18`} />
        </g>
      )}
      {mouth}
    </g>
  )
}

function cap(cx: number, cy: number, r: number) {
  return `M${cx - r * 1.02} ${cy + r * 0.2}
    Q${cx - r * 1.15} ${cy - r * 1.2} ${cx} ${cy - r * 1.14}
    Q${cx + r * 1.15} ${cy - r * 1.2} ${cx + r * 1.02} ${cy + r * 0.2}
    Q${cx + r * 0.95} ${cy - r * 0.35} ${cx + r * 0.55} ${cy - r * 0.42}
    Q${cx + r * 0.35} ${cy - r * 0.18} ${cx + r * 0.12} ${cy - r * 0.44}
    Q${cx - r * 0.15} ${cy - r * 0.2} ${cx - r * 0.42} ${cy - r * 0.46}
    Q${cx - r * 0.85} ${cy - r * 0.45} ${cx - r * 1.02} ${cy + r * 0.2} Z`
}

function BackHair({ style, c, cx, cy, r }: { style: HairStyle; c: string; cx: number; cy: number; r: number }) {
  switch (style) {
    case 'long':
      return <path d={`M${cx - r * 1.08} ${cy - r * 0.2} Q${cx - r * 1.25} ${cy + r * 1.3} ${cx - r * 0.95} ${cy + r * 2.2} L${cx + r * 0.95} ${cy + r * 2.2} Q${cx + r * 1.25} ${cy + r * 1.3} ${cx + r * 1.08} ${cy - r * 0.2} Z`} fill={c} />
    case 'bob':
    case 'clip':
      return <path d={`M${cx - r * 1.1} ${cy - r * 0.2} Q${cx - r * 1.2} ${cy + r * 0.8} ${cx - r * 0.9} ${cy + r * 1.05} L${cx + r * 0.9} ${cy + r * 1.05} Q${cx + r * 1.2} ${cy + r * 0.8} ${cx + r * 1.1} ${cy - r * 0.2} Z`} fill={c} />
    case 'tied':
      return <g fill={c}><ellipse cx={cx + r * 0.95} cy={cy - r * 0.55} rx={r * 0.35} ry={r * 0.32} /><path d={`M${cx + r * 1.1} ${cy - r * 0.4} Q${cx + r * 1.5} ${cy + r * 0.6} ${cx + r * 1.15} ${cy + r * 1.3} Q${cx + r * 1.05} ${cy + r * 0.5} ${cx + r * 0.9} ${cy - r * 0.3} Z`} /></g>
    case 'bun':
      return <circle cx={cx} cy={cy - r * 1.15} r={r * 0.38} fill={c} />
    default:
      return null
  }
}

function FrontHair({ style, c, cx, cy, r }: { style: HairStyle; c: string; cx: number; cy: number; r: number }) {
  switch (style) {
    case 'tuft':
      return <path d={`M${cx - 8} ${cy - r * 0.95} q-4 -26 14 -30 q-14 10 -2 22 q8 -8 4 -18`} stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
    case 'shaved':
      return <path d={cap(cx, cy, r)} fill={c} opacity=".16" />
    case 'bald':
      return (
        <g fill={c}>
          <path d={`M${cx - r * 1.02} ${cy + r * 0.15} Q${cx - r * 1.05} ${cy - r * 0.5} ${cx - r * 0.75} ${cy - r * 0.6} Q${cx - r * 0.8} ${cy - r * 0.1} ${cx - r * 0.85} ${cy + r * 0.2} Z`} />
          <path d={`M${cx + r * 1.02} ${cy + r * 0.15} Q${cx + r * 1.05} ${cy - r * 0.5} ${cx + r * 0.75} ${cy - r * 0.6} Q${cx + r * 0.8} ${cy - r * 0.1} ${cx + r * 0.85} ${cy + r * 0.2} Z`} />
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.7} rx={r * 0.18} ry={r * 0.08} fill="#fff" opacity=".45" />
        </g>
      )
    case 'spiky':
      return (
        <g fill={c}>
          <path d={cap(cx, cy, r)} />
          <path d={`M${cx - r * 0.9} ${cy - r * 0.7} L${cx - r * 0.75} ${cy - r * 1.45} L${cx - r * 0.4} ${cy - r * 1.05} L${cx - r * 0.15} ${cy - r * 1.6} L${cx + r * 0.15} ${cy - r * 1.08} L${cx + r * 0.5} ${cy - r * 1.5} L${cx + r * 0.6} ${cy - r * 1.0} L${cx + r * 0.95} ${cy - r * 1.2} L${cx + r * 0.95} ${cy - r * 0.6} Z`} />
        </g>
      )
    case 'clip':
      return (
        <g>
          <path d={cap(cx, cy, r)} fill={c} />
          <rect x={cx + r * 0.35} y={cy - r * 0.62} width={r * 0.42} height={r * 0.13} rx="5" fill="#ffd166" transform={`rotate(-18 ${cx + r * 0.55} ${cy - r * 0.55})`} />
        </g>
      )
    case 'bun':
      return <path d={`M${cx - r * 1.0} ${cy + r * 0.05} Q${cx - r * 1.1} ${cy - r * 1.15} ${cx} ${cy - r * 1.1} Q${cx + r * 1.1} ${cy - r * 1.15} ${cx + r * 1.0} ${cy + r * 0.05} Q${cx + r * 0.7} ${cy - r * 0.6} ${cx} ${cy - r * 0.62} Q${cx - r * 0.7} ${cy - r * 0.6} ${cx - r * 1.0} ${cy + r * 0.05} Z`} fill={c} />
    default:
      return <path d={cap(cx, cy, r)} fill={c} />
  }
}

function Body({ outfit, color, skin, w, age }: { outfit: Outfit; color: string; skin: string; w: number; age: number }) {
  const top = 288
  const shoulders = `M${150 - w} 400 L${150 - w} ${top + 45} Q${150 - w} ${top + 4} ${150 - w * 0.45} ${top} L${150 + w * 0.45} ${top} Q${150 + w} ${top + 4} ${150 + w} ${top + 45} L${150 + w} 400 Z`
  const ink = 'rgba(0,0,0,.18)'
  const vneck = (fill: string, depth = 50) => <path d={`M${150 - 22} ${top} L150 ${top + depth} L${150 + 22} ${top} Z`} fill={fill} />
  const collar = (fill: string) => (
    <g fill={fill} stroke={ink} strokeWidth="2">
      <path d={`M${150 - 26} ${top - 4} L150 ${top + 26} L${150 - 4} ${top + 34} L${150 - 40} ${top + 14} Z`} />
      <path d={`M${150 + 26} ${top - 4} L150 ${top + 26} L${150 + 4} ${top + 34} L${150 + 40} ${top + 14} Z`} />
    </g>
  )
  const base = (fill: string) => <path d={shoulders} fill={fill} stroke={ink} strokeWidth="2" />
  switch (outfit) {
    case 'onesie':
      return <g>{base(color)}<path d={`M${150 - 30} ${top + 2} Q150 ${top + 30} ${150 + 30} ${top + 2}`} fill="#fff7d6" />{[0, 1].map((i) => <circle key={i} cx={150} cy={top + 50 + i * 26} r="5" fill="#fff" />)}</g>
    case 'uniform':
      return <g>{base('#fbfbf8')}{vneck(skin, 26)}{collar('#ffffff')}<path d={`M150 ${top + 34} L150 400`} stroke={ink} strokeWidth="2" /><path d={`M${150 + w * 0.35} ${top + 52} h${w * 0.3}`} stroke="#3a5fb0" strokeWidth="4" strokeLinecap="round" /></g>
    case 'uniformGirl':
      return (
        <g>
          {base('#fbfbf8')}
          <path d={`M${150 - 50} ${top - 2} Q150 ${top + 40} ${150 + 50} ${top - 2} L${150 + 60} ${top + 20} Q150 ${top + 60} ${150 - 60} ${top + 20} Z`} fill="#ffffff" stroke={ink} strokeWidth="2" />
          <path d={`M150 ${top + 36} l-26 -12 l4 26 Z M150 ${top + 36} l26 -12 l-4 26 Z`} fill={age < 13 ? '#2b3f80' : '#2b3f80'} />
          <circle cx="150" cy={top + 37} r="6" fill="#1f2f63" />
          <path d={`M${150 + w * 0.35} ${top + 72} h${w * 0.3}`} stroke="#3a5fb0" strokeWidth="4" strokeLinecap="round" />
        </g>
      )
    case 'shirt':
      return <g>{base(color)}{vneck(skin, 24)}{collar(color)}{[0, 1, 2].map((i) => <circle key={i} cx={150} cy={top + 50 + i * 24} r="3.5" fill="#fff" opacity=".8" />)}</g>
    case 'suit':
      return (
        <g>
          {base(color)}
          <path d={`M${150 - 30} ${top} L150 ${top + 80} L${150 + 30} ${top} Z`} fill="#f5f5f5" />
          <path d={`M150 ${top + 10} l-8 10 l8 60 l8 -60 Z`} fill="#c0392b" />
          <path d={`M${150 - 30} ${top} L150 ${top + 80} L${150 - 46} ${top + 30} Z M${150 + 30} ${top} L150 ${top + 80} L${150 + 46} ${top + 30} Z`} fill={color} stroke="rgba(255,255,255,.15)" strokeWidth="2" />
        </g>
      )
    case 'blouse':
      return <g>{base(color)}<path d={`M${150 - 32} ${top} Q150 ${top + 40} ${150 + 32} ${top} Z`} fill={skin} /><path d={`M${150 - 32} ${top} Q150 ${top + 40} ${150 + 32} ${top}`} stroke="#fff" strokeWidth="5" fill="none" opacity=".7" /></g>
    case 'flower':
      return (
        <g>
          {base(color)}
          <path d={`M${150 - 30} ${top} Q150 ${top + 34} ${150 + 30} ${top} Z`} fill={skin} />
          {[[-60, 50], [40, 40], [-20, 90], [70, 95], [-80, 100], [10, 70]].map(([x, y], i) => (
            <g key={i} transform={`translate(${150 + x} ${top + y})`} fill="#ffd6e0">
              {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="5" />)}
              <circle r="3.5" fill="#ffd166" />
            </g>
          ))}
        </g>
      )
    case 'coat':
      return (
        <g>
          <path d={shoulders} fill="#7fc4c4" />
          <path d={`M${150 - 24} ${top} L150 ${top + 40} L${150 + 24} ${top} Z`} fill={skin} />
          <path d={`M${150 - w} 400 L${150 - w} ${top + 45} Q${150 - w} ${top + 4} ${150 - 40} ${top} L150 ${top + 100} L${150 - 30} 400 Z`} fill="#fff" stroke={ink} strokeWidth="2" />
          <path d={`M${150 + w} 400 L${150 + w} ${top + 45} Q${150 + w} ${top + 4} ${150 + 40} ${top} L150 ${top + 100} L${150 + 30} 400 Z`} fill="#fff" stroke={ink} strokeWidth="2" />
          <path d={`M${150 - 60} ${top + 10} q-10 60 18 70`} stroke="#555" strokeWidth="5" fill="none" />
          <circle cx={150 - 42} cy={top + 82} r="8" fill="#888" />
        </g>
      )
    case 'hoodie':
      return <g>{base(color)}<path d={`M${150 - 44} ${top - 6} Q150 ${top + 46} ${150 + 44} ${top - 6} Q150 ${top + 22} ${150 - 44} ${top - 6}`} fill="rgba(0,0,0,.2)" /><path d={`M${150 - 12} ${top + 22} v40 M${150 + 12} ${top + 22} v40`} stroke="#ddd" strokeWidth="4" strokeLinecap="round" /></g>
    case 'jersey':
      return <g>{base(color)}{vneck('#fff', 30)}<path d={`M${150 - 20} ${top} L150 ${top + 26} L${150 + 20} ${top}`} fill={skin} /><text x="150" y={top + 95} fontSize="44" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Mitr">10</text></g>
    case 'chef':
      return <g>{base('#fff')}{vneck(skin, 22)}{[0, 1].map((r) => [-1, 1].map((sx) => <circle key={`${r}${sx}`} cx={150 + sx * 22} cy={top + 48 + r * 30} r="5" fill="#bbb" />))}<path d={`M${150 - 40} ${top + 2} L${150 + 40} ${top + 2}`} stroke="#e74c3c" strokeWidth="8" /></g>
    case 'mohom':
      return <g>{base(color)}{vneck(skin, 36)}<path d={`M${150 - w} ${top + 110} H${150 + w}`} stroke="#c0392b" strokeWidth="10" /></g>
    case 'cardigan':
      return <g>{base('#fdf6e8')}<path d={`M${150 - w} 400 L${150 - w} ${top + 45} Q${150 - w} ${top + 4} ${150 - 40} ${top} L${150 - 10} 400 Z M${150 + w} 400 L${150 + w} ${top + 45} Q${150 + w} ${top + 4} ${150 + 40} ${top} L${150 + 10} 400 Z`} fill={color} stroke={ink} strokeWidth="2" /><path d={`M${150 - 30} ${top} Q150 ${top + 30} ${150 + 30} ${top} Z`} fill={skin} /></g>
    case 'tee':
      return <g>{base(color)}<path d={`M${150 - 30} ${top} Q150 ${top + 30} ${150 + 30} ${top} Z`} fill={skin} /><circle cx="150" cy={top + 80} r="18" fill="#fff" opacity=".7" /><path d={`M${150 - 7} ${top + 78} a3 3 0 0 1 6 0 M${150 + 1} ${top + 78} a3 3 0 0 1 6 0 M${150 - 8} ${top + 86} q8 7 16 0`} stroke={color} strokeWidth="3" fill="none" /></g>
    case 'jacket':
      return <g>{base(color)}<path d={`M${150 - 26} ${top} L150 ${top + 60} L${150 + 26} ${top} Z`} fill="#e8e3d8" /><path d={`M150 ${top + 60} V400`} stroke="#999" strokeWidth="3" /><path d={`M${150 - 26} ${top} L${150 - 44} ${top + 26} M${150 + 26} ${top} L${150 + 44} ${top + 26}`} stroke="rgba(255,255,255,.3)" strokeWidth="6" /></g>
    case 'khaki':
      return <g>{base(color)}{vneck(skin, 26)}{collar(color)}<rect x={150 - w * 0.6} y={top + 50} width="28" height="22" rx="3" fill="rgba(0,0,0,.08)" /><rect x={150 + w * 0.6 - 28} y={top + 50} width="28" height="22" rx="3" fill="rgba(0,0,0,.08)" /></g>
    case 'robe':
      // ห่มเฉียง เปิดไหล่ขวา
      return (
        <g>
          {base(skin)}
          <path d={`M${150 - w} 400 L${150 - w} ${top + 45} Q${150 - w} ${top + 4} ${150 - w * 0.45} ${top} L${150 + 6} ${top} L${150 + w} ${top + 96} L${150 + w} 400 Z`} fill={color} stroke={ink} strokeWidth="2" />
          <path d={`M${150 - w * 0.3} ${top + 4} L${150 + w * 0.7} ${top + 150} M${150 - w * 0.6} ${top + 40} L${150 + w * 0.2} ${top + 170}`} stroke="rgba(0,0,0,.12)" strokeWidth="4" fill="none" />
        </g>
      )
    case 'nun':
      // เสื้อขาว + สไบขาวพาดเฉียง
      return (
        <g>
          {base(color)}
          <path d={`M${150 - 30} ${top} Q150 ${top + 30} ${150 + 30} ${top} Z`} fill={skin} />
          <path d={`M${150 - w * 0.5} ${top} L${150 - w * 0.15} ${top} L${150 + w} ${top + 120} L${150 + w} ${top + 168} Z`} fill="#ffffff" stroke={ink} strokeWidth="2" />
        </g>
      )
    case 'wedding':
      return (
        <g>
          {base('#f6ecd6')}
          <path d={`M${150 - w} ${top + 50} L${150 + w * 0.4} ${top} L${150 + w * 0.6} ${top + 14} L${150 - w + 14} ${top + 70} Z`} fill="#d4a640" />
          <path d={`M${150 - 30} ${top} Q150 ${top + 30} ${150 + 30} ${top} Z`} fill={skin} />
          <path d={`M${150 - 44} ${top + 6} Q150 ${top + 70} ${150 + 44} ${top + 6}`} stroke="#fff" strokeWidth="7" fill="none" strokeDasharray="2 10" strokeLinecap="round" />
        </g>
      )
  }
}
