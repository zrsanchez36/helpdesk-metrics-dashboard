"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/helpdesk/types"
import { formatHours } from "@/lib/helpdesk/statistics"
import { cn } from "@/lib/utils"

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  critical: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
  high: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  medium: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
  low: "bg-muted text-muted-foreground border-border",
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
  in_progress: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400",
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground border-border",
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
}

export function TicketsTable({ tickets, limit = 10 }: { tickets: Ticket[]; limit?: number }) {
  const rows = [...tickets]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent tickets</CardTitle>
        <CardDescription>Most recent {Math.min(limit, tickets.length)} of {tickets.length.toLocaleString()} in view</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Resolution</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{t.subject ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize font-normal", PRIORITY_STYLES[t.priority])}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-normal", STATUS_STYLES[t.status])}>
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.category}</TableCell>
                  <TableCell className="text-muted-foreground">{t.agent}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {t.resolutionTimeHours != null ? formatHours(t.resolutionTimeHours) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {t.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No tickets match the current filters.
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
