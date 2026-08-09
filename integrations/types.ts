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

export type SlackInput = {
  batchId: string;
  batchName: string;
  pulse: PulseContent;
  fee: FeeContent | null;
};

export type GoogleDocsInput = {
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
  postToSlack(input: SlackInput): Promise<IntegrationResult>;
  appendToGoogleDoc(input: GoogleDocsInput): Promise<IntegrationResult>;
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

export function renderSlackMessage(pulse: PulseContent, fee: FeeContent | null): string {
  const link = (s: { title: string; url: string }) =>
    `<${s.url}|${s.title}>`;
  const sources = fee
    ? fee.officialSources.map((s) => `- ${link(s)}`).join("\n")
    : "";
  const feePart = fee
    ? `*${fee.feeName}*\n${fee.explanation}\n\n*Official sources*\n${sources}`
    : "";
  const themeLines = pulse.topThemes.map((t) => `• ${t.name} (${t.count} reviews)`).join("\n");
  return [
    `*Weekly Product Pulse*`,
    `*Summary*\n${pulse.summary}`,
    `*Observation*\n${pulse.observation}`,
    `*Actions*\n${pulse.actions.map((a) => `• ${a}`).join("\n")}`,
    `*Themes*\n${themeLines}`,
    fee ? `---\n${feePart}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function renderFeeMarkdown(fee: FeeContent): string {
  const sources = fee.officialSources
    .map((s) => `- [${s.title}](${s.url})`)
    .join("\n");
  return `**${fee.feeName}**\n${fee.explanation}\n\n**Official sources**\n${sources}`;
}