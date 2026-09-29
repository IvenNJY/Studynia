import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params

    if (!assessmentId) {
      return NextResponse.json({ error: "Missing assessment ID" }, { status: 400 })
    }

    const { data: questions, error } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error("Error fetching assessment questions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}