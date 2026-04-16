"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Edit, Check, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils/format"
import { upsertMaintenanceInvoice } from "@/app/(admin)/maintenance/actions"

export interface MaintenanceRow {
  client_id: string
  client_name: string
  maintenance_rate: number
  invoice_number: string | null
  invoiced: boolean
  paid: boolean
  notes: string | null
}

interface Props {
  rows: MaintenanceRow[]
  year: number
}

export function MaintenanceTable({ rows, year }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    invoice_number: "",
    invoiced: false,
    paid: false,
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  function openEdit(row: MaintenanceRow) {
    setEditForm({
      invoice_number: row.invoice_number ?? "",
      invoiced: row.invoiced,
      paid: row.paid,
      notes: row.notes ?? "",
    })
    setEditingId(row.client_id)
  }

  async function handleSave(clientId: string) {
    setSaving(true)
    try {
      await upsertMaintenanceInvoice({
        client_id: clientId,
        year,
        invoice_number: editForm.invoice_number || null,
        invoiced: editForm.invoiced,
        paid: editForm.paid,
        notes: editForm.notes || null,
      })
      toast.success("Invoice updated")
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No clients are currently on a maintenance plan. Enable one from the client edit dialog on the Dashboard.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Annual Rate</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Invoiced</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isEditing = editingId === row.client_id
            return (
              <TableRow key={row.client_id}>
                <TableCell className="font-medium">{row.client_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.maintenance_rate)}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editForm.invoice_number}
                      onChange={(e) => setEditForm((f) => ({ ...f, invoice_number: e.target.value }))}
                      placeholder="INV-001"
                      className="h-8 w-32"
                    />
                  ) : (
                    <span className="text-sm">{row.invoice_number ?? "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Switch
                      checked={editForm.invoiced}
                      onCheckedChange={(v) => setEditForm((f) => ({ ...f, invoiced: v }))}
                    />
                  ) : (
                    <Badge variant={row.invoiced ? "success" : "outline"} className="text-xs">
                      {row.invoiced ? "Yes" : "No"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Switch
                      checked={editForm.paid}
                      onCheckedChange={(v) => setEditForm((f) => ({ ...f, paid: v }))}
                    />
                  ) : (
                    <Badge variant={row.paid ? "success" : "outline"} className="text-xs">
                      {row.paid ? "Yes" : "No"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSave(row.client_id)}
                        disabled={saving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(row)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
