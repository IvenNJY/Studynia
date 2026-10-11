import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { InboxView } from "@/components/inbox/inbox-view"

export default async function InboxPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")
  return <InboxView />
}
