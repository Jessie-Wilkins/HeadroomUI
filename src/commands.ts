import {
  Activity,
  Bot,
  Brain,
  Cable,
  ChartNoAxesCombined,
  CircleDot,
  Code2,
  Diff,
  Download,
  FlaskConical,
  Gauge,
  Layers3,
  Network,
  PackageCheck,
  PlugZap,
  SearchCode,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Undo2,
  Wrench
} from "lucide-react";
import type { CommandSpec } from "./types";

export const commands: CommandSpec[] = [
  {
    id: "settings",
    route: "settings",
    title: "Settings",
    tagline: "Complete setup",
    description: "Verify Headroom, configure durable integrations, install bundled tools, and manage persistent runtime setup.",
    icon: ShieldCheck,
    accent: "#4f46e5",
    examples: ["headroom install status", "headroom init codex --memory", "headroom mcp install", "headroom tools doctor"],
    actions: [
      {
        id: "install-status",
        label: "Check persistent install",
        description: "Show the active persistent deployment state.",
        args: ["install", "status"],
        variant: "passive"
      },
      {
        id: "install-apply",
        label: "Apply persistent service",
        description: "Install the recommended persistent Headroom service with automatic provider detection.",
        args: ["install", "apply"],
        fields: [
          {
            name: "preset",
            label: "Preset",
            type: "select",
            flag: "--preset",
            defaultValue: "persistent-service",
            options: [
              { value: "persistent-service", label: "Persistent service" },
              { value: "persistent-task", label: "Persistent task" },
              { value: "persistent-docker", label: "Persistent Docker" }
            ]
          },
          {
            name: "providers",
            label: "Providers",
            type: "select",
            flag: "--providers",
            defaultValue: "auto",
            options: [
              { value: "auto", label: "Auto" },
              { value: "manual", label: "Manual" }
            ]
          },
          {
            name: "target",
            label: "Target agent",
            type: "select",
            flag: "--target",
            options: [
              { value: "", label: "No specific target" },
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "copilot", label: "Copilot" }
            ],
            hint: "Use only when the selected preset accepts a target."
          }
        ]
      },
      {
        id: "init-agent",
        label: "Initialize agent",
        description: "Install durable hooks and provider routing for a selected coding agent.",
        args: ["init"],
        fields: [
          {
            name: "agent",
            label: "Agent",
            type: "select",
            positional: true,
            defaultValue: "codex",
            options: [
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "copilot", label: "Copilot" },
              { value: "openclaw", label: "OpenClaw" }
            ]
          },
          { name: "global", label: "Global install", type: "switch", flag: "--global", defaultValue: true },
          { name: "memory", label: "Enable memory", type: "switch", flag: "--memory", defaultValue: true },
          { name: "port", label: "Proxy port", type: "number", flag: "--port", defaultValue: "8787", min: 1, max: 65535 }
        ]
      },
      {
        id: "mcp-install",
        label: "Install MCP",
        description: "Configure the Headroom MCP server for supported clients.",
        args: ["mcp", "install"]
      },
      {
        id: "tools-install",
        label: "Install bundled tools",
        description: "Pre-fetch ast-grep, difftastic, and scc binaries.",
        args: ["tools", "install"]
      }
    ]
  },
  {
    id: "proxy",
    route: "proxy",
    title: "Proxy",
    tagline: "Optimization gateway",
    description: "Start and tune the local optimization proxy for Anthropic and OpenAI-compatible clients.",
    icon: PlugZap,
    accent: "#0f766e",
    examples: ["headroom proxy --port 8787", "ANTHROPIC_BASE_URL=http://localhost:8787 claude", "OPENAI_BASE_URL=http://localhost:8787/v1 your-app"],
    actions: [
      {
        id: "start-proxy",
        label: "Start managed proxy",
        description: "Run a local proxy process controlled by this UI.",
        args: ["proxy"],
        longRunning: true,
        fields: [
          { name: "host", label: "Host", type: "text", flag: "--host", defaultValue: "127.0.0.1" },
          { name: "port", label: "Port", type: "number", flag: "--port", defaultValue: "8787", min: 1, max: 65535 },
          {
            name: "mode",
            label: "Mode",
            type: "select",
            flag: "--mode",
            defaultValue: "token",
            options: [
              { value: "token", label: "Token savings" },
              { value: "cache", label: "Cache stability" }
            ]
          },
          { name: "noOptimize", label: "Passthrough mode", type: "switch", flag: "--no-optimize" },
          { name: "logMessages", label: "Log messages", type: "switch", flag: "--log-messages", hint: "May write sensitive request content to logs." }
        ]
      }
    ]
  },
  {
    id: "memory",
    route: "memory",
    title: "Memory",
    tagline: "Persistent recall",
    description: "Inspect, edit, import, export, and prune stored Headroom memories.",
    icon: Brain,
    accent: "#7c3aed",
    examples: ["headroom memory list --limit 10", "headroom memory stats", "headroom memory export --output memories.json"],
    actions: [
      { id: "stats", label: "Stats", description: "Show memory store statistics.", args: ["memory", "stats"], variant: "passive" },
      {
        id: "list",
        label: "List memories",
        description: "List recent memories with optional filtering.",
        args: ["memory", "list"],
        fields: [
          { name: "limit", label: "Limit", type: "number", flag: "--limit", defaultValue: "20", min: 1 },
          { name: "scope", label: "Scope", type: "text", flag: "--scope", placeholder: "USER" },
          { name: "since", label: "Since", type: "text", flag: "--since", placeholder: "7d" }
        ],
        variant: "passive"
      },
      {
        id: "show",
        label: "Show memory",
        description: "Read the full details for one memory.",
        args: ["memory", "show"],
        fields: [{ name: "id", label: "Memory ID", type: "text", positional: true, placeholder: "memory id" }],
        variant: "passive"
      },
      {
        id: "export",
        label: "Export",
        description: "Export memories to a JSON file.",
        args: ["memory", "export"],
        fields: [{ name: "output", label: "Output file", type: "path", flag: "--output", placeholder: "memories.json" }]
      },
      {
        id: "prune",
        label: "Prune old memories",
        description: "Delete memories older than a duration.",
        args: ["memory", "prune"],
        fields: [{ name: "older", label: "Older than", type: "text", flag: "--older-than", placeholder: "30d" }],
        variant: "danger"
      }
    ]
  },
  {
    id: "wrap",
    route: "wrap",
    title: "Wrap",
    tagline: "Launch through Headroom",
    description: "Start supported agent CLIs through a Headroom proxy with the right environment.",
    icon: Cable,
    accent: "#2563eb",
    examples: ["headroom wrap codex", "headroom wrap claude", "headroom wrap copilot -- --model claude-sonnet-4-20250514"],
    actions: [
      {
        id: "wrap-agent",
        label: "Prepare or launch",
        description: "Run a supported wrapper command.",
        args: ["wrap"],
        fields: [
          {
            name: "agent",
            label: "Tool",
            type: "select",
            positional: true,
            defaultValue: "codex",
            options: [
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "copilot", label: "Copilot" },
              { value: "aider", label: "Aider" },
              { value: "cursor", label: "Cursor" },
              { value: "cline", label: "Cline" },
              { value: "continue", label: "Continue" },
              { value: "goose", label: "Goose" },
              { value: "openhands", label: "OpenHands" },
              { value: "openclaw", label: "OpenClaw" }
            ]
          },
          { name: "prepareOnly", label: "Prepare only", type: "switch", flag: "--prepare-only", defaultValue: true }
        ]
      }
    ]
  },
  {
    id: "unwrap",
    route: "unwrap",
    title: "Unwrap",
    tagline: "Undo durable wrapping",
    description: "Remove durable wrapper configuration from supported tools.",
    icon: Undo2,
    accent: "#be123c",
    examples: ["headroom unwrap codex", "headroom unwrap claude", "headroom unwrap openclaw"],
    actions: [
      {
        id: "unwrap-agent",
        label: "Unwrap agent",
        description: "Undo durable setup for one agent.",
        args: ["unwrap"],
        variant: "danger",
        fields: [
          {
            name: "agent",
            label: "Agent",
            type: "select",
            positional: true,
            defaultValue: "codex",
            options: [
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "openclaw", label: "OpenClaw" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "install",
    route: "install",
    title: "Install",
    tagline: "Persistent runtime",
    description: "Apply, inspect, start, stop, restart, or remove a persistent Headroom deployment.",
    icon: Download,
    accent: "#0891b2",
    examples: ["headroom install apply --preset persistent-service --providers auto", "headroom install status", "headroom install restart"],
    actions: [
      { id: "status", label: "Status", description: "Show deployment status.", args: ["install", "status"], variant: "passive" },
      {
        id: "apply",
        label: "Apply deployment",
        description: "Install or update a persistent deployment.",
        args: ["install", "apply"],
        fields: [
          {
            name: "preset",
            label: "Preset",
            type: "select",
            flag: "--preset",
            defaultValue: "persistent-service",
            options: [
              { value: "persistent-service", label: "Persistent service" },
              { value: "persistent-task", label: "Persistent task" },
              { value: "persistent-docker", label: "Persistent Docker" }
            ]
          },
          {
            name: "providers",
            label: "Providers",
            type: "select",
            flag: "--providers",
            defaultValue: "auto",
            options: [
              { value: "auto", label: "Auto" },
              { value: "manual", label: "Manual" }
            ]
          }
        ]
      },
      { id: "start", label: "Start", description: "Start the persistent deployment.", args: ["install", "start"] },
      { id: "stop", label: "Stop", description: "Stop the persistent deployment.", args: ["install", "stop"] },
      { id: "restart", label: "Restart", description: "Restart the persistent deployment.", args: ["install", "restart"] },
      { id: "remove", label: "Remove", description: "Remove persistent setup and managed config.", args: ["install", "remove"], variant: "danger" }
    ]
  },
  {
    id: "init",
    route: "init",
    title: "Init",
    tagline: "Durable integrations",
    description: "Install durable hooks and provider routing for supported coding agents.",
    icon: Sparkles,
    accent: "#ca8a04",
    examples: ["headroom init codex --global --memory", "headroom init claude --port 8787", "headroom init openclaw"],
    actions: [
      {
        id: "init",
        label: "Initialize",
        description: "Configure a durable agent integration.",
        args: ["init"],
        fields: [
          {
            name: "agent",
            label: "Agent",
            type: "select",
            positional: true,
            defaultValue: "codex",
            options: [
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "copilot", label: "Copilot" },
              { value: "openclaw", label: "OpenClaw" }
            ]
          },
          { name: "global", label: "Global", type: "switch", flag: "--global", defaultValue: true },
          { name: "memory", label: "Memory", type: "switch", flag: "--memory", defaultValue: true },
          { name: "port", label: "Port", type: "number", flag: "--port", defaultValue: "8787", min: 1, max: 65535 }
        ]
      }
    ]
  },
  {
    id: "learn",
    route: "learn",
    title: "Learn",
    tagline: "Failure learning",
    description: "Mine past agent sessions for recurring tool failures and generate reusable guidance.",
    icon: Bot,
    accent: "#9333ea",
    examples: ["headroom learn", "headroom learn --agent codex --all", "headroom learn --project /repo --apply"],
    actions: [
      {
        id: "dry-run",
        label: "Analyze",
        description: "Run a dry analysis without writing memory/context files.",
        args: ["learn"],
        fields: [
          { name: "project", label: "Project", type: "path", flag: "--project", placeholder: "/path/to/project" },
          {
            name: "agent",
            label: "Agent",
            type: "select",
            flag: "--agent",
            defaultValue: "auto",
            options: [
              { value: "auto", label: "Auto" },
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "gemini", label: "Gemini" }
            ]
          },
          { name: "all", label: "All projects", type: "switch", flag: "--all" }
        ],
        variant: "passive"
      },
      {
        id: "apply",
        label: "Analyze and apply",
        description: "Write recommendations to agent memory/context files.",
        args: ["learn"],
        fields: [
          { name: "apply", label: "Apply changes", type: "switch", flag: "--apply", defaultValue: true },
          { name: "project", label: "Project", type: "path", flag: "--project", placeholder: "/path/to/project" },
          {
            name: "agent",
            label: "Agent",
            type: "select",
            flag: "--agent",
            defaultValue: "auto",
            options: [
              { value: "auto", label: "Auto" },
              { value: "codex", label: "Codex" },
              { value: "claude", label: "Claude" },
              { value: "gemini", label: "Gemini" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mcp",
    route: "mcp",
    title: "MCP",
    tagline: "Retrieval tools",
    description: "Install and check the Headroom MCP server used for compressed content retrieval.",
    icon: Network,
    accent: "#15803d",
    examples: ["headroom mcp status", "headroom mcp install", "headroom mcp uninstall"],
    actions: [
      { id: "status", label: "Status", description: "Check MCP configuration status.", args: ["mcp", "status"], variant: "passive" },
      { id: "install", label: "Install", description: "Install MCP server configuration.", args: ["mcp", "install"] },
      { id: "uninstall", label: "Uninstall", description: "Remove MCP server configuration.", args: ["mcp", "uninstall"], variant: "danger" }
    ]
  },
  {
    id: "tools",
    route: "tools",
    title: "Tools",
    tagline: "Bundled binaries",
    description: "Manage the bundled ast-grep, difftastic, and scc tool cache.",
    icon: Wrench,
    accent: "#475569",
    examples: ["headroom tools doctor", "headroom tools install", "headroom tools list"],
    actions: [
      { id: "doctor", label: "Doctor", description: "Check every bundled tool.", args: ["tools", "doctor"], variant: "passive" },
      { id: "list", label: "List", description: "Print the tool registry.", args: ["tools", "list"], variant: "passive" },
      { id: "install", label: "Install", description: "Pre-fetch all bundled tools.", args: ["tools", "install"] }
    ]
  },
  {
    id: "perf",
    route: "perf",
    title: "Perf",
    tagline: "Proxy analytics",
    description: "Analyze proxy logs for token savings, cache hits, routing, and recommendations.",
    icon: Gauge,
    accent: "#ea580c",
    examples: ["headroom perf --hours 24", "headroom perf --format json", "headroom perf --raw"],
    actions: [
      {
        id: "analyze",
        label: "Analyze logs",
        description: "Generate a performance report from recent proxy logs.",
        args: ["perf"],
        fields: [
          { name: "hours", label: "Hours", type: "number", flag: "--hours", defaultValue: "168", min: 1 },
          {
            name: "format",
            label: "Format",
            type: "select",
            flag: "--format",
            defaultValue: "text",
            options: [
              { value: "text", label: "Text" },
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" }
            ]
          },
          { name: "raw", label: "Raw records", type: "switch", flag: "--raw" }
        ],
        variant: "passive"
      }
    ]
  },
  {
    id: "loc",
    route: "loc",
    title: "LOC",
    tagline: "Code shape",
    description: "Run scc through Headroom for fast lines-of-code and complexity inspection.",
    icon: ChartNoAxesCombined,
    accent: "#0d9488",
    examples: ["headroom loc .", "headroom loc --by-file src", "headroom loc --format json ."],
    actions: [
      {
        id: "count",
        label: "Count code",
        description: "Inspect language and complexity totals for a path.",
        args: ["loc"],
        fields: [
          { name: "path", label: "Path", type: "path", positional: true, defaultValue: "." },
          {
            name: "format",
            label: "Format",
            type: "select",
            flag: "--format",
            defaultValue: "tabular",
            options: [
              { value: "tabular", label: "Table" },
              { value: "wide", label: "Wide" },
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" }
            ]
          },
          { name: "byFile", label: "By file", type: "switch", flag: "--by-file" }
        ],
        variant: "passive"
      }
    ]
  },
  {
    id: "sg",
    route: "sg",
    title: "AST Search",
    tagline: "Structural search",
    description: "Run ast-grep for syntax-aware search and rewrite workflows.",
    icon: SearchCode,
    accent: "#16a34a",
    examples: ["headroom sg run --pattern 'console.log($A)' --lang ts", "headroom sg scan"],
    actions: [
      {
        id: "run",
        label: "Run search",
        description: "Search a path for a structural pattern.",
        args: ["sg", "run"],
        fields: [
          { name: "pattern", label: "Pattern", type: "text", flag: "--pattern", placeholder: "console.log($A)" },
          { name: "lang", label: "Language", type: "text", flag: "--lang", placeholder: "ts" },
          { name: "path", label: "Path", type: "path", positional: true, defaultValue: "." }
        ],
        variant: "passive"
      },
      { id: "scan", label: "Scan config", description: "Run configured ast-grep rules.", args: ["sg", "scan"], variant: "passive" }
    ]
  },
  {
    id: "diff",
    route: "diff",
    title: "Diff",
    tagline: "Structural diff",
    description: "Run difftastic for syntax-aware comparisons between files or directories.",
    icon: Diff,
    accent: "#db2777",
    examples: ["headroom diff old.ts new.ts", "headroom diff --display inline before after"],
    actions: [
      {
        id: "diff",
        label: "Compare",
        description: "Compare two paths with structural awareness.",
        args: ["diff"],
        fields: [
          { name: "old", label: "Old path", type: "path", positional: true },
          { name: "new", label: "New path", type: "path", positional: true },
          {
            name: "display",
            label: "Display",
            type: "select",
            flag: "--display",
            defaultValue: "inline",
            options: [
              { value: "inline", label: "Inline" },
              { value: "side-by-side", label: "Side by side" },
              { value: "json", label: "JSON" }
            ]
          }
        ],
        variant: "passive"
      }
    ]
  },
  {
    id: "capture",
    route: "capture",
    title: "Capture",
    tagline: "Network investigations",
    description: "Compare direct and Headroom MITM network capture JSONL files.",
    icon: Activity,
    accent: "#0284c7",
    examples: ["headroom capture network-diff direct.jsonl headroom.jsonl"],
    actions: [
      {
        id: "network-diff",
        label: "Network diff",
        description: "Compare two network capture files.",
        args: ["capture", "network-diff"],
        fields: [
          { name: "direct", label: "Direct JSONL", type: "path", positional: true },
          { name: "headroom", label: "Headroom JSONL", type: "path", positional: true }
        ],
        variant: "passive"
      }
    ]
  },
  {
    id: "evals",
    route: "evals",
    title: "Evals",
    tagline: "Memory benchmarks",
    description: "Run Headroom memory evaluation benchmarks and offline retention probes.",
    icon: FlaskConical,
    accent: "#7c2d12",
    examples: ["headroom evals memory", "headroom evals memory-v2", "headroom evals probes"],
    actions: [
      {
        id: "eval",
        label: "Run eval",
        description: "Run a selected memory evaluation command.",
        args: ["evals"],
        fields: [
          {
            name: "suite",
            label: "Suite",
            type: "select",
            positional: true,
            defaultValue: "memory",
            options: [
              { value: "memory", label: "LoCoMo memory" },
              { value: "memory-v2", label: "LoCoMo V2" },
              { value: "probes", label: "Retention probes" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "agent-savings",
    route: "agent-savings",
    title: "Agent Savings",
    tagline: "Savings profiles",
    description: "Render or verify Codex, Claude, and Cursor token-savings settings.",
    icon: CircleDot,
    accent: "#4d7c0f",
    examples: ["headroom agent-savings --format shell", "headroom agent-savings --check-perf --hours 24"],
    actions: [
      {
        id: "render",
        label: "Render profile",
        description: "Print profile environment settings.",
        args: ["agent-savings"],
        fields: [
          { name: "profile", label: "Profile", type: "text", flag: "--profile", defaultValue: "agent-90" },
          {
            name: "format",
            label: "Format",
            type: "select",
            flag: "--format",
            defaultValue: "shell",
            options: [
              { value: "shell", label: "Shell" },
              { value: "json", label: "JSON" }
            ]
          }
        ],
        variant: "passive"
      },
      {
        id: "check",
        label: "Check performance",
        description: "Verify recent proxy logs against a savings target.",
        args: ["agent-savings"],
        fields: [
          { name: "check", label: "Check perf", type: "switch", flag: "--check-perf", defaultValue: true },
          { name: "hours", label: "Hours", type: "number", flag: "--hours", defaultValue: "24", min: 1 },
          { name: "agents", label: "Required agents", type: "text", flag: "--require-agents", placeholder: "codex,claude,cursor" }
        ],
        variant: "passive"
      }
    ]
  }
];

export const commandMap = new Map(commands.map((command) => [command.route, command]));

export const navCommands = commands;

export const dashboardStats = [
  { label: "Command pages", value: commands.length.toString(), icon: Layers3 },
  { label: "Setup checks", value: "4", icon: PackageCheck },
  { label: "Managed proxy", value: "Local", icon: TerminalSquare },
  { label: "CLI coverage", value: "100%", icon: Code2 }
];
