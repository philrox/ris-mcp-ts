/**
 * HTTP transport entry point for the RIS MCP Server.
 *
 * Provides an Express-based HTTP server with Streamable HTTP transport
 * for deployment on cloud platforms (e.g., AWS Lightsail).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import express from 'express';

import { registerAllTools } from './tools/index.js';

export const app = express();
export const sessions = new Map<string, StreamableHTTPServerTransport>();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ris-mcp',
    activeSessions: sessions.size,
  });
});

// MCP endpoint — POST creates or reuses sessions, GET/DELETE require existing session
app.post('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // Reuse existing session
  if (sessionId) {
    const existing = sessions.get(sessionId);
    if (existing) {
      await existing.handleRequest(req, res);
      return;
    }
  }

  // Create new session
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = new McpServer({ name: 'ris-mcp', version: '1.0.0' });

  registerAllTools(server);

  transport.onclose = (): void => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  await server.connect(transport);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, transport);
  }

  await transport.handleRequest(req, res);
});

app.get('/mcp', (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const transport = sessions.get(sessionId);
    if (transport) {
      transport.handleRequest(req, res);
      return;
    }
  }

  res.status(400).json({ error: 'Keine gültige Session. Starte mit POST /mcp.' });
});

app.delete('/mcp', (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const transport = sessions.get(sessionId);
    if (transport) {
      transport.handleRequest(req, res);
      return;
    }
  }

  res.status(400).json({ error: 'Keine gültige Session. Starte mit POST /mcp.' });
});

// Start server only when not in test mode
const PORT = process.env.PORT ?? 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`RIS MCP HTTP server listening on port ${PORT}`);
  });
}
