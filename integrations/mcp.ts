import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  GmailInput,
  IntegrationResult,
  NotionInput,
  ReviewIntegration,
} from "./types";
import { renderFeeMarkdown, renderPulseMarkdown } from "./types";

const NOTION_TOOL = process.env.NOTION_MCP_TOOL ?? "append_to_notion";
const GMAIL_TOOL = process.env.GMAIL_MCP_TOOL ?? "create_draft";

function mcpCommand(name: string): string[] | null {
  const command = process.env[`${name}_MCP_COMMAND`];
  if (!command) return null;
  return [command, ...(process.env[`${name}_MCP_ARGS`]?.split(" ").filter(Boolean) ?? [])];
}

class McpClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(private serverName: string) {}

  async connect(): Promise<Client> {
    if (this.client) return this.client;
    const cmd = mcpCommand(this.serverName);
    if (!cmd) throw new Error(`MCP not configured: set ${this.serverName}_MCP_COMMAND`);

    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined && k.startsWith(`${this.serverName}_MCP_`)) env[k] = v;
    }

    this.transport = new StdioClientTransport({
      command: cmd[0],
      args: cmd.slice(1),
      env,
    });
    const client = new Client(
      { name: `clarify-${this.serverName.toLowerCase()}`, version: "0.1.0" },
      { capabilities: {} }
    );
    await client.connect(this.transport);
    this.client = client;
    return client;
  }

  async callTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
    const client = await this.connect();
    const result = await client.callTool({ name: tool, arguments: args });
    const text = Array.isArray(result.content)
      ? result.content
          .map((c) => (c.type === "text" ? c.text : JSON.stringify(c)))
          .join("\n")
      : JSON.stringify(result);
    return text;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.transport = null;
  }
}

export class McpIntegration implements ReviewIntegration {
  private notion = new McpClient("NOTION");
  private gmail = new McpClient("GMAIL");

  async appendToNotion(input: NotionInput): Promise<IntegrationResult> {
    const body = [
      `# ${input.batchName} — Weekly Pulse`,
      renderPulseMarkdown(input.pulse),
      input.fee ? `---\n${renderFeeMarkdown(input.fee)}` : "",
    ].join("\n\n");

    try {
      const externalId = await this.notion.callTool(NOTION_TOOL, {
        content: body,
        page: process.env.NOTION_MCP_PAGE,
        parent: process.env.NOTION_MCP_PAGE,
      });
      return { ok: true, externalId: String(externalId) };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async createGmailDraft(input: GmailInput): Promise<IntegrationResult> {
    const subject = `Weekly Product Pulse — ${input.batchName}`;
    const body = [
      renderPulseMarkdown(input.pulse),
      input.fee ? `---\n${renderFeeMarkdown(input.fee)}` : "",
    ].join("\n\n");

    try {
      const externalId = await this.gmail.callTool(GMAIL_TOOL, {
        subject,
        body,
        to: process.env.GMAIL_MCP_TO,
      });
      return { ok: true, externalId: String(externalId) };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async close(): Promise<void> {
    await this.notion.close();
    await this.gmail.close();
  }
}