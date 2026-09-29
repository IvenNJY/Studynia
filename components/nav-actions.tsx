"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  FileText,
  GalleryVerticalEnd,
  LineChart,
  Link,
  MoreHorizontal,
  Settings2,
  Star,
  Trash,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const data = [
  [
    {
      label: "Copy Link",
      icon: Link,
    },
    {
      label: "Duplicate",
      icon: Copy,
    },
    {
      label: "Move to",
      icon: CornerUpRight,
    },
    {
      label: "Move to Trash",
      icon: Trash2,
    },
  ],
  [
    {
      label: "Undo",
      icon: CornerUpLeft,
    },
    {
      label: "View analytics",
      icon: LineChart,
    },
    {
      label: "Version History",
      icon: GalleryVerticalEnd,
    },
    {
      label: "Notifications",
      icon: Bell,
    },
  ],
]

export function NavActions({ noteId }: { noteId: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showTrashDialog, setShowTrashDialog] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)
  const router = useRouter()

  const handleAction = (label: string) => {
    if (label === "Copy Link") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
      setTimeout(() => setIsOpen(false), 100)
    } else if (label === "Move to Trash") {
      setShowTrashDialog(true)
      setIsOpen(false)
    }
  }

  const handleMoveToTrash = async () => {
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/notes/${noteId}/archive`, {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Failed to move note to trash")
      }
      toast.success("Note moved to trash")
      setShowTrashDialog(false)
      setTimeout(() => {
        router.push("/home")
      }, 500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move note to trash")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden font-medium text-muted-foreground md:inline-block">
        Edit Oct 08
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Star />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 data-[state=open]:bg-accent"
            >
              <MoreHorizontal />
            </Button>
          }
        />
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton onClick={() => handleAction(item.label)}>
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>

      {/* Confirmation Dialog for Move to Trash */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Note to Trash?</DialogTitle>
            <DialogDescription>
              This note will be moved to trash and can be restored from there for 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTrashDialog(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMoveToTrash}
              disabled={isArchiving}
            >
              {isArchiving ? "Moving..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
