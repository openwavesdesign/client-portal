import { createClient } from "@/lib/supabase/server"
import { RatesTable } from "@/components/rates/rates-table"
import type { Client, RateHistory } from "@/lib/types/database.types"

export default async function RatesPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: rateHistory }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("rate_history").select("*").order("effective_from", { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rates</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Manage hourly rates per client. Editing a rate closes the current one and starts a new one.
        </p>
      </div>

      <RatesTable
        clients={(clients ?? []) as Client[]}
        rateHistory={(rateHistory ?? []) as RateHistory[]}
      />
    </div>
  )
}
