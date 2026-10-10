import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider><AppSidebar /><SidebarInset><header className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background px-4"><SidebarTrigger className="-ml-1" /></header><main className="flex w-full justify-center p-4 md:p-6 lg:p-8">{children}</main></SidebarInset></SidebarProvider>
}
