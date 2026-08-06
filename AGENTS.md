# Clarify — Project Brief

## What it is
AI-powered Product Insights and Support Intelligence Copilot. Converts raw customer reviews into (1) internal product intelligence (weekly pulse) and (2) reusable customer-facing support explanations (fee confusion), then — after explicit user approval — logs to Notion and creates a Gmail draft.

## Stack (decided)
- Next.js 16 App Router + TypeScript + Tailwind v4, no src-dir (`app/`)
- PostgreSQL (NeonDB) + Prisma 7 (`prisma.config.ts`, driver adapter in `lib/db.ts`, client in `lib/generated/prisma`)
- Google Gemini via `@google/genai` (JSON mode, Zod validation). `LLM_MOCK=true` runs fixtures, no tokens
- MCP integrations for Notion + Gmail behind `integrations/` interface (mock default in dev)

## Build rules
- Phases: P0 scaffold → P1 upload → P2 deterministic themes → P3 Gemini → P4 pulse+explanation → P5 approval gate → P6 Notion → P7 Gmail → P8 polish. Each ends demoable.
- Pipeline state machine per review batch lives in DB (status: uploaded → themed → analyzed → generated → awaiting_approval → executed)
- Approval gate is server-enforced: execute endpoints blocked until an explicit `Approval` row exists
- Secrets only in `.env` / `.env.local` (both gitignored). Never log or echo credentials.
- CLI commands for this project are `npx tsc --noEmit`, `npx next build`, `npx prisma db push`/`prisma migrate`.

## Key constraints (never violate)
- Max 5 themes, top 3, representative quotes; weekly pulse <= 250 words (enforced in validation, not just prompt)
- Fee explanation: factual, neutral, no financial advice, links official sources
- Reviews only from public sources (sample in `data/sample-reviews.csv`)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->