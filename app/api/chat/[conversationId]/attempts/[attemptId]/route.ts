import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

const admin = () => createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string; attemptId: string }> }) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  const { conversationId, attemptId } = await params
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const supabase = admin()
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data: sharedMessage } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("attempt_id", attemptId)
    .limit(1)
    .maybeSingle()
  const { data: explicitShare } = await supabase
    .from("assessment_shares")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("shared_with_id", user.id)
    .maybeSingle()
  if (!sharedMessage && !explicitShare) return NextResponse.json({ error: "This assessment has not been shared with you" }, { status: 403 })

  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id, user_id, score, total_questions, correct_answers, completed_at, created_at, assessments(title)")
    .eq("id", attemptId)
    .maybeSingle()
  if (attemptError) return NextResponse.json({ error: "Failed to load attempt" }, { status: 500 })
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  const { data: conversationParticipants } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
  if (!explicitShare && !conversationParticipants?.some((conversationParticipant) => conversationParticipant.user_id === attempt.user_id)) {
    return NextResponse.json({ error: "Attempt is not part of this conversation" }, { status: 403 })
  }

  const { data: answers, error: answersError } = await supabase
    .from("attempt_answers")
    .select("id, user_answer, is_correct, assessment_questions(question_text, correct_answer, topic)")
    .eq("attempt_id", attemptId)
  if (answersError) return NextResponse.json({ error: "Failed to load attempt answers" }, { status: 500 })

  return NextResponse.json({ attempt, answers: answers ?? [] })
}
