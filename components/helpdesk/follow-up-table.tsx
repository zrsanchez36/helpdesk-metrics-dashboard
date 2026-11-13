"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/lib/helpdesk/types"
import { DUE_LABELS, followUpRows, sortFollowUps, type DueGroup, type SortKey } from "@/lib/helpdesk/follow-up"

const columns: [SortKey, string][] = [
  ["id", "Ticket #"], ["category", "Category"], ["status", "Status"],
  ["age", "Days since creation"], ["statusDays", "Days in current status"], ["due", "Due date"],
]
const groups: ("all" | DueGroup)[] = ["all", "overdue", "today", "future", "missing"]
const pageSize = 15
const dateFormat = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

export function FollowUpTable({ tickets }: { tickets: Ticket[] }) {
  const [asOf, setAsOf] = useState(() => {
    const now = new Date()
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
  })
  const [group, setGroup] = useState<"all" | DueGroup>("all")
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "due", desc: false })
  const [page, setPage] = useState(0)
  const rows = useMemo(() => followUpRows(tickets, new Date(asOf + "T12:00:00")), [tickets, asOf])
  const counts = useMemo(() => {
    const n = { all: rows.length, overdue: 0, today: 0, future: 0, missing: 0 }
    for (const row of rows) n[row.group]++
    return n
  }, [rows])
  const sorted = useMemo(() => sortFollowUps(group === "all" ? rows : rows.filter(r => r.group === group), sort.key, sort.desc), [rows, group, sort])
  const lastPage = Math.max(0, Math.ceil(sorted.length / pageSize) - 1)
  const start = Math.min(page, lastPage) * pageSize
  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><CardTitle>Follow-up queue</CardTitle>
          <CardDescription className="mt-1">Unresolved tickets. Status duration is from the export; age and due dates are compared by calendar day.</CardDescription>
        </div>
        <label className="text-sm">Compare dates as of <input type="date" className="rounded-md border bg-background px-2 py-1" value={asOf}
          onChange={e => { if (e.target.value && e.target.validity.valid) { setAsOf(e.target.value); setPage(0) } }} /></label>
      </div>
      <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Due date filters">
        {groups.map(g => <Button key={g} variant={group === g ? "default" : "outline"} size="sm" aria-pressed={group === g}
          onClick={() => { setGroup(g); setPage(0) }}>{g === "all" ? "All" : DUE_LABELS[g]} ({counts[g]})</Button>)}
      </div>
    </CardHeader>
    <CardContent>
      <Table><TableHeader><TableRow>{columns.map(([key, title]) => {
        const active = sort.key === key
        const Icon = active ? sort.desc ? ArrowDown : ArrowUp : ArrowUpDown
        return <TableHead key={key} aria-sort={active ? sort.desc ? "descending" : "ascending" : undefined}>
          <button className="inline-flex items-center gap-1 whitespace-nowrap" onClick={() => {
            setSort({ key, desc: active ? !sort.desc : key === "age" || key === "statusDays" }); setPage(0)
          }}>{title}<Icon aria-hidden className="size-3" /></button>
        </TableHead>
      })}</TableRow></TableHeader>
      <TableBody>{sorted.slice(start, start + pageSize).map(r => <TableRow key={r.id}>
        <TableCell title={r.subject} className="font-mono">{r.id}</TableCell><TableCell>{r.category}</TableCell><TableCell>{r.status}</TableCell>
        <TableCell>{r.age === null || r.age < 0 ? "—" : r.age}</TableCell><TableCell>{r.statusDays ?? "—"}</TableCell>
        <TableCell>{r.due === null ? "—" : dateFormat.format(r.due)}</TableCell>
      </TableRow>)}
      {!sorted.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No unresolved tickets match these filters.</TableCell></TableRow>}
      </TableBody></Table>
      {sorted.length > 0 && <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
        {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
        <Button size="icon" variant="outline" aria-label="Previous page" disabled={!start} onClick={() => setPage(start / pageSize - 1)}><ChevronLeft /></Button>
        <Button size="icon" variant="outline" aria-label="Next page" disabled={start / pageSize >= lastPage} onClick={() => setPage(start / pageSize + 1)}><ChevronRight /></Button>
      </div>}
    </CardContent>
  </Card>
}
