import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { InvoiceFields } from "@/components/billing/invoice-fields"
import { BillingFilters } from "@/components/billing/billing-filters"
import { formatCurrency, formatHours, formatDate, monthLabel, toMonthStart } from "@/lib/utils/format"
import type { Client, TimeEntry, BillingRecord } from "@/lib/types/database.types"

interface Props {
  searchParams: Promise<{ client?: string; year?: string; month?: string }>
}

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const now = new Date()

  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const { data: clients } = await supabase.from("clients").select("*").order("name")
  const activeClients = (clients ?? []) as Client[]

  const selectedClientId = params.client ?? activeClients[0]?.id ?? ""
  const selectedClient = activeClients.find((c) => c.id === selectedClientId)

  const monthStart = toMonthStart(year, month)
  const monthEnd = month === 12 ? toMonthStart(year + 1, 1) : toMonthStart(year, month + 1)

  // Fetch time entries and billing record for selected client + month
  const [{ data: entries }, { data: billingRecords }, { data: ytdEntries }, { data: ytdBilling }] =
    await Promise.all([
      selectedClientId
        ? supabase
            .from("time_entries")
            .select("*")
            .eq("client_id", selectedClientId)
            .gte("date", monthStart)
            .lt("date", monthEnd)
            .order("date")
        : Promise.resolve({ data: [] }),
      selectedClientId
        ? supabase
            .from("billing_records")
            .select("*")
            .eq("client_id", selectedClientId)
            .eq("month", monthStart)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // YTD data
      selectedClientId
        ? supabase
            .from("time_entries")
            .select("hours, billable")
            .eq("client_id", selectedClientId)
            .gte("date", `${year}-01-01`)
            .lt("date", `${year + 1}-01-01`)
        : Promise.resolve({ data: [] }),
      selectedClientId
        ? supabase
            .from("billing_records")
            .select("*")
            .eq("client_id", selectedClientId)
            .gte("month", `${year}-01-01`)
            .lt("month", `${year + 1}-01-01`)
        : Promise.resolve({ data: [] }),
    ])

  const typedEntries = (entries ?? []) as TimeEntry[]
  const billingRecord = billingRecords as BillingRecord | null

  // YTD calculations
  const ytdTotalHours = (ytdEntries ?? []).reduce((s: number, e: { hours: number }) => s + e.hours, 0)
  const ytdBillableHours = (ytdEntries ?? []).filter((e: { billable: boolean }) => e.billable).reduce((s: number, e: { hours: number }) => s + e.hours, 0)
  const ytdBilledAmount = (ytdBilling ?? []).filter((b: BillingRecord) => b.invoiced).reduce(() => {
    // We'd need to join with entries to compute this properly; approximate using billable hours × rate
    return 0
  }, 0)

  const ytdTotalBilled = (ytdBillableHours * (selectedClient?.hourly_rate ?? 0))
  const ytdTotalPaid = (ytdBilling ?? []).filter((b: BillingRecord) => b.paid).length > 0
    ? ytdTotalBilled
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Per-client billing and invoice tracking
        </p>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-3 flex-wrap">
        <BillingFilters
          clients={activeClients}
          selectedClientId={selectedClientId}
          year={year}
          month={month}
        />
        {selectedClient && (
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {selectedClient.name} — {monthLabel(monthStart)}
          </span>
        )}
      </div>

      {!selectedClient ? (
        <p className="text-[hsl(var(--muted-foreground))]">Select a client to view billing.</p>
      ) : (
        <>
          {/* Task list */}
          <Card>
            <div className="p-4 border-b border-[hsl(var(--border))]">
              <h3 className="font-semibold text-sm">Time Entries — {monthLabel(monthStart)}</h3>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))] py-6">
                        No entries for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    typedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-sm">{entry.description}</TableCell>
                        <TableCell className="text-right text-sm">{formatHours(entry.hours)}</TableCell>
                        <TableCell>
                          <Badge variant={entry.billable ? "success" : "outline"} className="text-xs">
                            {entry.billable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {entry.billable
                            ? formatCurrency(entry.hours * selectedClient.hourly_rate)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <InvoiceFields
            client={selectedClient}
            month={monthStart}
            entries={typedEntries}
            billingRecord={billingRecord}
          />

          {/* YTD summary */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Year-to-Date Summary ({year})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Hours</p>
                  <p className="text-xl font-semibold mt-1">{formatHours(ytdTotalHours)}</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Billable Hours</p>
                  <p className="text-xl font-semibold mt-1">{formatHours(ytdBillableHours)}</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Billed</p>
                  <p className="text-xl font-semibold mt-1">{formatCurrency(ytdTotalBilled)}</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Outstanding</p>
                  <p className="text-xl font-semibold mt-1">{formatCurrency(ytdTotalBilled - ytdTotalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
