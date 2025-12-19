"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Download, Upload, Moon, Sun, Monitor } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { clearStorage } from "@/services/storage";
import { uiActions } from "@/stores";
import { useKeyboardShortcuts } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useKeyboardShortcuts();

  const handleClearData = () => {
    clearStorage();
    queryClient.invalidateQueries();
    setDeleteDialogOpen(false);
    uiActions.addToast({
      type: "success",
      title: "Data cleared",
      message: "All stories have been deleted. Refresh to see default data.",
    });
  };

  const handleExportAll = async () => {
    const data = localStorage.getItem("agent-stories-data");
    if (!data) {
      uiActions.addToast({
        type: "error",
        title: "No data to export",
        message: "There are no stories to export.",
      });
      return;
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-stories-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    uiActions.addToast({
      type: "success",
      title: "Export complete",
      message: "Your stories have been exported.",
    });
  };

  const handleImportAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        JSON.parse(data); // Validate JSON
        localStorage.setItem("agent-stories-data", data);
        queryClient.invalidateQueries();
        uiActions.addToast({
          type: "success",
          title: "Import complete",
          message: "Your stories have been imported. Refresh to see them.",
        });
      } catch {
        uiActions.addToast({
          type: "error",
          title: "Import failed",
          message: "Invalid backup file format.",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your preferences and data
            </p>
          </div>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Agent Stories looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Configure the story editor behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save changes while editing
                </p>
              </div>
              <Switch
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export, import, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export all stories</Label>
                <p className="text-sm text-muted-foreground">
                  Download a backup of all your stories
                </p>
              </div>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Import stories</Label>
                <p className="text-sm text-muted-foreground">
                  Restore from a backup file
                </p>
              </div>
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportAll}
                  />
                </label>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Delete all data</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all stories (cannot be undone)
                </p>
              </div>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete all data?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all your stories. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleClearData}>
                      Delete All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>Quick navigation shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New story</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Go to dashboard</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+H</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stories list</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+Shift+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Templates</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+Shift+T</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Save (in editor)</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+S</kbd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
