"use client"

import React, { useState, useEffect } from "react"
import { Trash2, RotateCcw, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TrashNote {
  id: string
  title: string
  content?: Record<string, unknown>
  created_at: string
  updated_at: string
}

function extractExcerpt(content?: Record<string, unknown>): string {
  if (!content) return "No content"
  // Extract text from Tiptap JSON content or return preview
  if (typeof content === "object" && "text" in content) {
    return String(content.text).slice(0, 80)
  }
  return "No content"
}

function getDaysAgo(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function TrashCard() {
  const [trashItems, setTrashItems] = useState<TrashNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [showEmptyDialog, setShowEmptyDialog] = useState(false)
  const [emptyingTrash, setEmptyingTrash] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  useEffect(() => {
    fetchTrash()
  }, [])

  const fetchTrash = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/trash")
      if (!response.ok) {
        throw new Error("Failed to fetch trash")
      }
      const result = await response.json()
      setTrashItems(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trash")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: string) => {
    setRestoring(id)
    try {
      const response = await fetch(`/api/trash/${id}`, {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to restore note")
      }
      setTrashItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore note")
    } finally {
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/trash/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete note")
      }
      setTrashItems((prev) => prev.filter((item) => item.id !== id))
      setShowDeleteDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note")
    } finally {
      setDeleting(false)
    }
  }

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true)
    try {
      const response = await fetch("/api/trash", {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to empty trash")
      }
      setTrashItems([])
      setShowEmptyDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to empty trash")
    } finally {
      setEmptyingTrash(false)
    }
  }

  return (
    <Card className="min-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
        <div className="space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
            <Trash2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Trash</CardTitle>
          <p className="text-sm text-muted-foreground">
            Items in the trash are permanently deleted after 30 days.
          </p>
        </div>

        {trashItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowEmptyDialog(true)}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            disabled={emptyingTrash}
          >
            {emptyingTrash ? "Emptying..." : "Empty Trash"}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-transparent border-t-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading trash...</p>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border bg-muted/10">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Your trash is empty</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Any notes or files you delete will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashItems.map((item) => {
              const daysAgo = getDaysAgo(item.updated_at)
              const daysRemaining = 30 - daysAgo
              const isUrgent = daysRemaining <= 3

              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40"
                >
                  <div className="flex items-start gap-4 overflow-hidden">
                    <div className="mt-1 rounded-lg bg-background p-2 shadow-sm border border-border/50 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 truncate">
                      <h4 className="font-semibold text-foreground truncate">
                        {item.title || "Untitled Note"}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {extractExcerpt(item.content)}
                      </p>

                      <div
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-2 ${
                          isUrgent ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {isUrgent && <AlertCircle className="h-3 w-3" />}
                        <span>
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      disabled={restoring === item.id}
                      className="text-primary hover:bg-primary/10 hover:text-primary font-medium"
                    >
                      <RotateCcw className={`mr-2 h-4 w-4 ${restoring === item.id ? "animate-spin" : ""}`} />
                      {restoring === item.id ? "Restoring..." : "Restore"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(item.id)}
                      disabled={deleting}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete permanently</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog for Empty Trash */}
      <Dialog open={showEmptyDialog} onOpenChange={setShowEmptyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empty Trash?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {trashItems.length} archived note{trashItems.length !== 1 ? "s" : ""}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmptyDialog(false)}
              disabled={emptyingTrash}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmptyTrash}
              disabled={emptyingTrash}
            >
              {emptyingTrash ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Individual Delete */}
      {showDeleteDialog && (
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note Permanently?</DialogTitle>
              <DialogDescription>
                This will permanently delete "{trashItems.find(item => item.id === showDeleteDialog)?.title || "Untitled Note"}".
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handlePermanentDelete(showDeleteDialog)}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}