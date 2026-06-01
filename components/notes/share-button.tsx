"use client"

import * as React from "react"
import { Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { shareNoteWithEmail, removeNoteShare, updateNoteSharePermission } from "@/app/notes/[id]/actions"
import { createClient } from "@/lib/client"

export function ShareButton({ noteId, isOwner }: { noteId: string, isOwner: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [permission, setPermission] = React.useState<'read' | 'edit'>("read")
  const [isInviting, setIsInviting] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [shares, setShares] = React.useState<any[]>([])

  const supabase = createClient()

  const loadShares = React.useCallback(async () => {
    const { data: shareData, error } = await supabase
      .from('note_shares')
      .select('*, shared_user:profiles!shared_with_id(id, full_name, avatar_url, role)')
      .eq('note_id', noteId)

    if (!error && shareData) {
      setShares(shareData)
    }
  }, [noteId, supabase])

  React.useEffect(() => {
    if (isOpen) {
      loadShares()
      setMessage("")
    }
  }, [isOpen, loadShares])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsInviting(true)
    setMessage("")
    
    const res = await shareNoteWithEmail(noteId, email, permission)
    
    if (res?.error) {
      setMessage(`Error: ${res.error}`)
    } else {
      setMessage("Success: User invited.")
      setEmail("")
      loadShares()
    }
    setIsInviting(false)
  }

  const handleRemove = async (shareId: string) => {
    await removeNoteShare(shareId)
    loadShares()
  }

  const handleUpdateLevel = async (shareId: string, level: 'read' | 'edit') => {
    await updateNoteSharePermission(shareId, level)
    loadShares()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-8 gap-1 font-medium">
            <Users className="h-4 w-4" />
            Share
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Invite others to view or collaborate on this note.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleInvite} className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="text"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                autoComplete="off"
              />
              <select
                className="flex h-9 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-ring"
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'read' | 'edit')}
              >
                <option value="read">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <Button type="submit" size="sm" className="px-4" disabled={isInviting || !email}>
                {isInviting ? "Inviting" : "Invite"}
              </Button>
            </div>
            {message && (
              <span className={`text-xs ${message.startsWith('Error') ? 'text-rose-500' : 'text-emerald-500'}`}>
                {message}
              </span>
            )}
          </form>
        )}

        <div className="flex flex-col gap-3 py-4 mt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">People with access</p>
          {shares.length === 0 && (
            <p className="text-xs text-muted-foreground">This note is currently private.</p>
          )}
          {shares.map((share) => (
            <div key={share.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                  {share.shared_user?.full_name ? share.shared_user.full_name[0] : 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium">{share.shared_user?.full_name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{share.shared_user?.role || 'User'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <select
                      className="h-8 w-[100px] rounded-md bg-transparent text-xs text-muted-foreground font-medium outline-none cursor-pointer"
                      value={share.permission_level}
                      onChange={(e) => handleUpdateLevel(share.id, e.target.value as 'read' | 'edit')}
                    >
                      <option value="read">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-rose-500" onClick={() => handleRemove(share.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground mr-2">
                    {share.permission_level === 'read' ? 'Can view' : 'Can edit'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </DialogContent>
    </Dialog>
  )
}