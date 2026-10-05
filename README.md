# DIBBS Solicitation Browser

A full-stack web app for browsing daily RFQs from the Defense Internet Bid Board System (DIBBS). Vendors can search, filter, and drill into solicitations without navigating DIBBS's clunky interface.

## Setup

**Prerequisites:** Node.js 20+, npm

```bash
npm install
npm run setup        # installs Playwright's Chromium browser (needed for scraping)
npm run dev          # starts the dev server at http://localhost:3000
```

## Credentials

| Username | Password | Role |
|----------|----------|------|
| `vendor` | `password123` | Browse only |
| `admin` | `admin123` | Browse + scrape |

## Loading data

Log in as `admin` and click **Scrape DIBBS** in the top-right corner. This runs a headless browser that:

1. Accepts the DoD consent gates on both DIBBS subdomains
2. Finds the most recent daily RFQ index file
3. Downloads and parses it (~1,400 solicitations)
4. Upserts all rows into a local SQLite database

The scrape takes ~15–30 seconds. Once done, the page refreshes with live data.

## Filters

| Filter | Why it's useful |
|--------|----------------|
| **Search** | Free-text across sol number, NSN, and description |
| **FSC** | Federal Supply Class — narrows to a part category (e.g. medical instruments, aircraft parts) |
| **Set-aside** | Business eligibility — SB, WOSB, 8(a), HUBZone, or Unrestricted |
| **Closing within** | Urgency window — show only solicitations closing within 1, 3, 7, or 14 days |

## How the scraper works

DIBBS publishes daily fixed-width index files at `dibbs2.bsm.dla.mil/Downloads/RFQ/Archive/IN{YYMMDD}.TXT`. These are far more reliable than scraping HTML — no pagination, no DOM selectors, structured columnar data.

Each line encodes a solicitation at fixed byte offsets: sol number, NSN, response date, quantity, unit, description, and a set-aside flag. The parser reads these offsets and upserts into SQLite.

Two separate DoD consent cookies are required (one per subdomain). Playwright handles both before downloading the file.

## Tech stack

- **Next.js 15** (App Router) — server-side filtering via URL search params
- **better-sqlite3** — embedded SQLite, no separate DB process
- **Playwright** — headless Chromium for the consent gate + file download
- **Tailwind CSS + Catalyst** — UI components
