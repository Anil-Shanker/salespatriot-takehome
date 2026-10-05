import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const DIBBS_WARNING_URL = 'https://www.dibbs.bsm.dla.mil/dodwarning.aspx'
const DIBBS_WARNING_URL2 = 'https://dibbs2.bsm.dla.mil/dodwarning.aspx'
const DIBBS_RFQ = 'https://www.dibbs.bsm.dla.mil/RFQ/'

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
  })
  const page = await context.newPage()

  // Accept consent on main domain
  await page.goto(DIBBS_WARNING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  let okBtn = page.locator('input[name="butAgree"]').first()
  if (await okBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await okBtn.click()
    await page.waitForLoadState('domcontentloaded')
    console.log('[debug] accepted consent on www.dibbs.bsm.dla.mil')
  }

  // Accept consent on dibbs2 subdomain
  await page.goto(DIBBS_WARNING_URL2, { waitUntil: 'domcontentloaded', timeout: 30000 })
  okBtn = page.locator('input[name="butAgree"]').first()
  if (await okBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await okBtn.click()
    await page.waitForLoadState('domcontentloaded')
    console.log('[debug] accepted consent on dibbs2.bsm.dla.mil')
  }

  // Get the most recent index file URL from the dates page
  await page.goto(`${DIBBS_RFQ}RfqDates.aspx?category=recent`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const indexUrl = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'))
    return links.find((a) => a.href.includes('in2') && a.href.endsWith('.txt'))?.href ?? null
  })
  console.log('[debug] most recent index file URL:', indexUrl)

  if (indexUrl === null) {
    console.log('[debug] no index file link found')
    await browser.close()
    return
  }

  // Navigate directly to the file URL — Playwright will trigger the download event
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
  await page.goto(indexUrl, { waitUntil: 'commit' }).catch(() => null)
  const download = await downloadPromise
  console.log('[debug] download started:', download.suggestedFilename())

  const savePath = '/tmp/dibbs-index.txt'
  await download.saveAs(savePath)
  console.log('[debug] saved to', savePath)

  const content = fs.readFileSync(savePath, 'utf-8')
  const lines = content.split('\n').slice(0, 30)
  console.log('[debug] first 30 lines:\n', lines.join('\n'))

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
