/**
 * เพลงประกอบ + เสียงเอฟเฟกต์ สังเคราะห์ด้วย Web Audio (ไม่ต้องใช้ไฟล์)
 * เพลงเปลี่ยนอารมณ์ตามช่วงวัย: เด็ก = สดใส, วัยรุ่น = มีพลัง, ทำงาน = นุ่ม, แก่ = ช้าอบอุ่น, แย่ = มืด
 */
const KEY = 'lifepath.music'
let on = (() => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } })()
let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
let timer: number | null = null
let mood: Mood | null = null

export type Mood = 'kid' | 'teen' | 'adult' | 'elder' | 'dark' | 'title'

function ac() {
  if (!ctx) {
    try {
      ctx = new AudioContext()
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination)
      musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master)
    } catch { return null }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

export const musicOn = () => on
/** เรียกตอนผู้ใช้แตะครั้งแรก เพื่อให้เบราว์เซอร์ยอมเล่นเสียง */
export function resumeAudio() {
  if (!on) return
  const had = !!ctx
  ac()
  if (!had && mood) { const m = mood; mood = null; playMusic(m) }
}
export function setMusicOn(v: boolean) {
  on = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* ignore */ }
  if (!v) stopMusic()
  else if (mood) { const m = mood; mood = null; playMusic(m) }
}

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
function note(midi: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode) {
  const c = ctx!
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.value = N(midi)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05)
}

// คอร์ด (root midi) + สเกลทำนอง ต่ออารมณ์
const SONGS: Record<Mood, { bpm: number; chords: number[]; minor?: boolean; lead: OscillatorType; bass: OscillatorType; density: number }> = {
  title: { bpm: 84, chords: [60, 67, 69, 65], lead: 'triangle', bass: 'sine', density: 0.45 },
  kid: { bpm: 112, chords: [60, 65, 67, 60], lead: 'square', bass: 'triangle', density: 0.7 },
  teen: { bpm: 120, chords: [62, 67, 69, 64], lead: 'sawtooth', bass: 'square', density: 0.6 },
  adult: { bpm: 92, chords: [57, 65, 60, 67], lead: 'triangle', bass: 'sine', density: 0.45 },
  elder: { bpm: 72, chords: [60, 69, 65, 67], lead: 'sine', bass: 'sine', density: 0.35 },
  dark: { bpm: 70, chords: [57, 53, 60, 52], minor: true, lead: 'sine', bass: 'triangle', density: 0.3 },
}

export function playMusic(m: Mood) {
  if (mood === m && timer) return
  mood = m
  if (!on || !ctx) return
  const c = ac(); if (!c || !musicGain) return
  stopMusic(true)
  const song = SONGS[m]
  const beat = 60 / song.bpm
  const scale = song.minor ? [0, 2, 3, 5, 7, 8, 10, 12] : [0, 2, 4, 7, 9, 12, 14]
  let bar = 0
  let next = c.currentTime + 0.1
  const g = musicGain
  g.gain.cancelScheduledValues(c.currentTime)
  g.gain.setValueAtTime(0.0001, c.currentTime)
  g.gain.linearRampToValueAtTime(m === 'dark' ? 0.13 : 0.16, c.currentTime + 1.5)
  const schedule = () => {
    while (next < c.currentTime + 1.2) {
      const root = song.chords[bar % song.chords.length]
      const third = song.minor || [69, 64, 52, 57].includes(root) ? 3 : 4
      // แพด: คอร์ดยาวทั้งห้อง
      ;[0, third, 7].forEach((iv) => note(root + iv, next, beat * 4, 'sine', 0.05, g))
      // เบส
      for (let b = 0; b < 4; b += 2) note(root - 12, next + b * beat, beat * 1.6, song.bass, 0.12, g)
      // ทำนองสุ่มจากสเกล (seed ตาม bar ให้ซ้ำเป็นวรรค)
      for (let s = 0; s < 8; s++) {
        const r = Math.abs(Math.sin((bar % 8) * 12.9898 + s * 78.233) * 43758.5453) % 1
        if (r < song.density) {
          const deg = scale[Math.floor(r * 100) % scale.length]
          note(root + 12 + deg, next + s * beat * 0.5, beat * 0.45, song.lead, 0.045, g)
        }
      }
      next += beat * 4
      bar++
    }
  }
  schedule()
  timer = window.setInterval(schedule, 400)
}

export function stopMusic(keepMood = false) {
  if (timer) { clearInterval(timer); timer = null }
  if (!keepMood) mood = null
  if (ctx && musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime)
    musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2)
  }
}

export type Sfx = 'ring' | 'tap' | 'good' | 'bad' | 'coin' | 'loss' | 'shock' | 'unlock' | 'whoosh' | 'heart' | 'death'
export function sfx(kind: Sfx) {
  if (!on) return
  const c = ac(); if (!c || !master) return
  const t = c.currentTime
  const seq = (notes: number[], step: number, type: OscillatorType, vol: number, len = step * 1.6) =>
    notes.forEach((n, i) => note(n, t + i * step, len, type, vol, master!))
  switch (kind) {
    case 'tap': return seq([84], 0.05, 'triangle', 0.06)
    case 'ring': return [0, 0.5].forEach((d) => [88, 84, 88, 84].forEach((n, i) => note(n, t + d + i * 0.07, 0.08, 'square', 0.05, master!)))
    case 'good': return seq([72, 76, 79, 84], 0.07, 'triangle', 0.12)
    case 'bad': return seq([67, 63, 60], 0.11, 'sawtooth', 0.07, 0.25)
    case 'coin': return seq([88, 93], 0.06, 'square', 0.06)
    case 'loss': return seq([64, 59], 0.1, 'square', 0.06)
    case 'unlock': return seq([72, 79, 84, 88, 91], 0.06, 'triangle', 0.12, 0.3)
    case 'heart': return seq([76, 81], 0.12, 'sine', 0.12, 0.3)
    case 'whoosh': {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(1200, t + 0.25)
      g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.32); return
    }
    case 'shock': return seq([48, 49, 48], 0.09, 'sawtooth', 0.1, 0.4)
    case 'death': return seq([60, 56, 53, 48], 0.35, 'sine', 0.12, 0.9)
  }
}
