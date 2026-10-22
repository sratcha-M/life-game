import { useState } from 'react'

/** 🕯️ ช่วงหยุดคิด: ถามผู้เล่นตัวจริงสั้น ๆ ตอนชีวิตในเกมข้ามอายุสำคัญ — ตอบหรือข้ามก็ได้ */
export function ReflectPause({ age, q, hint, name, onDone, onStop }: { age: number; q: string; hint: string; name: string; onDone: (answer: string) => void; onStop: () => void }) {
  const [a, setA] = useState('')
  return (
    <div className="fadein absolute inset-0 z-40 flex items-center justify-center bg-[#1e1828]/80 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="popin w-full max-w-md rounded-3xl bg-[#fffaf3] p-5 text-center shadow-2xl sm:p-6">
        <div className="text-4xl">🕯️</div>
        <div className="mt-1 text-[.8125rem] tracking-wide text-[#8a6a76]">หยุดหายใจสักครู่ · {name} อายุ {age} ปีแล้ว</div>
        <div className="mt-3 text-sm text-[#8a6a76]">คำถามนี้สำหรับ <b className="font-normal text-[#5a3443]">คุณ</b> ไม่ใช่ตัวละคร</div>
        <h3 className="mt-1 font-display text-2xl leading-snug text-[#5a3443]">{q}</h3>
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value.slice(0, 140))}
          rows={2}
          autoFocus
          placeholder={hint}
          className="mt-4 w-full select-text rounded-2xl border-2 border-[#f0d4dc] bg-white p-3 text-center text-[.9375rem] leading-[1.6] text-[#3a2433] placeholder:text-[#b9a8b0]"
        />
        <div className="mt-1 text-right text-[.6875rem] text-[#b9a8b0]">{a.length}/140 · ไม่เผยแพร่ให้ใครเห็น</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => onDone('')} className="whitespace-nowrap rounded-2xl border-2 border-[#e6dde1] bg-white py-3 font-display text-base text-[#8a6a76] active:scale-95">ข้าม</button>
          <button onClick={() => onDone(a)} disabled={!a.trim()} className="whitespace-nowrap rounded-2xl bg-[#5a3443] py-3 font-display text-base text-white shadow-lg active:scale-95 disabled:opacity-40">💭 เก็บไว้</button>
        </div>
        <button onClick={onStop} className="mt-3 text-[.8125rem] text-[#a08a94] underline-offset-2 hover:underline">ไม่ต้องถามอีก (เปิดใหม่ได้ที่เมนู ☰)</button>
      </div>
    </div>
  )
}
