import type { CharId, Gender } from '../game/types'
import VOICE_IDS from '../game/voiceIds.json'

// ไฟล์เสียงพากย์จริง: วางไว้ที่ src/assets/voice/<ชื่อไฟล์ตามสคริปต์>.mp3
const FILES = import.meta.glob('../assets/voice/*.{mp3,ogg,m4a,wav}', { eager: true, import: 'default' }) as Record<string, string>
const fileUrl = (name: string) => {
  for (const ext of ['mp3', 'ogg', 'm4a', 'wav']) { const u = FILES[`../assets/voice/${name}.${ext}`]; if (u) return u }
  return null
}
let audio: HTMLAudioElement | null = null

/**
 * เสียงพากย์ด้วย Web Speech API (เสียงสังเคราะห์ภาษาไทยในเครื่องผู้เล่น)
 * แต่ละตัวละครปรับ pitch / rate ให้เสียงต่างกัน
 * ถ้ามีไฟล์พากย์จริงใน src/assets/voice (ชื่อตาม voice-script) จะเล่นไฟล์นั้นแทน
 */
const KEY = 'lifepath.voice'
let enabled = (() => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } })()
let thVoice: SpeechSynthesisVoice | null = null

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

function pickVoice() {
  if (!synth) return
  const vs = synth.getVoices()
  thVoice = vs.find((v) => v.lang?.toLowerCase().startsWith('th') && /google|premwadee|narisa|kanya/i.test(v.name))
    ?? vs.find((v) => v.lang?.toLowerCase().startsWith('th')) ?? null
}
if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice) }

export const voiceSupported = () => !!synth
export const hasThaiVoice = () => !!thVoice
export const voiceOn = () => enabled
export function setVoiceOn(v: boolean) {
  enabled = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* ignore */ }
  if (!v) stopVoice()
}
export function stopVoice() { synth?.cancel(); audio?.pause() }
/** ยังพูดอยู่ไหม (ใช้รอให้เสียงจบก่อนเริ่มจับเวลา/เปลี่ยนฉาก) */
export const isSpeaking = () => enabled && (!!(audio && !audio.paused && !audio.ended) || !!synth?.speaking)

function tone(who: CharId | undefined, age: number, gender: Gender): [pitch: number, rate: number] {
  switch (who) {
    case undefined: return [1, 1.05] // ผู้บรรยาย
    case 'me':
      if (age < 3) return [2, 1.1]
      if (age < 13) return [1.7, 1.1]
      if (age < 19) return gender === 'girl' ? [1.45, 1.1] : [1.15, 1.1]
      if (age < 60) return gender === 'girl' ? [1.25, 1.05] : [0.8, 1.0]
      return gender === 'girl' ? [1.05, 0.85] : [0.65, 0.85]
    case 'mom': return [1.3, 1.0]
    case 'dad': return [0.7, 0.95]
    case 'yai': return [1.1, 0.8]
    case 'ton': return age < 19 ? [1.5, 1.2] : age < 45 ? [0.9, 1.1] : [0.75, 1.0]
    case 'fah': return gender === 'girl' ? [0.95, 1.0] : [1.45, 1.05]
    case 'kru': return [1.2, 0.95]
    case 'boss': return [0.55, 0.9]
    case 'kid': return [1.9, 1.15]
    case 'nong': return age < 13 ? [1.9, 1.15] : age < 40 ? [1.5, 1.05] : [1.15, 0.95]
    case 'jay': return age < 19 ? [1.4, 1.15] : [0.85, 1.05]
    case 'coco': return [2, 1.4]
    default: return [1, 1]
  }
}

export function speak(text: string, who: CharId | undefined, age: number, gender: Gender, raw?: string) {
  if (!enabled) return
  stopVoice()
  // มีไฟล์พากย์จริง → เล่นไฟล์ก่อน
  const id = raw ? (VOICE_IDS as Record<string, string>)[raw] : undefined
  if (id) {
    const g = (who === 'fah' ? gender === 'girl' : gender === 'boy') ? 'm' : 'f'
    const url = fileUrl(`${id}_${g}`) ?? fileUrl(id) ?? fileUrl(`${id}_${g === 'm' ? 'f' : 'm'}`)
    if (url) { audio = new Audio(url); audio.play().catch(() => {}); return }
  }
  if (!synth) return
  const clean = text.replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\(.*?\)/g, '').trim()
  if (!clean) return
  const u = new SpeechSynthesisUtterance(clean)
  u.lang = 'th-TH'
  if (thVoice) u.voice = thVoice
  const [pitch, rate] = tone(who, age, gender)
  u.pitch = pitch
  u.rate = rate
  synth.speak(u)
}

/** เสียงติ๊กตอนนับถอยหลัง */
let ctx: AudioContext | null = null
export function tick(urgent: boolean) {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = urgent ? 880 : 520
    g.gain.setValueAtTime(0.06, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    o.connect(g).connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 0.13)
  } catch { /* ignore */ }
}
