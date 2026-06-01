"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/client";
import { Hero } from "@/components/hero";

export default function Home() {
  const [status, setStatus] = useState<string>("");

  const handleInsert = async () => {
    setStatus("Inserting...");
    const supabase = createClient();
    
    // Replace 'your_table_name' and the data object with your actual table and data
    const { data, error } = await supabase
      .from('Test')
      .insert([
        { name: 'some_value' }
      ]);

    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus("Successfully inserted!");
    }
  };

  return (
      <main className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24">
      <div className="flex-1 w-full flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center">
        <div className="flex-1 w-full flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-20 max-w-5xl p-3 sm:p-4 md:p-5">
          <Hero />
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-6 md:gap-8 py-8 sm:py-12 md:py-16">
        </footer>
      </div>
    </main>
  );
}
