"use server"

import { createClient } from "@/lib/server"

export async function shareNoteWithEmail(noteId: string, email: string, permissionLevel: 'read' | 'edit') {
  const supabase = await createClient()

  // Use the admin client to securely query auth.users from the server
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminAuthClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch the userID via admin service role bypassing RLS
  const { data: usersData, error: adminError } = await adminAuthClient.auth.admin.listUsers();
  const targetUser = usersData?.users.find(u => u.email === email);
  let targetUserId = targetUser?.id;

  
  if (!targetUserId) {
    return { error: `User with email ${email} not found.` }
  }

  // 2. Check if already shared
  const { data: existingShare } = await supabase
    .from('note_shares')
    .select('id')
    .eq('note_id', noteId)
    .eq('shared_with_id', targetUserId)
    .single()

  if (existingShare) {
    // Update existing share
    const { error: updateError } = await supabase
      .from('note_shares')
      .update({ permission_level: permissionLevel })
      .eq('id', existingShare.id)
    
    if (updateError) return { error: updateError.message }
    return { success: true, message: "Updated existing share permissions." }
  }

  // 3. Add new share
  const { error: insertError } = await supabase
    .from('note_shares')
    .insert({
      note_id: noteId,
      shared_with_id: targetUserId,
      permission_level: permissionLevel
    })

  if (insertError) return { error: insertError.message }
  return { success: true, message: "Note shared successfully." }
}

export async function removeNoteShare(shareId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('note_shares').delete().eq('id', shareId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateNoteSharePermission(shareId: string, newPermission: 'read' | 'edit') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('note_shares')
    .update({ permission_level: newPermission })
    .eq('id', shareId)
  
  if (error) return { error: error.message }
  return { success: true }
}
