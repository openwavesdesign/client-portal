import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/middleware"

const ADMIN_PREFIXES = [
  "/dashboard",
  "/time-log",
  "/rates",
  "/reports",
  "/billing",
  "/projects",
  "/users",
]
const CLIENT_PREFIXES = ["/portal"]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createClient(request, response)
  const pathname = request.nextUrl.pathname

  // Always use getUser() — validates JWT server-side unlike getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated
  if (!user) {
    if (pathname === "/login") return response
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Authenticated user on the login page — redirect based on role
  if (pathname === "/login") {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    const destination = profile?.role === "admin" ? "/dashboard" : "/portal"
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Role enforcement for admin/client routes
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  const isClientRoute = CLIENT_PREFIXES.some((p) => pathname.startsWith(p))

  if (isAdminRoute || isClientRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (isAdminRoute && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/portal", request.url))
    }
    if (isClientRoute && profile?.role !== "client") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}
