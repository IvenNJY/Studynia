import { NextResponse } from "next/server"

import { createClient } from "@/lib/server"

const editableRoles = ["student", "supervisor"] as const
type EditableRole = (typeof editableRoles)[number]

function isEditableRole(value: unknown): value is EditableRole {
  return typeof value === "string" && editableRoles.includes(value as EditableRole)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user: actor },
  } = await supabase.auth.getUser()

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle()

  if (actorProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as {
    id?: unknown
    full_name?: unknown
    institution_name?: unknown
    role?: unknown
  }

  const id = typeof body.id === "string" ? body.id : ""
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const institutionName = typeof body.institution_name === "string" ? body.institution_name.trim() : ""

  if (!id || !isEditableRole(body.role)) {
    return NextResponse.json({ error: "A valid user and editable role are required" }, { status: 400 })
  }

  if (id === actor.id) {
    return NextResponse.json({ error: "You cannot edit your own account" }, { status: 403 })
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle()

  if (targetError || !target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be edited here" }, { status: 403 })
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      institution_name: institutionName || null,
      role: body.role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, full_name, role, institution_name, updated_at")
    .maybeSingle()

  if (updateError || !updatedUser) {
    return NextResponse.json({ error: updateError?.message || "Failed to update user" }, { status: 500 })
  }

  return NextResponse.json({ user: updatedUser })
}