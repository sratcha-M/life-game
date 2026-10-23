import { useEffect, useRef, useState } from 'react'
import { Background } from './art/Background'
import { Character, NAMES, kidName } from './art/Character'
import {
  applyChoice, CAREERS, dropSave, fmtBaht, listSaves, netWorth, passYears, married, ENDINGS, fillText, getScene, HIDDEN_LABEL, newGame, nextSceneId, slotId, type SaveSlot,
  partnerName, pickEnding, endAgeOf, statProfile, nearestEndings, endingRules, weirdRules, rememberScenes, resolveLines, save, STAT_INFO, unlockedEndings, unlockEnding, visibleChoices,
} from './game/engine'
import { stageOf } from './game/story'
import { SwipeChoice, splitIcon } from './components/SwipeChoice'
import { MiniGame } from './components/MiniGame'
import { DebtBar, HustleMode, type HustleResult } from './components/HustleMode'
import { charAge } from './art/Character'
import { endingArtOf } from './art/endingArt'
import { personaSentence } from './game/personaHooks'
import { AccountButton, AccountModal } from './components/Account'
import { cloudReady, cloudState, onCloud, setTrialRun } from './lib/cloud'
import { PARENT_AGE, pct, qx, SOURCES } from './game/realstats'
import { MARKET_BASIS, SHOCKS } from './game/finance'
import { hasThaiVoice, isSpeaking, setVoiceOn, speak, stopVoice, tick, voiceOn, voiceSupported } from './lib/voice'
import type { BondId, CharId, Choice, Ending, Expr, GameState, Gender, Line, PastLife, StatKey } from './game/types'
import { BOND_INFO, bondOf } from './game/bonds'
import { careerById } from './game/careers'
import { LIFE_FLAGS, labeledFlags } from './game/lifeflags'
import { addPersona, personaDelta, personaPct, personaTitle } from './game/persona'
import { discoverSecret, foundSecrets, secretNo, secretTag, SECRETS } from './game/secrets'
import { isBroke, livingCost, salaryOf, sideGig } from './game/finance'
import { ancestorOf, canPassOn, freshUnlocks, giftsOf, inheritedPersona, hasUnlock, heirloomOf, inheritanceOf, lifeRecords, recordLife, UNLOCKS, unlockedIds, type Heirloom, type LifeRecord, type Unlock } from './game/meta'
import { ACHS, checkAchs, choiceKey, karmaOf, rebornTrait, dreamOf, DREAMS, pickFew, recordDream, TRAITS, unlockAch, unlockedAchs, type Ach } from './game/goals'
import { musicOn, playMusic, resumeAudio, setMusicOn, sfx, type Mood } from './lib/sound'
import { Fx, type FxKind } from './components/Fx'
import { logEnd, logQuit, logStart, trackScene } from './lib/telemetry'
import { FeedbackBox } from './components/FeedbackBox'
import { ReflectPause } from './components/ReflectPause'
import { markAsked, reflectionAt, reflectOn, resetAsked, setReflectOn } from './game/reflect'
import { drawLifeCard, drawRecordCard } from './lib/lifeCard'
import { ShareCard, ShareCardModal } from './components/ShareCard'

type Screen = 'title' | 'setup' | 'play' | 'ending' | 'album' | 'reborn' | 'legacy'
/** ทดสอบโหมดทดลองเล่นบนเครื่องที่ไม่ได้ต่อ Firebase: ใส่ ?trial ท้าย URL */
const FORCE_TRIAL = new URLSearchParams(location.search).has('trial')
/** ยังไม่ login → เล่นได้แค่โหมดทดลอง (สั้น ~5 นาที ไม่มีตระกูล) */
function useTrial() {
  const [user, setUser] = useState(cloudState().user)
  useEffect(() => onCloud((c) => setUser(c.user)), [])
  return FORCE_TRIAL || (cloudReady && !user)
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const trial = useTrial()
  const [game, setGame] = useState<GameState | null>(null)
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSaves())
  const [legacyBack, setLegacyBack] = useState<Screen>('ending')
  const latest = saves.find((x) => x.status === 'play')

  const start = (g: GameState) => { setTrialRun(!!g.quick); save(g); setGame(g); setScreen('play') }
  const refresh = () => setSaves(listSaves())
  const toTitle = () => { setTrialRun(false); refresh(); setScreen('title') }
  // จบชีวิตแล้วมีลูก → เก็บไว้ในเมนูตระกูล กลับมาเล่นเป็นลูกเมื่อไรก็ได้ · ไม่มีลูก → ปิดเซฟตระกูลนั้น
  const end = (g: GameState) => { if (canPassOn(g) && !g.quick) save(g, 'heir'); else dropSave(slotId(g)); setGame(g); setScreen('ending') }
  const open = (x: SaveSlot) => {
    if (x.status === 'play') return start(x.s)
    setGame(x.s); setLegacyBack('album'); setScreen('legacy')
  }
  // login แล้วดึงเซฟจากคลาวด์มา → อัปเดตปุ่ม "เล่นต่อ"
  useEffect(() => { window.addEventListener('lifepath-cloud-merged', refresh); return () => window.removeEventListener('lifepath-cloud-merged', refresh) }, [])

  return (
    <div className="relative h-full w-full select-none overflow-hidden font-body" onPointerDown={resumeAudio}>
      {screen === 'title' && (
        <Title
          trial={trial}
          latest={trial ? null : latest?.s ?? null}
          onNew={() => setScreen('setup')}
          onContinue={() => latest && start(latest.s)}
          onAlbum={() => { refresh(); setScreen('album') }}
        />
      )}
      {screen === 'setup' && <Setup quick={trial} onBack={toTitle} onStart={start} />}
      {screen === 'reborn' && game && <Reborn prev={game} onStart={start} />}
      {screen === 'legacy' && game && <Legacy prev={game} onStart={start} onBack={() => { if (legacyBack !== 'ending') refresh(); setScreen(legacyBack) }} />}
      {screen === 'play' && game && (
        <Play
          key={game.seed}
          initial={game}
          onQuit={() => { logQuit(); toTitle() }}
          onEnd={end}
        />
      )}
      {screen === 'ending' && game && <EndingScreen s={game} onTitle={toTitle} onAgain={() => setScreen('setup')} onReborn={() => setScreen('reborn')} onLegacy={() => { setLegacyBack('ending'); setScreen('legacy') }} />}
      {screen === 'album' && <Album saves={saves} onOpen={open} onDelete={(id) => { dropSave(id); refresh() }} onBack={toTitle} />}
    </div>
  )
}

/** ชื่อคนพูด (คู่ชีวิตอาจไม่ใช่ฟ้า) */
const whoName = (who: CharId, s: GameState) => (who === 'me' ? s.name : who === 'fah' ? partnerName(s) : who === 'kid' ? kidName(s.sceneId) : NAMES[who])

/* ───────────────────────── หน้าแรก ───────────────────────── */
function Title({ trial, latest, onNew, onContinue, onAlbum }: { trial: boolean; latest: GameState | null; onNew: () => void; onContinue: () => void; onAlbum: () => void }) {
  const hasSave = !!latest
  useEffect(() => { playMusic('title') }, [])
  return (
    <div className="fadein absolute inset-0">
      <Background id="title" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#3a2030]/85 via-[#3a2030]/15 to-transparent" />
      <AccountButton />
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-[8dvh] text-center">
        <p className="font-display text-sm tracking-[0.3em] text-white/90 drop-shadow">LIFE · PATH</p>
        <h1 className="font-display text-5xl font-semibold text-white drop-shadow-[0_3px_0_#e0707f] sm:text-7xl">เส้นทางชีวิต</h1>
        <p className="mt-2 max-w-md text-base text-white/90 drop-shadow sm:text-lg">ตั้งแต่แรกเกิดจนถึงวันเกิดปีที่ 70 คุณจะเติบโตเป็นใคร?</p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          {latest && <Btn primary onClick={onContinue}>▶ เล่นต่อ <span className="text-base opacity-85">· {latest.name}</span></Btn>}
          <Btn primary={!hasSave} onClick={onNew}>{trial ? <>⚡ ทดลองเล่น <span className="text-base opacity-85">· ~5 นาที</span></> : '✨ เริ่มชีวิตใหม่'}</Btn>
          <Btn onClick={onAlbum}>📸 อัลบั้มชีวิต & ของสะสม</Btn>
        </div>
        {trial && <p className="mt-3 max-w-xs text-[.8125rem] text-white/85 drop-shadow">🔓 เข้าสู่ระบบเพื่อเล่นเต็มเรื่อง เก็บข้อมูลไว้บนคลาวด์ และสร้างตระกูลของตัวเอง</p>}
      </div>
      <div className="absolute bottom-2 right-3 z-10 text-[.6875rem] text-white/50">v{__APP_VERSION__}</div>
    </div>
  )
}

function Btn({ children, onClick, primary, className = '' }: { children: React.ReactNode; onClick: () => void; primary?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 font-display text-lg shadow-lg transition active:scale-95 ${primary ? 'bg-[#e0707f] text-white hover:bg-[#d65f70]' : 'bg-white/90 text-[#5a3443] hover:bg-white'} ${className}`}
    >
      {children}
    </button>
  )
}

/* ───────────────────────── สร้างตัวละคร ───────────────────────── */
const HAIRS = ['#2a1c18', '#5a3825', '#8a5a3c', '#c98a4a', '#6b3f7a']
/** ชื่อเล่นสำหรับปุ่มสุ่ม */
const NICKS: Record<Gender, string[]> = {
  girl: ['มิ้นท์', 'ใบเตย', 'แพรว', 'น้ำหวาน', 'ขิม', 'ปราง', 'ฝน', 'แป้ง', 'จูน', 'เมย์', 'ไอซ์', 'ข้าวหอม', 'พลอย', 'น้ำฝน', 'กิ๊ฟ', 'มุก', 'ส้มโอ', 'บัว', 'ลูกพีช', 'ชมพู่'],
  boy: ['ภูมิ', 'ต้นกล้า', 'บอส', 'ปั้น', 'เจได', 'กอล์ฟ', 'บิว', 'ไผ่', 'ตั้ม', 'เก่ง', 'ซัน', 'ข้าวกล้า', 'ปลื้ม', 'ฟลุ๊ค', 'โอ๊ต', 'เต้', 'ภู', 'นนท์', 'อิ่ม', 'ทะเล'],
}
const randNick = (g: Gender, not = '') => pickFew(NICKS[g].filter((n) => n !== not), 1)[0]
function Setup({ quick, onBack, onStart }: { quick: boolean; onBack: () => void; onStart: (g: GameState) => void }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('girl')
  const [step, setStep] = useState<'who' | 'fate' | 'dream'>('who')
  const [unl] = useState(() => unlockedIds())
  const nCards = unl.includes('perk_card4') ? 4 : 3
  const dealCards = () => {
    const base = pickFew(TRAITS.filter((t) => !t.special), nCards)
    const sp = TRAITS.filter((t) => t.special && unl.includes(t.id))
    if (sp.length && Math.random() < 0.6) base[Math.floor(Math.random() * nCards)] = pickFew(sp, 1)[0]
    return base
  }
  const [cards, setCards] = useState(dealCards)
  const [redraws, setRedraws] = useState(unl.includes('perk_redraw') ? 1 : 0)
  const [dreams] = useState(() => {
    const pool = DREAMS.filter((d) => !d.special || unl.includes(d.id))
    const sp = pool.filter((d) => d.special)
    const picked = pickFew(pool.filter((d) => !d.special), unl.includes('perk_dream4') ? 4 : 3)
    if (sp.length) picked[picked.length - 1] = pickFew(sp, 1)[0]
    return picked
  })
  const [flipped, setFlipped] = useState<number | null>(null)
  const [dream, setDream] = useState<string | null>(null)
  const hair = HAIRS[0]
  const preview = newGame(name || '...', gender, hair)
  const ok = name.trim().length > 0
  useEffect(() => { playMusic('title') }, [])
  // โหมดทดลองเล่น: ไม่มีขั้นเลือกความฝัน (ฉากที่พาไปถึงความฝันอยู่ในเกมเต็ม)
  const go = () => { sfx('good'); onStart(newGame(name.trim(), gender, hair, flipped != null ? cards[flipped].id : undefined, quick ? undefined : dream ?? undefined, quick)) }
  // 🎲 สุ่มเกิด: สุ่มเพศ ชื่อ (ถ้ายังไม่ได้พิมพ์) ไพ่ และความฝัน แล้วเกิดเลย
  const randomBirth = () => {
    const g: Gender = Math.random() < 0.5 ? 'girl' : 'boy'
    sfx('good')
    onStart(newGame(name.trim() || randNick(g), g, hair, pickFew(cards, 1)[0].id, quick ? undefined : pickFew(dreams, 1)[0].id, quick))
  }
  return (
    <div className="fadein absolute inset-0 overflow-y-auto">
      <div className="fixed inset-0"><Background id="home" /></div>
      <div className="fixed inset-0 bg-[#2b1d14]/40" />
      <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-6 sm:flex-row sm:gap-10">
        {step === 'who' && (
          <div className="bob h-[30dvh] w-[23dvh] shrink-0 sm:h-[60dvh] sm:w-[45dvh]">
            <Character id="me" playerAge={8} s={preview} bg="home" expr="happy" />
          </div>
        )}
        <div key={step} className="popin w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-2xl sm:max-w-md">
          {step === 'who' && (
            <>
              {quick && <div className="mb-3 rounded-xl bg-[#fff4d6] px-3 py-2 text-[.8125rem] leading-snug text-[#7a5a20]">⚡ <b>โหมดทดลองเล่น</b> — ชีวิตฉบับย่อ จบใน ~5 นาที · เข้าสู่ระบบเพื่อเล่นเต็มเรื่อง</div>}
              <h2 className="font-display text-2xl text-[#5a3443]">ตัวละครของคุณ</h2>
              <label className="mt-4 block text-sm font-semibold text-[#7a5a66]">ชื่อเล่น</label>
              <div className="relative mt-1">
                <input autoFocus value={name} maxLength={12} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && ok && (sfx('tap'), setStep('fate'))}
                  placeholder="เช่น มิ้นท์, ภูมิ, ใบเตย"
                  className="w-full rounded-xl border-2 border-[#f0d4dc] py-3 pl-4 pr-14 text-lg outline-none focus:border-[#e0707f]" />
                <button onClick={() => { sfx('tap'); setName(randNick(gender, name)) }} title="สุ่มชื่อ" aria-label="สุ่มชื่อ"
                  className="absolute inset-y-1.5 right-1.5 rounded-lg bg-[#fde8ed] px-3 text-xl transition active:scale-90">🎲</button>
              </div>
              <label className="mt-4 block text-sm font-semibold text-[#7a5a66]">เพศ</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(['girl', 'boy'] as const).map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`rounded-xl border-2 py-2 font-display ${gender === g ? 'border-[#e0707f] bg-[#fde8ed] text-[#c0505f]' : 'border-[#eee] text-[#7a5a66]'}`}>
                    {g === 'girl' ? '👧 หญิง' : '👦 ชาย'}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Btn onClick={onBack} className="flex-1">กลับ</Btn>
                <button disabled={!ok} onClick={() => { sfx('tap'); setStep('fate') }}
                  className="flex-[2] rounded-2xl bg-[#e0707f] px-5 py-3 font-display text-lg text-white shadow-lg transition enabled:active:scale-95 disabled:opacity-40">ต่อไป →</button>
              </div>
              <button onClick={randomBirth}
                className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#c9b6e8] py-2 font-display text-[#7b5cd6] transition active:scale-95">🎲 สุ่มเกิด <span className="font-body text-xs text-[#8a6a76]">— สุ่มเพศ ชื่อ ไพ่{quick ? '' : ' ความฝัน'} แล้วเกิดเลย</span></button>
            </>
          )}
          {step === 'fate' && (
            <>
              <h2 className="font-display text-2xl text-[#5a3443]">🔮 ไพ่ดวงชะตา</h2>
              <p className="text-sm text-[#7a5a66]">เลือก 1 ใบ แล้วดูว่า {name} เกิดมาพร้อมอะไร</p>
              <div className={`mt-4 grid gap-2 ${nCards === 4 ? 'grid-cols-4' : 'grid-cols-3'}`} style={{ perspective: 800 }}>
                {cards.map((c, i) => {
                  const up = flipped != null
                  const mine = flipped === i
                  return (
                    <button key={c.id} disabled={up} onClick={() => { setFlipped(i); sfx('unlock') }}
                      className={`relative aspect-[3/4] rounded-2xl text-center shadow-lg transition duration-500 ${up && !mine ? 'opacity-45' : ''} ${mine ? 'scale-105 ring-4 ring-[#ffd166]' : ''}`}
                      style={{ transformStyle: 'preserve-3d', transform: up ? 'rotateY(0)' : 'rotateY(180deg)' }}>
                      {up ? (
                        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl bg-[#fff8f0] p-2">
                          <span className="text-4xl">{c.icon}</span>
                          {c.special && <span className="rounded-full bg-[#ffd166] px-1.5 text-[.75rem] font-semibold text-[#6a4a00]">พิเศษ</span>}
                          <span className="font-display text-sm leading-tight text-[#3a2433]">{c.name}</span>
                          <span className="text-[.75rem] leading-tight text-[#8a6a76]">{c.desc}</span>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b5cd6] to-[#e0707f] text-4xl text-white/90" style={{ transform: 'rotateY(180deg)' }}>✦</div>
                      )}
                    </button>
                  )
                })}
              </div>
              {redraws > 0 && flipped == null && (
                <button onClick={() => { sfx('whoosh'); setCards(dealCards()); setRedraws(0) }} className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#c9b6e8] py-2 font-display text-sm text-[#7b5cd6]">🔄 สับไพ่ใหม่ (เหลือ 1 ครั้ง)</button>
              )}
              <button disabled={flipped == null} onClick={() => { if (quick) return go(); sfx('tap'); setStep('dream') }}
                className="mt-5 w-full rounded-2xl bg-[#e0707f] px-5 py-3 font-display text-lg text-white shadow-lg transition enabled:active:scale-95 disabled:opacity-40">{quick ? 'เกิด! 👶' : 'ต่อไป →'}</button>
            </>
          )}
          {step === 'dream' && (
            <>
              <h2 className="font-display text-2xl text-[#5a3443]">⭐ ความฝันของชีวิต</h2>
              <p className="text-sm text-[#7a5a66]">เป้าหมายที่ {name} อยากทำให้ได้ก่อนอายุ 70</p>
              <div className="mt-4 flex flex-col gap-2">
                {dreams.map((d) => (
                  <button key={d.id} onClick={() => { setDream(d.id); sfx('tap') }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${dream === d.id ? 'border-[#e0707f] bg-[#fde8ed]' : 'border-[#f0e4e8] bg-white hover:border-[#f6b5c2]'}`}>
                    <span className="text-3xl">{d.icon}</span>
                    <span><span className="block font-display text-[#3a2433]">{d.name} {d.special && <span className="rounded-full bg-[#ffd166] px-1.5 align-middle font-body text-[.75rem] text-[#6a4a00]">พิเศษ</span>}</span><span className="text-xs text-[#8a6a76]">{d.desc}</span></span>
                  </button>
                ))}
              </div>
              <button disabled={!dream} onClick={go}
                className="mt-5 w-full rounded-2xl bg-[#e0707f] px-5 py-3 font-display text-lg text-white shadow-lg transition enabled:active:scale-95 disabled:opacity-40">เกิด! 👶</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── ตัวเกม ───────────────────────── */
