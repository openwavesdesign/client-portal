"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { createClient_ } from "@/app/(admin)/dashboard/actions"

interface Props {
  onSuccess?: () => void
}

export function AddClientModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    started_at: "",
    ended_at: "",
    hourly_rate: "0",
    notes: "",
    on_maintenance_plan: false,
    maintenance_rate: "0",
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createClient_({
        name: form.name,
        started_at: form.started_at || null,
        ended_at: form.ended_at || null,
        hourly_rate: parseFloat(form.hourly_rate) || 0,
        notes: form.notes || null,
        status: "active",
        on_maintenance_plan: form.on_maintenance_plan,
        maintenance_rate: parseFloat(form.maintenance_rate) || 0,
      })
      toast.success("Client created")
      setOpen(false)
      setForm({ name: "", started_at: "", ended_at: "", hourly_rate: "0", notes: "", on_maintenance_plan: false, maintenance_rate: "0" })
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create client")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Client
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="started_at">Start Date</Label>
                <Input
                  id="started_at"
                  type="date"
                  value={form.started_at}
                  onChange={(e) => set("started_at", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ended_at">End Date</Label>
                <Input
                  id="ended_at"
                  type="date"
                  value={form.ended_at}
                  onChange={(e) => set("ended_at", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={form.hourly_rate}
                onChange={(e) => set("hourly_rate", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="on-maintenance-plan"
                checked={form.on_maintenance_plan}
                onCheckedChange={(v) => setForm((f) => ({ ...f, on_maintenance_plan: v }))}
              />
              <Label htmlFor="on-maintenance-plan">Maintenance Plan</Label>
            </div>
            {form.on_maintenance_plan && (
              <div className="space-y-2">
                <Label htmlFor="maintenance_rate">Annual Maintenance Rate ($)</Label>
                <Input
                  id="maintenance_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maintenance_rate}
                  onChange={(e) => set("maintenance_rate", e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
