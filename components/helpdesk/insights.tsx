"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, Sparkles, ShieldCheck, Clock, Star } from "lucide-react"
import type { Ticket } from "@/lib/helpdesk/types"
import { backlogAging, computeAgentStats, computeKPIs, countBy, DEFAULT_SLA_TARGETS, type SlaTargets } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"

export function InsightsPanel({ tickets, slaTargets = DEFAULT_SLA_TARGETS }: { tickets: Ticket[]; slaTargets?: SlaTargets }) {
  const kpis = computeKPIs(tickets, slaTargets)
  const agents = computeAgentStats(tickets, slaTargets)
  const topCategory = countBy(tickets, (t) => t.category)[0]
  const aging = backlogAging(tickets)

  const breachedHigh = tickets.filter(
    (t) =>
      (t.priority === "critical" || t.priority === "high") &&
      t.resolutionTimeHours != null &&
      t.resolutionTimeHours > slaTargets[t.priority],
  ).length

  const fastestAgent = [...agents]
    .filter((a) => a.resolved >= 3)
    .sort((a, b) => a.avgResolutionHours - b.avgResolutionHours)[0]

  // Aging risk: tickets stale for > 7 days
  const staleCount = (aging[2]?.count ?? 0) + (aging[3]?.count ?? 0)
  const staleRatio = kpis.backlog > 0 ? staleCount / kpis.backlog : 0

  const items: { title: string; body: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = []

  // SLA health
  if (kpis.slaCompliancePct >= 90) {
    items.push({
      title: "SLA on target",
      body: `${formatNumber(kpis.slaCompliancePct, 1)}% of resolved tickets met their SLA. Keep current staffing levels.`,
      icon: ShieldCheck,
      tone: "good",
    })
  } else {
    items.push({
      title: "SLA needs attention",
      body: `${formatNumber(kpis.slaCompliancePct, 1)}% compliance. Review priority routing and agent capacity.`,
      icon: AlertTriangle,
      tone: "warn",
    })
  }

  // High-priority breaches
  if (breachedHigh > 0) {
    items.push({
      title: "High-priority breaches",
      body: `${breachedHigh} critical/high ticket${breachedHigh > 1 ? "s" : ""} exceeded SLA. Consider escalation playbook adjustments.`,
      icon: AlertTriangle,
      tone: "bad",
    })
  }

  // Backlog aging risk
  if (staleCount > 0 && staleRatio >= 0.2) {
    items.push({
      title: "Stale backlog risk",
      body: `${staleCount} open ticket${staleCount > 1 ? "s" : ""} (${formatNumber(staleRatio * 100, 0)}% of backlog) have been open for more than 7 days. Consider reassigning or escalating.`,
      icon: Clock,
      tone: staleRatio >= 0.4 ? "bad" : "warn",
    })
  }

  // Most common issue
  if (topCategory) {
    items.push({
      title: "Most common issue",
      body: `${topCategory.name} accounts for ${topCategory.value} tickets (${formatNumber(
        (topCategory.value / Math.max(1, kpis.total)) * 100,
        0,
      )}%). A KB article or automation could deflect volume.`,
      icon: TrendingUp,
      tone: "info",
    })
  }

  // CSAT risk
  if (kpis.csatCount >= 5 && kpis.avgCsat < 3.5) {
    items.push({
      title: "CSAT below threshold",
      body: `Average satisfaction is ${formatNumber(kpis.avgCsat, 2)}/5 across ${kpis.csatCount} responses. Review recent low-scored tickets for common themes.`,
      icon: Star,
      tone: "bad",
    })
  } else if (kpis.csatCount >= 5 && kpis.avgCsat >= 4.5) {
    items.push({
      title: "High customer satisfaction",
      body: `Average CSAT of ${formatNumber(kpis.avgCsat, 2)}/5 across ${kpis.csatCount} responses. Share what's working with the wider team.`,
      icon: Star,
      tone: "good",
    })
  }

  // Top performer
  if (fastestAgent) {
    items.push({
      title: "Top performer",
      body: `${fastestAgent.agent} resolves in ${formatHours(fastestAgent.avgResolutionHours)} on average across ${
        fastestAgent.resolved
      } tickets. Pair them on training.`,
      icon: Sparkles,
      tone: "good",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights for stakeholders</CardTitle>
        <CardDescription>Auto-generated takeaways from the current view</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} className="flex gap-3 rounded-lg border bg-background p-3">
            <div
              className={
                "flex size-8 shrink-0 items-center justify-center rounded-md " +
                (it.tone === "good"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : it.tone === "warn"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : it.tone === "bad"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-foreground/5 text-foreground")
              }
            >
              <it.icon className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-tight">{it.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
