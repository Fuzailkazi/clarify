export type PulseContent = {
  summary: string;
  observation: string;
  actions: string[];
  topThemes: { name: string; count: number; rank: number }[];
  wordCount: number;
};

export type FeeContent = {
  feeName: string;
  explanation: string;
  officialSources: { title: string; url: string }[];
};

export type NotionInput = {
  batchId: string;
  batchName: string;
  pulse: PulseContent;
  fee: FeeContent | null;
};

export type GmailInput = {
  batchId: string;
  batchName: string;
  pulse: PulseContent;
  fee: FeeContent | null;
};

export type IntegrationResult = {
  ok: boolean;
  externalId?: string;
  error?: string;
};

export interface ReviewIntegration {
  appendToNotion(input: NotionInput): Promise<IntegrationResult>;
  createGmailDraft(input: GmailInput): Promise<IntegrationResult>;
}

export function renderPulseMarkdown(pulse: PulseContent): string {
  const lines = [
    `**Summary**\n${pulse.summary}`,
    `**Observation**\n${pulse.observation}`,
    "**Actions**",
    ...pulse.actions.map((a) => `- ${a}`),
    `**Themes**`,
    ...pulse.topThemes.map(
      (t) => `- ${t.name} (${t.count} reviews)`
    ),
  ];
  return lines.join("\n");
}

export function renderFeeMarkdown(fee: FeeContent): string {
  const sources = fee.officialSources
    .map((s) => `- [${s.title}](${s.url})`)
    .join("\n");
  return `**${fee.feeName}**\n${fee.explanation}\n\n**Official sources**\n${sources}`;
}