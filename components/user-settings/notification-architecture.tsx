import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Smartphone, ChevronRight } from "lucide-react"

export function NotificationArchitecture() {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle className="text-xl font-bold text-foreground">
            Notification Architecture
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Calibrate how the Atelier reaches out to you.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="px-6 text-foreground font-semibold bg-muted hover:bg-muted/80">
            Mute All
          </Button>
          <Button className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
            Save Logic
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1 */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-3">
              Academic Deadlines
            </h4>
            <div className="flex items-start justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-bold text-foreground">24h Final Warning</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Critical alert before submission window closes.
                </p>
              </div>
              <button 
                type="button" 
                className="w-12 h-6 bg-primary rounded-full relative transition-colors focus:outline-none"
              >
                <div className="w-5 h-5 bg-background rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </button>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-foreground">Weekly Planner Digest</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Sunday evening overview of upcoming tasks.
                </p>
              </div>
              <button 
                type="button" 
                className="w-12 h-6 bg-primary rounded-full relative transition-colors focus:outline-none"
              >
                <div className="w-5 h-5 bg-background rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </button>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-3">
              Focus & Wellness
            </h4>
            <div className="flex items-start justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-bold text-foreground">Pomodoro Reminders</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Gentle nudges for study breaks.
                </p>
              </div>
              <button 
                type="button" 
                className="w-12 h-6 bg-muted rounded-full relative transition-colors focus:outline-none"
              >
                <div className="w-5 h-5 bg-background rounded-full absolute left-0.5 top-0.5 shadow-sm" />
              </button>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-foreground">Hydration Nudges</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Daily reminders to maintain cognitive clarity.
                </p>
              </div>
              <button 
                type="button" 
                className="w-12 h-6 bg-muted rounded-full relative transition-colors focus:outline-none"
              >
                <div className="w-5 h-5 bg-background rounded-full absolute left-0.5 top-0.5 shadow-sm" />
              </button>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-3">
              Delivery Channels
            </h4>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors text-sm group mt-2">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-foreground" />
                <span className="font-semibold text-foreground">Email Reports</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors text-sm group">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-foreground" />
                <span className="font-semibold text-foreground">Push Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
