import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use the Service Role Key to bypass Row Level Security on the server.
// Ensure these environment variables are correctly set in your .env.local file.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      userId, 
      assessmentId, 
      score, 
      totalQuestions, 
      correctAnswers, 
      answers 
    } = body

    if (!userId || !assessmentId) {
      return NextResponse.json(
        { error: "Missing required fields: userId or assessmentId" }, 
        { status: 400 }
      )
    }

    // 1. Create the Attempt Record
    const { data: attempt, error: attemptError } = await supabase
      .from("assessment_attempts")
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        score: score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (attemptError) {
      console.error("Error creating attempt record:", attemptError)
      throw attemptError
    }

    // 2. Prepare and Insert the Individual Answers
    if (answers && answers.length > 0 && attempt?.id) {
      const answersToInsert = answers.map((ans: any) => ({
        attempt_id: attempt.id,
        question_id: ans.question_id,
        user_answer: ans.user_answer ? { value: ans.user_answer } : null, 
        is_correct: ans.is_correct
      }))

      const { error: answersError } = await supabase
        .from("attempt_answers")
        .insert(answersToInsert)

      if (answersError) {
        console.error("Error inserting attempt answers:", answersError)
        throw answersError
      }
    }

    return NextResponse.json({ success: true, attemptId: attempt?.id })

  } catch (error: any) {
    console.error("Failed to save attempt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}