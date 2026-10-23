/**
 * ☁️ บัญชีผู้เล่น + เซฟบนคลาวด์ (Firebase Auth + Cloud Firestore แผน Spark ฟรี)
 *
 * - ไม่ login ก็เล่นได้: ทุกอย่างเก็บใน localStorage เหมือนเดิม
 * - login แล้ว: ข้อมูลทุกคีย์ที่ขึ้นต้นด้วย "lifepath." ถูกซิงก์ไปที่ users/{uid}/kv/{key}
 *   (เซฟเกม อัลบั้มชีวิต ฉากจบ ถ้วย ความลับ ฯลฯ) — แต่ละคนอ่าน/เขียนได้เฉพาะของตัวเอง (ดู firestore.rules)
 * - ตั้งค่า Firebase ผ่านตัวแปร VITE_FIREBASE_* ตอน build (ดู .env.example)
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
  updateProfile, type Auth, type User,
} from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'

const env = import.meta.env
/** ค่าของเว็บแอป Firebase เป็นค่าสาธารณะ (ความปลอดภัยอยู่ที่ firestore.rules) — ตั้งทับได้ด้วย VITE_FIREBASE_* */
const DEFAULT = {
  apiKey: 'AIzaSyDHJ1ooHt51ehQoxIOv9JWcUln9AmnA5us',
  authDomain: 'life-game-ed498.firebaseapp.com',
  projectId: 'life-game-ed498',
  appId: '1:865170318933:web:32badc9803c4cddc8496dc',
}
const config = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || DEFAULT.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || DEFAULT.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || DEFAULT.projectId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || DEFAULT.appId,
}
export const cloudReady = !!(config.apiKey && config.authDomain && config.projectId && config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
if (cloudReady) {
  try {
    app = initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (e) { console.warn('Firebase init failed', e) }
}

// ───────── สถานะ (ให้ UI subscribe) ─────────
export type SyncState = 'off' | 'idle' | 'syncing' | 'error'
interface CloudState { user: User | null; sync: SyncState; lastSync?: number }
let state: CloudState = { user: null, sync: cloudReady ? 'idle' : 'off' }
const subs = new Set<(s: CloudState) => void>()
const set = (p: Partial<CloudState>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)) }
export const cloudState = () => state
/** Firestore (null = ไม่ได้ตั้งค่า Firebase) — ใช้กับระบบเก็บสถิติการเล่น */
export const cloudDb = () => db
export function onCloud(f: (s: CloudState) => void) { subs.add(f); f(state); return () => { subs.delete(f) } }

// ───────── ดักการเขียน localStorage เพื่ออัปโหลดอัตโนมัติ ─────────
const PREFIX = 'lifepath.'
const LOCAL_ONLY = new Set(['lifepath.voice', 'lifepath.music', 'lifepath.sync.meta', 'lifepath.pid', 'lifepath.tm.pending', 'lifepath.owner'])
const META = 'lifepath.sync.meta'
/** uid ของบัญชีที่เป็นเจ้าของข้อมูลในเครื่องตอนนี้ — กันข้อมูลบัญชีหนึ่งไปปนอีกบัญชีบนเครื่องเดียวกัน */
const OWNER = 'lifepath.owner'
const ls = (() => { try { return window.localStorage } catch { return null } })()
const rawSet = ls ? ls.setItem.bind(ls) : null
const rawRemove = ls ? ls.removeItem.bind(ls) : null
const readMeta = (): Record<string, number> => { try { return JSON.parse(ls?.getItem(META) || '{}') } catch { return {} } }
const touch = (k: string) => { const m = readMeta(); m[k] = Date.now(); rawSet?.(META, JSON.stringify(m)) }
const dirty = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null
let applying = false
function mark(k: string) {
  if (applying || !k.startsWith(PREFIX) || LOCAL_ONLY.has(k)) return
  touch(k)
  if (!state.user) return
  dirty.add(k)
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, 2500)
}
/** กำลังเล่นโหมดทดลอง → ไม่เก็บอะไรเลย (เซฟ ฉากจบ ถ้วย ความลับ อัลบั้ม) ไม่ให้ไปปนกับบัญชีจริงตอน login */
let trialRun = false
export function setTrialRun(on: boolean) { trialRun = on }
if (ls && rawSet && rawRemove) {
  ls.setItem = (k: string, v: string) => { if (trialRun && k.startsWith(PREFIX) && !LOCAL_ONLY.has(k)) return; rawSet(k, v); mark(k) }
  ls.removeItem = (k: string) => { rawRemove(k); mark(k) }
}

