"use client"

import { useEffect, useState } from "react"
import { File, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Material = {
  id: string
  title: string
  file_url: string | null
  source: string
  course_id: string | null
  updated_at: string
}

export function AllMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    fetch("/api/materials", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setMaterials(Array.isArray(data) ? data : []))
      .catch((error: unknown) => console.error("Failed to load materials:", error))
  }, [])

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Materials</h2>
        <span className="text-sm text-muted-foreground">Showing {materials.length} items</span>
      </div>
      <Card className="shadow-sm border-muted/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>SOURCE</TableHead>
              <TableHead>COURSE</TableHead>
              <TableHead>LAST MODIFIED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No materials saved yet.</TableCell></TableRow>
            ) : materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">
                  {material.file_url ? (
                    <a href={material.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary">
                      <File className="h-4 w-4 text-blue-500" />{material.title}<ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : material.title}
                </TableCell>
                <TableCell><Badge variant="secondary">{material.source === "lms" ? "LMS" : "User added"}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{material.course_id || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(material.updated_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
