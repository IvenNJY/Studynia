"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function AuthErrorToast({ message }: { message: string }) {
  useEffect(() => {
    toast.error(message)
  }, [message])

  return null
}
