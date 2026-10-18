import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  const { attemptId } = await params
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: share } = await admin
    .from("assessment_shares")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("shared_with_id", user.id)
    .maybeSingle()
  if (!share) return NextResponse.json({ error: "You do not have access to this assessment" }, { status: 403 })

  const { data: attempt, error: attemptError } = await admin
    .from("assessment_attempts")
    .select("id, user_id, score, total_questions, correct_answers, completed_at, created_at, assessments(title, course_id)")
    .eq("id", attemptId)
    .eq("status", "completed")
    .maybeSingle()
  if (attemptError) return NextResponse.json({ error: "Failed to load assessment" }, { status: 500 })
  if (!attempt) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })

  const { data: answers, error: answersError } = await admin
    .from("attempt_answers")
    .select("id, question_id, user_answer, is_correct")
    .eq("attempt_id", attemptId)
  if (answersError) return NextResponse.json({ error: "Failed to load assessment answers" }, { status: 500 })

  const questionIds = [...new Set((answers ?? []).map((answer) => answer.question_id).filter(Boolean))]
  const { data: questions, error: questionsError } = questionIds.length
    ? await admin
      .from("assessment_questions")
      .select("id, question_text, correct_answer, options, explanation, topic")
      .in("id", questionIds)
    : { data: [], error: null }
  if (questionsError) return NextResponse.json({ error: "Failed to load assessment questions" }, { status: 500 })

  const questionsById = new Map((questions ?? []).map((question) => [question.id, question]))
  const answersWithQuestions = (answers ?? []).map((answer) => ({
    ...answer,
    assessment_questions: questionsById.get(answer.question_id) ?? null,
  }))
  return NextResponse.json({ attempt, answers: answersWithQuestions })
}
