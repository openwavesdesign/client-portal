"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function upsertBillingRecord(data: {
  client_id: string
  month: string
  invoice_number?: string | null
  so_number?: string | null
  invoiced?: boolean
  paid?: boolean
  notes?: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("billing_records")
    .upsert(data, { onConflict: "client_id,month" })
  if (error) throw new Error(error.message)
  revalidatePath("/billing")
}
