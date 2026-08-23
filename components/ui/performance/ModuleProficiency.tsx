import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, UploadCloud } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function ModuleProficiency({ stats }: { 
  stats: { mastered: number, reviewing: number, inProgress: number } 
}) {
  return (
    <Card className="shadow-none border-border/50 border bg-muted/30 sm:p-2 h-full flex flex-col">
      <CardHeader className="pb-6">
        <CardTitle className="text-[1.1rem] font-medium text-foreground">
          Module Proficiency
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4 transition-all">
          <span className="text-3xl font-black text-primary">{stats.mastered.toString().padStart(2, '0')}</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">MASTERED</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4 transition-all">
          <span className="text-3xl font-black text-chart-2">{stats.reviewing.toString().padStart(2, '0')}</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">REVIEWING</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-card rounded-xl shadow-sm border border-border p-4 transition-all">
          <span className="text-3xl font-black text-chart-3">{stats.inProgress.toString().padStart(2, '0')}</span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">IN PROGRESS</span>
        </div>

        <Dialog>
          <DialogTrigger>
            <span className="cursor-pointer flex flex-col w-full items-center justify-center bg-transparent rounded-xl border-2 border-dashed border-border hover:bg-accent transition-colors p-4 group">
              <Plus className="mb-1 text-muted-foreground group-hover:text-accent-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider group-hover:text-accent-foreground transition-colors">
                NEW TARGET
              </span>
            </span>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[30%]">
            <DialogHeader>
              <DialogTitle>Add New Target</DialogTitle>
              <DialogDescription>
                Specify the course and module you want to focus on next.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Input id="course" placeholder="e.g., Advanced React Patterns" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="module">Module</Label>
                <Input id="module" placeholder="e.g., Custom Hooks" />
              </div>

              {/* Drag and Drop Sample */}
              <div className="grid gap-2 pt-2">
                <Label>Supporting Materials</Label>
                <label 
                  htmlFor="file-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-border bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="mb-1 text-sm text-foreground font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or PDF (MAX. 10MB)</p>
                  </div>
                  <input id="file-upload" type="file" className="hidden" />
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Target</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}