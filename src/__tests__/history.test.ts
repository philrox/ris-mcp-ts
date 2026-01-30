/**
 * Tests for the searchHistory client function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchHistory } from "../client.js";

describe("searchHistory", () => {
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

  it("should call History endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
          })
        ),
    });

    await searchHistory({ Anwendung: "BrKons", AenderungenVon: "2024-01-01" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("History"),
      expect.any(Object)
    );
  });

  it("should pass parameters correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify(createMockApiResponse())),
    });

    await searchHistory({
      Anwendung: "BrKons",
      AenderungenVon: "2024-01-01",
      AenderungenBis: "2024-01-31",
      IncludeDeletedDocuments: "true",
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("Anwendung=BrKons");
    expect(calledUrl).toContain("AenderungenVon=2024-01-01");
    expect(calledUrl).toContain("AenderungenBis=2024-01-31");
    expect(calledUrl).toContain("IncludeDeletedDocuments=true");
  });

  it("should return normalized results", async () => {
    const mockDoc = { Data: { Metadaten: { Technisch: { ID: "NOR40000001" } } } };
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: {
              OgdDocumentResults: {
                Hits: {
                  "#text": "15",
                  "@pageNumber": "1",
                  "@pageSize": "20",
                },
                OgdDocumentReference: [mockDoc],
              },
            },
          })
        ),
    });

    const result = await searchHistory({ Anwendung: "BrKons", AenderungenVon: "2024-01-01" });

    expect(result.hits).toBe(15);
    expect(result.page_number).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.documents).toHaveLength(1);
  });

  it("should handle empty results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            OgdSearchResult: { OgdDocumentResults: { Hits: 0 } },
          })
        ),
    });

    const result = await searchHistory({ Anwendung: "BrKons", AenderungenVon: "2024-01-01" });

    expect(result.hits).toBe(0);
    expect(result.documents).toHaveLength(0);
  });
});
