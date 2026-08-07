import type { ReviewIntegration } from "./types";
import { MockIntegration } from "./mock";
import { McpIntegration } from "./mcp";

let instance: ReviewIntegration | null = null;

export function getIntegration(): ReviewIntegration {
  if (instance) return instance;

  const useMcp =
    process.env.INTEGRATIONS_MODE === "mcp" &&
    Boolean(process.env.NOTION_MCP_COMMAND || process.env.GMAIL_MCP_COMMAND);

  instance = useMcp ? new McpIntegration() : new MockIntegration();
  return instance;
}

export function getIntegrationMode(): "mcp" | "mock" {
  return process.env.INTEGRATIONS_MODE === "mcp" &&
    Boolean(process.env.NOTION_MCP_COMMAND || process.env.GMAIL_MCP_COMMAND)
    ? "mcp"
    : "mock";
}