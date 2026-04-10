import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateUserModal } from "@/components/users/create-user-modal"
import { formatDate } from "@/lib/utils/format"
import type { Client, UserProfile } from "@/lib/types/database.types"

export default async function UsersPage() {
  const supabase = await createClient()

  const [{ data: users }, { data: clients }] = await Promise.all([
    supabase
      .from("users")
      .select("*, clients(name)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("name"),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <CreateUserModal clients={(clients ?? []) as Client[]} />
      </div>

      <div className="rounded-md border border-[hsl(var(--border))]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Linked Client</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No users yet
                </TableCell>
              </TableRow>
            ) : (
              (users ?? []).map((user: UserProfile & { clients?: { name: string } | null }) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[hsl(var(--muted-foreground))]">
                    {user.clients?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-[hsl(var(--muted-foreground))]">
                    {user.last_login ? formatDate(user.last_login) : "Never"}
                  </TableCell>
                  <TableCell className="text-[hsl(var(--muted-foreground))]">
                    {formatDate(user.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
