"use client";

import * as React from "react";
import { Users, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface OwnershipChartProps {
  humanPercent: number;
  agentPercent: number;
  sharedPercent: number;
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
  className?: string;
}

export function OwnershipChart({
  humanPercent,
  agentPercent,
  sharedPercent,
  size = "md",
  showLegend = true,
  className,
}: OwnershipChartProps) {
  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32",
    lg: "h-40 w-40",
  };

  const strokeWidth = size === "sm" ? 8 : size === "md" ? 10 : 12;
  const radius = size === "sm" ? 40 : size === "md" ? 54 : 68;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash arrays for each segment
  const humanDash = (humanPercent / 100) * circumference;
  const agentDash = (agentPercent / 100) * circumference;
  const sharedDash = (sharedPercent / 100) * circumference;

  // Calculate offsets
  const humanOffset = 0;
  const agentOffset = -humanDash;
  const sharedOffset = -(humanDash + agentDash);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* Human segment (blue) */}
          {humanPercent > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${humanDash} ${circumference}`}
              strokeDashoffset={humanOffset}
              strokeLinecap="round"
            />
          )}
          {/* Agent segment (orange) */}
          {agentPercent > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth={strokeWidth}
              strokeDasharray={`${agentDash} ${circumference}`}
              strokeDashoffset={agentOffset}
              strokeLinecap="round"
            />
          )}
          {/* Shared segment (purple) */}
          {sharedPercent > 0 && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${sharedDash} ${circumference}`}
              strokeDashoffset={sharedOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={cn("font-bold", size === "sm" ? "text-lg" : "text-2xl")}>
              {agentPercent}%
            </span>
            <span className="block text-xs text-muted-foreground">AI</span>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Human: {humanPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Agent: {agentPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">Shared: {sharedPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
