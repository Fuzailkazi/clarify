import { z } from "zod";

const MAX_PULSE_WORDS = 250;

export const pulseSchema = z.object({
  summary: z.string().min(1),
  observation: z.string().min(1),
  actions: z.array(z.string().min(1)).max(5),
});

export type Pulse = z.infer<typeof pulseSchema>;

export const feeExplanationSchema = z.object({
  feeName: z.string().min(1),
  explanation: z.string().min(1),
  officialSources: z.array(z.object({ title: z.string().min(1), url: z.string().url() })).max(3),
});

export type FeeExplanation = z.infer<typeof feeExplanationSchema>;

export { MAX_PULSE_WORDS };

type ThemeInput = {
  name: string;
  count: number;
  summary: string;
  quotes: string[];
};

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateToWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

export function buildPulsePrompt(
  batchName: string,
  themes: ThemeInput[],
  feeConfusion: { feeName: string | null; explanation: string | null }
): string {
  const themeList = themes
    .map((t, i) => `${i + 1}. ${t.name} (${t.count} reviews) — ${t.summary}\n   Quotes: ${t.quotes.map((q) => `"${q}"`).join(" ")}`)
    .join("\n");

  return `You are a product manager writing a concise weekly product pulse for internal stakeholders based on customer reviews.

THEMES THIS WEEK:
${themeList}
${feeConfusion.feeName ? `FEE CONFUSION: "${feeConfusion.feeName}" — ${feeConfusion.explanation ?? ""}` : ""}

WRITE THE WEEKLY PULSE:
- summary: A tight executive summary of what customers are saying (max 120 words).
- observation: The single most important trend or insight from this batch.
- actions: 2-4 concrete, specific action ideas for the product team.

CONSTRAINTS:
- The ENTIRE pulse is concise: summary + observation + actions must total a maximum of 250 words.
- Be specific and evidence-backed. Use review language where possible.
- Do not invent facts not present in the themes.

Return JSON exactly matching this schema:
{
  "summary": string,
  "observation": string,
  "actions": string[]
}`;
}

export function buildFeePrompt(
  feeName: string,
  themeSummary: string,
  quotedReviews: string[]
): string {
  const quotes = quotedReviews.map((q) => `"${q}"`).join("\n");

  return `You are a customer support knowledge writer for a fintech app.

CUSTOMER CONFUSION: Customers repeatedly complain about "${feeName}" when redeeming mutual funds:
${quotes}

THEME SUMMARY: ${themeSummary}

Write a clear, reusable support explanation that support agents can copy into customer conversations.

RULES (never violate):
- FACTUAL and NEUTRAL tone. No opinion, no blame, no financial advice.
- Explain what "${feeName}" is and the common scenario, using plain language a customer understands.
- Keep it concise (max 120 words).
- Provide up to 3 official public reference sources (e.g. SEBI, AMFI, the app's own help center) with title and https URL.

Return JSON exactly matching this schema:
{
  "feeName": string,
  "explanation": string,
  "officialSources": [ { "title": string, "url": string } ]
}`;
}