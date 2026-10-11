"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Assignment = { id: string; title: string; due_date: string | null; points_possible: number | null; source: string }

export function AssignmentTable() {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    fetch("/api/assignments", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .catch((error: unknown) => console.error("Failed to load assignments:", error))
  }, [])

  return (
    <Card className="mt-6 border-muted/50 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Assignments due</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Assignment</TableHead><TableHead>Due</TableHead><TableHead>Points</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
          <TableBody>
            {assignments.length === 0
              ? <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No assignments synced yet.</TableCell></TableRow>
              : assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}</TableCell>
                  <TableCell>{assignment.points_possible ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{assignment.source === "lms" ? "LMS" : "Added by you"}</Badge></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
