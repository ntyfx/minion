# Minion Chat

AI-powered operations assistant — combines **analysis & documentation**, **data querying**, and **change execution** across multiple backend systems via a conversational interface.

## Capabilities

### 1. Analysis & Documentation (read-only)

| Scenario | Examples |
|----------|----------|
| Explain system responsibilities | Describe each subsystem's scope and boundaries |
| Draw diagrams | Mermaid flowcharts, sequence diagrams, module maps |
| Walk through workflows | Ad delivery, asset production, campaign creation |
| Compile feature inventories | Break down by module, role, or business phase |
| Compare systems | Side-by-side capability comparison |
| Draft documents | Solution briefs, SOPs, training materials, API docs |

### 2. Query System Data (read)

Read-only queries that return results directly:

- Projects, assets, nodes, graphs, workflows, reviews
- Workspaces, canvases, models, approvals, subscriptions
- Files, folders, search results, metadata
- Campaigns, ad creatives, delivery configurations
- Product packs, templates, products, pricing

### 3. Execute Changes (write)

All mutations generate a plan and **wait for your confirmation** before executing:

- Create / update / delete: campaigns, product packs, assets, tasks, workflow objects, short links, etc.
- Trigger approvals, pushes, archiving, syncing
- **Budget changes** (budget, daily budget, bids) require explicit separate confirmation
- On failure: report only — no automatic rollback

### 4. Cross-System Orchestration

- Break down goals into step-by-step execution plans
- Validate cross-system data flows (e.g. creation → management → archival → delivery)
- Identify missing parameters and prepare confirmation-ready change plans

### Quick Start Guide

Provide these key pieces of information for the fastest results:

| Field | Description |
|-------|-------------|
| Target system | Which backend system to operate on |
| Operation type | Query or mutation |
| Project ID | Application / project identifier |
| Object | Campaign / node / asset / pack / file |
| Goal | What to look up or change |

---

## Product Features

- **Streaming chat** — real-time responses via Server-Sent Events (SSE) with live Markdown rendering
- **Reasoning visualization** — collapsible "Thinking" bubbles showing the AI's chain-of-thought
- **Multi-session conversations** — create, rename, and delete independent sessions with auto-persistence
- **Activity feed** — inspect raw SSE events for debugging and observability
- **6 built-in themes** — Light, Dark, Premium Dark, Latte, Dusk, Dawn with one-click switching
- **Responsive layout** — collapsible sidebar with grouped conversation history (Today / Yesterday / This Week / Earlier)
- **Tools status panel** — view connected backend skills, versions, and health at a glance
- **Flexible configuration** — point to any backend server via Settings (base URL + Bearer token)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, static export) |
| UI | Ant Design 6, Ant Design X |
| Styling | Tailwind CSS v4, CSS custom properties |
| Language | TypeScript (strict) |
| Testing | Vitest + React Testing Library, Playwright (E2E) |
| CI/CD | GitHub Actions → GitHub Pages |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Click the **Settings** gear icon in the header to configure:

- **API Base URL** — backend server endpoint (default `http://localhost:8080`)
- **Access Token** — Bearer token for API authentication

All settings are persisted in `localStorage`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (static export to `out/`) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests (Vitest, watch mode) |
| `pnpm test run` | Run unit tests once |
| `pnpm test:e2e` | Run E2E tests (Playwright) |

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that runs lint, type check, and dependency audit, then builds and deploys to GitHub Pages.

Live: [https://ntyfx.github.io/minion/](https://ntyfx.github.io/minion/)

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout, fonts, theme bootstrap script
│   ├── page.tsx              # Main page — composes sidebar, chat, header
│   ├── antd-provider.tsx     # Ant Design ConfigProvider + dynamic theme tokens
│   └── globals.css           # CSS variables (6 themes), overrides, markdown styles
├── components/
│   ├── chat-panel.tsx        # Chat bubbles, Markdown, thinking content, welcome
│   ├── sidebar.tsx           # Conversation list with time-based groups
│   ├── activity-feed.tsx     # SSE event inspector drawer
│   ├── settings-panel.tsx    # Settings drawer (base URL, access token)
│   ├── tools-status.tsx      # Backend skills/tools status popover
│   ├── theme-picker.tsx      # Multi-theme selector popover
│   └── error-boundary.tsx    # Error boundary wrapper
├── hooks/
│   ├── use-chat-sessions.ts  # Session CRUD and localStorage persistence
│   ├── use-streaming.ts      # SSE streaming, message assembly, reasoning extraction
│   └── use-rename-modal.ts   # Rename modal state management
├── lib/
│   ├── sse-client.ts         # SSE parser, streamChat(), fetchSkills()
│   ├── sessions.ts           # localStorage session helpers
│   ├── settings.ts           # localStorage settings helpers
│   ├── theme.tsx             # ThemeProvider context (multi-theme)
│   └── themes.ts             # Theme registry — IDs, metadata, Ant Design tokens
└── types/
    └── chat.ts               # Shared TypeScript interfaces
```

## License

MIT
