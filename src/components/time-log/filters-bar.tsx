"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Client } from "@/lib/types/database.types"
import { TIME_ENTRY_CATEGORIES } from "@/lib/types/database.types"

interface Props {
  clients: Client[]
  currentClient: string
  currentMonth: string
  currentCategory: string
  currentBillable: string
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export function FiltersBar({
  clients,
  currentClient,
  currentMonth,
  currentCategory,
  currentBillable,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams()
    // Rebuild from current props so we don't need useSearchParams()
    if (currentClient && key !== "client") params.set("client", currentClient)
    if (currentMonth && key !== "month") params.set("month", currentMonth)
    if (currentCategory && key !== "category") params.set("category", currentCategory)
    if (currentBillable && key !== "billable") params.set("billable", currentBillable)
    if (value) params.set(key, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const hasFilters = currentClient || currentMonth || currentCategory || currentBillable

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={currentClient} onValueChange={(v) => updateParam("client", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All clients</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentMonth} onValueChange={(v) => updateParam("month", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All months" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All months</SelectItem>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentCategory} onValueChange={(v) => updateParam("category", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {TIME_ENTRY_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentBillable} onValueChange={(v) => updateParam("billable", v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Billable: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Billable only</SelectItem>
          <SelectItem value="false">Non-billable</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
