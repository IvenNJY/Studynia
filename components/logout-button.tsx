'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function LogoutButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <Button className="bg-rose-500 hover:bg-rose-600 cursor-pointer w-full">
            Logout
          </Button>
        } 
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to end your current session? You'll need to sign back in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={logout}>Sign Out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
