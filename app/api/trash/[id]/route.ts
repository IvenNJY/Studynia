import { createClient } from "@/lib/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
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
    // Verify the note belongs to the user and is archived
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, owner_id, is_archived")
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

    if (!note.is_archived) {
      return NextResponse.json(
        { error: "Note is not in trash" },
        { status: 400 }
      )
    }

    // Delete the note permanently
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    // Verify the note belongs to the user and is archived
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, owner_id, is_archived")
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

    if (!note.is_archived) {
      return NextResponse.json(
        { error: "Note is not in trash" },
        { status: 400 }
      )
    }

    // Restore the note
    const { data: restored, error: updateError } = await supabase
      .from("notes")
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: restored })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to restore note" },
      { status: 500 }
    )
  }
}
