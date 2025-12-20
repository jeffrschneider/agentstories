"use client";

import * as React from "react";
import { ArrowRight, Users, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface OwnershipBreakdown {
  human: number;
  agent: number;
  shared: number;
}

interface TransformationBarProps {
  asIs: OwnershipBreakdown;
  toBe: OwnershipBreakdown;
  showLabels?: boolean;
  showArrow?: boolean;
  className?: string;
}

function StackedBar({
  breakdown,
  label,
}: {
  breakdown: OwnershipBreakdown;
  label?: string;
}) {
  return (
    <div className="flex-1">
      {label && (
        <p className="text-xs text-muted-foreground mb-1 text-center">{label}</p>
      )}
      <div className="h-6 rounded-full overflow-hidden flex bg-muted">
        {breakdown.human > 0 && (
          <div
            className="bg-blue-500 flex items-center justify-center transition-all duration-500"
            style={{ width: `${breakdown.human}%` }}
          >
            {breakdown.human >= 15 && (
              <span className="text-xs text-white font-medium">{breakdown.human}%</span>
            )}
          </div>
        )}
        {breakdown.shared > 0 && (
          <div
            className="bg-purple-500 flex items-center justify-center transition-all duration-500"
            style={{ width: `${breakdown.shared}%` }}
          >
            {breakdown.shared >= 15 && (
              <span className="text-xs text-white font-medium">{breakdown.shared}%</span>
            )}
          </div>
        )}
        {breakdown.agent > 0 && (
          <div
            className="bg-orange-500 flex items-center justify-center transition-all duration-500"
            style={{ width: `${breakdown.agent}%` }}
          >
            {breakdown.agent >= 15 && (
              <span className="text-xs text-white font-medium">{breakdown.agent}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TransformationBar({
  asIs,
  toBe,
  showLabels = true,
  showArrow = true,
  className,
}: TransformationBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4">
        <StackedBar breakdown={asIs} label={showLabels ? "As-Is" : undefined} />
        {showArrow && (
          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
        <StackedBar breakdown={toBe} label={showLabels ? "To-Be" : undefined} />
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <Users className="h-3 w-3" />
          <span>Human</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Shared</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <Bot className="h-3 w-3" />
          <span>Agent</span>
        </div>
      </div>
    </div>
  );
}
