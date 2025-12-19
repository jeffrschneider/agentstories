"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ValidationPanelProps {
  errors: readonly { readonly path: string; readonly message: string }[];
}

export function ValidationPanel({ errors }: ValidationPanelProps) {
  if (errors.length === 0) return null;

  return (
    <Card className="border-destructive">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          Validation Errors ({errors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {errors.map((error, index) => (
            <li key={index} className="flex gap-2">
              <code className="rounded bg-muted px-1 text-xs">
                {error.path || "root"}
              </code>
              <span className="text-muted-foreground">{error.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
