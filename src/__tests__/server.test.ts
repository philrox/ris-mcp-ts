/**
 * Tests for MCP server module exports.
 *
 * Note: Testing MCP tools directly is complex as they're registered on the server.
 * These tests verify the exported server instance and its configuration.
 */

import { describe, it, expect } from "vitest";
import { server } from "../server.js";
import {
  RISAPIError,
  RISTimeoutError,
  RISParsingError,
} from "../client.js";

// =============================================================================
// Server Instance Tests
// =============================================================================

describe("server export", () => {
  it("should export a server instance", () => {
    expect(server).toBeDefined();
  });

  it("should be an MCP server instance", () => {
    expect(server).toHaveProperty("connect");
  });
});

// =============================================================================
// Error Classes Tests (used by server error handling)
// =============================================================================

describe("Error classes for server error handling", () => {
  describe("RISTimeoutError", () => {
    it("should be identifiable for German timeout message", () => {
      const error = new RISTimeoutError();
      expect(error).toBeInstanceOf(RISTimeoutError);
      expect(error.name).toBe("RISTimeoutError");
    });

    it("should contain timeout information", () => {
      const error = new RISTimeoutError("Timeout nach 30000ms");
      expect(error.message).toContain("30000ms");
    });
  });

  describe("RISParsingError", () => {
    it("should be identifiable for parsing error response", () => {
      const error = new RISParsingError("Invalid JSON");
      expect(error).toBeInstanceOf(RISParsingError);
      expect(error.name).toBe("RISParsingError");
    });

    it("should store original error details", () => {
      const original = new Error("JSON parse error");
      const error = new RISParsingError("Failed to parse", original);
      expect(error.originalError).toBe(original);
    });
  });

  describe("RISAPIError", () => {
    it("should store HTTP status code", () => {
      const error = new RISAPIError("Not found", 404);
      expect(error.statusCode).toBe(404);
    });

    it("should be identifiable for API error response", () => {
      const error = new RISAPIError("Server error", 500);
      expect(error).toBeInstanceOf(RISAPIError);
      expect(error.name).toBe("RISAPIError");
    });
  });
});

// =============================================================================
// Parameter Validation Logic Tests
// =============================================================================

