import { createClient } from "@/lib/supabase/server"
import { ClientsTable } from "@/components/dashboard/clients-table"
import { AddClientModal } from "@/components/dashboard/add-client-modal"
import type { ClientYtdSummary } from "@/lib/types/database.types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from("client_ytd_summary")
    .select("*")
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage clients and view YTD summaries
          </p>
        </div>
        <AddClientModal />
      </div>

      <ClientsTable clients={(clients ?? []) as ClientYtdSummary[]} />
    </div>
  )
}
