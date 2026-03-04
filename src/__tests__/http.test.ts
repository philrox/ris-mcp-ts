/**
 * Tests for the HTTP transport layer (src/http.ts).
 *
 * RED phase: These tests define the expected behavior of the Express-based
 * MCP HTTP server. They should FAIL until http.ts is implemented.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { app, sessions } from '../http.js';
import { registerAllTools } from '../tools/index.js';

// ---------------------------------------------------------------------------
// Mocks — vi.mock calls are hoisted by vitest above all imports
// ---------------------------------------------------------------------------

const mockHandleRequest = vi.fn();
const mockTransportClose = vi.fn();
let capturedOnClose: (() => void) | undefined;

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(function () {
    return { connect: vi.fn().mockResolvedValue(undefined) };
  }),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(function () {
    const transport = {
      handleRequest: mockHandleRequest,
      close: mockTransportClose,
      sessionId: 'test-session-id',
      onclose: undefined as (() => void) | undefined,
    };
    // Capture the onclose callback when it gets assigned
    Object.defineProperty(transport, 'onclose', {
      get() {
        return capturedOnClose;
      },
      set(fn: (() => void) | undefined) {
        capturedOnClose = fn;
      },
      enumerable: true,
      configurable: true,
    });
    return transport;
  }),
}));

vi.mock('../tools/index.js', () => ({
  registerAllTools: vi.fn(),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('HTTP transport (http.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessions.clear();
    capturedOnClose = undefined;
  });

  // ---------------------------------------------------------------------------
  // GET /health
  // ---------------------------------------------------------------------------

  describe('GET /health', () => {
    it('should return 200 with correct shape', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'ris-mcp',
        activeSessions: 0,
      });
    });

    it('should return activeSessions count matching sessions map size', async () => {
      // Manually add fake sessions to the map
      sessions.set('session-1', {} as never);
      sessions.set('session-2', {} as never);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.activeSessions).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /mcp — new session
  // ---------------------------------------------------------------------------

  describe('POST /mcp (new session)', () => {
    it('should create a new McpServer and transport', async () => {
      mockHandleRequest.mockImplementation(
        (_req: unknown, res: { writeHead: (code: number) => void; end: () => void }) => {
          res.writeHead(200);
          res.end();
        },
      );

      await request(app).post('/mcp').send({ jsonrpc: '2.0', method: 'initialize', id: 1 });

      expect(McpServer).toHaveBeenCalled();
      expect(StreamableHTTPServerTransport).toHaveBeenCalled();
    });

    it('should call registerAllTools with the new server', async () => {
      mockHandleRequest.mockImplementation(
        (_req: unknown, res: { writeHead: (code: number) => void; end: () => void }) => {
          res.writeHead(200);
          res.end();
        },
      );

      await request(app).post('/mcp').send({ jsonrpc: '2.0', method: 'initialize', id: 1 });

      expect(registerAllTools).toHaveBeenCalled();
    });

    it('should store the session in the sessions map', async () => {
      mockHandleRequest.mockImplementation(
        (_req: unknown, res: { writeHead: (code: number) => void; end: () => void }) => {
          res.writeHead(200);
          res.end();
        },
      );

      await request(app).post('/mcp').send({ jsonrpc: '2.0', method: 'initialize', id: 1 });

      expect(sessions.size).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /mcp — existing session
  // ---------------------------------------------------------------------------

  describe('POST /mcp (existing session)', () => {
    it('should reuse transport for valid mcp-session-id header', async () => {
      const mockTransport = {
        handleRequest: mockHandleRequest,
        sessionId: 'existing-session',
      };
      sessions.set('existing-session', mockTransport as never);

      mockHandleRequest.mockImplementation(
        (_req: unknown, res: { writeHead: (code: number) => void; end: () => void }) => {
          res.writeHead(200);
          res.end();
        },
      );

      await request(app)
        .post('/mcp')
        .set('mcp-session-id', 'existing-session')
        .send({ jsonrpc: '2.0', method: 'ping', id: 2 });

      // Should reuse existing transport, not create a new one
      expect(mockHandleRequest).toHaveBeenCalled();
      // Should NOT create a new McpServer since session already exists
      expect(McpServer).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /mcp — without valid session
  // ---------------------------------------------------------------------------

  describe('GET /mcp (no valid session)', () => {
    it('should return 400 with German error message', async () => {
      const res = await request(app).get('/mcp');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Keine gültige Session. Starte mit POST /mcp.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /mcp — without valid session
  // ---------------------------------------------------------------------------

  describe('DELETE /mcp (no valid session)', () => {
    it('should return 400 with German error message', async () => {
      const res = await request(app).delete('/mcp');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Keine gültige Session. Starte mit POST /mcp.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Session cleanup via transport.onclose
  // ---------------------------------------------------------------------------

  describe('Session cleanup', () => {
    it('should remove session from map when transport.onclose fires', async () => {
      mockHandleRequest.mockImplementation(
        (_req: unknown, res: { writeHead: (code: number) => void; end: () => void }) => {
          res.writeHead(200);
          res.end();
        },
      );

      // Create a session via POST /mcp
      await request(app).post('/mcp').send({ jsonrpc: '2.0', method: 'initialize', id: 1 });

      expect(sessions.size).toBe(1);

      // Simulate transport closing
      expect(capturedOnClose).toBeDefined();
      if (capturedOnClose) capturedOnClose();

      expect(sessions.size).toBe(0);
    });
  });
});
