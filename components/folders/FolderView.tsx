"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  Loader2,
  MessageSquareMore,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// --- Types ---
type ModuleItem = {
  id: number
  title: string
  type: string
  html_url?: string
  url?: string
  page_url?: string
  published: boolean
  position: number
  material_id?: string
  viewed?: boolean
  material_source?: string
}

type Module = {
  id: number
  name: string
  position: number
  published: boolean
  state: string
  items: ModuleItem[]
}

type CourseDetail = {
  id: string
  lms_external_id?: string | null
  course_name: string
  course_code: string
  description: string
  syllabus_body?: string
  instructor?: string
  course_url?: string
}

type FolderApiResponse = {
  course: CourseDetail
  modules: Module[]
}

type LinkedNote = {
  id: string
  title: string | null
  content: unknown
  updated_at: string
  course_id: string | null
}

// --- Utility Functions ---
function getNotePreview(content: unknown) {
  const textParts: string[] = []

  const collectText = (value: unknown) => {
    if (typeof value === "string") {
      textParts.push(value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach(collectText)
      return
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>
      if (typeof record.text === "string") textParts.push(record.text)
      if (Array.isArray(record.content)) record.content.forEach(collectText)
    }
  }

  collectText(content)
  return textParts.join(" ").replace(/\s+/g, " ").trim().slice(0, 160)
}

function formatModuleType(type: string) {
  return type.replaceAll("_", " ")
}

function getItemLink(item: ModuleItem) {
  return item.html_url || item.url || item.page_url || null
}

function getItemIcon(type: string) {
  if (type.includes("quiz")) return "quiz"
  if (type.includes("assignment")) return "assignment"
  if (type.includes("discussion")) return "discussion"
  return "page"
}

// --- Sub-Components ---

function FolderModuleItem({
  item,
  moduleId,
  isCompleted,
  onDragStart,
  onToggleCompletion,
  onEditMaterial,
  onDeleteMaterial,
}: {
  item: ModuleItem
  moduleId: number
  isCompleted: boolean
  onDragStart: (e: React.DragEvent, itemId: number, moduleId: number) => void
  onToggleCompletion: (itemId: number) => void
  onEditMaterial: (item: ModuleItem) => void
  onDeleteMaterial: (item: ModuleItem) => void
}) {
  const link = getItemLink(item)
  const iconKind = getItemIcon(item.type)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, moduleId)}
      className={cn(
        "flex cursor-grab items-center justify-between gap-4 rounded-xl border bg-background/70 px-4 py-3 transition-all hover:bg-muted/80 active:cursor-grabbing",
        isCompleted && "bg-muted/30 opacity-75"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Checkbox to arbitrarily mark completion */}
        <div 
          className="flex h-full items-center" 
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag initiation when clicking checkbox
        >
          <Checkbox 
            checked={isCompleted} 
            onCheckedChange={() => onToggleCompletion(item.id)} 
            className="h-5 w-5 rounded-md"
          />
        </div>

        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", isCompleted && "opacity-50")}>
          {iconKind === "assignment" ? (
            <FileText className="h-4 w-4 text-sky-600" />
          ) : iconKind === "quiz" ? (
            <BookOpen className="h-4 w-4 text-emerald-600" />
          ) : iconKind === "discussion" ? (
            <MessageSquareMore className="h-4 w-4 text-amber-600" />
          ) : (
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium transition-colors", isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
            {item.title}
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatModuleType(item.type)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
      {item.material_id && item.material_source === "local" && <>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${item.title}`} onClick={() => onEditMaterial(item)} onPointerDown={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${item.title}`} onClick={() => onDeleteMaterial(item)} onPointerDown={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </>}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking link
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-xs", isCompleted && "pointer-events-none opacity-50")}
        >
          Open
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Badge variant="secondary" className="shrink-0">
          In course
        </Badge>
      )}
      </div>
    </div>
  )
}

