import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { File, Download, MoreVertical } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function AllMaterials() {
  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Materials</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 bg-muted rounded-md shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm bg-background shadow-sm">
              <div className="w-3 h-[1px] bg-foreground mb-1 shadow-[0_4px_0_0] shadow-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-[2px]">
                <div className="w-[6px] h-[6px] bg-current rounded-sm"/>
                <div className="w-[6px] h-[6px] bg-current rounded-sm"/>
                <div className="w-[6px] h-[6px] bg-current rounded-sm"/>
                <div className="w-[6px] h-[6px] bg-current rounded-sm"/>
              </div>
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">Showing 148 items</span>
        </div>
      </div>

      <Card className="shadow-sm border-muted/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%] text-xs font-semibold uppercase tracking-wider text-muted-foreground">NAME</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SOURCE</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">COURSE</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LAST MODIFIED</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <File className="w-4 h-4 text-blue-500" />
                  Case_Study.docx
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-normal bg-muted">User Upload</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">MPU3253</TableCell>
              <TableCell className="text-sm text-muted-foreground">Apr 01, 2026</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 pr-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                    <span className="text-[10px] font-bold">GD</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-4 h-4 text-green-600 bg-green-100 rounded-[2px] font-bold text-[8px] tracking-tighter leading-none pt-[1px]">X</div>
                  Research_Data_Set_Raw.xlsx
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-normal bg-muted">Imported</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">5024CMD</TableCell>
              <TableCell className="text-sm text-muted-foreground">Today, 10:45 AM</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 pr-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                    <span className="text-[10px] font-bold">GD</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-center pt-4">
        <Button variant="secondary" className="text-sm bg-[#e2e8f0] text-[#1e293b] hover:bg-[#cbd5e1]">
          Load 24 More Resources
        </Button>
      </div>
    </div>
  )
}