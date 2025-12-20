"use client";

import * as React from "react";
import {
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransitionStatus } from "@/lib/schemas/hap";

export interface TimelineEvent {
  id: string;
  date: string;
  status: TransitionStatus;
  title: string;
  description?: string;
  isCurrent?: boolean;
}

interface TransitionTimelineProps {
  events: TimelineEvent[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

const statusIcons: Record<TransitionStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Clock,
  planned: Target,
  in_progress: TrendingUp,
  blocked: AlertTriangle,
  completed: CheckCircle2,
};

const statusColors: Record<TransitionStatus, string> = {
  not_started: "bg-gray-400",
  planned: "bg-blue-500",
  in_progress: "bg-yellow-500",
  blocked: "bg-red-500",
  completed: "bg-green-500",
};

export function TransitionTimeline({
  events,
  orientation = "vertical",
  className,
}: TransitionTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No timeline events
      </div>
    );
  }

  if (orientation === "horizontal") {
    return (
      <div className={cn("overflow-x-auto", className)}>
        <div className="flex items-start min-w-max">
          {events.map((event, index) => {
            const Icon = statusIcons[event.status];
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex items-start">
                <div className="flex flex-col items-center">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white",
                      statusColors[event.status],
                      event.isCurrent && "ring-2 ring-offset-2 ring-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {/* Event Details */}
                  <div className="mt-2 text-center max-w-32">
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium mt-1">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Connector */}
                {!isLast && (
                  <div className="flex items-center h-10 px-2">
                    <div className="w-16 h-0.5 bg-muted" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground -ml-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation (default)
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const Icon = statusIcons[event.status];
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0",
                  statusColors[event.status],
                  event.isCurrent && "ring-2 ring-offset-2 ring-primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-0.5 h-full min-h-8 bg-muted my-1" />}
            </div>

            {/* Event content */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(event.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                {event.isCurrent && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs">
                    Current
                  </span>
                )}
              </div>
              <p className="font-medium mt-1">{event.title}</p>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to generate timeline from HAP data
export function generateHAPTimeline(
  hap: {
    transitionStatus: TransitionStatus;
    createdAt: string;
    updatedAt: string;
    targetCompletionDate?: string;
  },
  includeProjected = true
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const statusOrder: TransitionStatus[] = [
    "not_started",
    "planned",
    "in_progress",
    "completed",
  ];

  const currentIndex = statusOrder.indexOf(hap.transitionStatus);

  // Add creation event
  events.push({
    id: "created",
    date: hap.createdAt,
    status: "not_started",
    title: "HAP Created",
    description: "Human-Agent pair established",
    isCurrent: hap.transitionStatus === "not_started",
  });

  // Add past events based on current status
  if (currentIndex >= 1) {
    events.push({
      id: "planned",
      date: hap.createdAt, // Use creation date as placeholder
      status: "planned",
      title: "Transition Planned",
      description: "Tasks and timeline defined",
      isCurrent: hap.transitionStatus === "planned",
    });
  }

  if (currentIndex >= 2) {
    events.push({
      id: "in_progress",
      date: hap.updatedAt,
      status: "in_progress",
      title: "Transition Started",
      description: "Active task handover in progress",
      isCurrent: hap.transitionStatus === "in_progress",
    });
  }

  if (hap.transitionStatus === "blocked") {
    events.push({
      id: "blocked",
      date: hap.updatedAt,
      status: "blocked",
      title: "Transition Blocked",
      description: "Awaiting resolution",
      isCurrent: true,
    });
  }

  if (currentIndex >= 3) {
    events.push({
      id: "completed",
      date: hap.updatedAt,
      status: "completed",
      title: "Transition Complete",
      description: "All tasks transitioned",
      isCurrent: hap.transitionStatus === "completed",
    });
  }

  // Add projected completion if not complete and we have a target date
  if (includeProjected && hap.targetCompletionDate && currentIndex < 3) {
    events.push({
      id: "projected",
      date: hap.targetCompletionDate,
      status: "completed",
      title: "Target Completion",
      description: "Projected completion date",
    });
  }

  return events;
}
