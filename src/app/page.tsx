import { redirect } from "next/navigation"

// Root page: redirect to login (middleware handles auth'd users)
export default function RootPage() {
  redirect("/login")
}
