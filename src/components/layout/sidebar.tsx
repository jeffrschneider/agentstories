"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutTemplate,
  Home,
  Settings,
  HelpCircle,
  Building2,
  Users,
  Lightbulb,
  Bot,
  Kanban,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUI, uiActions } from "@/stores";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { title: "Overview", href: "/", icon: Home },
  { title: "Organization", href: "/organization", icon: Building2 },
  { title: "Agent Catalog", href: "/agents", icon: Bot },
  { title: "Agent Pipeline", href: "/pipeline", icon: Kanban },
  { title: "Human-Agent Pairs", href: "/haps", icon: Users },
  { title: "Agent Stories", href: "/stories", icon: FileText },
  { title: "Capability Queue", href: "/capability-queue", icon: Lightbulb },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
];

const bottomNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const ui = useUI();
  const isCollapsed = ui.sidebar.isCollapsed;

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href));

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          isCollapsed ? "justify-center" : "gap-3",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 z-40 flex h-[calc(100vh-3.5rem)] flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-14" : "w-48",
        className
      )}
    >
      <div className={cn("flex items-center border-b py-2", isCollapsed ? "justify-center px-2" : "justify-end px-3")}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => uiActions.collapseSidebar()}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {isCollapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t py-4">
        <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
