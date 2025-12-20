"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  Edit,
  Plus,
  Trash2,
  Copy,
  Download,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivity, type Activity, type ActivityType } from "@/stores";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  edit: <Edit className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  duplicate: <Copy className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  view: "Viewed",
  edit: "Edited",
  create: "Created",
  delete: "Deleted",
  duplicate: "Duplicated",
  export: "Exported",
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  view: "text-blue-500",
  edit: "text-amber-500",
  create: "text-green-500",
  delete: "text-red-500",
  duplicate: "text-purple-500",
  export: "text-cyan-500",
};

interface ActivityItemProps {
  activity: Activity;
  showLink?: boolean;
}

function ActivityItem({ activity, showLink = true }: ActivityItemProps) {
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  const content = (
    <div className="flex items-start gap-3 py-2">
      <div
        className={cn(
          "mt-0.5 rounded-full bg-muted p-1.5",
          ACTIVITY_COLORS[activity.type]
        )}
      >
        {ACTIVITY_ICONS[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{ACTIVITY_LABELS[activity.type]}</span>{" "}
          <span className="text-muted-foreground truncate">
            {activity.storyName}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );

  if (showLink && activity.type !== "delete") {
    return (
      <Link
        href={`/stories/${activity.storyId}`}
        className="block hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="px-2 -mx-2">{content}</div>;
}

interface ActivityFeedProps {
  limit?: number;
  storyId?: string;
  className?: string;
  showHeader?: boolean;
}

export function ActivityFeed({
  limit = 10,
  storyId,
  className,
  showHeader = true,
}: ActivityFeedProps) {
  const { activities, getRecent, getRecentForStory } = useActivity();

  const displayActivities = React.useMemo(() => {
    if (storyId) {
      return getRecentForStory(storyId, limit);
    }
    return getRecent(limit);
  }, [storyId, limit, getRecent, getRecentForStory, activities]);

  if (displayActivities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="divide-y">
          {displayActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              showLink={!storyId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
