import { createClient } from "@/lib/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    // Verify the note belongs to the user
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, owner_id")
      .eq("id", id)
      .single()

    if (fetchError || !note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      )
    }

    if (note.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Archive the note
    const { data: archived, error: updateError } = await supabase
      .from("notes")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: archived })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to archive note" },
      { status: 500 }
    )
  }
}
