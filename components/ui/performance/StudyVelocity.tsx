import { Card, CardContent } from "@/components/ui/card"

type Assignment = {
  title: string
  due_date: string | null
}

export function StudyVelocity({
  assignmentsDue,
  latestAssignment,
}: {
  assignmentsDue: number
  latestAssignment: Assignment | null
}) {
  const dueDate = latestAssignment?.due_date
    ? new Date(latestAssignment.due_date).toLocaleDateString()
    : null

  return (
    <Card className="bg-primary text-primary-foreground border-0 shadow-sm relative overflow-hidden h-full">
      {/* Decorative semi-circle background */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary-foreground/5 rounded-full" />
      
      <CardContent className="p-6 md:p-8 flex flex-col h-full z-10 relative">
        <div className="space-y-1 mb-8">
          <h2 className="text-lg font-medium tracking-tight text-primary-foreground/90">Assignments Due</h2>
          <p className="text-sm text-primary-foreground/70">
            {assignmentsDue === 0 ? "You are all caught up!" : "Keep up with your upcoming work."}
          </p>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-baseline gap-1 font-bold mb-4">
            <span className="text-5xl tracking-tighter">{assignmentsDue}</span>
            <span className="text-xl text-primary-foreground/70 font-medium">
              {assignmentsDue === 1 ? " assignment" : " assignments"}
            </span>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-sky-500/50 border border-primary-foreground/20 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            {latestAssignment
              ? `${latestAssignment.title}${dueDate ? ` · Due ${dueDate}` : ""}`
              : "No upcoming assignments"}

            <div className="relative flex size-3 justify-center items-center ml-2">
              {/* Pinging Outer Ring */}
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
              {/* Inner Static Circle */}
              <span className="relative inline-flex size-3 rounded-full bg-yellow-500"></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
