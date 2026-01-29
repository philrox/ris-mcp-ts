/**
 * Tests for the RIS API client functions.
 *
 * This module tests the HTTP client for the Austrian RIS (Rechtsinformationssystem) API,
 * including error handling, request building, and response parsing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  RISAPIError,
  RISTimeoutError,
  RISParsingError,
  searchBundesrecht,
  searchLandesrecht,
  searchJudikatur,
  getDocumentContent,
} from "../client.js";

// =============================================================================
// Error Classes Tests
// =============================================================================

describe("RISAPIError", () => {
  it("should have correct name property", () => {
    const error = new RISAPIError("Test error");
    expect(error.name).toBe("RISAPIError");
  });

  it("should store message", () => {
    const error = new RISAPIError("Test message");
    expect(error.message).toBe("Test message");
  });

  it("should store statusCode", () => {
    const error = new RISAPIError("Test error", 404);
    expect(error.statusCode).toBe(404);
  });

  it("should have undefined statusCode when not provided", () => {
    const error = new RISAPIError("Test error");
    expect(error.statusCode).toBeUndefined();
  });

  it("should extend Error", () => {
    const error = new RISAPIError("Test error");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("RISTimeoutError", () => {
  it("should have correct name property", () => {
    const error = new RISTimeoutError();
    expect(error.name).toBe("RISTimeoutError");
  });

  it("should have default message", () => {
    const error = new RISTimeoutError();
    expect(error.message).toBe("Request to RIS API timed out");
  });

  it("should accept custom message", () => {
    const error = new RISTimeoutError("Custom timeout message");
    expect(error.message).toBe("Custom timeout message");
  });

  it("should extend RISAPIError", () => {
    const error = new RISTimeoutError();
    expect(error).toBeInstanceOf(RISAPIError);
  });

  it("should extend Error", () => {
    const error = new RISTimeoutError();
    expect(error).toBeInstanceOf(Error);
  });
});

describe("RISParsingError", () => {
  it("should have correct name property", () => {
    const error = new RISParsingError("Parse error");
    expect(error.name).toBe("RISParsingError");
  });

  it("should store message", () => {
    const error = new RISParsingError("Failed to parse");
    expect(error.message).toBe("Failed to parse");
  });

  it("should store originalError", () => {
    const originalError = new Error("Original");
    const error = new RISParsingError("Parse error", originalError);
    expect(error.originalError).toBe(originalError);
  });

  it("should have undefined originalError when not provided", () => {
    const error = new RISParsingError("Parse error");
    expect(error.originalError).toBeUndefined();
  });

  it("should extend RISAPIError", () => {
    const error = new RISParsingError("Parse error");
    expect(error).toBeInstanceOf(RISAPIError);
  });

  it("should extend Error", () => {
    const error = new RISParsingError("Parse error");
    expect(error).toBeInstanceOf(Error);
  });
});

// =============================================================================
// Search Functions Tests (with mocked fetch)
// =============================================================================

describe("searchBundesrecht", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createMockApiResponse(documents: unknown[] = [], hits = documents.length) {
    return {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: {
            "#text": String(hits),
            "@pageNumber": "1",
            "@pageSize": "20",
          },
          OgdDocumentReference: documents,
        },
      },
    };
  }

  it("should make successful request and return normalized results", async () => {
    const mockDoc = { Data: { Metadaten: { Technisch: { ID: "NOR40000001" } } } };
    const mockResponse = createMockApiResponse([mockDoc], 1);

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });

    const result = await searchBundesrecht({ Suchworte: "test" });

    expect(result.hits).toBe(1);
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.documents).toHaveLength(1);
  });

  it("should call correct URL with parameters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(createMockApiResponse())),
    });

    await searchBundesrecht({ Suchworte: "Mietrecht", Applikation: "BrKons" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://data.bka.gv.at/ris/api/v2.6/Bundesrecht"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("Suchworte=Mietrecht");
    expect(calledUrl).toContain("Applikation=BrKons");
  });

  it("should throw RISAPIError on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    });

    await expect(searchBundesrecht({ Suchworte: "test" })).rejects.toThrow(RISAPIError);

    try {
      await searchBundesrecht({ Suchworte: "test" });
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      expect((e as RISAPIError).statusCode).toBe(404);
    }
  });

  it("should throw RISTimeoutError on timeout", async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    await expect(searchBundesrecht({ Suchworte: "test" }, 100)).rejects.toThrow(
      RISTimeoutError
    );
  });

  it("should throw RISAPIError on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(searchBundesrecht({ Suchworte: "test" })).rejects.toThrow(RISAPIError);
  });

  it("should throw RISParsingError on invalid JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("not valid json"),
    });

    await expect(searchBundesrecht({ Suchworte: "test" })).rejects.toThrow(
      RISParsingError
    );
  });

  it("should filter null and undefined params", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(createMockApiResponse())),
    });

    await searchBundesrecht({
      Suchworte: "test",
      NullParam: null,
      UndefinedParam: undefined,
      ValidParam: "value",
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("Suchworte=test");
    expect(calledUrl).toContain("ValidParam=value");
    expect(calledUrl).not.toContain("NullParam");
    expect(calledUrl).not.toContain("UndefinedParam");
  });

  it("should handle single document response (not array)", async () => {
    const mockDoc = { Data: { Metadaten: { Technisch: { ID: "NOR40000001" } } } };
    const mockResponse = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: 1,
          OgdDocumentReference: mockDoc, // Single object, not array
        },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });

    const result = await searchBundesrecht({ Suchworte: "test" });

    expect(result.documents).toHaveLength(1);
  });

  it("should handle empty results", async () => {
    const mockResponse = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: 0,
        },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });

    const result = await searchBundesrecht({ Suchworte: "nonexistent" });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it("should handle Hits as plain number", async () => {
    const mockResponse = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: 42,
          OgdDocumentReference: [],
        },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });

    const result = await searchBundesrecht({ Suchworte: "test" });

    expect(result.hits).toBe(42);
    // Default pagination when Hits is not an object
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(10);
  });

  it("should use default values for missing pagination info", async () => {
    const mockResponse = {
      OgdSearchResult: {
        OgdDocumentResults: {},
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });

    const result = await searchBundesrecht({ Suchworte: "test" });

    expect(result.hits).toBe(0);
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(10);
    expect(result.documents).toHaveLength(0);
  });
});

describe("searchLandesrecht", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should call Landesrecht endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
          })
        ),
    });

    await searchLandesrecht({ Suchworte: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("Landesrecht"),
      expect.any(Object)
    );
  });

  it("should pass timeout parameter", async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    // Should timeout with custom timeout
    await expect(searchLandesrecht({ Suchworte: "test" }, 50)).rejects.toThrow(
      RISTimeoutError
    );
  });
});

describe("searchJudikatur", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should call Judikatur endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
          })
        ),
    });

    await searchJudikatur({ Suchworte: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("Judikatur"),
      expect.any(Object)
    );
  });

  it("should return normalized results", async () => {
    const mockDoc = { Data: { Metadaten: { Technisch: { ID: "JJT_2024000001" } } } };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: {
              OgdDocumentResults: {
                Hits: {
                  "#text": "5",
                  "@pageNumber": "2",
                  "@pageSize": "10",
                },
                OgdDocumentReference: [mockDoc],
              },
            },
          })
        ),
    });

    const result = await searchJudikatur({ Suchworte: "test" });

    expect(result.hits).toBe(5);
    expect(result.page_number).toBe(2);
    expect(result.page_size).toBe(10);
    expect(result.documents).toHaveLength(1);
  });
});

// =============================================================================
// getDocumentContent Tests
// =============================================================================

describe("getDocumentContent", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch HTML content successfully", async () => {
    const htmlContent = "<html><body>Test content</body></html>";
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(htmlContent),
    });

    const result = await getDocumentContent("https://example.com/doc.html");

    expect(result).toBe(htmlContent);
  });

  it("should call correct URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("content"),
    });

    await getDocumentContent("https://ris.bka.gv.at/Dokument.wxe?Dokumentnummer=NOR40000001");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://ris.bka.gv.at/Dokument.wxe?Dokumentnummer=NOR40000001",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("should throw RISAPIError on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    await expect(
      getDocumentContent("https://example.com/doc.html")
    ).rejects.toThrow(RISAPIError);

    try {
      await getDocumentContent("https://example.com/doc.html");
    } catch (e) {
      expect(e).toBeInstanceOf(RISAPIError);
      expect((e as RISAPIError).statusCode).toBe(500);
    }
  });

  it("should throw RISTimeoutError on timeout", async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    await expect(
      getDocumentContent("https://example.com/doc.html", 100)
    ).rejects.toThrow(RISTimeoutError);
  });

  it("should throw RISAPIError on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    await expect(
      getDocumentContent("https://example.com/doc.html")
    ).rejects.toThrow(RISAPIError);
  });

  it("should re-throw RISAPIError without wrapping", async () => {
    const originalError = new RISAPIError("Original error", 403);
    mockFetch.mockRejectedValue(originalError);

    try {
      await getDocumentContent("https://example.com/doc.html");
    } catch (e) {
      expect(e).toBe(originalError);
      expect((e as RISAPIError).statusCode).toBe(403);
    }
  });

  it("should handle non-Error thrown values", async () => {
    mockFetch.mockRejectedValue("string error");

    await expect(
      getDocumentContent("https://example.com/doc.html")
    ).rejects.toThrow(RISAPIError);
  });

  it("should use default timeout of 30 seconds", async () => {
    // We can't directly test the timeout value, but we can verify it doesn't throw immediately
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("content"),
    });

    const result = await getDocumentContent("https://example.com/doc.html");
    expect(result).toBe("content");
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe("Integration scenarios", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should handle full search workflow with pagination", async () => {
    const page1Response = {
      OgdSearchResult: {
        OgdDocumentResults: {
          Hits: {
            "#text": "50",
            "@pageNumber": "1",
            "@pageSize": "20",
          },
          OgdDocumentReference: Array(20)
            .fill(null)
            .map((_, i) => ({
              Data: { Metadaten: { Technisch: { ID: `NOR4000000${i}` } } },
            })),
        },
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(page1Response)),
    });

    const result = await searchBundesrecht({
      Suchworte: "test",
      Seitennummer: 1,
      DokumenteProSeite: "Twenty",
    });

    expect(result.hits).toBe(50);
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.documents).toHaveLength(20);
  });

  it("should handle missing OgdSearchResult gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({})),
    });

    const result = await searchBundesrecht({ Suchworte: "test" });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it("should convert boolean and number params to strings", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
          })
        ),
    });

    await searchBundesrecht({
      Suchworte: "test",
      Seitennummer: 5,
      ImRisSeit: true,
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("Seitennummer=5");
    expect(calledUrl).toContain("ImRisSeit=true");
  });
});
