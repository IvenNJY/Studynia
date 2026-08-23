"use client"

import React, { useState } from "react"
import { Trash2, RotateCcw, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data representing deleted notes
const initialTrashItems = [
  {
    id: "note-1",
    title: "Intro to Neural Networks",
    excerpt: "Basic concepts of perceptrons, hidden layers, and backpropagation...",
    daysAgo: 2, // Deleted 2 days ago
  },
  {
    id: "note-2",
    title: "Q3 Project Brainstorming",
    excerpt: "List of possible topics for the final capstone project...",
    daysAgo: 15,
  },
  {
    id: "note-3",
    title: "Study Guide: Calculus II",
    excerpt: "Integration by parts, partial fractions, and trigonometric integrals...",
    daysAgo: 28, // Almost permanently deleted
  },
]

export function TrashCard() {
  const [trashItems, setTrashItems] = useState(initialTrashItems)

  const handleRestore = (id: string) => {
    // In a real app, you would make an API call here to update the database
    setTrashItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handlePermanentDelete = (id: string) => {
    setTrashItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleEmptyTrash = () => {
    setTrashItems([])
  }

  return (
    <Card className="min-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
        <div className="space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
            <Trash2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Trash</CardTitle>
          <p className="text-sm text-muted-foreground">
            Items in the trash are permanently deleted after 30 days.
          </p>
        </div>
        
        {trashItems.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleEmptyTrash}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          >
            Empty Trash
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {trashItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border bg-muted/10">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Your trash is empty</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Any notes or files you delete will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashItems.map((item) => {
              const daysRemaining = 30 - item.daysAgo
              const isUrgent = daysRemaining <= 3 // Highlight items about to expire

              return (
                <div 
                  key={item.id} 
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40"
                >
                  <div className="flex items-start gap-4 overflow-hidden">
                    <div className="mt-1 rounded-lg bg-background p-2 shadow-sm border border-border/50 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 truncate">
                      <h4 className="font-semibold text-foreground truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.excerpt}
                      </p>
                      
                      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-2 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isUrgent && <AlertCircle className="h-3 w-3" />}
                        <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      className="text-primary hover:bg-primary/10 hover:text-primary font-medium"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePermanentDelete(item.id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete permanently</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}