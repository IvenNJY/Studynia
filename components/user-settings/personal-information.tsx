import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

export function PersonalInformation() {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-8">
        <CardTitle className="text-xl font-normal text-muted-foreground">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-3">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Full Name
            </Label>
            <Input 
              defaultValue="Iven Nyam" 
              className="bg-muted border-0 h-12 text-sm font-medium focus-visible:ring-1 focus-visible:ring-ring px-4" 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Academic Email
            </Label>
            <Input 
              defaultValue="p111111111@newinti.student.edu.my" 
              className="bg-muted border-0 h-12 text-sm font-medium focus-visible:ring-1 focus-visible:ring-ring px-4" 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Institution
            </Label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-muted text-foreground text-sm font-medium border-0 h-12 rounded-md px-4 pr-10 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                defaultValue="Institute of Advanced Cog-Science"
              >
                <option value="Institute of Advanced Cog-Science">
                  INTI
                </option>
                <option value="Other">Other University</option>
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3 flex flex-col justify-end">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Security
            </Label>
            <Button 
              variant="secondary" 
              className="w-full justify-center gap-2 h-12 text-foreground font-semibold"
            >
              <Lock className="w-4 h-4" /> Reset Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
