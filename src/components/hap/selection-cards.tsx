"use client";

import { Check, Bot, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Person, Role, AgentStory } from "@/lib/schemas";

interface SelectionCardProps<T> {
  item: T;
  isSelected: boolean;
  onSelect: (item: T) => void;
  renderContent: (item: T) => React.ReactNode;
}

function SelectionCard<T>({
  item,
  isSelected,
  onSelect,
  renderContent,
}: SelectionCardProps<T>) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "hover:border-primary/50"
      }`}
      onClick={() => onSelect(item)}
    >
      <CardContent className="pt-4">{renderContent(item)}</CardContent>
    </Card>
  );
}

interface PersonCardProps {
  person: Person;
  isSelected: boolean;
  onSelect: (person: Person) => void;
  getDeptName?: (deptId: string) => string;
}

export function PersonCard({
  person,
  isSelected,
  onSelect,
  getDeptName,
}: PersonCardProps) {
  return (
    <SelectionCard
      item={person}
      isSelected={isSelected}
      onSelect={onSelect}
      renderContent={(p) => (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.title}</p>
            </div>
            {isSelected && <Check className="h-5 w-5 text-primary" />}
          </div>
          {getDeptName && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {getDeptName(p.departmentId)}
              </Badge>
            </div>
          )}
        </>
      )}
    />
  );
}

interface RoleCardProps {
  role: Role;
  isSelected: boolean;
  onSelect: (role: Role) => void;
}

export function RoleCard({ role, isSelected, onSelect }: RoleCardProps) {
  return (
    <SelectionCard
      item={role}
      isSelected={isSelected}
      onSelect={onSelect}
      renderContent={(r) => (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {r.description}
              </p>
            </div>
            {isSelected && (
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {r.responsibilities.length} responsibilities
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {r.responsibilities.filter((resp) => resp.aiCandidate).length}{" "}
              AI candidates
            </Badge>
          </div>
        </>
      )}
    />
  );
}

interface AgentCardProps {
  agent: AgentStory;
  isSelected: boolean;
  onSelect: (agent: AgentStory) => void;
}

export function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <SelectionCard
      item={agent}
      isSelected={isSelected}
      onSelect={onSelect}
      renderContent={(a) => (
        <>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {a.role}
                </p>
              </div>
            </div>
            {isSelected && (
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {a.skills?.length || 0} skills
            </Badge>
            {a.autonomyLevel && (
              <Badge variant="secondary" className="text-xs">
                {a.autonomyLevel}
              </Badge>
            )}
          </div>
        </>
      )}
    />
  );
}

interface SelectionGridProps<T> {
  items: T[] | undefined;
  isLoading: boolean;
  renderCard: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function SelectionGrid<T>({
  items,
  isLoading,
  renderCard,
  keyExtractor,
}: SelectionGridProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items?.map((item) => (
        <div key={keyExtractor(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
