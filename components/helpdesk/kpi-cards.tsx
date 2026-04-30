"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TicketCheck, Clock, Gauge, Star, Inbox, Activity, TrendingUp, TrendingDown } from "lucide-react"
import type { KPIs } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"
import { cn } from "@/lib/utils"

interface KpiCardsProps {
  kpis: KPIs
  prevKpis?: KPIs
}

function pctDelta(current: number, prev: number) {
  if (!prev || prev === 0) return null
  return ((current - prev) / prev) * 100
}

function Delta({
  current,
  prev,
  lowerIsBetter = false,
}: {
  current: number
  prev: number
  lowerIsBetter?: boolean
}) {
  const d = pctDelta(current, prev)
  if (d === null || Math.abs(d) < 0.5) return null
  const up = d > 0
  const good = lowerIsBetter ? !up : up
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(d).toFixed(1)}%
    </span>
  )
}

export function KpiCards({ kpis, prevKpis }: KpiCardsProps) {
  const items = [
    {
      label: "Total tickets",
      value: kpis.total.toLocaleString(),
      sub: `${kpis.resolved.toLocaleString()} resolved`,
      icon: TicketCheck,
      deltaVal: prevKpis ? { current: kpis.total, prev: prevKpis.total, lowerIsBetter: false } : undefined,
    },
    {
      label: "Open backlog",
      value: kpis.backlog.toLocaleString(),
      sub: `${kpis.open.toLocaleString()} not closed`,
      icon: Inbox,
      deltaVal: prevKpis ? { current: kpis.backlog, prev: prevKpis.backlog, lowerIsBetter: true } : undefined,
    },
    {
      label: "Avg. resolution",
      value: formatHours(kpis.avgResolutionHours),
      sub: `Median ${formatHours(kpis.medianResolutionHours)}`,
      icon: Clock,
      deltaVal: prevKpis
        ? { current: kpis.avgResolutionHours, prev: prevKpis.avgResolutionHours, lowerIsBetter: true }
        : undefined,
    },
    {
      label: "First response",
      value: formatHours(kpis.avgFirstResponseHours),
      sub: "Average time",
      icon: Activity,
      deltaVal: prevKpis
        ? { current: kpis.avgFirstResponseHours, prev: prevKpis.avgFirstResponseHours, lowerIsBetter: true }
        : undefined,
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
      deltaVal: prevKpis
        ? { current: kpis.slaCompliancePct, prev: prevKpis.slaCompliancePct, lowerIsBetter: false }
        : undefined,
    },
    {
      label: "Avg. CSAT",
      value: kpis.csatCount > 0 ? `${formatNumber(kpis.avgCsat, 2)} / 5` : "—",
      sub: kpis.csatCount > 0 ? `${kpis.csatCount.toLocaleString()} responses` : "No responses",
      icon: Star,
      deltaVal:
        prevKpis && kpis.csatCount > 0 && prevKpis.csatCount > 0
          ? { current: kpis.avgCsat, prev: prevKpis.avgCsat, lowerIsBetter: false }
          : undefined,
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
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-2xl font-semibold tracking-tight">{it.value}</span>
              {it.deltaVal && (
                <Delta
                  current={it.deltaVal.current}
                  prev={it.deltaVal.prev}
                  lowerIsBetter={it.deltaVal.lowerIsBetter}
                />
              )}
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
