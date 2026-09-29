import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { NextResponse } from "next/server"

type AssessmentFile = {
	filename: string
	url: string
}

type GenerateAssessmentRequest = {
	num_questions?: number
	files?: AssessmentFile[]
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
		if (!Array.isArray(body.files) || body.files.length === 0) {
			return NextResponse.json({ error: "At least one file is required" }, { status: 400 })
		}

		const supabaseAdmin = createAdminClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		const { data: connection, error: connectionError } = await supabaseAdmin
			.from("decrypted_lms_connections")
			.select("access_token")
			.eq("user_id", user.id)
			.single()

		if (connectionError || !connection?.access_token) {
			return NextResponse.json({ error: "LMS connection not found" }, { status: 404 })
		}

		const workerResponse = await fetch("https://studynia-worker.onrender.com/generate-quiz-from-urls", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				canvas_token: connection.access_token,
				num_questions: body.num_questions ?? 5,
				files: body.files,
			}),
		})

		const workerBody = await workerResponse.text()
		if (!workerResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to generate assessment", details: workerBody.slice(0, 300) },
				{ status: workerResponse.status }
			)
		}

		return new NextResponse(workerBody, {
			status: 200,
			headers: { "Content-Type": workerResponse.headers.get("content-type") || "application/json" },
		})
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error"
		console.error("ASSESSMENT GENERATION ERROR:", error)
		return NextResponse.json({ error: "Failed to generate assessment", details: message }, { status: 500 })
	}
}