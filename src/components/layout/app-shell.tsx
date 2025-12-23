"use client";

import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useUI } from "@/stores";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  hideSidebar?: boolean;
}

export function AppShell({ children, className, hideSidebar = false }: AppShellProps) {
  const ui = useUI();
  const isCollapsed = ui.sidebar.isCollapsed;

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {!hideSidebar && <Sidebar className="hidden md:flex" />}
        <main
          className={cn(
            "flex-1 overflow-auto",
            !hideSidebar && (isCollapsed ? "md:ml-14" : "md:ml-48"),
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
