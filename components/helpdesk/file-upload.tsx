"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, FileSpreadsheet, FileText, FileCode, Database, X, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { parseFile } from "@/lib/helpdesk/parsers"
import type { ParsedDataset } from "@/lib/helpdesk/types"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onParsed: (dataset: ParsedDataset) => void
  onError: (msg: string) => void
  compact?: boolean
}

const ACCEPTED = ".csv,.tsv,.xlsx,.xls,.json,.sql"

export function FileUpload({ onParsed, onError, compact = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setLoading(true)
      try {
        // Process all dropped/selected files sequentially
        for (const file of Array.from(files)) {
          const result = await parseFile(file)
          onParsed(result)
        }
      } catch (e) {
        onError((e as Error).message)
      } finally {
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [onParsed, onError],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
          Add file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors",
        isDragging ? "border-foreground bg-accent" : "border-border hover:border-foreground/40",
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-foreground text-background">
        {loading ? <Spinner className="size-6" /> : <Upload className="size-6" />}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">
        {loading ? "Parsing your data..." : "Drop one or more data files"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Upload your helpdesk export and we&apos;ll auto-detect columns, normalize values, and generate metrics. You can
        add multiple files — they&apos;ll be compiled and deduplicated automatically.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <FileText className="size-3.5" /> CSV / TSV
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <FileSpreadsheet className="size-3.5" /> Excel
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <FileCode className="size-3.5" /> JSON
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <Database className="size-3.5" /> SQL
        </span>
      </div>

      <Button onClick={() => inputRef.current?.click()} disabled={loading} className="mt-6 gap-2">
        <Upload className="size-4" />
        Choose files
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/5">
          <span className="rounded-md bg-foreground px-3 py-1 text-sm text-background">Release to upload</span>
        </div>
      )}
    </div>
  )
}

export function DatasetSources({
  datasets,
  uniqueCount,
  onRemove,
  onClear,
}: {
  datasets: ParsedDataset[]
  uniqueCount: number
  onRemove: (index: number) => void
  onClear: () => void
}) {
  const totalRaw = datasets.reduce((s, d) => s + d.parsedRowCount, 0)
  const dupes = totalRaw - uniqueCount
  const totalWarnings = datasets.reduce((s, d) => s + d.warnings.length, 0)

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Layers className="size-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">
              {uniqueCount.toLocaleString()} tickets
              {datasets.length > 1 && <span className="ml-1 text-muted-foreground font-normal">across {datasets.length} files</span>}
            </p>
            {dupes > 0 && (
              <p className="text-xs text-muted-foreground">{dupes.toLocaleString()} duplicate IDs merged</p>
            )}
            {totalWarnings > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{totalWarnings} parsing warning(s)</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground">
          <X className="size-3.5" />
          Clear all
        </Button>
      </div>

      <div className="space-y-1">
        {datasets.map((ds, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-1.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileSpreadsheet className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{ds.fileName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {ds.fileType} · {ds.parsedRowCount.toLocaleString()} tickets
                  {ds.warnings.length > 0 && ` · ${ds.warnings.length} warning(s)`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(i)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
