import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Autonomy level variants
        full: "border-transparent bg-autonomy-full-light text-autonomy-full",
        supervised: "border-transparent bg-autonomy-supervised-light text-autonomy-supervised",
        collaborative: "border-transparent bg-autonomy-collaborative-light text-autonomy-collaborative",
        directed: "border-transparent bg-autonomy-directed-light text-autonomy-directed",
        // Format variants
        light: "border-transparent bg-format-light-bg text-format-light",
        "full-format": "border-transparent bg-format-full-bg text-format-full",
        // Trigger variants
        message: "border-transparent bg-trigger-message/10 text-trigger-message",
        resource_change: "border-transparent bg-trigger-resource-change/10 text-trigger-resource-change",
        schedule: "border-transparent bg-trigger-schedule/10 text-trigger-schedule",
        cascade: "border-transparent bg-trigger-cascade/10 text-trigger-cascade",
        manual: "border-transparent bg-trigger-manual/10 text-trigger-manual",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
