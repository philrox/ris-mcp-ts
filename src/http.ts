/**
 * HTTP transport entry point for the RIS MCP Server.
 *
 * Provides an Express-based HTTP server with Streamable HTTP transport
 * for deployment on cloud platforms (e.g., AWS Lightsail).
 */

import crypto from 'node:crypto';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Express, Request, Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { registerAllTools } from './tools/index.js';

export const app: Express = express();
export const sessions = new Map<string, StreamableHTTPServerTransport>();

app.use(express.json());

// Rate limiting: MCP-specific (each request triggers upstream RIS API calls)
export const mcpLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.headers['mcp-session-id'] as string) || req.ip || 'unknown',
  message: { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
  validate: { keyGeneratorIpFallback: false },
});
app.use('/mcp', mcpLimiter);

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
      await existing.handleRequest(req, res, req.body);
      return;
    }
    // Session expired or server restarted — client must reinitialize
    res.status(404).json({ error: 'Session nicht gefunden. Bitte neu verbinden.' });
    return;
  }

  // Create new session
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: (): string => crypto.randomUUID(),
  });
  const server = new McpServer({ name: 'ris-mcp', version: '1.0.0' });

  registerAllTools(server);

  transport.onclose = (): void => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  // Store session AFTER handleRequest so the sessionId is available
  // (the SDK generates the sessionId during initialize handling)
  if (transport.sessionId && !sessions.has(transport.sessionId)) {
    sessions.set(transport.sessionId, transport);
  }
});

app.get('/mcp', (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const transport = sessions.get(sessionId);
    if (transport) {
      transport.handleRequest(req, res, req.body);
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
      transport.handleRequest(req, res, req.body);
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
