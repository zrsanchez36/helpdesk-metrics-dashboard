"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { Ticket } from "@/lib/helpdesk/types"
import {
  backlogAging,
  countBy,
  csatDistribution,
  resolutionByPriority,
  statusBreakdown,
  ticketsOverTime,
} from "@/lib/helpdesk/analytics"
import { formatHours } from "@/lib/helpdesk/statistics"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--color-chart-1)",
  high: "var(--color-chart-5)",
  medium: "var(--color-chart-2)",
  low: "var(--color-chart-3)",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
}

function formatDateTick(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function TicketsTimelineChart({ tickets }: { tickets: Ticket[] }) {
  const data = ticketsOverTime(tickets, tickets.length > 90 ? "week" : "day")
  const config = {
    created: { label: "Created", color: "var(--color-chart-1)" },
    resolved: { label: "Resolved", color: "var(--color-chart-2)" },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket volume over time</CardTitle>
        <CardDescription>Tickets created vs. resolved</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-created" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-resolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatDateTick} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => new Date(v).toLocaleDateString()} />} />
            <Area
              type="monotone"
              dataKey="created"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#grad-created)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fill="url(#grad-resolved)"
            />
            <Legend />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function PriorityChart({ tickets }: { tickets: Ticket[] }) {
  const data = countBy(tickets, (t) => t.priority).map((d) => ({
    name: d.name,
    value: d.value,
    fill: PRIORITY_COLORS[d.name] ?? "var(--color-chart-3)",
  }))
  const config = {
    value: { label: "Tickets" },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>By priority</CardTitle>
        <CardDescription>Distribution of incoming tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs capitalize text-muted-foreground">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function StatusChart({ tickets }: { tickets: Ticket[] }) {
  const data = statusBreakdown(tickets).map((d, i) => ({
    name: STATUS_LABELS[d.status],
    value: d.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))
  const config = { value: { label: "Tickets" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>By status</CardTitle>
        <CardDescription>Where tickets currently sit</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function CategoryChart({ tickets }: { tickets: Ticket[] }) {
  const data = countBy(tickets, (t) => t.category).slice(0, 8)
  const config = { value: { label: "Tickets", color: "var(--color-chart-1)" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top categories</CardTitle>
        <CardDescription>Most common ticket types</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={110}
              fontSize={12}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ResolutionByPriorityChart({ tickets }: { tickets: Ticket[] }) {
  const data = resolutionByPriority(tickets).map((d) => ({
    priority: d.priority,
    avg: Number(d.avg.toFixed(2)),
    median: Number(d.median.toFixed(2)),
  }))
  const config = {
    avg: { label: "Average", color: "var(--color-chart-1)" },
    median: { label: "Median", color: "var(--color-chart-2)" },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution time by priority</CardTitle>
        <CardDescription>Hours to resolve — average vs. median</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="priority" tickLine={false} axisLine={false} tickMargin={8} className="capitalize" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={42}
              tickFormatter={(v) => formatHours(Number(v))}
              fontSize={12}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(v, name) => [formatHours(Number(v)), String(name)]} />}
            />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="avg" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="median" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ChannelChart({ tickets }: { tickets: Ticket[] }) {
  const data = countBy(tickets, (t) => t.channel ?? "Unknown")
  if (data.every((d) => d.name === "Unknown")) return null
  const config = { value: { label: "Tickets" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>By channel</CardTitle>
        <CardDescription>How tickets reach the helpdesk</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function BacklogAgingChart({ tickets }: { tickets: Ticket[] }) {
  const data = backlogAging(tickets)
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null

  const AGING_COLORS = [
    "var(--color-chart-2)", // < 24h — green-ish
    "var(--color-chart-4)", // 1–7 days — yellow
    "var(--color-chart-5)", // 7–30 days — orange
    "var(--color-chart-1)", // > 30 days — red-ish
  ]

  const config = { count: { label: "Tickets" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlog aging</CardTitle>
        <CardDescription>Age of open, in-progress &amp; pending tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function CsatChart({ tickets }: { tickets: Ticket[] }) {
  const dist = csatDistribution(tickets)
  if (dist.every((d) => d.count === 0)) return null

  const data = dist.map((d) => ({
    name: `${d.score}★`,
    value: d.count,
    fill: d.score >= 4 ? "var(--color-chart-2)" : d.score === 3 ? "var(--color-chart-4)" : "var(--color-chart-1)",
  }))
  const config = { value: { label: "Responses" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSAT distribution</CardTitle>
        <CardDescription>Customer satisfaction scores (1–5)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
