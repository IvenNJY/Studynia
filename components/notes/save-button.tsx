"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function SaveNoteButton() {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleSaving = () => setIsSaving(true);
    const handleSaved = () => setIsSaving(false);
    
    window.addEventListener('note-saving', handleSaving);
    window.addEventListener('note-saved', handleSaved);
    
    return () => {
      window.removeEventListener('note-saving', handleSaving);
      window.removeEventListener('note-saved', handleSaved);
    };
  }, []);

  return (
    <Button 
      variant="ghost" 
      onClick={() => window.dispatchEvent(new Event('save-note'))}
      disabled={isSaving}
    >
      <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : ""}
    </Button>
  );
}