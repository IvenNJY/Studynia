import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Mistake = {
  user_answer: unknown
  assessment_questions: {
    question_text: string | null
    correct_answer: string | null
    topic: string | null
  } | null
  assessment_attempts: { id: string } | null
}

// Add the context parameter to access dynamic route params
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // 1. Fetch recent attempts
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("assessment_attempts")
      .select(`id, score, created_at, assessments ( title, difficulty_level )`)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (attemptsError) throw attemptsError

    // 2. Fetch recent mistakes
    const { data: mistakesData, error: mistakesError } = await supabase
      .from("attempt_answers")
      .select(`
        is_correct, user_answer,
        assessment_questions ( question_text, correct_answer, options, topic ),
        assessment_attempts!inner ( id, user_id )
      `)
      .eq("assessment_attempts.user_id", userId)
      .eq("is_correct", false)
      .order("created_at", { ascending: false })

    if (mistakesError) throw mistakesError

    // 3. Fetch created assessments
    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from("assessments")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (assessmentsError) throw assessmentsError

    const mistakesByAttempt = ((mistakesData ?? []) as unknown as Mistake[]).reduce<Record<string, Array<{
      question: string
      topic: string | null
      userAnswer: string
      correctAnswer: string
    }>>>((grouped, item) => {
      const attemptId = item.assessment_attempts?.id
      if (!attemptId) return grouped
      const answer = item.user_answer
      const userAnswer = answer && typeof answer === "object" && "value" in answer
        ? String((answer as { value?: unknown }).value)
        : "Unknown"
      const question = item.assessment_questions
      ;(grouped[attemptId] ??= []).push({
        question: question?.question_text || "Question unavailable",
        topic: question?.topic || null,
        userAnswer,
        correctAnswer: question?.correct_answer || "Unavailable",
      })
      return grouped
    }, {})

    return NextResponse.json({
      attempts: attemptsData || [], 
      mistakes: mistakesData || [],
      assessments: assessmentsData || [],
      mistakesByAttempt,
    })

  } catch (error: unknown) {
    console.error("Database Fetch Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database fetch failed" }, { status: 500 })
  }
}