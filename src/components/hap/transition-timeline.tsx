"use client";

import * as React from "react";
import {
  Circle,
  Edit,
  Timer,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HAPIntegrationStatus } from "@/lib/schemas/hap";

export interface TimelineEvent {
  id: string;
  date: string;
  status: HAPIntegrationStatus;
  title: string;
  description?: string;
  isCurrent?: boolean;
}

interface IntegrationTimelineProps {
  events: TimelineEvent[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

const statusIcons: Record<HAPIntegrationStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  planning: Edit,
  skills_pending: Timer,
  ready: CheckCircle2,
  active: PlayCircle,
  paused: PauseCircle,
};

const statusColors: Record<HAPIntegrationStatus, string> = {
  not_started: "bg-gray-400",
  planning: "bg-blue-500",
  skills_pending: "bg-yellow-500",
  ready: "bg-green-500",
  active: "bg-emerald-500",
  paused: "bg-orange-500",
};

export function IntegrationTimeline({
  events,
  orientation = "vertical",
  className,
}: IntegrationTimelineProps) {
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
    integrationStatus: HAPIntegrationStatus;
    createdAt: string;
    updatedAt: string;
  },
  includeProjected = true
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const statusOrder: HAPIntegrationStatus[] = [
    "not_started",
    "planning",
    "skills_pending",
    "ready",
    "active",
  ];

  const currentIndex = statusOrder.indexOf(hap.integrationStatus);

  // Add creation event
  events.push({
    id: "created",
    date: hap.createdAt,
    status: "not_started",
    title: "HAP Created",
    description: "Human-Agent pair established",
    isCurrent: hap.integrationStatus === "not_started",
  });

  // Add past events based on current status
  if (currentIndex >= 1) {
    events.push({
      id: "planning",
      date: hap.createdAt,
      status: "planning",
      title: "Planning Started",
      description: "Defining task responsibilities",
      isCurrent: hap.integrationStatus === "planning",
    });
  }

  if (currentIndex >= 2) {
    events.push({
      id: "skills_pending",
      date: hap.updatedAt,
      status: "skills_pending",
      title: "Skills Pending",
      description: "Waiting for agent skills to be defined",
      isCurrent: hap.integrationStatus === "skills_pending",
    });
  }

  if (currentIndex >= 3) {
    events.push({
      id: "ready",
      date: hap.updatedAt,
      status: "ready",
      title: "Ready",
      description: "All skills defined, ready for activation",
      isCurrent: hap.integrationStatus === "ready",
    });
  }

  if (currentIndex >= 4) {
    events.push({
      id: "active",
      date: hap.updatedAt,
      status: "active",
      title: "Active",
      description: "In production use",
      isCurrent: hap.integrationStatus === "active",
    });
  }

  // Handle paused status
  if (hap.integrationStatus === "paused") {
    events.push({
      id: "paused",
      date: hap.updatedAt,
      status: "paused",
      title: "Paused",
      description: "Temporarily paused",
      isCurrent: true,
    });
  }

  // Add projected completion if not active yet
  if (includeProjected && currentIndex < 4 && currentIndex >= 0) {
    events.push({
      id: "projected",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      title: "Target Activation",
      description: "Projected activation date",
    });
  }

  return events;
}

// Keep old export name for backwards compatibility during transition
export const TransitionTimeline = IntegrationTimeline;
