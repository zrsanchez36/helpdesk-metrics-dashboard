import Papa from "papaparse"
import * as XLSX from "xlsx"
import type { ParsedDataset, Ticket, TicketPriority, TicketStatus } from "./types"

const PRIORITY_MAP: Record<string, TicketPriority> = {
  low: "low",
  l: "low",
  "1": "low",
  p4: "low",
  medium: "medium",
  med: "medium",
  m: "medium",
  normal: "medium",
  "2": "medium",
  p3: "medium",
  high: "high",
  h: "high",
  "3": "high",
  p2: "high",
  critical: "critical",
  crit: "critical",
  urgent: "critical",
  c: "critical",
  "4": "critical",
  p1: "critical",
}

const STATUS_MAP: Record<string, TicketStatus> = {
  open: "open",
  new: "open",
  "in progress": "in_progress",
  in_progress: "in_progress",
  inprogress: "in_progress",
  working: "in_progress",
  pending: "pending",
  waiting: "pending",
  hold: "pending",
  on_hold: "pending",
  resolved: "resolved",
  done: "resolved",
  fixed: "resolved",
  closed: "closed",
  complete: "closed",
  completed: "closed",
}

const FIELD_ALIASES: Record<keyof Ticket, string[]> = {
  id: ["id", "ticket_id", "ticketid", "ticket", "number", "ref", "reference", "case_id", "case"],
  subject: ["subject", "title", "summary", "description", "issue", "problem"],
  status: ["status", "state", "ticket_status"],
  priority: ["priority", "severity", "urgency", "level"],
  category: ["category", "type", "topic", "issue_type", "classification", "department"],
  agent: ["agent", "assignee", "assigned_to", "owner", "technician", "handler", "rep"],
  requester: ["requester", "reporter", "user", "customer", "submitter", "email", "user_email"],
  channel: ["channel", "source", "origin", "via"],
  createdAt: ["created_at", "createdat", "created", "open_date", "opened_at", "date_created", "submitted_at", "date"],
  resolvedAt: ["resolved_at", "resolvedat", "resolved", "closed_at", "closedat", "completion_date", "date_resolved"],
  firstResponseAt: ["first_response_at", "first_response", "firstresponse", "responded_at", "first_reply_at"],
  resolutionTimeHours: ["resolution_time", "resolution_hours", "time_to_resolve", "ttr", "resolution"],
  firstResponseTimeHours: ["first_response_time", "response_time", "ttfr", "first_response_hours"],
  csatScore: ["csat", "csat_score", "satisfaction", "rating", "score", "feedback"],
  slaBreached: ["sla_breached", "sla", "breached", "sla_violated"],
}

function normalizeKey(k: string): string {
  return k.toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_")
}

function buildKeyMap(headers: string[]): Map<keyof Ticket, string> {
  const map = new Map<keyof Ticket, string>()
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeKey(h) }))
  for (const field of Object.keys(FIELD_ALIASES) as (keyof Ticket)[]) {
    const aliases = FIELD_ALIASES[field]
    const found = normalizedHeaders.find((h) => aliases.includes(h.normalized))
    if (found) map.set(field, found.original)
  }
  return map
}

