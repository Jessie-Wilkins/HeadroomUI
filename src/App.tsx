import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Loader2,
  Menu,
  Moon,
  Play,
  Power,
  PowerOff,
  RefreshCw,
  Settings2,
  Terminal,
  X
} from "lucide-react";
import { commandMap, commands, dashboardStats, navCommands } from "./commands";
import { buildArgs, buildInitialState, commandLine } from "./commandArgs";
import type { ActionSpec, CommandSpec, Field, FormState, RunResult } from "./types";

type StatusResponse = {
  headroomBin: string;
  version: RunResult;
  installStatus: RunResult;
  mcpStatus: RunResult;
  toolsDoctor: RunResult;
  proxy: {
    running: boolean;
    startedAt: string | null;
    output: string;
  };
};

const api = {
  async status(): Promise<StatusResponse> {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Unable to read Headroom status.");
    return response.json();
  },
  async run(args: string[]): Promise<RunResult> {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Command failed before it started.");
    }
    return response.json();
  },
  async startProxy(args: string[]) {
    const response = await fetch("/api/proxy/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args })
    });
    if (!response.ok) throw new Error("Unable to start proxy.");
    return response.json();
  },
  async stopProxy() {
    const response = await fetch("/api/proxy/stop", { method: "POST" });
    if (!response.ok) throw new Error("Unable to stop proxy.");
    return response.json();
  }
};

function routeFromHash() {
  return window.location.hash.replace(/^#\/?/, "") || "dashboard";
}

export function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const activeCommand = commandMap.get(route);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">H</div>
          <div>
            <div className="brand-title">Headroom UI</div>
            <div className="brand-subtitle">Local CLI console</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Headroom commands">
          <NavItem href="#/dashboard" active={route === "dashboard"} icon={Moon} title="Dashboard" subtitle="Overview" />
          {navCommands.map((command) => (
            <NavItem
              key={command.id}
              href={`#/${command.route}`}
              active={route === command.route}
              icon={command.icon}
              title={command.title}
              subtitle={command.tagline}
            />
          ))}
        </nav>
      </aside>

      <div className="mobile-scrim" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />

      <main className="main">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <div className="eyebrow">Headroom command center</div>
            <h1>{activeCommand?.title ?? "Dashboard"}</h1>
          </div>
          <button
            className="icon-button theme-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open settings"}
            onClick={() => (menuOpen ? setMenuOpen(false) : (window.location.hash = "#/settings"))}
          >
            {menuOpen ? <X size={20} /> : <Settings2 size={20} />}
          </button>
        </header>

        {activeCommand ? <CommandPage command={activeCommand} /> : <Dashboard />}
      </main>
    </div>
  );
}

function NavItem({
  href,
  active,
  icon: Icon,
  title,
  subtitle
}: {
  href: string;
  active: boolean;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <a className={`nav-item ${active ? "active" : ""}`} href={href}>
      <Icon size={18} />
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <ChevronRight className="nav-chevron" size={16} />
    </a>
  );
}

