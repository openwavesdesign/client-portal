"use client"

import { useRouter, usePathname } from "next/navigation"

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

interface Props {
  year: number
  month: number
}

export function ReportFilters({ year, month }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  function update(key: "year" | "month", value: string) {
    const params = new URLSearchParams({
      year: String(key === "year" ? value : year),
      month: String(key === "month" ? value : month),
    })
    router.push(`${pathname}?${params}`)
  }

  return (
    <>
      <select
        value={month}
        className="h-9 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
        onChange={(e) => update("month", e.target.value)}
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={year}
        className="h-9 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm"
        onChange={(e) => update("year", e.target.value)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </>
  )
}
