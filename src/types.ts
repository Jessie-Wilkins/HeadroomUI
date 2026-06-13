import type { LucideIcon } from "lucide-react";

export type FormState = Record<string, string | boolean>;

export type Field =
  | {
      name: string;
      label: string;
      type: "text" | "number" | "path";
      flag?: string;
      positional?: boolean;
      placeholder?: string;
      min?: number;
      max?: number;
      defaultValue?: string;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: "select";
      flag?: string;
      positional?: boolean;
      options: Array<{ value: string; label: string }>;
      defaultValue?: string;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: "switch";
      flag: string;
      defaultValue?: boolean;
      hint?: string;
    };

export type ActionSpec = {
  id: string;
  label: string;
  description: string;
  args: string[];
  fields?: Field[];
  variant?: "default" | "danger" | "passive";
  longRunning?: boolean;
};

export type CommandSpec = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  route: string;
  examples: string[];
  actions: ActionSpec[];
};

export type RunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};
