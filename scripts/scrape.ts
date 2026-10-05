import { scrapeDibbsRfqs } from '../src/lib/scraper'
import { getDb, upsertSolicitations } from '../src/lib/db'

async function main(): Promise<void> {
  console.log('[script] starting scrape')
  const start = Date.now()

  const solicitations = await scrapeDibbsRfqs()
  console.log(`[script] scrape finished in ${((Date.now() - start) / 1000).toFixed(1)}s — got ${solicitations.length} solicitations`)

  if (solicitations.length === 0) {
    console.log('[script] nothing to upsert — exiting')
    process.exit(0)
  }

  console.log('[script] upserting to DB')
  const db = getDb()
  upsertSolicitations(db, solicitations)

  const count = db.prepare('SELECT COUNT(*) as n FROM solicitations').get() as { n: number }
  console.log(`[script] done — DB now has ${count.n} total solicitations`)
}

main().catch((err) => {
  console.error('[script] fatal error:', err)
  process.exit(1)
})
