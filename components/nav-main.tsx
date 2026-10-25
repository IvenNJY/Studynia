"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/authorization";

export type NavItem = {
  id?: string;
  label?: string;
  isSection?: boolean;
  title?: string;
  icon?: LucideIcon;
  href?: string;
  children?: NavItem[];
  requiredRoles?: readonly Role[];
  action?: {
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
  };
  badge?: number;
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Helper to check if current pathname matches the item href
  const isMatch = React.useCallback((href?: string) => {
    if (!pathname || !href || href === "#") return false;
    const normalizedHref = href.startsWith("/") ? href : `/${href}`;
    return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
  }, [pathname]);

  const { initialParent, initialChild } = React.useMemo(() => {
    let parent: string | null = null;
    let child: string | null = null;
    
    for (const item of items) {
      if (isMatch(item.href)) {
        parent = item.id || item.title || null;
      }
      if (item.children) {
        for (const c of item.children) {
          if (isMatch(c.href)) {
            parent = item.id || item.title || null;
            child = c.id || c.title || null;
          }
        }
      }
    }
    return { initialParent: parent, initialChild: child };
  }, [items, isMatch]);

  const [activeParent, setActiveParent] = React.useState<string | null>(initialParent);
  const [activeChild, setActiveChild] = React.useState<string | null>(initialChild);

  React.useEffect(() => {
    setActiveParent(initialParent);
    setActiveChild(initialChild);
  }, [initialParent, initialChild]);

  return (
    <>
      {items.map((item, index) => (
        <NavMainItem
          key={item.id || item.title || item.label || index}
          item={item}
          activeParent={activeParent}
          setActiveParent={setActiveParent}
          activeChild={activeChild}
          setActiveChild={setActiveChild}
        />
      ))}
    </>
  );
}

function NavMainItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
}) {
  const hasChildren = !!item.children?.length;
  const isParentActive = activeParent === (item.id || item.title);
  const [isOpen, setIsOpen] = React.useState(isParentActive);

  // Sync open state when activeParent changes
  React.useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [isParentActive]);

  // Section label
  if (item.isSection && item.label) {
    return (
      <SidebarGroup className="p-0 pt-5 first:pt-0">
        <SidebarGroupLabel className="p-0 text-xs font-medium uppercase text-sidebar-foreground">
          {item.label}
        </SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  // Item with children → collapsible
  if (hasChildren && item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger
                className="w-full"
                render={
                  <SidebarMenuButton
                    id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    tooltip={item.title}
                    isActive={isParentActive}
                    onClick={() => item.id && setActiveParent(item.id)}
                    className={cn(
                      "rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer ",
                      isParentActive ? "bg-primary! text-primary-foreground!" : ""
                    )}
                  >
                    {item.icon && <item.icon size={16} />}
                    <span>{item.title}</span>
                    {!!item.badge && <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold text-primary-foreground">{item.badge > 99 ? "99+" : item.badge}</span>}
                    <ChevronRight
                      className={cn(
                        "ml-auto transition-transform duration-200",
                        isOpen && "rotate-90"
                      )}
                    />
                  </SidebarMenuButton>
                }
              />
              {item.action && (
                <SidebarMenuAction 
                  showOnHover={false}
                  onClick={item.action.onClick}
                  title="Add Note"
                >
                  {item.action.href ? (
                    <a href={item.action.href} className="w-full h-full flex flex-row items-center justify-center">
                      <item.action.icon size={16} />
                    </a>
                  ) : (
                    <item.action.icon size={16} />
                  )}
                </SidebarMenuAction>
              )}
              <CollapsibleContent>
                <SidebarMenuSub className="me-0 pe-0">
                  {item.children!.map((child, index) => (
                    <NavMainSubItem
                      key={child.id || `${child.title}-${index}`}
                      item={child}
                      activeParent={activeParent}
                      setActiveParent={setActiveParent}
                      activeChild={activeChild}
                      setActiveChild={setActiveChild}
                      parentTitle={item.id || item.title}
                    />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Item without children
  if (item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              tooltip={item.title}
              isActive={isParentActive}
              onClick={() => {
                setActiveParent(item.id || item.title!);
                setActiveChild(null);
              }}
              className={cn(
                "rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer",
                isParentActive ? "bg-primary! text-primary-foreground!" : ""
              )}
              render={<a href={item.href} />}
            >
              {item.icon && <item.icon />}
              {item.title}
              {!!item.badge && <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold text-primary-foreground">{item.badge > 99 ? "99+" : item.badge}</span>}
            </SidebarMenuButton>
            {item.action && (
              <SidebarMenuAction 
                onClick={item.action.onClick}
                title="Quick Action"
              >
                {item.action.href ? (
                  <a href={item.action.href} className="w-full h-full flex flex-row items-center justify-center">
                    <item.action.icon size={16} />
                  </a>
                ) : (
                  <item.action.icon size={16} />
                )}
              </SidebarMenuAction>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  if (item.isSection && item.label) {
    return <SidebarMenuSubItem className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><a href={item.href}>{item.label}</a></SidebarMenuSubItem>;
  }

  return null;
}

function NavMainSubItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
  parentTitle,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
  parentTitle?: string;
}) {
  const hasChildren = !!item.children?.length;
  const [isOpen, setIsOpen] = React.useState(false);
  const isFolderItem = parentTitle === "Folder";

  if (hasChildren && item.title) {
    return (
      <SidebarMenuSubItem>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            className="w-full"
            render={
              <SidebarMenuSubButton 
                id={`nav-sub-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-md text-sm font-medium px-3 py-2 h-9"
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </SidebarMenuSubButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub className="me-0 pe-0">
              {item.children!.map((child, index) => (
                <NavMainSubItem
                  key={child.id || `${child.title}-${index}`}
                  item={child}
                  activeParent={activeParent}
                  setActiveParent={setActiveParent}
                  activeChild={activeChild}
                  setActiveChild={setActiveChild}
                  parentTitle={parentTitle}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  if (item.title) {
    return (
      <SidebarMenuSubItem className="w-full">
        <SidebarMenuSubButton
          id={`nav-sub-button-${(item.id || item.title).toLowerCase().replace(/\s+/g, '-')}`}
          className={cn(
            "w-full min-w-0 rounded-md transition-colors",
            activeChild === (item.id || item.title) ? "bg-muted! text-foreground!" : ""
          )}
          isActive={activeChild === (item.id || item.title)}
          onClick={() => {
            setActiveParent(parentTitle || "");
            setActiveChild(item.id || item.title!);
          }}
          render={
            <a href={item.href} title={isFolderItem ? item.title : undefined} className="block w-full min-w-0">
              <span className={isFolderItem ? "block w-full truncate" : undefined}>{item.title}</span>
            </a>
          }
        />
      </SidebarMenuSubItem>
    );
  }

  if (item.isSection && item.label) {
    return (
    <SidebarMenuSubItem
        className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
    <a href={item.href} className="block">
    {item.label}
    </a>
    </SidebarMenuSubItem>
    );
  }

  return null;
}
