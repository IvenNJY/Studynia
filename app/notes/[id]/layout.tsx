import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NavActions } from "@/components/nav-actions"
import { SaveNoteButton } from "@/components/notes/save-button"
import { ShareButton } from "@/components/notes/share-button"
import { createClient } from "@/lib/server"
import { Toaster } from "@/components/ui/sonner"

export default async function Layout(props: { children: React.ReactNode, params: Promise<{ id: string }> | { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const params = await props.params;
  const noteId = params.id;

  // 1. Fetch note ownership
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id')
    .eq('id', noteId)
    .single();

  // 2. Fetch specific share permission if not owner
  let permission_level = 'none';
  if (note?.owner_id === user?.id) {
    permission_level = 'owner';
  } else if (user) {
    const { data: shared } = await supabase
      .from('note_shares')
      .select('permission_level')
      .eq('note_id', noteId)
      .eq('shared_with_id', user.id)
      .single();
    
    if (shared) {
      permission_level = shared.permission_level;
    }
  }

  // Determine if they can edit
  const canEdit = permission_level === 'owner' || permission_level === 'edit';

  return (
    <SidebarProvider>
      <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 w-full sticky top-0 bg-background z-10 w-full flex-row">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 " /> {/* Optional trigger for mobile/collapsible view */}
            {permission_level === 'read' && (
               <span className="text-xs border border-muted bg-muted px-2 py-1 rounded-md ml-2 text-muted-foreground font-semibold">View Only</span>
            )}
            {permission_level === 'owner' && (
               <span className="text-xs border border-primary/20 bg-primary/10 px-2 py-1 rounded-md ml-2 text-primary font-semibold">Owner</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(permission_level === 'owner' || canEdit) && (
              <ShareButton noteId={noteId} isOwner={permission_level === 'owner'} />
            )}
            {canEdit && <SaveNoteButton />}
            <NavActions noteId={noteId} canEdit={canEdit} />
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 flex justify-center w-full">
          <Toaster position="top-center" />
          {props.children}
        </main>
        </SidebarInset>
    </SidebarProvider>
  )
}