function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === "number") {
    // Excel serial date
    if (v > 25569 && v < 60000) {
      const ms = (v - 25569) * 86400 * 1000
      const d = new Date(ms)
      if (!isNaN(d.getTime())) return d
    }
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function parseNumber(v: unknown): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return isNaN(v) ? null : v
  const cleaned = String(v).replace(/[^\d.\-]/g, "")
  if (!cleaned) return null
  const n = Number.parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseBool(v: unknown): boolean | undefined {
  if (v == null || v === "") return undefined
  if (typeof v === "boolean") return v
  const s = String(v).trim().toLowerCase()
  if (["true", "yes", "y", "1", "breached"].includes(s)) return true
  if (["false", "no", "n", "0", "ok", "met"].includes(s)) return false
  return undefined
}

function rowsToTickets(rows: Record<string, unknown>[], warnings: string[]): Ticket[] {
  if (rows.length === 0) return []
  const headers = Object.keys(rows[0])
  const keyMap = buildKeyMap(headers)

  if (!keyMap.has("createdAt")) warnings.push("No 'created at' column detected — using row order for time series.")
  if (!keyMap.has("priority")) warnings.push("No 'priority' column detected — defaulting to 'medium'.")
  if (!keyMap.has("status")) warnings.push("No 'status' column detected — defaulting to 'open'.")

  const tickets: Ticket[] = []
  rows.forEach((row, idx) => {
    const get = (f: keyof Ticket) => {
      const k = keyMap.get(f)
      return k ? row[k] : undefined
    }

    const id = String(get("id") ?? `ROW-${idx + 1}`)
    const priorityRaw = String(get("priority") ?? "medium")
      .toLowerCase()
      .trim()
    const priority: TicketPriority = PRIORITY_MAP[priorityRaw] ?? "medium"

    const statusRaw = String(get("status") ?? "open")
      .toLowerCase()
      .trim()
    const status: TicketStatus = STATUS_MAP[statusRaw] ?? "open"

    const createdAt = parseDate(get("createdAt")) ?? new Date(Date.now() - (rows.length - idx) * 3600 * 1000)
    const resolvedAt = parseDate(get("resolvedAt"))
    const firstResponseAt = parseDate(get("firstResponseAt"))

    let resolutionTimeHours = parseNumber(get("resolutionTimeHours"))
    if (resolutionTimeHours == null && resolvedAt) {
      resolutionTimeHours = (resolvedAt.getTime() - createdAt.getTime()) / 3600000
    }

    let firstResponseTimeHours = parseNumber(get("firstResponseTimeHours"))
    if (firstResponseTimeHours == null && firstResponseAt) {
      firstResponseTimeHours = (firstResponseAt.getTime() - createdAt.getTime()) / 3600000
    }

    const csatScore = parseNumber(get("csatScore"))
    const slaBreached = parseBool(get("slaBreached"))

    tickets.push({
      id,
      subject: get("subject") ? String(get("subject")) : undefined,
      status,
      priority,
      category: get("category") ? String(get("category")) : "Uncategorized",
      agent: get("agent") ? String(get("agent")) : "Unassigned",
      requester: get("requester") ? String(get("requester")) : undefined,
      channel: get("channel") ? String(get("channel")) : undefined,
      createdAt,
      resolvedAt,
      firstResponseAt,
      resolutionTimeHours: resolutionTimeHours != null ? Math.max(0, resolutionTimeHours) : null,
      firstResponseTimeHours: firstResponseTimeHours != null ? Math.max(0, firstResponseTimeHours) : null,
      csatScore: csatScore != null ? Math.max(1, Math.min(5, csatScore)) : null,
      slaBreached,
    })
  })
  return tickets
}

async function parseCSV(file: File): Promise<{ rows: Record<string, unknown>[]; rawCount: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        resolve({ rows: result.data as Record<string, unknown>[], rawCount: result.data.length })
      },
      error: (err) => reject(err),
    })
  })
}

async function parseExcel(file: File): Promise<{ rows: Record<string, unknown>[]; rawCount: number }> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array", cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  return { rows, rawCount: rows.length }
}

async function parseJSON(file: File): Promise<{ rows: Record<string, unknown>[]; rawCount: number }> {
  const text = await file.text()
  const data = JSON.parse(text)
  let rows: Record<string, unknown>[] = []
  if (Array.isArray(data)) rows = data
  else if (data && typeof data === "object") {
    const arrayKey = Object.keys(data).find((k) => Array.isArray((data as Record<string, unknown>)[k]))
    if (arrayKey) rows = (data as Record<string, unknown>)[arrayKey] as Record<string, unknown>[]
    else rows = [data as Record<string, unknown>]
  }
  return { rows, rawCount: rows.length }
}

