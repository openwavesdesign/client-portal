import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatHours } from "@/lib/utils/format"
import type { TimeEntry } from "@/lib/types/database.types"

interface Props {
  entries: TimeEntry[]
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function MonthlySummary({ entries }: Props) {
  const currentYear = new Date().getFullYear()

  // Group by month for current year
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date + "T00:00:00")
      return d.getFullYear() === currentYear && d.getMonth() + 1 === month
    })
    const total = monthEntries.reduce((sum, e) => sum + e.hours, 0)
    const billable = monthEntries.reduce((sum, e) => sum + (e.billable ? e.hours : 0), 0)
    return { month, name: MONTH_NAMES[i], total, billable }
  })

  const ytdTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0)
  const ytdBillable = monthlyTotals.reduce((sum, m) => sum + m.billable, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{currentYear} Monthly Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {monthlyTotals.map((m) => (
          <div key={m.month} className="flex items-center justify-between py-1">
            <span className="text-sm text-[hsl(var(--muted-foreground))] w-8">{m.name}</span>
            <div className="flex-1 mx-3 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div
                className="h-full rounded-full bg-[hsl(var(--primary))]"
                style={{
                  width: ytdTotal > 0 ? `${Math.min(100, (m.total / (ytdTotal / 12)) * 100)}%` : "0%",
                }}
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">{formatHours(m.total)}</span>
          </div>
        ))}
        <div className="border-t border-[hsl(var(--border))] pt-2 mt-2 flex justify-between text-sm font-medium">
          <span>YTD Total</span>
          <span>{formatHours(ytdTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>YTD Billable</span>
          <span>{formatHours(ytdBillable)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
