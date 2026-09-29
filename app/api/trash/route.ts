import { createClient } from "@/lib/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

  try {
    const { data: notes, error } = await supabase
      .from("notes")
      .select("id, title, content, created_at, updated_at, is_archived")
      .eq("owner_id", user.id)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: notes })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch trash" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

  try {
    // Delete all archived notes for this user
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("owner_id", user.id)
      .eq("is_archived", true)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to empty trash" },
      { status: 500 }
    )
  }
}
