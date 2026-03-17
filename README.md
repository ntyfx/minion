# Minion Chat

A game operations AI agent chat interface built with Next.js, Ant Design, and Ant Design X.

## Features

- Real-time streaming chat via Server-Sent Events (SSE)
- Markdown rendering with syntax highlighting
- AI reasoning/thinking visualization
- Multi-session conversation management
- Activity feed for debugging SSE events
- Light/dark theme switching
- Responsive sidebar with collapsible groups

## Tech Stack

- **Framework:** Next.js 16 (App Router, static export)
- **UI:** Ant Design 6, Ant Design X
- **Styling:** Tailwind CSS v4, CSS custom properties
- **Language:** TypeScript
- **Testing:** Vitest + React Testing Library, Playwright (E2E)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Open **Settings** (gear icon in the header) to configure:

- **API Base URL** — your running minion server endpoint
- **Access Token** — Bearer token for authentication

Settings are persisted in `localStorage`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (static export to `out/`) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test run` | Run unit tests once |
| `pnpm test:e2e` | Run E2E tests (Playwright) |

## Deployment

The project deploys to GitHub Pages automatically on push to `main` via GitHub Actions.

The CI pipeline runs lint, type check, unit tests, and dependency audit before building and deploying.

Live: [https://ntyfx.github.io/minion/](https://ntyfx.github.io/minion/)

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and layout
│   ├── layout.tsx        # Root layout with fonts and theme script
│   ├── page.tsx          # Main page composing all panels
│   ├── antd-provider.tsx # Ant Design + theme config
│   └── globals.css       # CSS variables, overrides, markdown styles
├── components/           # React components
│   ├── chat-panel.tsx    # Chat bubbles, markdown, thinking content
│   ├── sidebar.tsx       # Conversation list with groups
│   ├── activity-feed.tsx # SSE event inspector drawer
│   ├── settings-panel.tsx# Settings drawer
│   ├── tools-status.tsx  # Skills/tools status popover
│   └── error-boundary.tsx# Error boundary wrapper
├── hooks/                # Custom React hooks
│   ├── use-chat-sessions.ts  # Session CRUD and persistence
│   ├── use-streaming.ts      # SSE streaming and message handling
│   └── use-rename-modal.ts   # Rename modal state
├── lib/                  # Utilities
│   ├── sse-client.ts     # SSE parser, streamChat, fetchSkills
│   ├── sessions.ts       # localStorage session persistence
│   ├── settings.ts       # localStorage settings persistence
│   └── theme.tsx         # Theme context and provider
└── types/
    └── chat.ts           # Shared TypeScript interfaces
```

## License

MIT
