import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp, sanitizeArgs, type HeadroomRunner } from "../../server/index";

const ok = (stdout: string) => ({ code: 0, stdout, stderr: "", durationMs: 1 });

describe("Headroom UI API", () => {
  it("sanitizes arguments and caps the command length", () => {
    const args = sanitizeArgs([" memory ", "", 7, "stats", ...Array.from({ length: 80 }, (_, index) => `x${index}`)]);
    expect(args[0]).toBe("memory");
    expect(args[1]).toBe("stats");
    expect(args).toHaveLength(64);
  });

  it("returns status from the configured runner", async () => {
    const runner = vi.fn<HeadroomRunner>(async (args) => ok(args.join(" ")));
    const app = createApp({ headroomBin: "headroom-test", runner });

    const response = await request(app).get("/api/status").expect(200);

    expect(response.body.headroomBin).toBe("headroom-test");
    expect(response.body.version.stdout).toBe("--version");
    expect(runner).toHaveBeenCalledWith(["install", "status"], 20000);
  });

  it("rejects commands outside the Headroom allowlist", async () => {
    const runner = vi.fn<HeadroomRunner>(async () => ok("should not run"));
    const app = createApp({ runner });

    await request(app).post("/api/run").send({ args: ["git", "status"] }).expect(400);
    expect(runner).not.toHaveBeenCalled();
  });

  it("runs allowed commands", async () => {
    const runner = vi.fn<HeadroomRunner>(async (args) => ok(args.join(" ")));
    const app = createApp({ runner });

    const response = await request(app).post("/api/run").send({ args: ["memory", "stats"] }).expect(200);

    expect(response.body.stdout).toBe("memory stats");
    expect(runner).toHaveBeenCalledWith(["memory", "stats"]);
  });
});
