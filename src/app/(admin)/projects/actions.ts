"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ProjectInsert } from "@/lib/types/database.types"

export async function createProject(data: ProjectInsert) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").insert(data)
  if (error) return { error: error.message }
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { error: null }
}

export async function updateProject(id: string, data: Partial<ProjectInsert>) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").update(data).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { error: null }
}

export async function archiveProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { error: null }
}
