"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Course = { id: string; courseName: string; courseCode: string | null; averageScore: number; attempts: number }
type Student = { id: string; name: string; institutionName: string | null }
type Attempt = { id: string; studentId: string; courseId: string | null; score: number; completedAt: string | null }
type PerformanceData = { courses: Course[]; students: Student[]; attemptHistory: Attempt[] }

function formatDate(value: string | null) {
	return value ? new Date(value).toLocaleDateString() : "No activity"
}

export function SupervisorCourseDashboard({ courseId }: { courseId: string }) {
	const [data, setData] = useState<PerformanceData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetch("/api/supervisor/performance", { cache: "no-store" })
			.then(async (response) => {
				if (!response.ok) throw new Error("Failed to load course performance")
				return response.json()
			})
			.then(setData)
			.catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Failed to load course performance"))
			.finally(() => setLoading(false))
	}, [])

	const course = data?.courses.find((item) => item.id === courseId)
	const studentRows = useMemo(() => {
		if (!data) return []
		const attemptsByStudent = new Map<string, Attempt[]>()
		for (const attempt of data.attemptHistory.filter((item) => item.courseId === courseId)) {
			const attempts = attemptsByStudent.get(attempt.studentId) ?? []
			attempts.push(attempt)
			attemptsByStudent.set(attempt.studentId, attempts)
		}

		return data.students
			.map((student) => {
				const attempts = attemptsByStudent.get(student.id) ?? []
				const averageScore = attempts.length ? Math.round(attempts.reduce((total, attempt) => total + attempt.score, 0) / attempts.length) : null
				const lastActivityAt = attempts.reduce<string | null>((latest, attempt) => {
					if (!attempt.completedAt) return latest
					return !latest || attempt.completedAt > latest ? attempt.completedAt : latest
				}, null)
				return { ...student, averageScore, attempts: attempts.length, lastActivityAt }
			})
			.filter((student) => student.attempts > 0)
			.sort((left, right) => (right.averageScore ?? -1) - (left.averageScore ?? -1))
	}, [courseId, data])

	if (loading) return <div className="flex min-h-64 w-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
	if (error || !data || !course) return <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error || "Course performance is unavailable"}</div>

	return (
		<div className="w-full max-w-7xl space-y-6">
			<Link href="/students" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to students</Link>
			<section className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
				<div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Course breakdown</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.courseName}</h1><p className="mt-1 text-sm text-muted-foreground">{course.courseCode || "Course performance"} across all students with completed attempts.</p></div>
				<Badge variant="outline"><BookOpen /> {course.attempts} attempts</Badge>
			</section>
			<div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Course average</p><p className="mt-1 text-3xl font-semibold">{course.averageScore}%</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Students assessed</p><p className="mt-1 text-3xl font-semibold">{studentRows.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed attempts</p><p className="mt-1 text-3xl font-semibold">{course.attempts}</p></CardContent></Card></div>
			<Card><CardHeader className="border-b"><CardTitle>Student performance</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Institution</TableHead><TableHead>Average score</TableHead><TableHead>Attempts</TableHead><TableHead>Last activity</TableHead></TableRow></TableHeader><TableBody>{studentRows.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No completed attempts for this course.</TableCell></TableRow> : studentRows.map((student) => <TableRow key={student.id}><TableCell className="font-medium"><Link href={`/students/${student.id}`} className="hover:text-primary hover:underline">{student.name}</Link></TableCell><TableCell>{student.institutionName || "-"}</TableCell><TableCell className="font-semibold">{student.averageScore === null ? "No scores" : `${student.averageScore}%`}</TableCell><TableCell>{student.attempts}</TableCell><TableCell>{formatDate(student.lastActivityAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
		</div>
	)
}
