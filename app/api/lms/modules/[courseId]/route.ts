import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { normalizeLmsToken } from "@/lib/lms-token"
import { NextResponse } from "next/server"

type CourseRecord = {
	id: string
	lms_external_id: string | null
	course_name: string | null
	course_code: string | null
	description: string | null
}

type CanvasCourse = {
	id: number | string
	name?: string
	original_name?: string
	course_code?: string
	term?: { name?: string }
	syllabus_body?: string
	workflow_state?: string
	html_url?: string
	teachers?: Array<{ display_name?: string; name?: string }>
}

type CanvasModule = {
	id: number
	name?: string
	position?: number
	published?: boolean
	state?: string
}

type CanvasModuleItem = {
	id: number
	content_id?: number | string
	title?: string
	type?: string
	html_url?: string
	url?: string
	page_url?: string
	published?: boolean
	position?: number
	completion_requirement?: {
		completed?: boolean
		type?: string
	}
}

function normalizeText(value: unknown, fallback: string) {
	return typeof value === "string" && value.trim().length > 0 ? value : fallback
}

function looksLikeUuid(value: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
	try {
		const { courseId } = await params

		const supabaseServer = await createServerClient()
		const {
			data: { user },
			error: authError,
		} = await supabaseServer.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
		}

		const supabaseAdmin = createAdminClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		const { data: connection, error: connectionError } = await supabaseAdmin
			.from("decrypted_lms_connections")
			.select("domain, access_token")
			.eq("user_id", user.id)
			.single()

		const { data: localCourse } = await supabaseAdmin
			.from("courses")
			.select("id, course_name, course_code, description, lms_external_id")
			.eq("user_id", user.id)
			.eq("id", courseId)
			.maybeSingle()

		if (connectionError || !connection || (localCourse && !localCourse.lms_external_id)) {
			if (!localCourse) return NextResponse.json({ error: "LMS connection not found" }, { status: 404 })

			const { data: localMaterials, error: localMaterialsError } = await supabaseAdmin
				.from("materials")
				.select("id, title, content_type, file_url, module_name")
				.eq("user_id", user.id)
				.eq("course_id", localCourse.id)
				.order("created_at", { ascending: true })
			if (localMaterialsError) return NextResponse.json({ error: "Failed to load local materials" }, { status: 500 })

			const localMaterialIds = (localMaterials ?? []).map((material) => material.id)
			const { data: localProgress } = localMaterialIds.length > 0
				? await supabaseAdmin.from("material_progress").select("material_id, viewed").eq("user_id", user.id).in("material_id", localMaterialIds)
				: { data: [] }
			const viewed = new Map((localProgress ?? []).map((row) => [row.material_id, Boolean(row.viewed)]))
			const grouped = new Map<string, typeof localMaterials>()
			for (const material of localMaterials ?? []) {
				const moduleName = material.module_name || "My Materials"
				grouped.set(moduleName, [...(grouped.get(moduleName) ?? []), material])
			}

			return NextResponse.json({
				course: { ...localCourse, lms_external_id: "", syllabus_body: "", instructor: "You", course_url: "" },
				modules: Array.from(grouped.entries()).map(([name, items], index) => ({
					id: -(index + 1),
					name,
					position: index,
					published: true,
					state: "published",
					items: items.map((item, itemIndex) => ({
						id: itemIndex + 1,
						material_id: item.id,
						title: item.title,
						type: item.content_type || "text",
						html_url: item.file_url || undefined,
						published: true,
						position: itemIndex,
						viewed: Boolean(viewed.get(item.id)),
					})),
				})),
			})
		}

		const accessToken = normalizeLmsToken(connection.access_token)
		if (!accessToken) {
			return NextResponse.json({ error: "LMS access token is empty or invalid" }, { status: 502 })
		}

		const { data: localCourseByExternalId, error: localCourseExternalError } = await supabaseAdmin
			.from("courses")
			.select("id, lms_external_id, course_name, course_code, description")
			.eq("user_id", user.id)
			.eq("lms_external_id", courseId)
			.maybeSingle()

		if (localCourseExternalError) {
			return NextResponse.json({ error: "Failed to load course" }, { status: 500 })
		}

		let resolvedCourse: CourseRecord | null = localCourseByExternalId

		if (!resolvedCourse) {
			const shouldTryPrimaryId = looksLikeUuid(courseId)

			if (shouldTryPrimaryId) {
				const { data: courseByPrimaryId, error: localCourseError } = await supabaseAdmin
					.from("courses")
					.select("id, lms_external_id, course_name, course_code, description")
					.eq("user_id", user.id)
					.eq("id", courseId)
					.maybeSingle()

				if (localCourseError) {
					return NextResponse.json({ error: "Failed to load course" }, { status: 500 })
				}

				resolvedCourse = courseByPrimaryId
			}

			if (!resolvedCourse) {
				const { data: courseByExternalId, error: fallbackCourseError } = await supabaseAdmin
					.from("courses")
					.select("id, lms_external_id, course_name, course_code, description")
					.eq("user_id", user.id)
					.eq("lms_external_id", courseId)
					.maybeSingle()

				if (fallbackCourseError) {
				return NextResponse.json({ error: "Failed to load course" }, { status: 500 })
			}

				resolvedCourse = courseByExternalId
			}
		}

		const canvasCourseId = resolvedCourse?.lms_external_id || courseId
		const baseUrl = connection.domain.replace(/\/$/, "")

		const [courseResponse, modulesResponse] = await Promise.all([
			fetch(
				`${baseUrl}/api/v1/courses/${canvasCourseId}?include[]=term&include[]=syllabus_body&include[]=teachers`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			),
			fetch(`${baseUrl}/api/v1/courses/${canvasCourseId}/modules?per_page=100`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			}),
		])

		if (!courseResponse.ok) {
			return NextResponse.json({ error: "Canvas course not found" }, { status: 404 })
		}

		if (!modulesResponse.ok) {
			return NextResponse.json({ error: "Canvas modules could not be loaded" }, { status: 502 })
		}

		const courseData = (await courseResponse.json()) as CanvasCourse
		const modulesData = (await modulesResponse.json()) as CanvasModule[]

		const modules = await Promise.all(
			(Array.isArray(modulesData) ? modulesData : [])
				.sort((left, right) => (left.position || 0) - (right.position || 0))
				.map(async (module) => {
					const itemsResponse = await fetch(
						`${baseUrl}/api/v1/courses/${canvasCourseId}/modules/${module.id}/items?per_page=100`,
						{
							headers: { Authorization: `Bearer ${accessToken}` },
						}
					)

					const rawItems = itemsResponse.ok ? await itemsResponse.json() : []

					const items = (Array.isArray(rawItems) ? rawItems : []).map((item: CanvasModuleItem) => ({
						id: item.id,
						content_id: item.content_id,
						title: normalizeText(item.title, "Untitled item"),
						type: normalizeText(item.type, "item"),
						html_url: typeof item.html_url === "string" ? item.html_url : undefined,
						url: typeof item.url === "string" ? item.url : undefined,
						page_url: typeof item.page_url === "string" ? item.page_url : undefined,
						published: Boolean(item.published),
						position: typeof item.position === "number" ? item.position : 0,
						completion_requirement:
							item.completion_requirement && typeof item.completion_requirement === "object"
								? {
										completed: Boolean(item.completion_requirement.completed),
										type: normalizeText(item.completion_requirement.type, "completion"),
									}
								: undefined,
					}))

					return {
						id: module.id,
						name: normalizeText(module.name, "Untitled module"),
						position: typeof module.position === "number" ? module.position : 0,
						published: Boolean(module.published),
						state: normalizeText(module.state, "unpublished"),
						items,
					}
				})
		)

		const materialRows = modules.flatMap((module) =>
			module.items.map((item) => ({
				user_id: user.id,
				course_id: resolvedCourse?.id,
				lms_external_id: String(item.id),
				title: item.title,
				content_type: item.type.includes("assignment") ? "deadline" : "text",
				file_url: item.html_url || item.url || item.page_url || null,
				module_name: module.name,
				source: "lms",
				updated_at: new Date().toISOString(),
			}))
		).filter((material) => material.course_id)

		const uniqueMaterialRows = Array.from(
			new Map(
				materialRows.map((material) => [
					`${material.user_id}:${material.lms_external_id}`,
					material,
				])
			).values()
		)

		if (uniqueMaterialRows.length > 0) {
			const { error: materialError } = await supabaseAdmin
				.from("materials")
				.upsert(uniqueMaterialRows, { onConflict: "user_id,lms_external_id" })

			if (materialError) {
				console.error("Material sync error:", {
					code: materialError.code,
					message: materialError.message,
					details: materialError.details,
					hint: materialError.hint,
				})
				return NextResponse.json(
					{
						error: "Course loaded, but materials could not be saved",
						details: materialError.message,
						code: materialError.code,
					},
					{ status: 500 }
				)
			}
		}

		const { data: persistedMaterials } = await supabaseAdmin
			.from("materials")
			.select("id, lms_external_id")
			.eq("user_id", user.id)
			.eq("course_id", resolvedCourse?.id)

		const materialIds = (persistedMaterials ?? []).map((material) => material.id)
		const { data: progressRows } = materialIds.length > 0
			? await supabaseAdmin
				.from("material_progress")
				.select("material_id, viewed")
				.eq("user_id", user.id)
				.in("material_id", materialIds)
			: { data: [] }

		const progressByMaterialId = new Map(
			(progressRows ?? []).map((row) => [row.material_id, Boolean(row.viewed)])
		)
		const materialIdByExternalId = new Map(
			(persistedMaterials ?? []).map((material) => [material.lms_external_id, material.id])
		)

		const modulesWithPersistence = modules.map((module) => ({
			...module,
			items: module.items.map((item) => {
				const materialId = materialIdByExternalId.get(String(item.id))
				return {
					...item,
					material_id: materialId,
					viewed: materialId ? Boolean(progressByMaterialId.get(materialId)) : false,
				}
			}),
		}))

		const instructor = courseData.teachers?.[0]?.display_name || courseData.teachers?.[0]?.name || "Lecturer"

		return NextResponse.json({
			course: {
				id: resolvedCourse?.id || String(courseData.id),
				lms_external_id: String(courseData.id),
				course_name:
					resolvedCourse?.course_name || normalizeText(courseData.name, normalizeText(courseData.original_name, "Course Folder")),
				course_code: resolvedCourse?.course_code || normalizeText(courseData.course_code, ""),
				description:
					resolvedCourse?.description || normalizeText(courseData.term?.name, "Unknown Term"),
				syllabus_body: typeof courseData.syllabus_body === "string" ? courseData.syllabus_body : "",
				instructor,
				course_url: typeof courseData.html_url === "string" ? courseData.html_url : "",
			},
			modules: modulesWithPersistence,
		})
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error"
		console.error("MODULES ROUTE CRASH:", err)
		return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 })
	}
}
