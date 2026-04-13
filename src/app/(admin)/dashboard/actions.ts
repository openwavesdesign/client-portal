"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ClientInsert, ClientUpdate } from "@/lib/types/database.types"

export async function createClient_(data: ClientInsert) {
  const supabase = await createClient()
  const { error } = await supabase.from("clients").insert(data)
  if (error) throw new Error(error.message)

  // Also create initial rate_history entry
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (client && data.hourly_rate != null) {
    await supabase.from("rate_history").insert({
      client_id: client.id,
      rate: data.hourly_rate,
      effective_from: new Date().toISOString().split("T")[0],
    })
  }

  revalidatePath("/dashboard")
}

export async function updateClient(id: string, data: ClientUpdate) {
  const supabase = await createClient()
  const update: ClientUpdate = { ...data }
  if ("ended_at" in data) {
    const today = new Date().toISOString().split("T")[0]
    update.status = (data.ended_at && data.ended_at <= today) ? "archived" : "active"
  }
  const { error } = await supabase.from("clients").update(update).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

export async function archiveClient(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update({ status: "archived", ended_at: new Date().toISOString().split("T")[0] })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

export async function restoreClient(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update({ status: "active", ended_at: null })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}
