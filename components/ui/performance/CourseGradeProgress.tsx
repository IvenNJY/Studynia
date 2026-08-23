import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const courses = [
  { name: "Operating Systems", progress: 10 },
  { name: "Data Structures & Algorithms", progress: 20 },
  { name: "Psychology", progress: 90 },
]

export function CourseGradeProgress({ courses }: { 
  courses: Array<{ name: string, progress: number }> 
}) {
  return (
    <Card className="shadow-none border-border/50 border bg-muted/30 sm:p-2 h-full flex flex-col">
      <CardHeader className="pb-6">
        <CardTitle className="text-[1.1rem] font-medium text-foreground">Course Grade Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
        {courses.map((course) => (
          <div key={course.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">{course.name}</span>
              <span className="font-bold text-primary">{course.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}