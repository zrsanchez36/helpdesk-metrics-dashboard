"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"

export interface FilterState {
  agent: string
  priority: string
  category: string
  status: string
  range: string
}

export const DEFAULT_FILTERS: FilterState = {
  agent: "all",
  priority: "all",
  category: "all",
  status: "all",
  range: "all",
}

interface FiltersProps {
  state: FilterState
  setState: (s: FilterState) => void
  agents: string[]
  categories: string[]
}

export function Filters({ state, setState, agents, categories }: FiltersProps) {
  const update = (k: keyof FilterState, v: string) => setState({ ...state, [k]: v })
  const isFiltered = Object.values(state).some((v) => v !== "all")

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Filter className="size-4" />
        Filters
      </div>

      <Select value={state.range} onValueChange={(v) => update("range", v)}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      <Select value={state.priority} onValueChange={(v) => update("priority", v)}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={state.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={state.category} onValueChange={(v) => update("category", v)}>
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.agent} onValueChange={(v) => update("agent", v)}>
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All agents</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={() => setState(DEFAULT_FILTERS)} className="h-8 gap-1.5">
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  )
}
