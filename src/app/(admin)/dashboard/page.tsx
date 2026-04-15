import { createClient } from "@/lib/supabase/server"
import { ClientsTable } from "@/components/dashboard/clients-table"
import { AddClientModal } from "@/components/dashboard/add-client-modal"
import { YtdTotals } from "@/components/dashboard/ytd-totals"
import { MonthlySummary } from "@/components/time-log/monthly-summary"
import type { ClientYtdSummary, TimeEntry } from "@/lib/types/database.types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const [{ data: clients }, { data: allEntries }] = await Promise.all([
    supabase.from("client_ytd_summary").select("*").order("name"),
    supabase
      .from("time_entries")
      .select("date, hours, billable")
      .gte("date", `${year}-01-01`),
  ])

  const clientList = (clients ?? []) as ClientYtdSummary[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage clients and view YTD summaries
          </p>
        </div>
        <AddClientModal />
      </div>

      <YtdTotals clients={clientList} year={year} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
          <ClientsTable clients={clientList} />
        </div>
        <div className="w-full lg:w-64 lg:shrink-0">
          <MonthlySummary entries={(allEntries ?? []) as TimeEntry[]} />
        </div>
      </div>
    </div>
  )
}
