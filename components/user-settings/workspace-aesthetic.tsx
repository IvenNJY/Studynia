import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Moon } from "lucide-react"

export function WorkspaceAesthetic() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <div className="w-3 h-3 rounded-full border border-muted-foreground" /> Workspace Aesthetic
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <button className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-primary bg-background p-6 transition-colors hover:bg-muted">
          <Sun className="h-6 w-6 text-foreground" />
          <span className="text-[10px] font-bold tracking-widest text-foreground">ACADEMIC LIGHT</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-transparent bg-muted/50 p-6 transition-colors hover:bg-muted">
          <Moon className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">MIDNIGHT LIBRARY</span>
        </button>
      </CardContent>
    </Card>
  )
}
