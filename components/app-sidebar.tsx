"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo/logo";
import { NavItem, NavMain } from "@/components/nav-main";
import { AlignStartVertical, PieChart, CircleUserRound, ClipboardList, Notebook, User, NotepadText, Table, Languages, Ticket, Trash, FileQuestionMark, CircleQuestionMarkIcon, Folders, Plus, BarChart3, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/client";

const supabase = createClient();
import type { Role } from "@/lib/authorization";

export const navData: NavItem[] = [
  // These links are hidden for other roles, but their pages must still use requireRole.
  { label: "Administration", isSection: true, requiredRoles: ["admin"] },
  { title: "Admin", icon: User, href: "/admin", requiredRoles: ["admin"] },

  // Dashboards Section
  { label: "Dashboards", isSection: true },
  { title: "Performance Analytics", icon: PieChart, href: "/home" },
  { title: "Resource Management", icon: ClipboardList, href: "/resources" },
  { title: "Supervisor Review", icon: BarChart3, href: "/students", requiredRoles: ["supervisor"] },
  { title: "Chat", icon: MessageCircle, href: "/chat" },

  // Pages Section
  { label: "Practice", isSection: true },
  { title: "Assesment Centre", icon: ClipboardList, href: "/practice" },

  // Apps Section
  { label: "Studio", isSection: true },
  { title: "Folder", icon: Folders,children: [
    { title: "OPERATING SYSTEMS...", href: "http://localhost:3000/folders/101ae106-3caa-47b2-916d-b5992a25a103" },
    { title: "INDIVIDUAL PROJECT PREPARATION", href: "http://localhost:3000/folders/960a30a2-b99b-4e89-a9b9-17574dc9aece" },
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

  { label: "Info", isSection: true },
  { title: "Account", icon: User, href: "/settings" },
  { title: "Trash", icon: Trash, href: "/trash" },
  { title: "FAQ", icon: CircleQuestionMarkIcon, href: "#" },


];

function canSeeItem(item: NavItem, role: Role | null) {
  return !item.requiredRoles || (role !== null && item.requiredRoles.includes(role));
}

function filterNavItems(items: NavItem[], role: Role | null): NavItem[] {
  return items.reduce<NavItem[]>((visibleItems, item) => {
    if (!canSeeItem(item, role)) return visibleItems;

    const children = item.children
      ? filterNavItems(item.children, role)
      : undefined;

    if (item.children && children?.length === 0) return visibleItems;

    visibleItems.push({ ...item, children });
    return visibleItems;
  }, []);
}

export function AppSidebar() {
  const [navItems, setNavItems] = useState<NavItem[]>(navData);
  const [role, setRole] = useState<Role | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function fetchNotes() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = profile?.role as Role | null;
      if (cancelled) return;
      setRole(userRole);

      const loadUnreadCount = async () => {
        const response = await fetch("/api/chat", { cache: "no-store" });
        if (response.ok && !cancelled) {
          const data = await response.json();
          setUnreadCount(data.unreadCount ?? 0);
        }
      };
      await loadUnreadCount();
      if (cancelled) return;

      channel = supabase
        .channel(`chat-notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `sender_id=neq.${user.id}` },
          () => { void loadUnreadCount() },
        )
        .subscribe();

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
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const displayedNavItems = navItems.map((item) =>
    item.title === "Chat" ? { ...item, badge: unreadCount } : item
  );

  return (
    <Sidebar className="px-0 h-full [&_[data-slot=sidebar-inner]]:h-full">
      <div className="flex flex-col gap-6">
        {/* ---------------- Header ---------------- */}
        <SidebarHeader className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex w-full items-center justify-between gap-2">
              <a href="/home" className="flex h-full items-center gap-2">
                <img src="/logo 1.png" alt="Logo" className="w-10 h-10" /> 
                <span>StudyNia</span>
              </a>
              <a href="/chat" aria-label={`Chat${unreadCount ? `, ${unreadCount} unread messages` : ""}`} className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MessageCircle className="h-4 w-4" />
                {!!unreadCount && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] font-semibold text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </a>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ---------------- Content ---------------- */}
        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="px-4">
              <NavMain items={filterNavItems(displayedNavItems, role)} />
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
