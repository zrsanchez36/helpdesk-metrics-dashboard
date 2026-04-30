export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function mode(values: number[]): number[] {
  if (values.length === 0) return []
  const counts = new Map<number, number>()
  for (const v of values) {
    const rounded = Math.round(v * 10) / 10
    counts.set(rounded, (counts.get(rounded) || 0) + 1)
  }
  let max = 0
  for (const c of counts.values()) if (c > max) max = c
  if (max <= 1) return []
  const modes: number[] = []
  for (const [k, c] of counts.entries()) if (c === max) modes.push(k)
  return modes.sort((a, b) => a - b)
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const m = mean(values)
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

export function min(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

export function max(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values)
}

export function formatHours(hours: number): string {
  if (!isFinite(hours) || isNaN(hours)) return "—"
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = hours / 24
  return `${days.toFixed(1)}d`
}

export function formatNumber(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "—"
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}
