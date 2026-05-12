# SmartSupport AI

A full-stack SaaS platform where businesses create AI chatbots trained on uploaded documentation, then embed them via a JS widget.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/smartsupport run dev` — run the frontend (port 18493, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `OPENAI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + Clerk auth
- API: Express 5
- DB: PostgreSQL + pgvector + Drizzle ORM
- AI: OpenAI GPT-4o-mini + text-embedding-3-small (RAG)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smartsupport/src/` — React frontend (pages, components, hooks)
- `artifacts/smartsupport/src/pages/` — landing, dashboard, chatbot detail, embed, widget
- `artifacts/api-server/src/routes/` — chatbots, documents, conversations, analytics, widget
- `artifacts/api-server/src/lib/rag.ts` — RAG engine (embed, retrieve, generate)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validators
- `lib/db/src/schema.ts` — DB schema (chatbots, documents, document_chunks, conversations, messages)
- `artifacts/smartsupport/public/widget.js` — embeddable chat widget script

## Architecture decisions

- **RAG with pgvector**: document chunks are embedded with text-embedding-3-small and stored as vector(1536) in document_chunks. Cosine similarity search retrieves top-5 relevant chunks per query.
- **Public widget endpoint**: `/api/widget/:chatbotUid/chat` requires no auth — designed for embed on any 3rd-party website.
- **Clerk proxy at `/api/__clerk`**: proxies Clerk Frontend API through the app domain (for production custom domains).
- **Contract-first API**: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Never hand-write API client code.
- **Dark-first theme**: CSS variables in index.css support both light and dark, defaulting to dark.

## Product

- **Chatbot management**: create, configure, activate/deactivate chatbots with custom names, colors, welcome messages, and system prompts
- **Knowledge base**: upload plain text or URL-sourced documents; auto-chunked and embedded via OpenAI
- **AI chat**: RAG pipeline retrieves relevant context before generating GPT-4o-mini responses
- **Embed widget**: one `<script>` tag drops a floating chat button on any website
- **Analytics**: per-chatbot conversation and message counts
- **Dashboard**: overview stats + chatbot list with quick management

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Run `pnpm --filter @workspace/db run push` after any schema changes
- `tailwindcss({ optimize: false })` NOT needed — standard `tailwindcss()` Vite plugin works with Clerk themes
- The widget page (`/widget/:uid`) is intentionally outside auth — it's the embedded chat UI
- Clerk proxy only activates in production (`NODE_ENV === "production"`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