function ModuleCard({
  module,
  index,
  completedItems,
  onDragStart,
  onDrop,
  onToggleCompletion,
  onEditMaterial,
  onDeleteMaterial,
}: {
  module: Module
  index: number
  completedItems: Set<number>
  onDragStart: (e: React.DragEvent, itemId: number, moduleId: number) => void
  onDrop: (e: React.DragEvent, moduleId: number) => void
  onToggleCompletion: (itemId: number) => void
  onEditMaterial: (item: ModuleItem) => void
  onDeleteMaterial: (item: ModuleItem) => void
}) {
  return (
    <Card className="overflow-hidden border-muted/60 bg-background/90 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{module.name}</h3>
                <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                  {module.published ? "Published" : module.state}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {module.items.length} material{module.items.length === 1 ? "" : "s"} inside this module.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Module {index + 1}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move"
            e.currentTarget.classList.add("ring-2", "ring-primary/50", "bg-muted/30")
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-2", "ring-primary/50", "bg-muted/30")
          }}
          onDrop={(e) => onDrop(e, module.id)}
          className="grid min-h-[80px] gap-2 rounded-xl transition-all"
        >
          {module.items.length > 0 ? (
            module.items.map((item) => (
              <FolderModuleItem
                key={item.id}
                item={item}
                moduleId={module.id}
                isCompleted={completedItems.has(item.id)}
                onDragStart={onDragStart}
                onToggleCompletion={onToggleCompletion}
                onEditMaterial={onEditMaterial}
                onDeleteMaterial={onDeleteMaterial}
              />
            ))
          ) : (
            <div className="pointer-events-none flex h-full min-h-[80px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
              Drop materials here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CourseHeader({
  course,
  modulesCount,
  totalItems,
  progress,
  onEditCourse,
  onDeleteCourse,
}: {
  course: CourseDetail | null
  modulesCount: number
  totalItems: number
  progress: number
  onEditCourse: () => void
  onDeleteCourse: () => void
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-4">
        <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">
          Canvas Folder
        </Badge>
        <div className="space-y-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {course?.course_name || "Course Folder"}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            {course?.description || "Modules pulled directly from Canvas and grouped into a clean folder view."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:w-fit">
      {!course?.lms_external_id?.trim() && <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEditCourse}><Pencil className="mr-2 h-4 w-4" />Edit course</Button>
        <Button variant="outline" size="sm" onClick={onDeleteCourse}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Delete course</Button>
      </div>}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-muted/50 bg-background/80 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{modulesCount}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modules</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-background/80 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{totalItems}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Items</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-background/80 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{progress}%</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Complete</p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}

function CourseSidebar({
  course,
  modulesCount,
  totalItems,
  progress,
  publishedModules,
  sidebarItems,
  instructorName,
}: {
  course: CourseDetail | null
  modulesCount: number
  totalItems: number
  progress: number
  publishedModules: number
  sidebarItems: { moduleName: string; item: ModuleItem }[]
  instructorName: string
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <Card className="overflow-hidden border-0 bg-linear-to-br from-sky-950 via-sky-900 to-slate-900 text-white shadow-xl shadow-sky-950/20">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-sky-100/80">Overall Progress</p>
              <h3 className="mt-1 text-lg font-semibold">{course?.course_code || "Course overview"}</h3>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-50">
              {progress}%
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-sky-100/80">
                <span>Completed materials</span>
                <span>
                  {Math.round((progress / 100) * totalItems)}/{totalItems}
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" indicatorclass="bg-cyan-300" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-3xl font-semibold">{modulesCount || 0}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sky-100/70">Modules</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-3xl font-semibold">{publishedModules}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sky-100/70">Published</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted/60 bg-background/90 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Course Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sidebarItems.length > 0 ? (
            sidebarItems.map(({ moduleName, item }) => {
              const link = getItemLink(item)

              return (
                <div key={`${item.id}-${moduleName}`} className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-3">
                  <div className="mt-0.5 rounded-lg bg-background p-2">
                    <FileText className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{moduleName}</p>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className="pt-1 text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              No resources found yet.
            </div>
          )}

          <Separator />

          <Link href="/resources" className={cn(buttonVariants({ size: "default" }), "w-full gap-2")}>
            Explore All Materials
            <Download className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card className="border-muted/60 bg-background/90 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Instructor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">{instructorName}</p>
              <p className="text-sm text-muted-foreground">Lecturer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function LinkedNoteCard({ title, description, label, noteId }: { title: string; description: string; label: string; noteId?: string }) {
  return (
    <Card className="border-muted/50 bg-background shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <Badge variant="outline" className="bg-primary/5 text-[10px] uppercase tracking-[0.18em] text-primary">
          {label}
        </Badge>
        <Link href={noteId ? `/notes/${noteId}` : "/notes"} className="block">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Linked to this module set
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main View Component ---

export function FolderView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkedNotes, setLinkedNotes] = useState<LinkedNote[]>([])

  // Arbitrary Client-Side State
  const [dragContext, setDragContext] = useState<{ itemId: number; moduleId: number } | null>(null)
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set())
  const pendingProgress = useRef(new Map<string, boolean>())
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [materialTitle, setMaterialTitle] = useState("")
  const [materialUrl, setMaterialUrl] = useState("")
  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const addingMaterialRef = useRef(false)
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [showDeleteCourse, setShowDeleteCourse] = useState(false)
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [courseName, setCourseName] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [editingMaterial, setEditingMaterial] = useState<ModuleItem | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<ModuleItem | null>(null)
  const [editMaterialTitle, setEditMaterialTitle] = useState("")
  const [editMaterialUrl, setEditMaterialUrl] = useState("")
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadCourse = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lms/modules/${courseId}`, { cache: "no-store" })
        const payload = (await response.json()) as Partial<FolderApiResponse> & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load course details")
        }

        if (!isActive) return

        setCourse(payload.course || null)
        setCourseName(payload.course?.course_name || "")
        setCourseCode(payload.course?.course_code || "")
        setCourseDescription(payload.course?.description || "")

        const notesResponse = await fetch(`/api/courses/${courseId}/notes`, { cache: "no-store" })
        if (notesResponse.ok && isActive) {
          const notesPayload = await notesResponse.json() as LinkedNote[]
          setLinkedNotes(Array.isArray(notesPayload) ? notesPayload : [])
        } else if (isActive) {
          setLinkedNotes([])
        }

        const nextModules = Array.isArray(payload.modules) ? payload.modules : []
        setModules(nextModules)
        setCompletedItems(new Set(
          nextModules.flatMap((module) => module.items)
            .filter((item) => item.viewed)
            .map((item) => item.id)
        ))
      } catch (err: unknown) {
        if (!isActive) return

        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadCourse()
    return () => {
      isActive = false
      if (progressTimer.current) clearTimeout(progressTimer.current)
    }
  }, [courseId])

  const saveCourse = async () => {
    if (!course || !courseName.trim()) return
    setIsSavingCourse(true)
    try {
      const response = await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_name: courseName, course_code: courseCode, description: courseDescription }) })
      const payload = await response.json() as CourseDetail & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Could not update course")
      setCourse((current) => current ? { ...current, ...payload } : current)
      setShowEditCourse(false)
      toast.success("Course updated.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update course") }
    finally { setIsSavingCourse(false) }
  }

  const deleteCourse = async () => {
    if (!course) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/courses/${course.id}`, { method: "DELETE" })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || "Could not delete course")
      window.location.assign("/resources")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete course")
      setIsDeleting(false)
      setShowDeleteCourse(false)
    }
  }

  const beginEditMaterial = (item: ModuleItem) => {
    setEditingMaterial(item)
    setEditMaterialTitle(item.title)
    setEditMaterialUrl(getItemLink(item) || "")
  }

  const saveMaterial = async () => {
    if (!editingMaterial?.material_id || !editMaterialTitle.trim() || !editMaterialUrl.trim()) return
    setIsSavingMaterial(true)
    try {
      const response = await fetch(`/api/materials/${editingMaterial.material_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editMaterialTitle, file_url: editMaterialUrl }) })
      const payload = await response.json() as { title?: string; file_url?: string; error?: string }
      if (!response.ok) throw new Error(payload.error || "Could not update material")
      setModules((current) => current.map((module) => ({ ...module, items: module.items.map((item) => item.material_id === editingMaterial.material_id ? { ...item, title: payload.title || item.title, html_url: payload.file_url || item.html_url } : item) })))
      setEditingMaterial(null)
      toast.success("Material updated.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update material") }
    finally { setIsSavingMaterial(false) }
  }

  const deleteMaterial = async () => {
    if (!deletingMaterial?.material_id) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/materials/${deletingMaterial.material_id}`, { method: "DELETE" })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || "Could not delete material")
      const materialId = deletingMaterial.material_id
      const itemId = deletingMaterial.id
      setModules((current) => current.map((module) => ({ ...module, items: module.items.filter((item) => item.material_id !== materialId) })))
      setCompletedItems((current) => { const next = new Set(current); next.delete(itemId); return next })
      setDeletingMaterial(null)
      toast.success("Material deleted.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete material") }
    finally { setIsDeleting(false) }
  }

  // Handlers
  const handleToggleCompletion = (itemId: number) => {
    const item = modules.flatMap((module) => module.items).find((candidate) => candidate.id === itemId)
    setCompletedItems((prev) => {
      const next = new Set(prev)
      const viewed = !next.has(itemId)
      if (!viewed) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      if (item?.material_id) pendingProgress.current.set(item.material_id, viewed)
      return next
    })

    if (progressTimer.current) clearTimeout(progressTimer.current)
    progressTimer.current = setTimeout(async () => {
      const updates = Array.from(pendingProgress.current.entries()).map(([material_id, viewed]) => ({ material_id, viewed }))
      pendingProgress.current.clear()
      if (updates.length === 0) return
      const response = await fetch("/api/material-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
      if (!response.ok) console.error("Failed to save material progress")
    }, 700)
  }

  const handleAddMaterial = async () => {
    if (addingMaterialRef.current || !course?.id || !materialTitle.trim() || !materialUrl.trim()) return
    addingMaterialRef.current = true
    setIsAddingMaterial(true)
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: course.id, title: materialTitle, file_url: materialUrl }),
      })
      if (!response.ok) throw new Error("Failed to save the material.")
      const material = await response.json() as {
        id: string
        title: string
        file_url: string
        content_type: string
      }
      setModules((previous) => {
        const firstModule = previous[0]
        if (!firstModule) {
          return [{
            id: -1,
            name: "My Materials",
            position: 0,
            published: true,
            state: "published",
            items: [{
              id: Date.now(),
              material_id: material.id,
              material_source: "local",
              title: material.title,
              type: material.content_type,
              html_url: material.file_url,
              published: true,
              position: 0,
            }],
          }]
        }
        return previous.map((module, index) => index === 0
          ? { ...module, items: [...module.items, {
            id: Date.now(),
            material_id: material.id,
            material_source: "local",
            title: material.title,
            type: material.content_type,
            html_url: material.file_url,
            published: true,
            position: module.items.length,
          }] }
          : module)
      })
      setMaterialTitle("")
      setMaterialUrl("")
      setShowAddMaterial(false)
      toast.success("Material added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save the material.")
    } finally {
      addingMaterialRef.current = false
      setIsAddingMaterial(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: number, moduleId: number) => {
    setDragContext({ itemId, moduleId })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
    }
  }

  const handleDrop = (e: React.DragEvent, targetModuleId: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove("ring-2", "ring-primary/50", "bg-muted/30")

    if (!dragContext) return
    if (dragContext.moduleId === targetModuleId) return

    setModules((prevModules) => {
      const newModules = JSON.parse(JSON.stringify(prevModules)) as Module[]

      const sourceModule = newModules.find((m) => m.id === dragContext.moduleId)
      const targetModule = newModules.find((m) => m.id === targetModuleId)

      if (!sourceModule || !targetModule) return prevModules

      const itemIndex = sourceModule.items.findIndex((i) => i.id === dragContext.itemId)
      if (itemIndex === -1) return prevModules

      const [movedItem] = sourceModule.items.splice(itemIndex, 1)
      targetModule.items.push(movedItem)

      return newModules
    })

    setDragContext(null)
  }

  // Derived State
  const stats = useMemo(() => {
    const totalItems = modules.reduce((count, module) => count + module.items.length, 0)
    const publishedModules = modules.filter((module) => module.published).length
    
    // Progress is now calculated by items checked off vs total items
    const progress = totalItems > 0 ? Math.round((completedItems.size / totalItems) * 100) : 0
    
    return { totalItems, publishedModules, progress }
  }, [modules, completedItems])

  const sidebarItems = useMemo(
    () =>
      modules
        .flatMap((module) => module.items.map((item) => ({ moduleName: module.name, item })))
        .slice(0, 4),
    [modules]
  )

  const instructorName = course?.instructor || "Lecturer"

  return (
    <div className="w-full max-w-7xl space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/resources" className="transition-colors hover:text-foreground">
          Folders
        </Link>
        <span>/</span>
        <span className="text-foreground">{course?.course_code || "Course"}</span>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="h-10 w-52 animate-pulse rounded-full bg-muted" />
            <div className="h-14 w-full max-w-4xl animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            <div className="h-72 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      ) : error ? (
        <Card className="border-2 border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Unable to load this course</p>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">{error}</p>
            <Link href="/resources" className={cn(buttonVariants({ size: "default" }), "mt-6")}>
              Back to folders
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <CourseHeader
            course={course}
            modulesCount={modules.length}
            totalItems={stats.totalItems}
            progress={stats.progress}
            onEditCourse={() => setShowEditCourse(true)}
            onDeleteCourse={() => setShowDeleteCourse(true)}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Curriculum Modules</h2>
                    <p className="text-sm text-muted-foreground">Drag and drop materials to organize, or check them off as you go.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddMaterial(true)}>
                      Add material
                    </Button>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                      {stats.progress}% Complete
                    </Badge>
                  </div>
                </div>

                <Dialog open={showAddMaterial} onOpenChange={(open) => { if (!isAddingMaterial) setShowAddMaterial(open) }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add material</DialogTitle>
                      <DialogDescription>Add a link to a course resource.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} placeholder="Material title" disabled={isAddingMaterial} />
                      <Input value={materialUrl} onChange={(event) => setMaterialUrl(event.target.value)} placeholder="File URL" type="url" disabled={isAddingMaterial} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddMaterial(false)} disabled={isAddingMaterial}>Cancel</Button>
                      <Button onClick={() => void handleAddMaterial()} disabled={!materialTitle.trim() || !materialUrl.trim() || isAddingMaterial}>
                        {isAddingMaterial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAddingMaterial ? "Saving..." : "Save material"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showEditCourse} onOpenChange={(open) => !isSavingCourse && setShowEditCourse(open)}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit course</DialogTitle><DialogDescription>Update this course folder’s details.</DialogDescription></DialogHeader>
                    <div className="space-y-3">
                      <Input value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Course name" disabled={isSavingCourse} />
                      <Input value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="Course code" disabled={isSavingCourse} />
                      <Input value={courseDescription} onChange={(event) => setCourseDescription(event.target.value)} placeholder="Description" disabled={isSavingCourse} />
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowEditCourse(false)} disabled={isSavingCourse}>Cancel</Button><Button onClick={() => void saveCourse()} disabled={!courseName.trim() || isSavingCourse}>{isSavingCourse ? "Saving…" : "Save changes"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showDeleteCourse} onOpenChange={(open) => !isDeleting && setShowDeleteCourse(open)}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Delete this course?</DialogTitle><DialogDescription>This permanently removes “{course?.course_name}”. Course deletion may be blocked while linked records remain.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setShowDeleteCourse(false)} disabled={isDeleting}>Cancel</Button><Button variant="destructive" onClick={() => void deleteCourse()} disabled={isDeleting}>{isDeleting ? "Deleting…" : "Delete course"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={Boolean(editingMaterial)} onOpenChange={(open) => !isSavingMaterial && !open && setEditingMaterial(null)}>
                  <DialogContent><DialogHeader><DialogTitle>Edit material</DialogTitle><DialogDescription>Update the title and resource link.</DialogDescription></DialogHeader>
                    <div className="space-y-3"><Input value={editMaterialTitle} onChange={(event) => setEditMaterialTitle(event.target.value)} placeholder="Material title" disabled={isSavingMaterial} /><Input value={editMaterialUrl} onChange={(event) => setEditMaterialUrl(event.target.value)} placeholder="File URL" type="url" disabled={isSavingMaterial} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setEditingMaterial(null)} disabled={isSavingMaterial}>Cancel</Button><Button onClick={() => void saveMaterial()} disabled={!editMaterialTitle.trim() || !editMaterialUrl.trim() || isSavingMaterial}>{isSavingMaterial ? "Saving…" : "Save changes"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={Boolean(deletingMaterial)} onOpenChange={(open) => !isDeleting && !open && setDeletingMaterial(null)}>
                  <DialogContent><DialogHeader><DialogTitle>Delete this material?</DialogTitle><DialogDescription>“{deletingMaterial?.title}” will be permanently removed from this course folder.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setDeletingMaterial(null)} disabled={isDeleting}>Cancel</Button><Button variant="destructive" onClick={() => void deleteMaterial()} disabled={isDeleting}>{isDeleting ? "Deleting…" : "Delete material"}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-4">
                  {modules.length === 0 ? (
                    <Card className="border-dashed bg-muted/20">
                      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium">No modules available</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Canvas has not published any module data for this course yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    modules.map((module, index) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        index={index}
                        completedItems={completedItems}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onToggleCompletion={handleToggleCompletion}
                        onEditMaterial={beginEditMaterial}
                        onDeleteMaterial={setDeletingMaterial}
                      />
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Linked Notes</h2>
                  <Link
                    href="/notes"
                    className={cn(buttonVariants({ variant: "ghost" }), "gap-2 text-sm font-medium text-primary hover:text-primary")}
                  >
                    View Studio
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {linkedNotes.map((note) => (
                    <LinkedNoteCard
                      key={note.id}
                      noteId={note.id}
                      label={note.course_id === courseId ? "Course Note" : "Course Tag"}
                      title={note.title || "Untitled note"}
                      description={getNotePreview(note.content) || "Open this note to view its contents."}
                    />
                  ))}
                  {linkedNotes.length === 0 && (
                    <Card className="border-dashed border-muted/60 bg-transparent shadow-none">
                      <CardContent className="flex h-full min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
                        <FileText className="mb-3 h-10 w-10" />
                        <p className="font-medium text-foreground">No linked notes yet</p>
                        <p className="mt-1 text-sm">Bind a note tag to this course to show it here.</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-dashed border-muted/60 bg-transparent shadow-none">
                    <CardContent className="flex h-full min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
                      <GraduationCap className="mb-3 h-10 w-10" />
                      <p className="font-medium text-foreground">Start a New Note</p>
                      <p className="mt-1 text-sm">Capture ideas from this course folder.</p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>

            <CourseSidebar
              course={course}
              modulesCount={modules.length}
              totalItems={stats.totalItems}
              progress={stats.progress}
              publishedModules={stats.publishedModules}
              sidebarItems={sidebarItems}
              instructorName={instructorName}
            />
          </div>
        </>
      )}
    </div>
  )
}
