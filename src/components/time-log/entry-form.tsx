"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Client, Project, TimeEntryCategory } from "@/lib/types/database.types"
import { TIME_ENTRY_CATEGORIES } from "@/lib/types/database.types"
import { createTimeEntry } from "@/app/(admin)/time-log/actions"

interface Props {
  clients: Client[]
  projects: Project[]
}

const today = new Date().toISOString().split("T")[0]

export function EntryForm({ clients, projects }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    date: today,
    description: "",
    hours: "0.25",
    billable: false,
    category: "" as TimeEntryCategory | "",
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === "client_id") {
      setForm((f) => ({ ...f, client_id: value as string, project_id: "" }))
    }
  }

  const filteredProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id && p.status === "active")
    : []

  const activeClients = clients.filter((c) => c.status === "active")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) {
      toast.error("Please select a client")
      return
    }
    setLoading(true)
    try {
      await createTimeEntry({
        client_id: form.client_id,
        project_id: form.project_id || null,
        date: form.date,
        description: form.description,
        hours: parseFloat(form.hours),
        billable: form.billable,
        category: (form.category as TimeEntryCategory) || null,
      })
      toast.success("Entry added")
      setForm((f) => ({
        ...f,
        description: "",
        hours: "0.25",
        billable: false,
        project_id: "",
      }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create entry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Time Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Client */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => set("client_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={form.project_id}
                onValueChange={(v) => set("project_id", v)}
                disabled={!form.client_id || filteredProjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {TIME_ENTRY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label>Description *</Label>
              <Input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What did you work on?"
                required
              />
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                required
              />
            </div>

            {/* Billable + Submit */}
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.billable}
                  onChange={(e) => set("billable", e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium">Billable</span>
              </label>
              <Button type="submit" disabled={loading} className="ml-auto">
                {loading ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
