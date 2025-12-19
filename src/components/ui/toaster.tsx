"use client";

import { useSnapshot } from "valtio";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { uiStore, uiActions } from "@/stores";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
  error: "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100",
  info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
};

const iconStyles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function Toaster() {
  const ui = useSnapshot(uiStore);

  if (ui.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {ui.toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
              "animate-in slide-in-from-right-full duration-300",
              styles[toast.type]
            )}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", iconStyles[toast.type])} />
            <div className="flex-1">
              <p className="font-medium">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => uiActions.removeToast(toast.id)}
              className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
