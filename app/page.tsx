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
      <main className="min-h-screen flex flex-col items-center justify-start p-4 ">
      <div className="flex-1 w-full flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center">
        <div className="flex-1 w-full flex flex-col  max-w-5xl">
          <Hero />
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-6 md:gap-8 py-8 sm:py-12 md:py-16">
          <p>By Iven Nyam Jia Yang</p> <img src="https://avatars.githubusercontent.com/u/178879836?s=400&u=411df684b9c4f98831da4ef086c6e5b5a25e8abf&v=4" alt="Logo" width={100} height={100} />
        </footer>
      </div>
    </main>
  );
}
