"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Search, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

type Note = {
  id: string
  title: string
  updated_at: string
  favorite: boolean
  tags: Array<{ id: string; name: string }>
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/notes?search=${encodeURIComponent(search)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Failed to load notes")))
      .then(setNotes)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setNotes([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [search])

  const tags = useMemo(() => [...new Map(notes.flatMap((note) => note.tags).map((tag) => [tag.id, tag])).values()], [notes])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <h2 className="text-sm font-semibold">Notes</h2>
        </header>
        <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="text-muted-foreground">Search your notes by title or tag.</p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes or tags..." className="h-9 pl-8" aria-label="Search notes and tags" />
          </div>
          {tags.length > 0 && <div className="flex flex-wrap gap-2">{tags.map((tag) => <button key={tag.id} type="button" onClick={() => setSearch(tag.name)}><Badge variant={search.toLowerCase() === tag.name.toLowerCase() ? "default" : "outline"}>{tag.name}</Badge></button>)}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{loading ? "Loading notes..." : `${notes.length} note${notes.length === 1 ? "" : "s"}`}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {!loading && notes.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No notes match your search.</p>}
          {notes.map((note) => <Link key={note.id} href={`/notes/${note.id}`} className="rounded-lg border p-4 transition-colors hover:bg-muted"><div className="flex items-start justify-between gap-3"><span className="font-medium">{note.title}</span>{note.favorite && <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-500" />}</div><div className="mt-3 flex flex-wrap gap-1">{note.tags.map((tag) => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}</div><span className="mt-3 block text-xs text-muted-foreground">Updated {new Date(note.updated_at).toLocaleDateString()}</span></Link>)}
        </CardContent>
      </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
