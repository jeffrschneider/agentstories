"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  color?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const colorClasses = {
  default: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-yellow-500",
  danger: "stroke-red-500",
};

export function ProgressRing({
  progress,
  size = "md",
  strokeWidth,
  showLabel = true,
  label,
  color = "default",
  className,
}: ProgressRingProps) {
  const sizeConfig = {
    sm: { dimension: 48, stroke: 4, textSize: "text-xs" },
    md: { dimension: 64, stroke: 6, textSize: "text-sm" },
    lg: { dimension: 96, stroke: 8, textSize: "text-lg" },
  };

  const config = sizeConfig[size];
  const finalStroke = strokeWidth ?? config.stroke;
  const radius = (config.dimension - finalStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Determine color based on progress if using default
  const getAutoColor = () => {
    if (color !== "default") return colorClasses[color];
    if (progress >= 80) return "stroke-green-500";
    if (progress >= 50) return "stroke-blue-500";
    if (progress >= 25) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg
        width={config.dimension}
        height={config.dimension}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={finalStroke}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={finalStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", getAutoColor())}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-semibold", config.textSize)}>
            {label ?? `${Math.round(progress)}%`}
          </span>
        </div>
      )}
    </div>
  );
}
