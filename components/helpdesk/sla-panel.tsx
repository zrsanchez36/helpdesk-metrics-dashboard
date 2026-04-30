"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Ticket, TicketPriority } from "@/lib/helpdesk/types"
import { SLA_TARGETS_HOURS } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"

interface SlaRow {
  priority: TicketPriority
  target: number
  considered: number
  met: number
  pct: number
}

function compute(tickets: Ticket[]): SlaRow[] {
  const priorities: TicketPriority[] = ["critical", "high", "medium", "low"]
  return priorities.map((p) => {
    const list = tickets.filter(
      (t) => t.priority === p && (t.status === "resolved" || t.status === "closed") && t.resolutionTimeHours != null,
    )
    const target = SLA_TARGETS_HOURS[p]
    const met = list.filter((t) =>
      t.slaBreached !== undefined ? !t.slaBreached : (t.resolutionTimeHours as number) <= target,
    ).length
    return {
      priority: p,
      target,
      considered: list.length,
      met,
      pct: list.length > 0 ? (met / list.length) * 100 : 0,
    }
  })
}

export function SlaPanel({ tickets }: { tickets: Ticket[] }) {
  const rows = compute(tickets)

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA compliance by priority</CardTitle>
        <CardDescription>% of resolved tickets meeting target time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((r) => (
          <div key={r.priority} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{r.priority}</span>
                <span className="text-xs text-muted-foreground">target {formatHours(r.target)}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                <span className="text-muted-foreground">
                  {r.met}/{r.considered}
                </span>
                <span
                  className={
                    r.pct >= 90
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : r.pct >= 75
                        ? "text-amber-600 dark:text-amber-400 font-semibold"
                        : "text-red-600 dark:text-red-400 font-semibold"
                  }
                >
                  {formatNumber(r.pct, 0)}%
                </span>
              </div>
            </div>
            <Progress value={r.pct} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
