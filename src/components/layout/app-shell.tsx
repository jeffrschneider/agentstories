"use client";

import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  hideSidebar?: boolean;
}

export function AppShell({ children, className, hideSidebar = false }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {!hideSidebar && <Sidebar className="hidden md:flex" />}
        <main
          className={cn(
            "flex-1 overflow-auto",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
