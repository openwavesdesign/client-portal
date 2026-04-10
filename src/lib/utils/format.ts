export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "0.00"
  return hours.toFixed(2)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function toMonthStart(year: number, month: number): string {
  // month is 1-indexed
  return `${year}-${String(month).padStart(2, "0")}-01`
}

export function currentMonthStart(): string {
  const now = new Date()
  return toMonthStart(now.getFullYear(), now.getMonth() + 1)
}

export function monthLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
