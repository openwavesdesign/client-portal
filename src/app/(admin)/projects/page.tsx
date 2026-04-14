import { createClient } from "@/lib/supabase/server"
import { ProjectsTable } from "@/components/projects/projects-table"
import { AddProjectModal } from "@/components/projects/add-project-modal"
import type { Client } from "@/lib/types/database.types"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const [{ data: projects }, { data: clients }, { data: entries }] = await Promise.all([
    supabase.from("project_actuals").select("*").order("client_name").order("name"),
    supabase.from("clients").select("*").order("name"),
    supabase.from("time_entries").select("project_id, date, hours").not("project_id", "is", null),
  ])

  // Build monthly breakdown per project
  const projectsWithMonthly = (projects ?? []).map((project) => {
    const projectEntries = (entries ?? []).filter((e) => e.project_id === project.id)

    const monthMap = new Map<string, number>()
    projectEntries.forEach((e) => {
      const d = new Date(e.date + "T00:00:00")
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.hours)
    })

    const monthly = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, hours]) => ({ month, hours }))

    return { ...project, monthly }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Track quoted projects and profitability
          </p>
        </div>
        <AddProjectModal clients={(clients ?? []) as Client[]} />
      </div>

      <ProjectsTable
        projects={projectsWithMonthly as Parameters<typeof ProjectsTable>[0]["projects"]}
        clients={(clients ?? []) as Client[]}
      />
    </div>
  )
}
