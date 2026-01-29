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
  constructDocumentUrl,
  getDocumentByNumber,
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

// =============================================================================
// constructDocumentUrl Tests
// =============================================================================

describe("constructDocumentUrl", () => {
  it("should construct URL for Bundesrecht (NOR prefix)", () => {
    const url = constructDocumentUrl("NOR12019037");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019037/NOR12019037.html"
    );
  });

  it("should construct URL for Landesrecht Burgenland (LBG prefix)", () => {
    const url = constructDocumentUrl("LBG12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrBgld/LBG12345678/LBG12345678.html"
    );
  });

  it("should construct URL for Landesrecht Kaernten (LKT prefix)", () => {
    const url = constructDocumentUrl("LKT12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrK/LKT12345678/LKT12345678.html"
    );
  });

  it("should construct URL for Landesrecht Niederoesterreich (LNO prefix)", () => {
    const url = constructDocumentUrl("LNO12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrNO/LNO12345678/LNO12345678.html"
    );
  });

  it("should construct URL for Landesrecht Oberoesterreich (LOO prefix)", () => {
    const url = constructDocumentUrl("LOO12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrOO/LOO12345678/LOO12345678.html"
    );
  });

  it("should construct URL for Landesrecht Salzburg (LSB prefix)", () => {
    const url = constructDocumentUrl("LSB12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrSbg/LSB12345678/LSB12345678.html"
    );
  });

  it("should construct URL for Landesrecht Steiermark (LST prefix)", () => {
    const url = constructDocumentUrl("LST12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrStmk/LST12345678/LST12345678.html"
    );
  });

  it("should construct URL for Landesrecht Tirol (LTI prefix)", () => {
    const url = constructDocumentUrl("LTI12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrT/LTI12345678/LTI12345678.html"
    );
  });

  it("should construct URL for Landesrecht Vorarlberg (LVO prefix)", () => {
    const url = constructDocumentUrl("LVO12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrVbg/LVO12345678/LVO12345678.html"
    );
  });

  it("should construct URL for Landesrecht Wien (LWI prefix)", () => {
    const url = constructDocumentUrl("LWI12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/LrW/LWI12345678/LWI12345678.html"
    );
  });

  it("should construct URL for VwGH Judikatur (JWR prefix)", () => {
    const url = constructDocumentUrl("JWR12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Vwgh/JWR12345678/JWR12345678.html"
    );
  });

  it("should construct URL for VfGH Judikatur (JFR prefix)", () => {
    const url = constructDocumentUrl("JFR12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Vfgh/JFR12345678/JFR12345678.html"
    );
  });

  it("should construct URL for Justiz (JWT prefix)", () => {
    const url = constructDocumentUrl("JWT12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Justiz/JWT12345678/JWT12345678.html"
    );
  });

  it("should construct URL for BVwG (BVWG prefix)", () => {
    const url = constructDocumentUrl("BVWG12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Bvwg/BVWG12345678/BVWG12345678.html"
    );
  });

  it("should construct URL for LVwG (LVWG prefix)", () => {
    const url = constructDocumentUrl("LVWG12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Lvwg/LVWG12345678/LVWG12345678.html"
    );
  });

  it("should construct URL for DSB (DSB prefix)", () => {
    const url = constructDocumentUrl("DSB12345678");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Dsk/DSB12345678/DSB12345678.html"
    );
  });

  it("should return null for unknown prefix", () => {
    const url = constructDocumentUrl("UNKNOWN12345");
    expect(url).toBeNull();
  });

  it("should return null for empty string", () => {
    const url = constructDocumentUrl("");
    expect(url).toBeNull();
  });

  it("should handle longer prefixes correctly (BVWG vs BVW)", () => {
    // Ensure BVWG is not matched by a hypothetical shorter prefix
    const url = constructDocumentUrl("BVWG_W123_2000000_1_00");
    expect(url).toBe(
      "https://ris.bka.gv.at/Dokumente/Bvwg/BVWG_W123_2000000_1_00/BVWG_W123_2000000_1_00.html"
    );
  });
});

// =============================================================================
// getDocumentByNumber Tests
// =============================================================================

describe("getDocumentByNumber", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return success with HTML content for valid document", async () => {
    const htmlContent = "<html><body>Legal document content</body></html>";
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(htmlContent),
    });

    const result = await getDocumentByNumber("NOR12019037");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.html).toBe(htmlContent);
      expect(result.url).toBe(
        "https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019037/NOR12019037.html"
      );
    }
  });

  it("should call correct URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html></html>"),
    });

    await getDocumentByNumber("NOR12019037");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019037/NOR12019037.html",
      expect.any(Object)
    );
  });

  it("should return error for unknown prefix", async () => {
    const result = await getDocumentByNumber("UNKNOWN12345");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Unbekanntes Dokumentnummer-Prefix");
    }

    // Should not have called fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return error on HTTP 404", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    });

    const result = await getDocumentByNumber("NOR99999999");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(404);
    }
  });

  it("should return error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await getDocumentByNumber("NOR12019037");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Network error");
    }
  });

  it("should handle timeout", async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const result = await getDocumentByNumber("NOR12019037", 100);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("timed out");
    }
  });

  it("should work with Landesrecht documents", async () => {
    const htmlContent = "<html><body>Landesrecht content</body></html>";
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(htmlContent),
    });

    const result = await getDocumentByNumber("LWI12345678");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toContain("LrW");
    }
  });

  it("should work with Judikatur documents", async () => {
    const htmlContent = "<html><body>Court decision</body></html>";
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(htmlContent),
    });

    const result = await getDocumentByNumber("JFR12345678");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toContain("Vfgh");
    }
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
