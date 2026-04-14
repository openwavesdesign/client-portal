import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/middleware"

const ADMIN_PREFIXES = [
  "/dashboard",
  "/time-log",
  "/reports",
  "/billing",
  "/projects",
  "/users",
]
const CLIENT_PREFIXES = ["/portal"]

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createClient(request, response)
  const pathname = request.nextUrl.pathname

  // Redirect helper: copies any refreshed session cookies onto the redirect
  // response so they aren't dropped when the middleware refreshes the JWT.
  function redirectTo(path: string): NextResponse {
    const redirect = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach(({ name, value }) => {
      redirect.cookies.set(name, value)
    })
    return redirect
  }

  // Always use getUser() — validates JWT server-side unlike getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated — only /login and /no-access are public
  if (!user) {
    if (pathname === "/login" || pathname === "/no-access") return response
    return redirectTo("/login")
  }

  // Authenticated user on the login page — redirect based on role
  if (pathname === "/login") {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    // No profile row means the user wasn't seeded into public.users.
    // Send them to /no-access instead of guessing a role (which loops).
    if (!profile) return redirectTo("/no-access")

    const destination = profile.role === "admin" ? "/dashboard" : "/portal"
    return redirectTo(destination)
  }

  // /no-access is always accessible to authenticated users (breaks loop)
  if (pathname === "/no-access") return response

  // Role enforcement for admin/client routes
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  const isClientRoute = CLIENT_PREFIXES.some((p) => pathname.startsWith(p))

  if (isAdminRoute || isClientRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    // Null profile on a protected route: avoid the portal↔dashboard loop
    if (!profile) return redirectTo("/no-access")

    if (isAdminRoute && profile.role !== "admin") {
      return redirectTo("/portal")
    }
    if (isClientRoute && profile.role !== "client") {
      return redirectTo("/dashboard")
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}
