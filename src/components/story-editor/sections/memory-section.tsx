"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2 } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORE_TYPES = {
  kb: { label: "Knowledge Base", description: "Structured knowledge storage" },
  vector: { label: "Vector Store", description: "Semantic similarity search" },
  relational: { label: "Relational", description: "Traditional database" },
  kv: { label: "Key-Value", description: "Simple key-value pairs" },
};

const UPDATE_MODES = {
  read_only: { label: "Read Only", description: "Agent can only read" },
  append: { label: "Append", description: "Agent can add new entries" },
  full_crud: { label: "Full CRUD", description: "Agent can create, read, update, delete" },
};

interface PersistentStore {
  name: string;
  type: string;
  purpose: string;
  updates: string;
}

export function MemorySection() {
  const editor = useSnapshot(storyEditorStore);
  const memory = (editor.draft.data.memory as Record<string, unknown>) || {};
  const stores = (memory.persistent as PersistentStore[]) || [];
  const working = (memory.working as string[]) || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`memory.${path}`, value);
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory & State</CardTitle>
        <CardDescription>
          Define what the agent remembers and how it persists state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Working Memory */}
        <div className="space-y-2">
          <Label htmlFor="working-memory">Working Memory</Label>
          <Input
            id="working-memory"
            placeholder="Items to track during execution (comma-separated)"
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
            <Label>Persistent Stores</Label>
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
                    {Object.entries(STORE_TYPES).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
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
                    {Object.entries(UPDATE_MODES).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
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
            <p className="text-sm text-muted-foreground">
              No persistent stores defined.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
