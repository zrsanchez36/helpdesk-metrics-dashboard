"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { AgentStats } from "@/lib/helpdesk/analytics"
import { formatHours, formatNumber } from "@/lib/helpdesk/statistics"
import { Star } from "lucide-react"

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AgentTable({ stats }: { stats: AgentStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent performance</CardTitle>
        <CardDescription>Volume, speed, satisfaction and SLA per technician</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg. resolve</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">CSAT</TableHead>
                <TableHead className="w-[180px]">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.agent}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{initials(s.agent)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.agent}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.resolved.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatHours(s.avgResolutionHours)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatHours(s.medianResolutionHours)}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.csatCount > 0 ? (
                      <div className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {formatNumber(s.avgCsat, 2)}
                        <span className="text-xs text-muted-foreground">({s.csatCount})</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.slaCompliancePct} className="h-1.5" />
                      <span className="w-12 text-right font-mono text-xs tabular-nums">
                        {formatNumber(s.slaCompliancePct, 0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No agent data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
