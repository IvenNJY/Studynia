import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Mistake = {
  question_id: string
  user_answer: unknown
  assessment_attempts: { id: string } | null
}

type AssessmentQuestion = {
  id: string
  question_text: string | null
  correct_answer: string | null
  options: unknown
  explanation: string | null
  topic: string | null
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
      .select(`id, score, created_at, assessments ( title, difficulty_level, course_id )`)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (attemptsError) throw attemptsError

    // 2. Fetch recent mistakes
    const { data: mistakesData, error: mistakesError } = await supabase
      .from("attempt_answers")
      .select(`
        question_id, is_correct, user_answer,
        assessment_attempts!inner ( id, user_id )
      `)
      .eq("assessment_attempts.user_id", userId)
      .eq("is_correct", false)
      .order("created_at", { ascending: false })

    if (mistakesError) throw mistakesError

    const questionIds = [...new Set(((mistakesData ?? []) as unknown as Mistake[]).map((item) => item.question_id))]
    const { data: questionRows, error: questionsError } = questionIds.length
      ? await supabase
        .from("assessment_questions")
        .select("id, question_text, correct_answer, options, explanation, topic")
        .in("id", questionIds)
      : { data: [], error: null }

    if (questionsError) throw questionsError
    const questionsById = new Map(((questionRows ?? []) as AssessmentQuestion[]).map((question) => [question.id, question]))

    // 3. Fetch created assessments
    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from("assessments")
      .select("id, title, created_at, source")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (assessmentsError) throw assessmentsError

    const mistakesByAttempt = ((mistakesData ?? []) as unknown as Mistake[]).reduce<Record<string, Array<{
      question: string
      topic: string | null
      userAnswer: string
      correctAnswer: string
      explanation: string | null
      options: unknown
    }>>>((grouped, item) => {
      const attemptId = item.assessment_attempts?.id
      if (!attemptId) return grouped
      const answer = item.user_answer
      const userAnswer = answer && typeof answer === "object" && "value" in answer
        ? String((answer as { value?: unknown }).value)
        : "Unknown"
      const question = questionsById.get(item.question_id)
      ;(grouped[attemptId] ??= []).push({
        question: question?.question_text || "Question unavailable",
        topic: question?.topic || null,
        userAnswer,
        correctAnswer: question?.correct_answer || "Unavailable",
        explanation: question?.explanation || null,
        options: question?.options,
      })
      return grouped
    }, {})

    const mistakesWithQuestions = ((mistakesData ?? []) as unknown as Mistake[]).map((item) => ({
      ...item,
      assessment_questions: questionsById.get(item.question_id) ?? null,
    }))

    return NextResponse.json({
      attempts: attemptsData || [], 
      mistakes: mistakesWithQuestions,
      assessments: assessmentsData || [],
      mistakesByAttempt,
    })

  } catch (error: unknown) {
    console.error("Database Fetch Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database fetch failed" }, { status: 500 })
  }
}
