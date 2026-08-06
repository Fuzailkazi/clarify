# Clarify

AI-powered Product Insights and Support Intelligence Copilot.

Clarify transforms raw customer reviews into actionable product intelligence and reusable customer communication. It clusters reviews into themes, identifies recurring fee-related confusion, generates a weekly product pulse and a standardized support explanation, and — after explicit user approval — logs insights to an internal knowledge base and prepares a Gmail draft.

## Stack

- **Frontend / API:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (NeonDB) via Prisma
- **AI:** Google Gemini (structured output)
- **Integrations:** MCP (Notion + Gmail), mock-backed for dev

## Getting started

```bash
npm install
npx prisma db push
npm run dev
```

Required environment variables (in `.env.local`, never committed):

```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
```

Set `LLM_MOCK=true` to run the full pipeline with deterministic fixtures (no token spend).

## Build plan

See [phases.md](phases.md) for the phase-by-phase build roadmap.