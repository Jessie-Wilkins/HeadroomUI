import { describe, expect, it } from "vitest";
import { buildArgs, buildInitialState, commandLine } from "../../src/commandArgs";
import { commandMap } from "../../src/commands";

describe("command argument builder", () => {
  it("builds default proxy arguments without empty values", () => {
    const action = commandMap.get("proxy")?.actions[0];
    expect(action).toBeDefined();

    const state = buildInitialState(action!);
    expect(buildArgs(action!, state)).toEqual(["proxy", "--host", "127.0.0.1", "--port", "8787", "--mode", "token"]);
  });

  it("places positional fields after the command", () => {
    const action = commandMap.get("wrap")?.actions[0];
    expect(action).toBeDefined();

    const state = buildInitialState(action!);
    expect(buildArgs(action!, state)).toEqual(["wrap", "codex", "--prepare-only"]);
  });

  it("quotes command-line arguments containing spaces", () => {
    expect(commandLine(["learn", "--project", "/tmp/my project"])).toBe('headroom learn --project "/tmp/my project"');
  });
});
