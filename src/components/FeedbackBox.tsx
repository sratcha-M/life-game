import { useState } from 'react'
import { sendFeedback, type Feedback } from '../lib/telemetry'
import { cloudDb } from '../lib/cloud'
import type { Ending, GameState } from '../game/types'

const FUN = ['😴', '😐', '🙂', '😄', '🤩']
const FAIR: { id: NonNullable<Feedback['fair']>; label: string }[] = [
  { id: 'fair', label: '👍 สมเหตุสมผล' },
  { id: 'confused', label: '🤔 งง ๆ' },
  { id: 'unfair', label: '😤 ไม่ยุติธรรม' },
]

/** กล่องความเห็นท้ายเกม — ไม่บังคับ ส่งแบบไม่ระบุตัวตน */
export function FeedbackBox({ s, ending, age }: { s: GameState; ending: Ending; age: number }) {
  const [f, setF] = useState<Feedback>({ fun: 0, fair: null, again: null, text: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  if (!cloudDb()) return null
  const ready = f.fun > 0 || f.fair || f.text.trim()
  const submit = async () => {
    setState('sending')
    setState((await sendFeedback(s, ending, age, f)) ? 'sent' : 'error')
  }
  if (state === 'sent') return <div className="popin rounded-3xl bg-white/90 p-4 text-center font-display text-lg text-[#2f6a4a] shadow-xl">💌 ขอบคุณมาก! ความเห็นนี้ช่วยให้เกมดีขึ้น</div>
  const chip = (on: boolean) => `whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm transition active:scale-95 ${on ? 'border-[#e0707f] bg-[#fdf3f5] text-[#c0505f]' : 'border-[#e6dde1] bg-white text-[#6a5a62]'}`
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-xl sm:p-5">
      <div className="font-display text-lg text-[#5a3443]">💬 ช่วยบอกหน่อย เล่นแล้วเป็นไง?</div>
      <div className="text-[.8125rem] text-[#8a6a76]">ไม่บังคับ · ไม่เก็บชื่อหรืออีเมล</div>

      <div className="mt-3 text-sm text-[#5a4a52]">สนุกแค่ไหน</div>
      <div className="mt-1 flex gap-1">
        {FUN.map((e, i) => (
          <button key={e} onClick={() => setF({ ...f, fun: i + 1 })} aria-label={`${i + 1} ดาว`} className={`flex-1 rounded-xl py-1.5 text-2xl transition active:scale-90 ${f.fun === i + 1 ? 'bg-[#ffe8a3] ring-2 ring-[#ffd166]' : 'bg-[#f6f2f4] opacity-70'}`}>{e}</button>
        ))}
      </div>

      <div className="mt-3 text-sm text-[#5a4a52]">ฉากจบ "{ending.title}" ที่ได้...</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {FAIR.map((x) => <button key={x.id} onClick={() => setF({ ...f, fair: f.fair === x.id ? null : x.id })} className={chip(f.fair === x.id)}>{x.label}</button>)}
      </div>

      <div className="mt-3 text-sm text-[#5a4a52]">อยากเล่นอีกรอบไหม</div>
      <div className="mt-1 flex gap-1.5">
        <button onClick={() => setF({ ...f, again: f.again === true ? null : true })} className={chip(f.again === true)}>🔁 อยาก</button>
        <button onClick={() => setF({ ...f, again: f.again === false ? null : false })} className={chip(f.again === false)}>🙅 พอแล้ว</button>
      </div>

      <textarea
        value={f.text}
        onChange={(e) => setF({ ...f, text: e.target.value.slice(0, 500) })}
        rows={3}
        placeholder="ตรงไหนงง ไม่สนุก หรืออยากให้มีอะไรเพิ่ม... (ไม่ใส่ก็ได้)"
        className="mt-3 w-full select-text rounded-xl border-2 border-[#f0d4dc] p-2 text-[.875rem] leading-[1.6] text-[#3a2433] placeholder:text-[#b9a8b0]"
      />
      <button
        onClick={submit}
        disabled={!ready || state === 'sending'}
        className="mt-2 w-full whitespace-nowrap rounded-2xl bg-[#5a3443] px-5 py-3 font-display text-lg text-white shadow-lg transition active:scale-[.98] disabled:opacity-40"
      >
        {state === 'sending' ? 'กำลังส่ง...' : state === 'error' ? '⚠️ ส่งไม่สำเร็จ ลองอีกครั้ง' : '📮 ส่งความเห็น'}
      </button>
    </div>
  )
}
