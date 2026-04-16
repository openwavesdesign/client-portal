"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function upsertMaintenanceInvoice(data: {
  client_id: string
  year: number
  invoice_number?: string | null
  invoiced?: boolean
  paid?: boolean
  notes?: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("maintenance_invoices")
    .upsert(data, { onConflict: "client_id,year" })
  if (error) throw new Error(error.message)
  revalidatePath("/maintenance")
}
