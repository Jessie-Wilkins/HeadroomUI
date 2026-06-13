import { spawn, type ChildProcessByStdio } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Readable } from "node:stream";
import express from "express";

export type HeadroomRunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type HeadroomRunner = (args: string[], timeoutMs?: number) => Promise<HeadroomRunResult>;

const allowedTopLevel = new Set([
  "agent-savings",
  "capture",
  "diff",
  "evals",
  "init",
  "install",
  "learn",
  "loc",
  "mcp",
  "memory",
  "perf",
  "proxy",
  "sg",
  "tools",
  "unwrap",
  "wrap"
]);

export function sanitizeArgs(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((arg): arg is string => typeof arg === "string")
    .map((arg) => arg.trim())
    .filter(Boolean)
    .slice(0, 64);
}

export function createHeadroomRunner(headroomBin = process.env.HEADROOM_BIN ?? "headroom"): HeadroomRunner {
  return (args: string[], timeoutMs = 120_000) =>
    new Promise<HeadroomRunResult>((resolve) => {
      const started = Date.now();
      const child = spawn(headroomBin, args, {
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";
      let resolved = false;
      const timer = setTimeout(() => {
        stderr += `\nCommand timed out after ${timeoutMs / 1000}s.`;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve({ code: 1, stdout, stderr: `${stderr}${error.message}`, durationMs: Date.now() - started });
      });

      child.on("close", (code) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve({ code, stdout, stderr, durationMs: Date.now() - started });
      });
    });
}

export function createApp(options: { headroomBin?: string; runner?: HeadroomRunner } = {}) {
  const app = express();
  const headroomBin = options.headroomBin ?? process.env.HEADROOM_BIN ?? "headroom";
  const runHeadroom = options.runner ?? createHeadroomRunner(headroomBin);
  let proxyProcess: ChildProcessByStdio<null, Readable, Readable> | null = null;
  let proxyBuffer = "";
  let proxyStartedAt: string | null = null;

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/status", async (_req, res) => {
    const [version, installStatus, mcpStatus, toolsDoctor] = await Promise.all([
      runHeadroom(["--version"], 10_000),
      runHeadroom(["install", "status"], 20_000),
      runHeadroom(["mcp", "status"], 20_000),
      runHeadroom(["tools", "doctor"], 20_000)
    ]);

    res.json({
      headroomBin,
      version,
      installStatus,
      mcpStatus,
      toolsDoctor,
      proxy: {
        running: Boolean(proxyProcess && !proxyProcess.killed),
        startedAt: proxyStartedAt,
        output: proxyBuffer.slice(-8000)
      }
    });
  });

  app.post("/api/run", async (req, res) => {
    const args = sanitizeArgs(req.body?.args);
    if (!args.length || !allowedTopLevel.has(args[0])) {
      res.status(400).json({ error: "Command must start with an allowed headroom subcommand." });
      return;
    }

    const result = await runHeadroom(args);
    res.json(result);
  });

  app.post("/api/proxy/start", (req, res) => {
    if (proxyProcess && !proxyProcess.killed) {
      res.json({ running: true, startedAt: proxyStartedAt, output: proxyBuffer.slice(-8000) });
      return;
    }

    const args = sanitizeArgs(req.body?.args);
    const proxyArgs = ["proxy", ...args.filter((arg) => arg !== "proxy")];
    proxyBuffer = "";
    proxyStartedAt = new Date().toISOString();
    const child = spawn(headroomBin, proxyArgs, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    proxyProcess = child;

    child.stdout.on("data", (chunk) => {
      proxyBuffer = `${proxyBuffer}${chunk.toString()}`.slice(-16000);
    });
    child.stderr.on("data", (chunk) => {
      proxyBuffer = `${proxyBuffer}${chunk.toString()}`.slice(-16000);
    });
    child.on("close", (code) => {
      proxyBuffer = `${proxyBuffer}\nProxy exited with code ${code}.`.slice(-16000);
      proxyProcess = null;
    });

    res.json({ running: true, startedAt: proxyStartedAt, output: proxyBuffer });
  });

  app.post("/api/proxy/stop", (_req, res) => {
    if (proxyProcess && !proxyProcess.killed) {
      proxyProcess.kill("SIGTERM");
    }
    proxyProcess = null;
    proxyStartedAt = null;
    res.json({ running: false, output: proxyBuffer.slice(-8000) });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.HEADROOM_UI_API_PORT ?? 4174);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Headroom UI API listening on http://127.0.0.1:${port}`);
  });
}
