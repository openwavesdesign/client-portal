"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatHours } from "@/lib/utils/format"
import type { BillingRecord, TimeEntry, Client } from "@/lib/types/database.types"
import { upsertBillingRecord } from "@/app/(admin)/billing/actions"

interface Props {
  client: Client
  month: string
  entries: TimeEntry[]
  billingRecord: BillingRecord | null
}

export function InvoiceFields({ client, month, entries, billingRecord }: Props) {
  const [form, setForm] = useState({
    invoice_number: billingRecord?.invoice_number ?? "",
    so_number: billingRecord?.so_number ?? "",
    invoiced: billingRecord?.invoiced ?? false,
    paid: billingRecord?.paid ?? false,
    notes: billingRecord?.notes ?? "",
  })
  const [saving, setSaving] = useState(false)

  // Reset form when billing record changes
  useEffect(() => {
    setForm({
      invoice_number: billingRecord?.invoice_number ?? "",
      so_number: billingRecord?.so_number ?? "",
      invoiced: billingRecord?.invoiced ?? false,
      paid: billingRecord?.paid ?? false,
      notes: billingRecord?.notes ?? "",
    })
  }, [billingRecord?.id, month, client.id])

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0)
  const amountDue = billableHours * client.hourly_rate

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertBillingRecord({
        client_id: client.id,
        month,
        invoice_number: form.invoice_number || null,
        so_number: form.so_number || null,
        invoiced: form.invoiced,
        paid: form.paid,
        notes: form.notes || null,
      })
      toast.success("Billing record saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Hours</p>
              <p className="text-xl font-semibold mt-1">{formatHours(totalHours)}</p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Billable Hours</p>
              <p className="text-xl font-semibold mt-1">{formatHours(billableHours)}</p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Amount Due</p>
              <p className="text-xl font-semibold mt-1">
                {client.hourly_rate === 0 ? "Project-based" : formatCurrency(amountDue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                  placeholder="INV-001"
                />
              </div>
              <div className="space-y-2">
                <Label>SO Number</Label>
                <Input
                  value={form.so_number}
                  onChange={(e) => setForm((f) => ({ ...f, so_number: e.target.value }))}
                  placeholder="SO-001"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.invoiced}
                  onChange={(e) => setForm((f) => ({ ...f, invoiced: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium">Invoiced</span>
                {form.invoiced && <Badge variant="active">Yes</Badge>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium">Paid</span>
                {form.paid && <Badge variant="success">Yes</Badge>}
              </label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any additional notes…"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Billing Record"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
