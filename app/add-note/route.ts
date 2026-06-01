import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Insert a new untitled note
  const { data: newNote, error } = await supabase
    .from('notes')
    .insert([
      { 
        owner_id: user.id,
        title: 'Untitled Note',
        content: {}
      }
    ])
    .select('id')
    .single()

  if (error || !newNote) {
    console.error('Error creating new note:', error)
    // fallback redirect
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Redirect the user to the newly created note editor
  return NextResponse.redirect(new URL(`/notes/${newNote.id}`, request.url))
}
