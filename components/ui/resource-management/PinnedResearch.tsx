import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pin, ExternalLink } from "lucide-react"

export function PinnedResearch() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pin className="w-5 h-5 text-muted-foreground fill-current" />
        <h2 className="text-lg font-semibold">Pinned Research</h2>
      </div>
      
      <div className="space-y-3">
        <Card className="shadow-sm border-muted/50 bg-background/50 hover:bg-muted/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <Badge variant="secondary" className="text-[10px] h-5 rounded-sm">EXTERNAL LINK</Badge>
            </div>
            <div>
              <p className="text-sm font-medium leading-snug">cognitive dynamics of focused attention in students</p>
              <p className="text-xs text-muted-foreground mt-2">journalsneuro.org</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/50 bg-background/50 hover:bg-muted/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <Badge variant="secondary" className="text-[10px] h-5 rounded-sm">EXTERNAL LINK</Badge>
            </div>
            <div>
              <p className="text-sm font-medium leading-snug">Economic Trends in Post-Digital Architecture 2024</p>
              <p className="text-xs text-muted-foreground mt-2">arch-daily.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}