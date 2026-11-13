import { STATUS_LABELS, type Ticket } from "./types"

export const DUE_LABELS = { overdue: "Past due", today: "Due today", future: "Upcoming", missing: "No due date" } as const
export type DueGroup = keyof typeof DUE_LABELS
export type SortKey = "id" | "category" | "status" | "age" | "statusDays" | "due"

// Compare local calendar dates, including on days with a daylight-saving transition.
const dayNumber = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000
export function followUpRows(tickets: Ticket[], asOf: Date) {
  const today = dayNumber(asOf)
  return tickets.filter(t => t.status !== "resolved" && t.status !== "closed").map(t => {
    const dueDay = t.dueAt ? dayNumber(t.dueAt) : null
    const group: DueGroup = dueDay === null ? "missing" : dueDay < today ? "overdue" : dueDay === today ? "today" : "future"
    return {
      id: t.id, category: t.category, status: STATUS_LABELS[t.status], subject: t.subject,
      age: t.createdAt ? today - dayNumber(t.createdAt) : null,
      statusDays: t.daysInCurrentStatus ?? null, due: t.dueAt?.getTime() ?? null, group,
    }
  })
}

type Row = ReturnType<typeof followUpRows>[number]
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
export function sortFollowUps(rows: Row[], key: SortKey, descending: boolean) {
  return [...rows].sort((a, b) => {
    const x = a[key], y = b[key]
    if (x == null || y == null) return Number(x == null) - Number(y == null) || collator.compare(a.id, b.id)
    const diff = typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x), String(y))
    return (descending ? -diff : diff) || collator.compare(a.id, b.id)
  })
}
