"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BarChart3, BookOpen, ChevronLeft, ChevronRight, Loader2, MessageCircle, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Attempt = { id: string; assessmentTitle: string; courseId: string | null; courseName: string; courseCode: string | null; score: number; completedAt: string | null }
type CourseScore = { courseId: string; courseName: string; courseCode: string | null; averageScore: number; attempts: number }
type WeakArea = { area: string; incorrectCount: number; incorrectCountsByCourse: Record<string, number>; courses: string[]; courseIds: string[]; quizzes: string[]; sources: Array<{ sourceId: number | null; name: string; incorrectCount: number; incorrectCountsByCourse: Record<string, number>; courseIds: string[] }> }
type DashboardData = { student: { name: string; institutionName: string | null }; attemptHistory: Attempt[]; courseScores: CourseScore[]; weakAreas: WeakArea[] }



function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString() : "No date" }

export function SupervisorStudentDashboard({ studentId }: { studentId: string }) {
	const [data, setData] = useState<DashboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedCourseId, setSelectedCourseId] = useState("all")
	const [weakAreaSort, setWeakAreaSort] = useState<"incorrect" | "source">("incorrect")
	const [weakAreaPage, setWeakAreaPage] = useState(0)
	const [showChatDialog, setShowChatDialog] = useState(false)
	const [selectedAttemptId, setSelectedAttemptId] = useState("")
	const [chatError, setChatError] = useState("")
	const router = useRouter()

	useEffect(() => {
		fetch(`/api/supervisor/students/${studentId}/performance`, { cache: "no-store" })
			.then(async (response) => { if (!response.ok) throw new Error(response.status === 404 ? "Student not found" : "Failed to load student performance"); return response.json() })
			.then(setData)
			.catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Failed to load student performance"))
			.finally(() => setLoading(false))
	}, [studentId])

	const overallAverage = data?.attemptHistory.length ? Math.round(data.attemptHistory.reduce((sum, attempt) => sum + attempt.score, 0) / data.attemptHistory.length) : null
	const filteredCourseScores = data?.courseScores.filter((course) => selectedCourseId === "all" || course.courseId === selectedCourseId) ?? []
	const filteredAttempts = data?.attemptHistory.filter((attempt) => selectedCourseId === "all" || attempt.courseId === selectedCourseId) ?? []
	const filteredWeakAreas = useMemo(() => {
		const areas = data?.weakAreas.filter((area) => selectedCourseId === "all" || area.courseIds.includes(selectedCourseId)) ?? []
		return areas.map((area) => ({
			...area,
			incorrectCount: selectedCourseId === "all" ? area.incorrectCount : area.incorrectCountsByCourse[selectedCourseId] ?? 0,
			sources: area.sources.filter((source) => selectedCourseId === "all" || source.courseIds.includes(selectedCourseId)).map((source) => ({
				...source,
				incorrectCount: selectedCourseId === "all" ? source.incorrectCount : source.incorrectCountsByCourse[selectedCourseId] ?? 0,
			})).sort((left, right) => {
				if (left.sourceId === null) return 1
				if (right.sourceId === null) return -1
				return left.sourceId - right.sourceId || left.name.localeCompare(right.name)
			}),
		})).sort((left, right) => weakAreaSort === "source"
			? ((left.sources[0]?.sourceId ?? Number.MAX_SAFE_INTEGER) - (right.sources[0]?.sourceId ?? Number.MAX_SAFE_INTEGER))
			: right.incorrectCount - left.incorrectCount)
	}, [data?.weakAreas, selectedCourseId, weakAreaSort])
	const filteredMaxWeakCount = Math.max(...filteredWeakAreas.map((area) => area.incorrectCount), 1)
	const sourceChartData = useMemo(() => {
		const counts = new Map<string, { name: string; count: number }>()
		for (const area of filteredWeakAreas) {
			for (const source of area.sources) {
				const key = `${source.sourceId ?? "unknown"}-${source.name}`
				const current = counts.get(key)
				counts.set(key, { name: source.sourceId === null ? source.name : `${source.sourceId}. ${source.name}`, count: (current?.count ?? 0) + source.incorrectCount })
			}
		}
		return [...counts.values()].sort((left, right) => right.count - left.count)
	}, [filteredWeakAreas])
	const sourceChartTotal = sourceChartData.reduce((sum, source) => sum + source.count, 0)
	const weakAreasPerPage = 5
	const weakAreaPageCount = Math.ceil(filteredWeakAreas.length / weakAreasPerPage)
	const currentWeakAreaPage = Math.min(weakAreaPage, Math.max(weakAreaPageCount - 1, 0))
	const visibleWeakAreas = filteredWeakAreas.slice(currentWeakAreaPage * weakAreasPerPage, (currentWeakAreaPage + 1) * weakAreasPerPage)

	async function openAttemptChat() {
		setChatError("")
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: studentId }),
		})
		if (!response.ok) {
			setChatError("Could not start the chat.")
			return
		}
		const { conversationId } = await response.json()
		const query = new URLSearchParams({ conversation: conversationId })
		if (selectedAttemptId) query.set("attempt", selectedAttemptId)
		router.push(`/chat?${query.toString()}`)
	}

	if (loading) return <div className="flex min-h-64 w-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
	if (error || !data) return <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error || "Student performance is unavailable"}</div>

	return (
		<div className="w-full max-w-7xl space-y-6">
		  <Link href="/students" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
		  <ArrowLeft className="h-4 w-4" /> Back to students</Link>
		  <section className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
		    <div>
		      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Student performance profile</p>
		      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.student.name}</h1>
		      <p className="mt-1 text-sm text-muted-foreground">{data.student.institutionName || "Institution not provided"}</p>
		    </div>
		    <div className="flex items-center gap-2">
		      <Badge variant="outline">
		        <Target /> Individual review
		      </Badge><Button onClick={()=> setShowChatDialog(true)}>
		        <MessageCircle /> Message student
		      </Button>
		    </div>
		  </section>
		  <div className="grid gap-4 md:grid-cols-3">
		    <Card>
		      <CardContent className="p-5">
		        <p className="text-sm text-muted-foreground">Average score</p>
		        <p className="mt-1 text-3xl font-semibold">{overallAverage === null ? "No scores" : `${overallAverage}%`}</p>
		      </CardContent>
		    </Card>
		    <Card>
		      <CardContent className="p-5">
		        <p className="text-sm text-muted-foreground">Attempts completed</p>
		        <p className="mt-1 text-3xl font-semibold">{filteredAttempts.length}</p>
		      </CardContent>
		    </Card>
		    <Card>
		      <CardContent className="p-5">
		        <p className="text-sm text-muted-foreground">Weak areas found</p>
		        <p className="mt-1 text-3xl font-semibold">{filteredWeakAreas.length}</p>
		      </CardContent>
		    </Card>
		  </div>
		  <Card>
		    <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
		      <div>
		        <CardTitle>Filter by course</CardTitle>
		        <p className="text-sm text-muted-foreground">Apply the selected course to the score breakdown, attempts, and weak areas.</p>
		      </div><Select value={selectedCourseId} onValueChange={(value)=> { if (value) setSelectedCourseId(value) }}><SelectTrigger className="w-full sm:w-64">
		          <SelectValue />
		        </SelectTrigger>
		        <SelectContent>
		          <SelectItem value="all">All courses</SelectItem>{data.courseScores.map((course) => <SelectItem key={course.courseId} value={course.courseId}>{course.courseCode ? `${course.courseCode} - ` : ""}{course.courseName}</SelectItem>)}
		        </SelectContent>
		      </Select>
		    </CardHeader>
		  </Card>
		  <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
		    <Card>
		      <CardHeader className="border-b">
		        <CardTitle className="flex items-center gap-2">
		          <BarChart3 className="h-4 w-4 text-primary" /> Score breakdown by course
		        </CardTitle>
		        <p className="text-sm text-muted-foreground">Compare this student&apos;s average score in each course.</p>
		      </CardHeader>
		      <CardContent>
		        <div className="space-y-5">{filteredCourseScores.length === 0 ? <p className="text-sm text-muted-foreground">No course scores yet.</p> : filteredCourseScores.map((course) => <div key={course.courseId} className="space-y-2">
		            <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{course.courseCode ? `${course.courseCode} - ` : ""}{course.courseName}</span><span className="font-semibold">{course.averageScore}%</span></div>
		            <div className="h-7 overflow-hidden rounded-md bg-muted">
		              <div className="flex h-full items-center rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground transition-all" style={{ width: `${Math.max(course.averageScore, 8)}%` }}>{course.averageScore}%</div>
		            </div>
		            <p className="text-xs text-muted-foreground">{course.attempts} attempt{course.attempts === 1 ? "" : "s"}</p>
		          </div>)}</div>
		      </CardContent>
		    </Card>
		    <Card>
		      <CardHeader className="border-b">
		        <CardTitle>Course summary</CardTitle>
		      </CardHeader>
		      <CardContent className="space-y-3">{filteredCourseScores.length === 0 ? <p className="text-sm text-muted-foreground">No course scores yet.</p> : filteredCourseScores.map((course) => <div key={course.courseId} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="truncate text-sm font-medium">{course.courseName}</span><span className="text-sm font-semibold">{course.averageScore}%</span></div>)}</CardContent>
		    </Card>
		  </div>
		  {selectedCourseId !== "all" && <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
		    <Card>
		      <CardHeader className="border-b">
		        <CardTitle>Attempt history</CardTitle>
		      </CardHeader>
		      <CardContent className="p-0">
		        <Table>
		          <TableHeader>
		            <TableRow>
		              <TableHead>Assessment</TableHead>
		              <TableHead>Course</TableHead>
		              <TableHead>Score</TableHead>
		              <TableHead>Completed</TableHead>
		            </TableRow>
		          </TableHeader>
		          <TableBody>{filteredAttempts.length === 0 ? <TableRow>
		              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No completed attempts for this course.</TableCell>
		            </TableRow> : filteredAttempts.map((attempt) => <TableRow key={attempt.id}>
		              <TableCell className="font-medium">{attempt.assessmentTitle}</TableCell>
		              <TableCell>{attempt.courseName}</TableCell>
		              <TableCell className="font-semibold">{attempt.score}%</TableCell>
		              <TableCell>{formatDate(attempt.completedAt)}</TableCell>
		            </TableRow>)}</TableBody>
		        </Table>
		      </CardContent>
		    </Card>
		    <Card>
		      <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
		        <div>
		          <CardTitle className="flex items-center gap-2">
		            <BookOpen className="h-4 w-4 text-primary" /> Weak areas by source
		          </CardTitle>
		          <p className="text-sm text-muted-foreground">Source chapters are ordered by source ID and filename.</p>
		        </div><Select value={weakAreaSort} onValueChange={(value)=> { if (value === "incorrect" || value === "source") setWeakAreaSort(value) }}><SelectTrigger className="w-full sm:w-44">
		            <SelectValue />
		          </SelectTrigger>
		          <SelectContent>
		            <SelectItem value="incorrect">Most incorrect</SelectItem>
		            <SelectItem value="source">Source chapters</SelectItem>
		          </SelectContent>
		        </Select>
		      </CardHeader>
		      <CardContent className="space-y-5">{filteredWeakAreas.length === 0 ? <p className="text-sm text-muted-foreground">No incorrect answers for this course.</p> : <>
		        {sourceChartData.length > 0 && <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
		          <div className="h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(${sourceChartData.map((source, index) => {
		            const start = sourceChartData.slice(0, index).reduce((sum, item) => sum + item.count, 0) / sourceChartTotal * 100
		            const end = (sourceChartData.slice(0, index + 1).reduce((sum, item) => sum + item.count, 0) / sourceChartTotal) * 100
		            return `${["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea", "#0891b2"][index % 6]} ${start}% ${end}%`
		          }).join(", ")})` }} aria-label="Incorrect answers by source chapter" role="img" />
		          <div className="min-w-0 space-y-1">
		            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incorrect by source</p>
		            {sourceChartData.slice(0, 4).map((source, index) => <div key={source.name} className="flex items-center gap-2 text-xs">
		              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea", "#0891b2"][index % 6] }} />
		              <span className="truncate">{source.name}</span><span className="font-semibold">{source.count}</span>
		            </div>)}
		            {sourceChartData.length > 4 && <p className="text-xs text-muted-foreground">+{sourceChartData.length - 4} more chapters</p>}
		          </div>
		        </div>}
		        {visibleWeakAreas.map((area) => <div key={area.area} className="space-y-3 rounded-lg border p-4">
		          <div className="flex items-start justify-between gap-3">
		            <div>
		              <p className="font-medium">{area.area}</p>
		              <p className="text-xs text-muted-foreground">{area.incorrectCount} incorrect answer{area.incorrectCount === 1 ? "" : "s"}</p>
		            </div>
		            <div className="h-2 w-20 overflow-hidden rounded-full bg-destructive/10">
		              <div className="h-full rounded-full bg-destructive/70" style={{ width: `${(area.incorrectCount / filteredMaxWeakCount) * 100}%` }} />
		            </div>
		          </div>
		          <div>
		            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source chapters</p>
		            <div className="space-y-1.5">{area.sources.length > 0 ? area.sources.map((source) => <div key={`${source.sourceId ?? "unknown" }-${source.name}`} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-xs"><span className="truncate">{source.sourceId === null ? source.name : `${source.sourceId}. ${source.name}`}</span><span className="font-semibold text-destructive">{source.incorrectCount} incorrect</span></div>) : <p className="text-xs text-muted-foreground">Source chapter unavailable</p>}</div>
		          </div>{area.quizzes.length > 0 && <p className="text-xs text-muted-foreground">Quiz: {area.quizzes.join(", ")}</p>}
		        </div>)}
		        {weakAreaPageCount > 1 && <div className="flex items-center justify-between border-t pt-4">
		          <p className="text-xs text-muted-foreground">Page {currentWeakAreaPage + 1} of {weakAreaPageCount}</p>
		          <div className="flex gap-2">
		            <Button type="button" variant="outline" size="sm" onClick={() => setWeakAreaPage((page) => Math.max(page - 1, 0))} disabled={currentWeakAreaPage === 0} aria-label="Previous weak areas page"><ChevronLeft className="h-4 w-4" /></Button>
		            <Button type="button" variant="outline" size="sm" onClick={() => setWeakAreaPage((page) => Math.min(page + 1, weakAreaPageCount - 1))} disabled={currentWeakAreaPage === weakAreaPageCount - 1} aria-label="Next weak areas page"><ChevronRight className="h-4 w-4" /></Button>
		          </div>
		        </div>}
		      </>}</CardContent>
		    </Card>
		  </div>}
		  <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
		    <DialogContent>
		      <DialogHeader>
		        <DialogTitle>Message {data.student.name}</DialogTitle>
		        <DialogDescription>Select an attempt if your feedback is about a specific assessment.</DialogDescription>
		      </DialogHeader><select value={selectedAttemptId} onChange={(event)=> setSelectedAttemptId(event.target.value)} className="h-9 w-full overflow-auto rounded-md border bg-background px-3 text-sm"><option value="">General feedback</option>{data.attemptHistory.map((attempt) => <option key={attempt.id} value={attempt.id}>{formatDate(attempt.completedAt)} · {attempt.assessmentTitle} · {attempt.score}% </option>)}</select>{chatError && <p className="text-sm text-destructive">{chatError}</p>}<DialogFooter><Button variant="outline" onClick={()=> setShowChatDialog(false)}>Cancel</Button><Button onClick={()=> void openAttemptChat()}>
		          <MessageCircle /> Open chat
		        </Button></DialogFooter>
		    </DialogContent>
		  </Dialog>
		</div>
	)
}