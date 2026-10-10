import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { NextResponse } from "next/server"

type Profile = {
	id: string
	full_name: string | null
	institution_name: string | null
}

type Course = {
	id: string
	course_name: string
	course_code: string | null
}

type Assessment = {
	id: string
	course_id: string | null
	title: string
}

type Attempt = {
	user_id: string
	assessment_id: string
	score: number | null
	total_questions: number | null
	correct_answers: number | null
	completed_at: string | null
	created_at: string | null
}

type AttemptAnswer = {
	is_correct: boolean | null
	assessment_questions: { question_text: string; topic: string | null } | null
	assessment_attempts: {
		user_id: string
		assessment_id: string
		completed_at: string | null
		created_at: string | null
	} | null
}

function getScore(attempt: Attempt) {
	if (typeof attempt.score === "number") return attempt.score
	if (attempt.total_questions && typeof attempt.correct_answers === "number") {
		return Math.round((attempt.correct_answers / attempt.total_questions) * 100)
	}
	return null
}

export async function GET() {
	try {
		const supabaseServer = await createServerClient()
		const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
		}

		const { data: supervisorProfile, error: profileError } = await supabaseServer
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.maybeSingle()

		if (profileError || supervisorProfile?.role !== "supervisor") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 })
		}

		const supabaseAdmin = createAdminClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		const [studentsResult, coursesResult, assessmentsResult, attemptsResult, answersResult] = await Promise.all([
			supabaseAdmin
				.from("profiles")
				.select("id, full_name, institution_name")
				.eq("role", "student"),
			supabaseAdmin.from("courses").select("id, course_name, course_code"),
			supabaseAdmin.from("assessments").select("id, course_id, title"),
			supabaseAdmin
				.from("assessment_attempts")
				.select("user_id, assessment_id, score, total_questions, correct_answers, completed_at, created_at")
				.eq("status", "completed"),
			supabaseAdmin
				.from("attempt_answers")
				.select("is_correct, assessment_questions(question_text, topic), assessment_attempts!inner(user_id, assessment_id, completed_at, created_at)")
				.eq("is_correct", false),
		])

		const queryError = studentsResult.error || coursesResult.error || assessmentsResult.error || attemptsResult.error || answersResult.error
		if (queryError) {
			console.error("Supervisor performance load error:", queryError)
			return NextResponse.json({ error: "Failed to load supervisor performance" }, { status: 500 })
		}

		const students = (studentsResult.data ?? []) as Profile[]
		const courses = new Map(((coursesResult.data ?? []) as Course[]).map((course) => [course.id, course]))
		const assessments = new Map(((assessmentsResult.data ?? []) as Assessment[]).map((assessment) => [assessment.id, assessment]))
		const studentById = new Map(students.map((student) => [student.id, student]))

		const studentStats = new Map<string, { totalScore: number; attempts: number; lastActivityAt: string | null; courseIds: Set<string> }>()
		const courseStats = new Map<string, { courseId: string; totalScore: number; attempts: number; lastActivityAt: string | null }>()
		const attemptHistory = [] as Array<{
			id: string
			studentId: string
			studentName: string
			assessmentTitle: string
			courseId: string | null
			courseName: string
			courseCode: string | null
			score: number
			completedAt: string | null
		}>

		for (const rawAttempt of (attemptsResult.data ?? []) as Attempt[]) {
			if (!studentById.has(rawAttempt.user_id)) continue
			const score = getScore(rawAttempt)
			if (score === null) continue

			const timestamp = rawAttempt.completed_at || rawAttempt.created_at
			const assessment = assessments.get(rawAttempt.assessment_id)
			const courseId = assessment?.course_id
			const course = courseId ? courses.get(courseId) : undefined
			attemptHistory.push({
				id: `${rawAttempt.user_id}:${rawAttempt.assessment_id}:${timestamp || rawAttempt.created_at || "unknown"}`,
				studentId: rawAttempt.user_id,
				studentName: studentById.get(rawAttempt.user_id)?.full_name || "Unnamed student",
				assessmentTitle: assessment?.title || "Untitled assessment",
				courseId: courseId || null,
				courseName: course?.course_name || "Unassigned course",
				courseCode: course?.course_code || null,
				score,
				completedAt: timestamp,
			})
			const currentStudent = studentStats.get(rawAttempt.user_id) ?? {
				totalScore: 0,
				attempts: 0,
				lastActivityAt: null,
				courseIds: new Set<string>(),
			}

			currentStudent.totalScore += score
			currentStudent.attempts += 1
			if (timestamp && (!currentStudent.lastActivityAt || timestamp > currentStudent.lastActivityAt)) {
				currentStudent.lastActivityAt = timestamp
			}
			if (courseId) currentStudent.courseIds.add(courseId)
			studentStats.set(rawAttempt.user_id, currentStudent)

			if (!courseId || !courses.has(courseId)) continue
			const key = courseId
			const currentCourse = courseStats.get(key) ?? {
				courseId,
				totalScore: 0,
				attempts: 0,
				lastActivityAt: null,
			}

			currentCourse.totalScore += score
			currentCourse.attempts += 1
			if (timestamp && (!currentCourse.lastActivityAt || timestamp > currentCourse.lastActivityAt)) {
				currentCourse.lastActivityAt = timestamp
			}
			courseStats.set(key, currentCourse)
		}

		const weakAreaStats = new Map<string, { studentId: string; area: string; incorrectCount: number; courses: Set<string> }>()
		for (const answer of (answersResult.data ?? []) as unknown as AttemptAnswer[]) {
			const attempt = answer.assessment_attempts
			if (!attempt || !studentById.has(attempt.user_id)) continue
			const assessment = assessments.get(attempt.assessment_id)
			const courseName = assessment?.course_id ? courses.get(assessment.course_id)?.course_name : undefined
			const area = answer.assessment_questions?.topic || answer.assessment_questions?.question_text || "Uncategorised"
			const key = `${attempt.user_id}:${area}`
			const current = weakAreaStats.get(key) ?? {
				studentId: attempt.user_id,
				area,
				incorrectCount: 0,
				courses: new Set<string>(),
			}
			current.incorrectCount += 1
			if (courseName) current.courses.add(courseName)
			weakAreaStats.set(key, current)
		}

		return NextResponse.json({
			students: students.map((student) => {
				const stats = studentStats.get(student.id)
				return {
					id: student.id,
					name: student.full_name || "Unnamed student",
					institutionName: student.institution_name,
					averageScore: stats ? Math.round(stats.totalScore / stats.attempts) : null,
					attempts: stats?.attempts ?? 0,
					courseCount: stats?.courseIds.size ?? 0,
					lastActivityAt: stats?.lastActivityAt ?? null,
				}
			}),
			courses: Array.from(courseStats.values()).map((stats) => {
				const course = courses.get(stats.courseId)!
				return {
					id: stats.courseId,
					courseName: course.course_name,
					courseCode: course.course_code,
					averageScore: Math.round(stats.totalScore / stats.attempts),
					attempts: stats.attempts,
					lastActivityAt: stats.lastActivityAt,
				}
			}),
			attemptHistory: attemptHistory.sort((left, right) => (right.completedAt || "").localeCompare(left.completedAt || "")),
			weakAreas: Array.from(weakAreaStats.values())
				.map((area) => ({
					id: `${area.studentId}:${area.area}`,
					studentId: area.studentId,
					studentName: studentById.get(area.studentId)?.full_name || "Unnamed student",
					area: area.area,
					incorrectCount: area.incorrectCount,
					courses: Array.from(area.courses),
				}))
				.sort((left, right) => right.incorrectCount - left.incorrectCount),
		})
	} catch (error: unknown) {
		console.error("Supervisor performance error:", error)
		return NextResponse.json({ error: "Failed to load supervisor performance" }, { status: 500 })
	}
}