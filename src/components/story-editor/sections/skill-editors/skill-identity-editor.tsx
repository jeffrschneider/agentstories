"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Skill,
  SKILL_ACQUISITION_METADATA,
  SKILL_DOMAINS
} from "@/lib/schemas/skill";

interface SkillIdentityEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillIdentityEditor({ skill, onUpdate }: SkillIdentityEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            placeholder="e.g., Request Classification"
            value={skill.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Domain *</Label>
          <Select
            value={skill.domain}
            onValueChange={(value) => onUpdate({ domain: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="What does this skill do?"
          value={skill.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Acquisition</Label>
        <Select
          value={skill.acquired}
          onValueChange={(value) => onUpdate({ acquired: value as Skill["acquired"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="How was this skill acquired?" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SKILL_ACQUISITION_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
