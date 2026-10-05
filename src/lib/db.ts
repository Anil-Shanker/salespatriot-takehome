import Database from 'better-sqlite3'
import path from 'path'
import { Solicitation, SolicitationFilters } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'data', 'dibbs.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db !== null) {
    return _db
  }
  _db = new Database(DB_PATH)
  initDb(_db)
  return _db
}

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS solicitations (
      sol_number    TEXT PRIMARY KEY,
      nsn           TEXT NOT NULL,
      fsc           TEXT NOT NULL,
      description   TEXT NOT NULL,
      posted_date   TEXT NOT NULL,
      response_date TEXT NOT NULL,
      quantity      INTEGER NOT NULL,
      unit          TEXT NOT NULL,
      set_aside     TEXT NOT NULL,
      url           TEXT NOT NULL,
      scraped_at    TEXT NOT NULL
    )
  `)
}

export function upsertSolicitations(db: Database.Database, rows: Solicitation[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO solicitations
      (sol_number, nsn, fsc, description, posted_date, response_date, quantity, unit, set_aside, url, scraped_at)
    VALUES
      (@sol_number, @nsn, @fsc, @description, @posted_date, @response_date, @quantity, @unit, @set_aside, @url, @scraped_at)
  `)
  const now = new Date().toISOString()
  const insertMany = db.transaction((items: Solicitation[]) => {
    for (const row of items) {
      stmt.run({ ...row, scraped_at: now })
    }
  })
  insertMany(rows)
}

export function getDistinctFscs(db: Database.Database): string[] {
  const rows = db.prepare('SELECT DISTINCT fsc FROM solicitations ORDER BY fsc ASC').all() as Array<{ fsc: string }>
  return rows.map((r) => r.fsc)
}

export function querySolicitations(
  db: Database.Database,
  filters: SolicitationFilters
): Solicitation[] {
  const conditions: string[] = []
  const params: Record<string, string | number> = {}

  if (filters.fsc !== undefined && filters.fsc !== '') {
    conditions.push('fsc = @fsc')
    params.fsc = filters.fsc
  }

  if (filters.set_aside !== undefined && filters.set_aside !== '') {
    conditions.push('set_aside = @set_aside')
    params.set_aside = filters.set_aside
  }

  if (filters.q !== undefined && filters.q !== '') {
    conditions.push('(sol_number LIKE @q OR nsn LIKE @q OR description LIKE @q)')
    params.q = `%${filters.q}%`
  }

  if (filters.closing_within !== undefined) {
    const days = parseInt(filters.closing_within, 10)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)
    conditions.push("response_date <= @closing_cutoff AND response_date >= date('now')")
    params.closing_cutoff = cutoff.toISOString().slice(0, 10)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const orderCol = (() => {
    switch (filters.sort) {
      case 'posted':
        return 'posted_date'
      case 'sol':
        return 'sol_number'
      case 'closing':
        return 'response_date'
      default:
        return 'response_date'
    }
  })()
  const orderDir = filters.order === 'desc' ? 'DESC' : 'ASC'

  const rows = db
    .prepare(`SELECT * FROM solicitations ${where} ORDER BY ${orderCol} ${orderDir}`)
    .all(params) as Array<Solicitation & { scraped_at: string }>

  return rows.map(({ scraped_at: _scraped_at, ...sol }) => sol)
}
