import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogoutButton } from "../logout-button"

export function ProfileCard() {
  return (
    <Card>
      <CardContent className="p-5 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-muted rounded-2xl mb-4 overflow-hidden shadow-sm flex items-center justify-center">
          <img src="https://avatars.githubusercontent.com/u/178879836?s=400&u=411df684b9c4f98831da4ef086c6e5b5a25e8abf&v=4" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h3 className="font-semibold text-xl text-foreground">Iven Nyam</h3>
        <p className="text-sm text-muted-foreground mb-6">Computer Science Student</p>
        <Button variant="outline" className="w-full text-foreground font-medium">Edit Profile</Button>
        <div className="w-full mt-4">
          <LogoutButton />
        </div>
      </CardContent>
    </Card>
  )
}
