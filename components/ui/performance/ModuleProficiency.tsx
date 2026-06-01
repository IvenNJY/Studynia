import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export function ModuleProficiency() {
  return (
    <Card className="shadow-none border-border/50 border bg-muted/30 sm:p-2 h-full flex flex-col">
      <CardHeader className="pb-6">
        <CardTitle className="text-[1.1rem] font-medium text-foreground">Module Proficiency</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4">
          <span className="text-3xl font-black text-primary">24</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">MASTERED</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4">
          <span className="text-3xl font-black text-chart-2">12</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">REVIEWING</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4">
          <span className="text-3xl font-black text-chart-3">08</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">IN PROGRESS</span>
        </div>
        <button className="flex flex-col items-center justify-center bg-transparent rounded-xl border-2 border-dashed border-border hover:bg-accent transition-colors p-4 group">
          <Plus className="mb-1 text-muted-foreground group-hover:text-accent-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider group-hover:text-accent-foreground transition-colors">NEW TARGET</span>
        </button>
      </CardContent>
    </Card>
  )
}
