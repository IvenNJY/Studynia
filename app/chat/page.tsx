import { requireRole } from "@/lib/authorization"
import { ChatPage } from "@/components/chat/chat-page"

export default async function ChatRoute({ searchParams }: { searchParams: Promise<{ conversation?: string; attempt?: string }> }) {
  await requireRole(["student", "supervisor", "admin"])
  const params = await searchParams
  return <ChatPage initialConversationId={params.conversation} initialAttemptId={params.attempt} />
}
