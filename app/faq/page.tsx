import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookPlus, KeyRound, ShieldCheck } from "lucide-react"

export default function FaqPage() {
  return <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
    <div><h1 className="text-3xl font-bold">Frequently Asked Questions</h1><p className="text-muted-foreground">Get started with Studynia and your LMS.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />How do I get a Canvas API key?</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5"><li>Sign in to your Canvas institution.</li><li>Open <strong className="text-foreground">Account</strong>, then <strong className="text-foreground">Settings</strong>.</li><li>Find <strong className="text-foreground">Approved Integrations</strong> or <strong className="text-foreground">New Access Token</strong>.</li><li>Name the token “Studynia” and set an expiry date when Canvas offers one.</li><li>Copy the token immediately and paste it into Account → LMS Integration along with your Canvas base URL.</li></ol>
      <p className="flex gap-2 rounded-md border p-3"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Studynia does not need your Canvas password. Revoke and regenerate the token in Canvas if it is ever exposed.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookPlus className="h-5 w-5" />How do I add materials to a local course?</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5"><li>Open <strong className="text-foreground">Course Folders</strong> and choose <strong className="text-foreground">Add course</strong> if you have not created the course yet.</li><li>Open the course folder and select <strong className="text-foreground">Add material</strong>.</li><li>Enter a material title and paste its file URL, then choose <strong className="text-foreground">Save material</strong>.</li></ol>
      <p>Assessment generation can use saved PDF, DOCX, and PPTX materials. The file URL should point to the document.</p>
    </CardContent></Card>
  </div>
}
