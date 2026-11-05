import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { NextResponse } from "next/server"

type Attempt = {
	id: string
	assessment_id: string
	score: number | null
	total_questions: number | null
	correct_answers: number | null
	completed_at: string | null
	created_at: string | null
}

type Answer = {
	user_answer: unknown
	assessment_questions: { question_text: string; correct_answer: string | null; explanation: string | null; topic: string | null; source_id: number | null } | null
	assessment_attempts: { assessment_id: string } | null
}

type Assessment = { id: string; title: string; course_id: string | null; source: string | null }

function getScore(attempt: Attempt) {
	if (typeof attempt.score === "number") return attempt.score
	if (attempt.total_questions && typeof attempt.correct_answers === "number") {
		return Math.round((attempt.correct_answers / attempt.total_questions) * 100)
	}
	return null
}

function getSourceLabels(source: string | null) {
	if (!source) return new Map<number, string>()
	try {
		const parsed: unknown = JSON.parse(source)
		const values = Array.isArray(parsed)
			? parsed
			: parsed && typeof parsed === "object" && Array.isArray((parsed as { source_list?: unknown }).source_list)
				? (parsed as { source_list: unknown[] }).source_list
				: []
		return new Map(values.flatMap((value) => {
			if (!value || typeof value !== "object") return []
			const record = value as Record<string, unknown>
			const sourceId = typeof record.source_id === "number"
				? record.source_id
				: typeof record.source_id === "string" && record.source_id.trim() !== ""
					? Number(record.source_id)
					: NaN
			const filename = record.filename
			return Number.isInteger(sourceId) && typeof filename === "string" ? [[sourceId, filename] as const] : []
		}))
	} catch {
		return new Map()
	}
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params
		const supabaseServer = await createServerClient()
		const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
		if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

		const { data: supervisor } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle()
		if (supervisor?.role !== "supervisor") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

		const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
		const [studentResult, coursesResult, assessmentsResult, attemptsResult, answersResult] = await Promise.all([
			supabaseAdmin.from("profiles").select("id, full_name, institution_name").eq("id", id).eq("role", "student").maybeSingle(),
			supabaseAdmin.from("courses").select("id, course_name, course_code"),
			supabaseAdmin.from("assessments").select("id, title, course_id, source"),
			supabaseAdmin.from("assessment_attempts").select("id, assessment_id, score, total_questions, correct_answers, completed_at, created_at").eq("user_id", id).eq("status", "completed").order("created_at", { ascending: false }),
			supabaseAdmin.from("attempt_answers").select("assessment_questions(question_text, topic, source_id), assessment_attempts!inner(assessment_id, user_id)").eq("assessment_attempts.user_id", id).eq("is_correct", false),
		])

		const queryError = studentResult.error || coursesResult.error || assessmentsResult.error || attemptsResult.error || answersResult.error
		if (queryError) return NextResponse.json({ error: "Failed to load student performance" }, { status: 500 })
		if (!studentResult.data) return NextResponse.json({ error: "Student not found" }, { status: 404 })

		const courses = new Map((coursesResult.data ?? []).map((course) => [course.id, course]))
		const assessments = new Map(((assessmentsResult.data ?? []) as Assessment[]).map((assessment) => [assessment.id, assessment]))
		const sourceLabels = new Map<string, Map<number, string>>(
			((assessmentsResult.data ?? []) as Assessment[]).map((assessment) => [assessment.id, getSourceLabels(assessment.source)])
		)
		const attempts = (attemptsResult.data ?? []) as Attempt[]
		const attemptHistory = attempts.flatMap((attempt) => {
			const score = getScore(attempt)
			if (score === null) return []
			const assessment = assessments.get(attempt.assessment_id)
			const course = assessment?.course_id ? courses.get(assessment.course_id) : undefined
			return [{ id: attempt.id, assessmentTitle: assessment?.title || "Untitled assessment", courseId: assessment?.course_id || null, courseName: course?.course_name || "Unassigned course", courseCode: course?.course_code || null, score, completedAt: attempt.completed_at || attempt.created_at }]
		})

		const courseStats = new Map<string, { total: number; attempts: number }>()
		for (const attempt of attempts) {
			const score = getScore(attempt)
			const courseId = assessments.get(attempt.assessment_id)?.course_id
			if (score === null || !courseId) continue
			const stats = courseStats.get(courseId) ?? { total: 0, attempts: 0 }
			stats.total += score
			stats.attempts += 1
			courseStats.set(courseId, stats)
		}

		const weakAreas = new Map<string, { area: string; incorrectCount: number; incorrectCountsByCourse: Map<string, number>; courseNames: Set<string>; courseIds: Set<string>; quizzes: Set<string>; incorrectAnswers: Array<{ question: string; userAnswer: unknown; correctAnswer: string | null; explanation: string | null; courseId: string | null }>; sources: Map<string, { sourceId: number | null; name: string; incorrectCount: number; incorrectCountsByCourse: Map<string, number>; courseIds: Set<string> }> }>()
		for (const answer of (answersResult.data ?? []) as unknown as Answer[]) {
			const area = answer.assessment_questions?.topic || answer.assessment_questions?.question_text || "Uncategorised"
			const assessment = answer.assessment_attempts?.assessment_id ? assessments.get(answer.assessment_attempts.assessment_id) : undefined
			const courseName = assessment?.course_id ? courses.get(assessment.course_id)?.course_name : undefined
			const current = weakAreas.get(area) ?? { area, incorrectCount: 0, incorrectCountsByCourse: new Map<string, number>(), courseNames: new Set<string>(), courseIds: new Set<string>(), quizzes: new Set<string>(), incorrectAnswers: [], sources: new Map<string, { sourceId: number | null; name: string; incorrectCount: number; incorrectCountsByCourse: Map<string, number>; courseIds: Set<string> }>() }
			current.incorrectCount += 1
			if (courseName && assessment?.course_id) {
				current.courseNames.add(courseName)
				current.courseIds.add(assessment.course_id)
				current.incorrectCountsByCourse.set(assessment.course_id, (current.incorrectCountsByCourse.get(assessment.course_id) ?? 0) + 1)
			}
			if (assessment) {
				current.incorrectAnswers.push({ question: answer.assessment_questions?.question_text || "Question unavailable", userAnswer: answer.user_answer, correctAnswer: answer.assessment_questions?.correct_answer || null, explanation: answer.assessment_questions?.explanation || null, courseId: assessment.course_id })
				current.quizzes.add(assessment.title)
				const sourceId = answer.assessment_questions?.source_id
				const sourceName = sourceId === null || sourceId === undefined
					? "Unknown source"
					: sourceLabels.get(assessment.id)?.get(sourceId) || `Source ${sourceId}`
				const sourceKey = `${sourceId ?? "unknown"}:${sourceName}`
				const source = current.sources.get(sourceKey) ?? { sourceId: sourceId ?? null, name: sourceName, incorrectCount: 0, incorrectCountsByCourse: new Map<string, number>(), courseIds: new Set<string>() }
				source.incorrectCount += 1
				if (assessment.course_id) {
					source.courseIds.add(assessment.course_id)
					source.incorrectCountsByCourse.set(assessment.course_id, (source.incorrectCountsByCourse.get(assessment.course_id) ?? 0) + 1)
				}
				current.sources.set(sourceKey, source)
			}
			weakAreas.set(area, current)
		}

		return NextResponse.json({
			student: { id: studentResult.data.id, name: studentResult.data.full_name || "Unnamed student", institutionName: studentResult.data.institution_name },
			attemptHistory,
			courseScores: Array.from(courseStats.entries()).map(([courseId, stats]) => ({ courseId, courseName: courses.get(courseId)?.course_name || "Unknown course", courseCode: courses.get(courseId)?.course_code || null, averageScore: Math.round(stats.total / stats.attempts), attempts: stats.attempts })),
			weakAreas: Array.from(weakAreas.values()).map((area) => ({ area: area.area, incorrectCount: area.incorrectCount, incorrectCountsByCourse: Object.fromEntries(area.incorrectCountsByCourse), courses: Array.from(area.courseNames), courseIds: Array.from(area.courseIds), quizzes: Array.from(area.quizzes), incorrectAnswers: area.incorrectAnswers, sources: Array.from(area.sources.values()).map((source) => ({ sourceId: source.sourceId, name: source.name, incorrectCount: source.incorrectCount, incorrectCountsByCourse: Object.fromEntries(source.incorrectCountsByCourse), courseIds: Array.from(source.courseIds) })) })).sort((left, right) => right.incorrectCount - left.incorrectCount),
		})
	} catch (error: unknown) {
		console.error("Student performance error:", error)
		return NextResponse.json({ error: "Failed to load student performance" }, { status: 500 })
	}
}