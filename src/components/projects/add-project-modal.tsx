"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Client } from "@/lib/types/database.types"
import { createProject } from "@/app/(admin)/projects/actions"
import { isClientActive } from "@/lib/utils/format"

interface Props {
  clients: Client[]
}

export function AddProjectModal({ clients }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: "",
    name: "",
    quoted_cost: "",
    projected_hours: "",
    projected_rate: "",
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id || !form.name) {
      toast.error("Client and name are required")
      return
    }
    setLoading(true)
    try {
      await createProject({
        client_id: form.client_id,
        name: form.name,
        quoted_cost: form.quoted_cost ? parseFloat(form.quoted_cost) : null,
        projected_hours: form.projected_hours ? parseFloat(form.projected_hours) : null,
        projected_rate: form.projected_rate ? parseFloat(form.projected_rate) : null,
        status: "active",
      })
      toast.success("Project created")
      setOpen(false)
      setForm({ client_id: "", name: "", quoted_cost: "", projected_hours: "", projected_rate: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const activeClients = clients.filter(isClientActive)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Project
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Quoted Cost ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quoted_cost}
                  onChange={(e) => set("quoted_cost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Proj. Hours</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={form.projected_hours}
                  onChange={(e) => set("projected_hours", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Proj. Rate ($/hr)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.projected_rate}
                  onChange={(e) => set("projected_rate", e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
