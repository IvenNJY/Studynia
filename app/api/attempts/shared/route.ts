import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

type SharedAttempt = {
  id: string
  user_id: string
  score: number
  total_questions: number | null
  correct_answers: number | null
  completed_at: string | null
  created_at: string
  assessments: { title: string | null; difficulty_level: string | null } | null
}

export async function GET() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: shares, error: sharesError } = await admin
    .from("assessment_shares")
    .select("attempt_id, shared_with_id")
    .eq("shared_with_id", user.id)
  if (sharesError) return NextResponse.json({ error: "Failed to load shared assessments" }, { status: 500 })

  const attemptIds = (shares ?? []).map((share) => share.attempt_id)
  if (attemptIds.length === 0) return NextResponse.json({ users: [] })

  const { data: attempts, error: attemptsError } = await admin
    .from("assessment_attempts")
    .select("id, user_id, score, total_questions, correct_answers, completed_at, created_at, assessments(title, difficulty_level)")
    .in("id", attemptIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
  if (attemptsError) return NextResponse.json({ error: "Failed to load shared assessments" }, { status: 500 })

  const ownerIds = [...new Set((attempts ?? []).map((attempt) => attempt.user_id))]
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", ownerIds)
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]))
  const grouped = new Map<string, { id: string; name: string; attempts: SharedAttempt[] }>()
  const normalizedAttempts: SharedAttempt[] = (attempts ?? []).map((attempt) => {
    const raw = attempt as unknown as SharedAttempt & { assessments?: SharedAttempt["assessments"] | SharedAttempt["assessments"][] }
    return {
      ...raw,
      assessments: Array.isArray(raw.assessments) ? raw.assessments[0] ?? null : raw.assessments ?? null,
    }
  })
  for (const attempt of normalizedAttempts) {
    const current: { id: string; name: string; attempts: SharedAttempt[] } = grouped.get(attempt.user_id) ?? {
      id: attempt.user_id,
      name: names.get(attempt.user_id) || "Studynia user",
      attempts: [],
    }
    current.attempts.push(attempt)
    grouped.set(attempt.user_id, current)
  }
  return NextResponse.json({ users: [...grouped.values()] })
}
