import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"

// Initialize Supabase client (ensure you use your actual env variables or SSR client)
export async function POST(req: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
    }

    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { courseId, title, testType, sourceList, quiz } = body

    // 1. Insert the Assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        title: title,
        // test_type: testType,
        source: JSON.stringify(sourceList),
        difficulty_level: 50, // Default or pass from frontend
      })
      .select("id")
      .single()

    if (assessmentError) throw assessmentError

    // 2. Format the questions for bulk insertion
    const questionsToInsert = quiz.map((q: any) => ({
      assessment_id: assessment.id,
      question_text: q.question,
      question_type: "mcq", // Matches your schema ENUM
      options: q.options,   // Stored as JSONB
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }))

    // 3. Bulk insert the questions and RETRIEVE their generated UUIDs
    const { data: insertedQuestions, error: questionsError } = await supabase
    .from("assessment_questions")
    .insert(questionsToInsert)
    .select() // <-- Crucial: this returns the inserted rows with their IDs

    if (questionsError) throw questionsError

    // Combine the original AI quiz JSON with the new Database IDs
    const quizWithDbIds = quiz.map((q: any, index: number) => ({
    ...q,
    id: insertedQuestions[index].id // Append the DB ID to the question object
    }))

    return NextResponse.json({ 
    success: true, 
    assessmentId: assessment.id,
    quiz: quizWithDbIds // Return the updated array to the frontend
    })

  } catch (error: any) {
    console.error("Database Insert Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}