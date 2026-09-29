import {
  ShieldCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserManagement } from "@/components/admin/user-management"

type AdminDashboardProps = {
  administratorName: string | null
  currentUserId: string
  users: AdminUser[]
}

export type AdminUser = {
  id: string
  full_name: string | null
  role: "student" | "supervisor" | "admin" | null
  institution_name: string | null
  updated_at: string | null
}

export function AdminDashboard({ administratorName, currentUserId, users }: AdminDashboardProps) {
  return (
    <div className="w-full max-w-6xl space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{administratorName ? `, ${administratorName}` : ""}. Manage workspace access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline"><ShieldCheck /> Administrator</Badge>
          <Badge variant="secondary"><Users /> {users.length} users</Badge>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
          <div>
            <CardTitle>User management</CardTitle>
            <CardDescription>Review registered users and their current access role.</CardDescription>
          </div>
          <Badge variant="outline">Profiles</Badge>
        </CardHeader>
        <UserManagement users={users} currentUserId={currentUserId} />
      </Card>
    </div>
  )
}
