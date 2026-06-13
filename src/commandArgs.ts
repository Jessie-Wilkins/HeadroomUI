import type { ActionSpec, FormState } from "./types";

export function buildInitialState(action: ActionSpec): FormState {
  const state: FormState = {};
  for (const field of action.fields ?? []) {
    if (field.type === "switch") {
      state[field.name] = Boolean(field.defaultValue);
    } else {
      state[field.name] = field.defaultValue ?? "";
    }
  }
  return state;
}

export function buildArgs(action: ActionSpec, state: FormState) {
  const args = [...action.args];
  for (const field of action.fields ?? []) {
    const rawValue = state[field.name];
    if (field.type === "switch") {
      if (rawValue) args.push(field.flag);
      continue;
    }

    const value = String(rawValue ?? "").trim();
    if (!value) continue;
    if (field.positional) {
      args.push(value);
      continue;
    }
    if (field.flag) {
      args.push(field.flag, value);
    }
  }
  return args;
}

export function commandLine(args: string[]) {
  return `headroom ${args.map((arg) => (/\s/.test(arg) ? JSON.stringify(arg) : arg)).join(" ")}`;
}
