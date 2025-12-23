import {
  Bot,
  PlusCircle,
  Edit,
  MinusCircle,
  Settings,
} from "lucide-react";
import type { PipelineItemType, PipelineStage } from "@/lib/schemas";

// Icon mapping for item types
export const typeIcons: Record<PipelineItemType, React.ComponentType<{ className?: string }>> = {
  "new-agent": Bot,
  "capability-add": PlusCircle,
  "capability-modify": Edit,
  "capability-remove": MinusCircle,
  "agent-update": Settings,
};

// Stage column background colors
export const stageColors: Record<PipelineStage, string> = {
  proposed: "bg-gray-50",
  "under-review": "bg-blue-50",
  approved: "bg-green-50",
  "in-progress": "bg-yellow-50",
  completed: "bg-emerald-50",
  rejected: "bg-red-50",
};
