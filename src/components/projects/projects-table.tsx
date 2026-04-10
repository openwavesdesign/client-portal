"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Archive } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatHours } from "@/lib/utils/format"
import type { ProjectActuals, TimeEntry } from "@/lib/types/database.types"
import { archiveProject } from "@/app/(admin)/projects/actions"

interface ProjectWithMonthly extends ProjectActuals {
  monthly: { month: string; hours: number }[]
}

interface Props {
  projects: ProjectWithMonthly[]
}

function ProfitabilityBadge({ actual, projected }: { actual: number; projected: number | null }) {
  if (!projected || projected === 0) return <Badge variant="secondary">N/A</Badge>
  const pct = (actual / projected) * 100
  if (pct >= 100) return <Badge variant="success">On track</Badge>
  if (pct >= 90) return <Badge variant="warning">At risk</Badge>
  return <Badge variant="danger">Over budget</Badge>
}

export function ProjectsTable({ projects }: Props) {
  const [filter, setFilter] = useState<"active" | "all">("active")

  const displayed = filter === "active"
    ? projects.filter((p) => p.status === "active")
    : projects

  async function handleArchive(id: string) {
    try {
      await archiveProject(id)
      toast.success("Project archived")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "active" | "all")}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border border-[hsl(var(--border))]">
        <Accordion type="multiple">
          {displayed.length === 0 ? (
            <div className="text-center text-[hsl(var(--muted-foreground))] py-8 text-sm">
              No projects found
            </div>
          ) : (
            displayed.map((project) => (
              <AccordionItem key={project.id} value={project.id}>
                <div className="flex items-center px-4">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="grid grid-cols-8 gap-2 text-left w-full items-center text-sm">
                      <span className="col-span-2 font-medium">{project.client_name}</span>
                      <span className="col-span-2">{project.name}</span>
                      <span className="text-right">
                        {project.quoted_cost ? formatCurrency(project.quoted_cost) : "—"}
                      </span>
                      <span className="text-right">
                        {project.projected_hours ? formatHours(project.projected_hours) : "—"}
                      </span>
                      <span className="text-right">
                        {formatHours(project.actual_hours)}
                      </span>
                      <div className="flex justify-end">
                        <ProfitabilityBadge
                          actual={project.actual_rate}
                          projected={project.projected_rate}
                        />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleArchive(project.id)}
                        className="text-[hsl(var(--destructive))]"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Quoted Cost</p>
                      <p className="font-medium">{project.quoted_cost ? formatCurrency(project.quoted_cost) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Projected Rate</p>
                      <p className="font-medium">{project.projected_rate ? formatCurrency(project.projected_rate) + "/hr" : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Actual Rate</p>
                      <p className="font-medium">
                        {project.actual_hours > 0 ? formatCurrency(project.actual_rate) + "/hr" : "—"}
                      </p>
                    </div>
                  </div>

                  {project.monthly.length > 0 && (
                    <>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                        Monthly Hours
                      </p>
                      <div className="grid grid-cols-6 gap-2">
                        {project.monthly.map((m) => (
                          <div key={m.month} className="text-center">
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {new Date(m.month + "T00:00:00").toLocaleString("en-US", { month: "short" })}
                            </p>
                            <p className="text-sm font-medium">{formatHours(m.hours)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))
          )}
        </Accordion>
      </div>

      {/* Table header row (outside accordion for alignment) */}
    </div>
  )
}
