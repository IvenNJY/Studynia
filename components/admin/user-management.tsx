"use client"

import { useMemo, useState } from "react"
import { Pencil, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUser } from "@/components/admin/admin-dashboard"

type UserManagementProps = {
  users: AdminUser[]
  currentUserId: string
}

export function UserManagement({ users: initialUsers, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch = !query || [user.full_name, user.institution_name, user.role]
        .some((value) => value?.toLowerCase().includes(query))
      const matchesRole = roleFilter === "all" || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [roleFilter, search, users])

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUser) return

    setIsSaving(true)
    const formData = new FormData(event.currentTarget)
    const payload = {
      id: editingUser.id,
      full_name: formData.get("full_name"),
      institution_name: formData.get("institution_name"),
      role: formData.get("role"),
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user")
      }

      setUsers((currentUsers) => currentUsers.map((user) =>
        user.id === result.user.id ? result.user : user
      ))
      setEditingUser(null)
      toast.success("User updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." className="pl-7" />
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-7 rounded-md border border-input bg-input/20 px-2 text-xs">
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="supervisor">Supervisors</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Institution</TableHead><TableHead>Role</TableHead><TableHead>Updated</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {filteredUsers.length > 0 ? filteredUsers.map((user) => {
            const canEdit = user.id !== currentUserId && user.role !== "admin"

            return <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || "Unnamed user"}</TableCell>
              <TableCell className="text-muted-foreground">{user.institution_name || "-"}</TableCell>
              <TableCell><Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role || "unassigned"}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{formatDate(user.updated_at)}</TableCell>
              <TableCell>{canEdit ? <Button variant="ghost" size="icon-sm" title="Edit user" onClick={() => setEditingUser(user)}><Pencil /></Button> : <span className="text-xs text-muted-foreground">Protected</span>}</TableCell>
            </TableRow>
          }) : <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No matching users.</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update this user&apos;s profile and access role.</DialogDescription>
          </DialogHeader>
          {editingUser && <form onSubmit={saveUser} className="space-y-3">
            <div className="space-y-1"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" defaultValue={editingUser.full_name || ""} /></div>
            <div className="space-y-1"><Label htmlFor="institution_name">Institution</Label><Input id="institution_name" name="institution_name" defaultValue={editingUser.institution_name || ""} /></div>
            <div className="space-y-1"><Label htmlFor="role">Role</Label><select id="role" name="role" defaultValue={editingUser.role === "supervisor" ? "supervisor" : "student"} className="h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs"><option value="student">Student</option><option value="supervisor">Supervisor</option></select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
}