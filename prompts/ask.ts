import { z } from "zod";

export const askSchema = z.object({
  answer: z.string().min(1),
});

export type AskResult = z.infer<typeof askSchema>;

const MAX_REVIEW_CHARS = 12_000;
const MAX_ANSWER_WORDS = 150;

export function buildAskPrompt(
  question: string,
  reviews: { text: string; rating: number | null }[]
): string {
  const sampled: string[] = [];
  let used = 0;
  for (const r of reviews) {
    const line = `${sampled.length + 1}. ${r.text.trim()}${r.rating !== null ? ` [rating ${r.rating}/5]` : ""}`;
    if (used + line.length > MAX_REVIEW_CHARS) break;
    sampled.push(line);
    used += line.length;
  }
  const shown = sampled.length < reviews.length ? ` (first ${sampled.length} of ${reviews.length} reviews shown)` : "";

  return `You are a product insights analyst answering a question about a batch of customer reviews. Ground your answer ONLY in the reviews below.

REVIEWS${shown}:
${sampled.join("\n")}

QUESTION: ${question}

RULES (never violate):
- Answer only from the reviews. If the reviews do not contain the information, say so explicitly instead of guessing.
- Cite evidence: name the recurring themes and give rough counts of how many reviews support the point.
- Keep the answer under ${MAX_ANSWER_WORDS} words, plain and direct.
- Do not invent quotes. Short verbatim fragments are fine if they appear in the reviews.

Return JSON exactly matching this schema:
{
  "answer": string
}`;
}
