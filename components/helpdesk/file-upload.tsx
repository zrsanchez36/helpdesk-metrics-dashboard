"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, FileSpreadsheet, FileText, FileCode, Database, X } from "lucide-react"
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
        const result = await parseFile(files[0])
        onParsed(result)
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
          Upload data
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
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
        {loading ? "Parsing your data..." : "Drop a data file to begin"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Upload your helpdesk export and we&apos;ll auto-detect columns, normalize values, and generate metrics.
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
        Choose file
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
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

export function DatasetSummary({ dataset, onClear }: { dataset: ParsedDataset; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
          <FileSpreadsheet className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{dataset.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {dataset.fileType} · {dataset.parsedRowCount.toLocaleString()} tickets parsed
            {dataset.warnings.length > 0 && ` · ${dataset.warnings.length} warning(s)`}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
        <X className="size-4" />
        Clear
      </Button>
    </div>
  )
}
