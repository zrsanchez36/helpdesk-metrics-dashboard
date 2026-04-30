import type { Ticket, TicketPriority, TicketStatus } from "./types"
import { mean, median, mode, percentile, stdDev } from "./statistics"

export type SlaTargets = Record<TicketPriority, number>

export const DEFAULT_SLA_TARGETS: SlaTargets = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 72,
}

// Kept for backward compatibility
export const SLA_TARGETS_HOURS = DEFAULT_SLA_TARGETS

export interface KPIs {
  total: number
  open: number
  resolved: number
  avgResolutionHours: number
  medianResolutionHours: number
  avgFirstResponseHours: number
  slaCompliancePct: number
  avgCsat: number
  csatCount: number
  backlog: number
}

export function computeKPIs(tickets: Ticket[], slaTargets: SlaTargets = DEFAULT_SLA_TARGETS): KPIs {
  const total = tickets.length
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed")
  const open = total - resolved.length

  const resolutionHours = resolved
    .map((t) => t.resolutionTimeHours)
    .filter((v): v is number => v != null && isFinite(v))
  const responseHours = tickets
    .map((t) => t.firstResponseTimeHours)
    .filter((v): v is number => v != null && isFinite(v))

  // SLA: explicit field if provided, otherwise compute from target
  let slaConsidered = 0
  let slaMet = 0
  for (const t of resolved) {
    if (t.slaBreached !== undefined) {
      slaConsidered++
      if (!t.slaBreached) slaMet++
    } else if (t.resolutionTimeHours != null) {
      slaConsidered++
      if (t.resolutionTimeHours <= slaTargets[t.priority]) slaMet++
    }
  }

  const csatScores = tickets.map((t) => t.csatScore).filter((v): v is number => v != null)

  return {
    total,
    open,
    resolved: resolved.length,
    avgResolutionHours: mean(resolutionHours),
    medianResolutionHours: median(resolutionHours),
    avgFirstResponseHours: mean(responseHours),
    slaCompliancePct: slaConsidered > 0 ? (slaMet / slaConsidered) * 100 : 0,
    avgCsat: mean(csatScores),
    csatCount: csatScores.length,
    backlog: tickets.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "pending").length,
  }
}

export function ticketsOverTime(
  tickets: Ticket[],
  bucket: "day" | "week" = "day",
): { date: string; created: number; resolved: number }[] {
  const map = new Map<string, { created: number; resolved: number }>()
  const fmt = (d: Date) => {
    const x = new Date(d)
    if (bucket === "week") {
      const day = x.getDay()
      x.setDate(x.getDate() - day)
    }
    x.setHours(0, 0, 0, 0)
    return x.toISOString().slice(0, 10)
  }
  for (const t of tickets) {
    const k = fmt(t.createdAt)
    const cur = map.get(k) ?? { created: 0, resolved: 0 }
    cur.created++
    map.set(k, cur)
    if (t.resolvedAt) {
      const rk = fmt(t.resolvedAt)
      const cur2 = map.get(rk) ?? { created: 0, resolved: 0 }
      cur2.resolved++
      map.set(rk, cur2)
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, created: v.created, resolved: v.resolved }))
}

export function countBy<K extends string>(tickets: Ticket[], key: (t: Ticket) => K): { name: K; value: number }[] {
  const map = new Map<K, number>()
  for (const t of tickets) {
    const k = key(t)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export interface AgentStats {
  agent: string
  total: number
  resolved: number
  avgResolutionHours: number
  medianResolutionHours: number
  avgCsat: number
  csatCount: number
  slaCompliancePct: number
}

export function computeAgentStats(tickets: Ticket[], slaTargets: SlaTargets = DEFAULT_SLA_TARGETS): AgentStats[] {
  const byAgent = new Map<string, Ticket[]>()
  for (const t of tickets) {
    if (!byAgent.has(t.agent)) byAgent.set(t.agent, [])
    byAgent.get(t.agent)!.push(t)
  }
  const out: AgentStats[] = []
  for (const [agent, list] of byAgent.entries()) {
    const resolved = list.filter((t) => t.status === "resolved" || t.status === "closed")
    const resHours = resolved.map((t) => t.resolutionTimeHours).filter((v): v is number => v != null)
    const csat = list.map((t) => t.csatScore).filter((v): v is number => v != null)
    let slaConsidered = 0
    let slaMet = 0
    for (const t of resolved) {
      if (t.slaBreached !== undefined) {
        slaConsidered++
        if (!t.slaBreached) slaMet++
      } else if (t.resolutionTimeHours != null) {
        slaConsidered++
        if (t.resolutionTimeHours <= slaTargets[t.priority]) slaMet++
      }
    }
    out.push({
      agent,
      total: list.length,
      resolved: resolved.length,
      avgResolutionHours: mean(resHours),
      medianResolutionHours: median(resHours),
      avgCsat: mean(csat),
      csatCount: csat.length,
      slaCompliancePct: slaConsidered > 0 ? (slaMet / slaConsidered) * 100 : 0,
    })
  }
  return out.sort((a, b) => b.total - a.total)
}

export interface DescriptiveStats {
  count: number
  mean: number
  median: number
  mode: number[]
  stdDev: number
  p90: number
  p95: number
  min: number
  max: number
}

export function describe(values: number[]): DescriptiveStats {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    count: values.length,
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    stdDev: stdDev(values),
    p90: percentile(values, 90),
    p95: percentile(values, 95),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  }
}

export function resolutionByPriority(tickets: Ticket[]): {
  priority: TicketPriority
  avg: number
  median: number
  count: number
}[] {
  const priorities: TicketPriority[] = ["critical", "high", "medium", "low"]
  return priorities.map((p) => {
    const vals = tickets
      .filter((t) => t.priority === p && t.resolutionTimeHours != null)
      .map((t) => t.resolutionTimeHours as number)
    return { priority: p, avg: mean(vals), median: median(vals), count: vals.length }
  })
}

export function statusBreakdown(tickets: Ticket[]): { status: TicketStatus; count: number }[] {
  const order: TicketStatus[] = ["open", "in_progress", "pending", "resolved", "closed"]
  return order.map((s) => ({ status: s, count: tickets.filter((t) => t.status === s).length }))
}

export function csatDistribution(tickets: Ticket[]): { score: number; count: number }[] {
  const out = [1, 2, 3, 4, 5].map((s) => ({
    score: s,
    count: tickets.filter((t) => t.csatScore === s).length,
  }))
  return out
}

export function backlogAging(tickets: Ticket[]): { bucket: string; count: number }[] {
  const now = Date.now()
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "pending",
  )
  return [
    { bucket: "< 24h", minH: 0, maxH: 24 },
    { bucket: "1–7 days", minH: 24, maxH: 168 },
    { bucket: "7–30 days", minH: 168, maxH: 720 },
    { bucket: "> 30 days", minH: 720, maxH: Infinity },
  ].map(({ bucket, minH, maxH }) => ({
    bucket,
    count: openTickets.filter((t) => {
      const ageH = (now - t.createdAt.getTime()) / 3600000
      return ageH >= minH && ageH < maxH
    }).length,
  }))
}
