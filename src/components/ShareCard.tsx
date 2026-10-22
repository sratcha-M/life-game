import { useEffect, useState } from 'react'

interface CardProps {
  make: () => Promise<Blob>
  fileName: string
  title: string
  text: string
  onShared?: () => void
  onFail?: () => void
}

/**
 * 🖼️ หน้าดูการ์ดชีวิต: เปิดแล้ววาดรูปทันที → ปุ่ม 📤 แชร์ / 💾 บันทึกรูป
 * เหตุที่ไม่เรียก navigator.share ทันทีหลังวาด: มือถือ (Safari, เบราว์เซอร์ในแอป LINE/FB) อนุญาตเปิดเมนูแชร์เฉพาะ "ตอนแตะ"
 * ถ้ารอวาดรูปก่อน เมนูแชร์จะถูกปฏิเสธหรือค้างไม่ตอบ → ตอนนี้กดแชร์ตอนรูปพร้อมแล้ว จึงเปิดได้ทันที
 * ใช้แยกได้ (อัลบั้ม: ปิดหน้ารายละเอียดชีวิตก่อน แล้วค่อยเปิดหน้านี้ ไม่ให้ซ้อนกัน)
 */
export function ShareCardModal({ make, fileName, title, text, onShared, onFail, onClose }: CardProps & { onClose: () => void }) {
  const [card, setCard] = useState<{ url: string; file: File } | null>(null)
  useEffect(() => {
    let url = ''
    let alive = true
    make()
      .then((blob) => { url = URL.createObjectURL(blob); if (alive) setCard({ url, file: new File([blob], fileName, { type: 'image/png' }) }) })
      .catch((e) => { console.warn('life card failed', e); if (alive) { onClose(); onFail?.() } })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const canShare = !!card && (() => { try { return !!navigator.canShare?.({ files: [card.file] }) } catch { return false } })()
  // เรียกตรงจากการแตะ (รูปพร้อมแล้ว) — ไม่ await อะไรก่อน เพื่อให้เบราว์เซอร์ยอมเปิดเมนูแชร์
  const shareNow = () => { if (card) navigator.share({ files: [card.file], text }).then(() => onShared?.()).catch(() => { /* ยกเลิก/ไม่รองรับ → ยังบันทึกรูปได้ */ }) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="popin flex max-h-full w-full max-w-sm flex-col rounded-3xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl text-[#5a3443]">🖼️ {title}</h3>
        {card
          ? <img src={card.url} alt={`การ์ดชีวิต ${title}`} className="mt-2 min-h-0 w-full flex-1 rounded-2xl object-contain shadow" />
          : <div className="mt-2 flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-[#fdf3f5] font-display text-[#8a6a76]"><span className="animate-pulse">🖼️ กำลังทำการ์ด...</span></div>}
        <p className="mt-2 text-[.8125rem] text-[#8a6a76]">แชร์หรือบันทึกรูปแล้วโพสต์ลงโซเชียลได้เลย (ถ้าปุ่มใช้ไม่ได้: กดค้างที่รูป → บันทึกรูปภาพ)</p>
        <div className={`mt-2 grid gap-2 ${canShare ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {canShare && <button onClick={shareNow} className="whitespace-nowrap rounded-2xl bg-[#e0707f] py-3 font-display text-white active:scale-95">📤 แชร์</button>}
          <a href={card?.url} download={fileName} aria-disabled={!card} className={`whitespace-nowrap rounded-2xl py-3 text-center font-display ${canShare ? 'border-2 border-[#e0707f] text-[#c0505f]' : 'bg-[#e0707f] text-white'} ${card ? '' : 'pointer-events-none opacity-50'}`}>💾 บันทึกรูป</a>
          <button onClick={onClose} className="whitespace-nowrap rounded-2xl border-2 border-[#e6dde1] py-3 font-display text-[#5a3443]">ปิด</button>
        </div>
      </div>
    </div>
  )
}

/** 🖼️ ปุ่มแชร์การ์ดชีวิต + หน้าดูการ์ด (หน้าจบเกม) */
export function ShareCard({ className = '', label = '🖼️ แชร์การ์ดชีวิต', ...props }: CardProps & { className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>{label}</button>
      {open && <ShareCardModal {...props} onClose={() => setOpen(false)} />}
    </>
  )
}
