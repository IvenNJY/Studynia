import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, ShieldCheck } from "lucide-react"

export default function FaqPage() {
  return <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
    <div><h1 className="text-3xl font-bold">Frequently Asked Questions</h1><p className="text-muted-foreground">Get started with StudyNia and your LMS.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />How do I get a Canvas API key?</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5"><li>Sign in to your Canvas institution.</li><li>Open <strong className="text-foreground">Account</strong>, then <strong className="text-foreground">Settings</strong>.</li><li>Find <strong className="text-foreground">Approved Integrations</strong> or <strong className="text-foreground">New Access Token</strong>.</li><li>Name the token “StudyNia” and set an expiry date when Canvas offers one.</li><li>Copy the token immediately and paste it into Account → LMS Integration along with your Canvas base URL.</li></ol>
      <p className="flex gap-2 rounded-md border p-3"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />StudyNia does not need your Canvas password. Revoke and regenerate the token in Canvas if it is ever exposed.</p>
    </CardContent></Card>
  </div>
}
