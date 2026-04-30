"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Ticket } from "@/lib/helpdesk/types"
import { describe } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"

interface Row {
  label: string
  values: number[]
  formatter: (n: number) => string
}

export function StatsTable({ tickets }: { tickets: Ticket[] }) {
  const resolvedHrs = tickets
    .map((t) => t.resolutionTimeHours)
    .filter((v): v is number => v != null && isFinite(v))
  const responseHrs = tickets
    .map((t) => t.firstResponseTimeHours)
    .filter((v): v is number => v != null && isFinite(v))
  const csat = tickets.map((t) => t.csatScore).filter((v): v is number => v != null)

  const rows: Row[] = [
    { label: "Resolution time", values: resolvedHrs, formatter: formatHours },
    { label: "First response time", values: responseHrs, formatter: formatHours },
    { label: "CSAT score (1–5)", values: csat, formatter: (n) => formatNumber(n, 2) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descriptive statistics</CardTitle>
        <CardDescription>Central tendency &amp; distribution across all tickets in view</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">N</TableHead>
                <TableHead className="text-right">Mean</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">Mode</TableHead>
                <TableHead className="text-right">Std Dev</TableHead>
                <TableHead className="text-right">P90</TableHead>
                <TableHead className="text-right">P95</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const d = describe(r.values)
                const empty = d.count === 0
                return (
                  <TableRow key={r.label}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{d.count}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.mean)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.median)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs">
                      {empty || d.mode.length === 0 ? "—" : d.mode.map((m) => r.formatter(m)).join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.stdDev)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.p90)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.p95)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.min)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {empty ? "—" : r.formatter(d.max)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
