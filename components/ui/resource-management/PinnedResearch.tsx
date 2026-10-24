"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react"

type Research = {
  id: string
  link: string | null
  display_name: string | null
  created_at: string | null
}

type ResearchForm = {
  display_name: string
  link: string
}

const emptyForm: ResearchForm = { display_name: "", link: "" }

export function PinnedResearch() {
  const [research, setResearch] = useState<Research[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingResearch, setEditingResearch] = useState<Research | null>(null)
  const [form, setForm] = useState<ResearchForm>(emptyForm)
  const [deletingResearch, setDeletingResearch] = useState<Research | null>(null)
  const [isAllResearchOpen, setIsAllResearchOpen] = useState(false)

  const loadResearch = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/research")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to load research")
      setResearch(data as Research[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load research")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResearch()
  }, [])

  const filteredResearch = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return research

    return research.filter((item) =>
      `${item.display_name ?? ""} ${item.link ?? ""}`.toLowerCase().includes(normalizedSearch)
    )
  }, [research, search])

  const visibleResearch = filteredResearch.slice(0, 2)

  const openAddDialog = () => {
    setEditingResearch(null)
    setForm(emptyForm)
    setError("")
    setIsFormOpen(true)
  }

  const openEditDialog = (item: Research) => {
    setEditingResearch(item)
    setForm({ display_name: item.display_name ?? "", link: item.link ?? "" })
    setError("")
    setIsFormOpen(true)
  }

  const saveResearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch("/api/research", {
        method: editingResearch ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingResearch?.id }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to save research")

      setResearch((current) => editingResearch
        ? current.map((item) => item.id === data.id ? data : item)
        : [data, ...current]
      )
      setIsFormOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save research")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteResearch = async () => {
    if (!deletingResearch) return
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch("/api/research", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingResearch.id }),
      })
      const data = response.status === 204 ? null : await response.json()

      if (!response.ok) throw new Error(data?.error || "Failed to delete research")

      setResearch((current) => current.filter((item) => item.id !== deletingResearch.id))
      setDeletingResearch(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete research")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-muted-foreground fill-current" />
          <h2 className="text-lg font-semibold">Pinned Research</h2>
        </div>
        <Button size="sm" onClick={openAddDialog} className="cursor-pointer">
          <Plus className="h-4 w-4" />
          Add research
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search research" className="h-9 pl-9" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        {isLoading ? [1, 2].map((item) => <Skeleton key={item} className="h-28 w-full rounded-xl" />) : visibleResearch.map((item) => (
          <Card key={item.id} className="group shadow-sm border-muted/50 bg-background/50 hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <a href={item.link ?? "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Badge variant="secondary" className="text-[10px] h-5 rounded-sm">EXTERNAL LINK</Badge>
                  </div>
                  <p className="text-sm font-medium leading-snug mt-2 wrap-break-word">{item.display_name}</p>
                  <p className="text-xs text-muted-foreground mt-2 truncate">{item.link}</p>
                </a>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(item)} aria-label={`Edit ${item.display_name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeletingResearch(item)} aria-label={`Delete ${item.display_name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filteredResearch.length > visibleResearch.length && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <span>+{filteredResearch.length - visibleResearch.length} more</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsAllResearchOpen(true)}>
              Show more
            </Button>
          </div>
        )}
        {!isLoading && filteredResearch.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {research.length === 0 ? "No research pinned yet." : "No research matches your search."}
          </p>
        )}
      </div>

      <Dialog open={isAllResearchOpen} onOpenChange={setIsAllResearchOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>All research links</DialogTitle>
            <DialogDescription>{filteredResearch.length} research links found.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {filteredResearch.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                <a href={item.link ?? "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                  <p className="wrap-break-word text-sm font-medium">{item.display_name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.link}</p>
                </a>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(item)} aria-label={`Edit ${item.display_name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeletingResearch(item)} aria-label={`Delete ${item.display_name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResearch ? "Edit research" : "Add research"}</DialogTitle>
            <DialogDescription>Save a title and link for quick access later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveResearch} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="research-title" className="text-xs font-medium">Title</label>
              <Input id="research-title" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} placeholder="Research title" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="research-link" className="text-xs font-medium">Link</label>
              <Input id="research-link" type="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="https://example.com" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save research"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingResearch)} onOpenChange={(open) => !open && setDeletingResearch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete research?</DialogTitle>
            <DialogDescription>This will remove “{deletingResearch?.display_name}” from your pinned research.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingResearch(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteResearch} disabled={isSaving}>{isSaving ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}