export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed"
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
  createdAt: Date
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