describe("Parameter validation patterns", () => {
  describe("Bundesrecht search requirements", () => {
    it("should require at least one of: suchworte, titel, paragraph", () => {
      // Test the validation pattern used in ris_bundesrecht
      const params1 = { suchworte: "test" };
      const params2 = { titel: "ABGB" };
      const params3 = { paragraph: "1" };
      const emptyParams = {};

      const hasRequired1 = params1.suchworte || (params1 as { titel?: string }).titel || (params1 as { paragraph?: string }).paragraph;
      const hasRequired2 = (params2 as { suchworte?: string }).suchworte || params2.titel || (params2 as { paragraph?: string }).paragraph;
      const hasRequired3 = (params3 as { suchworte?: string }).suchworte || (params3 as { titel?: string }).titel || params3.paragraph;
      const hasRequiredEmpty = (emptyParams as { suchworte?: string }).suchworte || (emptyParams as { titel?: string }).titel || (emptyParams as { paragraph?: string }).paragraph;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Landesrecht search requirements", () => {
    it("should require at least one of: suchworte, titel, bundesland", () => {
      const params1 = { suchworte: "test" };
      const params2 = { titel: "Bauordnung" };
      const params3 = { bundesland: "Wien" };
      const emptyParams = {};

      const hasRequired1 = params1.suchworte || (params1 as { titel?: string }).titel || (params1 as { bundesland?: string }).bundesland;
      const hasRequired2 = (params2 as { suchworte?: string }).suchworte || params2.titel || (params2 as { bundesland?: string }).bundesland;
      const hasRequired3 = (params3 as { suchworte?: string }).suchworte || (params3 as { titel?: string }).titel || params3.bundesland;
      const hasRequiredEmpty = (emptyParams as { suchworte?: string }).suchworte || (emptyParams as { titel?: string }).titel || (emptyParams as { bundesland?: string }).bundesland;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Judikatur search requirements", () => {
    it("should require at least one of: suchworte, norm, geschaeftszahl", () => {
      const params1 = { suchworte: "test" };
      const params2 = { norm: "ABGB" };
      const params3 = { geschaeftszahl: "5 Ob 123/24k" };
      const emptyParams = {};

      const hasRequired1 = params1.suchworte || (params1 as { norm?: string }).norm || (params1 as { geschaeftszahl?: string }).geschaeftszahl;
      const hasRequired2 = (params2 as { suchworte?: string }).suchworte || params2.norm || (params2 as { geschaeftszahl?: string }).geschaeftszahl;
      const hasRequired3 = (params3 as { suchworte?: string }).suchworte || (params3 as { norm?: string }).norm || params3.geschaeftszahl;
      const hasRequiredEmpty = (emptyParams as { suchworte?: string }).suchworte || (emptyParams as { norm?: string }).norm || (emptyParams as { geschaeftszahl?: string }).geschaeftszahl;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Document lookup requirements", () => {
    it("should require either dokumentnummer or url", () => {
      const params1 = { dokumentnummer: "NOR40000001" };
      const params2 = { url: "https://ris.bka.gv.at/doc" };
      const emptyParams = {};

      const hasRequired1 = params1.dokumentnummer || (params1 as { url?: string }).url;
      const hasRequired2 = (params2 as { dokumentnummer?: string }).dokumentnummer || params2.url;
      const hasRequiredEmpty = (emptyParams as { dokumentnummer?: string }).dokumentnummer || (emptyParams as { url?: string }).url;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });
});

// =============================================================================
// Dokumentnummer Routing Logic Tests
// =============================================================================

describe("Dokumentnummer prefix routing", () => {
  function getRouteForDokumentnummer(dokumentnummer: string): string {
    const upperDok = dokumentnummer.toUpperCase();

    if (upperDok.startsWith("NOR")) {
      return "Bundesrecht";
    }

    const landesrechtPrefixes = ["LBG", "LNO", "LST", "LTI", "LVO", "LWI", "LSB", "LOO", "LKT"];
    if (landesrechtPrefixes.some((p) => upperDok.startsWith(p))) {
      return "Landesrecht";
    }

    if (upperDok.startsWith("JFR") || upperDok.startsWith("JFT")) {
      return "Judikatur-Vfgh";
    }

    if (upperDok.startsWith("JWR") || upperDok.startsWith("JWT")) {
      return "Judikatur-Vwgh";
    }

    if (upperDok.startsWith("BVWG")) {
      return "Judikatur-Bvwg";
    }

    if (upperDok.startsWith("LVWG")) {
      return "Judikatur-Lvwg";
    }

    if (upperDok.startsWith("DSB")) {
      return "Judikatur-Dsk";
    }

    return "Judikatur-Justiz";
  }

  it("should route NOR prefix to Bundesrecht", () => {
    expect(getRouteForDokumentnummer("NOR40216910")).toBe("Bundesrecht");
  });

  it("should route LNO prefix to Landesrecht", () => {
    expect(getRouteForDokumentnummer("LNO40000001")).toBe("Landesrecht");
  });

  it("should route LBG prefix to Landesrecht", () => {
    expect(getRouteForDokumentnummer("LBG40000001")).toBe("Landesrecht");
  });

  it("should route LST prefix to Landesrecht", () => {
    expect(getRouteForDokumentnummer("LST40000001")).toBe("Landesrecht");
  });

  it("should route JFR prefix to Vfgh", () => {
    expect(getRouteForDokumentnummer("JFR_2024000001")).toBe("Judikatur-Vfgh");
  });

  it("should route JFT prefix to Vfgh", () => {
    expect(getRouteForDokumentnummer("JFT_2024000001")).toBe("Judikatur-Vfgh");
  });

  it("should route JWR prefix to Vwgh", () => {
    expect(getRouteForDokumentnummer("JWR_2024000001")).toBe("Judikatur-Vwgh");
  });

  it("should route JWT prefix to Vwgh", () => {
    expect(getRouteForDokumentnummer("JWT_2024000001")).toBe("Judikatur-Vwgh");
  });

  it("should route BVWG prefix to Bvwg", () => {
    expect(getRouteForDokumentnummer("BVWGT_2024000001")).toBe("Judikatur-Bvwg");
  });

  it("should route LVWG prefix to Lvwg", () => {
    expect(getRouteForDokumentnummer("LVWGT_2024000001")).toBe("Judikatur-Lvwg");
  });

  it("should route DSB prefix to Dsk", () => {
    expect(getRouteForDokumentnummer("DSB_2024000001")).toBe("Judikatur-Dsk");
  });

  it("should default unknown prefix to Justiz", () => {
    expect(getRouteForDokumentnummer("JJT_2024000001")).toBe("Judikatur-Justiz");
    expect(getRouteForDokumentnummer("UNKNOWN123")).toBe("Judikatur-Justiz");
  });

  it("should handle lowercase prefixes", () => {
    expect(getRouteForDokumentnummer("nor40216910")).toBe("Bundesrecht");
    expect(getRouteForDokumentnummer("lno40000001")).toBe("Landesrecht");
  });
});

// =============================================================================
// Bundesrecht API Parameter Mapping Tests
// =============================================================================

describe("Bundesrecht API parameter mapping", () => {
  // Re-implement the mapping logic for testing
  function buildBundesrechtParams(args: {
    suchworte?: string;
    titel?: string;
    paragraph?: string;
    applikation?: string;
    fassung_vom?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { suchworte, titel, paragraph, applikation = "BrKons", fassung_vom, seite = 1, limit = 20 } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (paragraph) {
      params["Abschnitt.Von"] = paragraph;
      params["Abschnitt.Bis"] = paragraph;
      params["Abschnitt.Typ"] = "Paragraph";
    }
    if (fassung_vom) params["FassungVom"] = fassung_vom;

    return params;
  }

  describe("titel parameter", () => {
    it("should map titel to 'Titel' API parameter", () => {
      const params = buildBundesrechtParams({ titel: "ABGB" });

      expect(params["Titel"]).toBe("ABGB");
      expect(params["Titel.Suchworte"]).toBeUndefined();
    });

    it("should not include Titel when titel is not provided", () => {
      const params = buildBundesrechtParams({ suchworte: "Mietrecht" });

      expect(params["Titel"]).toBeUndefined();
    });
  });

  describe("paragraph parameter", () => {
    it("should map paragraph to Abschnitt.Von, Abschnitt.Bis, and Abschnitt.Typ", () => {
      const params = buildBundesrechtParams({ titel: "ABGB", paragraph: "1295" });

      expect(params["Abschnitt.Von"]).toBe("1295");
      expect(params["Abschnitt.Bis"]).toBe("1295");
      expect(params["Abschnitt.Typ"]).toBe("Paragraph");
      expect(params["ArtikelParagraphAnlage"]).toBeUndefined();
    });

    it("should not include Abschnitt fields when paragraph is not provided", () => {
      const params = buildBundesrechtParams({ titel: "ABGB" });

      expect(params["Abschnitt.Von"]).toBeUndefined();
      expect(params["Abschnitt.Bis"]).toBeUndefined();
      expect(params["Abschnitt.Typ"]).toBeUndefined();
    });

    it("should handle paragraph with letters (e.g., 1319a)", () => {
      const params = buildBundesrechtParams({ paragraph: "1319a" });

      expect(params["Abschnitt.Von"]).toBe("1319a");
      expect(params["Abschnitt.Bis"]).toBe("1319a");
      expect(params["Abschnitt.Typ"]).toBe("Paragraph");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildBundesrechtParams({
        suchworte: "Schadenersatz",
        titel: "ABGB",
        paragraph: "1295",
        applikation: "BrKons",
        fassung_vom: "2024-01-01",
        seite: 2,
        limit: 50,
      });

      expect(params["Suchworte"]).toBe("Schadenersatz");
      expect(params["Titel"]).toBe("ABGB");
      expect(params["Abschnitt.Von"]).toBe("1295");
      expect(params["Abschnitt.Bis"]).toBe("1295");
      expect(params["Abschnitt.Typ"]).toBe("Paragraph");
      expect(params["Applikation"]).toBe("BrKons");
      expect(params["FassungVom"]).toBe("2024-01-01");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// Limit Mapping Tests (used by tools)
// =============================================================================

describe("Limit to DokumenteProSeite mapping", () => {
  // Re-implement the mapping logic for testing
  function limitToDokumenteProSeite(limit: number): string {
    const mapping: Record<number, string> = {
      10: "Ten",
      20: "Twenty",
      50: "Fifty",
      100: "OneHundred",
    };
    return mapping[limit] ?? "Twenty";
  }

  it("should map 10 to Ten", () => {
    expect(limitToDokumenteProSeite(10)).toBe("Ten");
  });

  it("should map 20 to Twenty", () => {
    expect(limitToDokumenteProSeite(20)).toBe("Twenty");
  });

  it("should map 50 to Fifty", () => {
    expect(limitToDokumenteProSeite(50)).toBe("Fifty");
  });

  it("should map 100 to OneHundred", () => {
    expect(limitToDokumenteProSeite(100)).toBe("OneHundred");
  });

  it("should default to Twenty for unknown values", () => {
    expect(limitToDokumenteProSeite(25)).toBe("Twenty");
    expect(limitToDokumenteProSeite(0)).toBe("Twenty");
  });
});
