"use client"

import { useEffect, useState } from "react"
import { Bell, FileText, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"

type Notification = { id: string; notification_type: "note_share" | "assessment_share"; note_id: string | null; attempt_id: string | null; assessment_id: string | null; title: string; body: string | null; read_at: string | null; created_at: string }

export function InboxView() {
  const [items, setItems] = useState<Notification[]>([])
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null
    const load = async () => {
      const response = await fetch("/api/inbox", { cache: "no-store" })
      if (response.ok && active) setItems(await response.json())
    }
    void load()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      channel = supabase.channel(`inbox-${data.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_notifications", filter: `recipient_id=eq.${data.user.id}` }, () => void load()).subscribe()
    })
    return () => { active = false; if (channel) void supabase.removeChannel(channel) }
  }, [])
  const open = async (item: Notification) => {
    if (!item.read_at) {
      await fetch("/api/inbox", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) })
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry))
    }
    if (item.note_id) router.push(`/notes/${item.note_id}`)
    else if (item.assessment_id) router.push("/practice")
    else router.push("/practice")
  }
  return <div className="mx-auto w-full max-w-3xl p-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Inbox</CardTitle></CardHeader><CardContent className="space-y-2">{items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No notifications yet.</p> : items.map((item) => <button key={item.id} onClick={() => void open(item)} className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted cursor-pointer ${!item.read_at ? "bg-primary/5" : ""}`}>{item.notification_type === "note_share" ? <FileText className="mt-0.5 h-5 w-5 text-primary" /> : <ClipboardList className="mt-0.5 h-5 w-5 text-primary" />}<span className="min-w-0 flex-1"><span className="block font-medium">{item.title}</span><span className="block text-sm text-muted-foreground">{item.body}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span></span>{!item.read_at && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}</button>)}</CardContent></Card></div>
}
