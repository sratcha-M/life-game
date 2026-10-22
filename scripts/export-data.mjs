// 📊 ดึงสถิติการเล่น + ความเห็นผู้เล่นจาก Firestore ออกมาเป็นไฟล์ JSON ไฟล์เดียว: npm run export-data [path/to/key.json]
//
// ต้องมีคีย์ Service Account (ทำครั้งเดียว):
//   Firebase Console › ⚙️ Project settings › Service accounts › "Generate new private key"
//   → ได้ไฟล์ .json มา เอาไปวางที่โฟลเดอร์โปรเจกต์ตั้งชื่อ serviceAccount.json (ถูก .gitignore ไว้แล้ว ห้ามแชร์/ห้ามขึ้น git)
//
// ผลลัพธ์: data-export/telemetry-YYYY-MM-DD.json  (ถูก .gitignore ไว้เหมือนกัน)
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const keyPath = process.argv[2]
  ?? ['serviceAccount.json', ...readdirSync('.').filter((f) => /-firebase-adminsdk-.*\.json$/.test(f))].find((f) => existsSync(f))
if (!keyPath || !existsSync(keyPath)) {
  console.error('❌ ไม่เจอคีย์ Service Account\n   Firebase Console › Project settings › Service accounts › Generate new private key\n   แล้ววางไฟล์ไว้ที่ serviceAccount.json ในโฟลเดอร์โปรเจกต์ (หรือ npm run export-data -- path/to/key.json)')
  process.exit(1)
}
const key = JSON.parse(readFileSync(keyPath, 'utf8'))
initializeApp({ credential: cert(key) })
const db = getFirestore()

/** แปลง Timestamp ของ Firestore เป็นข้อความ ISO ให้อ่านง่าย */
const plain = (v) => (v instanceof Timestamp ? v.toDate().toISOString() : Array.isArray(v) ? v.map(plain) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) : v)

async function dump(name) {
  const snap = await db.collection(name).get()
  return snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) })).sort((a, b) => String(a.at).localeCompare(String(b.at)))
}

const [plays, feedback] = await Promise.all([dump('plays'), dump('feedback')])
const out = { project: key.project_id, exportedAt: new Date().toISOString(), plays, feedback }
mkdirSync('data-export', { recursive: true })
const file = `data-export/telemetry-${new Date().toLocaleDateString('sv-SE')}.json` // วันที่ตามเวลาเครื่อง (YYYY-MM-DD)
writeFileSync(file, JSON.stringify(out, null, 1))

const count = (rows, k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})
console.log(`✅ บันทึกแล้ว: ${file}`)
console.log(`   plays ${plays.length} รายการ`, count(plays, 'type'), `· ผู้เล่น ${new Set(plays.map((r) => r.pid)).size} เครื่อง`)
console.log(`   feedback ${feedback.length} รายการ`)
if (!plays.length && !feedback.length) console.log('⚠️ ยังไม่มีข้อมูลเลย — เช็กว่า deploy กฎ Firestore แล้ว (npx firebase-tools deploy --only firestore:rules) และเว็บเป็นเวอร์ชัน 0.1.0 ขึ้นไป')
process.exit(0)
