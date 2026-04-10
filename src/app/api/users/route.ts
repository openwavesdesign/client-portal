import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/users — list all users (admin only)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users })
}

// POST /api/users — invite a new user (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { email, role, client_id } = body

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 })
  }

  const adminClient = getAdminClient()

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        role,
        client_id: client_id || null,
      },
    }
  )

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // The trigger (handle_new_user) will create the public.users row on invite acceptance.
  // Pre-create the row now so the admin can see the pending user immediately.
  if (inviteData.user) {
    await supabase.from("users").upsert({
      id: inviteData.user.id,
      email,
      role,
      client_id: client_id || null,
    })
  }

  return NextResponse.json({ success: true, user: inviteData.user })
}

// PATCH /api/users — update user role/client link or disable
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, role: newRole, client_id, disabled } = body

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const adminClient = getAdminClient()

  // Update auth user if disabling
  if (disabled !== undefined) {
    await adminClient.auth.admin.updateUserById(userId, { ban_duration: disabled ? "876600h" : "none" })
  }

  // Update public.users record
  type UserUpdate = {
    role?: "admin" | "client"
    client_id?: string | null
  }
  const updateData: UserUpdate = {}
  if (newRole !== undefined) updateData.role = newRole as "admin" | "client"
  if (client_id !== undefined) updateData.client_id = client_id

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from("users").update(updateData).eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
