import { spawn } from "node:child_process";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:5173";
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/snap/bin/chromium";

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

let server;
if (!(await waitForServer(baseUrl, 1_000))) {
  server = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: "ignore"
  });
  const ready = await waitForServer(baseUrl);
  if (!ready) {
    server?.kill("SIGTERM");
    throw new Error("Vite dev server did not start in time.");
  }
}

const browser = await chromium.launch({ executablePath: chromiumPath, headless: true });
try {
  const routes = ["dashboard", "settings", "proxy", "memory", "wrap", "install", "learn", "agent-savings"];
  for (const route of routes) {
    for (const viewport of [
      { width: 390, height: 1000 },
      { width: 1440, height: 1000 }
    ]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`${baseUrl}/#/${route}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      if (overflow > 1) {
        throw new Error(`${route} overflowed ${overflow}px at ${viewport.width}px`);
      }
      if (errors.length) {
        throw new Error(`${route} logged console errors: ${errors.join("; ")}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The process group may already be gone.
    }
  }
}
