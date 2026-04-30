"use client"

import { useMemo, useState } from "react"
import { LifeBuoy, Sparkles, Download, AlertCircle, FileDown, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FileUpload, DatasetSources } from "./file-upload"
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
  BacklogAgingChart,
} from "./charts"
import { AgentTable } from "./agent-table"
import { StatsTable } from "./stats-table"
import { TicketsTable } from "./tickets-table"
import { SlaPanel } from "./sla-panel"
import { InsightsPanel } from "./insights"

import type { ParsedDataset, Ticket, TicketPriority } from "@/lib/helpdesk/types"
import { generateSampleTickets } from "@/lib/helpdesk/sample-data"
import { computeAgentStats, computeKPIs, DEFAULT_SLA_TARGETS, type SlaTargets } from "@/lib/helpdesk/analytics"

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    "id", "subject", "status", "priority", "category", "agent", "channel",
    "createdAt", "resolvedAt", "resolutionTimeHours", "firstResponseTimeHours", "csatScore", "slaBreached",
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

// ─── SLA Settings Dialog ────────────────────────────────────────────────────

function SlaSettingsDialog({
  targets,
  onSave,
}: {
  targets: SlaTargets
  onSave: (t: SlaTargets) => void
}) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<SlaTargets>(targets)
  const priorities: TicketPriority[] = ["critical", "high", "medium", "low"]

  const handleSave = () => {
    onSave(local)
    setOpen(false)
  }

  const handleReset = () => {
    setLocal(DEFAULT_SLA_TARGETS)
    onSave(DEFAULT_SLA_TARGETS)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setLocal(targets) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="size-4" />
          SLA targets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>SLA target hours</DialogTitle>
          <DialogDescription>
            Set the maximum resolution time for each priority level. Used for compliance calculations and insights.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {priorities.map((p) => (
            <div key={p} className="flex items-center gap-3">
              <Label className="w-20 capitalize text-sm">{p}</Label>
              <Input
                type="number"
                min={1}
                value={local[p]}
                onChange={(e) => setLocal((prev) => ({ ...prev, [p]: Math.max(1, Number(e.target.value)) }))}
                className="w-24 font-mono"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset defaults
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function HelpdeskDashboard() {
  const [datasets, setDatasets] = useState<ParsedDataset[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [usingSample, setUsingSample] = useState(false)
  const [slaTargets, setSlaTargets] = useState<SlaTargets>(DEFAULT_SLA_TARGETS)

  // Merge all datasets, deduplicate by ticket ID (last-in wins)
  const allTickets = useMemo(() => {
    const map = new Map<string, Ticket>()
    for (const ds of datasets) {
      for (const t of ds.tickets) {
        map.set(t.id, t)
      }
    }
    return Array.from(map.values())
  }, [datasets])

  const hasData = datasets.length > 0

  const loadSample = () => {
    const sample = generateSampleTickets(240)
    setDatasets([
      {
        fileName: "sample_helpdesk_export.csv",
        fileType: "Sample",
        tickets: sample,
        rawRowCount: sample.length,
        parsedRowCount: sample.length,
        warnings: [],
      },
    ])
    setUsingSample(true)
    setError(null)
    setFilters(DEFAULT_FILTERS)
  }

  const handleParsed = (d: ParsedDataset) => {
    if (datasets.length === 0) setFilters(DEFAULT_FILTERS)
    setDatasets((prev) => [...prev, d])
    setUsingSample(false)
    setError(null)
  }

  const handleRemoveDataset = (index: number) => {
    setDatasets((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setDatasets([])
    setUsingSample(false)
    setFilters(DEFAULT_FILTERS)
  }

  // Current period tickets
  const filtered = useMemo(() => applyFilters(allTickets, filters), [allTickets, filters])

  // Previous period — same duration, immediately before the current window
  const prevFiltered = useMemo(() => {
    if (filters.range === "all") return []
    const days = Number.parseInt(filters.range, 10)
    const now = Date.now()
    const currentStart = now - days * 86400 * 1000
    const prevStart = currentStart - days * 86400 * 1000
    let prev = allTickets.filter((t) => {
      const ts = t.createdAt.getTime()
      return ts >= prevStart && ts < currentStart
    })
    if (filters.priority !== "all") prev = prev.filter((t) => t.priority === filters.priority)
    if (filters.status !== "all") prev = prev.filter((t) => t.status === filters.status)
    if (filters.category !== "all") prev = prev.filter((t) => t.category === filters.category)
    if (filters.agent !== "all") prev = prev.filter((t) => t.agent === filters.agent)
    return prev
  }, [allTickets, filters])

  const kpis = useMemo(() => computeKPIs(filtered, slaTargets), [filtered, slaTargets])
  const prevKpis = useMemo(
    () => (prevFiltered.length > 0 ? computeKPIs(prevFiltered, slaTargets) : undefined),
    [prevFiltered, slaTargets],
  )
  const agentStats = useMemo(() => computeAgentStats(filtered, slaTargets), [filtered, slaTargets])

  const allAgents = useMemo(() => Array.from(new Set(allTickets.map((t) => t.agent))).sort(), [allTickets])
  const allCategories = useMemo(() => Array.from(new Set(allTickets.map((t) => t.category))).sort(), [allTickets])

  const allWarnings = useMemo(() => datasets.flatMap((d) => d.warnings), [datasets])

  return (
    <div className="min-h-screen bg-background" id="dashboard-root">
      {/* Header — hidden when printing */}
      <header className="no-print sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
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
            {hasData && (
              <>
                <FileUpload onParsed={handleParsed} onError={setError} compact />
                <SlaSettingsDialog targets={slaTargets} onSave={setSlaTargets} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(filtered)}
                  className="gap-2"
                >
                  <Download className="size-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  <FileDown className="size-4" />
                  PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Print-only report header */}
      <div className="print-only px-8 pt-8 pb-4 border-b mb-6">
        <div className="flex items-center gap-3 mb-1">
          <LifeBuoy className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">Helpdesk Metrics Report</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generated {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
          {filters.range !== "all" && ` · Last ${filters.range} days`}
          {datasets.length > 0 && ` · ${allTickets.length.toLocaleString()} total tickets`}
        </p>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
        {error && (
          <Alert variant="destructive" className="no-print">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not parse file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Landing screen */}
        {!hasData && (
          <div className="space-y-6 py-6">
            <div className="space-y-2 text-center">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Turn helpdesk exports into stakeholder-ready insights
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
                Drop in one or more CSV, Excel, JSON or SQL dumps. Files are compiled and deduplicated automatically —
                mix exports from different periods or teams and analyze them as a single dataset.
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

        {/* Dashboard */}
        {hasData && (
          <>
            <div className="flex flex-col gap-3 no-print">
              <DatasetSources
                datasets={datasets}
                uniqueCount={allTickets.length}
                onRemove={handleRemoveDataset}
                onClear={handleClearAll}
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
              {allWarnings.length > 0 && (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>
                    <ul className="ml-4 list-disc space-y-0.5">
                      {allWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="no-print">
              <Filters state={filters} setState={setFilters} agents={allAgents} categories={allCategories} />
            </div>

            {prevKpis && (
              <p className="no-print text-xs text-muted-foreground -mt-2">
                Trend arrows compare to the previous {filters.range}-day period.
              </p>
            )}

            <KpiCards kpis={kpis} prevKpis={prevKpis} />

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="no-print">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 print-section">
                <div className="print-only section-title">
                  <h2 className="text-lg font-semibold mb-4">Overview</h2>
                </div>
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

                <div className="grid gap-4 lg:grid-cols-2">
                  <BacklogAgingChart tickets={filtered} />
                </div>

                <InsightsPanel tickets={filtered} slaTargets={slaTargets} />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 print-section">
                <div className="print-only section-title">
                  <h2 className="text-lg font-semibold mb-4 mt-8">Performance</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AgentTable stats={agentStats} />
                  </div>
                  <SlaPanel tickets={filtered} slaTargets={slaTargets} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <CsatChart tickets={filtered} />
                  <ChannelChart tickets={filtered} />
                </div>
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4 print-section">
                <div className="print-only section-title">
                  <h2 className="text-lg font-semibold mb-4 mt-8">Statistics</h2>
                </div>
                <StatsTable tickets={filtered} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <ResolutionByPriorityChart tickets={filtered} />
                  <SlaPanel tickets={filtered} slaTargets={slaTargets} />
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4 print-section">
                <div className="print-only section-title">
                  <h2 className="text-lg font-semibold mb-4 mt-8">Recent tickets</h2>
                </div>
                <TicketsTable tickets={filtered} limit={25} />
              </TabsContent>
            </Tabs>
          </>
        )}

        <footer className="no-print pt-4 pb-2 text-center text-xs text-muted-foreground">
          Helpdesk Metrics Dashboard · supports CSV, TSV, Excel, JSON, and SQL dumps · all parsing happens in your
          browser
        </footer>
      </main>
    </div>
  )
}
