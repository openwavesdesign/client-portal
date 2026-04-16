import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { MaintenanceTable } from "@/components/maintenance/maintenance-table"
import { YearSelector } from "@/components/maintenance/year-selector"
import { formatCurrency } from "@/lib/utils/format"

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function MaintenancePage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const supabase = await createClient()

  const { data: planClients } = await supabase
    .from("clients")
    .select("id, name, maintenance_rate")
    .eq("on_maintenance_plan", true)
    .order("name")

  const clients = planClients ?? []
  const clientIds = clients.map((c) => c.id)

  const { data: invoices } =
    clientIds.length > 0
      ? await supabase
          .from("maintenance_invoices")
          .select("*")
          .in("client_id", clientIds)
          .eq("year", year)
      : { data: [] }

  const invoiceMap = new Map((invoices ?? []).map((inv) => [inv.client_id, inv]))

  const rows = clients.map((c) => {
    const inv = invoiceMap.get(c.id) ?? null
    return {
      client_id: c.id,
      client_name: c.name,
      maintenance_rate: c.maintenance_rate,
      invoice_number: inv?.invoice_number ?? null,
      invoiced: inv?.invoiced ?? false,
      paid: inv?.paid ?? false,
      notes: inv?.notes ?? null,
    }
  })

  const totalContracted = clients.reduce((s, c) => s + c.maintenance_rate, 0)
  const totalInvoiced = rows.filter((r) => r.invoiced).reduce((s, r) => s + r.maintenance_rate, 0)
  const totalPaid = rows.filter((r) => r.paid).reduce((s, r) => s + r.maintenance_rate, 0)
  const totalOutstanding = totalInvoiced - totalPaid

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance Plans</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Annual maintenance billing — invoiced in January
        </p>
      </div>

      <div className="flex items-center gap-3">
        <YearSelector year={year} years={years} />
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{year} billing year</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Clients on Plan
            </p>
            <p className="text-2xl font-semibold mt-1">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Total Contracted
            </p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(totalContracted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Invoiced
            </p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Outstanding
            </p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <MaintenanceTable rows={rows} year={year} />
    </div>
  )
}
