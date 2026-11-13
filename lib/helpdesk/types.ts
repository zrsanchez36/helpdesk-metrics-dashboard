export const STATUS_LABELS = {
  open: "Open",
  in_progress: "In progress",
  pending: "Pending",
  waiting_on_user: "Waiting on User",
  resolved: "Resolved",
  closed: "Closed",
} as const
export type TicketStatus = keyof typeof STATUS_LABELS
export const TICKET_STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[]
export type TicketPriority = "low" | "medium" | "high" | "critical"

export interface Ticket {
  id: string
  subject?: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  agent: string
  requester?: string
  channel?: string
  createdAt: Date | null
  dueAt?: Date | null
  daysInCurrentStatus?: number | null
  resolvedAt?: Date | null
  firstResponseAt?: Date | null
  resolutionTimeHours?: number | null
  firstResponseTimeHours?: number | null
  csatScore?: number | null // 1-5
  slaBreached?: boolean
}

export interface ParsedDataset {
  fileName: string
  fileType: string
  tickets: Ticket[]
  rawRowCount: number
  parsedRowCount: number
  warnings: string[]
}
