"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, Check, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate, formatHours, formatCurrency } from "@/lib/utils/format"
import type { TimeEntry, Client, Project } from "@/lib/types/database.types"
import { TIME_ENTRY_CATEGORIES } from "@/lib/types/database.types"
import { updateTimeEntry, deleteTimeEntry } from "@/app/(admin)/time-log/actions"

interface Props {
  entries: TimeEntry[]
  clients: Client[]
  projects: Project[]
}

export function EntriesTable({ entries, clients, projects }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TimeEntry>>({})
  const [saving, setSaving] = useState(false)

  function clientName(id: string) {
    return clients.find((c) => c.id === id)?.name ?? id
  }
  function projectName(id: string | null) {
    if (!id) return "—"
    return projects.find((p) => p.id === id)?.name ?? "—"
  }
  function clientRate(clientId: string) {
    return clients.find((c) => c.id === clientId)?.hourly_rate ?? 0
  }

  function startEdit(entry: TimeEntry) {
    setEditForm({ ...entry })
    setEditId(entry.id)
  }

  async function saveEdit() {
    if (!editId || !editForm) return
    setSaving(true)
    try {
      await updateTimeEntry(editId, {
        date: editForm.date,
        description: editForm.description,
        hours: editForm.hours,
        billable: editForm.billable,
        category: editForm.category,
        project_id: editForm.project_id,
      })
      toast.success("Entry updated")
      setEditId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteTimeEntry(deleteId)
      toast.success("Entry deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                No entries found
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const isEditing = editId === entry.id
              if (isEditing) {
                return (
                  <TableRow key={entry.id} className="bg-[hsl(var(--accent))]/30">
                    <TableCell>
                      <Input
                        type="date"
                        value={editForm.date ?? entry.date}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sm">{clientName(entry.client_id)}</TableCell>
                    <TableCell>
                      <Select
                        value={editForm.project_id ?? "__none__"}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, project_id: v === "__none__" ? null : v }))}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {projects
                            .filter((p) => p.client_id === entry.client_id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.description ?? entry.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editForm.category ?? "__none__"}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, category: v === "__none__" ? null : (v as Exclude<TimeEntry["category"], null>) }))}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {TIME_ENTRY_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={editForm.hours ?? entry.hours}
                        onChange={(e) => setEditForm((f) => ({ ...f, hours: parseFloat(e.target.value) }))}
                        className="h-7 text-xs w-20 ml-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={editForm.billable ?? entry.billable}
                        onChange={(e) => setEditForm((f) => ({ ...f, billable: e.target.checked }))}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm text-[hsl(var(--muted-foreground))]">
                      {editForm.billable ? formatCurrency((editForm.hours ?? 0) * clientRate(entry.client_id)) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit} disabled={saving}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }

              const amount = entry.billable ? entry.hours * clientRate(entry.client_id) : 0
              return (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                  <TableCell className="text-sm">{clientName(entry.client_id)}</TableCell>
                  <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                    {projectName(entry.project_id)}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{entry.description}</TableCell>
                  <TableCell>
                    {entry.category ? (
                      <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatHours(entry.hours)}</TableCell>
                  <TableCell>
                    <Badge variant={entry.billable ? "success" : "outline"} className="text-xs">
                      {entry.billable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {entry.billable ? formatCurrency(amount) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(entry)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-[hsl(var(--destructive))]"
                        onClick={() => setDeleteId(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
