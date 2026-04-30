import type { Ticket, TicketPriority, TicketStatus } from "./types"

const AGENTS = [
  "Alex Morgan",
  "Priya Patel",
  "Jamal Carter",
  "Sofia Rossi",
  "Liam O'Brien",
  "Yuki Tanaka",
  "Marcus Webb",
  "Elena Vasquez",
]
const CATEGORIES = [
  "Network",
  "Hardware",
  "Software",
  "Account Access",
  "Email",
  "Printing",
  "VPN",
  "Security",
  "Mobile Device",
]
const CHANNELS = ["Email", "Phone", "Portal", "Chat", "Walk-in"]
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "critical"]
const STATUSES: TicketStatus[] = ["open", "in_progress", "pending", "resolved", "closed"]
const SUBJECTS = [
  "Cannot connect to VPN",
  "Outlook crashes on launch",
  "Password reset required",
  "Printer offline",
  "Slow laptop performance",
  "Wi-Fi keeps disconnecting",
  "Software license expired",
  "Phishing email reported",
  "Monitor not detected",
  "MFA token issue",
  "Shared drive inaccessible",
  "Application won't update",
]

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateSampleTickets(count = 240): Ticket[] {
  const rng = mulberry32(42)
  const tickets: Ticket[] = []
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 60)

  for (let i = 0; i < count; i++) {
    const created = new Date(start.getTime() + rng() * (now.getTime() - start.getTime()))
    const priority = pick(PRIORITIES, rng)

    // Resolution time biased by priority
    const baseHours = priority === "critical" ? 2 : priority === "high" ? 6 : priority === "medium" ? 14 : 28
    const resolutionTimeHours = Math.max(0.25, baseHours * (0.4 + rng() * 1.6))

    // 80% are resolved/closed
    const isResolved = rng() < 0.8
    const status: TicketStatus = isResolved
      ? rng() < 0.6
        ? "resolved"
        : "closed"
      : pick<TicketStatus>(["open", "in_progress", "pending"], rng)

    const resolvedAt = isResolved ? new Date(created.getTime() + resolutionTimeHours * 3600 * 1000) : null

    const firstResponseTimeHours = Math.max(0.05, resolutionTimeHours * (0.05 + rng() * 0.3))
    const firstResponseAt = new Date(created.getTime() + firstResponseTimeHours * 3600 * 1000)

    // SLA targets (hours) by priority
    const slaTarget = priority === "critical" ? 4 : priority === "high" ? 8 : priority === "medium" ? 24 : 72
    const slaBreached = isResolved ? resolutionTimeHours > slaTarget : false

    // CSAT only for resolved tickets, ~70% have a score
    let csatScore: number | null = null
    if (isResolved && rng() < 0.7) {
      // Biased towards higher scores
      const r = rng()
      csatScore = r < 0.5 ? 5 : r < 0.8 ? 4 : r < 0.93 ? 3 : r < 0.98 ? 2 : 1
    }

    tickets.push({
      id: `TKT-${(10000 + i).toString()}`,
      subject: pick(SUBJECTS, rng),
      status,
      priority,
      category: pick(CATEGORIES, rng),
      agent: pick(AGENTS, rng),
      requester: `user${Math.floor(rng() * 200) + 1}@company.com`,
      channel: pick(CHANNELS, rng),
      createdAt: created,
      resolvedAt,
      firstResponseAt,
      resolutionTimeHours: isResolved ? resolutionTimeHours : null,
      firstResponseTimeHours,
      csatScore,
      slaBreached,
    })
  }

  return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
