"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import "@blocknote/shadcn/style.css";

export default function EditorLoader({ noteId, canEdit = true }: { noteId: string, canEdit?: boolean }) {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.from("notes").select("*").eq("id", noteId).single().then(({ data }) => {
      if (data) setData(data);
    });
  }, [noteId]);

  if (!data) return <div className="text-center mt-20 text-muted-foreground animate-pulse">Loading editor...</div>;

  return <Editor noteId={noteId} initialTitle={data.title} initialContent={data.content} canEdit={canEdit} />;
}

function Editor({ noteId, initialTitle, initialContent, canEdit }: { noteId: string, initialTitle: string, initialContent: any, canEdit: boolean }) {
  const [title, setTitle] = useState(initialTitle || "Untitled Note");
  const [isSaving, setIsSaving] = useState(false);
  const isRemoteUpdate = useRef(false);
  const supabase = createClient();
  const { resolvedTheme } = useTheme();

  // Creates a new editor instance.
  let parsedContent = undefined;
  if (initialContent) {
    parsedContent = typeof initialContent === 'string' ? JSON.parse(initialContent) : initialContent;
    if (Object.keys(parsedContent).length === 0) parsedContent = undefined;
  }

  const editor = useCreateBlockNote({
    initialContent: parsedContent
  });

  useEffect(() => {
    if (!canEdit) return;

    // Supabase RealTime channel
    const channel = supabase.channel(`note-${noteId}`);

    channel
      .on('broadcast', { event: 'note-update' }, (payload) => {
        if (payload.payload.content) {
          isRemoteUpdate.current = true;
          editor.replaceBlocks(editor.document, payload.payload.content);
          
          // Reset after blocknote resolves its internal replacements to prevent feedback loops
          setTimeout(() => {
            isRemoteUpdate.current = false;
          }, 50);
        }
        if (payload.payload.title) {
          setTitle(payload.payload.title);
        }
      })
      .on('broadcast', { event: 'request-state' }, () => {
        // When a new user connects, send them our latest active state
        channel.send({
          type: 'broadcast',
          event: 'note-update',
          payload: { content: editor.document, title: title },
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // New connection asks for un-saved editor state instead of relying on the DB snapshot
          channel.send({
            type: 'broadcast',
            event: 'request-state',
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [editor, noteId, canEdit, title]);

  const handleContentChange = () => {
    if (!canEdit || isRemoteUpdate.current) return;
    const currentDoc = editor.document;
    supabase.channel(`note-${noteId}`).send({
      type: 'broadcast',
      event: 'note-update',
      payload: { content: currentDoc },
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    supabase.channel(`note-${noteId}`).send({
      type: 'broadcast',
      event: 'note-update',
      payload: { title: newTitle },
    });
  };

  const handleSave = useCallback(async () => {
    if (!editor || !canEdit) return;
    setIsSaving(true);
    window.dispatchEvent(new Event('note-saving'));
    const content = editor.document;
    await supabase.from("notes").update({ title, content }).eq("id", noteId);
    window.dispatchEvent(new Event('note-saved'));
    setIsSaving(false);
  }, [editor, title, noteId, canEdit]);

  useEffect(() => {
    if (!canEdit) return;
    
    const handleCustomSave = () => handleSave();
    window.addEventListener('save-note', handleCustomSave);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('save-note', handleCustomSave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave, canEdit]);

  // Renders the editor instance using a React component.
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-6 md:px-14">
        <input 
          type="text" 
          value={title} 
          disabled={!canEdit}
          onChange={handleTitleChange}
          className="text-4xl w-full font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground disabled:opacity-80"
          placeholder="Note Title"
        />
      </div>
      <BlockNoteView
        editor={editor}
        editable={canEdit}        onChange={handleContentChange}        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
}