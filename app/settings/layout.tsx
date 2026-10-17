import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4 w-full fixed bg-white z-10">
          <SidebarTrigger className="-ml-1 " /> {/* Optional trigger for mobile/collapsible view */}
          {/* ... other header content */}
        </header>
        <main className="p-4 flex justify-center w-full m-auto">
          <Toaster />
          {children}
        </main>
        </SidebarInset>
    </SidebarProvider>
  )
}
