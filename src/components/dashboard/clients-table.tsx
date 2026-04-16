"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Edit, Archive, ArchiveRestore, Receipt } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { formatCurrency, formatHours, formatDate, isClientActive } from "@/lib/utils/format"
import type { ClientYtdSummary } from "@/lib/types/database.types"
import { updateClient, archiveClient, restoreClient } from "@/app/(admin)/dashboard/actions"
import { useSettings, DEFAULT_SETTINGS } from "@/lib/hooks/use-settings"
import { Switch } from "@/components/ui/switch"

interface Props {
  clients: ClientYtdSummary[]
}

export function ClientsTable({ clients }: Props) {
  const router = useRouter()
  const { settings, updateSettings, mounted } = useSettings()
  const cols = mounted ? settings.clientList.columns : DEFAULT_SETTINGS.clientList.columns
  const filterActive = mounted ? settings.clientList.filterActive : true

  function toggleFilterActive(value: boolean) {
    updateSettings((prev) => ({
      ...prev,
      clientList: { ...prev.clientList, filterActive: value },
    }))
  }

  const [editClient, setEditClient] = useState<ClientYtdSummary | null>(null)
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    started_at: "",
    ended_at: "",
    hourly_rate: "0",
  })
  const [saving, setSaving] = useState(false)

  const displayed = filterActive ? clients.filter(isClientActive) : clients

  // Count visible optional columns for empty-state colSpan
  const visibleOptional = [
    cols.status,
    cols.started,
    cols.rate,
    cols.projects,
    cols.ytdHours,
    cols.ytdRevenue,
    cols.outstanding,
  ].filter(Boolean).length
  const colSpan = 2 + visibleOptional // Client + optional + Actions

  function openEdit(client: ClientYtdSummary) {
    setEditForm({
      name: client.name,
      started_at: client.started_at ?? "",
      ended_at: client.ended_at ?? "",
      hourly_rate: String(client.hourly_rate),
    })
    setEditClient(client)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editClient) return
    setSaving(true)
    try {
      await updateClient(editClient.id, {
        name: editForm.name,
        started_at: editForm.started_at || null,
        ended_at: editForm.ended_at || null,
        hourly_rate: parseFloat(editForm.hourly_rate) || 0,
      })
      toast.success("Client updated")
      setEditClient(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!archiveId) return
    try {
      const client = clients.find((c) => c.id === archiveId)
      if (client?.status === "archived") {
        await restoreClient(archiveId)
        toast.success("Client set to active")
      } else {
        await archiveClient(archiveId)
        toast.success("Client set to inactive")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setArchiveId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="dashboard-filter-active"
            checked={!filterActive}
            onCheckedChange={(v) => toggleFilterActive(!v)}
          />
          <Label
            htmlFor="dashboard-filter-active"
            className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer"
          >
            {filterActive ? "Show active clients" : "Show all clients"}
          </Label>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {displayed.length} client{displayed.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              {cols.status && <TableHead>Status</TableHead>}
              {cols.started && <TableHead>Started</TableHead>}
              {cols.rate && <TableHead className="text-right">Rate</TableHead>}
              {cols.projects && <TableHead className="text-right">Projects</TableHead>}
              {cols.ytdHours && <TableHead className="text-right">YTD Hours</TableHead>}
              {cols.ytdRevenue && <TableHead className="text-right">YTD Revenue</TableHead>}
              {cols.outstanding && <TableHead className="text-right">Outstanding</TableHead>}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className={`font-medium${!isClientActive(client) ? " bg-red-50 dark:bg-red-950/30" : ""}`}>{client.name}</TableCell>
                  {cols.status && (
                    <TableCell>
                      <Badge variant={client.status === "active" ? "active" : "inactive"}>
                        {client.status === "archived" ? "inactive" : client.status}
                      </Badge>
                    </TableCell>
                  )}
                  {cols.started && (
                    <TableCell className="text-[hsl(var(--muted-foreground))]">
                      {formatDate(client.started_at)}
                    </TableCell>
                  )}
                  {cols.rate && (
                    <TableCell className="text-right">
                      {client.hourly_rate === 0
                        ? <Badge variant="secondary">Project-based</Badge>
                        : formatCurrency(client.hourly_rate) + "/hr"}
                    </TableCell>
                  )}
                  {cols.projects && (
                    <TableCell className="text-right">{client.project_count}</TableCell>
                  )}
                  {cols.ytdHours && (
                    <TableCell className="text-right">{formatHours(client.ytd_hours)}</TableCell>
                  )}
                  {cols.ytdRevenue && (
                    <TableCell className="text-right">{formatCurrency(client.ytd_revenue)}</TableCell>
                  )}
                  {cols.outstanding && (
                    <TableCell className="text-right">
                      {client.outstanding_balance > 0
                        ? formatCurrency(client.outstanding_balance)
                        : "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(client)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/billing?client=${client.id}`)}
                        >
                          <Receipt className="h-4 w-4" />
                          View Billing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setArchiveId(client.id)}
                          className={client.status === "active" ? "text-[hsl(var(--destructive))]" : ""}
                        >
                          {client.status === "active" ? (
                            <>
                              <Archive className="h-4 w-4" />
                              Mark Inactive
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="h-4 w-4" />
                              Mark Active
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editForm.started_at}
                  onChange={(e) => setEditForm((f) => ({ ...f, started_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={editForm.ended_at}
                  onChange={(e) => setEditForm((f) => ({ ...f, ended_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.hourly_rate}
                onChange={(e) => setEditForm((f) => ({ ...f, hourly_rate: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditClient(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive/Restore Confirm */}
      <AlertDialog open={!!archiveId} onOpenChange={(o) => !o && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clients.find((c) => c.id === archiveId)?.status === "archived"
                ? "Mark client as active?"
                : "Mark client as inactive?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clients.find((c) => c.id === archiveId)?.status === "archived"
                ? "The client will be visible in active dropdowns again."
                : "The client will be hidden from active dropdowns but kept in historical records."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
