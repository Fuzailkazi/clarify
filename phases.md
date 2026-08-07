# Clarify — Build Phases

**Stack:** Next.js (App Router) + TypeScript · PostgreSQL (NeonDB) + Prisma · Google Gemini · MCP (Notion + Gmail)
**Rule:** Every phase ends demoable and verified (`tsc --noEmit` + `next build` + `prisma migrate`).

## Phase 0 — Foundation (scaffold)
- [ ] `npx create-next-app` (TS, App Router, Tailwind, no src-dir)
- [ ] Init git, add `.gitignore` with `.env.local`
- [ ] Write `.env.local` with `DATABASE_URL`, `GEMINI_API_KEY` (never committed)
- [ ] Write `AGENTS.md` — project brief, build rules, commands, constraints
- [ ] Install Prisma, wire NeonDB connection, `prisma db push`
- [ ] Write `data/sample-reviews.csv` (mutual-fund exit-load scenario, ~30 reviews)
- **Done when:** `next build` passes, DB reachable, sample CSV committed

## Phase 1 — Data model + upload
- [x] Prisma schema: `ReviewBatch`, `Review`, `Theme`, `Pulse`, `FeeExplanation`, `Approval`, `IntegrationLog` (batch status state machine)
- [x] `POST /api/batches` — CSV upload + parse + persist reviews
- [x] Simple upload UI (file picker → batch list)
- [x] `GET /api/batches/:id` — batch detail with status
- **Done when:** upload a CSV in UI, reviews visible in NeonDB

## Phase 2 — Review intelligence (deterministic, no LLM)
- [x] Heuristic theme clustering (keyword groups: fees, bugs, UX, pricing, support)
- [x] Top-3 themes + representative quotes
- [x] Theme table UI on batch detail page
- **Done when:** upload → see themes offline, zero tokens spent

## Phase 3 — Gemini intelligence layer
- [x] `lib/llm.ts` — `@google/genai` wrapper: JSON mode, Zod validation, 1 retry on failure, `LLM_MOCK=true` fixture mode
- [x] Prompt modules: theme analysis (≤5 themes, top 3, quotes) — `prompts/analyze.ts`
- [x] Wire `/api/batches/:id/analyze` — heuristic pass + LLM refine
- [x] Verify Gemini key works (or fall back to mock) — ✅ real Gemini live-tested (exit-load fee confusion detected)
- **Done when:** real LLM themes shown in Next

## Phase 4 — Pulse + fee explanation
- [x] Prompt modules: weekly pulse (≤250 words, enforced in validation) + fee explanation (factual, neutral, no financial advice, official sources field)
- [x] `POST /api/batches/:id/generate`
- [x] Review UI: themes + pulse + explanation rendered for approval
- **Done when:** full generated output reviewable in UI

## Phase 5 — Approval gate
- [x] `Approval` model — explicit consent recorded (who/when)
- [x] `POST /api/batches/:id/approve` — server-side gate; execute blocked until approved
- [x] UI: "Review & Approve" screen, disabled actions until approved
- [x] Approval survives refresh (NeonDB)
- **Done when:** cannot execute without an explicit approval in DB

## Phase 6 — Integrations: Notion (MCP)
- [x] `integrations/` interface: `appendToNotion` + `createGmailDraft`
- [x] `mock.ts` implementation (logs instead of writing) — default in dev
- [x] `mcp.ts` — `@modelcontextprotocol/sdk` stdio client, env-gated (`NOTION_MCP_COMMAND`, `INTEGRATIONS_MODE=mcp`)
- [x] `IntegrationLog` idempotency — one append per batch, no duplicates on retry
- **Done when:** approved batch appends to Notion (mock verified; real MCP awaits `NOTION_MCP_COMMAND` env)

## Phase 7 — Integrations: Gmail draft (MCP)
- [x] Connect Gmail MCP, `createGmailDraft(subject, body, to)` — `GMAIL_MCP_COMMAND`/`GMAIL_MCP_TOOL` env-gated
- [x] Execute step: Notion append + Gmail draft in one action, failures surfaced in UI (per-target log)
- [x] Failure handling: failed target logged, batch not marked executed
- **Done when:** approved batch creates a real (or mocked) Gmail draft

## Phase 8 — Polish & demo runbook
- [ ] Empty/error/loading states, retry UX
- [ ] Success-metrics checklist demo: upload → insights → approve → Notion + Gmail
- [ ] README with setup + demo steps
- **Done when:** end-to-end demo without manual edits, per success metrics