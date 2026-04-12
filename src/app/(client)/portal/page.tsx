import { redirect } from "next/navigation"
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
import { formatCurrency, formatHours, formatDate, monthLabel, toMonthStart } from "@/lib/utils/format"
import type { Client, TimeEntry, BillingRecord, UserProfile } from "@/lib/types/database.types"

export default async function PortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user profile with linked client
  const { data: profile } = await supabase
    .from("users")
    .select("role, client_id")
    .eq("id", user.id)
    .single()

  if (!profile?.client_id) {
    return (
      <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-6 text-center">
        <p className="text-[hsl(var(--destructive))] font-medium">No client linked to your account.</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Please contact your administrator.
        </p>
      </div>
    )
  }

  // Fetch the client record (RLS ensures this is the correct client)
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", profile.client_id)
    .single()

  if (!client) {
    return (
      <p className="text-[hsl(var(--muted-foreground))]">Client not found.</p>
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = toMonthStart(year, month)
  const monthEnd = month === 12 ? toMonthStart(year + 1, 1) : toMonthStart(year, month + 1)

  // Fetch time entries for current month (RLS-scoped to this client)
  const { data: entries } = await supabase
    .from("time_entries")
    .select("*")
    .gte("date", monthStart)
    .lt("date", monthEnd)
    .order("date")

  // Fetch billing records for invoice history (RLS-scoped to this client)
  const { data: billingHistory } = await supabase
    .from("billing_records")
    .select("*")
    .order("month", { ascending: false })
    .limit(24)

  const typedEntries = (entries ?? []) as TimeEntry[]
  const typedBilling = (billingHistory ?? []) as BillingRecord[]

  const totalHours = typedEntries.reduce((s, e) => s + e.hours, 0)
  const billableHours = typedEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0)
  const amountDue = billableHours * (client as Client).hourly_rate

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {monthLabel(monthStart)} — {(client as Client).name}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Read-only view of your current billing period
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Hours</p>
            <p className="text-2xl font-semibold mt-1">{formatHours(totalHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Billable Hours</p>
            <p className="text-2xl font-semibold mt-1">{formatHours(billableHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Amount Due</p>
            <p className="text-2xl font-semibold mt-1">
              {(client as Client).hourly_rate === 0 ? "Project-based" : formatCurrency(amountDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current month task list */}
      <Card className="overflow-x-auto">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <h2 className="font-semibold text-sm">Work Log — {monthLabel(monthStart)}</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead>Billable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No entries for this month yet
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invoice history */}
      {typedBilling.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Invoice History</h2>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Invoiced</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedBilling.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{monthLabel(record.month)}</TableCell>
                    <TableCell className="text-[hsl(var(--muted-foreground))]">
                      {record.invoice_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.invoiced ? "active" : "outline"} className="text-xs">
                        {record.invoiced ? "Yes" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.paid ? "success" : "outline"} className="text-xs">
                        {record.paid ? "Paid" : "Outstanding"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
