import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatHours, isClientActive } from "@/lib/utils/format"
import type { ClientYtdSummary } from "@/lib/types/database.types"

interface Props {
  clients: ClientYtdSummary[]
  year: number
}

export function YtdTotals({ clients, year }: Props) {
  const ytdHours = clients.reduce((sum, c) => sum + c.ytd_hours, 0)
  const ytdRevenue = clients.reduce(
    (sum, c) => sum + c.ytd_revenue + (c.on_maintenance_plan ? c.maintenance_rate : 0),
    0
  )
  const outstanding = clients.reduce((sum, c) => sum + c.outstanding_balance, 0)
  const activeClients = clients.filter(isClientActive).length
  const activeProjects = clients
    .filter(isClientActive)
    .reduce((sum, c) => sum + c.project_count, 0)

  const stats: { label: string; value: string }[] = [
    { label: "YTD Hours", value: `${formatHours(ytdHours)} hrs` },
    { label: "YTD Revenue", value: formatCurrency(ytdRevenue) },
    { label: "Outstanding Balance", value: formatCurrency(outstanding) },
    { label: "Active Clients", value: String(activeClients) },
    { label: "Active Projects", value: String(activeProjects) },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        {year} Year-to-Date
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
