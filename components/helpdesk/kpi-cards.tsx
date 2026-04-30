"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TicketCheck, Clock, Gauge, Star, Inbox, Activity } from "lucide-react"
import type { KPIs } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"
import { cn } from "@/lib/utils"

interface KpiCardsProps {
  kpis: KPIs
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const items = [
    {
      label: "Total tickets",
      value: kpis.total.toLocaleString(),
      sub: `${kpis.resolved.toLocaleString()} resolved`,
      icon: TicketCheck,
    },
    {
      label: "Open backlog",
      value: kpis.backlog.toLocaleString(),
      sub: `${kpis.open.toLocaleString()} not closed`,
      icon: Inbox,
    },
    {
      label: "Avg. resolution",
      value: formatHours(kpis.avgResolutionHours),
      sub: `Median ${formatHours(kpis.medianResolutionHours)}`,
      icon: Clock,
    },
    {
      label: "First response",
      value: formatHours(kpis.avgFirstResponseHours),
      sub: "Average time",
      icon: Activity,
    },
    {
      label: "SLA compliance",
      value: `${formatNumber(kpis.slaCompliancePct, 1)}%`,
      sub: kpis.slaCompliancePct >= 90 ? "On target" : kpis.slaCompliancePct >= 75 ? "At risk" : "Below target",
      icon: Gauge,
      tone:
        kpis.slaCompliancePct >= 90
          ? ("good" as const)
          : kpis.slaCompliancePct >= 75
            ? ("warn" as const)
            : ("bad" as const),
    },
    {
      label: "Avg. CSAT",
      value: kpis.csatCount > 0 ? `${formatNumber(kpis.avgCsat, 2)} / 5` : "—",
      sub: kpis.csatCount > 0 ? `${kpis.csatCount.toLocaleString()} responses` : "No responses",
      icon: Star,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <Card key={it.label} className="border-border/60">
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{it.label}</span>
              <it.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold tracking-tight">{it.value}</span>
            </div>
            <span
              className={cn(
                "text-xs",
                it.tone === "good" && "text-emerald-600 dark:text-emerald-400",
                it.tone === "warn" && "text-amber-600 dark:text-amber-400",
                it.tone === "bad" && "text-red-600 dark:text-red-400",
                !it.tone && "text-muted-foreground",
              )}
            >
              {it.sub}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
