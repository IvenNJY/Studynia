"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo/logo";
import { NavItem, NavMain } from "@/components/nav-main";
import { AlignStartVertical, PieChart, CircleUserRound, ClipboardList, Notebook, User, NotepadText, Table, Languages, Ticket, Trash, FileQuestionMark, CircleQuestionMarkIcon, Folders, Plus } from "lucide-react";
import { createClient } from "@/lib/client";

export const navData: NavItem[] = [
  // Dashboards Section
  { label: "Dashboards", isSection: true },
  { title: "Performance Analytics", icon: PieChart, href: "/home" },
  { title: "Resource Management", icon: ClipboardList, href: "/resources" },

  // Pages Section
  { label: "Practice", isSection: true },
  { title: "Assesment Centre", icon: ClipboardList, href: "/practice" },
  { title: "Assignments", icon: Table, href: "#" },

  // Apps Section
  { label: "Studio", isSection: true },
  { title: "Folder", icon: Folders,children: [
    { title: "Folder View", href: "#" },
    { title: "Folder View", href: "#" },
  ]},
  {
    title: "Notes",
    icon: Notebook,
    action: {
      icon: Plus,
      href: "/add-note"
    },
    children: [], // will be populated dynamically
  },

  { label: "Help", isSection: true },
  { title: "Account", icon: User, href: "/settings" },
  { title: "Trash", icon: Trash, href: "#" },
  { title: "FAQ", icon: CircleQuestionMarkIcon, href: "#" }
];

export function AppSidebar() {
  const [navItems, setNavItems] = useState<NavItem[]>(navData);

  useEffect(() => {
    async function fetchNotes() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: notes, error } = await supabase
        .from("notes")
        .select("id, title")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        return;
      }

      if (!notes) return;

      setNavItems((prev) => {
        return prev.map((item) => {
          if (item.title === "Notes") {
            return {
              ...item,
              children: notes.map((note) => ({
                id: note.id,
                title: note.title || "Untitled Note",
                href: `/notes/${note.id}`,
              })),
            };
          }
          return item;
        });
      });
    }

    fetchNotes();
  }, []);

  return (
    <Sidebar className="px-0 h-full [&_[data-slot=sidebar-inner]]:h-full">
      <div className="flex flex-col gap-6">
        {/* ---------------- Header ---------------- */}
        <SidebarHeader className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="#" className="w-full h-full">
                Logo
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ---------------- Content ---------------- */}
        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="px-4">
              <NavMain items={navItems} />
            </div>
            {/* card */}
            {/* <div className="pt-5 px-4">
              <Card className="shadow-none ring-0 bg-secondary px-4 py-6">
                <CardContent className="p-0 flex flex-col gap-3 items-center">
                  <img
                    src="https://images.shadcnspace.com/assets/backgrounds/download-img.png"
                    alt="sidebar-img"
                    width={74}
                    height={74}
                    className="h-20 w-20"
                  />
                  <div className="flex flex-col gap-4 items-center">
                    <div>
                      <p className="text-base font-semibold text-card-foreground text-center">
                        Grab Pro Now
                      </p>
                      <p className="text-sm font-regular text-muted-foreground text-center">
                        Customize your admin
                      </p>
                    </div>
                    <Button className="w-fit h-9 px-4 py-2 shadow-none cursor-pointer rounded-xl">
                      Get Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </ScrollArea>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
