import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

async function getUser() {
	const client = await createClient()
	const { data: { user }, error } = await client.auth.getUser()
	return error || !user ? null : user
}

const admin = () => createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function isParticipant(conversationId: string, userId: string) {
	const { data } = await admin().from("chat_participants").select("conversation_id").eq("conversation_id", conversationId).eq("user_id", userId).maybeSingle()
	return !!data
}

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
	const user = await getUser()
	const { conversationId } = await params
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	if (!await isParticipant(conversationId, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	const supabase = admin()
	const [{ data: messages }, { data: participants }] = await Promise.all([
		supabase.from("chat_messages").select("id, sender_id, body, attempt_id, created_at").eq("conversation_id", conversationId).order("created_at"),
		supabase.from("chat_participants").select("user_id, profiles(id, full_name, role)").eq("conversation_id", conversationId),
	])
	return NextResponse.json({ messages: messages ?? [], participants: participants ?? [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
	const user = await getUser()
	const { conversationId } = await params
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	if (!await isParticipant(conversationId, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	const body = await request.json() as { body?: string; attemptId?: string | null }
	const messageBody = body.body?.trim()
	if (!messageBody || messageBody.length > 4000) return NextResponse.json({ error: "Message must be between 1 and 4000 characters" }, { status: 400 })
	const supabase = admin()
	if (body.attemptId) {
		const [{ data: senderProfile }, { data: otherParticipant }, { data: attempt }] = await Promise.all([
			supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
			supabase.from("chat_participants").select("user_id").eq("conversation_id", conversationId).neq("user_id", user.id).maybeSingle(),
			supabase.from("assessment_attempts").select("id, user_id").eq("id", body.attemptId).maybeSingle(),
		])
		if (senderProfile?.role !== "supervisor" || !attempt || attempt.user_id !== otherParticipant?.user_id) {
			return NextResponse.json({ error: "Only supervisors can attach one of this student's attempts" }, { status: 403 })
		}
	}
	const { data: message, error } = await supabase.from("chat_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: messageBody, attempt_id: body.attemptId || null }).select("id, sender_id, body, attempt_id, created_at").single()
	if (error) return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)
	await supabase.from("chat_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", user.id)
	return NextResponse.json({ message })
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
	const user = await getUser()
	const { conversationId } = await params
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	if (!await isParticipant(conversationId, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	const { error } = await admin().from("chat_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", user.id)
	if (error) return NextResponse.json({ error: "Failed to mark messages read" }, { status: 500 })
	return NextResponse.json({ success: true })
}
