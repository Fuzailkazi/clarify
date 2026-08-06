import { z } from "zod";

export const themeBatchSchema = z.object({
  feeConfusion: z.object({
    detected: z.boolean(),
    feeName: z.string().nullable(),
    explanation: z.string().nullable(),
  }),
  themes: z
    .array(
      z.object({
        name: z.string().min(1),
        count: z.number().int().min(1),
        summary: z.string().min(1),
        quotes: z.array(z.string().min(1)).max(3),
      })
    )
    .max(5),
});

export type AnalysisBatch = z.infer<typeof themeBatchSchema>;

export function buildAnalysisPrompt(
  reviews: { text: string; rating: number | null }[],
  heuristicThemes: { name: string; count: number }[]
): string {
  const reviewList = reviews
    .map((r, i) => `${i + 1}. ${r.text.trim()}`)
    .join("\n");

  const heuristicList = heuristicThemes
    .map((t) => `- ${t.name} (${t.count} reviews)`)
    .join("\n");

  return `You are a product insights analyst. Analyze the customer reviews below and identify up to 5 recurring themes.

ROLE REQUIREMENTS:
- Focus on what customers repeatedly complain about or ask about.
- Name each theme with a short, specific label (e.g. "Exit load confusion" not "Fees").
- count = number of reviews that clearly fit the theme.
- quotes = 1-3 short verbatim representative quotes (trim to one sentence, keep exact wording).
- Identify ONE recurring fee or charge confusion if present. If none, detected=false.
- Do not invent issues that are not in the reviews.

PRELIMINARY HEURISTIC CLUES (deterministic keyword clusters; verify and refine, do not just repeat):
${heuristicList}

REVIEWS:
${reviewList}

Return JSON matching this schema:
{
  "feeConfusion": { "detected": boolean, "feeName": string|null, "explanation": string|null },
  "themes": [ { "name": string, "count": number, "summary": string, "quotes": string[] } ]
}`;
}