type Phase = 'card' | 'lines' | 'choice' | 'result' | 'mini' | 'hustle' | 'reflect'
/** ความฝันที่ผูกกับฉากจบ (ร้อยปี / ตำนาน / บ้านเกิด) → โชว์ว่าเงื่อนไขครบกี่ข้อ (ดูรายละเอียดในเข็มทิศฉากจบ) */
/** เช็กลิสต์ของความฝันที่เลือก: ผูกฉากจบ → เงื่อนไขฉากจบ · ชีวิตแปลก → เส้นทางแปลกที่ไปไกลสุด (ข้อที่ยังไม่ได้ซ่อนเป็น ???) · อื่น ๆ → steps ของความฝัน */
const dreamSteps = (s: GameState): { label: string; ok: boolean }[] => {
  const d = dreamOf(s)
  if (!d) return []
  if (d.ending) return endingRules(s).find((x) => x.id === d.ending)?.checks ?? []
  if (d.id === 'weird') {
    const best = [...weirdRules(s)].sort((a, b) => b.checks.filter((c) => c.ok).length - a.checks.filter((c) => c.ok).length)[0]
    return best ? best.checks.map((c) => ({ ok: c.ok, label: c.ok ? c.label : '??? (ตามเรื่องแปลกต่อไป)' })) : []
  }
  return d.steps?.(s) ?? []
}
const dreamChecks = (s: GameState) => {
  const st = dreamSteps(s)
  return st.length > 1 ? ` · ✅ ${st.filter((c) => c.ok).length}/${st.length} 🧭` : ''
}
/** หมดตัวได้กี่ครั้งต่อชีวิต ก่อนล้มละลาย */
const HUSTLE_MAX = 7

