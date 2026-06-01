"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./editor"), { ssr: false });

export default function EditorWrapper({ noteId, canEdit = true }: { noteId: string; canEdit?: boolean }) {
  return <Editor noteId={noteId} canEdit={canEdit} />;
}
