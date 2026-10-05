import { chromium } from 'playwright'
import { Solicitation, SetAside } from '@/lib/types'

// "Recent RFQs" — shows solicitations posted in the last 1-2 days, sorted by sol# asc
const DIBBS_RECENT_URL = 'https://www.dibbs.bsm.dla.mil/rfq/rfqsrch.aspx?t=RFQPostedDate'

const MAX_PAGES = 10

function parseSetAside(raw: string): SetAside {
  const s = raw.trim().toUpperCase()
  if (s === 'SB') return 'SB'
  if (s === 'WOSB' || s === 'W') return 'WOSB'
  if (s === '8A' || s === '8(A)') return '8A'
  if (s === 'HUB' || s === 'HUBZONE' || s === 'H') return 'HUBZONE'
  // U, F (Full & Open), blank → unrestricted
  return 'UNRESTRICTED'
}

function parseQtyCell(raw: string): { quantity: number; unit: string } {
  // Cell contains "7017965442\nQTY: 260000" — we want the QTY line
  const match = raw.match(/QTY:\s*([\d,]+)/i)
  if (match === null) return { quantity: 0, unit: 'EA' }
  return { quantity: parseInt(match[1].replace(/,/g, ''), 10), unit: 'EA' }
}

function parseDate(raw: string): string {
  // DIBBS dates: MM-DD-YYYY → YYYY-MM-DD
  const match = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match === null) return raw.trim()
  return `${match[3]}-${match[1]}-${match[2]}`
}

export async function scrapeDibbsRfqs(): Promise<Solicitation[]> {
  console.log('[scraper] launching browser')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  const results: Solicitation[] = []

  try {
    console.log(`[scraper] navigating to ${DIBBS_RECENT_URL}`)
    await page.goto(DIBBS_RECENT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // DIBBS redirects first-time visitors to dodwarning.aspx with an OK button (name="butAgree")
    const agreeBtn = page.locator('input[name="butAgree"], input[value="I Agree"], button:has-text("I Agree")').first()
    if (await agreeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[scraper] DoD warning page found — clicking OK/I Agree')
      await agreeBtn.click()
      await page.waitForLoadState('domcontentloaded')
      // DIBBS mangles the redirect URL when the goto param contains a query string,
      // so navigate manually after accepting
      const currentUrl = page.url()
      if (currentUrl.includes('PageNotFound') || !currentUrl.includes('rfqsrch.aspx?')) {
        console.log('[scraper] redirect landed on wrong page:', currentUrl, '— navigating to RFQ page directly')
        await page.goto(DIBBS_RECENT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      }
      console.log('[scraper] now at:', page.url())
    } else {
      console.log('[scraper] no consent page (already accepted or not redirected)')
    }

    for (let pageNum = 0; pageNum < MAX_PAGES; pageNum++) {
      console.log(`[scraper] page ${pageNum + 1} — waiting for table`)
      // Wait for the results table (has column headers we know)
      await page.waitForSelector('table', { timeout: 15000 })

      const rows = await page.evaluate(() => {
        // Find the data table — it has th cells with "NSN/Part Number"
        const tables = Array.from(document.querySelectorAll('table'))
        const dataTable = tables.find((t) =>
          t.innerText.includes('NSN/Part Number') || t.innerText.includes('Nomenclature')
        )
        if (dataTable === null || dataTable === undefined) return []

        return Array.from(dataTable.querySelectorAll('tr')).slice(1).map((tr) => {
          const cells = Array.from(tr.querySelectorAll('td'))
          if (cells.length < 9) return null

          // Col 1: NSN (link text)
          const nsn = cells[1]?.innerText.trim().split('\n')[0] ?? ''

          // Col 2: Nomenclature
          const description = cells[2]?.innerText.trim() ?? ''

          // Col 4: Solicitation cell — first <a> text is sol#, href is URL
          //         set-aside badge is a colored element at the bottom of the cell
          const solCell = cells[4]
          const solLink = solCell?.querySelector('a')
          const solNumber = solLink?.innerText.trim() ?? ''
          const solHref = solLink?.getAttribute('href') ?? ''

          // Set-aside: last non-empty text node or small colored element in the cell
          // It appears after "» Package View" — grab all text, split lines, find the badge
          const solCellText = solCell?.innerText ?? ''
          const solLines = solCellText.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '')
          // The set-aside is the last short token (SB, U, F, WOSB, etc.)
          const setAsideRaw = solLines[solLines.length - 1] ?? ''

          // Col 6: Purchase Request — "PR#\nQTY: X"
          const prCell = cells[6]?.innerText ?? ''

          // Col 7: Issued (posted date)
          const issuedRaw = cells[7]?.innerText.trim() ?? ''

          // Col 8: Return By (response date)
          const returnByRaw = cells[8]?.innerText.trim() ?? ''

          return { nsn, description, solNumber, solHref, setAsideRaw, prCell, issuedRaw, returnByRaw }
        }).filter((r): r is NonNullable<typeof r> => r !== null)
      })

      console.log(`[scraper] page ${pageNum + 1} — found ${rows.length} raw rows`)

      let pageCount = 0
      for (const row of rows) {
        if (row.solNumber === '' || row.nsn === '') {
          console.log(`[scraper]   skipping row with empty sol/nsn: sol="${row.solNumber}" nsn="${row.nsn}"`)
          continue
        }

        const nsn = row.nsn.replace(/\s+/g, '')
        const fsc = nsn.replace(/-/g, '').slice(0, 4)
        const { quantity, unit } = parseQtyCell(row.prCell)
        const url = row.solHref.startsWith('http')
          ? row.solHref
          : `https://www.dibbs.bsm.dla.mil/rfq/${row.solHref.replace(/^\/rfq\//, '')}`

        results.push({
          sol_number: row.solNumber,
          nsn,
          fsc,
          description: row.description,
          posted_date: parseDate(row.issuedRaw),
          response_date: parseDate(row.returnByRaw),
          quantity,
          unit,
          set_aside: parseSetAside(row.setAsideRaw),
          url: url || `https://www.dibbs.bsm.dla.mil/rfq/rfqdetail.aspx?sn=${row.solNumber}`,
        })
        pageCount++
      }

      console.log(`[scraper] page ${pageNum + 1} — parsed ${pageCount} valid solicitations (running total: ${results.length})`)

      if (rows.length > 0) {
        const sample = rows[0]
        console.log(`[scraper]   sample row: sol="${sample.solNumber}" nsn="${sample.nsn}" setAside="${sample.setAsideRaw}" issued="${sample.issuedRaw}" returnBy="${sample.returnByRaw}"`)
      }

      // Paginate: look for the next page link in the pagination row at the top
      const nextPage = pageNum + 2
      const nextLink = page.locator(`a:text-is("${nextPage}")`).first()
      const hasNext = await nextLink.isVisible({ timeout: 2000 }).catch(() => false)
      if (!hasNext) {
        console.log(`[scraper] no link for page ${nextPage} — stopping pagination`)
        break
      }
      console.log(`[scraper] clicking page ${nextPage}`)
      await nextLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
  } finally {
    await browser.close()
    console.log(`[scraper] browser closed — total solicitations: ${results.length}`)
  }

  return results
}
