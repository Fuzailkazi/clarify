import type {
  GmailInput,
  IntegrationResult,
  NotionInput,
  ReviewIntegration,
} from "./types";
import { renderFeeMarkdown, renderPulseMarkdown } from "./types";

export class MockIntegration implements ReviewIntegration {
  async appendToNotion(input: NotionInput): Promise<IntegrationResult> {
    const body = [
      `# ${input.batchName} — Weekly Pulse`,
      `_batch ${input.batchId} · mock mode_`,
      "",
      renderPulseMarkdown(input.pulse),
      input.fee ? "" + renderFeeMarkdown(input.fee) : "",
    ].join("\n");

    console.log("[integrations:mock] Notion append (dry-run):", body);
    return {
      ok: true,
      externalId: `mock-notion-${input.batchId}`,
    };
  }

  async createGmailDraft(input: GmailInput): Promise<IntegrationResult> {
    const subject = `Weekly Product Pulse — ${input.batchName}`;
    const body = [
      renderPulseMarkdown(input.pulse),
      "",
      input.fee ? `---\n${renderFeeMarkdown(input.fee)}` : "",
      "",
      `_batch ${input.batchId} · mock mode_`,
    ].join("\n");

    console.log("[integrations:mock] Gmail draft (dry-run):", subject, body);
    return {
      ok: true,
      externalId: `mock-gmail-${input.batchId}`,
    };
  }
}