function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .status()
      .then((value) => {
        if (active) setStatus(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="badge">Headroom CLI ready</div>
          <h2>Run, configure, and inspect Headroom without memorizing flags.</h2>
          <p>
            Every top-level CLI command has a focused page, safe defaults, copyable commands, and output that stays readable on a
            phone or desktop.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#/settings">
              <Settings2 size={18} />
              Open settings
            </a>
            <a className="button ghost" href="#/proxy">
              <Power size={18} />
              Start proxy
            </a>
          </div>
        </div>
        <div className="status-orbit">
          {dashboardStats.map((item) => (
            <div className="metric" key={item.label}>
              <item.icon size={20} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-grid">
        <StatusCard
          title="CLI"
          healthy={!loading && status?.version.code === 0}
          loading={loading}
          detail={status?.version.stdout.trim() || status?.version.stderr.trim() || "Checking"}
        />
        <StatusCard
          title="Persistent install"
          healthy={!loading && status?.installStatus.code === 0}
          loading={loading}
          detail={firstLine(status?.installStatus.stdout || status?.installStatus.stderr)}
        />
        <StatusCard
          title="MCP"
          healthy={!loading && status?.mcpStatus.code === 0}
          loading={loading}
          detail={firstLine(status?.mcpStatus.stdout || status?.mcpStatus.stderr)}
        />
        <StatusCard
          title="Proxy"
          healthy={Boolean(status?.proxy.running)}
          loading={loading}
          detail={status?.proxy.running ? `Running since ${formatDate(status.proxy.startedAt)}` : "Not running from this UI"}
        />
      </section>

      <section className="command-grid">
        {commands.map((command) => (
          <a className="command-card" href={`#/${command.route}`} key={command.id} style={{ "--accent": command.accent } as React.CSSProperties}>
            <command.icon size={22} />
            <div>
              <h3>{command.title}</h3>
              <p>{command.description}</p>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}

function CommandPage({ command }: { command: CommandSpec }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const isSettings = command.id === "settings";

  async function refreshStatus() {
    setStatus(await api.status());
  }

  useEffect(() => {
    if (isSettings || command.id === "proxy") {
      refreshStatus().catch(() => undefined);
    }
  }, [isSettings, command.id]);

  return (
    <div className="page-stack">
      <section className="command-hero" style={{ "--accent": command.accent } as React.CSSProperties}>
        <div className="command-icon">
          <command.icon size={30} />
        </div>
        <div>
          <div className="eyebrow">{command.tagline}</div>
          <h2>{command.title}</h2>
          <p>{command.description}</p>
        </div>
      </section>

      {isSettings && <SettingsStatus status={status} onRefresh={refreshStatus} />}
      {command.id === "proxy" && <ProxyStatus status={status} onRefresh={refreshStatus} />}

      <section className="examples">
        <h3>Common commands</h3>
        <div className="example-list">
          {command.examples.map((example) => (
            <code key={example}>{example}</code>
          ))}
        </div>
      </section>

      <section className="action-grid">
        {command.actions.map((action) => (
          <ActionPanel key={action.id} action={action} onAfterRun={refreshStatus} />
        ))}
      </section>
    </div>
  );
}

function SettingsStatus({ status, onRefresh }: { status: StatusResponse | null; onRefresh: () => Promise<void> }) {
  const cards = [
    { title: "Headroom", result: status?.version, detail: status?.headroomBin },
    { title: "Persistent runtime", result: status?.installStatus },
    { title: "MCP server", result: status?.mcpStatus },
    { title: "Bundled tools", result: status?.toolsDoctor }
  ];

  return (
    <section className="settings-status">
      <div className="section-heading">
        <div>
          <h3>Setup state</h3>
          <p>Use these checks before applying persistent config or agent hooks.</p>
        </div>
        <button className="button compact" type="button" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <div className="quick-grid">
        {cards.map((card) => (
          <StatusCard
            key={card.title}
            title={card.title}
            healthy={card.result?.code === 0}
            loading={!status}
            detail={card.detail ?? firstLine(card.result?.stdout || card.result?.stderr)}
          />
        ))}
      </div>
    </section>
  );
}

function ProxyStatus({ status, onRefresh }: { status: StatusResponse | null; onRefresh: () => Promise<void> }) {
  const [stopping, setStopping] = useState(false);

  async function stopProxy() {
    setStopping(true);
    try {
      await api.stopProxy();
      await onRefresh();
    } finally {
      setStopping(false);
    }
  }

  return (
    <section className="proxy-strip">
      <div>
        <span className={`live-dot ${status?.proxy.running ? "on" : ""}`} />
        <strong>{status?.proxy.running ? "Managed proxy running" : "Managed proxy stopped"}</strong>
        <p>{status?.proxy.running ? `Started ${formatDate(status.proxy.startedAt)}` : "Start it below with the settings you want."}</p>
      </div>
      <button className="button danger compact" type="button" onClick={stopProxy} disabled={!status?.proxy.running || stopping}>
        {stopping ? <Loader2 className="spin" size={16} /> : <PowerOff size={16} />}
        Stop
      </button>
    </section>
  );
}

function ActionPanel({ action, onAfterRun }: { action: ActionSpec; onAfterRun: () => Promise<void> }) {
  const [state, setState] = useState<FormState>(() => buildInitialState(action));
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const args = useMemo(() => buildArgs(action, state), [action, state]);
  const cli = commandLine(args);
  const output = result ? [result.stdout, result.stderr].filter(Boolean).join("\n") : "";

  async function run() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      if (action.longRunning) {
        const response = await api.startProxy(args);
        setResult({
          code: 0,
          stdout: response.output || `Started proxy at ${response.startedAt}.`,
          stderr: "",
          durationMs: 0
        });
      } else {
        setResult(await api.run(args));
      }
      await onAfterRun().catch(() => undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected command error.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className={`action-panel ${action.variant ?? "default"}`}>
      <div className="action-header">
        <div>
          <h3>{action.label}</h3>
          <p>{action.description}</p>
        </div>
        <button className={`button compact ${action.variant === "danger" ? "danger" : "primary"}`} type="button" onClick={run} disabled={running}>
          {running ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
          Run
        </button>
      </div>

      {action.fields?.length ? (
        <div className="field-grid">
          {action.fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={state[field.name]}
              onChange={(value) => setState((current) => ({ ...current, [field.name]: value }))}
            />
          ))}
        </div>
      ) : null}

      <div className="command-line">
        <code>{cli}</code>
        <button className="icon-button" type="button" aria-label="Copy command" onClick={() => navigator.clipboard.writeText(cli)}>
          <Clipboard size={16} />
        </button>
      </div>

      {error && (
        <div className="inline-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {(output || result) && (
        <div className={`terminal-output ${result?.code === 0 ? "ok" : "failed"}`}>
          <div className="terminal-title">
            <Terminal size={16} />
            <span>{result?.code === 0 ? "Command output" : `Exited with ${result?.code ?? "unknown"}`}</span>
            {result?.durationMs ? <small>{Math.round(result.durationMs)}ms</small> : null}
          </div>
          <pre>{output || "No output."}</pre>
        </div>
      )}
    </article>
  );
}

function FieldControl({
  field,
  value,
  onChange
}: {
  field: Field;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "switch") {
    return (
      <label className="switch-field">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span />
        <div>
          <strong>{field.label}</strong>
          {field.hint && <small>{field.hint}</small>}
        </div>
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      {field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}

function StatusCard({ title, healthy, loading, detail }: { title: string; healthy: boolean; loading?: boolean; detail?: string }) {
  return (
    <article className="status-card">
      <div className="status-icon">
        {loading ? <Loader2 className="spin" size={20} /> : healthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      </div>
      <div>
        <h3>{title}</h3>
        <p>{detail || (loading ? "Checking" : "Needs attention")}</p>
      </div>
    </article>
  );
}

function firstLine(value?: string) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
  return (
    value
      ?.replace(ansiPattern, "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /[A-Za-z0-9]/.test(line) && !/^[┏┓┗┛┃━┡╇┩└┘│─┴┬┼\s]+$/.test(line)) || "No output"
  );
}

function formatDate(value: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
