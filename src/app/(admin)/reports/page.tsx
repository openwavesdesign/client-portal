import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { ExportButton } from "@/components/reports/export-button"
import { formatCurrency, formatHours, monthLabel, toMonthStart } from "@/lib/utils/format"

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const startDate = toMonthStart(year, month)
  const endDate = month === 12 ? toMonthStart(year + 1, 1) : toMonthStart(year, month + 1)
  const currentMonthLabel = monthLabel(startDate)

  const supabase = await createClient()

  // Fetch all clients
  const { data: clients } = await supabase.from("clients").select("id, name, hourly_rate").order("name")

  // Fetch time entries for the period
  const { data: entries } = await supabase
    .from("time_entries")
    .select("client_id, hours, billable")
    .gte("date", startDate)
    .lt("date", endDate)

  // Calculate per-client totals
  const rows = (clients ?? []).map((client) => {
    const clientEntries = (entries ?? []).filter((e) => e.client_id === client.id)
    const totalHours = clientEntries.reduce((sum, e) => sum + e.hours, 0)
    const billableHours = clientEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
    const amountDue = billableHours * client.hourly_rate
    return {
      id: client.id,
      client: client.name,
      totalHours,
      billableHours,
      hourlyRate: client.hourly_rate,
      amountDue,
    }
  }).filter((r) => r.totalHours > 0) // Only show clients with hours this month

  const totals = {
    totalHours: rows.reduce((s, r) => s + r.totalHours, 0),
    billableHours: rows.reduce((s, r) => s + r.billableHours, 0),
    amountDue: rows.reduce((s, r) => s + r.amountDue, 0),
  }

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }) }))
  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monthly Reports</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Auto-calculated from time entries
          </p>
        </div>
        <ExportButton rows={rows} monthLabel={`${year}-${String(month).padStart(2, "0")}`} />
      </div>

      {/* Month/Year selector */}
      <div className="flex items-center gap-3">
        <form className="flex items-center gap-3">
          <select
            name="month"
            defaultValue={month}
            className="h-9 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set("month", e.target.value)
              window.location.href = url.toString()
            }}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year}
            className="h-9 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set("year", e.target.value)
              window.location.href = url.toString()
            }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </form>
        <span className="text-[hsl(var(--muted-foreground))] text-sm">{currentMonthLabel}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Hours</p>
            <p className="text-2xl font-semibold mt-1">{formatHours(totals.totalHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Billable Hours</p>
            <p className="text-2xl font-semibold mt-1">{formatHours(totals.billableHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Amount Due</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(totals.amountDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Report table */}
      <div className="rounded-md border border-[hsl(var(--border))]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right">Billable Hours</TableHead>
              <TableHead className="text-right">Hourly Rate</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No time entries for {currentMonthLabel}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.client}</TableCell>
                  <TableCell className="text-right">{formatHours(row.totalHours)}</TableCell>
                  <TableCell className="text-right">{formatHours(row.billableHours)}</TableCell>
                  <TableCell className="text-right">
                    {row.hourlyRate === 0 ? "Project-based" : formatCurrency(row.hourlyRate) + "/hr"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.hourlyRate === 0 ? "—" : formatCurrency(row.amountDue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{formatHours(totals.totalHours)}</TableCell>
                <TableCell className="text-right font-semibold">{formatHours(totals.billableHours)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(totals.amountDue)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
