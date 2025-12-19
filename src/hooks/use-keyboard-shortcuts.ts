import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(customShortcuts?: ShortcutHandler[]) {
  const router = useRouter();

  useEffect(() => {
    const defaultShortcuts: ShortcutHandler[] = [
      {
        key: "n",
        ctrl: true,
        handler: () => router.push("/stories/new"),
        description: "Create new story",
      },
      {
        key: "h",
        ctrl: true,
        handler: () => router.push("/"),
        description: "Go to dashboard",
      },
      {
        key: "s",
        ctrl: true,
        shift: true,
        handler: () => router.push("/stories"),
        description: "Go to stories list",
      },
      {
        key: "t",
        ctrl: true,
        shift: true,
        handler: () => router.push("/templates"),
        description: "Go to templates",
      },
    ];

    const allShortcuts = [...defaultShortcuts, ...(customShortcuts || [])];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Ctrl+S for save even in inputs
        if (!(event.key === "s" && (event.ctrlKey || event.metaKey))) {
          return;
        }
      }

      for (const shortcut of allShortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, customShortcuts]);
}

// Hook for save shortcut specifically
export function useSaveShortcut(onSave: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "s" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, enabled]);
}
