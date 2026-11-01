"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MessageCircle, Send, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MAX_CHAT_MESSAGE_BYTES } from "@/lib/chat-constants"

type User = { id: string; name: string }
type Conversation = { id: string; otherUser: User; latestMessage: Message | null; unread: boolean }
type Message = { id: string; sender_id: string; body: string; attempt_id: string | null; created_at: string }
type AttemptAnswer = { id: string; user_answer: unknown; is_correct: boolean; assessment_questions: { question_text: string | null; correct_answer: string | null; topic: string | null } | null }
type AttemptDetails = { id: string; score: number; total_questions: number; correct_answers: number; completed_at: string | null; created_at: string; assessments: { title: string | null } | null; answers: AttemptAnswer[] }

function formatTime(value: string) { return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) }

export function ChatPage({ initialConversationId, initialAttemptId }: { initialConversationId?: string; initialAttemptId?: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState(initialConversationId || "")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const sendingRef = useRef(false)
  const [pendingDelete, setPendingDelete] = useState<{ message: Message; conversationId: string } | null>(null)
  const [isDeletingMessage, setIsDeletingMessage] = useState(false)
  const [attemptId, setAttemptId] = useState(initialAttemptId || "")
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetails | null>(null)
  const [attemptLoading, setAttemptLoading] = useState(false)
  const [attemptError, setAttemptError] = useState("")

  const selected = conversations.find((conversation) => conversation.id === selectedId)
  const filteredUsers = useMemo(() => users.filter((user) => user.id !== currentUserId && user.name.toLowerCase().includes(search.toLowerCase())), [currentUserId, search, users])
  const draftByteLength = new TextEncoder().encode(draft.trim()).length
  const draftIsTooLong = draftByteLength > MAX_CHAT_MESSAGE_BYTES

  async function loadConversations() {
    const response = await fetch("/api/chat", { cache: "no-store" })
    if (!response.ok) return
    const data = await response.json()
    if (data.userId) setCurrentUserId(data.userId)
    const availableConversations = (data.conversations ?? []).filter((conversation: Conversation) => conversation.otherUser?.id && conversation.otherUser.id !== data.userId)
    setConversations(availableConversations)
    if (!selectedId && availableConversations[0]) setSelectedId(availableConversations[0].id)
  }

  async function loadUsers() {
    const response = await fetch("/api/chat/users", { cache: "no-store" })
    if (response.ok) setUsers((await response.json()).users ?? [])
  }

  async function loadMessages(conversationId: string) {
    const response = await fetch(`/api/chat/${conversationId}`, { cache: "no-store" })
    if (!response.ok) return
    const data = await response.json()
    setMessages(data.messages ?? [])
    const participant = (data.participants ?? []).find((item: { user_id: string }) => item.user_id !== selected?.otherUser.id)
    if (participant) setCurrentUserId(participant.user_id)
    await fetch(`/api/chat/${conversationId}`, { method: "PATCH" })
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void Promise.all([loadConversations(), loadUsers()]) }, 0)
    return () => window.clearTimeout(timeout)
  }, [])
  useEffect(() => {
    if (!selectedId) return
    const timeout = window.setTimeout(() => { void loadMessages(selectedId) }, 0)
    const interval = window.setInterval(() => { void loadMessages(selectedId); void loadConversations() }, 8000)
    return () => { window.clearTimeout(timeout); window.clearInterval(interval) }
  }, [selectedId, selected?.otherUser.id])

  async function startConversation(userId: string) {
    if (!userId || userId === currentUserId) {
      setError("You can't start a chat with yourself.")
      return
    }
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) })
    if (!response.ok) { setError("Could not start conversation"); return }
    const data = await response.json()
    await loadConversations()
    setSelectedId(data.conversationId)
    setSearch("")
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault()
    if (sendingRef.current || !selectedId || !draft.trim()) return
    const conversationId = selectedId
    const messageBody = draft
    sendingRef.current = true
    setIsSending(true)
    setError("")
    try {
      const response = await fetch(`/api/chat/${conversationId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: messageBody, attemptId: attemptId || null }) })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || "Could not send message")
      }
      setDraft("")
      setAttemptId("")
      await loadMessages(conversationId)
      await loadConversations()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send message")
    } finally {
      sendingRef.current = false
      setIsSending(false)
    }
  }

  async function deleteMessage() {
    if (!pendingDelete || isDeletingMessage) return
    setIsDeletingMessage(true)
    setError("")
    try {
      const { message, conversationId } = pendingDelete
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: message.id }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || "Could not delete message")
      }
      setMessages((current) => current.filter((item) => item.id !== message.id))
      setPendingDelete(null)
      await loadConversations()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete message")
    } finally {
      setIsDeletingMessage(false)
    }
  }

  async function viewAttempt(attemptId: string) {
    if (!selectedId) return
    setAttemptLoading(true)
    setAttemptError("")
    setAttemptDetails(null)
    const response = await fetch(`/api/chat/${selectedId}/attempts/${attemptId}`, { cache: "no-store" })
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null
      setAttemptError(result?.error || "Could not load the assessment attempt")
      setAttemptLoading(false)
      return
    }
    const data = await response.json()
    setAttemptDetails({ ...data.attempt, answers: data.answers ?? [] })
    setAttemptLoading(false)
  }

  const weakAreas = attemptDetails?.answers.reduce<Record<string, number>>((areas, answer) => {
    if (answer.is_correct) return areas
    const topic = answer.assessment_questions?.topic || "Uncategorised"
    areas[topic] = (areas[topic] || 0) + 1
    return areas
  }, {}) ?? {}

  return (
    <div className="grid w-full max-w-full gap-6 lg:grid-cols-[1fr_2fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Chat</CardTitle>
          <div className="relative">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a user" />
            {search.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 h-64 w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {filteredUsers.length ? filteredUsers.map((user) => (
                  <button key={user.id} onClick={() => void startConversation(user.id)} className="flex w-full items-center gap-2 rounded-sm p-2 text-left text-sm hover:bg-muted cursor-pointer">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{user.name}</span>
                  </button>
                )) : <p className="px-2 py-2 text-sm text-muted-foreground">No users found.</p>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-lg p-3 text-left transition-colors cursor-pointer hover:bg-muted ${selectedId === conversation.id ? "bg-muted" : ""}`}><div className="flex items-center justify-between gap-2"><span className="font-medium">{conversation.otherUser.name}</span>{conversation.unread && <span className="h-2 w-2 rounded-full bg-primary" />}</div><p className="truncate text-xs text-muted-foreground">{conversation.latestMessage?.body || "No messages yet"}</p></button>)}
        </CardContent>
      </Card>
      <Card className="flex h-[620px] max-h-screen flex-col overflow-hidden">
        <CardHeader className="border-b shrink-0">
          <CardTitle>{selected ? selected.otherUser.name : "Select a conversation"}</CardTitle>
          {selected && <p className="text-sm text-muted-foreground">Text messages only</p>}
        </CardHeader>
        
        <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Choose a user to start chatting.</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`min-w-0 max-w-[80%] overflow-hidden rounded-2xl px-4 py-3 text-sm ${message.sender_id === currentUserId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>
                {message.attempt_id && <button type="button" onClick={() => void viewAttempt(message.attempt_id!)} className="mt-2 block text-left text-xs underline">View attached attempt</button>}
                <div className="mt-1 flex items-center justify-between gap-4"><p className="text-[10px] opacity-70">{formatTime(message.created_at)}</p>{message.sender_id === currentUserId && <button type="button" onClick={() => setPendingDelete({ message, conversationId: selectedId })} aria-label="Delete message" title="Delete message" className="rounded p-1 opacity-70 hover:bg-black/10 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
              </div>
            ))
          )}
        </CardContent>

        {error && <p className="px-4 text-sm text-destructive shrink-0">{error}</p>}
        
        <form onSubmit={sendMessage} className="flex gap-2 border-t p-4 shrink-0">
          <div className="flex flex-1 flex-col gap-1">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selected ? "Write a message..." : "Select a conversation"} disabled={!selected || isSending} maxLength={2500} />
            {attemptId && <p className="text-[10px] text-primary">Assessment attempt attached. The next message will include it for feedback context.</p>}
            <p className={`text-[10px] ${draftIsTooLong ? "text-destructive" : "text-muted-foreground"}`}>{draftByteLength.toLocaleString()} / {MAX_CHAT_MESSAGE_BYTES.toLocaleString()} bytes{draftIsTooLong ? " — shorten this message to send it." : ""}</p>
          </div>
          <Button type="submit" disabled={!selected || !draft.trim() || draftIsTooLong || isSending} size="icon" aria-label={isSending ? "Sending message" : "Send message"} className="cursor-pointer">
            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </Card>
      <Dialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !isDeletingMessage) setPendingDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>This will permanently remove your message from the conversation.</DialogDescription>
          </DialogHeader>
          {pendingDelete && <p className="max-h-24 overflow-y-auto rounded-md bg-muted p-3 text-sm">{pendingDelete.message.body}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeletingMessage}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void deleteMessage()} disabled={isDeletingMessage}>
              {isDeletingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!attemptDetails || attemptLoading || !!attemptError} onOpenChange={(open) => { if (!open) { setAttemptDetails(null); setAttemptError("") } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{attemptDetails?.assessments?.title || "Assessment attempt"}</DialogTitle>
            <DialogDescription>{attemptDetails ? `Completed ${formatTime(attemptDetails.completed_at || attemptDetails.created_at)}` : "Loading attempt results..."}</DialogDescription>
          </DialogHeader>
          {attemptLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading attempt results...</p>}
          {attemptError && <p className="text-sm text-destructive">{attemptError}</p>}
          {attemptDetails && <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Score</p><p className="text-2xl font-bold text-primary">{attemptDetails.score}%</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Correct</p><p className="text-2xl font-bold">{attemptDetails.correct_answers}/{attemptDetails.total_questions}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Weak areas</p><p className="text-2xl font-bold">{Object.keys(weakAreas).length}</p></div>
            </div>
            {Object.keys(weakAreas).length > 0 && <div><h3 className="mb-2 font-semibold">Highlighted weak areas</h3><div className="flex flex-wrap gap-2">{Object.entries(weakAreas).map(([topic, count]) => <Badge key={topic} variant="destructive">{topic} · {count} incorrect</Badge>)}</div></div>}
            <div className="space-y-3"><h3 className="font-semibold">Question results</h3>{attemptDetails.answers.map((answer, index) => <div key={answer.id} className={`rounded-lg border p-3 ${answer.is_correct ? "border-primary/20" : "border-destructive/30 bg-destructive/5"}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{index + 1}. {answer.assessment_questions?.question_text || "Question unavailable"}</p><Badge variant={answer.is_correct ? "secondary" : "destructive"}>{answer.is_correct ? "Correct" : "Incorrect"}</Badge></div>{!answer.is_correct && <p className="mt-2 text-xs text-muted-foreground">Correct answer: {answer.assessment_questions?.correct_answer || "Unavailable"}</p>}</div>)}</div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
