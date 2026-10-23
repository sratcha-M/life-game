import { useEffect, useState } from 'react'
import { cloudReady, cloudState, logOut, onCloud, resetPassword, signIn, signUp } from '../lib/cloud'

/** ปุ่มบัญชีมุมจอ + หน้าต่าง login/สมัคร */
export function AccountButton() {
  const [cs, setCs] = useState(cloudState())
  const [open, setOpen] = useState(false)
  useEffect(() => onCloud(setCs), [])
  const u = cs.user
  const dot = cs.sync === 'syncing' ? 'bg-[#ffd166]' : cs.sync === 'error' ? 'bg-[#e0707f]' : u ? 'bg-[#3fae78]' : 'bg-white/60'
  return (
    <>
      <button onClick={() => setOpen(true)} className="absolute right-3 top-3 z-20 flex max-w-[60vw] items-center gap-2 whitespace-nowrap rounded-full bg-white/90 py-1.5 pl-2 pr-3 font-display text-[.875rem] text-[#5a3443] shadow-lg backdrop-blur active:scale-95">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
        <span className="truncate">{u ? `👤 ${u.displayName || u.email}` : '👤 เข้าสู่ระบบ'}</span>
      </button>
      {open && <AccountModal onClose={() => setOpen(false)} />}
    </>
  )
}

export function AccountModal({ onClose }: { onClose: () => void }) {
  const [cs, setCs] = useState(cloudState())
  useEffect(() => onCloud(setCs), [])
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const r = mode === 'in' ? await signIn(email, pw) : mode === 'up' ? await signUp(email, pw, name) : await resetPassword(email)
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: r.error })
    if (mode === 'reset') return setMsg({ ok: true, text: 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว' })
    setMsg({ ok: true, text: 'เข้าสู่ระบบแล้ว กำลังซิงก์ข้อมูล...' })
  }
  const u = cs.user
  const input = 'mt-1 w-full rounded-xl border-2 border-[#f0d4dc] px-3 py-2.5 text-[1rem] outline-none focus:border-[#e0707f]'
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="popin max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 text-[.9375rem] leading-[1.65] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {!cloudReady ? (
          <>
            <h3 className="font-display text-2xl text-[#5a3443]">☁️ บัญชีผู้เล่น</h3>
            <p className="mt-2 text-[#6a5a62]">เวอร์ชันนี้ยังไม่ได้เชื่อมฐานข้อมูล — ข้อมูลทั้งหมดเก็บไว้ในเครื่องนี้เท่านั้น</p>
            <button onClick={onClose} className="mt-4 w-full whitespace-nowrap rounded-2xl bg-[#e0707f] py-3 font-display text-white">ตกลง</button>
          </>
        ) : u ? (
          <>
            <h3 className="font-display text-2xl text-[#5a3443]">👤 {u.displayName || 'บัญชีของฉัน'}</h3>
            <p className="text-[.875rem] text-[#8a6a76]">{u.email}</p>
            <div className="mt-3 rounded-2xl bg-[#eef8f1] p-3 text-[.875rem] text-[#2f6a4a]">
              {cs.sync === 'syncing' ? '⏳ กำลังซิงก์...' : cs.sync === 'error' ? '⚠️ ซิงก์ไม่สำเร็จ จะลองใหม่อัตโนมัติ' : '✅ เซฟ อัลบั้มชีวิต ฉากจบ ถ้วย และความลับ ถูกเก็บบนคลาวด์แล้ว'}
              {cs.lastSync && <div className="text-[.8125rem] text-[#5a7a66]">ซิงก์ล่าสุด {new Date(cs.lastSync).toLocaleTimeString('th-TH')}</div>}
            </div>
            <p className="mt-2 text-[.8125rem] text-[#8a6a76]">เข้าสู่ระบบด้วยอีเมลเดียวกันบนเครื่องไหนก็เล่นต่อได้</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={onClose} className="whitespace-nowrap rounded-2xl bg-[#e0707f] py-3 font-display text-white">✔️ ปิด</button>
              <button onClick={() => { void logOut() }} className="whitespace-nowrap rounded-2xl border-2 border-[#d9c9d0] py-3 font-display text-[#5a3443]">🚪 ออกจากระบบ</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h3 className="font-display text-2xl text-[#5a3443]">{mode === 'in' ? '👤 เข้าสู่ระบบ' : mode === 'up' ? '✨ สมัครบัญชี' : '🔑 ลืมรหัสผ่าน'}</h3>
            <p className="text-[.8125rem] text-[#8a6a76]">เล่นเกมเต็มเรื่อง เก็บเซฟและอัลบั้มชีวิตไว้บนคลาวด์ เล่นต่อได้ทุกเครื่อง และสร้างตระกูลของตัวเอง · ไม่ login เล่นได้แค่โหมดทดลอง (~5 นาที)</p>
            {mode === 'up' && <label className="mt-3 block text-[.875rem] text-[#7a5a66]">ชื่อที่แสดง<input className={input} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} /></label>}
            <label className="mt-3 block text-[.875rem] text-[#7a5a66]">อีเมล<input className={input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {mode !== 'reset' && <label className="mt-3 block text-[.875rem] text-[#7a5a66]">รหัสผ่าน{mode === 'up' && ' (อย่างน้อย 6 ตัว)'}<input className={input} type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></label>}
            {msg && <div className={`mt-3 rounded-xl px-3 py-2 text-[.875rem] ${msg.ok ? 'bg-[#eaf7ef] text-[#2f6a4a]' : 'bg-[#fdecef] text-[#c0505f]'}`}>{msg.text}</div>}
            <button disabled={busy} className="mt-4 w-full whitespace-nowrap rounded-2xl bg-[#e0707f] py-3 font-display text-lg text-white shadow-lg disabled:opacity-50">
              {busy ? '⏳ รอสักครู่...' : mode === 'in' ? '🔓 เข้าสู่ระบบ' : mode === 'up' ? '✨ สมัครและเข้าสู่ระบบ' : '📧 ส่งลิงก์ตั้งรหัสใหม่'}
            </button>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[.875rem]">
              {mode !== 'up' ? <button type="button" onClick={() => { setMode('up'); setMsg(null) }} className="text-[#c0505f] underline">ยังไม่มีบัญชี? สมัคร</button> : <button type="button" onClick={() => { setMode('in'); setMsg(null) }} className="text-[#c0505f] underline">มีบัญชีแล้ว? เข้าสู่ระบบ</button>}
              {mode === 'in' && <button type="button" onClick={() => { setMode('reset'); setMsg(null) }} className="text-[#8a6a76] underline">ลืมรหัสผ่าน</button>}
            </div>
            <button type="button" onClick={onClose} className="mt-3 w-full whitespace-nowrap rounded-2xl border-2 border-[#eee] py-2.5 font-display text-[#7a5a66]">🎮 เล่นแบบไม่ login</button>
          </form>
        )}
      </div>
    </div>
  )
}
