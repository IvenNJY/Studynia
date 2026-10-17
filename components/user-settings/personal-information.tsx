"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/client"

type PersonalInformationProps = {
  fullName: string
  institutionName: string
}

export function PersonalInformation({ fullName: initialFullName, institutionName: initialInstitutionName }: PersonalInformationProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [savedFullName, setSavedFullName] = useState(initialFullName)
  const [institutionName, setInstitutionName] = useState(initialInstitutionName)
  const [savedInstitutionName, setSavedInstitutionName] = useState(initialInstitutionName)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  useEffect(() => {
    const startEditing = () => setIsEditing(true)
    window.addEventListener("profile-edit-requested", startEditing)
    return () => window.removeEventListener("profile-edit-requested", startEditing)
  }, [])

  const saveInformation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isEditing) return

    setIsSaving(true)
    const toastId = toast.loading("Saving personal information…")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, institution_name: institutionName }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "Could not save your profile")

      setSavedFullName(fullName.trim())
      setSavedInstitutionName(institutionName.trim())
      setFullName(fullName.trim())
      setInstitutionName(institutionName.trim())
      setIsEditing(false)
      toast.success("Personal information saved.", { id: toastId })
      router.refresh()
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Could not save your profile", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEditing = () => {
    setFullName(savedFullName)
    setInstitutionName(savedInstitutionName)
    setIsEditing(false)
  }

  const sendPasswordReset = async () => {
    setIsSendingReset(true)
    const toastId = toast.loading("Sending password reset email…")
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.email) throw new Error("Your account does not have an email address to send a reset link to.")
      const resetCallbackUrl = new URL("/auth/oauth", window.location.origin)
      resetCallbackUrl.searchParams.set("next", "/auth/update-password")
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: resetCallbackUrl.toString(),
      })
      if (resetError) throw resetError
      toast.success("Password reset email sent.", { id: toastId })
    } catch (resetError) {
      toast.error(resetError instanceof Error ? resetError.message : "Could not send the password reset email", { id: toastId })
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <CardTitle className="text-xl font-normal text-muted-foreground">Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={saveInformation} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="profile-full-name" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="profile-full-name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                readOnly={!isEditing}
                maxLength={120}
                className={`h-12 px-4 text-sm font-medium focus-visible:ring-1 focus-visible:ring-ring ${
                  isEditing ? "border border-input bg-background" : "border-0 bg-muted"
                }`}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="profile-institution" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Institution
              </Label>
              <Input
                id="profile-institution"
                autoComplete="organization"
                value={institutionName}
                onChange={(event) => setInstitutionName(event.target.value)}
                readOnly={!isEditing}
                maxLength={200}
                className={`h-12 px-4 text-sm font-medium focus-visible:ring-1 focus-visible:ring-ring ${
                  isEditing ? "border border-input bg-background" : "border-0 bg-muted"
                }`}
              />
            </div>

            <div className="flex flex-col justify-end space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Security</Label>
              <Button type="button" variant="secondary" className="h-12 w-full justify-center gap-2 text-foreground font-semibold cursor-pointer" onClick={() => void sendPasswordReset()} disabled={isSendingReset}>
                <Lock className="h-4 w-4" /> {isSendingReset ? "Sending reset email…" : "Reset password via email"}
              </Button>
            </div>
          </div>

          {isEditing && <div className="flex justify-end gap-2">
            <Button type="button" className="cursor-pointer" variant="outline" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="cursor-pointer" disabled={isSaving || isSendingReset}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>}
        </form>
      </CardContent>
    </Card>
  )
}
