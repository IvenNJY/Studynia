import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1 " /> {/* Optional trigger for mobile/collapsible view */}
          {/* ... other header content */}
        </header>
        <main className="p-4 md:p-6 lg:p-8 flex justify-center w-full">
          {children}
        </main>
        </SidebarInset>
    </SidebarProvider>
  )
}