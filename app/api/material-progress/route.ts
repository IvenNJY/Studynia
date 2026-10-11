import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

type ProgressUpdate = { material_id: string; viewed: boolean }

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { updates?: ProgressUpdate[] }
  const updates = (body.updates ?? []).filter(
    (update) => typeof update.material_id === "string" && typeof update.viewed === "boolean"
  )
  if (updates.length === 0) return NextResponse.json({ success: true, updated: 0 })

  const materialIds = updates.map((update) => update.material_id)
  const { data: ownedMaterials, error: materialError } = await userClient
    .from("materials")
    .select("id")
    .eq("user_id", user.id)
    .in("id", materialIds)
  if (materialError) return NextResponse.json({ error: "Failed to validate materials" }, { status: 500 })

  const ownedIds = new Set((ownedMaterials ?? []).map((material) => material.id))
  const rows = updates
    .filter((update) => ownedIds.has(update.material_id))
    .map((update) => ({
      user_id: user.id,
      material_id: update.material_id,
      viewed: update.viewed,
      viewed_at: update.viewed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length > 0) {
    const { error } = await userClient
      .from("material_progress")
      .upsert(rows, { onConflict: "user_id,material_id" })
    if (error) return NextResponse.json({ error: "Failed to save material progress" }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: rows.length })
}
