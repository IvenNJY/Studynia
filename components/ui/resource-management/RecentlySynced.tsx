import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, FileText, File, ExternalLink } from "lucide-react"

export function RecentlySynced() {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
          Recently Synced
        </h2>
        <Link href="#" className="text-sm text-primary font-medium hover:underline">
          View All
        </Link>
      </div>
      
      <div className="space-y-3">
        <Card className="shadow-sm border-muted/50 bg-background/50 hover:bg-muted/30 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-red-100/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">5004CMD Course Structure V1.pdf</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>Course: 5004CMD</span>
                  <span>•</span>
                  <span>Synced 2h ago from Canvas</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
              <ExternalLink className="w-3 h-3"/> <Link href="https://newinti.instructure.com/courses/57359/files/5134715?module_item_id=1510002" target="_blank" rel="noopener noreferrer">
                Link to Note
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/50 bg-background/50 hover:bg-muted/30 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-blue-100/50 flex items-center justify-center">
                <File className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Initial_Allocation_Form_V2.docx</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>Course: 6000CEM</span>
                  <span>•</span>
                  <span>Uploaded 5h ago</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
              <ExternalLink className="w-3 h-3" /> <Link href="https://newinti.instructure.com/courses/57182/files/5186810?module_item_id=1530769" target="_blank" rel="noopener noreferrer">
                Link to Note
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}