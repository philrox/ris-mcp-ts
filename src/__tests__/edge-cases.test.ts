/**
 * Edge case tests for the RIS MCP Server.
 *
 * This module tests boundary conditions and error scenarios that are not
 * well-covered by existing unit tests, including empty API responses,
 * document truncation, malformed responses, rate limiting, timeouts,
 * and non-existent document handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  RISAPIError,
  RISTimeoutError,
  RISParsingError,
  searchBundesrecht,
  searchLandesrecht,
  searchJudikatur,
  getDocumentByNumber,
  getDocumentContent,
  isAllowedUrl,
} from '../client.js';
import { truncateResponse, formatSearchResults, formatDocument } from '../formatting.js';
import { parseSearchResults, parseDocumentFromApiResponse, extractText } from '../parser.js';
import type { NormalizedSearchResults, RawDocumentReference } from '../types.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockApiResponse(documents: unknown[] = [], hits = documents.length) {
  return {
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: {
          '#text': String(hits),
          '@pageNumber': '1',
          '@pageSize': '20',
        },
        OgdDocumentReference: documents,
      },
    },
  };
}

function createMockFetchSetup() {
  const mockFetch = vi.fn();
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

// =============================================================================
// 1. Empty API Responses
// =============================================================================

describe('Edge Case: Empty API Responses', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetchSetup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should handle 0 hits with empty OgdDocumentReference array', async () => {
    const response = createMockApiResponse([], 0);
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'xyznonexistent' });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
    expect(result.documents).toEqual([]);
  });

  it('should handle response with no OgdDocumentReference field at all', async () => {
    const response = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: { '#text': '0', '@pageNumber': '1', '@pageSize': '20' },
        },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'nothing' });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it('should handle response with null OgdDocumentReference', async () => {
    const response = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: { '#text': '0', '@pageNumber': '1', '@pageSize': '20' },
          OgdDocumentReference: null,
        },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'nothing' });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it('should handle completely empty OgdSearchResult', async () => {
    const response = { OgdSearchResult: {} };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'test' });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(10);
  });

  it('should handle empty JSON object response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({})),
    });

    const result = await searchBundesrecht({ Suchworte: 'test' });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it('should format 0-result search results as markdown correctly', () => {
    const searchResult = {
      total_hits: 0,
      page: 1,
      page_size: 20,
      has_more: false,
      documents: [],
    };

    const formatted = formatSearchResults(searchResult, 'markdown');

    expect(formatted).toContain('0 Treffer');
    expect(formatted).toContain('Keine Dokumente gefunden');
  });

  it('should format 0-result search results as JSON correctly', () => {
    const searchResult = {
      total_hits: 0,
      page: 1,
      page_size: 20,
      has_more: false,
      documents: [],
    };

    const formatted = formatSearchResults(searchResult, 'json');
    const parsed = JSON.parse(formatted);

    expect(parsed.total_hits).toBe(0);
    expect(parsed.documents).toEqual([]);
  });

  it('should parse empty results through parseSearchResults', () => {
    const apiResponse: NormalizedSearchResults = {
      hits: 0,
      page_number: 1,
      page_size: 20,
      documents: [],
    };

    const result = parseSearchResults(apiResponse);

    expect(result.total_hits).toBe(0);
    expect(result.has_more).toBe(false);
    expect(result.documents).toEqual([]);
  });

  it('should handle 0 hits across different search functions', async () => {
    const emptyResponse = {
      OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(emptyResponse)),
    });

    const brResult = await searchBundesrecht({ Suchworte: 'xyznonexistent' });
    expect(brResult.hits).toBe(0);

    const lrResult = await searchLandesrecht({ Suchworte: 'xyznonexistent' });
    expect(lrResult.hits).toBe(0);

    const jkResult = await searchJudikatur({ Suchworte: 'xyznonexistent' });
    expect(jkResult.hits).toBe(0);
  });
});

// =============================================================================
// 2. Truncation of Documents >25,000 Characters
// =============================================================================

describe('Edge Case: Document Truncation at 25,000 Char Limit', () => {
  it('should not truncate document at exactly 25,000 characters', () => {
    const text = 'a'.repeat(25000);
    const result = truncateResponse(text);

    expect(result).toBe(text);
    expect(result.length).toBe(25000);
    expect(result).not.toContain('Antwort gekuerzt');
  });

  it('should truncate document at 25,001 characters', () => {
    const text = 'a'.repeat(25001);
    const result = truncateResponse(text);

    expect(result).not.toBe(text);
    expect(result).toContain('Antwort gekuerzt');
    expect(result).toContain('25001 ->');
  });

  it('should handle very large documents (100,000+ chars)', () => {
    const text = 'a'.repeat(100000);
    const result = truncateResponse(text);

    expect(result).toContain('Antwort gekuerzt');
    expect(result).toContain('100000 ->');
    // The truncated content (before warning) should be under the limit
    const contentBeforeWarning = result.split('\n\n---\n')[0];
    expect(contentBeforeWarning.length).toBeLessThanOrEqual(25000);
  });

  it('should truncate realistic legal document content with paragraphs', () => {
    // Build a realistic document with paragraph structure
    const paragraphs: string[] = [];
    for (let i = 0; i < 500; i++) {
      paragraphs.push(
        `§ ${i + 1}. Dies ist ein Paragraph des Gesetzes mit typischem juristischen Text. ` +
          `Die Bestimmung regelt die Zuständigkeit und das Verfahren. ` +
          `Abs. 1: Der Antragsteller hat das Recht auf Einsicht in die Akten.`,
      );
    }
    const text = paragraphs.join('\n\n');

    expect(text.length).toBeGreaterThan(25000);

    const result = truncateResponse(text);

    expect(result).toContain('Antwort gekuerzt');
    // Should truncate at paragraph boundary
    const contentBeforeWarning = result.split('\n\n---\n')[0];
    expect(contentBeforeWarning).toMatch(/Akten\.$/);
  });

  it('should include truncation notice in formatDocument when content exceeds limit', () => {
    const longContent = '<html><body>' + 'Legal text. '.repeat(5000) + '</body></html>';
    const metadata = {
      dokumentnummer: 'NOR40000001',
      applikation: 'BrKons',
      titel: 'Test Law',
    };

    const formatted = formatDocument(longContent, metadata, 'markdown');
    const truncated = truncateResponse(formatted);

    // If the formatted output exceeds the limit, truncation should occur
    if (formatted.length > 25000) {
      expect(truncated).toContain('Antwort gekuerzt');
    }
  });

  it('should truncate empty string to empty string', () => {
    expect(truncateResponse('')).toBe('');
  });

  it('should handle text with only whitespace under limit', () => {
    const text = ' '.repeat(100);
    expect(truncateResponse(text)).toBe(text);
  });
});

// =============================================================================
// 3. Malformed/Invalid API Responses
// =============================================================================

describe('Edge Case: Malformed/Invalid API Responses', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetchSetup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw RISParsingError on completely invalid JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('this is not json at all'),
    });

    await expect(searchBundesrecht({ Suchworte: 'test' })).rejects.toThrow(RISParsingError);
  });

  it('should throw RISParsingError on truncated JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"OgdSearchResult": {"OgdDocum'),
    });

    await expect(searchBundesrecht({ Suchworte: 'test' })).rejects.toThrow(RISParsingError);
  });

  it('should throw RISParsingError on empty string response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    await expect(searchBundesrecht({ Suchworte: 'test' })).rejects.toThrow(RISParsingError);
  });

  it('should throw RISParsingError on HTML response instead of JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve('<html><body><h1>Error</h1><p>Service unavailable</p></body></html>'),
    });

    await expect(searchBundesrecht({ Suchworte: 'test' })).rejects.toThrow(RISParsingError);
  });

  it('should preserve original error in RISParsingError', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not json'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect(e).toBeInstanceOf(RISParsingError);
      const parsingError = e as RISParsingError;
      expect(parsingError.originalError).toBeInstanceOf(SyntaxError);
      expect(parsingError.message).toContain('Failed to parse JSON');
    }
  });

  it('should handle response with unexpected data types in Hits', async () => {
    const response = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: 'not-a-number',
          OgdDocumentReference: [],
        },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'test' });

    // Number('not-a-number') = NaN
    expect(result.hits).toBeNaN();
  });

  it('should handle response with Hits as boolean', async () => {
    const response = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: true,
          OgdDocumentReference: [],
        },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(response)),
    });

    const result = await searchBundesrecht({ Suchworte: 'test' });

    // Number(true) = 1
    expect(result.hits).toBe(1);
  });

  it('should handle document with completely missing Data field', () => {
    const docRef: RawDocumentReference = {};
    const doc = parseDocumentFromApiResponse(docRef);

    expect(doc.dokumentnummer).toBe('');
    expect(doc.applikation).toBe('');
    expect(doc.titel).toBe('');
  });

  it('should handle document with null-like nested metadata', () => {
    const docRef: RawDocumentReference = {
      Data: {
        Metadaten: {},
        Dokumentliste: {},
      },
    };
    const doc = parseDocumentFromApiResponse(docRef);

    expect(doc.dokumentnummer).toBe('');
    expect(doc.content_urls.html).toBeNull();
    expect(doc.content_urls.xml).toBeNull();
  });

  it('should handle extractText with various edge case inputs', () => {
    expect(extractText(null)).toBeNull();
    expect(extractText(undefined)).toBeNull();
    expect(extractText('')).toBeNull();
    expect(extractText('   ')).toBeNull();
    expect(extractText(42)).toBeNull();
    expect(extractText({ '#text': '' })).toBeNull();
    expect(extractText({ '#text': '  ' })).toBeNull();
    expect(extractText({ item: ['a', 'b', 'c'] })).toBe('a, b, c');
  });
});

// =============================================================================
// 4. HTTP 429 Rate Limiting Responses
// =============================================================================

describe('Edge Case: HTTP 429 Rate Limiting', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetchSetup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw RISAPIError with status 429 on rate limiting', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Too Many Requests'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      const apiError = e as RISAPIError;
      expect(apiError.statusCode).toBe(429);
      expect(apiError.message).toContain('429');
    }
  });

  it('should throw RISAPIError with status 429 for Landesrecht', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    });

    await expect(searchLandesrecht({ Suchworte: 'test' })).rejects.toThrow(RISAPIError);

    try {
      await searchLandesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect((e as RISAPIError).statusCode).toBe(429);
    }
  });

  it('should throw RISAPIError with status 429 for document content', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Too Many Requests'),
    });

    try {
      await getDocumentContent('https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR40000001.html');
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      expect((e as RISAPIError).statusCode).toBe(429);
    }
  });

  it('should return error result for getDocumentByNumber on 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    });

    const result = await getDocumentByNumber('NOR40000001');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(429);
      expect(result.error).toContain('429');
    }
  });

  it('should include response body in 429 error message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded. Retry after 60 seconds.'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as RISAPIError).message).toContain('Rate limit exceeded');
    }
  });

  it('should handle other 4xx errors correctly', async () => {
    // 400 Bad Request
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect((e as RISAPIError).statusCode).toBe(400);
    }

    // 403 Forbidden
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect((e as RISAPIError).statusCode).toBe(403);
    }
  });

  it('should handle 5xx server errors correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      expect((e as RISAPIError).statusCode).toBe(500);
    }

    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service Unavailable'),
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect((e as RISAPIError).statusCode).toBe(503);
    }
  });
});

// =============================================================================
// 5. Timeout Scenarios (30s)
// =============================================================================

describe('Edge Case: Timeout Scenarios', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetchSetup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw RISTimeoutError when fetch aborts for searchBundesrecht', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(searchBundesrecht({ Suchworte: 'test' }, 100)).rejects.toThrow(RISTimeoutError);
  });

  it('should throw RISTimeoutError when fetch aborts for getDocumentContent', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(getDocumentContent('https://ris.bka.gv.at/doc.html', 100)).rejects.toThrow(
      RISTimeoutError,
    );
  });

  it('should include endpoint info in timeout error message for search', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' }, 100);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RISTimeoutError);
      expect((e as RISTimeoutError).message).toContain('Bundesrecht');
      expect((e as RISTimeoutError).message).toContain('timed out');
    }
  });

  it('should include URL info in timeout error message for document', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    try {
      await getDocumentContent('https://ris.bka.gv.at/doc.html', 100);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RISTimeoutError);
      expect((e as RISTimeoutError).message).toContain('timed out');
    }
  });

  it('should return error result for getDocumentByNumber on timeout', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    const result = await getDocumentByNumber('NOR40000001', 100);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('timed out');
    }
  });

  it('should propagate RISTimeoutError as RISAPIError subclass', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    try {
      await searchBundesrecht({ Suchworte: 'test' }, 100);
    } catch (e) {
      // RISTimeoutError extends RISAPIError
      expect(e).toBeInstanceOf(RISTimeoutError);
      expect(e).toBeInstanceOf(RISAPIError);
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('should distinguish timeout from generic network error', async () => {
    // Timeout error
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(searchBundesrecht({ Suchworte: 'test' }, 100)).rejects.toThrow(RISTimeoutError);

    // Generic network error (not a timeout)
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    try {
      await searchBundesrecht({ Suchworte: 'test' });
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      expect(e).not.toBeInstanceOf(RISTimeoutError);
    }
  });
});

// =============================================================================
// 6. Non-Existent Document Numbers
// =============================================================================

describe('Edge Case: Non-Existent Document Numbers', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetchSetup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return error for completely unknown prefix', async () => {
    const result = await getDocumentByNumber('ZZZZZ99999');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unbekanntes Dokumentnummer-Prefix');
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error for valid prefix but HTTP 404 from server', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Document not found'),
    });

    const result = await getDocumentByNumber('NOR99999999');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(404);
    }
  });

  it('should return error for valid prefix but HTTP 500 from server', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const result = await getDocumentByNumber('NOR40000001');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(500);
    }
  });

  it('should return error for invalid dokumentnummer format', async () => {
    const result = await getDocumentByNumber('invalid');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Ungueltige Dokumentnummer');
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error for empty dokumentnummer', async () => {
    const result = await getDocumentByNumber('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Ungueltige Dokumentnummer');
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error for lowercase dokumentnummer', async () => {
    const result = await getDocumentByNumber('nor40000001');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Ungueltige Dokumentnummer');
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error for dokumentnummer with special characters', async () => {
    const result = await getDocumentByNumber('NOR40000001<script>');

    expect(result.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return error for dokumentnummer with path traversal', async () => {
    const result = await getDocumentByNumber('NOR../../etc/passwd');

    expect(result.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle network error when fetching document', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await getDocumentByNumber('NOR40000001');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should handle non-Error thrown values in getDocumentByNumber', async () => {
    mockFetch.mockRejectedValue('unexpected string error');

    const result = await getDocumentByNumber('NOR40000001');

    expect(result.success).toBe(false);
  });
});

// =============================================================================
// 7. URL Validation (isAllowedUrl) Edge Cases
// =============================================================================

describe('Edge Case: URL Validation', () => {
  it('should allow valid RIS HTTPS URLs', () => {
    expect(isAllowedUrl('https://data.bka.gv.at/ris/api/v2.6/Bundesrecht')).toBe(true);
    expect(isAllowedUrl('https://www.ris.bka.gv.at/doc.html')).toBe(true);
    expect(isAllowedUrl('https://ris.bka.gv.at/Dokumente/test.html')).toBe(true);
  });

  it('should reject HTTP (non-HTTPS) URLs', () => {
    expect(isAllowedUrl('http://data.bka.gv.at/ris/api/v2.6/Bundesrecht')).toBe(false);
    expect(isAllowedUrl('http://ris.bka.gv.at/doc.html')).toBe(false);
  });

  it('should reject non-RIS domains', () => {
    expect(isAllowedUrl('https://evil.com/ris/api')).toBe(false);
    expect(isAllowedUrl('https://google.com')).toBe(false);
    expect(isAllowedUrl('https://data.bka.gv.at.evil.com/path')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isAllowedUrl('')).toBe(false);
    expect(isAllowedUrl('not-a-url')).toBe(false);
    expect(isAllowedUrl('ftp://data.bka.gv.at/file')).toBe(false);
  });

  it('should reject file:// protocol URLs', () => {
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
  });

  it('should reject javascript: protocol', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
  });
});

// =============================================================================
// 8. Parser Edge Cases with Malformed Documents
// =============================================================================

describe('Edge Case: Parser with Malformed Documents', () => {
  it('should handle document with empty Data object', () => {
    const docRef: RawDocumentReference = { Data: {} };
    const doc = parseDocumentFromApiResponse(docRef);

    expect(doc.dokumentnummer).toBe('');
    expect(doc.applikation).toBe('');
    expect(doc.titel).toBe('');
    expect(doc.content_urls).toEqual({ html: null, xml: null, pdf: null, rtf: null });
  });

  it('should handle Judikatur document with array Geschaeftszahl item', () => {
    const docRef: RawDocumentReference = {
      Data: {
        Metadaten: {
          Technisch: { ID: 'JWR_2024000001', Applikation: 'Vwgh' },
          Judikatur: {
            Geschaeftszahl: { item: ['Ra 2024/01/0001', 'Ra 2024/01/0002'] },
            Entscheidungsdatum: '2024-01-15',
          },
        },
      },
    };

    const doc = parseDocumentFromApiResponse(docRef);

    expect(doc.kurztitel).toBe('Ra 2024/01/0001, Ra 2024/01/0002');
  });

  it('should handle ContentReference as array', () => {
    const docRef: RawDocumentReference = {
      Data: {
        Metadaten: {
          Technisch: { ID: 'NOR40000001', Applikation: 'BrKons' },
        },
        Dokumentliste: {
          ContentReference: [
            {
              ContentType: 'Attachment',
              Urls: {
                ContentUrl: [{ DataType: 'Pdf', Url: 'https://ris.bka.gv.at/attachment.pdf' }],
              },
            },
            {
              ContentType: 'MainDocument',
              Urls: {
                ContentUrl: [{ DataType: 'Html', Url: 'https://ris.bka.gv.at/main.html' }],
              },
            },
          ],
        },
      },
    };

    const doc = parseDocumentFromApiResponse(docRef);

    // Should prefer MainDocument
    expect(doc.content_urls.html).toBe('https://ris.bka.gv.at/main.html');
  });

  it('should handle ContentUrl as single object (not array)', () => {
    const docRef: RawDocumentReference = {
      Data: {
        Metadaten: {
          Technisch: { ID: 'NOR40000001', Applikation: 'BrKons' },
        },
        Dokumentliste: {
          ContentReference: {
            Urls: {
              ContentUrl: { DataType: 'Html', Url: 'https://ris.bka.gv.at/doc.html' },
            },
          },
        },
      },
    };

    const doc = parseDocumentFromApiResponse(docRef);

    expect(doc.content_urls.html).toBe('https://ris.bka.gv.at/doc.html');
  });

  it('should handle document with Name as object with #text', () => {
    const docRef: RawDocumentReference = {
      Data: {
        Metadaten: {
          Technisch: { ID: 'NOR40000001', Applikation: 'BrKons' },
        },
        Dokumentliste: {
          ContentReference: {
            Name: { '#text': 'Document Title from Name' },
          },
        },
      },
    };

    const doc = parseDocumentFromApiResponse(docRef);

    // When no kurztitel, should fall back to ContentReference Name
    expect(doc.titel).toBe('Document Title from Name');
  });

  it('should handle parseSearchResults with hits mismatch', () => {
    // API says 100 hits but only returns 2 documents
    const apiResponse: NormalizedSearchResults = {
      hits: 100,
      page_number: 1,
      page_size: 20,
      documents: [
        {
          Data: {
            Metadaten: {
              Technisch: { ID: 'NOR40000001', Applikation: 'BrKons' },
              Bundesrecht: { Kurztitel: 'Test' },
            },
          },
        },
      ],
    };

    const result = parseSearchResults(apiResponse);

    // Should report 100 total hits even though only 1 document
    expect(result.total_hits).toBe(100);
    expect(result.documents).toHaveLength(1);
    expect(result.has_more).toBe(true);
  });
});
