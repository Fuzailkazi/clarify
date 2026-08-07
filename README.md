# Clarify

AI-powered Product Insights and Support Intelligence Copilot.

Clarify transforms raw customer reviews into actionable product intelligence and reusable customer communication. It clusters reviews into themes, identifies recurring fee-related confusion, generates a weekly product pulse and a standardized support explanation, and — after explicit user approval — logs insights to an internal knowledge base and prepares a Gmail draft.

## Stack

- **Frontend / API:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (NeonDB) via Prisma 7
- **AI:** Google Gemini (`@google/genai`) with structured JSON output + Zod validation
- **Integrations:** MCP (Notion + Gmail) behind an interface, mock-backed for dev

## Getting started

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000.

### Environment variables (`.env.local`, never committed)

```
DATABASE_URL=postgresql://...            # required (NeonDB)
GEMINI_API_KEY=AIza...                   # required for real LLM (Google AI Studio)
LLM_MOCK=true                            # optional: deterministic fixtures, no tokens
INTEGRATIONS_MODE=mcp                    # optional: use real MCP servers instead of mock
NOTION_MCP_COMMAND=npx                   # optional: Notion MCP server (stdio)
NOTION_MCP_ARGS="-y some-notion-mcp"     # optional
NOTION_MCP_TOOL=append_to_notion         # optional, default
NOTION_MCP_PAGE=<page-id>                # optional target page
GMAIL_MCP_COMMAND=npx                    # optional: Gmail MCP server (stdio)
GMAIL_MCP_ARGS="-y some-gmail-mcp"       # optional
GMAIL_MCP_TOOL=create_draft              # optional, default
GMAIL_MCP_TO=team@example.com            # optional draft recipient
```

With no integration env vars set, execution runs in **mock mode** (dry-run, logged, no external writes).

## Pipeline

```
Upload CSV → Analyze (Gemini themes + fee confusion) → Generate (pulse + fee explanation)
→ Review & Approve (explicit) → Execute (Notion append + Gmail draft)
```

Status per batch: `uploaded → analyzed → generated → awaiting_approval → executed`.
The approval gate is **server-enforced**: the execute endpoint returns `403` unless an explicit `Approval` row exists in the database. Executions are idempotent — a target with an existing success log is skipped on retry.

## Demo runbook (end-to-end)

1. Start with `LLM_MOCK=true` (no tokens) or a real `GEMINI_API_KEY`.
2. **Home** → click **Try sample CSV** (exit-load scenario, 30 reviews) — or upload your own `text,rating` CSV.
3. You land on the batch page: **Cluster themes** → themes + fee-confusion appear (pipeline step 2 lights up).
4. **Generate pulse & explanation** → weekly pulse (≤250 words) + neutral fee explanation with official sources.
5. Review the output, enter your name, tick "I have reviewed the output", **Approve & unlock**.
6. **Execute (Notion + Gmail)** → integration log shows per-target success + external IDs; status → `executed`. Re-running execute skips already-done targets.
7. To test the approval gate: on a fresh batch, call `POST /api/batches/:id/execute` directly — returns `403` before approval.

### Success-metrics checklist

- [ ] Upload a CSV → reviews stored, no manual entry
- [ ] Recurring fee confusion detected automatically (exit load in the sample)
- [ ] Weekly pulse ≤ 250 words, no manual editing
- [ ] Reusable support explanation with official source links
- [ ] Execute blocked until explicit approval; approval persisted (survives refresh)
- [ ] Approved batch appends to Notion + creates Gmail draft (mock or real), logged, no duplicates

## Commands

| Task | Command |
| --- | --- |
| Typecheck | `npx tsc --noEmit` |
| Build | `npx next build` |
| Dev | `npm run dev` |
| Sync DB schema | `npx prisma db push` |

## Build plan

See [phases.md](phases.md) for the phase-by-phase build roadmap.
