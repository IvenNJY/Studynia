import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GpaProgression({ selectedSemester, onSelectSemester, currentGpa, semesters, onSaved, onDeleted }: { 
  selectedSemester: string; 
  onSelectSemester: (sem: string) => void;
  currentGpa: number | null;
  semesters: Array<{ id: string; semester: string; semester_order: number; gpa: number | null }>;
  onSaved: (semester: { id: string; semester: string; semester_order: number; gpa: number | null }) => void;
  onDeleted: (semesterId: string) => void;
}) {
  const [semesterName, setSemesterName] = useState("")
  const [gpaValue, setGpaValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const selected = semesters.find((semester) => semester.semester === selectedSemester)
    setSemesterName(selected?.semester ?? "")
    setGpaValue(selected?.gpa === null || selected?.gpa === undefined ? "" : String(selected.gpa))
  }, [selectedSemester, semesters])

  const saveGpa = async () => {
    const semester = semesterName.trim()
    const gpa = Number(gpaValue)
    if (!semester || !Number.isFinite(gpa) || gpa < 0 || gpa > 4) {
      setSaveError("Enter a semester name and a GPA between 0.00 and 4.00.")
      return
    }

    const existing = semesters.find((item) => item.semester === semester)
    setSaving(true)
    setSaveError(null)
    try {
      const response = await fetch("/api/analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semester,
          semester_order: existing?.semester_order ?? Math.max(0, ...semesters.map((item) => item.semester_order)) + 1,
          gpa: Number(gpa.toFixed(2)),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to save GPA")
      onSaved(payload)
      onSelectSemester(payload.semester)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save GPA")
    } finally {
      setSaving(false)
    }
  }

  const deleteGpa = async () => {
    const selected = semesters.find((item) => item.semester === selectedSemester)
    if (!selected) return

    setSaving(true)
    setSaveError(null)

    try {
      const response = await fetch("/api/analytics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to delete GPA")

      onDeleted(selected.id)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to delete GPA")
    } finally {
      setSaving(false)
    }
  }

  const chartData = semesters.map((semester) => ({
    name: semester.semester,
    value: semester.gpa === null ? 0 : Math.min(100, Math.round((semester.gpa / 4) * 100)),
  }))

  return (
    <Card className="shadow-none border-border/50 bg-card">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">GPA Progression</CardTitle>
          <p className="text-sm text-muted-foreground">Year-over-year cumulative performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-bold text-2xl text-foreground transition-all">
            {currentGpa === null ? "Not set" : currentGpa.toFixed(2)} <TrendingUp className="h-5 w-5 text-chart-2" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing((editing) => !editing)
              setSaveError(null)
            }}
            aria-expanded={isEditing}
          >
            {isEditing ? "Close" : currentGpa === null ? <><Plus className="mr-1 h-4 w-4" />Add</> : <><Pencil className="mr-1 h-4 w-4" />Edit</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && currentGpa === null && (
          <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            Add your GPA for this semester to complete your progression.
          </p>
        )}
        {isEditing && <div className="mb-4 rounded-lg border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4 text-primary" />
            Add or update semester GPA
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={semesterName}
              onChange={(event) => setSemesterName(event.target.value)}
              placeholder="Semester (e.g. Fall 2026)"
              className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <input
              value={gpaValue}
              onChange={(event) => setGpaValue(event.target.value)}
              placeholder="GPA (0.00 - 4.00)"
              inputMode="decimal"
              min="0"
              max="4"
              step="0.01"
              type="number"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-36"
            />
            <Button type="button" size="sm" onClick={saveGpa} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save GPA
            </Button>
            {semesters.some((item) => item.semester === selectedSemester) && (
              <Button type="button" size="sm" variant="destructive" onClick={deleteGpa} disabled={saving}>
                Delete
              </Button>
            )}
          </div>
          {saveError && <p className="mt-2 text-xs text-destructive">{saveError}</p>}
        </div>}
        <div className="h-[160px] flex items-end justify-between pt-2 pb-0">
          {chartData.map((data, i) => {
            const isActive = data.name === selectedSemester;
            return (
              <div 
                key={i} 
                onClick={() => onSelectSemester(data.name)}
                className="flex flex-col items-center justify-end h-full flex-1 group cursor-pointer"
              >
                <div 
                  className={`w-full transition-all duration-300 ${isActive ? 'bg-primary' : 'bg-muted group-hover:bg-primary/50'}`}
                  style={{ height: `${data.value}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between w-full mt-3">
          {chartData.map((data, i) => (
            <span 
              key={i} 
              onClick={() => onSelectSemester(data.name)}
              className={`flex-1 text-center text-[10px] sm:text-xs font-semibold uppercase cursor-pointer transition-colors ${data.name === selectedSemester ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {data.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}