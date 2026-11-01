"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, BarChart3, BookOpen, ChevronLeft, ChevronRight, Loader2, Search, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 10

type StudentScore = {
	id: string
	name: string
	institutionName: string | null
	averageScore: number | null
	attempts: number
	courseCount: number
	lastActivityAt: string | null
}

type CourseScore = {
	id: string
	courseName: string
	courseCode: string | null
	averageScore: number
	attempts: number
	lastActivityAt: string | null
}

type Attempt = {
	id: string
	courseId: string | null
	courseName: string
	score: number
	completedAt: string | null
}

type SortKey = "name" | "averageScore" | "attempts" | "courseCount" | "lastActivityAt"
type CourseSortKey = "courseName" | "averageScore" | "attempts" | "lastActivityAt"

function formatDate(value: string | null) {
	return value ? new Date(value).toLocaleDateString() : "No activity"
}

function scoreLabel(value: number | null) {
	return value === null ? "No scores" : `${value}%`
}

export function SupervisorDashboard({ supervisorName }: { supervisorName: string | null }) {
	const [students, setStudents] = useState<StudentScore[]>([])
	const [courseScores, setCourseScores] = useState<CourseScore[]>([])
	const [attemptHistory, setAttemptHistory] = useState<Attempt[]>([])
	const [selectedCourseId, setSelectedCourseId] = useState("all")
	const [search, setSearch] = useState("")
	const [sortKey, setSortKey] = useState<SortKey>("averageScore")
	const [sortDescending, setSortDescending] = useState(true)
	const [courseSortKey, setCourseSortKey] = useState<CourseSortKey>("averageScore")
	const [courseSortDescending, setCourseSortDescending] = useState(true)
	const [studentPage, setStudentPage] = useState(1)
	const [coursePage, setCoursePage] = useState(1)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetch("/api/supervisor/performance", { cache: "no-store" })
			.then(async (response) => {
				if (!response.ok) throw new Error("Failed to load supervisor performance")
				return response.json()
			})
			.then((data) => {
				setStudents(data.students ?? [])
				setCourseScores(data.courses ?? [])
				setAttemptHistory(data.attemptHistory ?? [])
			})
			.catch((requestError: unknown) => {
				setError(requestError instanceof Error ? requestError.message : "Failed to load supervisor performance")
			})
			.finally(() => setLoading(false))
	}, [])

	const filteredStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()
		return students
			.filter((student) => !normalizedSearch || `${student.name} ${student.institutionName || ""}`.toLowerCase().includes(normalizedSearch))
			.sort((left, right) => {
				const leftValue = left[sortKey] ?? (sortKey === "lastActivityAt" ? "" : -1)
				const rightValue = right[sortKey] ?? (sortKey === "lastActivityAt" ? "" : -1)
				const comparison = typeof leftValue === "string" && typeof rightValue === "string"
					? leftValue.localeCompare(rightValue)
					: Number(leftValue) - Number(rightValue)
				return sortDescending ? -comparison : comparison
			})
	}, [search, sortDescending, sortKey, students])

	const filteredCourses = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()
		return courseScores.filter((course) =>
			!normalizedSearch || `${course.courseName} ${course.courseCode || ""}`.toLowerCase().includes(normalizedSearch)
		).sort((left, right) => {
			const leftValue = left[courseSortKey] ?? ""
			const rightValue = right[courseSortKey] ?? ""
			const comparison = typeof leftValue === "string" && typeof rightValue === "string"
				? leftValue.localeCompare(rightValue)
				: Number(leftValue) - Number(rightValue)
			return courseSortDescending ? -comparison : comparison
		})
	}, [courseSortDescending, courseSortKey, courseScores, search])

	const studentPageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
	const coursePageCount = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))
	const visibleStudents = filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE)
	const visibleCourses = filteredCourses.slice((coursePage - 1) * PAGE_SIZE, coursePage * PAGE_SIZE)

	const scoredStudents = students.filter((student) => student.averageScore !== null)
	const overallAverage = scoredStudents.length
		? Math.round(scoredStudents.reduce((sum, student) => sum + (student.averageScore || 0), 0) / scoredStudents.length)
		: null
	const filteredTrend = useMemo(() => {
		const attempts = selectedCourseId === "all"
			? attemptHistory
			: attemptHistory.filter((attempt) => attempt.courseId === selectedCourseId)
		return [...attempts].reverse().slice(-10)
	}, [attemptHistory, selectedCourseId])

	function changeSort(nextKey: SortKey) {
		if (sortKey === nextKey) setSortDescending((value) => !value)
		else {
			setSortKey(nextKey)
			setSortDescending(nextKey !== "name")
		}
	}

	function sortIndicator(key: SortKey) {
		if (sortKey !== key) return null
		return sortDescending ? <ArrowDown className="ml-1 inline h-3 w-3" /> : <ArrowUp className="ml-1 inline h-3 w-3" />
	}

	function changeCourseSort(nextKey: CourseSortKey) {
		if (courseSortKey === nextKey) setCourseSortDescending((value) => !value)
		else {
			setCourseSortKey(nextKey)
			setCourseSortDescending(nextKey !== "courseName")
		}
	}

	function courseSortIndicator(key: CourseSortKey) {
		if (courseSortKey !== key) return null
		return courseSortDescending ? <ArrowDown className="ml-1 inline h-3 w-3" /> : <ArrowUp className="ml-1 inline h-3 w-3" />
	}

	return (
		<div className="w-full max-w-7xl space-y-6">
			<section className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Supervisor workspace</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight">Student performance</h1>
					<p className="mt-1 text-sm text-muted-foreground">Welcome back{supervisorName ? `, ${supervisorName}` : ""}. Review scores across students and courses.</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline"><BarChart3 /> Performance review</Badge>
				</div>
			</section>

			{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

			<div className="grid gap-4 md:grid-cols-3">
				<Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Students</p><p className="mt-1 text-3xl font-semibold">{students.length}</p></div><Users className="h-5 w-5 text-primary" /></CardContent></Card>
				<Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Average score</p><p className="mt-1 text-3xl font-semibold">{scoreLabel(overallAverage)}</p></div><BarChart3 className="h-5 w-5 text-primary" /></CardContent></Card>
				<Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Course records</p><p className="mt-1 text-3xl font-semibold">{courseScores.length}</p></div><BookOpen className="h-5 w-5 text-primary" /></CardContent></Card>
			</div>


			<Card>
				<CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
					<CardTitle>Student scores</CardTitle>
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setStudentPage(1); setCoursePage(1) }} placeholder="Search students or courses" className="pl-9 sm:w-64" /></div>
						<Select value={sortKey} onValueChange={(value) => changeSort(value as SortKey)}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="averageScore">Average score</SelectItem><SelectItem value="name">Student name</SelectItem><SelectItem value="attempts">Attempts</SelectItem><SelectItem value="courseCount">Courses</SelectItem><SelectItem value="lastActivityAt">Last activity</SelectItem></SelectContent></Select>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : <Table><TableHeader><TableRow><TableHead><button onClick={() => changeSort("name")}>Student {sortIndicator("name")}</button></TableHead><TableHead>Institution</TableHead><TableHead><button onClick={() => changeSort("averageScore")}>Average score {sortIndicator("averageScore")}</button></TableHead><TableHead><button onClick={() => changeSort("attempts")}>Attempts {sortIndicator("attempts")}</button></TableHead><TableHead><button onClick={() => changeSort("courseCount")}>Courses {sortIndicator("courseCount")}</button></TableHead><TableHead><button onClick={() => changeSort("lastActivityAt")}>Last activity {sortIndicator("lastActivityAt")}</button></TableHead></TableRow></TableHeader><TableBody>{filteredStudents.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No student records found.</TableCell></TableRow> : visibleStudents.map((student) => <TableRow key={student.id}><TableCell className="font-medium"><Link href={`/students/${student.id}`} className="hover:text-primary hover:underline">{student.name}</Link></TableCell><TableCell>{student.institutionName || "-"}</TableCell><TableCell className="font-semibold">{scoreLabel(student.averageScore)}</TableCell><TableCell>{student.attempts}</TableCell><TableCell>{student.courseCount}</TableCell><TableCell>{formatDate(student.lastActivityAt)}</TableCell></TableRow>)}</TableBody></Table>}
				</CardContent>
				<div className="flex items-center justify-between border-t px-4 py-3">
					<p className="text-sm text-muted-foreground">{filteredStudents.length === 0 ? "No students" : `Showing ${(studentPage - 1) * PAGE_SIZE + 1}–${Math.min(studentPage * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} students`}</p>
					<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setStudentPage((page) => Math.max(1, page - 1))} disabled={studentPage <= 1}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="text-sm text-muted-foreground">{studentPage} / {studentPageCount}</span><Button variant="outline" size="sm" onClick={() => setStudentPage((page) => Math.min(studentPageCount, page + 1))} disabled={studentPage >= studentPageCount}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
				</div>
			</Card>

			<Card>
				<CardHeader className="border-b"><CardTitle>Course breakdown</CardTitle><p className="text-sm text-muted-foreground">Select a course to review every student&apos;s performance.</p></CardHeader>
				<CardContent className="p-0"><Table><TableHeader><TableRow><TableHead><button onClick={() => changeCourseSort("courseName")}>Course {courseSortIndicator("courseName")}</button></TableHead><TableHead><button onClick={() => changeCourseSort("averageScore")}>Average score {courseSortIndicator("averageScore")}</button></TableHead><TableHead><button onClick={() => changeCourseSort("attempts")}>Attempts {courseSortIndicator("attempts")}</button></TableHead><TableHead><button onClick={() => changeCourseSort("lastActivityAt")}>Last activity {courseSortIndicator("lastActivityAt")}</button></TableHead></TableRow></TableHeader><TableBody>{filteredCourses.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No course score records found.</TableCell></TableRow> : visibleCourses.map((course) => <TableRow key={course.id}><TableCell className="font-medium"><Link href={`/students/courses/${course.id}`} className="hover:text-primary hover:underline">{course.courseCode ? `${course.courseCode} - ` : ""}{course.courseName}</Link></TableCell><TableCell className="font-semibold">{course.averageScore}%</TableCell><TableCell>{course.attempts}</TableCell><TableCell>{formatDate(course.lastActivityAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent>
				<div className="flex items-center justify-between border-t px-4 py-3">
					<p className="text-sm text-muted-foreground">{filteredCourses.length === 0 ? "No courses" : `Showing ${(coursePage - 1) * PAGE_SIZE + 1}–${Math.min(coursePage * PAGE_SIZE, filteredCourses.length)} of ${filteredCourses.length} courses`}</p>
					<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCoursePage((page) => Math.max(1, page - 1))} disabled={coursePage <= 1}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="text-sm text-muted-foreground">{coursePage} / {coursePageCount}</span><Button variant="outline" size="sm" onClick={() => setCoursePage((page) => Math.min(coursePageCount, page + 1))} disabled={coursePage >= coursePageCount}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
				</div>
			</Card>
		</div>
	)
}
