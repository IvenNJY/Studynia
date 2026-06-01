import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Activity } from "lucide-react"

export function StudyHabitInsight() {
  return (
    <Card className="shadow-none border-border/50 border bg-card">
      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
        {/* Left Side: Illustration Container */}
        <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center p-6 relative overflow-hidden flex-shrink-0 shadow-inner">
           {/* Abstract illustration of a desk/screen using primitive shapes */}
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
           <div className="relative w-full h-full flex flex-col items-center justify-end pb-8">
              {/* Monitor */}
              <div className="w-3/4 h-3/5 bg-gradient-to-b from-primary to-muted rounded-sm border-2 border-primary shadow-[0_0_15px_oklch(var(--primary)/0.3)] relative z-10" />
              {/* Stand */}
              <div className="w-4 h-6 bg-primary/80 z-10" />
              {/* Base */}
              <div className="w-24 h-2 bg-primary rounded-sm z-10" />
              
              {/* Desk Line */}
              <div className="absolute bottom-8 left-4 right-4 h-1 bg-primary/50" />
              
              {/* Lamp (Abstract) */}
              <div className="absolute right-6 top-1/4 w-8 h-12 border-r-2 border-t-2 border-primary/60 rounded-tr-xl opacity-80" />
              <div className="absolute right-12 top-1/4 w-6 h-4 bg-primary rounded-full blur-[2px] opacity-60" />
           </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-medium text-foreground">Study Habit Insight</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our analysis suggests you are most productive between 
            <span className="text-primary font-medium"> 8:00 AM and 11:30 AM</span>. 
            On days where you take a 15-minute break every 90 minutes, your content retention scores are 
            <span className="text-chart-2 font-medium"> 18% higher</span>. 
            Consider scheduling your most complex modules for Monday mornings.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Peak Focus: Early Morning
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-chart-2" />
              Retention Level: Optimal
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