/** Very lightweight SQL parser: extracts INSERT INTO ... VALUES (...), (...) rows */
async function parseSQL(file: File): Promise<{ rows: Record<string, unknown>[]; rawCount: number }> {
  const text = await file.text()
  const rows: Record<string, unknown>[] = []

  const insertRegex = /insert\s+into\s+[`"\[]?(\w+)[`"\]]?\s*\(([^)]+)\)\s*values\s*([\s\S]+?);/gi
  let match: RegExpExecArray | null
  while ((match = insertRegex.exec(text)) !== null) {
    const cols = match[2].split(",").map((c) => c.trim().replace(/[`"\[\]]/g, ""))
    const valuesStr = match[3]
    // Tokenize value tuples
    const tuples: string[] = []
    let depth = 0
    let current = ""
    let inString = false
    let stringChar = ""
    for (let i = 0; i < valuesStr.length; i++) {
      const ch = valuesStr[i]
      if (inString) {
        current += ch
        if (ch === stringChar && valuesStr[i - 1] !== "\\") inString = false
        continue
      }
      if (ch === "'" || ch === '"') {
        inString = true
        stringChar = ch
        current += ch
        continue
      }
      if (ch === "(") {
        if (depth === 0) current = ""
        else current += ch
        depth++
      } else if (ch === ")") {
        depth--
        if (depth === 0) {
          tuples.push(current)
          current = ""
        } else current += ch
      } else if (depth > 0) {
        current += ch
      }
    }

    for (const tuple of tuples) {
      const values = splitSqlValues(tuple)
      const row: Record<string, unknown> = {}
      cols.forEach((c, i) => {
        row[c] = values[i] ?? null
      })
      rows.push(row)
    }
  }
  return { rows, rawCount: rows.length }
}

function splitSqlValues(tuple: string): unknown[] {
  const out: unknown[] = []
  let current = ""
  let inString = false
  let stringChar = ""
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i]
    if (inString) {
      if (ch === stringChar && tuple[i - 1] !== "\\") {
        inString = false
      } else {
        current += ch
      }
      continue
    }
    if (ch === "'" || ch === '"') {
      inString = true
      stringChar = ch
      continue
    }
    if (ch === ",") {
      out.push(coerceSqlValue(current.trim()))
      current = ""
    } else {
      current += ch
    }
  }
  if (current.trim()) out.push(coerceSqlValue(current.trim()))
  return out
}

function coerceSqlValue(s: string): unknown {
  if (s === "" || s.toUpperCase() === "NULL") return null
  if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10)
  if (/^-?\d+\.\d+$/.test(s)) return Number.parseFloat(s)
  return s
}

export async function parseFile(file: File): Promise<ParsedDataset> {
  const name = file.name.toLowerCase()
  const warnings: string[] = []
  let rawCount = 0
  let rows: Record<string, unknown>[] = []
  let fileType = "unknown"

  try {
    if (name.endsWith(".csv") || name.endsWith(".tsv")) {
      fileType = "CSV"
      ;({ rows, rawCount } = await parseCSV(file))
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      fileType = "Excel"
      ;({ rows, rawCount } = await parseExcel(file))
    } else if (name.endsWith(".json")) {
      fileType = "JSON"
      ;({ rows, rawCount } = await parseJSON(file))
    } else if (name.endsWith(".sql")) {
      fileType = "SQL"
      ;({ rows, rawCount } = await parseSQL(file))
    } else {
      throw new Error(`Unsupported file type: ${file.name}. Use CSV, TSV, XLSX, XLS, JSON, or SQL.`)
    }
  } catch (e) {
    throw new Error(`Failed to parse ${file.name}: ${(e as Error).message}`)
  }

  if (rows.length === 0) {
    throw new Error(`No rows found in ${file.name}.`)
  }

  const tickets = rowsToTickets(rows, warnings)

  return {
    fileName: file.name,
    fileType,
    tickets,
    rawRowCount: rawCount,
    parsedRowCount: tickets.length,
    warnings,
  }
}
