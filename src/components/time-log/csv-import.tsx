"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Client, Project, TimeEntryInsert, TimeEntryCategory } from "@/lib/types/database.types"
import { TIME_ENTRY_CATEGORIES } from "@/lib/types/database.types"
import { importTimeEntries } from "@/app/(admin)/time-log/actions"

interface ParsedRow {
  row: number
  raw: Record<string, string>
  entry?: TimeEntryInsert
  errors: string[]
}

interface Props {
  clients: Client[]
  projects: Project[]
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export function CsvImport({ clients, projects }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const validRows = rows.filter((r: ParsedRow) => r.errors.length === 0)
  const invalidRows = rows.filter((r: ParsedRow) => r.errors.length > 0)

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

    return lines.slice(1).map((line, i) => {
      const values = splitCsvLine(line)
      const raw: Record<string, string> = {}
      headers.forEach((h, j) => {
        raw[h] = (values[j] ?? "").trim()
      })

      const errors: string[] = []

      if (!raw.date) errors.push("date is required")
      if (!raw.client) errors.push("client is required")
      if (!raw.description) errors.push("description is required")
      if (!raw.hours) errors.push("hours is required")

      const dateValid =
        raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) && !isNaN(Date.parse(raw.date))
      if (raw.date && !dateValid) errors.push(`invalid date "${raw.date}" — use YYYY-MM-DD`)

      const hours = parseFloat(raw.hours)
      if (raw.hours && (isNaN(hours) || hours <= 0))
        errors.push(`invalid hours "${raw.hours}"`)

      const client = raw.client
        ? clients.find((c) => c.name.toLowerCase() === raw.client.toLowerCase())
        : undefined
      if (raw.client && !client) errors.push(`unknown client "${raw.client}"`)

      const category = raw.category
        ? (TIME_ENTRY_CATEGORIES.find(
            (c) => c.toLowerCase() === raw.category.toLowerCase()
          ) as TimeEntryCategory | undefined)
        : undefined
      if (raw.category && !category)
        errors.push(
          `invalid category "${raw.category}" — must be one of: ${TIME_ENTRY_CATEGORIES.join(", ")}`
        )

      const project =
        raw.project && client
          ? projects.find(
              (p) =>
                p.client_id === client.id &&
                p.name.toLowerCase() === raw.project.toLowerCase()
            )
          : undefined
      if (raw.project && client && !project)
        errors.push(`unknown project "${raw.project}" for client "${raw.client}"`)

      const billable = raw.billable?.toLowerCase() === "true"

      const entry: TimeEntryInsert | undefined =
        errors.length === 0 && client
          ? {
              client_id: client.id,
              project_id: project?.id ?? null,
              date: raw.date,
              description: raw.description,
              hours,
              billable,
              category: category ?? null,
            }
          : undefined

      return { row: i + 2, raw, entry, errors }
    })
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const entries = validRows.map((r: ParsedRow) => r.entry!)
    if (entries.length === 0) return
    setImporting(true)
    try {
      await importTimeEntries(entries)
      toast.success(
        `Imported ${entries.length} time ${entries.length === 1 ? "entry" : "entries"}`
      )
      handleOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setRows([])
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Time Entries</DialogTitle>
            <DialogDescription>
              CSV must have headers:{" "}
              <code className="text-xs">date</code>,{" "}
              <code className="text-xs">client</code>,{" "}
              <code className="text-xs">description</code>,{" "}
              <code className="text-xs">hours</code>.{" "}
              Optional:{" "}
              <code className="text-xs">billable</code> (true/false),{" "}
              <code className="text-xs">category</code>,{" "}
              <code className="text-xs">project</code>.{" "}
              Dates must be YYYY-MM-DD. Client names must match exactly.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[hsl(var(--border))] file:bg-[hsl(var(--muted))] file:text-sm file:font-medium hover:file:bg-[hsl(var(--accent))] cursor-pointer"
            />

            {rows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">{validRows.length} ready</span>
                  {invalidRows.length > 0 && (
                    <span className="text-red-600 font-medium">
                      {invalidRows.length} with errors
                    </span>
                  )}
                </div>

                <div className="rounded border border-[hsl(var(--border))] overflow-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="bg-[hsl(var(--muted))] sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Row</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Client</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Hrs</th>
                        <th className="text-left p-2 font-medium">Billable</th>
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {rows.map((r: ParsedRow) => (
                        <tr
                          key={r.row}
                          className={
                            r.errors.length > 0
                              ? "bg-red-50 dark:bg-red-950/20"
                              : ""
                          }
                        >
                          <td className="p-2 text-[hsl(var(--muted-foreground))]">{r.row}</td>
                          <td className="p-2">{r.raw.date}</td>
                          <td className="p-2">{r.raw.client}</td>
                          <td className="p-2 max-w-40 truncate" title={r.raw.description}>
                            {r.raw.description}
                          </td>
                          <td className="p-2">{r.raw.hours}</td>
                          <td className="p-2">{r.raw.billable || "false"}</td>
                          <td className="p-2">{r.raw.category || "—"}</td>
                          <td className="p-2">
                            {r.errors.length > 0 ? (
                              <span
                                className="text-red-600"
                                title={r.errors.join("\n")}
                              >
                                {r.errors[0]}
                                {r.errors.length > 1 && (
                                  <span className="text-red-400">
                                    {" "}(+{r.errors.length - 1} more)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-green-600">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
            >
              {importing
                ? "Importing…"
                : `Import ${validRows.length} ${validRows.length === 1 ? "entry" : "entries"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
