import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export function GpaProgression({ selectedSemester, onSelectSemester, currentGpa }: { 
  selectedSemester: string; 
  onSelectSemester: (sem: string) => void;
  currentGpa: number;
}) {
  const chartData = [
    { name: "SEM 1", value: 60 },
    { name: "SEM 2", value: 75 },
    { name: "SEM 3", value: 85 },
    { name: "SEM 4", value: 100 },
  ]

  return (
    <Card className="shadow-none border-border/50 bg-card">
      <CardHeader className="flex flex-row items-start justify-between pb-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">GPA Progression</CardTitle>
          <p className="text-sm text-muted-foreground">Year-over-year cumulative performance</p>
        </div>
        <div className="flex items-center gap-1 font-bold text-2xl text-foreground transition-all">
          {currentGpa.toFixed(2)} <TrendingUp className="h-5 w-5 text-chart-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-between pt-4 pb-0">
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