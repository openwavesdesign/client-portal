"use client"

import { useRouter, usePathname } from "next/navigation"

interface Props {
  year: number
  years: number[]
}

export function YearSelector({ year, years }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <select
      value={year}
      className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      onChange={(e) => router.push(`${pathname}?year=${e.target.value}`)}
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
