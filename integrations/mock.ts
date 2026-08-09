import type {
  GmailInput,
  GoogleDocsInput,
  IntegrationResult,
  NotionInput,
  ReviewIntegration,
  SlackInput,
} from "./types";
import { renderFeeMarkdown, renderPulseMarkdown, renderSlackMessage } from "./types";

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
    const to = process.env.GMAIL_MCP_TO ?? "team@clarify.test";
    const body = [
      renderPulseMarkdown(input.pulse),
      "",
      input.fee ? `---\n${renderFeeMarkdown(input.fee)}` : "",
      "",
      `_batch ${input.batchId} · mock mode_`,
    ].join("\n");

    console.log("[integrations:mock] Gmail draft (dry-run):", { to, subject, body });
    return {
      ok: true,
      externalId: `mock-gmail-${input.batchId}`,
    };
  }

  async postToSlack(input: SlackInput): Promise<IntegrationResult> {
    const channel = process.env.SLACK_MCP_CHANNEL ?? "#general";
    const body = renderSlackMessage(input.pulse, input.fee);

    console.log("[integrations:mock] Slack post (dry-run):", { channel, body });
    return {
      ok: true,
      externalId: `mock-slack-${input.batchId}`,
    };
  }

  async appendToGoogleDoc(input: GoogleDocsInput): Promise<IntegrationResult> {
    const documentId = process.env.GDOCS_MCP_DOCUMENT_ID ?? "mock-doc-id";
    const body = [
      `# ${input.batchName} — Weekly Pulse`,
      `_batch ${input.batchId} · mock mode_`,
      "",
      renderPulseMarkdown(input.pulse),
      input.fee ? "" + renderFeeMarkdown(input.fee) : "",
    ].join("\n");

    console.log("[integrations:mock] Google Docs append (dry-run):", { documentId, body });
    return {
      ok: true,
      externalId: `mock-gdocs-${input.batchId}`,
    };
  }
}