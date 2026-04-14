import { createClient } from "@/lib/supabase/server"
import { ClientsTable } from "@/components/dashboard/clients-table"
import { AddClientModal } from "@/components/dashboard/add-client-modal"
import { MonthlySummary } from "@/components/time-log/monthly-summary"
import type { ClientYtdSummary, TimeEntry } from "@/lib/types/database.types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: allEntries }] = await Promise.all([
    supabase.from("client_ytd_summary").select("*").order("name"),
    supabase
      .from("time_entries")
      .select("date, hours, billable")
      .gte("date", `${new Date().getFullYear()}-01-01`),
  ])

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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
          <ClientsTable clients={(clients ?? []) as ClientYtdSummary[]} />
        </div>
        <div className="w-full lg:w-64 lg:shrink-0">
          <MonthlySummary entries={(allEntries ?? []) as TimeEntry[]} />
        </div>
      </div>
    </div>
  )
}
