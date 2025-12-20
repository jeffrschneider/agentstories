"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border rounded-lg", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div>
          <div className="font-medium text-sm">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t p-3 space-y-3">{children}</div>
      )}
    </div>
  );
}

interface CollapsibleAdvancedProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleAdvanced({
  children,
  className,
}: CollapsibleAdvancedProps) {
  return (
    <Collapsible
      title="Advanced Options"
      description="Additional configuration options"
      defaultOpen={false}
      className={cn("bg-muted/30", className)}
    >
      {children}
    </Collapsible>
  );
}
