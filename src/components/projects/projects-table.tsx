"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Check, X, MoreHorizontal, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatHours } from "@/lib/utils/format"
import type { Client, ProjectActuals } from "@/lib/types/database.types"
import { archiveProject, updateProject } from "@/app/(admin)/projects/actions"

interface ProjectWithMonthly extends ProjectActuals {
  monthly: { month: string; hours: number }[]
}

interface Props {
  projects: ProjectWithMonthly[]
  clients: Client[]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function calcProjectedRate(quotedCost: number | null, projectedHours: number | null): number | null {
  if (quotedCost && projectedHours && projectedHours > 0) {
    return quotedCost / projectedHours
  }
  return null
}

/** Format hours without unnecessary trailing zeros: 9.00 → "9", 2.50 → "2.5" */
function fmtHrs(h: number | null | undefined): string {
  if (h == null) return ""
  const rounded = parseFloat(h.toFixed(2))
  if (rounded === 0) return ""
  return rounded.toString()
}

export function ProjectsTable({ projects, clients }: Props) {
  const [filter, setFilter] = useState<"active" | "all">("active")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    client_id: "",
    name: "",
    quoted_cost: "",
    invoiced_amount: "",
    projected_hours: "",
  })

  const displayed = filter === "active"
    ? projects.filter((p) => p.status === "active")
    : projects

  const currentYear = new Date().getFullYear()

  function startEdit(project: ProjectWithMonthly) {
    setEditingId(project.id)
    setEditValues({
      client_id: project.client_id,
      name: project.name,
      quoted_cost: project.quoted_cost?.toString() ?? "",
      invoiced_amount: project.invoiced_amount > 0 ? project.invoiced_amount.toString() : "",
      projected_hours: project.projected_hours?.toString() ?? "",
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    try {
      const quotedCost = editValues.quoted_cost ? parseFloat(editValues.quoted_cost) : null
      const projectedHours = editValues.projected_hours ? parseFloat(editValues.projected_hours) : null
      const result = await updateProject(id, {
        client_id: editValues.client_id,
        name: editValues.name,
        quoted_cost: quotedCost,
        invoiced_amount: editValues.invoiced_amount ? parseFloat(editValues.invoiced_amount) : 0,
        projected_hours: projectedHours,
        projected_rate: calcProjectedRate(quotedCost, projectedHours),
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Project updated")
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function handleArchive(id: string) {
    try {
      const result = await archiveProject(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Project archived")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  return (
    <div className="space-y-8">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "active" | "all")}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Main project table ── */}
      <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide font-medium">
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-right">Quote</th>
              <th className="px-4 py-3 text-right">Invoiced</th>
              <th className="px-4 py-3 text-right">Projected Hours</th>
              <th className="px-4 py-3 text-right">Projected Rate</th>
              <th className="px-4 py-3 text-right">Actual Hours</th>
              <th className="px-4 py-3 text-right">Actual Rate</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No projects found
                </td>
              </tr>
            ) : (
              displayed.map((project) => {
                const isEditing = editingId === project.id
                const editQuote = editValues.quoted_cost ? parseFloat(editValues.quoted_cost) : null
                const editHours = editValues.projected_hours ? parseFloat(editValues.projected_hours) : null
                const projectedRate = calcProjectedRate(project.quoted_cost, project.projected_hours)
                  ?? project.projected_rate
                const liveProjectedRate = isEditing
                  ? calcProjectedRate(editQuote, editHours)
                  : projectedRate

                return (
                  <tr
                    key={project.id}
                    className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)]"
                  >
                    {/* Client */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editValues.client_id}
                          onChange={(e) => setEditValues((v) => ({ ...v, client_id: e.target.value }))}
                          className="border border-[hsl(var(--border))] rounded-md px-2 py-1 text-sm bg-[hsl(var(--background))] w-full"
                        >
                          {clients
                            .filter((c) => c.status === "active")
                            .map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      ) : (
                        <span className="font-medium">{project.client_name}</span>
                      )}
                    </td>

                    {/* Project name */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editValues.name}
                          onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      ) : (
                        project.name
                      )}
                    </td>

                    {/* Quote */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.quoted_cost}
                          onChange={(e) => setEditValues((v) => ({ ...v, quoted_cost: e.target.value }))}
                          className="h-8 text-sm text-right w-28 ml-auto"
                        />
                      ) : (
                        project.quoted_cost ? formatCurrency(project.quoted_cost) : "—"
                      )}
                    </td>

                    {/* Invoiced */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.invoiced_amount}
                          onChange={(e) => setEditValues((v) => ({ ...v, invoiced_amount: e.target.value }))}
                          className="h-8 text-sm text-right w-28 ml-auto"
                        />
                      ) : (
                        project.invoiced_amount > 0 ? formatCurrency(project.invoiced_amount) : "—"
                      )}
                    </td>

                    {/* Projected Hours */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editValues.projected_hours}
                          onChange={(e) => setEditValues((v) => ({ ...v, projected_hours: e.target.value }))}
                          className="h-8 text-sm text-right w-24 ml-auto"
                        />
                      ) : (
                        project.projected_hours != null ? formatHours(project.projected_hours) : "—"
                      )}
                    </td>

                    {/* Projected Rate — always calculated, never directly editable */}
                    <td className="px-4 py-3 text-right text-[hsl(var(--muted-foreground))]">
                      {liveProjectedRate != null ? formatCurrency(liveProjectedRate) + "/hr" : "—"}
                    </td>

                    {/* Actual Hours */}
                    <td className="px-4 py-3 text-right">
                      {formatHours(project.actual_hours)}
                    </td>

                    {/* Actual Rate */}
                    <td className="px-4 py-3 text-right">
                      {project.actual_hours > 0
                        ? formatCurrency(project.actual_rate) + "/hr"
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => saveEdit(project.id)}
                              title="Save"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(project)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleArchive(project.id)}
                                  className="text-[hsl(var(--destructive))]"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Monthly hours breakdown (months as rows, projects as columns) ── */}
      {displayed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-3">
            Monthly Hours Breakdown
          </h2>
          <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide font-medium">
                  <th className="px-4 py-3 text-left">Month</th>
                  {displayed.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-right normal-case font-medium">
                      {p.client_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTH_NAMES.map((monthName, idx) => {
                  const monthKey = `${currentYear}-${String(idx + 1).padStart(2, "0")}-01`
                  return (
                    <tr key={monthName} className="border-b border-[hsl(var(--border))] last:border-0">
                      <td className="px-4 py-2 text-[hsl(var(--muted-foreground))]">{monthName}</td>
                      {displayed.map((p) => {
                        const entry = p.monthly.find((m) => m.month === monthKey)
                        return (
                          <td key={p.id} className="px-4 py-2 text-right">
                            {entry ? fmtHrs(entry.hours) : ""}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* Total row */}
                <tr className="border-t-2 border-[hsl(var(--border))] font-semibold bg-[hsl(var(--muted)/0.3)]">
                  <td className="px-4 py-2">Total</td>
                  {displayed.map((p) => {
                    const yearTotal = p.monthly
                      .filter((m) => m.month.startsWith(`${currentYear}-`))
                      .reduce((sum, m) => sum + m.hours, 0)
                    return (
                      <td key={p.id} className="px-4 py-2 text-right">
                        {fmtHrs(yearTotal)}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
