"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Client, RateHistory } from "@/lib/types/database.types"
import { updateRate } from "@/app/(admin)/rates/actions"

interface Props {
  clients: Client[]
  rateHistory: RateHistory[]
}

export function RatesTable({ clients, rateHistory }: Props) {
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [newRate, setNewRate] = useState("")
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<"active" | "all">("active")

  const displayedClients = filter === "active"
    ? clients.filter((c) => c.status === "active")
    : clients

  function clientRates(clientId: string) {
    return rateHistory
      .filter((r) => r.client_id === clientId)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from))
  }

  function currentRate(clientId: string) {
    return clientRates(clientId).find((r) => r.effective_to === null)
  }

  function openEdit(client: Client) {
    setNewRate(String(client.hourly_rate))
    setEditClient(client)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editClient) return
    setSaving(true)
    try {
      await updateRate(editClient.id, parseFloat(newRate) || 0)
      toast.success("Rate updated")
      setEditClient(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update rate")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "active" | "all")} className="w-fit">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border border-[hsl(var(--border))] overflow-x-auto">
        <Accordion type="multiple">
          {displayedClients.map((client) => {
            const current = currentRate(client.id)
            const history = clientRates(client.id)
            return (
              <AccordionItem key={client.id} value={client.id}>
                <div className="flex items-center px-4">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center gap-4 text-left w-full">
                      <span className="font-medium min-w-[200px]">{client.name}</span>
                      <span className="text-lg font-semibold">
                        {client.hourly_rate === 0
                          ? <Badge variant="secondary">Project-based</Badge>
                          : formatCurrency(client.hourly_rate) + "/hr"
                        }
                      </span>
                      {current && (
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          since {formatDate(current.effective_from)}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(client)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">
                    Rate History
                  </p>
                  {history.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">No history yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rate</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.rate === 0 ? "Project-based" : formatCurrency(r.rate) + "/hr"}
                            </TableCell>
                            <TableCell>{formatDate(r.effective_from)}</TableCell>
                            <TableCell>
                              {r.effective_to ? (
                                formatDate(r.effective_to)
                              ) : (
                                <Badge variant="active">Current</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <Dialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Rate — {editClient?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>New Hourly Rate ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Set to $0 for project-based clients. Takes effect today.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditClient(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Update Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
