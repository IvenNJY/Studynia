"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "../logout-button"

type ProfileCardProps = {
  fullName: string
  avatarUrl: string | null
}

function getInitials(fullName: string) {
  const initials = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")
  return initials.toUpperCase() || "U"
}

export function ProfileCard({ fullName, avatarUrl }: ProfileCardProps) {
  const editProfile = () => window.dispatchEvent(new Event("profile-edit-requested"))

  return (
    <Card>
      <CardContent className="flex flex-col items-center p-5 text-center">
        <Avatar className="mb-4 size-24 rounded-2xl">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={`${fullName || "User"} profile picture`} className="rounded-2xl" />}
          <AvatarFallback className=" text-2xl font-semibold">{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-semibold text-foreground">{fullName || "Your Profile"}</h3>
        <Button type="button" variant="outline" className="mt-6 w-full font-medium text-foreground curosr-pointer" onClick={editProfile}>
          Edit Profile
        </Button>
        <div className="mt-4 w-full">
          <LogoutButton />
        </div>
      </CardContent>
    </Card>
  )
}
