"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TimeEntryInsert } from "@/lib/types/database.types"

export async function createTimeEntry(data: TimeEntryInsert) {
  const supabase = await createClient()
  const { error } = await supabase.from("time_entries").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/time-log")
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntryInsert>) {
  const supabase = await createClient()
  const { error } = await supabase.from("time_entries").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/time-log")
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("time_entries").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/time-log")
}
