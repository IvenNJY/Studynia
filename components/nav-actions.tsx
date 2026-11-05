"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  FileText,
  GalleryVerticalEnd,
  LineChart,
  Link,
  MoreHorizontal,
  Settings2,
  Star,
  Trash,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const data = [
  [
    {
      label: "Copy Link",
      icon: Link,
    },
    {
      label: "Move to Trash",
      icon: Trash2,
    },
  ],
  [
    {
      label: "Undo",
      icon: CornerUpLeft,
    },
  ],
]

export function NavActions({ noteId, canEdit = true }: { noteId: string; canEdit?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isTagOpen, setIsTagOpen] = React.useState(false)
  const [showTrashDialog, setShowTrashDialog] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)
  const router = useRouter()
  const [favorite, setFavorite] = React.useState(false)
  const [tag, setTag] = React.useState("")
  const [tagCourseId, setTagCourseId] = React.useState("")
  const [tags, setTags] = React.useState<Array<{ id: string; name: string; course_id?: string | null }>>([])
  const [courses, setCourses] = React.useState<Array<{ id: string; course_name: string | null }>>([])

  React.useEffect(() => {
    fetch(`/api/notes/${noteId}/metadata`).then((response) => response.ok ? response.json() : null).then(
      (data: 
        { favorite?: boolean;
          tags?: Array<{ id: string; name: string; course_id?: string | null }>
        } | null) => {
      if (data) { setFavorite(Boolean(data.favorite)); setTags(data.tags ?? []) }
    }).catch(() => undefined)
    fetch("/api/courses").then((response) => response.ok ? response.json() : []).then(setCourses).catch(() => undefined)
  }, [noteId])

  const toggleFavorite = async () => {
    const next = !favorite
    const response = await fetch(`/api/notes/${noteId}/metadata`, 
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorite: next }) })
    if (response.ok) setFavorite(next)
  }
  const saveTag = async () => {
    if (!tag.trim()) return
    const response = await fetch(`/api/notes/${noteId}/metadata`, 
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag, courseId: tagCourseId || null }) })
    if (response.ok) {
      const data = await fetch(`/api/notes/${noteId}/metadata`).then((response) => response.json())
      setTags(data.tags ?? [])
      toast.success("Tag added")
      setTag("")
      setTagCourseId("")
    }
  }

  const updateTag = async (tagId: string, name: string, courseId: string | null) => {
    const response = await fetch(`/api/notes/${noteId}/metadata`, 
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagId, tag: name, courseId }) })
    if (response.ok) setTags((current) => current.map((entry) => entry.id === tagId ? { ...entry, name, course_id: courseId } : entry))
  }

  const removeTag = async (tagId: string) => {
    const response = await fetch(`/api/notes/${noteId}/metadata`, 
      { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagId }) })
    if (response.ok) setTags((current) => current.filter((entry) => entry.id !== tagId))
  }

  const handleAction = (label: string) => {
    if (label === "Copy Link") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
      setTimeout(() => setIsOpen(false), 100)
    } else if (label === "Move to Trash") {
      setShowTrashDialog(true)
      setIsOpen(false)
    }
  }

  const handleMoveToTrash = async () => {
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/notes/${noteId}/archive`, {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Failed to move note to trash")
      }
      toast.success("Note moved to trash")
      setShowTrashDialog(false)
      setTimeout(() => {
        router.push("/home")
      }, 500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move note to trash")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void toggleFavorite()} aria-label={favorite ? "Remove favorite" : "Add favorite"}>
        <Star className={favorite ? "fill-yellow-400 text-yellow-500" : ""} />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 data-[state=open]:bg-accent"
            >
              <MoreHorizontal />
            </Button>
          }
        />
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.filter((item) => canEdit || item.label !== "Move to Trash").map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton onClick={() => handleAction(item.label)}>
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
      {canEdit && <Popover open={isTagOpen} onOpenChange={setIsTagOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Tag note">#</Button>} />
        <PopoverContent className="w-80 space-y-3">
          <p className="text-sm font-medium">Manage tags</p>
          {tags.map((entry) => <div key={entry.id} className="space-y-1 rounded-md border p-2"><div className="flex gap-1"><input className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-sm" defaultValue={entry.name} onBlur={(event) => void updateTag(entry.id, event.target.value.trim() || entry.name, entry.course_id ?? null)} /><Button size="sm" variant="ghost" onClick={() => void removeTag(entry.id)}>Delete</Button></div><select className="w-full rounded border bg-background px-2 py-1 text-xs" value={entry.course_id ?? ""} onChange={(event) => void updateTag(entry.id, entry.name, event.target.value || null)}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.course_name || "Untitled course"}</option>)}</select></div>)}
          <input className="w-full rounded-md border bg-background px-2 py-1 text-sm" value={tag} onChange={(event) => setTag(event.target.value)} placeholder="e.g. Exam revision" onKeyDown={(event) => { if (event.key === "Enter") void saveTag() }} />
          <select className="w-full rounded border bg-background px-2 py-1 text-xs" value={tagCourseId} onChange={(event) => setTagCourseId(event.target.value)}><option value="">Bind to no course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.course_name || "Untitled course"}</option>)}</select>
          <Button size="sm" onClick={() => void saveTag()}>Add tag</Button>
        </PopoverContent>
      </Popover>}

      {/* Confirmation Dialog for Move to Trash */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Note to Trash?</DialogTitle>
            <DialogDescription>
              This note will be moved to trash and can be restored from there for 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTrashDialog(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMoveToTrash}
              disabled={isArchiving}
            >
              {isArchiving ? "Moving..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
