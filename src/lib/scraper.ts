import { chromium } from 'playwright'
import * as fs from 'fs'
import { Solicitation, SetAside } from '@/lib/types'

const DIBBS_WARNING_URL = 'https://www.dibbs.bsm.dla.mil/dodwarning.aspx'
const DIBBS_WARNING_URL2 = 'https://dibbs2.bsm.dla.mil/dodwarning.aspx'
const DIBBS_RFQ_DATES_URL = 'https://www.dibbs.bsm.dla.mil/RFQ/RfqDates.aspx?category=recent'

function parsePostedDate(filename: string): string {
  // Filename like "IN261004.TXT" → YYMMDD → "2026-10-04"
  const m = filename.match(/IN(\d{2})(\d{2})(\d{2})/i)
  if (m === null) return new Date().toISOString().slice(0, 10)
  return `20${m[1]}-${m[2]}-${m[3]}`
}

function parseResponseDate(raw: string): string {
  // MM/DD/YY → YYYY-MM-DD
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (m === null) return raw
  return `20${m[3]}-${m[1]}-${m[2]}`
}

function parseSetAside(codes: string): SetAside {
  // Position 7 in the trailing codes field: 'Y' = small business set-aside (~7% of lines)
  if (codes.length > 7 && codes[7] === 'Y') return 'SB'
  return 'UNRESTRICTED'
}

function parseIndexLine(line: string, postedDate: string): Solicitation | null {
  if (line.length < 100) return null

  const solNumber = line.slice(0, 13).trim()
  const nsn = line.slice(13, 26).trim()
  if (solNumber === '' || nsn === '') return null

  const responseDate = parseResponseDate(line.slice(72, 80).trim())

  // PDF filename: from position 80 to the next space
  const spaceAfterPdf = line.indexOf(' ', 80)
  if (spaceAfterPdf === -1) return null

  const rest = line.slice(spaceAfterPdf + 1)
  if (rest.length < 30) return null

  const quantityStr = rest.slice(0, 7)
  const quantity = parseInt(quantityStr, 10)
  if (isNaN(quantity)) return null

  const unit = rest.slice(7, 9).trim()
  const description = rest.slice(9, 30).trim()
  const codes = rest.slice(30).trim()

  const fsc = nsn.slice(0, 4)
  const url = `https://www.dibbs.bsm.dla.mil/rfq/rfqdetail.aspx?sn=${solNumber}`

  return {
    sol_number: solNumber,
    nsn,
    fsc,
    description,
    posted_date: postedDate,
    response_date: responseDate,
    quantity,
    unit,
    set_aside: parseSetAside(codes),
    url,
  }
}

export async function scrapeDibbsRfqs(): Promise<Solicitation[]> {
  console.log('[scraper] launching browser')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
  })
  const page = await context.newPage()

  try {
    // Accept DoD consent on main domain
    await page.goto(DIBBS_WARNING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const btn1 = page.locator('input[name="butAgree"]').first()
    if (await btn1.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn1.click()
      await page.waitForLoadState('domcontentloaded')
      console.log('[scraper] accepted consent on www.dibbs.bsm.dla.mil')
    }

    // Accept DoD consent on dibbs2 subdomain (separate cookie)
    await page.goto(DIBBS_WARNING_URL2, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const btn2 = page.locator('input[name="butAgree"]').first()
    if (await btn2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn2.click()
      await page.waitForLoadState('domcontentloaded')
      console.log('[scraper] accepted consent on dibbs2.bsm.dla.mil')
    }

    // Find most recent index file link
    await page.goto(DIBBS_RFQ_DATES_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const indexUrl = await page.evaluate((): string | null => {
      const links = Array.from(document.querySelectorAll('a[href]'))
      const link = links.find((a) => {
        const href = (a as HTMLAnchorElement).href
        return href.includes('dibbs2') && /\.txt$/i.test(href)
      })
      return link !== undefined ? (link as HTMLAnchorElement).href : null
    })

    if (indexUrl === null) {
      console.log('[scraper] no index file link found on RfqDates page')
      return []
    }
    console.log('[scraper] found index URL:', indexUrl)

    // Download the index file via browser (WAF blocks plain Node https requests)
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await page.goto(indexUrl, { waitUntil: 'commit' }).catch(() => null)
    const download = await downloadPromise
    const tmpPath = await download.path()
    if (tmpPath === null) {
      console.log('[scraper] download path is null — download may have failed')
      return []
    }
    console.log('[scraper] download complete:', download.suggestedFilename())

    const content = fs.readFileSync(tmpPath, 'utf-8')
    const lines = content.replace(/\r/g, '').split('\n')
    console.log(`[scraper] read ${lines.length} lines from index file`)

    const postedDate = parsePostedDate(download.suggestedFilename())

    const results: Solicitation[] = []
    let skipped = 0
    for (const line of lines) {
      const sol = parseIndexLine(line, postedDate)
      if (sol === null) {
        skipped++
      } else {
        results.push(sol)
      }
    }

    console.log(
      `[scraper] parsed ${results.length} solicitations from ${lines.length} lines (${skipped} skipped)`,
    )
    return results
  } finally {
    await browser.close()
    console.log('[scraper] browser closed')
  }
}
