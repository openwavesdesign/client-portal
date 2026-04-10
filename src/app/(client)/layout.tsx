import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/layout/sign-out-button"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role, clients(name)")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "client") redirect("/dashboard")

  const clientName = (profile?.clients as { name?: string } | null)?.name ?? "Client Portal"

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]">
      <header className="sticky top-0 z-10 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div>
            <span className="font-semibold">{clientName}</span>
            <span className="text-[hsl(var(--muted-foreground))] text-sm ml-2">— Client Portal</span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
