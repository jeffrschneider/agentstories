"use client";

import { Check } from "lucide-react";

export interface WizardStep {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WizardStepsProps {
  steps: WizardStep[];
  currentStepIndex: number;
}

export function WizardSteps({ steps, currentStepIndex }: WizardStepsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`flex items-center gap-2 ${
              index <= currentStepIndex
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                index < currentStepIndex
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStepIndex
                  ? "border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {index < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-4 h-0.5 w-8 md:w-16 ${
                index < currentStepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
