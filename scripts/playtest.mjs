// เล่นอัตโนมัติจนจบ + ถ่ายภาพหน้าจอ: node scripts/playtest.mjs <outdir> [mobile] [pickIndex]
import { chromium } from 'playwright'
const out = process.argv[2] || '.'
const mobile = process.argv[3] === 'mobile'
const pickMode = process.argv[4] ?? 'random'
const browser = await chromium.launch({ executablePath: process.env.PW_EXE || undefined })
const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && !m.text().includes('TUNNEL') && errors.push(m.text()))
let voiceHit = 0
await page.addInitScript(() => { window.__plays = 0; const p = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__plays++; return p.call(this).catch(() => {}) } })
// นับไอคอนกะพริบ: <img.emo> ที่ถูกสร้างใหม่ แล้วถึงเฟรมถัดไป (ก่อนวาดจอ) รูปยังโหลดไม่เสร็จ (= เห็นช่องว่างแวบหนึ่ง)
await page.addInitScript(() => {
  window.__emo = { added: 0, blank: 0, blankAfter3s: 0, srcs: {} }
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) { if (!(n instanceof Element)) continue; const imgs = n.matches?.('img.emo') ? [n] : [...n.querySelectorAll?.('img.emo') ?? []]; for (const i of imgs) { window.__emo.added++; requestAnimationFrame(() => { if (i.complete || !i.isConnected) return; window.__emo.blank++; if (performance.now() > 3000) { window.__emo.blankAfter3s++; const k = i.getAttribute('src'); window.__emo.srcs[k] = (window.__emo.srcs[k] ?? 0) + 1 } }) } } })
    .observe(document, { childList: true, subtree: true })
})
await page.goto('http://localhost:4173/')
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/01-title.png` })
await page.getByText('เริ่มชีวิตใหม่').click()
await page.fill('input', 'มิ้นท์')
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/02-setup.png` })
if (process.env.BOY) await page.getByText('ชาย').click()
await page.getByText('ต่อไป').click()
await page.waitForTimeout(400)
await page.locator('button[disabled]').count()
await page.locator('.grid button').first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/03-fate.png` })
await page.getByText('ต่อไป').click()
await page.waitForTimeout(400)
await page.locator('.flex-col > button').first().click()
await page.screenshot({ path: `${out}/04-dream.png` })
await page.getByText('เกิด!').click()
let shots = 0, steps = 0, picks = 0
while (steps++ < 1800) {
  await page.waitForTimeout(60)
  if (await page.getByText('สรุปสองชาติ').count()) break
  if (await page.getByText('ไปเกิดชาติที่ 2').count()) {
    if (!process.env.HARD) break
    await page.screenshot({ path: `${out}/50-life1-end.png`, fullPage: true })
    await page.getByText('ไปเกิดชาติที่ 2').click()
    await page.waitForTimeout(2800)
    await page.locator('.flex-col > button').first().click()
    await page.screenshot({ path: `${out}/51-reborn.png`, fullPage: true })
    await page.getByText('เกิดใหม่! 👶').click()
    continue
  }
  const choiceBtns = page.locator('button.popin:not([disabled])')
  if (await choiceBtns.count()) {
    if (shots < 4 && picks % 4 === 1) await page.screenshot({ path: `${out}/c${++shots}-choice.png` })
    const n = await choiceBtns.count()
    const i = pickMode === 'random' ? Math.floor(Math.random() * n) : Math.min(+pickMode, n - 1)
    const okc = await choiceBtns.nth(i).click({ timeout: 4000 }).then(() => true).catch(() => false)
    if (!okc) continue
    picks++
    continue
  }
  if (steps % 23 === 5) { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/s${steps}.png` }) }
  await page.mouse.click(mobile ? 200 : 640, mobile ? 300 : 300)
}
await page.waitForTimeout(800)
await page.evaluate(() => { document.querySelectorAll('.overflow-y-auto').forEach((el) => { el.style.position = 'relative'; el.style.overflow = 'visible'; el.style.height = 'auto' }); document.querySelectorAll('#root, body, html').forEach((el) => { el.style.height = 'auto'; el.style.overflow = 'visible' }) })
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/99-ending.png`, fullPage: true })
const why = page.getByText('ทำไมได้ฉากจบนี้?'); if (await why.count()) { await why.click(); await page.waitForTimeout(400); await why.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${out}/97-why.png` }) }
const pc = page.getByText('บุคลิกชีวิตของคุณ'); if (await pc.count()) { await pc.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/98-persona.png` }) }
voiceHit = await page.evaluate(() => window.__plays).catch(() => -1)
console.log('mp3 voice plays', voiceHit)
console.log('steps', steps, 'picks', picks, 'errors', JSON.stringify(errors))
console.log('emoji icons mounted', JSON.stringify(await page.evaluate(() => window.__emo)))
console.log(await page.locator('h2').first().textContent())
await browser.close()
