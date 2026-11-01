import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { decryptChatMessage, encryptChatMessage, isEncryptedChatMessage } from "@/lib/chat-encryption"
import { MAX_CHAT_MESSAGE_BYTES } from "@/lib/chat-constants"

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
	const { data: participants, error: participantsError } = await supabase.from("chat_participants")
		.select("user_id, profiles(id, full_name, role)").eq("conversation_id", conversationId)
	if (participantsError) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
	const messages: Array<{ id: string; sender_id: string; body: string; attempt_id: string | null; created_at: string }> = []
	for (let offset = 0; ; offset += 1000) {
		const { data: batch, error: batchError } = await supabase.from("chat_messages")
			.select("id, sender_id, body, attempt_id, created_at")
			.eq("conversation_id", conversationId)
			.order("created_at", { ascending: true })
			.order("id", { ascending: true })
			.range(offset, offset + 999)
		if (batchError) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
		messages.push(...(batch ?? []))
		if (!batch || batch.length < 1000) break
	}
	try {
		const decodedMessages: typeof messages = []
		for (let offset = 0; offset < messages.length; offset += 25) {
			const batch = messages.slice(offset, offset + 25)
			const decodedBatch = await Promise.all(batch.map(async (message) => {
				const context = { conversationId, senderId: message.sender_id }
				if (!isEncryptedChatMessage(message.body)) {
					const ciphertext = encryptChatMessage(message.body, context)
					const { error } = await supabase.from("chat_messages").update({ body: ciphertext }).eq("id", message.id).eq("conversation_id", conversationId)
					if (error) throw error
					return { ...message, body: message.body }
				}
				return { ...message, body: decryptChatMessage(message.body, context) }
			}))
			decodedMessages.push(...decodedBatch)
		}
		return NextResponse.json({ messages: decodedMessages, participants: participants ?? [] })
	} catch (error) {
		console.error("Failed to decrypt or migrate chat messages:", error)
		return NextResponse.json({ error: "Could not decrypt chat messages. Check the server encryption key." }, { status: 500 })
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
	const user = await getUser()
	const { conversationId } = await params
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	if (!await isParticipant(conversationId, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	const body = await request.json() as { body?: string; attemptId?: string | null }
	const messageBody = body.body?.trim()
	if (!messageBody) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
	if (Buffer.byteLength(messageBody, "utf8") > MAX_CHAT_MESSAGE_BYTES) {
		return NextResponse.json({ error: `Message is too long. Maximum size is ${MAX_CHAT_MESSAGE_BYTES} UTF-8 bytes when encrypted.` }, { status: 400 })
	}
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
	let encryptedBody: string
	try {
		encryptedBody = encryptChatMessage(messageBody, { conversationId, senderId: user.id })
	} catch (error) {
		console.error("Chat encryption is unavailable:", error)
		return NextResponse.json({ error: "Chat encryption is not configured on the server" }, { status: 500 })
	}
	const { data: message, error } = await supabase.from("chat_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: encryptedBody, attempt_id: body.attemptId || null }).select("id, sender_id, body, attempt_id, created_at").single()
	if (error) return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)
	await supabase.from("chat_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", user.id)
	return NextResponse.json({ message: message ? { ...message, body: messageBody } : null })
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

export async function DELETE(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
	const user = await getUser()
	const { conversationId } = await params
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	if (!await isParticipant(conversationId, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	const body = await request.json() as { id?: string }
	if (!body.id) return NextResponse.json({ error: "Message id is required" }, { status: 400 })

	const { error } = await admin()
		.from("chat_messages")
		.delete()
		.eq("id", body.id)
		.eq("conversation_id", conversationId)
		.eq("sender_id", user.id)
	if (error) return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
	return NextResponse.json({ success: true })
}
