# Helpdesk Metrics Dashboard

A client-side analytics dashboard for IT helpdesk and service desk teams. Upload your ticket exports and get instant KPIs, charts, agent leaderboards, SLA compliance tracking, and stakeholder-ready insights — all processed locally in the browser with no data ever sent to a server.

## Why this exists

Built to bring the same operational rigor I use running a service desk into a public, working tool, not just a resume line:

- **The KPI layer mirrors how a desk actually gets managed** — SLA compliance, backlog aging, and resolution-time percentiles are the numbers that drive daily decisions, not vanity metrics.
- **Vendor-agnostic on purpose** — auto column detection across Zendesk, Jira, Freshdesk, and ServiceNow reflects working across multiple ticketing platforms rather than assuming one.
- **Privacy-by-design architecture** — all parsing and analytics run client-side; no ticket data is ever sent to a server. That was a deliberate constraint, not a default, so the tool is safe to demo with real-looking data.

No upload needed to try it — click **"Or explore with sample data"** to load 240 generated tickets and see the full dashboard immediately.

## Features

- **Multi-file compilation** — upload multiple exports (CSV, Excel, JSON, SQL) and they are merged into a single dataset with automatic deduplication by ticket ID
- **Auto column detection** — flexible field mapping recognises column names from Zendesk, Jira, Freshdesk, ServiceNow, and custom exports
- **KPI cards** — total tickets, open backlog, avg/median resolution time, first response time, SLA compliance %, and CSAT with period-over-period trend arrows
- **Charts** — ticket volume timeline, priority distribution, status breakdown, top categories, resolution time by priority, backlog aging, CSAT distribution, channel breakdown
- **Agent leaderboard** — per-agent totals, resolution times, CSAT, and SLA compliance
- **Configurable SLA targets** — set custom resolution hour targets per priority level (critical / high / medium / low)
- **Auto insights** — SLA health, high-priority breach alerts, stale backlog risk, CSAT threshold alerts, top performer callouts
- **PDF export** — print-optimised layout that expands all tabs and injects a report header with generation date
- **CSV export** — download the current filtered dataset

## Supported file formats

| Format | Notes |
|--------|-------|
| CSV / TSV | Comma or tab-separated; any encoding |
| Excel | `.xlsx` / `.xls`; reads the first sheet |
| JSON | Array of objects, or an object containing an array |
| SQL | Parses `INSERT INTO ... VALUES (...)` statements |

## Getting started

### Prerequisites

- Node.js 18 or later
- npm (comes with Node)

### Install and run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
# Production build
npm run build

# Start the production server (after building)
npm start

# Lint
npm run lint
```

## Usage

1. Open the app in your browser.
2. Drag and drop one or more helpdesk export files onto the upload area, or click **Choose files**.
3. Use the filter bar to narrow by date range, priority, status, category, or agent.
4. Switch between the **Overview**, **Performance**, **Statistics**, and **Tickets** tabs.
5. Click **SLA targets** in the header to customise resolution time thresholds.
6. Click **PDF** to export the full dashboard as a print-ready report, or **CSV** to download the filtered data.

To add more data to an existing view, click **Add file** in the header — the new file is merged with what is already loaded.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Excel parsing | SheetJS (xlsx) |

## Project structure

```
app/                  Next.js app router (layout, page, global styles)
components/
  helpdesk/           Domain components (dashboard, charts, tables, filters…)
  ui/                 shadcn/ui base components
lib/
  helpdesk/
    parsers.ts        File format detection and column mapping
    analytics.ts      KPI and stats calculations
    statistics.ts     Mean, median, std dev, percentiles
    types.ts          TypeScript interfaces
    sample-data.ts    Demo data generator
```

## Privacy

All file parsing and analytics run entirely in the browser. No ticket data is uploaded to any server.
