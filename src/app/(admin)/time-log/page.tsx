import { createClient } from "@/lib/supabase/server"
import { EntryForm } from "@/components/time-log/entry-form"
import { EntriesTable } from "@/components/time-log/entries-table"
import { FiltersBar } from "@/components/time-log/filters-bar"
import { MonthlySummary } from "@/components/time-log/monthly-summary"
import type { Client, Project, TimeEntry } from "@/lib/types/database.types"

interface Props {
  searchParams: Promise<{
    client?: string
    month?: string
    category?: string
    billable?: string
  }>
}

export default async function TimeLogPage({ searchParams }: Props) {
  const params = await searchParams
  const today = new Date().toISOString().split("T")[0]
  const supabase = await createClient()

  // Normalise filter values — sentinel "all" means no filter
  const clientFilter = params.client && params.client !== "all" ? params.client : ""
  const monthFilter = params.month && params.month !== "all" ? params.month : ""
  const categoryFilter = params.category && params.category !== "all" ? params.category : ""
  const billableFilter = params.billable && params.billable !== "all" ? params.billable : ""

  // Fetch clients and projects
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("projects").select("*").order("name"),
  ])

  // Build time entries query with filters
  let query = supabase
    .from("time_entries")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (clientFilter) query = query.eq("client_id", clientFilter)
  if (monthFilter) {
    const year = new Date().getFullYear()
    const month = parseInt(monthFilter)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`
    query = query.gte("date", startDate).lt("date", endDate)
  }
  if (categoryFilter) query = query.eq("category", categoryFilter as TimeEntry["category"])
  if (billableFilter === "true") query = query.eq("billable", true)
  if (billableFilter === "false") query = query.eq("billable", false)

  const { data: entries } = await query

  // Fetch all entries for monthly summary (unfiltered, current year)
  const { data: allEntries } = await supabase
    .from("time_entries")
    .select("date, hours, billable")
    .gte("date", `${new Date().getFullYear()}-01-01`)

  const clientList = (clients ?? []) as Client[]
  const projectList = (projects ?? []) as Project[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Time Log</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Track and manage time entries
        </p>
      </div>

      <EntryForm
        clients={clientList}
        projects={projectList}
        defaultDate={today}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <FiltersBar
            clients={clientList}
            currentClient={clientFilter}
            currentMonth={monthFilter}
            currentCategory={categoryFilter}
            currentBillable={billableFilter}
          />
          <EntriesTable
            entries={(entries ?? []) as TimeEntry[]}
            clients={clientList}
            projects={projectList}
          />
        </div>
        <div className="w-full lg:w-64 lg:shrink-0">
          <MonthlySummary entries={(allEntries ?? []) as TimeEntry[]} />
        </div>
      </div>
    </div>
  )
}
