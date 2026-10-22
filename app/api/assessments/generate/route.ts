import { randomUUID } from "node:crypto"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { normalizeLmsToken } from "@/lib/lms-token"
import { NextResponse } from "next/server"

type AssessmentFile = {
	filename: string
	url: string
}

type GenerateAssessmentRequest = {
	num_questions?: number
	files?: AssessmentFile[]
	course_id?: string
	title?: string
}

const WORKER_URL = (process.env.ASSESSMENT_WORKER_URL || "https://studynia-worker.onrender.com").replace(/\/+$/, "")
const MAX_QUESTIONS = 15
const DEFAULT_QUESTIONS = 5

function boundedQuestionCount(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_QUESTIONS
	return Math.min(MAX_QUESTIONS, Math.max(1, Math.floor(value)))
}

export async function POST(request: Request) {
	try {
		const supabaseServer = await createServerClient()
		const {
			data: { user },
			error: authError,
		} = await supabaseServer.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
		}

		const body = (await request.json()) as GenerateAssessmentRequest
		if (!Array.isArray(body.files) || body.files.length === 0 || !body.course_id || !body.title?.trim()) {
			return NextResponse.json({ error: "course_id, title, and at least one file are required" }, { status: 400 })
		}

		const supabaseAdmin = createAdminClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		const { data: course } = await supabaseAdmin
			.from("courses")
			.select("id")
			.eq("id", body.course_id)
			.eq("user_id", user.id)
			.maybeSingle()
		if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

		const { data: connection } = await supabaseAdmin
			.from("decrypted_lms_connections")
			.select("access_token")
			.eq("user_id", user.id)
			.maybeSingle()

		const accessToken = normalizeLmsToken(connection?.access_token)
		const jobId = randomUUID()
		const { data: assessment, error: assessmentError } = await supabaseAdmin
			.from("assessments")
			.insert({
				user_id: user.id,
				course_id: course.id,
				title: body.title.trim(),
				difficulty_level: 50,
				source: JSON.stringify({ status: "generating", job_id: jobId, source_list: body.files.map((file) => file.filename) }),
			})
			.select("id")
			.single()
		if (assessmentError || !assessment) throw assessmentError || new Error("Could not create assessment job")

		let workerResponse: Response
		try {
			workerResponse = await fetch(`${WORKER_URL}/generate-quiz-from-urls`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					owner_id: user.id,
					assessment_id: assessment.id,
					job_id: jobId,
					...(accessToken ? { canvas_token: accessToken } : {}),
					num_questions: boundedQuestionCount(body.num_questions),
					files: body.files,
				}),
			})
		} catch (workerError) {
			await supabaseAdmin.from("assessments").update({
				source: JSON.stringify({ status: "failed", error: "Could not start assessment generation" }),
			}).eq("id", assessment.id).eq("user_id", user.id)
			throw workerError
		}

		const workerBody = await workerResponse.text()
		if (!workerResponse.ok) {
			await supabaseAdmin.from("assessments").update({
				source: JSON.stringify({ status: "failed", error: "Could not start assessment generation" }),
			}).eq("id", assessment.id).eq("user_id", user.id)
			return NextResponse.json(
				{ error: "Failed to generate assessment", details: workerBody.slice(0, 300) },
				{ status: workerResponse.status }
			)
		}

		return NextResponse.json({ assessmentId: assessment.id, jobId, status: "generating" }, { status: 202 })
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error"
		console.error("ASSESSMENT GENERATION ERROR:", error)
		return NextResponse.json({ error: "Failed to generate assessment", details: message }, { status: 500 })
	}
}

export async function GET(request: Request) {
	try {
		const supabaseServer = await createServerClient()
		const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
		if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

		const jobId = new URL(request.url).searchParams.get("job_id")
		if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
			return NextResponse.json({ error: "A valid job_id is required" }, { status: 400 })
		}

		const workerResponse = await fetch(`${WORKER_URL}/generate-quiz-from-urls/${jobId}?owner_id=${encodeURIComponent(user.id)}`, { cache: "no-store" })
		const workerBody = await workerResponse.text()
		return new NextResponse(workerBody, {
			status: workerResponse.status,
			headers: { "Content-Type": workerResponse.headers.get("content-type") || "application/json" },
		})
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error"
		return NextResponse.json({ error: "Failed to check assessment status", details: message }, { status: 502 })
	}
}
