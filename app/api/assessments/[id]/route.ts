import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/server"
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

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { data: { user }, error: authError } = await (await createServerClient()).auth.getUser()
		if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

		const { id: assessmentId } = await params
		if (!assessmentId) return NextResponse.json({ error: "Missing assessment ID" }, { status: 400 })

		const { data: assessment, error: assessmentError } = await supabase
			.from("assessments")
			.select("id, user_id, source")
			.eq("id", assessmentId)
			.eq("user_id", user.id)
			.maybeSingle()
		if (assessmentError) throw assessmentError
		if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })

		let status = "ready"
		if (typeof assessment.source === "string") {
			try {
				status = JSON.parse(assessment.source).status || "ready"
			} catch {
				status = "ready"
			}
		}
		if (status !== "failed") {
			return NextResponse.json({ error: "Only failed generations can be deleted" }, { status: 409 })
		}

		const { error: notificationError } = await supabase
			.from("inbox_notifications")
			.delete()
			.eq("assessment_id", assessmentId)
			.eq("recipient_id", user.id)
		if (notificationError) throw notificationError

		const { error: questionsError } = await supabase
			.from("assessment_questions")
			.delete()
			.eq("assessment_id", assessmentId)
		if (questionsError) throw questionsError

		const { error: deleteError } = await supabase
			.from("assessments")
			.delete()
			.eq("id", assessmentId)
			.eq("user_id", user.id)
		if (deleteError) throw deleteError

		return NextResponse.json({ success: true })
	} catch (error: unknown) {
		console.error("Error deleting failed assessment:", error)
		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete assessment" }, { status: 500 })
	}
}
