import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

const admin = () => createAdminClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function getUser() {
	const client = await createClient()
	const { data: { user }, error } = await client.auth.getUser()
	return error || !user ? null : user
}

export async function GET() {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

	const supabase = admin()
	const { data: participants, error } = await supabase
		.from("chat_participants")
		.select("conversation_id, last_read_at")
		.eq("user_id", user.id)
	if (error) return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 })

	const conversationIds = (participants ?? []).map((item) => item.conversation_id)
	if (!conversationIds.length) return NextResponse.json({ conversations: [], unreadCount: 0 })

	const [{ data: otherParticipants }, { data: messages }] = await Promise.all([
		supabase.from("chat_participants").select("conversation_id, user_id, profiles(id, full_name, role)").in("conversation_id", conversationIds).neq("user_id", user.id),
		supabase.from("chat_messages").select("id, conversation_id, sender_id, body, attempt_id, created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }),
	])

	const participantReads = new Map((participants ?? []).map((item) => [item.conversation_id, item.last_read_at]))
	const latestByConversation = new Map<string, (typeof messages extends (infer T)[] | null ? T : never)>()
	for (const message of messages ?? []) {
		if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message)
	}
	const unreadCount = (messages ?? []).filter((message) => message.sender_id !== user.id && (!participantReads.get(message.conversation_id) || message.created_at > participantReads.get(message.conversation_id)!)).length
	const conversations = conversationIds.map((id) => {
		const other = (otherParticipants ?? []).find((item) => item.conversation_id === id)
		const latest = latestByConversation.get(id)
		const profile = Array.isArray(other?.profiles) ? other.profiles[0] : other?.profiles
		return {
			id,
			otherUser: { id: profile?.id, name: profile?.full_name || "Unnamed user", role: profile?.role },
			latestMessage: latest ?? null,
			unread: !!latest && latest.sender_id !== user.id && (!participantReads.get(id) || latest.created_at > participantReads.get(id)!),
		}
	}).sort((a, b) => (b.latestMessage?.created_at || "").localeCompare(a.latestMessage?.created_at || ""))

	return NextResponse.json({ conversations, unreadCount })
}

export async function POST(request: Request) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	const body = await request.json() as { userId?: string }
	if (!body.userId || body.userId === user.id) return NextResponse.json({ error: "Choose another user" }, { status: 400 })

	const supabase = admin()
	const { data: target } = await supabase.from("profiles").select("id").eq("id", body.userId).maybeSingle()
	if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
	const { data: existing } = await supabase.from("chat_participants").select("conversation_id").eq("user_id", user.id)
	const existingIds = (existing ?? []).map((item) => item.conversation_id)
	if (existingIds.length) {
		const { data: matching } = await supabase.from("chat_participants").select("conversation_id").eq("user_id", body.userId).in("conversation_id", existingIds).limit(1).maybeSingle()
		if (matching) return NextResponse.json({ conversationId: matching.conversation_id })
	}

	const { data: conversation, error } = await supabase.from("chat_conversations").insert({}).select("id").single()
	if (error || !conversation) return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
	const { error: participantError } = await supabase.from("chat_participants").insert([
		{ conversation_id: conversation.id, user_id: user.id, last_read_at: new Date().toISOString() },
		{ conversation_id: conversation.id, user_id: body.userId },
	])
	if (participantError) return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
	return NextResponse.json({ conversationId: conversation.id })
}
