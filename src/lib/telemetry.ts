/**
 * 📊 เก็บสถิติการเล่น + ความเห็นผู้เล่น (ไม่ระบุตัวตน) ไว้ใช้ปรับสมดุลเกม
 *
 * - plays/{auto}: type 'start' | 'end' | 'quit' — ฉากจบ ความฝัน ไพ่ อายุ เงิน ฉากที่เลิกเล่น ฯลฯ
 * - feedback/{auto}: คะแนนความสนุก ความยุติธรรมของฉากจบ และข้อความ
 * - ไม่ส่งชื่อตัวละคร อีเมล หรือ uid — มีแค่ pid สุ่มประจำเครื่อง (นับคนเล่นซ้ำได้)
 * - เขียนได้อย่างเดียว อ่านไม่ได้จากหน้าเว็บ (ดู firestore.rules) → ดูข้อมูลใน Firebase Console
 * - ตอน dev (npm run dev) ไม่ส่ง เว้นแต่ตั้ง VITE_TELEMETRY_DEV=1
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { cloudDb } from './cloud'
import { netWorth } from '../game/finance'
import type { Ending, GameState } from '../game/types'

/** เปลี่ยนทุกครั้งที่ปรับสมดุลเกม → แยกข้อมูลก่อน/หลังปรับได้ */
export const BALANCE = '2026-10-22'

const PID_KEY = 'lifepath.pid'
const PENDING_KEY = 'lifepath.tm.pending'
const enabled = !import.meta.env.DEV || !!import.meta.env.VITE_TELEMETRY_DEV
const ls = (() => { try { return window.localStorage } catch { return null } })()
const get = (k: string) => { try { return ls?.getItem(k) ?? null } catch { return null } }
const put = (k: string, v: string | null) => { try { if (v == null) ls?.removeItem(k); else ls?.setItem(k, v) } catch { /* โหมดส่วนตัว */ } }

function pid() {
  let id = get(PID_KEY)
  if (!id) { id = Math.random().toString(36).slice(2, 12); put(PID_KEY, id) }
  return id
}
const mobile = () => typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

function send(col: 'plays' | 'feedback', data: Record<string, unknown>) {
  const db = cloudDb()
  if (!enabled || !db) return Promise.resolve(false)
  return addDoc(collection(db, col), { ...data, pid: pid(), v: BALANCE, mobile: mobile(), at: serverTimestamp() })
    .then(() => true)
    .catch((e) => { console.warn('telemetry failed', e); return false })
}

/** ข้อมูลพื้นฐานของชีวิตนี้ (ใช้ร่วมกันทุก event) */
const base = (s: GameState) => ({
  trait: s.trait ?? null, dream: s.dream ?? null, gender: s.gender,
  life: s.life ?? 1, gen: s.gen ?? 1, mode: s.mode ?? 'normal',
})

let startedAt = Date.now()
const mins = () => Math.round((Date.now() - startedAt) / 6000) / 10

/** เริ่มเล่น (ชีวิตใหม่ หรือกดเล่นต่อจากเซฟ) */
export function logStart(s: GameState) {
  startedAt = Date.now()
  void send('plays', { type: 'start', ...base(s), resumed: (s.visited?.length ?? 0) > 1 })
}

/** ทุกครั้งที่เข้าฉากใหม่ → จดไว้ในเครื่อง ถ้าปิดเว็บกลางคัน ครั้งหน้าจะส่งเป็น 'quit' */
export function trackScene(s: GameState, age: number) {
  put(PENDING_KEY, JSON.stringify({ ...base(s), scene: s.sceneId, age, career: s.career, scenes: s.visited?.length ?? 0, mins: mins() }))
}

/** กดกลับหน้าแรกระหว่างเล่น */
export function logQuit() {
  const p = get(PENDING_KEY)
  put(PENDING_KEY, null)
  if (p) void send('plays', { type: 'quit', how: 'menu', ...JSON.parse(p) })
}

export function logEnd(s: GameState, ending: Ending, age: number, dreamOk: boolean) {
  put(PENDING_KEY, null)
  void send('plays', {
    type: 'end', ...base(s), ending: ending.id, kind: ending.kind, age, dreamOk,
    career: s.career, net: Math.round(netWorth(s) / 1000) * 1000, hustles: s.hustles ?? 0,
    married: s.flags.includes('partner') && !s.flags.includes('divorced'), kid: s.flags.includes('kid'),
    scenes: s.visited?.length ?? 0, lastScene: s.sceneId, mins: mins(),
  })
}

export interface Feedback { fun: number; fair: 'fair' | 'confused' | 'unfair' | null; again: boolean | null; text: string }
export function sendFeedback(s: GameState, ending: Ending, age: number, f: Feedback) {
  return send('feedback', { ...base(s), ending: ending.id, age, fun: f.fun, fair: f.fair, again: f.again, text: f.text.trim().slice(0, 500) })
}

// เปิดเว็บมาแล้วเจอว่าครั้งก่อนปิดกลางคัน → ส่งเป็น quit
{
  const p = get(PENDING_KEY)
  if (p) { put(PENDING_KEY, null); try { void send('plays', { type: 'quit', how: 'closed', ...JSON.parse(p) }) } catch { /* ข้อมูลเสีย */ } }
}
