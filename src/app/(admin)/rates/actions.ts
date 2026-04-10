"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateRate(clientId: string, newRate: number) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("update_client_rate", {
    p_client_id: clientId,
    p_new_rate: newRate,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/rates")
}
