import { Suspense } from "react"
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
  const supabase = await createClient()

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

  if (params.client) query = query.eq("client_id", params.client)
  if (params.month) {
    const year = new Date().getFullYear()
    const month = parseInt(params.month)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`
    query = query.gte("date", startDate).lt("date", endDate)
  }
  if (params.category) query = query.eq("category", params.category as Exclude<TimeEntry["category"], null>)
  if (params.billable === "true") query = query.eq("billable", true)
  if (params.billable === "false") query = query.eq("billable", false)

  const { data: entries } = await query

  // Fetch all entries for monthly summary (no filters)
  const { data: allEntries } = await supabase
    .from("time_entries")
    .select("date, hours, billable")
    .gte("date", `${new Date().getFullYear()}-01-01`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Time Log</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Track and manage time entries
        </p>
      </div>

      <EntryForm
        clients={(clients ?? []) as Client[]}
        projects={(projects ?? []) as Project[]}
      />

      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <Suspense>
            <FiltersBar clients={(clients ?? []) as Client[]} />
          </Suspense>
          <EntriesTable
            entries={(entries ?? []) as TimeEntry[]}
            clients={(clients ?? []) as Client[]}
            projects={(projects ?? []) as Project[]}
          />
        </div>
        <div className="w-64 shrink-0">
          <MonthlySummary entries={(allEntries ?? []) as TimeEntry[]} />
        </div>
      </div>
    </div>
  )
}