function Play({ initial, onQuit, onEnd }: { initial: GameState; onQuit: () => void; onEnd: (g: GameState) => void }) {
  const [s, setS] = useState(initial)
  const [phase, setPhase] = useState<Phase>('card')
  const [lines, setLines] = useState<Line[]>(() => resolveLines(getScene(initial.sceneId).lines, initial))
  const [idx, setIdx] = useState(0)
  const [toasts, setToasts] = useState<{ id: number; text: string; good: boolean }[]>([])
  const [panel, setPanel] = useState<null | 'stats' | 'log' | 'menu'>(null)
  const [voice, setVoice] = useState(voiceOn())
  const [left, setLeft] = useState<number | null>(null)
  const [react, setReact] = useState('✨')
  const [resultTone, setResultTone] = useState(0)
  const [hustle, setHustle] = useState<{ target: number; age: number; report: ReturnType<typeof passYears>['report'] | null } | null>(null)
  const [reflect, setReflect] = useState<{ age: number; q: string; hint: string } | null>(null)
  const [reflectAsk, setReflectAsk] = useState(reflectOn())
  const [report, setReport] = useState<ReturnType<typeof passYears>['report'] | null>(null)
  const [fx, setFx] = useState<{ kind: FxKind; key: number } | null>(null)
  const [shake, setShake] = useState(0)
  // จอสั่น: เล่นแอนิเมชันบน element เดิม (เคยใช้ key={shake} → ทั้งฉากถูกสร้างใหม่ ไอคอน/ตัวละครกะพริบ)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!shake || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rootRef.current?.animate(
      [[0, 0], [-10, 4], [9, -5], [-7, 3], [6, -2], [-3, 1], [0, 0]].map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })),
      { duration: 550, easing: 'ease' },
    )
  }, [shake])
  const [flash, setFlash] = useState<{ c: 'red' | 'white'; key: number } | null>(null)
  const [achPop, setAchPop] = useState<Ach[]>([])
  const [music, setMusic] = useState(musicOn())
  const [secretPop, setSecretPop] = useState<number | null>(null)

  const scene = getScene(s.sceneId)
  const cast = (typeof scene.cast === 'function' ? scene.cast(s) : scene.cast) ?? []
  const line = phase === 'lines' || phase === 'result' ? lines[idx] : phase === 'choice' ? lines[lines.length - 1] : undefined
  const choices = visibleChoices(scene, s)
  const pastLock = (c: Choice) => !!(s.life === 2 && s.past?.picks.includes(choiceKey(scene.id, c.text)))
  const allPast = s.life === 2 && choices.length > 0 && choices.every((c) => pastLock(c) || (c.lock && c.lock(s)))
  const lockOf = (c: Choice) => (c.lock ? c.lock(s) || null : null) ?? (!allPast && pastLock(c) ? '♾️ ชาติก่อนเลือกทางนี้แล้ว' : null)

  // พากย์เสียงเมื่อขึ้นบทใหม่
  useEffect(() => {
    if (!line) return
    const who = line.who as CharId | undefined
    speak(fillText(line.text, s), who, who ? charAge(who, scene.age, s, scene.id) : scene.age, s.gender, line.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line?.text, phase, idx, voice])
  useEffect(() => () => stopVoice(), [])
  // 📊 สถิติการเล่น: เริ่มชีวิต / เล่นต่อ
  useEffect(() => { logStart(initial); trackScene(initial, getScene(initial.sceneId).age) }, [initial])
  // ปลดหนี้หมด → ฉลอง
  const lastDebt = useRef(initial.debt)
  useEffect(() => {
    if (lastDebt.current > 0 && s.debt === 0) { sfx('unlock'); boom('coins'); toast(`🎉 ปลดหนี้หมดแล้ว! ไม่ต้องดิ้นรนหาเงินใช้หนี้อีก`, true) }
    lastDebt.current = s.debt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.debt])

  // จับเวลาเลือก — เริ่มนับหลังเสียงพากย์จบ + ให้เวลาอ่านตัวเลือกตามความยาว, หยุดนับเมื่อเปิดเมนู
  const panelRef = useRef(panel)
  panelRef.current = panel
  const [timerTotal, setTimerTotal] = useState(0)
  const [reading, setReading] = useState(false)
  useEffect(() => {
    if (phase !== 'choice' || !scene.timer) { setLeft(null); return }
    const chars = choices.reduce((n, c) => n + Array.from(c.text).length, 0)
    const total = scene.timer + Math.min(5, Math.max(0, (chars - 30) / 12))
    setTimerTotal(total)
    setLeft(total)
    setReading(true)
    const start = Date.now()
    const readFor = Math.min(6000, 1500 + (chars + Array.from(lines[lines.length - 1]?.text ?? '').length) * 35)
    let end = 0
    const t = setInterval(() => {
      if (!end) {
        if (panelRef.current || isSpeaking() || Date.now() - start < readFor) return
        end = Date.now() + total * 1000
        setReading(false)
      }
      if (panelRef.current) { end += 100; return }
      const ms = end - Date.now()
      setLeft(Math.max(0, ms / 1000))
      if (ms <= 0) {
        clearInterval(t)
        const open = choices.filter((c) => !lockOf(c))
        const c = open.find((x) => x.onTimeout) ?? open[open.length - 1]
        if (c) pick(c, true)
      }
    }, 100)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, s.sceneId])
  const lastTick = useRef(-1)
  useEffect(() => {
    if (left == null) return
    const sec = Math.ceil(left)
    if (sec !== lastTick.current && sec <= 3 && sec > 0) tick(true)
    lastTick.current = sec
  }, [left])

  // การ์ดบอกอายุตอนเริ่มฉาก
  useEffect(() => {
    if (phase !== 'card') return
    if (scene.call) sfx('ring')
    const t = setTimeout(() => setPhase(firstPhase()), report?.shock ? 4500 : scene.call ? 2300 : scene.age < 13 ? 900 : 1300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, s.sceneId])
  // ผลลัพธ์ไปต่อเอง
  useEffect(() => {
    if (phase !== 'result' || panel) return
    // รอให้อ่านทัน (ตามความยาวข้อความ) และเสียงพากย์พูดจบก่อน
    const minMs = readMs(lines[idx]?.text ?? '')
    const start = Date.now()
    const t = setInterval(() => { if (Date.now() - start >= minMs && !isSpeaking()) { clearInterval(t); if (idx < lines.length - 1) setIdx(idx + 1); else enter(s) } }, 150)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, panel])
  const boom = (kind: FxKind | null, opts: { shake?: boolean; flash?: 'red' | 'white' } = {}) => {
    const k = Date.now()
    if (kind) { setFx({ kind, key: k }); setTimeout(() => setFx((f) => (f?.key === k ? null : f)), 3200) }
    if (opts.shake) setShake(k)
    if (opts.flash) setFlash({ c: opts.flash, key: k })
  }
  const showAch = (a: Ach[]) => {
    if (!a.length) return
    sfx('unlock')
    setAchPop((p) => [...p, ...a])
    setTimeout(() => setAchPop((p) => p.filter((x) => !a.includes(x))), 3500)
  }
  // เพลงตามช่วงวัย
  useEffect(() => {
    const m: Mood = s.stats.happy <= 3 ? 'dark' : scene.age < 13 ? 'kid' : scene.age < 19 ? 'teen' : scene.age < 60 ? 'adult' : 'elder'
    playMusic(m)
  }, [scene.age, s.stats.happy])
  const firstPhase = (): Phase => (scene.minigame ? 'mini' : choices.length && lines.length <= 1 ? 'choice' : 'lines')
  const toast = (text: string, good: boolean) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, text, good }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700)
  }

  // กันเรียก enter ซ้ำจากฉากเดิม (แตะจอพร้อมกับตัวจับเวลาผลลัพธ์ไปต่อเอง → closure เก่าเขียนทับฉากใหม่)
  const leaving = useRef('')
  // ฉาก/ช่วงปัจจุบันล่าสุด — ให้ callback ที่มาช้า (closure เก่า) รู้ตัวว่าหมดสิทธิ์แล้ว
  const live = useRef({ sceneId: s.sceneId, phase })
  live.current = { sceneId: s.sceneId, phase }
  const enter = (g: GameState) => {
    const key = `${g.sceneId}|${g.visited?.length ?? 0}`
    if (leaving.current === key) return
    leaving.current = key
    if (g.endId) return onEnd(g)
    const id0 = nextSceneId(g)
    if (!id0) return onEnd(g)
    const { state: aged, report: rep } = passYears(g, scene.age, getScene(id0).age)
    const id = nextSceneId(aged) ?? id0
    setReport(rep.years > 0 ? rep : null)
    if (rep.shock) setTimeout(() => { sfx(rep.shock!.cash < 0 ? 'shock' : 'good'); boom(rep.shock!.cash < -50_000 ? 'rain' : rep.shock!.cash > 50_000 ? 'coins' : null, { shake: rep.shock!.cash < -50_000, flash: 'white' }) }, 500)
    const age = getScene(id).age
    let ng = { ...aged, sceneId: id, visited: [...(aged.visited ?? []), id] }
    // เงินสดหมดแต่ยังมีเงินลงทุน → ขายเงินลงทุนมาใช้ก่อน (ไม่ต้องไปหาเงินทั้งที่ยังมีทรัพย์สิน)
    if (isBroke(ng, age) && ng.invest > 0) {
      const sell = Math.min(ng.invest, 100_000 - ng.cash)
      const keep = 1 - sell / ng.invest
      ng = { ...ng, cash: ng.cash + sell, invest: ng.invest - sell, stocks: Math.round((ng.stocks ?? 0) * keep), stockIn: Math.round((ng.stockIn ?? 0) * keep) }
      setTimeout(() => toast(`📈 เงินสดหมด → ขายทรัพย์สิน ${fmtBaht(sell)} มาใช้จ่าย (เหลือ ${fmtBaht(ng.invest)})`, false), 400)
    }
    // เงินหมด → นับครั้ง (หมดตัวเกิน HUSTLE_MAX ครั้งทั้งที่ยังมีหนี้ = ล้มละลาย จบชีวิต)
    // โหมดทดลองเล่น: ไม่มีโหมดหาเงิน (ข้ามฉากหาเงินวัยเด็กไปแล้ว เงินขาดจะกลายเป็นหนี้เอง)
    const broke = !ng.quick && isBroke(ng, age)
    if (broke) {
      const n = (ng.hustles ?? 0) + 1
      if (n > HUSTLE_MAX && ng.debt > 0) return onEnd({ ...ng, endId: 'bankrupt', endAge: age, history: [...ng.history, { age, text: `หมดตัวเป็นครั้งที่ ${n} จนถูกฟ้องล้มละลาย` }] })
      ng = { ...ng, hustles: n }
      if (n === HUSTLE_MAX) setTimeout(() => toast(`⚠️ หมดตัวครั้งที่ ${n} แล้ว! ถ้าหมดอีกครั้งตอนยังมีหนี้ = ล้มละลาย`, false), 600)
    }
    picking.current = ''
    save(ng)
    setS(ng)
    trackScene(ng, age)
    setLines(resolveLines(getScene(id).lines, ng))
    setIdx(0)
    // 🕯️ ข้ามอายุ 5/15/30/50/70 → หยุดถามคำถามถึงผู้เล่น (หลังโหมดหาเงิน ถ้ามี)
    const r = ng.quick ? null : reflectionAt(ng, scene.age, age)
    setReflect(r ? { age: r.age, q: r.q, hint: r.hint } : null)
    // เงินหมด → เข้าโหมดหาเงินก่อน
    if (broke) {
      showAch(unlockAch('broke'))
      sfx('bad')
      setHustle({ target: Math.round((Math.max(40_000, Math.min(250_000, ng.debt * 0.08)) * (ng.flags.includes('iron') ? 0.6 : 1)) / 1000) * 1000, age, report: rep.years > 0 ? rep : null })
      setPhase('hustle')
    } else setPhase(r ? 'reflect' : 'card')
  }
  const endReflect = (a: string) => {
    if (!reflect) return
    markAsked(reflect.age)
    setS((prev) => { const ns = { ...prev, reflections: [...(prev.reflections ?? []), { age: reflect.age, q: reflect.q, a: a.trim().slice(0, 140) }] }; save(ns); return ns })
    setReflect(null)
    setPhase('card')
  }
  const endHustle = (r: HustleResult) => {
    const { state } = applyChoice(s, { text: '💸 hustle', fin: { cash: r.cash, debt: r.debt }, effects: r.effects, bond: r.bond, memory: r.memory }, hustle!.age, s.sceneId)
    setS(state)
    save(state)
    setHustle(null)
    if (r.ok) showAch(unlockAch('survivor'))
    setPhase(reflect ? 'reflect' : 'card')
  }

  // แตะที่ค้างมาจากจังหวะก่อน (แตะเลือกซ้ำระหว่างการ์ดปัดออก / แตะรัวข้ามผล) ห้ามข้ามข้อความที่เพิ่งขึ้น
  const shownAt = useRef(0)
  useEffect(() => { shownAt.current = Date.now() }, [phase, idx, s.sceneId])
  const advance = () => {
    if (panel) return
    if (phase === 'choice' || phase === 'mini' || phase === 'hustle' || phase === 'reflect') return
    if (Date.now() - shownAt.current < (phase === 'card' ? 400 : 700)) return
    if (phase === 'lines' || phase === 'result') sfx('tap')
    if (phase === 'card') return setPhase(firstPhase())
    if (phase === 'result') return idx < lines.length - 1 ? setIdx(idx + 1) : enter(s)
    // บรรทัดสุดท้ายคือคำถาม → แสดงพร้อมทางเลือก
    if (phase === 'lines' && choices.length && idx >= lines.length - 2) { setIdx(lines.length - 1); return setPhase('choice') }
    if (idx < lines.length - 1) return setIdx(idx + 1)
    enter(s)
  }

  const picking = useRef('')
  const pick = (c: Choice, timedOut = false) => {
    if (lockOf(c)) return
    // closure เก่า (ฉาก/ช่วงที่ผ่านไปแล้ว) ห้ามเลือก — กันฉากย้อนกลับเมื่อ callback ที่หน่วงเวลาไว้มาถึงช้า
    if (live.current.sceneId !== s.sceneId || live.current.phase !== phase) return
    if (picking.current === s.sceneId + phase) return
    picking.current = s.sceneId + phase
    setLeft(null)
    setReact(timedOut ? '⏰' : splitIcon(fillText(c.text, s)).icon)
    const { state: ns00, effects, result, cashDelta, bondDelta } = applyChoice(s, c, scene.age, scene.id)
    const others = choices.filter((x) => x !== c && !lockOf(x) && !x.text.endsWith(' mini'))
    const who = cast.find((w) => w !== 'me')
    const road = !c.text.endsWith(' mini') && others.length && !scene.id.startsWith('memory') && (who || scene.timer || c.outcomes)
      ? [{ age: scene.age, scene: scene.id, chose: fillText(c.text, s), other: fillText(others[Math.floor(Math.random() * others.length)].text, s), who }] : []
    const ns0 = c.text.endsWith(' mini') ? ns00 : {
      ...ns00, picks: [...(ns00.picks ?? []), choiceKey(scene.id, c.text)],
      persona: addPersona(ns00, personaDelta(c, effects, cashDelta, bondDelta, timedOut)),
      roads: [...(ns00.roads ?? []), ...road].slice(-30),
    }
    const ns = timedOut ? { ...ns0, history: [...ns0.history.slice(0, -1), ...(ns0.history.length > s.history.length ? [{ ...ns0.history[ns0.history.length - 1], text: ns0.history[ns0.history.length - 1].text + ' (ลังเลจนหมดเวลา)' }] : [])] } : ns0
    const deltas = Object.entries(effects).filter(([, v]) => v)
    const now = Date.now()
    setToasts([
      ...(Math.abs(cashDelta) >= 1000 ? [{ id: now - 1, text: `💰 ${fmtBaht(cashDelta, true)} · คงเหลือ ${fmtBaht(netWorth(ns))}`, good: cashDelta > 0 }] : []),
      ...deltas.map(([k, v], i) => {
        const info = STAT_INFO.find((x) => x.key === k)
        const label = info ? `${info.icon} ${info.label}` : `💗 ${HIDDEN_LABEL[k as StatKey]}`
        return { id: now + i, text: `${label} ${v! > 0 ? '+' : ''}${v}`, good: v! > 0 }
      }),
      ...(ns.stats.happy === 0 && s.stats.happy > 0 ? [{ id: now + 90, text: '⚠️ ความสุขเหลือ 0 — ใจเริ่มไม่ไหวแล้ว ถ้าปล่อยไว้อาจป่วยซึมเศร้า', good: false }] : []),
      ...ns.flags.filter((f) => LIFE_FLAGS[f] && !s.flags.includes(f)).map((f, i) => ({ id: now + 80 + i, text: `🚩 ปักธง: ${LIFE_FLAGS[f].icon} ${LIFE_FLAGS[f].label}`, good: LIFE_FLAGS[f].tone !== 'bad' })),
      ...Object.entries(bondDelta).filter(([, v]) => v).map(([k, v], i) => ({ id: now + 50 + i, text: `${BOND_INFO[k as BondId].icon} ${BOND_INFO[k as BondId].name} ${v! > 0 ? '+' : ''}${v}`, good: v! > 0 })),
    ])
    setTimeout(() => setToasts([]), 2700)
    // เอฟเฟกต์ตามผลลัพธ์
    const tone = Object.entries(effects).reduce((t, [, v]) => t + (v ?? 0), 0) + Math.sign(cashDelta) * Math.min(3, Math.abs(cashDelta) / 200_000)
    setResultTone(tone)
    const endK = ns.endId ? ENDINGS.find((e) => e.id === ns.endId)?.kind : null
    if (endK === 'bad') { sfx('death'); boom('rain', { shake: true, flash: 'red' }) }
    else if (endK === 'weird') { sfx('unlock'); boom('stars', { flash: 'white' }) }
    else if ((effects.love ?? 0) >= 2 || Object.values(bondDelta).some((v) => (v ?? 0) >= 3)) { sfx('heart'); boom('hearts') }
    else if (cashDelta >= 150_000) { sfx('coin'); boom('coins') }
    else if (tone >= 3) { sfx('good'); boom('confetti') }
    else if (tone <= -3 || cashDelta <= -300_000) { sfx('bad'); boom(tone <= -5 ? 'rain' : null, { shake: true }) }
    else sfx(tone >= 0 ? 'good' : 'loss')
    showAch(checkAchs(s, ns))
    const sn = secretNo(scene.id)
    if (sn && discoverSecret(sn)) {
      setSecretPop(sn); setTimeout(() => setSecretPop(null), 3800)
      const n = foundSecrets().length
      showAch(unlockAch(...(n >= 4 ? ['secret1', 'secret4'] : ['secret1'])))
    }
    setS(ns)
    save(ns)
    const res = timedOut ? [{ ...result[0], text: '⏰ หมดเวลา! ' + (result[0]?.text ?? '') }, ...result.slice(1)].filter((l) => l.text) : result
    if (res.length) { setLines(res); setIdx(0); setPhase('result') }
    else enter(ns)
  }
  const finishMini = (score: number) => {
    if (score >= 0.8) showAch(unlockAch('ace'))
    const r = scene.reward!(score)
    const icon = splitIcon(r.text).icon
    pick({ text: icon + ' mini', effects: r.effects, flags: r.flags, bond: r.bond, memory: r.memory, result: [{ text: splitIcon(r.text).label }] })
  }

  // คีย์บอร์ด
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance() }
      if (e.key === 'Escape') setPanel((p) => (p ? null : 'menu'))
      if (phase === 'choice' && choices.length > 3 && /^[1-9]$/.test(e.key)) { const c = choices[+e.key - 1]; if (c && !lockOf(c)) pick(c) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const speaker = line?.who
  const dejavu = s.life === 2 ? s.past?.history.find((h) => h.age === scene.age && h.age > 0) : undefined
  const parent = s.lineage?.[s.lineage.length - 1]
  const echo = parent ? parent.history.find((h) => h.age === scene.age && h.age > 0 && !h.text.startsWith('🧬')) : undefined
  const because = (scene.because ? scene.because(s) || null : null)
    ?? (dejavu ? `👁️ เดจาวู... ชาติก่อน ${s.past!.name} ตอนอายุ ${dejavu.age}: ${dejavu.text}` : null)
    ?? (echo ? `🧬 ตอนอายุ ${echo.age} ${parent!.gender === 'girl' ? 'แม่' : 'พ่อ'}${parent!.name}เคย: ${echo.text}` : null)
  const many = cast.length >= 3
  // สีหน้า: คนพูดตามบท · ตอนผลลัพธ์ตามว่าผลดี/ร้าย (เคยบังคับยิ้มเสมอ แม้ลูกป่วยหนัก) · ฉากเศร้า → คนอื่นหน้าเศร้าด้วย
  const gloomy = phase === 'result' ? resultTone < 0 : scene.mood === 'sad' || scene.mark === 'fear'
  const exprOf = (id: CharId): Expr => speaker === id && line?.expr ? line.expr
    : phase === 'result' && id === 'me' ? (react === '⏰' ? 'surprised' : gloomy ? 'sad' : 'happy')
    : gloomy ? 'sad' : 'neutral'

  return (
    <div ref={rootRef} className="absolute inset-0" onClick={advance}>
      <div key={scene.bg} className="fadein absolute inset-0"><Background id={scene.bg} /></div>

      {/* ตัวละคร */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[7.375rem] top-16 flex items-end justify-center sm:bottom-0">
        <div className="flex h-full max-w-full items-end justify-center">
          {cast.map((id) => (
            // มือถือ: ความกว้างรวมไม่เกินจอ (เคยกว้างรวม ~128vw → ตัวละครซ้อนกันจนอึดอัด) · จอใหญ่ถูกจำกัดด้วย 52vh/480px อยู่แล้ว
            <div key={`${scene.id}-${id}`} className={`popin ${many ? '-mx-[2vw] sm:-mx-6' : cast.length > 1 ? '-mx-[1vw] sm:mx-0' : ''} h-[82%] max-h-[40rem] transition-transform duration-300 ${speaker === id ? 'z-10 -translate-y-2' : ''}`}
              style={{ width: `min(${cast.length <= 1 ? 80 : Math.floor(104 / cast.length)}vw, 52vh, 480px)` }}>
              <div key={speaker === id ? `${idx}-${phase}` : 'idle'} className={`h-full w-full ${speaker === id ? 'hop' : ''}`}>
                <div className="breathe h-full w-full" style={{ animationDelay: `${(id.charCodeAt(0) % 7) * 0.3}s` }}>
                  <Character id={id} playerAge={scene.age} s={s} bg={scene.bg} sceneId={scene.id} expr={exprOf(id)}
                    dim={!!speaker && speaker !== id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {fx && <Fx key={fx.key} kind={fx.kind} />}
      {flash && <div key={flash.key} className={`pointer-events-none absolute inset-0 z-[36] ${flash.c === 'red' ? 'flash-red' : 'flash-white'}`} />}

      {/* HUD: แถวบน (ข้อมูล | ปุ่ม+แจ้งเตือน) แล้วตามด้วยแถบข้อความกลางจอ — วางเป็นลำดับ ไม่ทับกัน */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[40] p-2 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex min-w-0 max-w-[62vw] flex-col gap-1.5 sm:max-w-[15.625rem]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPanel('stats')} className="rounded-2xl bg-white/90 px-3 py-1.5 text-left shadow backdrop-blur sm:px-4 sm:py-2">
              <div className="truncate font-display text-base leading-tight text-[#5a3443] sm:text-lg">{s.name} · {scene.age} ปี {s.life === 2 && <span className="text-xs text-[#7b5cd6]">♾️ชาติ 2</span>}{(s.gen ?? 1) >= 2 && <span className="text-xs text-[#2f8f5a]">🧬รุ่น {s.gen}</span>}</div>
              <div className="truncate text-[.75rem] text-[#8a6a76] sm:text-xs">{stageOf(scene.age)}{s.career ? ` · ${CAREERS[s.career]}` : ''}</div>
              <div className="flex gap-2 font-display text-xs sm:text-sm">
                <span className="text-[#2f8f5a]">💰 {fmtBaht(s.cash + s.invest)}</span>
                {s.debt > 0 && <span className="text-[#c0505f]">หนี้ {fmtBaht(s.debt)}</span>}
              </div>
              {salaryOf(s, scene.age).monthly > 0 && <div className="truncate text-[.75rem] text-[#5a7a66] sm:text-[.75rem]">💼 {salaryOf(s, scene.age).monthly.toLocaleString('th-TH')} บ./เดือน</div>}
              {dreamOf(s) && (
                <div className="mt-1 truncate rounded-full bg-[#fff4d6] px-2 py-0.5 text-[.75rem] text-[#7a5a00] sm:text-[.75rem]">
                  ⭐ {dreamOf(s)!.icon} {dreamOf(s)!.name} · {dreamOf(s)!.progress(s)}{dreamChecks(s)}
                </div>
              )}
            </button>
            <div className={`hidden flex-col gap-1 ${phase === 'choice' ? '2xl:flex' : 'sm:flex'}`}>
              {STAT_INFO.map((t) => (
                <div key={t.key} className="flex items-center gap-2 rounded-full bg-white/75 py-0.5 pl-2 pr-3 text-sm shadow-sm backdrop-blur">
                  <span>{t.icon}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (s.stats[t.key] / 14) * 100)}%`, background: t.color }} /></div>
                  <span className="w-5 text-right font-display text-[#5a3443]">{s.stats[t.key]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="pointer-events-auto flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <IconBtn label="ค่าสถานะ" onClick={() => setPanel(panel === 'stats' ? null : 'stats')}>📊</IconBtn>
              <IconBtn label="สมุดชีวิต" onClick={() => setPanel(panel === 'log' ? null : 'log')}>📔</IconBtn>
              <IconBtn label="เมนูและเสียง" onClick={() => setPanel(panel === 'menu' ? null : 'menu')}>☰</IconBtn>
            </div>
            {toasts.map((t, i) => (
              <div key={t.id} className={`toast whitespace-nowrap rounded-full px-3 py-1 font-display text-xs text-white shadow-lg sm:px-4 sm:py-1.5 sm:text-sm ${t.good ? 'bg-[#3fae78]' : 'bg-[#d0596a]'}`} style={{ animationDelay: `${i * 0.12}s` }}>
                {t.text}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-col items-center gap-2 sm:absolute sm:left-1/2 sm:top-3 sm:mt-0 sm:w-[min(46vw,32.5rem)] sm:-translate-x-1/2">
          {achPop.map((a) => (
            <div key={a.id} className="popin flex items-center gap-3 rounded-2xl border-2 border-[#ffd166] bg-[#2b2238]/95 px-4 py-2 text-white shadow-2xl">
              <span className="text-3xl">{a.icon}</span>
              <span><span className="block text-[.75rem] tracking-wide text-[#ffd166]">ปลดล็อกถ้วยรางวัล!</span><span className="font-display">{a.name}</span></span>
            </div>
          ))}
          {(phase === 'lines' || phase === 'choice' || phase === 'mini') && because && (
            <div key={`b-${s.sceneId}`} className="popin w-[min(94vw,32.5rem)] rounded-2xl sm:w-full border-2 border-[#ffd166] bg-[#fffaf0]/95 px-3 py-1.5 text-center text-xs text-[#6a4a00] shadow-lg sm:text-sm">
              🔁 {because}
            </div>
          )}
        </div>
      </div>

      {secretPop && (
        <div className="popin pointer-events-none absolute inset-x-0 top-[38%] z-[45] mx-auto w-[min(90vw,26.25rem)] rounded-3xl border-4 border-[#ffd166] bg-[#140f20]/95 p-5 text-center text-white shadow-2xl">
          <div className="text-5xl">🔓</div>
          <div className="mt-1 font-display text-sm tracking-[0.25em] text-[#ffd166]">SECRET EVENT {String(secretPop).padStart(2, '0')}</div>
          <div className="font-display text-2xl">ค้นพบความลับ!</div>
          <div className="text-sm text-white/80">{SECRETS.find((x) => x.no === secretPop)?.title}</div>
        </div>
      )}

      {/* การ์ดอายุ */}
      {phase === 'card' && (
        <div key={s.sceneId} className={`fadein absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[2px] ${secretNo(scene.id) ? 'bg-[#140f20]/85' : scene.mark === 'fear' ? 'bg-[#2a0a10]/85' : scene.mark === 'karma' ? 'bg-[#1a1040]/85' : 'bg-[#1d1a2b]/55'}`}>
          {scene.mark === 'fear' && <div className="pointer-events-none absolute inset-0 flash-red opacity-60" />}
          <div className="popin text-center text-white">
            {scene.call ? (
              <div className="popin mx-auto mb-4 w-64 rounded-[36px] border-4 border-white/80 bg-[#1b1726]/95 px-5 pb-6 pt-5 shadow-2xl">
                {scene.call.time && <div className="font-display text-4xl text-white">{scene.call.time}<span className="ml-1 text-base text-white/60">น.</span></div>}
                <div className="text-xs tracking-widest text-white/60">{scene.call.kind === 'call' ? 'สายเรียกเข้า...' : 'ข้อความใหม่'}</div>
                <div className={`mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-5xl ${scene.call.kind === 'call' ? 'shake' : ''}`} style={{ animationIterationCount: 'infinite' }}>{scene.call.kind === 'call' ? '📱' : '💬'}</div>
                <div className="mt-3 font-display text-2xl">{scene.call.who === 'me' ? 'ไม่ทราบชื่อ' : whoName(scene.call.who, s)}</div>
                {scene.call.kind === 'call'
                  ? <div className="mt-4 flex justify-center gap-8"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e0505f] text-2xl">📵</span><span className="blink flex h-12 w-12 items-center justify-center rounded-full bg-[#3fae78] text-2xl">📞</span></div>
                  : <div className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-left text-sm text-white/85">{fillText(resolveLines(scene.lines, s)[0]?.text ?? '', s).slice(0, 48)}…</div>}
              </div>
            ) : null}
            <div className={`font-display font-semibold drop-shadow-lg ${scene.call ? 'text-4xl' : 'text-7xl sm:text-8xl'}`}>{scene.age === 0 ? 'แรกเกิด' : `${scene.age} ปี`}</div>
            <div className="mt-2 font-display text-xl tracking-wide text-white/85">{stageOf(scene.age)}</div>
            {scene.title && <div className={`mt-4 inline-block rounded-full px-5 py-1.5 font-display text-lg ${secretNo(scene.id) ? 'blink border-2 border-[#ffd166] bg-[#ffd166]/15 tracking-wider text-[#ffd166]' : 'bg-white/15'}`}>{scene.title}</div>}
            {scene.mark === 'karma' && <div className="popin mt-3 text-sm tracking-wide text-[#c9b6ff]">🔮 กรรมจากชาติก่อนกำลังทำงาน...</div>}
            {secretNo(scene.id) > 0 && <div className="mt-2 text-sm text-[#ffd166]/90">✨ เงื่อนไขลับครบแล้ว... {SECRETS.find((x) => x.no === secretNo(scene.id))?.title}</div>}
            {report && Math.abs(report.net) >= 1000 && (
              <div className="mt-3 text-sm text-white/80">ผ่านไป {report.years} ปี · เงิน {fmtBaht(report.net, true)}</div>
            )}
            {report && report.salary > 0 && (
              <div className="mx-auto mt-2 inline-flex flex-wrap justify-center gap-x-3 rounded-full bg-black/25 px-4 py-1 text-xs text-white/90">
                <span>💼 {report.salaryLabel} {report.salary.toLocaleString('th-TH')} บ./เดือน</span>
                {report.cost > 0 && <span>🧾 ใช้จ่าย {report.cost.toLocaleString('th-TH')} บ./เดือน</span>}
              </div>
            )}
            {report?.shock && (
              <div className="popin mx-auto mt-5 max-w-xs rounded-3xl bg-white/95 px-5 py-4 text-[#3a2433] shadow-2xl" style={{ animationDelay: '.5s' }}>
                <div className="text-5xl">{report.shock.icon}</div>
                <div className="mt-1 font-display text-lg leading-snug">{report.shock.text}</div>
                {report.shock.why && <div className="mx-auto mt-1 max-w-[18rem] text-[.875rem] leading-[1.6] text-[#5a3443]">{report.shock.why}</div>}
                {Math.abs(report.shock.cash) >= 1000 && <div className={`mt-1 font-display ${report.shock.cash > 0 ? 'text-[#2f8f5a]' : 'text-[#c0505f]'}`}>{fmtBaht(report.shock.cash, true)}</div>}
                <div className="mt-2 rounded-xl bg-[#f4f1fb] px-2 py-1 text-[.8125rem] leading-[1.5] text-[#6a5a82]">📊 โอกาสจริง ~{report.shock.odds} ต่อปี<br /><span className="text-[#8a7a9a]">อ้างอิง: {SOURCES[report.shock.src]?.org}</span></div>
                {report.shock.more > 0 && <div className="mt-1 text-[.8125rem] text-[#8a6a76]">และอีก {report.shock.more} เรื่องในช่วงนี้ (ดูในสมุดชีวิต)</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* กล่องข้อความ */}
      {line && phase === 'lines' && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
          <div className="relative mx-auto max-w-4xl">
            {line.who && (
              <div className="absolute -top-5 left-5 z-10 rounded-xl bg-[#e0707f] px-4 py-1 font-display text-lg text-white shadow">
                {whoName(line.who as CharId, s)}
              </div>
            )}
            <div className="min-h-[8.125rem] rounded-3xl border-4 border-white/70 bg-white/92 px-6 pb-8 pt-6 shadow-2xl backdrop-blur sm:min-h-[9.375rem]">
              <Typewriter key={`${s.sceneId}-${phase}-${idx}`} text={fillText(line.text, s)} italic={!line.who} />
              <span className="blink absolute bottom-3 right-5 text-[#e0707f]">▼</span>
            </div>
          </div>
        </div>
      )}

      {/* ผลลัพธ์ */}
      {phase === 'result' && line && (
        <div key={`r-${s.sceneId}-${idx}`} className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-3 pb-8">
          <div className="popin flex w-full max-w-lg items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-2xl">
            <span className="shrink-0 text-5xl drop-shadow sm:text-6xl">{react}</span>
            <span className="font-display text-base leading-snug text-[#3a2433] sm:text-lg">{fillText(line.text, s)}</span>
          </div>
          <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/40"><div className="h-full bg-white" style={{ animation: `grow ${readMs(line.text) / 1000}s linear both` }} /></div>
          <p className="text-xs text-white/80 drop-shadow">{lines.length > 1 ? `${idx + 1}/${lines.length} · ` : ''}แตะเพื่อไปต่อ</p>
        </div>
      )}

      {phase === 'mini' && scene.minigame && <MiniGame kind={scene.minigame} onDone={finishMini} title={scene.title} story={lines[0] ? fillText(lines[0].text, s) : undefined} />}
      {phase === 'hustle' && hustle && <HustleMode s={s} target={hustle.target} age={hustle.age} report={hustle.report} onDone={endHustle} />}
      {phase === 'reflect' && reflect && <ReflectPause age={reflect.age} q={reflect.q} hint={reflect.hint} name={s.name} onDone={endReflect} onStop={() => { setReflectOn(false); setReflectAsk(false); endReflect('') }} />}

      {/* ทางเลือก */}
      {phase === 'choice' && (
        <div className={`absolute inset-0 z-20 flex justify-center p-3 pb-5 ${choices.length > 3 ? 'items-end bg-[#1d1a2b]/60 pt-[9.375rem] sm:items-center sm:pt-[7.5rem]' : 'items-end bg-gradient-to-t from-[#1d1a2b]/55 via-transparent to-transparent pt-[9.375rem]'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex max-h-full w-full max-w-xl flex-col lg:max-w-3xl">
            {scene.timer && <p className="mb-2 text-center font-display text-lg text-white drop-shadow">{reading ? '📖 อ่านตัวเลือกก่อน... แล้วจะเริ่มจับเวลา' : '⏰ เลือกเร็ว!'}</p>}
            {left != null && scene.timer && (
              <div className="mx-auto mb-3 flex max-w-sm items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div className="h-full rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${(left / (timerTotal || scene.timer)) * 100}%`, background: left <= 3 ? '#ff5a6e' : '#ffd166' }} />
                </div>
                <span className={`w-8 text-right font-display text-xl text-white drop-shadow ${left <= 3 ? 'blink' : ''}`}>{Math.ceil(left)}</span>
              </div>
            )}
            {choices.some((c) => c.career) && choices.length > 6 ? (
              <JobPicker s={s} choices={choices} lockOf={lockOf} onPick={pick} onLocked={(r) => toast('🔒 ' + r, false)} title={line ? fillText(line.text, s) : ''} />
            ) : choices.length <= 3 && line ? (
              <SwipeChoice key={s.sceneId} speaker={line.who ? (whoName(line.who as CharId, s)) : undefined}
                text={fillText(line.text, s)} choices={choices} fill={(t) => fillText(t, s)} lockOf={lockOf}
                onPick={(c) => pick(c)} onLocked={(r) => toast('🔒 ' + r, false)} />
            ) : (
            <>
            {line && <div className="popin mx-auto mb-3 max-w-md rounded-3xl bg-white/95 px-5 py-3 text-center font-display text-lg text-[#3a2433] shadow-xl">{line.who && <span className="mr-1 text-sm text-[#e0707f]">{whoName(line.who as CharId, s)}:</span>}{fillText(line.text, s)}</div>}
            <div className={`grid min-h-0 flex-1 gap-2 overflow-y-auto p-1 ${choices.length > 3 ? 'grid-cols-2 sm:grid-cols-3' : choices.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {choices.map((c, i) => {
                const m = fillText(c.text, s).match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u)
                const icon = m ? m[1] : ['🌟', '💭', '🍀', '🎈'][i % 4]
                const label = m ? m[2] : fillText(c.text, s)
                const locked = lockOf(c)
                return (
                  <button key={c.text} onClick={() => pick(c)} disabled={!!locked} style={{ animationDelay: `${i * 0.06}s` }}
                    className={`popin relative flex flex-col items-center justify-center gap-1 rounded-3xl border-4 px-3 py-4 text-center shadow-lg transition ${locked ? 'cursor-not-allowed border-white/40 bg-[#3a3346]/80' : c.trait ? 'border-[#ffd166] bg-[#fffaf0] shadow-[0_0_18px_rgba(255,209,102,.7)] hover:-translate-y-1 active:scale-95' : 'border-white bg-white/95 hover:-translate-y-1 hover:border-[#f6b5c2] active:scale-95'}`}>
                    {c.trait && !locked && <span className="whitespace-nowrap rounded-full bg-[#ffd166] px-2 py-0.5 text-[.75rem] font-semibold text-[#6a4a00]">✨ ตัวเลือกจากนิสัย</span>}
                    <span className={`text-4xl sm:text-5xl ${locked ? 'opacity-40 grayscale' : ''}`}>{icon}</span>
                    <span className={`font-display text-[.9375rem] leading-snug sm:text-base ${locked ? 'text-white/60' : 'text-[#4a2c38]'}`}>{label}</span>
                    {locked
                      ? <span className="rounded-full bg-black/30 px-2 py-0.5 text-[.75rem] text-[#ffd6de]">🔒 {locked}</span>
                      : c.hint && <span className={`rounded-full px-2 py-0.5 text-[.75rem] ${c.trait ? 'bg-[#fff1c9] text-[#7a5a00]' : 'bg-[#f3eef7] text-[#7a5a96]'}`}>{c.hint}</span>}
                  </button>
                )
              })}
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* แผง */}
      {panel && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { e.stopPropagation(); setPanel(null) }}>
          <div className="popin max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {panel === 'stats' && <StatsView s={s} age={scene.age} />}
            {panel === 'log' && <LifeLog s={s} />}
            {panel === 'menu' && (
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-2xl text-[#5a3443]">เมนู</h3>
                <p className="text-sm text-[#8a6a76]">เกมบันทึกอัตโนมัติทุกครั้งที่เข้าฉากใหม่</p>
                {voiceSupported() && !hasThaiVoice() && <p className="rounded-xl bg-[#fff4d6] p-3 text-sm text-[#7a5a00]">อุปกรณ์นี้ไม่มีเสียงภาษาไทยติดตั้งไว้ เสียงพากย์อาจเป็นสำเนียงต่างชาติหรือไม่มีเสียง (บนมือถือและ Chrome มักมีให้)</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setMusicOn(!music); setMusic(!music) }} className={`rounded-2xl border-2 py-3 font-display ${music ? 'border-[#e0707f] bg-[#fde8ed] text-[#c0505f]' : 'border-[#eee] text-[#8a6a76]'}`}>{music ? '🎵 เพลง: เปิด' : '🔕 เพลง: ปิด'}</button>
                  {voiceSupported() && <button onClick={() => { setVoiceOn(!voice); setVoice(!voice) }} className={`rounded-2xl border-2 py-3 font-display ${voice ? 'border-[#e0707f] bg-[#fde8ed] text-[#c0505f]' : 'border-[#eee] text-[#8a6a76]'}`}>{voice ? '🔊 พากย์: เปิด' : '🔇 พากย์: ปิด'}</button>}
                  <button onClick={() => { const on = !reflectAsk; setReflectOn(on); if (on) resetAsked(); setReflectAsk(on) }} className={`col-span-2 rounded-2xl border-2 py-3 font-display ${reflectAsk ? 'border-[#e0707f] bg-[#fde8ed] text-[#c0505f]' : 'border-[#eee] text-[#8a6a76]'}`}>{reflectAsk ? '🕯️ คำถามหยุดคิด: เปิด' : '🕯️ คำถามหยุดคิด: ปิด'}</button>
                </div>
                <p className="-mt-1 text-[.75rem] text-[#a08a94]">คำถามหยุดคิดถามแต่ละข้อครั้งเดียว (อายุ 5/15/30/50/70) · เปิดใหม่ = ถามใหม่ทุกข้อ</p>
                <Btn primary onClick={() => setPanel(null)}>เล่นต่อ</Btn>
                <Btn onClick={onQuit}>กลับหน้าแรก</Btn>
              </div>
            )}
            {panel !== 'menu' && <Btn className="mt-5 w-full" onClick={() => setPanel(null)}>ปิด</Btn>}
          </div>
        </div>
      )}
    </div>
  )
}

function JobPicker({ s, choices, lockOf, onPick, onLocked, title }: { s: GameState; choices: Choice[]; lockOf: (c: Choice) => string | null; onPick: (c: Choice) => void; onLocked: (r: string) => void; title: string }) {
  const sorted = [...choices].sort((a, b) => Number(!!lockOf(a)) - Number(!!lockOf(b)))
  const open = sorted.filter((c) => !lockOf(c)).length
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-white/95 p-3 shadow-2xl">
      <div className="px-1 pb-2 text-center font-display text-lg text-[#3a2433]">{title}</div>
      <div className="px-1 pb-2 text-center text-xs text-[#8a6a76]">เลือกได้ {open} อาชีพ · แตะ 1 ครั้งเพื่อเลือก</div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-y-auto overscroll-contain sm:grid-cols-2">
        {sorted.map((c, i) => {
          const job = careerById(c.career)
          const locked = lockOf(c)
          const { icon, label } = splitIcon(fillText(c.text, s))
          return (
            <button key={c.text} type="button" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
              onClick={() => (locked ? onLocked(locked) : onPick(c))}
              className={`${locked ? 'fadein bg-[#efeaf0] text-[#9a8a94]' : 'popin bg-white text-[#3a2433] ring-2 ring-[#f6d3dc] active:bg-[#fde8ed]'} flex touch-manipulation items-center gap-3 rounded-2xl px-3 py-2 text-left lg:py-2.5`}>
              <span className={`text-2xl lg:text-3xl ${locked ? 'opacity-40 grayscale' : ''}`}>{icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[.9375rem] leading-tight lg:text-base">{label}</span>
                <span className="block truncate text-[.75rem]">{locked ? `🔒 ${locked}` : c.hint ?? ''}</span>
              </span>
              {job && <span className={`shrink-0 text-right font-display text-xs leading-tight ${locked ? '' : 'text-[#2f8f5a]'}`}>{job.monthly.toLocaleString('th-TH')}<span className="block text-[.75rem] font-normal text-[#8a6a76]">บ./เดือน</span></span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/85 text-lg shadow backdrop-blur transition hover:bg-white active:scale-90 sm:h-11 sm:w-11 sm:text-xl">
      {children}
    </button>
  )
}

/** ค่าสูงสุดที่ใช้แสดงผลค่าสถานะ */
const STAT_MAX = 15

/** เวลาขั้นต่ำให้อ่านทัน (ms) */
const readMs = (text: string) => Math.min(7000, 1800 + Array.from(text).length * 45)

function Typewriter({ text, italic }: { text: string; italic?: boolean }) {
  const chars = Array.from(text)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= chars.length) return
    const t = setTimeout(() => setN((x) => x + 2), 16)
    return () => clearTimeout(t)
  }, [n, chars.length])
  return (
    <p className={`text-lg leading-relaxed sm:text-xl ${italic ? 'text-[#6a4a58]' : 'text-[#2b2238]'}`}>
      {chars.slice(0, n).join('')}
      <span className="opacity-0">{chars.slice(n).join('')}</span>
    </p>
  )
}

function StatsView({ s, age }: { s: GameState; age?: number }) {
  return (
    <div>
      <h3 className="font-display text-2xl text-[#5a3443]">ค่าสถานะ</h3>
      <div className="mt-4 flex flex-col gap-3">
        {STAT_INFO.map((t) => (
          <div key={t.key}>
            <div className="flex justify-between text-sm"><span>{t.icon} {t.label}</span><span className="font-display">{s.stats[t.key]}</span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.stats[t.key] / 14) * 100)}%`, background: t.color }} /></div>
            {t.key === 'happy' && s.stats.happy <= 1 && <div className="mt-1 text-[.8125rem] text-[#c0505f]">⚠️ ความสุขต่ำมาก — เสี่ยงซึมเศร้า ลองเลือกทางที่ดูแลใจตัวเองบ้าง</div>}
          </div>
        ))}
      </div>
      <h3 className="mt-6 font-display text-xl text-[#5a3443]">💰 การเงิน</h3>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-[#eaf7ef] p-2"><div className="text-xs text-[#5a7a66]">เงินสด</div><div className="font-display text-[#2f8f5a]">{fmtBaht(s.cash)}</div></div>
        <div className="rounded-2xl bg-[#eef2fb] p-2"><div className="text-xs text-[#5a6a8a]">ทรัพย์สิน</div><div className="font-display text-[#3a5fb0]">{fmtBaht(s.invest)}</div></div>
        <div className="rounded-2xl bg-[#fdecef] p-2"><div className="text-xs text-[#8a5a66]">หนี้</div><div className="font-display text-[#c0505f]">{fmtBaht(s.debt)}</div></div>
      </div>
      {s.debt > 0 && <DebtBar s={s} />}
      <div className="mt-2 text-right text-sm text-[#5a3443]">ความมั่งคั่งสุทธิ <b className="font-display">{fmtBaht(netWorth(s))}</b></div>
      <StockDetails s={s} />
      {age != null && salaryOf(s, age).monthly > 0 && (
        <div className="mt-2 rounded-2xl bg-[#f6f8f2] p-3 text-sm">
          <div className="flex justify-between"><span>💼 เงินเดือน ({salaryOf(s, age).label})</span><b className="font-display text-[#2f8f5a]">{salaryOf(s, age).monthly.toLocaleString('th-TH')} บ.</b></div>
          {sideGig(s, age) > 0 && <div className="flex justify-between"><span>🛵 งานเสริมช่วงมีหนี้</span><b className="font-display text-[#2f8f5a]">{sideGig(s, age).toLocaleString('th-TH')} บ.</b></div>}
          <div className="flex justify-between"><span>🧾 ค่าใช้จ่าย/เดือน</span><b className="font-display text-[#c0505f]">−{livingCost(s, age).toLocaleString('th-TH')} บ.</b></div>
          <div className="mt-1 flex justify-between border-t border-black/10 pt-1"><span>เหลือเก็บ/เดือน</span><b className="font-display">{(salaryOf(s, age).monthly + sideGig(s, age) - livingCost(s, age)).toLocaleString('th-TH')} บ.</b></div>
        </div>
      )}
      <h3 className="mt-5 font-display text-xl text-[#5a3443]">💗 ความสัมพันธ์</h3>
      <div className="mt-2 flex flex-col gap-2 text-sm">
        {([['👪 ครอบครัว', s.stats.family], ['🤝 ต้น', s.flags.includes('betrayed') ? -1 : s.stats.friend], ...(s.flags.includes('partner') ? [[married(s) ? `💑 ${partnerName(s)}` : `💔 ${partnerName(s)} (หย่าแล้ว)`, married(s) ? s.stats.love : -1]] : [])] as [string, number][]).map(([n, v]) => (
          <div key={n} className="flex items-center justify-between">
            <span>{n}</span>
            <span className="tracking-tight">{v < 0 ? '💔 แตกหัก' : '❤️'.repeat(Math.min(5, Math.ceil(v / 2))) + '🤍'.repeat(Math.max(0, 5 - Math.ceil(v / 2)))}</span>
          </div>
        ))}
        {(Object.keys(BOND_INFO) as BondId[]).filter((b) => BOND_INFO[b].met(s)).map((b) => {
          const v = bondOf(s, b)
          return (
            <div key={b} className="flex items-center justify-between">
              <span>{BOND_INFO[b].icon} {BOND_INFO[b].name} <span className="text-xs text-[#a08a94]">{BOND_INFO[b].role}</span></span>
              <span className="tracking-tight">{'💞'.repeat(Math.ceil(v / 2))}{'🤍'.repeat(5 - Math.ceil(v / 2))}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-5 rounded-2xl bg-[#faf7fd] p-3">
        <div className="font-display text-xl text-[#5a3443]">🧬 นิสัยเด่นตอนนี้</div>
        <div className="text-[.8125rem] leading-[1.6] text-[#8a6a96]">นิสัยที่ติด 2 อันดับแรกจะปลดล็อก ✨ ตัวเลือกพิเศษ และทำให้คนรอบตัวพูดกับคุณต่างออกไป</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{personaPct(s).slice(0, 2).filter((p) => p.pct > 0).map((p) => <span key={p.k} className="rounded-full bg-white px-3 py-1 text-[.875rem] text-[#3a2433] ring-1 ring-black/5">{p.icon} {p.name} {p.pct}%</span>)}</div>
      </div>
      <EndingCompass s={s} />
      {s.heirloom && <div className="mt-4 rounded-2xl bg-[#eef8f1] p-3 text-sm text-[#2f6a4a]">🎁 มรดกตระกูล: {s.heirloom}</div>}
      {s.lineage?.length ? <div className="mt-2 text-sm text-[#5a3443]">🌳 ตระกูล: {s.lineage.map((a) => `${a.emoji}${a.name}`).join(' → ')} → {s.name}</div> : null}
    </div>
  )
}

/** 📈 รายละเอียดหุ้น (พับไว้ กดเปิดดูได้): มูลค่า/เงินต้น/กำไร · ทรัพย์สินอื่น · ผลตอบแทนรายปี · เหตุการณ์หุ้น */
function StockDetails({ s }: { s: GameState }) {
  const stocks = Math.min(s.stocks ?? 0, s.invest)
  const other = s.invest - stocks
  const cost = s.stockIn ?? 0
  const gain = stocks - cost
  const log = s.stockLog ?? []
  const events = s.history.filter((h) => /^(🚀|🔻) หุ้นที่ลงทุนไว้/.test(h.text))
  const maxPct = Math.max(30, ...log.map((x) => Math.abs(x.pct)))
  const sign = (n: number) => (n > 0 ? '+' : '')
  return (
    <details className="group mt-2 rounded-2xl bg-[#eef2fb] text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[#3a5fb0]">📈 รายละเอียดหุ้น</span>
        <span className="flex items-center gap-2 whitespace-nowrap text-[.8125rem] text-[#5a6a8a]">
          {stocks > 0 ? <>{fmtBaht(stocks)} <b className={`font-normal ${gain >= 0 ? 'text-[#2f8f5a]' : 'text-[#c0505f]'}`}>{fmtBaht(gain, true)}</b></> : 'ยังไม่ได้ลงทุน'}
          <span className="transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-[#3a5fb0]/10 px-3 pb-3 pt-2">
        {stocks > 0 ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white p-2"><div className="text-xs text-[#5a6a8a]">มูลค่าหุ้น</div><div className="font-display text-[#3a5fb0]">{fmtBaht(stocks)}</div></div>
            <div className="rounded-xl bg-white p-2"><div className="text-xs text-[#5a6a8a]">เงินต้นที่ลงไป</div><div className="font-display text-[#3a2433]">{fmtBaht(cost)}</div></div>
            <div className="rounded-xl bg-white p-2"><div className="text-xs text-[#5a6a8a]">กำไร/ขาดทุน</div><div className={`font-display ${gain >= 0 ? 'text-[#2f8f5a]' : 'text-[#c0505f]'}`}>{fmtBaht(gain, true)}{cost > 0 && <span className="text-xs"> ({sign(gain)}{Math.round((gain / cost) * 100)}%)</span>}</div></div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-2.5 text-[#5a6a8a]">ยังไม่มีหุ้น — จะมีเมื่อเลือกทาง "ลงทุน" เอง เช่น ทำประกัน + ลงทุนกองทุน หรือเช่าบ้านแล้วเอาเงินไปลงทุน</div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-white p-2.5">
          <span className="text-[#5a6a8a]">🏠 ทรัพย์สินอื่น <span className="text-xs">(บ้าน ที่ดิน ธุรกิจ ทอง มรดก)</span></span>
          <span className="whitespace-nowrap font-display text-[#3a2433]">{fmtBaht(other)} <span className="text-xs text-[#2f8f5a]">+3.5%/ปี</span></span>
        </div>
        {log.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#5a6a8a]">ผลตอบแทนพอร์ตรายปี · ไทย 50% + โลก 50% (ล่าสุด {log.length} ปี)</div>
            <div className="mt-1 flex flex-col gap-1.5">
              {[...log].reverse().map((x) => (
                <div key={x.age} className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-x-2 text-[.8125rem]">
                  <span className="text-[#5a6a8a]">อายุ {x.age}</span>
                  <div className="relative h-2.5 rounded-full bg-black/5">
                    <div className={`absolute top-0 h-full rounded-full ${x.pct >= 0 ? 'left-1/2 bg-[#3fae78]' : 'right-1/2 bg-[#e0707f]'}`} style={{ width: `${(Math.abs(x.pct) / maxPct) * 50}%` }} />
                    <div className="absolute left-1/2 top-[-2px] h-[calc(100%+4px)] w-px bg-black/20" />
                  </div>
                  <span className={`text-right font-display ${x.pct >= 0 ? 'text-[#2f8f5a]' : 'text-[#c0505f]'}`}>{sign(x.pct)}{x.pct}%</span>
                  {x.th != null && x.world != null && <span className="col-start-2 text-[.6875rem] leading-tight text-[#8a8aa0]">ไทย {sign(x.th)}{x.th}% · โลก {sign(x.world)}{x.world}% · ปี {x.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {events.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#5a6a8a]">เหตุการณ์หุ้น</div>
            {events.map((h, i) => <div key={i} className="mt-0.5 text-[.8125rem] text-[#3a2433]">อายุ {h.age} · {h.text}</div>)}
          </div>
        )}
        <div className="text-xs leading-[1.6] text-[#8a8aa0]">ℹ️ พอร์ตหุ้น = หุ้นไทย (SET + ปันผล 3%) 50% + หุ้นโลก (MSCI World) 50% · ทุกปีสุ่ม "ปีจริง" จาก 2537–2567 ทั้งสองตลาดเป็นปีเดียวกัน · เฉลี่ย ≈{MARKET_BASIS.avg}%/ปี · ร่วงเกิน {-MARKET_BASIS.crashPct}% ≈{(MARKET_BASIS.crash * 100).toFixed(0)}% ของปี · พุ่งเกิน {MARKET_BASIS.boomPct}% ≈{(MARKET_BASIS.boom * 100).toFixed(0)}% ของปี · ถ้าเงินสดหมด เกมจะขายทรัพย์สินออกมาใช้ก่อน (หุ้นถูกขายตามสัดส่วน)</div>
      </div>
    </details>
  )
}

const END_HINT: Record<string, string> = {
  legend: 'ทักษะหลักของอาชีพต้องเด่นที่สุดในชีวิต', family: 'ครอบครัวเด่นติด 2 อันดับแรก และอยู่กับคู่ชีวิตจนแก่', friend: 'มิตรภาพเด่นติด 2 อันดับแรก', free: 'ความสุขเด่นติด 2 อันดับแรก หรือใช้ชีวิตแบบนักฝัน',
  home: 'มีรากที่ต่างจังหวัด กลับบ้านเกิดตอนเกษียณ และครอบครัว/ความสุขติด 3 อันดับแรก', centenarian: 'ร่างกายเด่น ความสุขติด 2 อันดับแรก ดูแลสุขภาพจริงจัง ไม่บ้างาน และไม่โดดเดี่ยว — แล้วอยู่ให้รอดถึง 100', ordinary: 'ไม่มีค่าไหนเด่นกว่าค่าอื่นชัดเจน',
  lonelyrich: 'เงินเด่น แต่ครอบครัวและความรักอ่อน', regret: 'ความสุขและครอบครัวอยู่ท้ายตาราง', accident: 'ความเร็วตอนวัยรุ่น', jail: 'เงินง่าย ๆ ที่ผิดกฎหมาย',
  fugitive: 'หนีเมื่อความผิดตามมาทัน', bankrupt: 'กู้หนี้จนเกินตัว', overwork: 'ทำงานหนักไม่พัก', heart: 'ไม่ยอมไปหาหมอ',
  alien: 'เก็บธง 3 อัน: หินอุกกาบาต → ถอดรหัส → ยาน', cat: 'เก็บธง 3 อัน: โกโก้ → สลับร่าง → แมวในใจ', ghost: 'เก็บธง 3 อัน: ใต้ถุนบ้าน → ความฝัน → อายุ 70',
  reborn: 'เจอเรื่องแปลก 2 เรื่อง แล้วรอถึงตะเกียงภูติ',
}

function EndingCompass({ s }: { s: GameState }) {
  const { now, close } = nearestEndings(s)
  const E = (id: string) => ENDINGS.find((e) => e.id === id)!
  const weird = weirdRules(s).filter((r) => r.checks.some((c) => c.ok))
  const dream = dreamOf(s)
  const steps = dreamSteps(s)
  return (
    <div className="mt-5 rounded-2xl bg-[#f4f1fb] p-3">
      {/* ⭐ แนวทางของความฝันที่เลือก (ไม่ใช่ฉากจบที่บังเอิญใกล้) */}
      {dream && (
        <div className="mb-3 rounded-xl bg-[#fff4d6] px-3 py-2.5">
          <div className="font-display text-lg text-[#6a4a00]">⭐ ความฝัน: {dream.icon} {dream.name}</div>
          <div className="text-[.8125rem] leading-[1.6] text-[#7a5a00]">💡 {dream.tip}</div>
          {steps.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{steps.map((c) => <span key={c.label} className={`rounded-full px-2 py-0.5 text-[.75rem] ${c.ok ? 'bg-[#eaf7ef] text-[#2f6a4a]' : 'bg-white text-[#8a6a76]'}`}>{c.ok ? '✅' : '○'} {c.label}</span>)}</div>}
        </div>
      )}
      <div className="font-display text-xl text-[#5a3443]">🧭 ฉากจบวันเกิด 70</div>
      <div className="text-[.8125rem] leading-[1.6] text-[#8a6a76]">ฉากจบดูจาก <b className="font-normal text-[#3a2433]">ค่าที่เด่นที่สุด 2 อันดับแรก</b> ของชีวิตนี้ (เทียบกับชีวิตทั่วไป) ไม่ใช่ตัวเลขตายตัว</div>
      <div className="mt-1 text-[.8125rem] text-[#5a3443]">ตอนนี้เด่นที่สุด: {statProfile(s).top.map((k) => { const i = STAT_INFO.find((x) => x.key === k); return i ? `${i.icon} ${i.label}` : ({ family: '🏠 ครอบครัว', friend: '🤝 เพื่อน', love: '❤️ ความรัก' } as Record<string, string>)[k] }).join(' · ')}</div>
      <div className={`mt-2 rounded-xl px-3 py-2 ${now.bad ? 'bg-[#fdecef]' : 'bg-[#eaf7ef]'}`}><span className="text-xl">{E(now.id).emoji}</span> <b className="font-display font-normal text-[#3a2433]">{E(now.id).title}</b></div>
      {/* มีความฝันแล้ว → ไม่โชว์ฉากจบอื่นที่ "ใกล้" (เคยโผล่ร้อยปีให้ทุกคน ทำให้เข้าใจผิดว่าเป็นแนวทาง) */}
      {!dream && close.length > 0 && <div className="mt-2 text-xs font-semibold text-[#7a5a66]">ใกล้แล้ว:</div>}
      {!dream && close.map((r) => (
        <div key={r.id} className="mt-1 rounded-xl bg-white px-3 py-2 text-sm">
          <div>{E(r.id).emoji} <span className="font-display text-[#3a2433]">{E(r.id).title}</span></div>
          <div className="mt-0.5 flex flex-wrap gap-1">{r.checks.map((c) => <span key={c.label} className={`rounded-full px-2 py-0.5 text-[.75rem] ${c.ok ? 'bg-[#eaf7ef] text-[#2f6a4a]' : 'bg-[#f3eef0] text-[#8a6a76]'}`}>{c.ok ? '✅' : '○'} {c.label}</span>)}</div>
        </div>
      ))}
      {weird.map((r) => (
        <div key={r.id} className="mt-1 rounded-xl bg-[#efe9ff] px-3 py-2 text-sm">
          <div>{E(r.id).emoji} <span className="font-display text-[#4a3a7a]">{E(r.id).title}</span> <span className="text-[.75rem] text-[#7b5cd6]">ฉากจบแปลก · เก็บธงให้ครบ</span></div>
          <div className="mt-0.5 flex flex-wrap gap-1">{r.checks.map((c) => <span key={c.label} className={`rounded-full px-2 py-0.5 text-[.75rem] ${c.ok ? 'bg-white text-[#4a3a7a]' : 'bg-white/50 text-[#9a8ab6]'}`}>{c.ok ? '✅' : '❔'} {c.ok ? c.label : '???'}</span>)}</div>
        </div>
      ))}
    </div>
  )
}

function EndingWhy({ s, ending }: { s: GameState; ending: Ending }) {
  const [open, setOpen] = useState(false)
  const rules = endingRules(s)
  const weird = weirdRules(s).find((r) => r.id === ending.id)
  const idx = rules.findIndex((r) => r.id === ending.id && r.checks.every((c) => c.ok))
  const missed = idx > 0 ? rules.slice(0, idx).filter((r) => !r.bad) : []
  const E = (id: string) => ENDINGS.find((e) => e.id === id)!
  return (
    <div className="mt-3 rounded-2xl bg-[#f6f2f4] p-3 text-[.875rem] leading-[1.65]">
      <button onClick={() => setOpen(!open)} className="w-full text-left font-display text-[#5a3443]">🔍 ทำไมได้ฉากจบนี้? <span className="text-[.8125rem]">{open ? '▲' : '▼'}</span></button>
      {open && (
        <div className="mt-2 flex flex-col gap-1">
          {s.endId && !weird && <div className="text-[#5a4a52]">ชีวิตจบลงจากทางเลือกในเหตุการณ์หนึ่ง ก่อนถึงวันเกิด 70</div>}
          {weird && weird.checks.map((c) => <div key={c.label}>{c.ok ? '✅' : '○'} {c.label}</div>)}
          {!s.endId && idx >= 0 && rules[idx].checks.map((c) => <div key={c.label}>✅ {c.label}</div>)}
          {!s.endId && ending.id === 'ordinary' && <div className="text-[#5a4a52]">ไม่เข้าเงื่อนไขฉากจบอื่นเลย — ชีวิตกลาง ๆ ที่สงบ</div>}
          {!s.endId && missed.length > 0 && <div className="mt-1 text-[.8125rem] font-semibold text-[#7a5a66]">ฉากจบที่เกือบได้:</div>}
          {!s.endId && missed.map((r) => (
            <div key={r.id} className="rounded-xl bg-white px-2 py-1">{E(r.id).emoji} {E(r.id).title}: {r.checks.filter((c) => !c.ok).map((c) => c.label).join(' · ')}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const MAJOR_RE = /^\p{Extended_Pictographic}|แต่งงาน|มีลูก|ลูกคน|เรียนจบ|รับปริญญา|เกิดเป็น|เสียชีวิต|จากไป|หย่า|ไล่ออก|ตกงาน|ลาออก|ได้งาน|เกษียณ|ล้มละลาย|ติดคุก|ย้ายไป|เปิดร้าน|เลื่อนตำแหน่ง/u
function LifeLog({ s, collapsible }: { s: GameState; collapsible?: boolean }) {
  const [all, setAll] = useState(!collapsible)
  const LIMIT = 5
  const shown = all ? s.history : s.history.slice(0, LIMIT)
  const groups = shown.reduce<{ age: number; items: { text: string }[] }[]>((g, h) => {
    const last = g[g.length - 1]
    if (last && last.age === h.age) last.items.push(h); else g.push({ age: h.age, items: [h] })
    return g
  }, [])
  const flags = labeledFlags(s)
  return (
    <div className="text-[.9375rem] leading-[1.65]">
      <h3 className="font-display text-2xl text-[#5a3443]">สมุดชีวิตของ {s.name}</h3>
      {flags.length > 0 && (
        <div className="mt-3 rounded-2xl bg-[#f8f4ef] p-3">
          <div className="font-display text-[#5a3443]">🚩 ธงชีวิต <span className="font-body text-[.8125rem] text-[#8a6a76]">ทางเลือกที่จะย้อนกลับมาหาคุณ</span></div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[.8125rem] text-[#7a6a72]">
            <span className="whitespace-nowrap"><span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#3fae78] align-[-2px] text-[.75rem] font-bold leading-none text-white">+</span>พื้นเขียว = ผลดี</span>
            <span className="whitespace-nowrap"><span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#e0707f] align-[-2px] text-[.75rem] font-bold leading-none text-white">−</span>พื้นชมพู = ผลเสีย</span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {flags.map((f) => (
              <div key={f.id} className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-[.875rem] ${f.tone === 'bad' ? 'bg-[#fdecef]' : f.tone === 'good' ? 'bg-[#eaf7ef]' : 'bg-white'}`}>
                {f.tone === 'good' || f.tone === 'bad'
                  ? <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[.75rem] font-bold leading-none text-white ${f.tone === 'good' ? 'bg-[#3fae78]' : 'bg-[#e0707f]'}`}>{f.tone === 'good' ? '+' : '−'}</span>
                  : <span className="mt-1 h-4 w-4 shrink-0" />}
                <span>{f.icon}</span>
                <span className="min-w-0 flex-1"><b className="font-display font-normal text-[#3a2433]">{f.label}</b>{f.age !== undefined && <span className="text-[.8125rem] text-[#8a6a76]"> · อายุ {f.age}</span>}<span className="block text-[.8125rem] leading-[1.6] text-[#7a6a72]">→ {f.effect}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
      {s.history.length === 0 && <p className="mt-4 text-[#8a6a76]">ยังไม่มีเรื่องราว...</p>}
      <ol className="mt-4 border-l-2 border-[#f0d4dc] pl-4">
        {groups.map((g, gi) => (
          <li key={gi} className="relative mb-3">
            <span className="font-display text-[.875rem] text-[#e0707f]">{g.age} ปี</span>
            {g.items.map((h, i) => {
              const major = MAJOR_RE.test(h.text)
              return (
                <div key={i} className="relative">
                  <span className={`absolute rounded-full ${major ? '-left-[1.5625rem] top-[.4375rem] h-4 w-4 bg-[#c0505f] ring-4 ring-[#fbe3e8]' : '-left-[1.375rem] top-[.5625rem] h-2.5 w-2.5 bg-[#ebb3bf]'}`} />
                  <div className={major ? 'font-semibold text-[#3a2433]' : 'text-[#5a4a52]'}>{h.text}</div>
                </div>
              )
            })}
          </li>
        ))}
      </ol>
      {collapsible && s.history.length > LIMIT && (
        <button onClick={() => setAll(!all)} className="mt-1 w-full whitespace-nowrap rounded-2xl border-2 border-[#f0d4dc] bg-white/70 px-4 py-2.5 font-display text-[#c0505f] active:scale-95">
          {all ? '🔼 ย่อเรื่องราว' : `📖 ดูทั้งหมด (${s.history.length} เหตุการณ์)`}
        </button>
      )}
    </div>
  )
}

/* ───────────────────────── ฉากจบ ───────────────────────── */
function EndingScreen({ s, onTitle, onAgain, onReborn, onLegacy }: { s: GameState; onTitle: () => void; onAgain: () => void; onReborn: () => void; onLegacy: () => void }) {
  const [ending] = useState<Ending>(() => pickEnding(s))
  const [isNew] = useState(() => !unlockedEndings().includes(ending.id))
  const age = endAgeOf(s, ending)
  const dream = dreamOf(s)
  const [dreamOk] = useState(() => !!dream && dream.check(s, ending))
  const [newAchs, setNewAchs] = useState<Ach[]>([])
  const [newUnl, setNewUnl] = useState<Unlock[]>([])
  const passOn = canPassOn(s)
  const [heir] = useState(() => heirloomOf(s, ending))
  const inh = inheritanceOf(s)
  const [copied, setCopied] = useState<null | 'copied' | 'shared'>(null)
  const [shareText, setShareText] = useState<string | null>(null)
  const [login, setLogin] = useState(false)
  useEffect(() => {
    // จบทดลองเล่นแล้วเพิ่ง login สำเร็จ → กลับหน้าแรก (ไม่ใช่คนที่ login อยู่แล้วแต่เปิด ?trial)
    if (!s.quick || !cloudReady || cloudState().user) return
    return onCloud((c) => { if (c.user) onTitle() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    unlockEnding(ending.id)
    logEnd(s, ending, age, dreamOk)
    if (s.visited?.length) rememberScenes(s.visited)
    const ids = ['first']
    if (dreamOk) { ids.push('dream'); if (recordDream(dream!.id) >= 3) ids.push('dream3') }
    if (ending.kind === 'bad' && age < 30) ids.push('young')
    if (ending.id === 'jail') ids.push('jail')
    if (ending.id === 'alien') ids.push('alien')
    if (ending.id === 'cat') ids.push('cat')
    if (s.flags.includes('partner') && !s.flags.includes('divorced')) ids.push('love')
    if (unlockedEndings().length >= 5) ids.push('endings5')
    if (s.life === 2 && s.past && s.past.endingId !== ending.id) { ids.push('reborn'); if (dreamOk && s.past.dreamOk) ids.push('reborn_master') }
    if ((s.gen ?? 1) >= 2 && netWorth(s) >= 10_000_000) ids.push('dynasty')
    if (recordLife(s, ending, age, dreamOk, married(s)).length >= 10) ids.push('lives10')
    const a = unlockAch(...ids)
    setNewAchs(a)
    setNewUnl(freshUnlocks())
    playMusic(ending.kind === 'bad' ? 'dark' : ending.kind === 'weird' ? 'teen' : 'elder')
    setTimeout(() => sfx(dreamOk ? 'unlock' : ending.kind === 'bad' ? 'death' : 'good'), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const share = async () => {
    const text = [
      `🌱 เส้นทางชีวิตของ ${s.name} (${age} ปี)`,
      `${ending.emoji} ${ending.title}`,
      `"${personaSentence(s)}"`,
      s.career ? `อาชีพ: ${CAREERS[s.career]}` : '',
      `ทรัพย์สิน: ${fmtBaht(netWorth(s))}`,
      dream ? `ความฝัน ${dream.icon} ${dream.name}: ${dreamOk ? '✅ สำเร็จ' : '❌ ไม่สำเร็จ'}` : '',
      '', ...s.history.slice(-5).map((h) => `• ${h.age} ปี ${h.text}`),
    ].filter((x) => x !== null).join('\n')
    // 1) มือถือ: เปิดเมนูแชร์ของเครื่อง  2) คัดลอกอัตโนมัติ  3) ถ้าเบราว์เซอร์ไม่ยอม → เปิดกล่องข้อความให้คัดลอกเอง
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: 'เส้นทางชีวิต', text }); setCopied('shared'); return } catch (e) { if ((e as Error)?.name === 'AbortError') return }
    }
    if (await copyText(text)) { setCopied('copied'); setTimeout(() => setCopied(null), 2500); return }
    setShareText(text)
  }
  const early = ending.kind === 'bad' && ['accident', 'overwork', 'heart'].includes(ending.id)
  const tag = ending.kind === 'bad' ? { t: 'ฉากจบแย่', c: 'bg-[#5a4a5e] text-white' } : ending.kind === 'weird' ? { t: 'ฉากจบแปลก', c: 'bg-[#7b5cd6] text-white' } : { t: 'ฉากจบดี', c: 'bg-[#3fae78] text-white' }
  const art = endingArtOf(ending.id, ending.kind)
  const fade = 'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)'
  return (
    <div className="fadein absolute inset-0 overflow-y-auto">
      <div className="fixed inset-0" style={{ filter: ending.kind === 'bad' ? 'grayscale(.7) brightness(.7)' : ending.kind === 'weird' ? 'hue-rotate(200deg) saturate(1.3)' : undefined }}><Background id="sky" /></div>
      <div className="relative z-10 mx-auto flex min-h-full max-w-4xl flex-col items-center gap-3 px-4 py-6 md:flex-row md:items-start md:gap-6 md:py-12 lg:max-w-7xl xl:max-w-[88rem]">
        {/* ตัวละคร: มือถืออยู่เหนือการ์ด (เล็กลง) · จอใหญ่อยู่ข้าง ๆ แบบ sticky — ขอบล่างจางหายด้วย mask */}
        <div className="bob h-[24dvh] w-[18dvh] shrink-0 md:sticky md:top-12 md:h-[60dvh] md:w-[45dvh] lg:h-[72dvh] lg:w-[42dvh] xl:h-[78dvh] xl:w-[48dvh]" style={{ WebkitMaskImage: fade, maskImage: fade }}>
          <div className="h-full w-full" style={{ filter: art.filter }}>
            {art.src
              ? <img src={art.src} alt={s.name} className="h-full w-full object-contain object-bottom" draggable={false} />
              : <Character id="me" playerAge={age} s={s} bg="sky" expr={art.expr ?? 'neutral'} />}
          </div>
        </div>

        {/* จอใหญ่: สรุป+ไปต่อ (ซ้าย) คู่กับรายละเอียด (ขวา) · จอเล็ก: เรียงลงมาทีละกล่อง */}
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-4 text-[.9375rem] leading-[1.65] lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          {/* ───── การ์ดสรุป (แคปหน้าจอเดียวจบ) ───── */}
          <div className="popin rounded-3xl bg-white/95 p-5 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5 text-[.8125rem] text-[#8a6a76]">
              <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold ${tag.c}`}>{tag.t}</span>
              {isNew && <span className="whitespace-nowrap rounded-full bg-[#ffd166] px-2.5 py-0.5 font-semibold text-[#6a4a00]">✨ ฉากจบใหม่!</span>}
              <span className="whitespace-nowrap">ชีวิตของ {s.name} · {early ? `จากไปตอนอายุ ${age} ปี` : `${age} ปี`}</span>
            </div>
            <h2 className="mt-2 font-display text-3xl leading-snug text-[#5a3443] sm:text-4xl">{ending.emoji} {ending.title}</h2>
            <p className="mt-1 text-[#5a4a52]">{ending.desc}</p>

            {dream && (
              <div className={`popin mt-4 flex items-center gap-3 rounded-2xl border-2 p-3 ${dreamOk ? 'border-[#8fd3a8] bg-[#eefaf2]' : 'border-[#e6e1e4] bg-[#f5f3f4]'}`} style={{ animationDelay: '.4s' }}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${dreamOk ? 'bg-[#3fae78]' : 'bg-[#b9b0b5]'}`}>{dreamOk ? '✓' : '✗'}</span>
                <div className="min-w-0">
                  <div className="text-[.8125rem] text-[#8a6a76]">ความฝันของชีวิต</div>
                  <div className={`font-display text-lg ${dreamOk ? 'text-[#2f6a4a]' : 'text-[#8f868b]'}`}>{dream.icon} {dream.name} — {dreamOk ? 'ทำได้แล้ว!' : 'ยังไปไม่ถึง'}</div>
                </div>
              </div>
            )}

            <PersonaCard s={s} />

            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3">
              {STAT_INFO.map((t) => {
                // ค่าสถานะไม่มีเพดาน → แถบเทียบกับค่าที่สูงที่สุดของชีวิตนี้ · ★ = ค่าที่เด่นที่สุด (ใช้ตัดสินฉากจบ)
                const top = Math.max(STAT_MAX, ...STAT_INFO.map((x) => s.stats[x.key]))
                const star = statProfile(s).top.includes(t.key)
                return (
                  <div key={t.key} className="text-[.875rem]">
                    <div className="flex items-center justify-between gap-1"><span className="truncate">{t.icon} {t.label}</span><span className="whitespace-nowrap font-display text-[#3a2433]">{star && <span className="mr-0.5 text-[.8125rem] text-[#d4a017]">★</span>}{s.stats[t.key]}</span></div>
                    <div className={`mt-1 h-2 overflow-hidden rounded-full bg-black/10 ${star ? 'ring-2 ring-[#ffd166]' : ''}`}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.stats[t.key] / top) * 100)}%`, background: t.color }} /></div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex justify-between gap-3 rounded-2xl bg-[#fdf3f5] p-4">
              <div className="min-w-0"><div className="whitespace-nowrap text-[.8125rem] text-[#8a6a76]">💼 อาชีพ</div><div className="font-display text-xl text-[#4a2c38]">{s.career ? CAREERS[s.career] : 'ยังค้นหาตัวเองอยู่'}</div></div>
              <div className="text-right"><div className="whitespace-nowrap text-[.8125rem] text-[#8a6a76]">💰 ทรัพย์สินสุทธิ</div><div className={`whitespace-nowrap font-display text-xl ${netWorth(s) < 0 ? 'text-[#c0505f]' : 'text-[#2f8f5a]'}`}>{fmtBaht(netWorth(s))}</div></div>
            </div>

            <ShareCard make={() => drawLifeCard(s, ending, age, dreamOk)} fileName={`เส้นทางชีวิต-${s.name}.png`} title={`การ์ดชีวิตของ ${s.name}`}
              text={`${ending.emoji} ${ending.title} — ชีวิตของ ${s.name} (${age} ปี) · ${location.origin}`} onShared={() => setCopied('shared')} onFail={() => void share()}
              label={copied === 'shared' ? '✅ แชร์แล้ว' : '🖼️ แชร์การ์ดชีวิต'}
              className="mt-4 w-full whitespace-nowrap rounded-2xl bg-[#e0707f] px-5 py-3.5 font-display text-lg text-white shadow-lg transition hover:bg-[#d65f70] active:scale-[.98] disabled:opacity-60" />
            <button onClick={share} className="mt-2 w-full whitespace-nowrap text-center text-[.8125rem] text-[#8a6a76] underline-offset-2 hover:underline">
              {copied === 'copied' ? '✅ คัดลอกข้อความแล้ว — วางในแชตได้เลย' : '📋 หรือคัดลอกเป็นข้อความ'}
            </button>
          </div>

          <FeedbackBox s={s} ending={ending} age={age} />

          {/* ───── ไปต่อ ───── */}
          <div className="rounded-3xl bg-white/90 p-4 shadow-xl sm:p-5">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onAgain} className="whitespace-nowrap rounded-2xl border-2 border-[#e0707f] bg-white/70 px-3 py-3 font-display text-base text-[#c0505f] transition hover:bg-[#fdf3f5] active:scale-95">✨ เริ่มชีวิตใหม่</button>
              <button onClick={onTitle} className="whitespace-nowrap rounded-2xl border-2 border-[#d9c9d0] bg-white/70 px-3 py-3 font-display text-base text-[#5a3443] transition hover:bg-[#f6f2f4] active:scale-95">🏠 หน้าแรก</button>
            </div>
            {s.quick ? (
              <div className="popin mt-4 rounded-2xl bg-[#2b2238] p-4 text-[#f3e6ff]" style={{ animationDelay: '.6s' }}>
                <div className="font-display text-lg text-[#ffd166]">⚡ นี่เป็นแค่ชีวิตฉบับทดลอง</div>
                <div className="mt-1 text-sm leading-relaxed">ยังมีเกมที่มีรายละเอียดเยอะกว่านี้อีกมาก — เหตุการณ์สุ่ม ความลับ ความฝันของชีวิต เส้นเรื่องเพื่อน คนรัก และงาน</div>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  <li>☁️ เก็บเซฟ อัลบั้มชีวิต และของสะสมไว้บนคลาวด์ เล่นต่อได้ทุกเครื่อง</li>
                  <li>🧬 สร้างตระกูลของตัวเอง ส่งต่อมรดกให้ลูกหลานรุ่นต่อรุ่น</li>
                  <li>♾️ ไปเกิดชาติที่ 2 พร้อมกรรมจากชาตินี้</li>
                </ul>
                <button onClick={() => { sfx('tap'); setLogin(true) }} className="mt-3 w-full whitespace-nowrap rounded-2xl bg-[#ffd166] px-5 py-3 font-display text-lg text-[#3a2433] shadow-lg active:scale-95">🔓 เข้าสู่ระบบ / สมัครฟรี</button>
                <div className="mt-2 text-center text-[.75rem] text-[#cbb8e0]">เข้าสู่ระบบแล้วกด "✨ เริ่มชีวิตใหม่" เพื่อเล่นเกมเต็ม</div>
              </div>
            ) : <>
            <div className="mt-3 flex flex-col gap-1 rounded-2xl bg-[#f6f2f8] px-3 py-2 text-[.8125rem] leading-[1.6] text-[#6a5a72]">
              {s.life !== 2 && <div><b className="font-display font-normal text-[#3a2433]">🔄 ไปเกิดชาติที่ 2</b> — เล่นต่อ พร้อมกรรมจากชาตินี้ติดตัวไป</div>}
              <div><b className="font-display font-normal text-[#3a2433]">✨ เริ่มชีวิตใหม่</b> — เริ่มจากศูนย์ ไม่มีอะไรจากชีวิตนี้ติดตัวไป</div>
            </div>

            {s.life === 2 && s.past && <TwoLives s={s} ending={ending} dreamOk={dreamOk} age={age} />}
            {s.life !== 2 && (
              <div className="mt-4 rounded-2xl bg-[#2b2238] p-4 text-[#f3e6ff]">
                <div className="font-display text-lg text-[#ffd166]">♾️ อยากลองชาติที่ 2 ไหม?</div>
                <div className="text-sm">เกิดใหม่พร้อมกรรมจากชาตินี้ — ห้ามเลือกทางเดิม {s.picks?.length ?? 0} ทาง ต้องได้ฉากจบที่ไม่ใช่ "{ending.title}" และความฝันใหม่ <span className="rounded-full bg-[#c0304a] px-2 py-0.5 text-xs text-white">ยากที่สุด</span></div>
                <button onClick={() => { sfx('whoosh'); onReborn() }} className="mt-3 w-full whitespace-nowrap rounded-2xl border-2 border-[#ffd166] px-5 py-3 font-display text-lg text-[#ffd166] shadow-lg active:scale-95">🔄 ไปเกิดชาติที่ 2</button>
              </div>
            )}
            {passOn ? (
              <div className="popin mt-4 rounded-2xl border-2 border-[#3fae78] bg-[#eef8f1] p-4" style={{ animationDelay: '.6s' }}>
                <div className="font-display text-lg text-[#2f6a4a]">🧬 ส่งต่อตระกูลให้ลูก (รุ่นที่ {(s.gen ?? 1) + 1})</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-white p-2"><div className="text-[.8125rem] text-[#5a7a66]">มรดก</div><div className={`font-display ${inh.debt ? 'text-[#c0505f]' : 'text-[#2f8f5a]'}`}>{inh.debt ? `หนี้ ${fmtBaht(inh.debt)}` : fmtBaht(inh.cash)}</div></div>
                  <div className="rounded-xl bg-white p-2"><div className="text-[.8125rem] text-[#5a7a66]">ของตกทอด</div><div className="font-display text-[#3a2433]">{heir.icon} {heir.name}</div><div className="text-[.8125rem] text-[#8a6a76]">{heir.desc}</div></div>
                </div>
                <button onClick={() => { sfx('whoosh'); onLegacy() }} className="mt-3 w-full whitespace-nowrap rounded-2xl bg-[#3fae78] px-5 py-3 font-display text-lg text-white shadow-lg active:scale-95">👶 เล่นต่อเป็นลูก</button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[#cfe3d6] p-3 text-sm text-[#7a8a80]">🧬 ส่งต่อรุ่นลูก: ต้องมีลูกก่อน (แต่งงานแล้วเลือก "มีลูกกัน") ตระกูลจึงจะสืบทอดต่อได้</div>
            )}
            </>}
            {login && <div className="fixed inset-0 z-50"><AccountModal onClose={() => setLogin(false)} /></div>}
            {newUnl.length > 0 && (
              <div className="popin mt-3 rounded-2xl border-2 border-[#ffd166] bg-[#2b2238] p-3 text-white" style={{ animationDelay: '.8s' }}>
                <div className="font-display text-[#ffd166]">🎁 ปลดล็อกของใหม่!</div>
                <div className="mt-1 flex flex-wrap gap-2">{newUnl.map((u) => <span key={u.id} className="rounded-full bg-white/15 px-3 py-1 text-sm">{u.icon} {u.name}</span>)}</div>
              </div>
            )}
            {newAchs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {newAchs.map((a) => <span key={a.id} className="popin rounded-full bg-[#2b2238] px-3 py-1 text-sm text-white">🏆 {a.icon} {a.name}</span>)}
              </div>
            )}
          </div>
        </div>

          {/* ───── รายละเอียด ───── */}
          <div className="min-w-0 rounded-3xl bg-white/95 p-5 shadow-xl sm:p-6">
            {s.reflections?.some((r) => r.a) && (
              <div className="mb-4 rounded-2xl bg-[#fffaf3] p-4 ring-1 ring-[#f0e2c8]">
                <div className="font-display text-lg text-[#5a3443]">🕯️ คำตอบของคุณระหว่างทาง</div>
                <div className="text-[.8125rem] text-[#8a6a76]">ชีวิตในเกมจบแล้ว แต่ชีวิตจริงยังเดินต่อ</div>
                {s.reflections.filter((r) => r.a).map((r) => (
                  <div key={r.age} className="mt-2.5">
                    <div className="text-[.8125rem] text-[#8a6a76]">อายุ {r.age} · {r.q}</div>
                    <div className="font-display text-[1.0625rem] leading-snug text-[#3a2433]">“{r.a}”</div>
                  </div>
                ))}
              </div>
            )}
            <EndingWhy s={s} ending={ending} />
            <RoadsNotTaken s={s} />
            {s.lineage?.length ? <FamilyTree lineage={s.lineage} me={{ name: s.name, emoji: ending.emoji, age }} /> : null}
            <div className="mt-5"><LifeLog s={s} collapsible /></div>
          </div>
        </div>
      </div>
      {dreamOk && <Fx kind="confetti" />}
      {shareText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShareText(null)}>
          <div className="popin w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl text-[#5a3443]">📤 แชร์ผลชีวิต</h3>
            <p className="text-[.8125rem] leading-[1.6] text-[#8a6a76]">เบราว์เซอร์นี้ไม่อนุญาตให้คัดลอกอัตโนมัติ — กดค้างที่ข้อความแล้วเลือก "คัดลอก"</p>
            <textarea readOnly value={shareText} onFocus={(e) => e.currentTarget.select()} autoFocus rows={9} className="mt-2 w-full select-text rounded-xl border-2 border-[#f0d4dc] p-2 text-[.875rem] leading-[1.6] text-[#3a2433]" />
            <button onClick={() => setShareText(null)} className="mt-3 w-full whitespace-nowrap rounded-2xl bg-[#e0707f] py-3 font-display text-white">✔️ เรียบร้อย</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** คัดลอกข้อความ: Clipboard API → execCommand (เผื่อหน้าเว็บอยู่ใน iframe/ไฟล์ในเครื่อง) */
async function copyText(text: string) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true } } catch { /* ลองวิธีถัดไป */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch { return false }
}

function RealStats() {
  const groups = Object.values(SOURCES).filter((x) => x.id !== 'game')
  return (
    <div className="mt-4 text-[.875rem] leading-[1.65]">
      <p className="rounded-2xl bg-[#f4f1fb] p-3 text-[#5a4a6a]">เรื่องไม่คาดคิดในเกมไม่ได้สุ่มลอย ๆ — ทุกปีเกมจะทอยแต่ละเรื่องตาม <b>โอกาสจริงต่อปี</b> ที่คิดจากสถิติของประเทศไทย แล้วปรับตามอายุ ร่างกาย ประกัน อาชีพ และที่อยู่ของตัวละคร</p>
      <div className="mt-3 flex flex-col gap-2">
        {SHOCKS.map((x) => (
          <div key={x.id} className={`rounded-2xl p-3 ${x.src === 'game' ? 'bg-[#f6f2f4]' : 'bg-white ring-1 ring-black/5'}`}>
            <div className="flex items-start gap-2"><span className="text-2xl">{x.icon}</span><div className="min-w-0 flex-1"><div className="font-display text-[#3a2433]">{x.text}</div><div className="text-[.8125rem] text-[#6a5a72]">อายุ {x.min}–{x.max} · {x.basis}</div><div className="text-[.8125rem] text-[#8a7a9a]">ที่มา: {SOURCES[x.src].org}</div></div></div>
          </div>
        ))}
        <div className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <div className="flex items-start gap-2"><span className="text-2xl">📈</span><div className="min-w-0 flex-1"><div className="font-display text-[#3a2433]">ผลตอบแทนการลงทุน</div><div className="text-[.8125rem] text-[#6a5a72]">เฉพาะเงินที่เลือกลงหุ้นเอง: พอร์ตหุ้นไทย 50% (SET + ปันผล 3%) + หุ้นโลก 50% (MSCI World) ของ "ปีจริง" เดียวกัน สุ่มจาก 2537–2567 · เฉลี่ย ≈{MARKET_BASIS.avg}%/ปี · ทรัพย์สินอื่น (บ้าน ที่ดิน ธุรกิจ ทอง) โตคงที่ 3.5%/ปี · ร่วงเกิน {-MARKET_BASIS.crashPct}% ≈{(MARKET_BASIS.crash * 100).toFixed(0)}% ต่อปี · พุ่งเกิน {MARKET_BASIS.boomPct}% ≈{(MARKET_BASIS.boom * 100).toFixed(0)}% ต่อปี</div></div></div>
        </div>
      </div>
      <h3 className="mt-5 font-display text-lg text-[#5a3443]">👵 พ่อแม่จะอยู่กับเรานานแค่ไหน</h3>
      <div className="mt-2 rounded-2xl bg-white p-3 ring-1 ring-black/5 text-[.8125rem] text-[#6a5a72]">
        แม่อายุ {PARENT_AGE.mom} ปีตอนคุณเกิด (UN) พ่ออายุ {PARENT_AGE.dad} ปี — หลังคุณอายุ 30 เกมทอยทุกปีตาม <b className="font-normal text-[#3a2433]">ตารางชีพ UN ของประเทศไทย</b> เช่น ผู้หญิงอายุ 70 มีโอกาสจากไป {pct(qx(70, 'f'))} ต่อปี ผู้ชาย {pct(qx(70, 'm'))} ต่อปี · อายุ 85: {pct(qx(85, 'f'))} / {pct(qx(85, 'm'))} — ฉาก "ลาก่อนแม่/พ่อ" จึงเกิดในอายุที่ต่างกันทุกชีวิต และหลังจากนั้นจะไม่มีฉากที่มีพ่อ/แม่อีก
        <div className="mt-1 text-[#8a7a9a]">ที่มา: {SOURCES.un_wpp.org} · {SOURCES.un_birth.org}</div>
      </div>
      <h3 className="mt-5 font-display text-lg text-[#5a3443]">แหล่งข้อมูล</h3>
      <div className="mt-2 flex flex-col gap-2">
        {groups.map((g) => (
          <div key={g.id} className="block rounded-2xl bg-[#faf7fd] p-3 text-[.8125rem] leading-[1.6] text-[#5a4a6a]">
            <b className="font-display font-normal text-[#3a2433]">{g.org}</b> · {g.year}<br />{g.title}
            {g.url && <div className="mt-0.5 select-all break-all text-[.8125rem] text-[#9a8ab0]">{g.url.replace(/^https?:\/\//, '')}</div>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[.8125rem] text-[#8a7a9a]">ตัวเลขที่เขียนว่า "ประมาณ" คือค่าที่คำนวณต่อจากสถิติทางการ เพราะไม่มีตัวเลขรายปีตามอายุโดยตรง</p>
    </div>
  )
}

function Album({ saves, onOpen, onDelete, onBack }: { saves: SaveSlot[]; onOpen: (x: SaveSlot) => void; onDelete: (id: string) => void; onBack: () => void }) {
  const [tab, setTab] = useState<'lives' | 'family' | 'endings' | 'achs' | 'unlocks' | 'secrets' | 'stats'>('lives')
  const secrets = foundSecrets()
  const [open, setOpen] = useState<LifeRecord | null>(null)
  const [shareRec, setShareRec] = useState<LifeRecord | null>(null)
  const lives = lifeRecords()
  const got = unlockedEndings()
  const achs = unlockedAchs()
  const unl = unlockedIds()
  const tabs: [typeof tab, string][] = [['lives', '📸 ชีวิต'], ['family', '🌳 ตระกูล'], ['endings', '📖 ฉากจบ'], ['achs', '🏆 ถ้วย'], ['secrets', `🔐 ความลับ ${secrets.length}/${SECRETS.length}`], ['unlocks', '🎁 ปลดล็อก'], ['stats', '📚 สถิติจริง']]
  const slotOf = new Map(saves.map((x) => [x.id, x]))
  const families = Object.values(lives.reduce<Record<string, LifeRecord[]>>((m, l) => { (m[l.lineageId] ??= []).push(l); return m }, {}))
    .filter((f) => f.length >= 2 || f.some((l) => l.gen >= 2) || slotOf.has(f[0].lineageId)).map((f) => [...f].sort((a, b) => a.gen - b.gen))
    .sort((a, b) => Number(slotOf.has(b[0].lineageId)) - Number(slotOf.has(a[0].lineageId)))
  // ตระกูลที่เล่นค้างแต่ยังไม่มีชีวิตไหนจบ (ยังไม่อยู่ในอัลบั้ม)
  const ongoing = saves.filter((x) => !families.some((f) => f[0].lineageId === x.id))
  const years = lives.reduce((t, l) => t + l.age, 0)
  return (
    <div className="fadein absolute inset-0 overflow-y-auto">
      <div className="fixed inset-0"><Background id="garden" /></div>
      <div className="relative z-10 mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="rounded-3xl bg-white/95 p-4 shadow-2xl sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl text-[#5a3443] sm:text-3xl">📸 อัลบั้มชีวิต</h2>
            <Btn onClick={onBack}>กลับ</Btn>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs text-[#8a6a76]">
            <div className="rounded-xl bg-[#fdf3f5] p-2"><b className="block font-display text-lg text-[#5a3443]">{lives.length}</b>ชีวิต</div>
            <div className="rounded-xl bg-[#fdf3f5] p-2"><b className="block font-display text-lg text-[#5a3443]">{years}</b>ปีที่ใช้ชีวิต</div>
            <div className="rounded-xl bg-[#fdf3f5] p-2"><b className="block font-display text-lg text-[#5a3443]">{got.length}/{ENDINGS.length}</b>ฉากจบ</div>
            <div className="rounded-xl bg-[#fdf3f5] p-2"><b className="block font-display text-lg text-[#5a3443]">{unl.length}/{UNLOCKS.length}</b>ปลดล็อก</div>
          </div>
          <div className="-mx-1 mt-4 flex gap-1 overflow-x-auto pb-1">
            {tabs.map(([k, t]) => (
              <button key={k} onClick={() => { setTab(k); sfx('tap') }} className={`shrink-0 rounded-full px-3 py-1.5 font-display text-sm ${tab === k ? 'bg-[#e0707f] text-white' : 'bg-[#f6eef1] text-[#7a5a66]'}`}>{t}</button>
            ))}
          </div>

          {tab === 'lives' && (
            lives.length === 0 ? <p className="mt-6 text-center text-[#8a6a76]">ยังไม่มีชีวิตในอัลบั้ม ลองเล่นให้จบสักชีวิตนะ</p> : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {lives.map((l, i) => (
                  <button key={l.id} onClick={() => { setOpen(l); sfx('tap') }} className="popin overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-1" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s`, transform: `rotate(${((l.id % 5) - 2) * 0.6}deg)` }}>
                    <div className="relative h-32 overflow-hidden sm:h-40" style={{ filter: l.kind === 'bad' ? 'grayscale(.7)' : l.kind === 'weird' ? 'hue-rotate(200deg)' : undefined }}>
                      <Background id="sky" />
                      <div className="absolute inset-x-0 bottom-0 top-2"><Character id="me" playerAge={Math.min(l.age, 70)} s={{ ...newGame(l.name, l.gender, HAIRS[0]), career: l.career }} bg="sky" expr={l.kind === 'bad' ? 'sad' : 'happy'} /></div>
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 text-lg">{l.emoji}</span>
                      {l.gen >= 2 && <span className="absolute right-2 top-2 rounded-full bg-[#3fae78] px-2 text-[.75rem] text-white">รุ่น {l.gen}</span>}
                      {l.life === 2 && <span className="absolute right-2 top-2 rounded-full bg-[#2b2238] px-2 text-[.75rem] text-[#ffd166]">ชาติ 2</span>}
                    </div>
                    <div className="p-2">
                      <div className="truncate font-display text-[#3a2433]">{l.name} · {l.age} ปี</div>
                      <div className="truncate text-xs text-[#8a6a76]">{l.title}</div>
                      <div className="mt-0.5 flex justify-between text-[.75rem]"><span className="truncate text-[#8a6a76]">{l.career ? CAREERS[l.career] : '—'}</span><span>{l.dreamOk ? '⭐' : ''}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'family' && (
            families.length + ongoing.length === 0 ? <p className="mt-6 text-center text-[#8a6a76]">ยังไม่มีตระกูล — มีลูกแล้วกด "เล่นต่อเป็นลูก" ตอนจบเกม</p> : (
              <div className="mt-4 flex flex-col gap-4">
                {ongoing.map((x) => (
                  <div key={x.id} className="rounded-2xl bg-[#fdf3f5] p-3">
                    <div className="font-display text-[#5a3443]">🌳 ตระกูลของ{x.s.lineage?.[0]?.name ?? x.s.name} · รุ่น {x.s.gen ?? 1}</div>
                    <SlotActions x={x} onOpen={onOpen} onDelete={onDelete} />
                  </div>
                ))}
                {families.map((f) => (
                  <div key={f[0].lineageId} className="rounded-2xl bg-[#eef8f1] p-3">
                    <div className="font-display text-[#2f6a4a]">🌳 ตระกูลของ{f[0].name} · {f.length} รุ่น</div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {f.map((l, i) => (
                        <span key={l.id} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[#8aa898]">→</span>}
                          <button onClick={() => setOpen(l)} className="rounded-xl bg-white px-2 py-1 text-sm shadow-sm">{l.emoji} {l.name} <span className="text-[.75rem] text-[#8a6a76]">{l.age} ปี</span></button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-[#5a7a66]">ทรัพย์สินรวมทุกรุ่น {fmtBaht(f.reduce((t, l) => t + l.net, 0))}</div>
                    {slotOf.has(f[0].lineageId) && <SlotActions x={slotOf.get(f[0].lineageId)!} onOpen={onOpen} onDelete={onDelete} />}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'stats' && <RealStats />}
          {tab === 'endings' && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ENDINGS.map((e) => {
                const ok = got.includes(e.id)
                return (
                  <div key={e.id} className={`rounded-2xl p-4 ${ok ? 'bg-[#fdf3f5]' : 'bg-[#f1eef2]'}`}>
                    <div className="flex items-center gap-2 font-display text-xl text-[#4a2c38]">{ok ? `${e.emoji} ${e.title}` : '🔒 ???'}<span className={`ml-auto rounded-full px-2 py-0.5 font-body text-[.75rem] ${e.kind === 'bad' ? 'bg-[#5a4a5e] text-white' : e.kind === 'weird' ? 'bg-[#7b5cd6] text-white' : 'bg-[#3fae78] text-white'}`}>{e.kind === 'bad' ? 'แย่' : e.kind === 'weird' ? 'แปลก' : 'ดี'}</span></div>
                    <div className="mt-1 text-sm text-[#6a5a62]">{ok ? e.desc : `💡 ${END_HINT[e.id] ?? 'ลองเลือกเส้นทางชีวิตที่ต่างออกไปดูสิ'}`}</div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'achs' && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACHS.map((a) => {
                const ok = achs.includes(a.id)
                return (
                  <div key={a.id} className={`rounded-2xl p-3 text-center ${ok ? 'bg-[#fff8e1]' : 'bg-[#f1eef2] opacity-60'}`}>
                    <div className={`text-3xl ${ok ? '' : 'grayscale'}`}>{ok ? a.icon : '🔒'}</div>
                    <div className="font-display text-sm text-[#3a2433]">{a.name}</div>
                    <div className="text-[.75rem] text-[#8a6a76]">{a.desc}</div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'secrets' && (
            <div className="mt-4 flex flex-col gap-2">
              {SECRETS.map((x) => {
                const ok = secrets.includes(x.no)
                return (
                  <div key={x.no} className={`rounded-2xl p-3 ${ok ? 'border-2 border-[#ffd166] bg-[#2b2238] text-white' : 'bg-[#1d1a2b]/90 text-white/70'}`}>
                    <div className="font-display text-xs tracking-[0.2em] text-[#ffd166]">{ok ? '🔓' : '🔒'} {secretTag(x.no).replace('🔒 ', '')}</div>
                    <div className="font-display text-lg">{ok ? x.title : '? ? ?'}</div>
                    {ok ? (
                      <ul className="mt-1 text-xs text-white/80">{x.conds.map((c) => <li key={c}>✓ {c}</li>)}</ul>
                    ) : (
                      <div className="mt-1 text-xs italic">คำใบ้: {x.hint} · เงื่อนไข {x.conds.length} ข้อ</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'unlocks' && (
            <div className="mt-4 flex flex-col gap-2">
              {UNLOCKS.map((u) => {
                const ok = unl.includes(u.id)
                return (
                  <div key={u.id} className={`flex items-center gap-3 rounded-2xl p-3 ${ok ? 'bg-[#fff8e1]' : 'bg-[#f1eef2]'}`}>
                    <span className={`text-3xl ${ok ? '' : 'opacity-40 grayscale'}`}>{u.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[#3a2433]">{u.name} <span className="ml-1 rounded-full bg-black/5 px-2 font-body text-[.75rem] text-[#8a6a76]">{u.kind === 'trait' ? 'ไพ่ดวงชะตา' : u.kind === 'dream' ? 'ความฝัน' : 'ความสามารถ'}</span></div>
                      <div className="text-xs text-[#8a6a76]">{ok ? u.desc : `🔒 วิธีปลดล็อก: ${u.how}`}</div>
                    </div>
                    {ok && <span className="text-[#3fae78]">✓</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {shareRec && <ShareCardModal make={() => drawRecordCard(shareRec)} fileName={`เส้นทางชีวิต-${shareRec.name}.png`} title={`การ์ดชีวิตของ ${shareRec.name}`}
        text={`${shareRec.emoji} ${shareRec.title} — ชีวิตของ ${shareRec.name} (${shareRec.age} ปี) · ${location.origin}`} onClose={() => setShareRec(null)} />}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div className="popin max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm text-[#8a6a76]">{new Date(open.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}{open.gen >= 2 ? ` · รุ่นที่ ${open.gen}` : ''}{open.life === 2 ? ' · ชาติที่ 2' : ''}</div>
            <h3 className="font-display text-2xl text-[#3a2433]">{open.emoji} {open.name} · {open.age} ปี</h3>
            <div className="text-[#5a4a52]">{open.title}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-[#fdf3f5] p-2"><div className="text-xs text-[#8a6a76]">อาชีพ</div>{open.career ? CAREERS[open.career] : '—'}</div>
              <div className="rounded-xl bg-[#fdf3f5] p-2"><div className="text-xs text-[#8a6a76]">ทรัพย์สิน</div>{fmtBaht(open.net)}</div>
              <div className="rounded-xl bg-[#fdf3f5] p-2"><div className="text-xs text-[#8a6a76]">ความฝัน</div>{DREAMS.find((d) => d.id === open.dream)?.icon} {open.dreamOk ? 'สำเร็จ ⭐' : 'ไม่สำเร็จ'}</div>
              <div className="rounded-xl bg-[#fdf3f5] p-2"><div className="text-xs text-[#8a6a76]">ครอบครัว</div>{open.married ? '💍' : '—'} {open.kid ? '👶' : ''}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {(Object.keys(BOND_INFO) as BondId[]).filter((b) => (open.bonds[b] ?? 0) > 0).map((b) => <span key={b} className="rounded-full bg-[#f3eef7] px-2 py-0.5">{BOND_INFO[b].icon} {BOND_INFO[b].name} {open.bonds[b]}</span>)}
            </div>
            <ol className="mt-4 border-l-2 border-[#f0d4dc] pl-4">
              {open.history.map((h, i) => (
                <li key={i} className="relative mb-2"><span className="absolute -left-[1.4375rem] top-1.5 h-3 w-3 rounded-full bg-[#e0707f]" /><span className="font-display text-xs text-[#e0707f]">{h.age} ปี</span><div className="text-sm text-[#4a2c38]">{h.text}</div></li>
              ))}
            </ol>
            {/* ปิดหน้ารายละเอียดชีวิตก่อน แล้วค่อยเปิดการ์ด (ไม่ให้หน้าต่างซ้อนกัน) */}
            <button onClick={() => { setShareRec(open); setOpen(null) }} className="mt-4 w-full whitespace-nowrap rounded-2xl bg-[#e0707f] px-5 py-3 font-display text-lg text-white shadow-lg active:scale-[.98]">🖼️ แชร์การ์ดชีวิต</button>
            <Btn className="mt-3 w-full" onClick={() => setOpen(null)}>ปิด</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

const TRAIT_COLOR: Record<string, string> = {
  kind: '#f07a9a', greed: '#e3a92b', brave: '#f0864b', smart: '#5b8def',
  selfish: '#8a5cc0', funny: '#33b8a0', endure: '#4caf6a', fragile: '#a99ac8',
}
function PersonaCard({ s }: { s: GameState }) {
  const top = personaPct(s).slice(0, 4)
  const best = top[0]?.pct ?? 0
  return (
    <div className="popin mt-4 rounded-2xl border-2 border-[#e9dcf7] bg-[#faf7fd] p-4" style={{ animationDelay: '.45s' }}>
      <div className="text-[.8125rem] text-[#8a6a96]">🧬 บุคลิกชีวิตของคุณ · {personaTitle(s)}</div>
      <div className="mt-0.5 font-display text-xl leading-snug text-[#3a2433]">"{personaSentence(s)}"</div>
      <div className="mt-2 flex flex-col gap-1.5">
        {top.map((p) => {
          const hi = best > 0 && p.pct === best
          return (
            <div key={p.k} className={`flex items-center gap-2 rounded-xl px-1.5 py-0.5 text-[.875rem] ${hi ? 'bg-white shadow-sm ring-1 ring-black/5' : ''}`}>
              <span className={`w-[7.5rem] shrink-0 whitespace-nowrap ${hi ? 'font-semibold text-[#3a2433]' : 'text-[#5a4a62]'}`}>{p.icon} {p.name}</span>
              <div className={`${hi ? 'h-3' : 'h-2.5'} flex-1 overflow-hidden rounded-full bg-black/10`}><div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: TRAIT_COLOR[p.k], opacity: hi ? 1 : 0.75 }} /></div>
              <span className="w-10 whitespace-nowrap text-right font-display" style={{ color: hi ? TRAIT_COLOR[p.k] : '#5a3443' }}>{p.pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoadsNotTaken({ s }: { s: GameState }) {
  const roads = (s.roads ?? []).filter((r) => r.who).slice(-3)
  if (!roads.length) return null
  return (
    <div className="mt-4 rounded-2xl bg-[#faf7fd] p-3">
      <div className="font-display text-[#5a3a6a]">🛤️ ทางที่ไม่ได้เลือก</div>
      <div className="mt-1 flex flex-col gap-1">
        {roads.map((r, i) => <div key={i} className="text-[.875rem] leading-[1.65] text-[#5a4a62]"><span className="whitespace-nowrap font-display text-[#8a6a96]">อายุ {r.age}:</span> เลือก {r.chose} — แทนที่จะ {r.other}</div>)}
      </div>
    </div>
  )
}

function FamilyTree({ lineage, me }: { lineage: NonNullable<GameState['lineage']>; me: { name: string; emoji: string; age: number } }) {
  return (
    <div className="popin mt-4 rounded-2xl bg-[#eef8f1] p-3" style={{ animationDelay: '.7s' }}>
      <div className="font-display text-[#2f6a4a]">🌳 ต้นตระกูล</div>
      <div className="mt-2 flex flex-col gap-1">
        {[...lineage, { ...me, words: undefined, heirloom: undefined, title: '' }].map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ paddingLeft: i * 12 }}>
            <span className="text-[#8aa898]">{i ? '└' : '●'}</span>
            <span className="font-display text-[#3a2433]">{a.emoji} {a.name}</span>
            <span className="text-[.8125rem] text-[#8a6a76]">{a.age} ปี{a.heirloom ? ` · ทิ้งไว้ ${a.heirloom}` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── ปุ่มเล่นต่อแต่ละตระกูล (ในอัลบั้ม) ───────────────────────── */
function SlotButton({ x, onOpen, className = '' }: { x: SaveSlot; onOpen: (x: SaveSlot) => void; className?: string }) {
  const heir = x.status === 'heir'
  return (
    <button onClick={() => { sfx('whoosh'); onOpen(x) }} className={`whitespace-nowrap rounded-xl px-3 py-2 font-display text-white shadow active:scale-95 ${heir ? 'bg-[#3fae78]' : 'bg-[#e0707f]'} ${className}`}>
      {heir ? `👶 เล่นเป็นลูก (รุ่น ${(x.s.gen ?? 1) + 1})` : `▶ เล่นต่อ · ${x.s.name}`}
    </button>
  )
}

/** ปุ่มเล่นต่อ + ลบเซฟของตระกูล */
function SlotActions({ x, onOpen, onDelete }: { x: SaveSlot; onOpen: (x: SaveSlot) => void; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="mt-2 flex gap-2">
      <SlotButton x={x} onOpen={onOpen} className="flex-1" />
      {confirm
        ? <button onClick={() => { onDelete(x.id); setConfirm(false); sfx('bad') }} className="whitespace-nowrap rounded-xl bg-[#c0505f] px-3 py-2 font-display text-sm text-white active:scale-95">ลบจริง?</button>
        : <button onClick={() => setConfirm(true)} aria-label="ลบเซฟตระกูลนี้" className="rounded-xl border-2 border-[#e6d6dc] bg-white px-3 py-2 text-sm active:scale-95">🗑️</button>}
    </div>
  )
}

/* ───────────────────────── รุ่นต่อรุ่น ───────────────────────── */
function Legacy({ prev, onStart, onBack }: { prev: GameState; onStart: (g: GameState) => void; onBack: () => void }) {
  const [ending] = useState(() => pickEnding(prev))
  const age = endAgeOf(prev, ending)
  const [heir] = useState<Heirloom>(() => heirloomOf(prev, ending))
  const inh = inheritanceOf(prev)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>(Math.random() < 0.5 ? 'girl' : 'boy')
  const [unl] = useState(() => unlockedIds())
  const [dreams] = useState(() => pickFew(DREAMS.filter((d) => !d.special || unl.includes(d.id)), 3))
  const [dream, setDream] = useState<string | null>(null)
  const gen = (prev.gen ?? 1) + 1
  const lineage = [...(prev.lineage ?? []), ancestorOf(prev, ending, age, heir)]
  const famBonus = prev.stats.family >= 8 ? 2 : prev.stats.family <= 2 ? -2 : 0
  const [gifts] = useState(() => giftsOf(prev))
  useEffect(() => { playMusic('kid') }, [])
  const ok = name.trim().length > 0 && !!dream
  const go = () => {
    sfx('unlock')
    const g = newGame(name.trim(), gender, prev.hair, undefined, dream!)
    for (const [k, v] of Object.entries(heir.stats ?? {})) g.stats[k as StatKey] = Math.max(0, g.stats[k as StatKey] + (v ?? 0))
    g.stats.family = Math.max(0, g.stats.family + famBonus)
    for (const gf of gifts) for (const [k, v] of Object.entries(gf.stats ?? {})) g.stats[k as StatKey] = Math.max(0, g.stats[k as StatKey] + (v ?? 0))
    const words = lineage[lineage.length - 1].words
    unlockAch(...(gen >= 3 ? ['gen2', 'gen3'] : ['gen2']))
    onStart({
      ...g, gen, lineage, lineageId: prev.lineageId ?? String(prev.seed), heirloom: `${heir.icon} ${heir.name}`,
      flags: [...new Set([...g.flags, ...(heir.flags ?? []), ...gifts.flatMap((x) => x.flags ?? [])])],
      persona: inheritedPersona(prev),
      cash: g.cash + Math.round(inh.cash * 0.3), invest: Math.round(inh.cash * 0.7) + (heir.invest ?? 0), debt: inh.debt,
      history: [
        { age: 0, text: `🧬 เกิดเป็นรุ่นที่ ${gen} — ลูกของ${prev.name}` },
        { age: 0, text: `🎁 ได้รับ ${heir.icon} ${heir.name}${inh.cash ? ` และกองทุน ${fmtBaht(inh.cash)}` : ''}${inh.debt ? ` แต่มีหนี้ตกทอด ${fmtBaht(inh.debt)}` : ''}` },
        ...(words ? [{ age: 0, text: `📜 ${prev.gender === 'girl' ? 'แม่' : 'พ่อ'}${words}` }] : []),
        ...gifts.map((x) => ({ age: 0, text: `${x.icon} ติดตัวมาจาก${prev.gender === 'girl' ? 'แม่' : 'พ่อ'}: ${x.name}` })),
      ],
    })
  }
  return (
    <div className="fadein absolute inset-0 overflow-y-auto">
      <div className="fixed inset-0"><Background id="home" /></div>
      <div className="fixed inset-0 bg-[#1d2b22]/45" />
      <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
        <div className="popin rounded-3xl bg-white/95 p-6 shadow-2xl">
          <div className="text-center">
            <div className="text-5xl">🧬</div>
            <h2 className="font-display text-2xl text-[#3a2433]">รุ่นที่ {gen} ของตระกูล</h2>
            <p className="text-sm text-[#8a6a76]">ลูกของ {prev.name} ({ending.emoji} {ending.title} · {age} ปี)</p>
          </div>
          <FamilyTree lineage={lineage.slice(0, -1)} me={{ name: prev.name, emoji: ending.emoji, age }} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-[#fff8e1] p-3"><div className="text-xs text-[#8a6a76]">ของตกทอด</div><div className="text-2xl">{heir.icon}</div><div className="font-display text-[#3a2433]">{heir.name}</div><div className="text-xs text-[#8a6a76]">{heir.desc}</div></div>
            <div className={`rounded-2xl p-3 ${inh.debt ? 'bg-[#fdecef]' : 'bg-[#eaf7ef]'}`}><div className="text-xs text-[#8a6a76]">{inh.debt ? 'หนี้ตกทอด 😰' : 'กองทุนมรดก'}</div><div className={`font-display text-xl ${inh.debt ? 'text-[#c0505f]' : 'text-[#2f8f5a]'}`}>{fmtBaht(inh.debt || inh.cash)}</div><div className="text-xs text-[#8a6a76]">{famBonus > 0 ? '❤️ บ้านอบอุ่น ครอบครัว +2' : famBonus < 0 ? '💔 บ้านร้าว ครอบครัว −2' : 'บ้านธรรมดา'}</div></div>
          </div>
          <div className="mt-3 rounded-2xl bg-[#f3eefb] p-3">
            <div className="font-display text-[#3a2433]">🧳 สิ่งที่ลูกได้จากชีวิตคุณ</div>
            {gifts.length === 0 ? <div className="mt-1 text-xs text-[#8a6a76]">ไม่มีอะไรติดตัวเป็นพิเศษ... ลูกจะเริ่มต้นเขียนเรื่องของตัวเองจากศูนย์</div> : (
              <div className="mt-2 flex flex-col gap-1.5">
                {(['habit', 'skill', 'contact'] as const).map((k) => {
                  const xs = gifts.filter((x) => x.kind === k)
                  if (!xs.length) return null
                  return (
                    <div key={k}>
                      <div className="text-[.75rem] font-semibold text-[#9a7aa6]">{k === 'habit' ? 'นิสัยที่ติดมา' : k === 'skill' ? 'สิ่งที่คุณสอนไว้' : 'คนที่จะคอยช่วย'}</div>
                      {xs.map((x) => (
                        <div key={x.name} className="flex items-start gap-2 rounded-xl bg-white/80 px-2 py-1.5 text-sm"><span className="text-xl">{x.icon}</span><span><span className="font-display text-[#3a2433]">{x.name}</span><span className="block text-xs text-[#8a6a76]">{x.desc}</span></span></div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <label className="mt-4 block text-sm font-semibold text-[#7a5a66]">ชื่อลูก</label>
          <input autoFocus value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder={`ลูกของ${prev.name}`}
            className="mt-1 w-full rounded-xl border-2 border-[#d4ecdc] px-4 py-3 text-lg outline-none focus:border-[#3fae78]" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['girl', 'boy'] as const).map((g) => (
              <button key={g} onClick={() => setGender(g)} className={`rounded-xl border-2 py-2 font-display ${gender === g ? 'border-[#3fae78] bg-[#eaf7ef] text-[#2f6a4a]' : 'border-[#eee] text-[#7a5a66]'}`}>{g === 'girl' ? '👧 ลูกสาว' : '👦 ลูกชาย'}</button>
            ))}
          </div>
          <h3 className="mt-4 font-display text-lg text-[#3a2433]">⭐ ความฝันของลูก</h3>
          <div className="mt-2 flex flex-col gap-2">
            {dreams.map((d) => (
              <button key={d.id} onClick={() => { setDream(d.id); sfx('tap') }} className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${dream === d.id ? 'border-[#3fae78] bg-[#eaf7ef]' : 'border-[#eee] bg-white'}`}>
                <span className="text-3xl">{d.icon}</span>
                <span><span className="block font-display text-[#3a2433]">{d.name}</span><span className="text-xs text-[#8a6a76]">{d.desc}</span></span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Btn className="flex-1" onClick={onBack}>กลับ</Btn>
            <button disabled={!ok} onClick={go} className="flex-[2] rounded-2xl bg-[#3fae78] px-5 py-3 font-display text-lg text-white shadow-lg enabled:active:scale-95 disabled:opacity-40">เกิด! 👶</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── โหมดสองชาติ ───────────────────────── */
function pastOf(s: GameState): PastLife {
  const e = pickEnding(s)
  const d = dreamOf(s)
  const k = karmaOf(s)
  return {
    name: s.name, gender: s.gender, endingId: e.id, endingTitle: e.title, emoji: e.emoji, kind: e.kind,
    career: s.career, age: endAgeOf(s, e), net: netWorth(s),
    dream: s.dream, dreamOk: !!d && d.check(s, e), karma: k.score, picks: s.picks ?? [], history: s.history, flags: s.flags,
  }
}

function Reborn({ prev, onStart }: { prev: GameState; onStart: (g: GameState) => void }) {
  const [past] = useState(() => pastOf(prev))
  const [k] = useState(() => karmaOf(prev))
  const [trait] = useState(() => { const id = rebornTrait(k.score); return TRAITS.find((t) => t.id === id) ?? TRAITS[0] })
  const [dreams] = useState(() => pickFew(DREAMS.filter((d) => d.id !== prev.dream && (!d.special || hasUnlock(d.id))), 3))
  const [dream, setDream] = useState<string | null>(null)
  const [stage, setStage] = useState(0)
  useEffect(() => { playMusic('dark'); const t = setTimeout(() => setStage(1), 2200); return () => clearTimeout(t) }, [])
  const gender: Gender = prev.gender === 'girl' ? 'boy' : 'girl'
  const go = () => {
    sfx('unlock')
    const g = newGame(prev.name, gender, prev.hair, trait.id, dream!)
    onStart({ ...g, mode: 'reborn', life: 2, past, history: [{ age: 0, text: `♾️ เกิดใหม่จากชาติที่แล้ว (${past.emoji} ${past.endingTitle})` }, ...g.history] })
  }
  return (
    <div className="fadein absolute inset-0 overflow-y-auto bg-[#140f20]">
      <Fx kind="stars" />
      {stage === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-white">
          <div className="text-7xl">🕯️</div>
          <div className="popin mt-4 font-display text-3xl">{prev.name} หลับตาลง...</div>
          <div className="mt-2 text-white/70">วิญญาณกำลังเดินทางไปเกิดใหม่</div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto max-w-lg px-4 py-8">
          <div className="popin rounded-3xl bg-white/95 p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl">♾️</div>
              <h2 className="font-display text-2xl text-[#3a2433]">ชาติที่ 2</h2>
              <p className="text-sm text-[#8a6a76]">ชาติก่อน: {past.emoji} {past.endingTitle} · {past.age} ปี</p>
            </div>
            <div className="mt-4 rounded-2xl bg-[#f6f2fa] p-4">
              <div className="flex items-center justify-between font-display text-[#3a2433]"><span>⚖️ กรรมจากชาติก่อน</span><span className={k.score >= 0 ? 'text-[#2f8f5a]' : 'text-[#c0505f]'}>{k.score > 0 ? '+' : ''}{k.score}</span></div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {k.good.map((g) => <span key={g} className="rounded-full bg-[#d6f5e3] px-2 py-0.5 text-[#2f6a4a]">✓ {g}</span>)}
                {k.bad.map((g) => <span key={g} className="rounded-full bg-[#fde0e5] px-2 py-0.5 text-[#a0303f]">✗ {g}</span>)}
                {!k.good.length && !k.bad.length && <span className="text-[#8a6a76]">ชีวิตธรรมดา ไม่ดีไม่ร้าย</span>}
              </div>
            </div>
            <div className="popin mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#ffd166] bg-[#fff8e1] p-3" style={{ animationDelay: '.3s' }}>
              <span className="text-4xl">{trait.icon}</span>
              <div><div className="text-xs text-[#8a6a76]">กรรมนำพาให้เกิดมาพร้อมไพ่</div><div className="font-display text-[#3a2433]">{trait.name}</div><div className="text-xs text-[#8a6a76]">{trait.desc}</div></div>
            </div>
            <div className="mt-3 rounded-2xl bg-[#2b2238] p-3 text-sm text-[#f3e6ff]">
              🔒 ห้ามเลือกทางเดิม <b className="text-[#ffd166]">{past.picks.length}</b> ทาง · ต้องจบไม่ซ้ำ "{past.endingTitle}" · เกิดเป็น{gender === 'girl' ? 'ผู้หญิง' : 'ผู้ชาย'}
            </div>
            <h3 className="mt-5 font-display text-lg text-[#3a2433]">⭐ ความฝันใหม่ (ห้ามซ้ำชาติก่อน)</h3>
            <div className="mt-2 flex flex-col gap-2">
              {dreams.map((d) => (
                <button key={d.id} onClick={() => { setDream(d.id); sfx('tap') }}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${dream === d.id ? 'border-[#e0707f] bg-[#fde8ed]' : 'border-[#f0e4e8] bg-white'}`}>
                  <span className="text-3xl">{d.icon}</span>
                  <span><span className="block font-display text-[#3a2433]">{d.name}</span><span className="text-xs text-[#8a6a76]">{d.desc}</span></span>
                </button>
              ))}
            </div>
            <button disabled={!dream} onClick={go} className="mt-5 w-full rounded-2xl bg-[#e0707f] px-5 py-3 font-display text-lg text-white shadow-lg enabled:active:scale-95 disabled:opacity-40">เกิดใหม่! 👶</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TwoLives({ s, ending, dreamOk, age }: { s: GameState; ending: Ending; dreamOk: boolean; age: number }) {
  const p = s.past!
  const different = p.endingId !== ending.id
  const score = (different ? 1 : 0) + (dreamOk ? 1 : 0) + (p.dreamOk ? 1 : 0)
  const rank = !different ? { t: 'วนเวียนซ้ำเดิม', e: '🔁', c: 'text-[#c0505f]' } : score === 3 ? { t: 'บรรลุ', e: '🪷', c: 'text-[#b08a00]' } : score === 2 ? { t: 'ผ่านการเวียนว่าย', e: '✨', c: 'text-[#2f8f5a]' } : { t: 'รอดมาได้', e: '🌱', c: 'text-[#3a5fb0]' }
  const row = (n: string, a: React.ReactNode, b: React.ReactNode) => (
    <div className="grid grid-cols-[90px_1fr_1fr] gap-2 border-t border-[#efe6ea] py-1.5 text-sm"><span className="text-[#8a6a76]">{n}</span><span>{a}</span><span>{b}</span></div>
  )
  return (
    <div className="popin mt-4 rounded-2xl border-2 border-[#2b2238] bg-[#faf7fc] p-4" style={{ animationDelay: '.5s' }}>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-[#3a2433]">♾️ สรุปสองชาติ</span>
        <span className={`font-display text-xl ${rank.c}`}>{rank.e} {rank.t}</span>
      </div>
      <div className="mt-2 grid grid-cols-[90px_1fr_1fr] gap-2 text-[.8125rem] font-semibold text-[#8a6a76]"><span /><span>ชาติที่ 1</span><span>ชาติที่ 2</span></div>
      {row('ฉากจบ', `${p.emoji} ${p.endingTitle}`, `${ending.emoji} ${ending.title}`)}
      {row('อายุ', `${p.age} ปี`, `${age} ปี`)}
      {row('อาชีพ', p.career ? CAREERS[p.career] : '-', s.career ? CAREERS[s.career] : '-')}
      {row('ทรัพย์สิน', fmtBaht(p.net), fmtBaht(netWorth(s)))}
      {row('ความฝัน', `${DREAMS.find((d) => d.id === p.dream)?.icon ?? ''} ${p.dreamOk ? '✅' : '❌'}`, `${dreamOf(s)?.icon ?? ''} ${dreamOk ? '✅' : '❌'}`)}
      {!different && <div className="mt-2 text-sm text-[#c0505f]">จบแบบเดิมซ้ำ... วิญญาณยังติดอยู่ในวังวนเดิม ลองใหม่อีกครั้ง</div>}
    </div>
  )
}
