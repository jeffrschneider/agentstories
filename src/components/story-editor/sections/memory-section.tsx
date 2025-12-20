"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible } from "@/components/ui/collapsible";
import {
  PERSISTENT_STORE_TYPE_METADATA,
  STORE_UPDATE_MODE_METADATA,
  LEARNING_TYPE_METADATA,
} from "@/lib/schemas/memory";

interface PersistentStore {
  name: string;
  type: string;
  purpose: string;
  updates: string;
}

interface LearningConfig {
  type: string;
  signal: string;
}

export function MemorySection() {
  const editor = useSnapshot(storyEditorStore);
  const memory = (editor.draft.data.memory as Record<string, unknown>) || {};
  const stores = (memory.persistent as PersistentStore[]) || [];
  const working = (memory.working as string[]) || [];
  const learning = (memory.learning as LearningConfig[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`memory.${path}`, value);
  };

  // Persistent store management
  const addStore = () => {
    const newStores = [...stores, { name: "", type: "kv", purpose: "", updates: "read_only" }];
    updateField("persistent", newStores);
  };

  const updateStore = (index: number, field: keyof PersistentStore, value: string) => {
    const newStores = [...stores];
    newStores[index] = { ...newStores[index], [field]: value };
    updateField("persistent", newStores);
  };

  const removeStore = (index: number) => {
    const newStores = stores.filter((_, i) => i !== index);
    updateField("persistent", newStores);
  };

  // Learning config management
  const addLearning = () => {
    const newLearning = [...learning, { type: "feedback_loop", signal: "" }];
    updateField("learning", newLearning);
  };

  const updateLearning = (index: number, field: keyof LearningConfig, value: string) => {
    const newLearning = [...learning];
    newLearning[index] = { ...newLearning[index], [field]: value };
    updateField("learning", newLearning);
  };

  const removeLearning = (index: number) => {
    const newLearning = learning.filter((_, i) => i !== index);
    updateField("learning", newLearning);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory & State</CardTitle>
        <CardDescription>
          Define what the agent remembers and how it learns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Working Memory */}
        <div className="space-y-2">
          <Label htmlFor="working-memory">Working Memory</Label>
          <Input
            id="working-memory"
            placeholder="Ephemeral context during execution (comma-separated)"
            value={working.join(", ")}
            onChange={(e) => {
              const items = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
              updateField("working", items);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Temporary state tracked during a single execution
          </p>
        </div>

        {/* Persistent Stores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Persistent Stores</Label>
              <p className="text-xs text-muted-foreground">
                Long-term memory that persists across executions
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addStore}>
              <Plus className="mr-1 h-3 w-3" />
              Add Store
            </Button>
          </div>
          {stores.map((store, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between">
                <Input
                  placeholder="Store name"
                  value={store.name}
                  onChange={(e) => updateStore(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStore(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Select
                  value={store.type}
                  onValueChange={(value) => updateStore(index, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERSISTENT_STORE_TYPE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{meta.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {meta.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={store.updates}
                  onValueChange={(value) => updateStore(index, "updates", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Update mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STORE_UPDATE_MODE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{meta.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {meta.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Purpose"
                value={store.purpose}
                onChange={(e) => updateStore(index, "purpose", e.target.value)}
              />
            </div>
          ))}
          {stores.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No persistent stores defined.
            </p>
          )}
        </div>

        {/* Learning Configuration */}
        <Collapsible
          title="Learning Configuration"
          description="How the agent improves over time"
          defaultOpen={learning.length > 0}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Learning Signals</Label>
              <Button variant="outline" size="sm" onClick={addLearning}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {learning.map((config, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                <Select
                  value={config.type}
                  onValueChange={(value) => updateLearning(index, "type", value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEARNING_TYPE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="What triggers learning?"
                  value={config.signal}
                  onChange={(e) => updateLearning(index, "signal", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLearning(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {learning.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No learning signals configured.
              </p>
            )}
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