/** ล้างข้อมูลเกมของบัญชีเดิมออกจากเครื่อง (เก็บไว้แค่ค่าตั้งค่าเครื่อง เช่น เสียง) */
function wipeLocal() {
  if (!ls || !rawRemove) return
  if (timer) { clearTimeout(timer); timer = null }
  dirty.clear()
  const keys: string[] = []
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i)!; if (k.startsWith(PREFIX) && !LOCAL_ONLY.has(k)) keys.push(k) }
  keys.forEach((k) => rawRemove(k))
  rawRemove(META)
  rawRemove(OWNER)
}

const kvRef = (uid: string, k: string) => doc(db!, 'users', uid, 'kv', k.replace(/\//g, '_'))
export async function flush() {
  if (!db || !state.user || !dirty.size) return
  const uid = state.user.uid
  const keys = [...dirty]
  dirty.clear()
  set({ sync: 'syncing' })
  try {
    await Promise.all(keys.map((k) => {
      const v = ls?.getItem(k)
      return v == null ? deleteDoc(kvRef(uid, k)) : setDoc(kvRef(uid, k), { key: k, v, t: readMeta()[k] ?? Date.now(), at: serverTimestamp() })
    }))
    set({ sync: 'idle', lastSync: Date.now() })
  } catch (e) {
    console.warn('cloud sync failed', e)
    keys.forEach((k) => dirty.add(k))
    set({ sync: 'error' })
  }
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { void flush() })

// ───────── รวมข้อมูลตอน login (ไม่ให้ของในเครื่องหรือบนคลาวด์หาย) ─────────
const SET_KEYS = ['lifepath.ach.v1', 'lifepath.dreams.v1', 'lifepath.secrets.v1', 'lifepath.endings.v1', 'lifepath.unlocks.seen.v1']
function merge(k: string, local: string | null, cloud: string, lt: number, ct: number): string | null {
  try {
    if (SET_KEYS.includes(k)) {
      const a = JSON.parse(local || '[]'), b = JSON.parse(cloud || '[]')
      if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify([...new Set([...b, ...a])])
    }
    if (k === 'lifepath.lives.v1') {
      const a = JSON.parse(local || '[]') as { id: number; key?: string }[], b = JSON.parse(cloud || '[]') as { id: number; key?: string }[]
      const seen = new Set<string>()
      const all = [...a, ...b].filter((r) => { const id = r.key ?? String(r.id); if (seen.has(id)) return false; seen.add(id); return true })
      return JSON.stringify(all.sort((x, y) => y.id - x.id).slice(0, 60))
    }
    // เซฟแยกตามตระกูล: รวมทีละช่อง เก็บอันที่เล่นล่าสุด (ไม่ให้เซฟจากอีกเครื่องหายเพราะเริ่มเล่นก่อนซิงก์เสร็จ)
    if (k === 'lifepath.families.v1') {
      const a = JSON.parse(local || '[]') as { id: string; at: number }[], b = JSON.parse(cloud || '[]') as { id: string; at: number }[]
      const by = new Map<string, { id: string; at: number }>()
      for (const x of [...b, ...a]) { const o = by.get(x.id); if (!o || x.at >= o.at) by.set(x.id, x) }
      return JSON.stringify([...by.values()].sort((x, y) => y.at - x.at))
    }
  } catch { /* ใช้กฎเวลาแทน */ }
  return local == null || ct >= lt ? cloud : local
}
async function pullAndMerge(u: User) {
  if (!db || !ls) return
  set({ sync: 'syncing' })
  // ข้อมูลในเครื่องเป็นของบัญชีอื่น (หรือไม่รู้ว่าของใคร) → ล้างทิ้งก่อน ไม่เอาไปรวมกับบัญชีนี้
  if (ls.getItem(OWNER) !== u.uid) wipeLocal()
  rawSet!(OWNER, u.uid)
  try {
    const snap = await getDocs(collection(db, 'users', u.uid, 'kv'))
    const meta = readMeta()
    const cloudKeys = new Set<string>()
    applying = true
    snap.forEach((d) => {
      const { key, v, t } = d.data() as { key: string; v: string; t: number }
      if (!key?.startsWith(PREFIX) || LOCAL_ONLY.has(key)) return
      cloudKeys.add(key)
      const local = ls.getItem(key)
      const out = merge(key, local, v, meta[key] ?? 0, t ?? 0)
      if (out != null && out !== local) rawSet!(key, out)
      if (out !== v) dirty.add(key)
    })
    applying = false
    // ของในเครื่องที่ยังไม่เคยขึ้นคลาวด์
    for (let i = 0; i < ls.length; i++) { const k = ls.key(i)!; if (k.startsWith(PREFIX) && !LOCAL_ONLY.has(k) && !cloudKeys.has(k)) dirty.add(k) }
    await setDoc(doc(db, 'users', u.uid), { email: u.email, name: u.displayName ?? null, lastSeen: serverTimestamp() }, { merge: true })
    set({ sync: 'idle', lastSync: Date.now() })
    await flush()
  } catch (e) {
    applying = false
    console.warn('cloud pull failed', e)
    set({ sync: 'error' })
  }
}

if (auth) {
  onAuthStateChanged(auth, (u) => {
    set({ user: u })
    if (u) void pullAndMerge(u).then(() => window.dispatchEvent(new Event('lifepath-cloud-merged')))
  })
}

// ───────── บัญชี ─────────
const TH_ERR: Record<string, string> = {
  'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
  'auth/missing-password': 'กรุณาใส่รหัสผ่าน',
  'auth/weak-password': 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร',
  'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน',
  'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth/user-not-found': 'ไม่พบบัญชีนี้',
  'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
  'auth/too-many-requests': 'ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่',
  'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้',
  'auth/unauthorized-domain': 'เว็บนี้ยังไม่ได้รับอนุญาตใน Firebase (เพิ่มโดเมนใน Authentication › Settings › Authorized domains)',
  'auth/operation-not-allowed': 'ยังไม่ได้เปิดการ login ด้วยอีเมลใน Firebase',
  'auth/configuration-not-found': 'ยังไม่ได้เปิดใช้ Authentication ใน Firebase (Authentication › Get started › เปิด Email/Password)',
}
const thErr = (e: unknown) => { const c = (e as { code?: string })?.code ?? ''; return TH_ERR[c] ?? `เกิดข้อผิดพลาด (${c || 'unknown'})` }
const need = () => { if (!auth) throw Object.assign(new Error('off'), { code: 'off' }) ; return auth }

export async function signUp(email: string, password: string, name: string) {
  try {
    const { user } = await createUserWithEmailAndPassword(need(), email.trim(), password)
    if (name.trim()) {
      await updateProfile(user, { displayName: name.trim().slice(0, 20) })
      // ตอนสร้างบัญชี users/{uid} ถูกเขียนไปก่อนตั้งชื่อ → อัปเดตชื่อตามไป
      if (db) await setDoc(doc(db, 'users', user.uid), { name: user.displayName }, { merge: true }).catch(() => {})
    }
    set({ user })
    return { ok: true as const }
  } catch (e) { return { ok: false as const, error: thErr(e) } }
}
export async function signIn(email: string, password: string) {
  try { await signInWithEmailAndPassword(need(), email.trim(), password); return { ok: true as const } } catch (e) { return { ok: false as const, error: thErr(e) } }
}
export async function resetPassword(email: string) {
  try { await sendPasswordResetEmail(need(), email.trim()); return { ok: true as const } } catch (e) { return { ok: false as const, error: thErr(e) } }
}
export async function logOut() {
  await flush()
  if (auth) await signOut(auth)
  // ออกจากระบบแล้วไม่ทิ้งเซฟ/ตระกูลไว้ในเครื่องให้บัญชีถัดไปเห็น (ของจริงอยู่บนคลาวด์แล้ว)
  // ถ้ายังอัปโหลดไม่สำเร็จ (เน็ตหลุด) เก็บไว้ก่อน — owner ยังเป็นบัญชีเดิม บัญชีอื่น login จะถูกล้างอยู่ดี
  if (!dirty.size) wipeLocal()
  window.dispatchEvent(new Event('lifepath-cloud-merged'))
}
