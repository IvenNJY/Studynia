import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'
import EditorWrapper from '@/components/notes/editor-wrapper'

export default async function ProtectedPage(props: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()

  const params = await props.params;
  const noteId = params.id;

  const { data: note } = await supabase.from('notes').select('owner_id').eq('id', noteId).single()
  
  let canEdit = note?.owner_id === user?.id
  
  if (!canEdit && user) {
    const { data: share } = await supabase.from('note_shares').select('permission_level').eq('note_id', noteId).eq('shared_with_id', user.id).single()
    if (share?.permission_level === 'edit') {
      canEdit = true
    } else if (!share) {
      // Not shared and not owner
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 pt-4 md:pt-8">
      <EditorWrapper noteId={noteId} canEdit={canEdit} />
    </div>
  )
}
