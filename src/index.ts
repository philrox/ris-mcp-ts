#!/usr/bin/env node
/**
 * Entry point for the RIS MCP Server.
 *
 * Starts the MCP server with stdio transport for communication
 * with Claude Desktop or other MCP clients.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";

/**
 * Main function to start the MCP server.
 */
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start RIS MCP server:", error);
  process.exit(1);
});
