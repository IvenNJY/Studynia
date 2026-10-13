import { createHmac, timingSafeEqual } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type GeneratedQuestion = {
  question: string
  options: Record<string, string>
  correct_answer: string
  explanation?: string | null
  source_id?: number | null
}

type CompletionRequest = {
  job_id: string
  owner_id: string
  assessment_id: string
  status: "completed" | "failed"
  result?: { source_list: unknown; quiz: GeneratedQuestion[] }
  error?: string
}

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as CompletionRequest | null
  if (!body?.job_id || !body.owner_id || !body.assessment_id || !["completed", "failed"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid completion payload" }, { status: 400 })
  }

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  const suppliedToken = request.headers.get("x-assessment-callback-token") || ""
  if (!secret) return NextResponse.json({ error: "Callback authentication is not configured" }, { status: 500 })
  const expectedToken = createHmac("sha256", secret)
    .update(`${body.job_id}:${body.assessment_id}:${body.owner_id}`)
    .digest("hex")
  const supplied = Buffer.from(suppliedToken)
  const expected = Buffer.from(expectedToken)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid callback token" }, { status: 401 })
  }

  const supabase = admin()
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, title, source")
    .eq("id", body.assessment_id)
    .eq("user_id", body.owner_id)
    .maybeSingle()
  if (assessmentError || !assessment) return NextResponse.json({ error: "Assessment job not found" }, { status: 404 })

  const sourceState = typeof assessment.source === "string"
    ? JSON.parse(assessment.source) as { status?: string }
    : null
  if (sourceState?.status === "ready") {
    const notificationError = await createCompletionNotification(supabase, body.owner_id, body.assessment_id, assessment.title, "ready")
    if (notificationError) return NextResponse.json({ error: notificationError }, { status: 500 })
    return NextResponse.json({ success: true, alreadyCompleted: true })
  }
  if (sourceState?.status === "failed") {
    const notificationError = await createCompletionNotification(supabase, body.owner_id, body.assessment_id, assessment.title, "failed")
    if (notificationError) return NextResponse.json({ error: notificationError }, { status: 500 })
    return NextResponse.json({ success: true, alreadyCompleted: true })
  }

  if (body.status === "failed") {
    const message = body.error || "Assessment generation failed. Please try again."
    const { error } = await supabase
      .from("assessments")
      .update({ source: JSON.stringify({ status: "failed", error: message }) })
      .eq("id", body.assessment_id)
      .eq("user_id", body.owner_id)
    if (error) return NextResponse.json({ error: "Failed to save generation status" }, { status: 500 })
    const notificationError = await createCompletionNotification(supabase, body.owner_id, body.assessment_id, assessment.title, "failed")
    if (notificationError) return NextResponse.json({ error: notificationError }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const quiz = body.result?.quiz
  if (!Array.isArray(quiz) || quiz.length === 0 || quiz.some((question) => (
    typeof question.question !== "string" || !question.options || typeof question.correct_answer !== "string"
  ))) {
    return NextResponse.json({ error: "Generated questions are missing or invalid" }, { status: 422 })
  }

  const { data: existingQuestions, error: existingError } = await supabase
    .from("assessment_questions")
    .select("id")
    .eq("assessment_id", body.assessment_id)
    .limit(1)
  if (existingError) return NextResponse.json({ error: "Failed to check saved questions" }, { status: 500 })

  if (!existingQuestions?.length) {
    const { error: questionsError } = await supabase
      .from("assessment_questions")
      .insert(quiz.map((question) => ({
        assessment_id: body.assessment_id,
        source_id: question.source_id ?? null,
        question_text: question.question,
        question_type: "mcq",
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation ?? null,
      })))
    if (questionsError) return NextResponse.json({ error: "Failed to save generated questions" }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from("assessments")
    .update({ source: JSON.stringify({ status: "ready", source_list: body.result?.source_list ?? [] }) })
    .eq("id", body.assessment_id)
    .eq("user_id", body.owner_id)
  if (updateError) return NextResponse.json({ error: "Failed to mark assessment ready" }, { status: 500 })

  const notificationError = await createCompletionNotification(supabase, body.owner_id, body.assessment_id, assessment.title, "ready")
  if (notificationError) return NextResponse.json({ error: notificationError }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function createCompletionNotification(
  supabase: ReturnType<typeof admin>,
  userId: string,
  assessmentId: string,
  assessmentTitle: string,
  status: "ready" | "failed",
): Promise<string | null> {
  const ready = status === "ready"
  const title = ready ? "Your assessment is ready" : "Assessment generation failed"
  const body = ready
    ? `“${assessmentTitle}” is ready in Past Assessments. Open Practice to start it.`
    : `“${assessmentTitle}” could not be generated. You can try again from Practice.`
  const { data: existing, error: lookupError } = await supabase
    .from("inbox_notifications")
    .select("id")
    .eq("recipient_id", userId)
    .eq("assessment_id", assessmentId)
    .eq("notification_type", "assessment_share")
    .limit(1)
    .maybeSingle()
  if (lookupError) return lookupError.message
  if (existing) return null

  const { error } = await supabase.from("inbox_notifications").insert({
    recipient_id: userId,
    actor_id: userId,
    notification_type: "assessment_share",
    assessment_id: assessmentId,
    title,
    body,
  })
  return error?.message ?? null
}
