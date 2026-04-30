"use client"

import { useMemo, useState } from "react"
import { LifeBuoy, Sparkles, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { FileUpload, DatasetSummary } from "./file-upload"
import { KpiCards } from "./kpi-cards"
import { Filters, DEFAULT_FILTERS, type FilterState } from "./filters"
import {
  TicketsTimelineChart,
  PriorityChart,
  StatusChart,
  CategoryChart,
  ResolutionByPriorityChart,
  ChannelChart,
  CsatChart,
} from "./charts"
import { AgentTable } from "./agent-table"
import { StatsTable } from "./stats-table"
import { TicketsTable } from "./tickets-table"
import { SlaPanel } from "./sla-panel"
import { InsightsPanel } from "./insights"

import type { ParsedDataset, Ticket } from "@/lib/helpdesk/types"
import { generateSampleTickets } from "@/lib/helpdesk/sample-data"
import { computeAgentStats, computeKPIs } from "@/lib/helpdesk/analytics"

function applyFilters(tickets: Ticket[], f: FilterState): Ticket[] {
  let out = tickets
  if (f.range !== "all") {
    const days = Number.parseInt(f.range, 10)
    const cutoff = Date.now() - days * 86400 * 1000
    out = out.filter((t) => t.createdAt.getTime() >= cutoff)
  }
  if (f.priority !== "all") out = out.filter((t) => t.priority === f.priority)
  if (f.status !== "all") out = out.filter((t) => t.status === f.status)
  if (f.category !== "all") out = out.filter((t) => t.category === f.category)
  if (f.agent !== "all") out = out.filter((t) => t.agent === f.agent)
  return out
}

function exportCSV(tickets: Ticket[]) {
  const headers = [
    "id",
    "subject",
    "status",
    "priority",
    "category",
    "agent",
    "channel",
    "createdAt",
    "resolvedAt",
    "resolutionTimeHours",
    "firstResponseTimeHours",
    "csatScore",
    "slaBreached",
  ]
  const escape = (v: unknown) => {
    if (v == null) return ""
    const s = v instanceof Date ? v.toISOString() : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = tickets.map((t) =>
    headers.map((h) => escape((t as unknown as Record<string, unknown>)[h])).join(","),
  )
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `helpdesk-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function HelpdeskDashboard() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [usingSample, setUsingSample] = useState(false)

  const tickets = dataset?.tickets ?? []

  const loadSample = () => {
    const sample = generateSampleTickets(240)
    setDataset({
      fileName: "sample_helpdesk_export.csv",
      fileType: "Sample",
      tickets: sample,
      rawRowCount: sample.length,
      parsedRowCount: sample.length,
      warnings: [],
    })
    setUsingSample(true)
    setError(null)
    setFilters(DEFAULT_FILTERS)
  }

  const handleParsed = (d: ParsedDataset) => {
    setDataset(d)
    setUsingSample(false)
    setError(null)
    setFilters(DEFAULT_FILTERS)
  }

  const filtered = useMemo(() => applyFilters(tickets, filters), [tickets, filters])

  const kpis = useMemo(() => computeKPIs(filtered), [filtered])
  const agentStats = useMemo(() => computeAgentStats(filtered), [filtered])

  const allAgents = useMemo(() => Array.from(new Set(tickets.map((t) => t.agent))).sort(), [tickets])
  const allCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).sort(), [tickets])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <LifeBuoy className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Helpdesk Metrics</p>
              <p className="text-[11px] text-muted-foreground">Service Desk Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dataset && (
              <>
                <FileUpload onParsed={handleParsed} onError={setError} compact />
                <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-2">
                  <Download className="size-4" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not parse file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!dataset && (
          <div className="space-y-6 py-6">
            <div className="space-y-2 text-center">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Turn helpdesk exports into stakeholder-ready insights
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
                Drop in a CSV, Excel, JSON or SQL dump of your tickets. We auto-detect columns and produce KPIs, time
                series, distributions, agent leaderboards, SLA compliance and descriptive statistics — ready to present.
              </p>
            </div>

            <FileUpload onParsed={handleParsed} onError={setError} />

            <div className="flex justify-center">
              <Button variant="ghost" onClick={loadSample} className="gap-2">
                <Sparkles className="size-4" />
                Or explore with sample data
              </Button>
            </div>
          </div>
        )}

        {dataset && (
          <>
            <div className="flex flex-col gap-3">
              <DatasetSummary
                dataset={dataset}
                onClear={() => {
                  setDataset(null)
                  setUsingSample(false)
                  setFilters(DEFAULT_FILTERS)
                }}
              />
              {usingSample && (
                <Alert>
                  <Sparkles className="size-4" />
                  <AlertTitle>Viewing sample data</AlertTitle>
                  <AlertDescription>
                    These 240 tickets are generated locally for demo purposes. Upload your own export anytime.
                  </AlertDescription>
                </Alert>
              )}
              {dataset.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>
                    <ul className="ml-4 list-disc space-y-0.5">
                      {dataset.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Filters state={filters} setState={setFilters} agents={allAgents} categories={allCategories} />

            <KpiCards kpis={kpis} />

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <TicketsTimelineChart tickets={filtered} />
                  </div>
                  <PriorityChart tickets={filtered} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <CategoryChart tickets={filtered} />
                  <StatusChart tickets={filtered} />
                  <ResolutionByPriorityChart tickets={filtered} />
                </div>

                <InsightsPanel tickets={filtered} />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AgentTable stats={agentStats} />
                  </div>
                  <SlaPanel tickets={filtered} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <CsatChart tickets={filtered} />
                  <ChannelChart tickets={filtered} />
                </div>
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                <StatsTable tickets={filtered} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <ResolutionByPriorityChart tickets={filtered} />
                  <SlaPanel tickets={filtered} />
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                <TicketsTable tickets={filtered} limit={25} />
              </TabsContent>
            </Tabs>
          </>
        )}

        <footer className="pt-4 pb-2 text-center text-xs text-muted-foreground">
          Helpdesk Metrics Dashboard · supports CSV, TSV, Excel, JSON, and SQL dumps · all parsing happens in your
          browser
        </footer>
      </main>
    </div>
  )
}
