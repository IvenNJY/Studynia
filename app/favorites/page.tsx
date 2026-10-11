"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"

type Note = { id: string; title: string | null; updated_at: string }
export default function FavoritesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  useEffect(() => { fetch("/api/notes/favorites").then((response) => response.ok ? response.json() : []).then(setNotes).catch(() => setNotes([])) }, [])
  return <div className="mx-auto w-full max-w-3xl p-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />Favorite notes</CardTitle></CardHeader><CardContent className="space-y-2">{notes.length === 0 ? <p className="text-sm text-muted-foreground">Favorite notes will appear here.</p> : notes.map((note) => <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-md border p-3 hover:bg-muted"><span className="font-medium">{note.title || "Untitled note"}</span><span className="block text-xs text-muted-foreground">Updated {new Date(note.updated_at).toLocaleDateString()}</span></Link>)}</CardContent></Card></div>
}
