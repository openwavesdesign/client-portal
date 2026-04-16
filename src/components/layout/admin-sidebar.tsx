"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Receipt,
  ShieldCheck,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/time-log", label: "Time Log", icon: Clock },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/maintenance", label: "Maintenance", icon: ShieldCheck },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface NavLinksProps {
  pathname: string
  onSignOut: () => void
  onLinkClick?: () => void
}

function NavLinks({ pathname, onSignOut, onLinkClick }: NavLinksProps) {
  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[hsl(var(--border))]">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] flex-col">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h1 className="text-lg font-semibold">Business Portal</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Admin</p>
        </div>
        <NavLinks pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar — hidden on desktop */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] flex items-center gap-3 px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-sm">Business Portal</span>
      </header>

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed left-0 top-0 h-full w-[240px] z-50 bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Business Portal</h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Admin</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks pathname={pathname} onSignOut={handleSignOut} onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
