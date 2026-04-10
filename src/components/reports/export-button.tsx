"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils/csv"
import { formatCurrency, formatHours } from "@/lib/utils/format"

interface ReportRow {
  client: string
  totalHours: number
  billableHours: number
  hourlyRate: number
  amountDue: number
}

interface Props {
  rows: ReportRow[]
  monthLabel: string
}

export function ExportButton({ rows, monthLabel }: Props) {
  function handleExport() {
    const csvRows = rows.map((r) => ({
      Client: r.client,
      "Total Hours": formatHours(r.totalHours),
      "Billable Hours": formatHours(r.billableHours),
      "Hourly Rate": formatCurrency(r.hourlyRate),
      "Amount Due": formatCurrency(r.amountDue),
    }))
    exportToCsv(`report-${monthLabel}.csv`, csvRows)
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  )
}
