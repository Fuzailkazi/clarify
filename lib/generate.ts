import { generateStructured } from "@/lib/llm";
import {
  buildFeePrompt,
  buildPulsePrompt,
  feeExplanationSchema,
  pulseSchema,
  wordCount,
  MAX_PULSE_WORDS,
} from "@/prompts/generate";
import type { FeeExplanation, Pulse } from "@/prompts/generate";
import { mockPulse, mockFeeExplanation } from "@/lib/mock";

export type PulseInput = {
  name: string;
  count: number;
  summary: string;
  quotes: string[];
};

export type GenerateResult = {
  pulse: Pulse;
  fee: FeeExplanation | null;
  pulseWordCount: number;
};

function enforceWordCount(pulse: Pulse): Pulse {
  const parts = [pulse.summary, pulse.observation, ...pulse.actions];
  const total = parts.reduce((sum, p) => sum + wordCount(p), 0);
  if (total <= MAX_PULSE_WORDS) return pulse;

  const actions = pulse.actions;
  while (
    actions.length > 0 &&
    wordCount(pulse.summary) + wordCount(pulse.observation) +
      actions.reduce((sum, a) => sum + wordCount(a), 0) >
      MAX_PULSE_WORDS
  ) {
    actions.pop();
  }
  return { ...pulse, actions };
}

export async function generateIntelligence(
  batchName: string,
  themes: PulseInput[],
  feeConfirmed: { detected: boolean; name: string | null; explanation: string | null } | null
): Promise<GenerateResult> {
  const pulsePrompt = buildPulsePrompt(batchName, themes, {
    feeName: feeConfirmed?.detected ? feeConfirmed.name : null,
    explanation: feeConfirmed?.explanation ?? null,
  });

  const { data: rawPulse, mock: pulseMock } = await generateStructured(
    pulseSchema,
    pulsePrompt,
    mockPulse
  );

  const pulse = enforceWordCount(rawPulse);

  let fee: FeeExplanation | null = null;
  if (feeConfirmed?.detected && feeConfirmed.name) {
    const feePrompt = buildFeePrompt(
      feeConfirmed.name,
      themes[0]?.summary ?? "",
      themes[0]?.quotes ?? []
    );
    const { data: feeData } = await generateStructured(
      feeExplanationSchema,
      feePrompt,
      mockFeeExplanation
    );
    fee = feeData;
  }

  return {
    pulse,
    fee,
    pulseWordCount: [pulse.summary, pulse.observation, ...pulse.actions].reduce(
      (sum, p) => sum + wordCount(p),
      0
    ),
  };
}