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

  describe("Judikatur gericht parameter values", () => {
    const supportedGerichte = [
      "Justiz", "Vfgh", "Vwgh", "Bvwg", "Lvwg", "Dsk",
      "AsylGH", "Normenliste", "Pvak", "Gbk", "Dok",
    ];

    it("should include all expected court types", () => {
      expect(supportedGerichte).toHaveLength(11);
    });

    it("should map gericht directly to Applikation parameter", () => {
      function buildJudikaturParams(args: { gericht?: string; suchworte?: string }) {
        const { suchworte, gericht = "Justiz" } = args;
        const params: Record<string, unknown> = {
          Applikation: gericht,
          DokumenteProSeite: "Twenty",
          Seitennummer: 1,
        };
        if (suchworte) params["Suchworte"] = suchworte;
        return params;
      }

      for (const gericht of supportedGerichte) {
        const params = buildJudikaturParams({ gericht, suchworte: "test" });
        expect(params["Applikation"]).toBe(gericht);
      }
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

// =============================================================================
// Landesrecht API Parameter Mapping Tests
// =============================================================================

describe("Landesrecht API parameter mapping", () => {
  // Bundesland mapping constant (mirrors server.ts)
  const BUNDESLAND_MAPPING: Record<string, string> = {
    Wien: "SucheInWien",
    Niederoesterreich: "SucheInNiederoesterreich",
    Oberoesterreich: "SucheInOberoesterreich",
    Salzburg: "SucheInSalzburg",
    Tirol: "SucheInTirol",
    Vorarlberg: "SucheInVorarlberg",
    Kaernten: "SucheInKaernten",
    Steiermark: "SucheInSteiermark",
    Burgenland: "SucheInBurgenland",
  };

  // Re-implement the mapping logic for testing
  function buildLandesrechtParams(args: {
    suchworte?: string;
    titel?: string;
    bundesland?: string;
    applikation?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { suchworte, titel, bundesland, applikation = "LrKons", seite = 1, limit = 20 } = args;

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
    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = "true";
      }
    }

    return params;
  }

  describe("titel parameter", () => {
    it("should map titel to 'Titel' API parameter (not Titel.Suchworte)", () => {
      const params = buildLandesrechtParams({ titel: "Bauordnung" });

      expect(params["Titel"]).toBe("Bauordnung");
      expect(params["Titel.Suchworte"]).toBeUndefined();
    });
  });

  describe("bundesland parameter", () => {
    it("should map Salzburg to Bundesland.SucheInSalzburg=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Salzburg", suchworte: "Bauordnung" });

      expect(params["Bundesland.SucheInSalzburg"]).toBe("true");
      expect(params["Bundesland"]).toBeUndefined();
    });

    it("should map Wien to Bundesland.SucheInWien=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Wien", suchworte: "Bauordnung" });

      expect(params["Bundesland.SucheInWien"]).toBe("true");
      expect(params["Bundesland"]).toBeUndefined();
    });

    it("should map Niederoesterreich to Bundesland.SucheInNiederoesterreich=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Niederoesterreich", suchworte: "test" });

      expect(params["Bundesland.SucheInNiederoesterreich"]).toBe("true");
    });

    it("should map Oberoesterreich to Bundesland.SucheInOberoesterreich=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Oberoesterreich", suchworte: "test" });

      expect(params["Bundesland.SucheInOberoesterreich"]).toBe("true");
    });

    it("should map Tirol to Bundesland.SucheInTirol=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Tirol", suchworte: "test" });

      expect(params["Bundesland.SucheInTirol"]).toBe("true");
    });

    it("should map Vorarlberg to Bundesland.SucheInVorarlberg=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Vorarlberg", suchworte: "test" });

      expect(params["Bundesland.SucheInVorarlberg"]).toBe("true");
    });

    it("should map Kaernten to Bundesland.SucheInKaernten=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Kaernten", suchworte: "test" });

      expect(params["Bundesland.SucheInKaernten"]).toBe("true");
    });

    it("should map Steiermark to Bundesland.SucheInSteiermark=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Steiermark", suchworte: "test" });

      expect(params["Bundesland.SucheInSteiermark"]).toBe("true");
    });

    it("should map Burgenland to Bundesland.SucheInBurgenland=true", () => {
      const params = buildLandesrechtParams({ bundesland: "Burgenland", suchworte: "test" });

      expect(params["Bundesland.SucheInBurgenland"]).toBe("true");
    });

    it("should not add any Bundesland parameter for unknown values", () => {
      const params = buildLandesrechtParams({ bundesland: "UnknownState", suchworte: "test" });

      // Check that no Bundesland.* keys exist
      const bundeslandKeys = Object.keys(params).filter((k) => k.startsWith("Bundesland"));
      expect(bundeslandKeys).toHaveLength(0);
    });

    it("should not add bundesland parameter when not provided", () => {
      const params = buildLandesrechtParams({ suchworte: "test" });

      const bundeslandKeys = Object.keys(params).filter((k) => k.startsWith("Bundesland"));
      expect(bundeslandKeys).toHaveLength(0);
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildLandesrechtParams({
        suchworte: "Bauordnung",
        titel: "Baugesetz",
        bundesland: "Salzburg",
        applikation: "LrKons",
        seite: 2,
        limit: 50,
      });

      expect(params["Suchworte"]).toBe("Bauordnung");
      expect(params["Titel"]).toBe("Baugesetz");
      expect(params["Bundesland.SucheInSalzburg"]).toBe("true");
      expect(params["Applikation"]).toBe("LrKons");
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

// =============================================================================
// Bundesgesetzblatt API Parameter Mapping Tests
// =============================================================================

describe("Bundesgesetzblatt API parameter mapping", () => {
  // Re-implement the mapping logic for testing
  function buildBundesgesetzblattParams(args: {
    bgblnummer?: string;
    teil?: "1" | "2" | "3";
    jahrgang?: string;
    suchworte?: string;
    titel?: string;
    applikation?: "BgblAuth" | "BgblPdf" | "BgblAlt";
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const {
      bgblnummer,
      teil,
      jahrgang,
      suchworte,
      titel,
      applikation = "BgblAuth",
      seite = 1,
      limit = 20,
    } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (bgblnummer) params["Bgblnummer"] = bgblnummer;
    if (teil) params["Teil"] = teil;
    if (jahrgang) params["Jahrgang"] = jahrgang;
    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;

    return params;
  }

  describe("bgblnummer parameter", () => {
    it("should map bgblnummer to 'Bgblnummer' API parameter", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "120" });

      expect(params["Bgblnummer"]).toBe("120");
    });

    it("should not include Bgblnummer when bgblnummer is not provided", () => {
      const params = buildBundesgesetzblattParams({ suchworte: "Test" });

      expect(params["Bgblnummer"]).toBeUndefined();
    });
  });

  describe("teil parameter", () => {
    it("should map teil='1' to Teil='1' (Part I = Laws)", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1", teil: "1" });

      expect(params["Teil"]).toBe("1");
    });

    it("should map teil='2' to Teil='2' (Part II = Ordinances)", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1", teil: "2" });

      expect(params["Teil"]).toBe("2");
    });

    it("should map teil='3' to Teil='3' (Part III = Treaties)", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1", teil: "3" });

      expect(params["Teil"]).toBe("3");
    });
  });

  describe("jahrgang parameter", () => {
    it("should map jahrgang to 'Jahrgang' API parameter", () => {
      const params = buildBundesgesetzblattParams({ jahrgang: "2023" });

      expect(params["Jahrgang"]).toBe("2023");
    });
  });

  describe("applikation parameter", () => {
    it("should default to BgblAuth", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1" });

      expect(params["Applikation"]).toBe("BgblAuth");
    });

    it("should allow BgblPdf for PDF gazettes", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1", applikation: "BgblPdf" });

      expect(params["Applikation"]).toBe("BgblPdf");
    });

    it("should allow BgblAlt for historical gazettes (1945-2003)", () => {
      const params = buildBundesgesetzblattParams({ bgblnummer: "1", applikation: "BgblAlt" });

      expect(params["Applikation"]).toBe("BgblAlt");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildBundesgesetzblattParams({
        bgblnummer: "120",
        teil: "1",
        jahrgang: "2023",
        suchworte: "Klimaschutz",
        titel: "Klimagesetz",
        applikation: "BgblAuth",
        seite: 2,
        limit: 50,
      });

      expect(params["Bgblnummer"]).toBe("120");
      expect(params["Teil"]).toBe("1");
      expect(params["Jahrgang"]).toBe("2023");
      expect(params["Suchworte"]).toBe("Klimaschutz");
      expect(params["Titel"]).toBe("Klimagesetz");
      expect(params["Applikation"]).toBe("BgblAuth");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// Landesgesetzblatt API Parameter Mapping Tests
// =============================================================================

describe("Landesgesetzblatt API parameter mapping", () => {
  // Bundesland mapping constant (mirrors server.ts)
  const BUNDESLAND_MAPPING: Record<string, string> = {
    Wien: "SucheInWien",
    Niederoesterreich: "SucheInNiederoesterreich",
    Oberoesterreich: "SucheInOberoesterreich",
    Salzburg: "SucheInSalzburg",
    Tirol: "SucheInTirol",
    Vorarlberg: "SucheInVorarlberg",
    Kaernten: "SucheInKaernten",
    Steiermark: "SucheInSteiermark",
    Burgenland: "SucheInBurgenland",
  };

  // Re-implement the mapping logic for testing
  function buildLandesgesetzblattParams(args: {
    lgblnummer?: string;
    jahrgang?: string;
    bundesland?: string;
    suchworte?: string;
    titel?: string;
    applikation?: "LgblAuth" | "Lgbl" | "LgblNO";
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const {
      lgblnummer,
      jahrgang,
      bundesland,
      suchworte,
      titel,
      applikation = "LgblAuth",
      seite = 1,
      limit = 20,
    } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (lgblnummer) params["Lgblnummer"] = lgblnummer;
    if (jahrgang) params["Jahrgang"] = jahrgang;
    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = "true";
      }
    }

    return params;
  }

  describe("lgblnummer parameter", () => {
    it("should map lgblnummer to 'Lgblnummer' API parameter", () => {
      const params = buildLandesgesetzblattParams({ lgblnummer: "50" });

      expect(params["Lgblnummer"]).toBe("50");
    });

    it("should not include Lgblnummer when lgblnummer is not provided", () => {
      const params = buildLandesgesetzblattParams({ suchworte: "Test" });

      expect(params["Lgblnummer"]).toBeUndefined();
    });
  });

  describe("jahrgang parameter", () => {
    it("should map jahrgang to 'Jahrgang' API parameter", () => {
      const params = buildLandesgesetzblattParams({ jahrgang: "2023" });

      expect(params["Jahrgang"]).toBe("2023");
    });
  });

  describe("bundesland parameter", () => {
    it("should map Wien to Bundesland.SucheInWien=true", () => {
      const params = buildLandesgesetzblattParams({ bundesland: "Wien", lgblnummer: "1" });

      expect(params["Bundesland.SucheInWien"]).toBe("true");
    });

    it("should map all 9 Bundeslaender correctly", () => {
      const bundeslaender = Object.keys(BUNDESLAND_MAPPING);
      for (const bl of bundeslaender) {
        const params = buildLandesgesetzblattParams({ bundesland: bl, lgblnummer: "1" });
        expect(params[`Bundesland.${BUNDESLAND_MAPPING[bl]}`]).toBe("true");
      }
    });
  });

  describe("applikation parameter", () => {
    it("should default to LgblAuth", () => {
      const params = buildLandesgesetzblattParams({ lgblnummer: "1" });

      expect(params["Applikation"]).toBe("LgblAuth");
    });

    it("should allow Lgbl for general gazettes", () => {
      const params = buildLandesgesetzblattParams({ lgblnummer: "1", applikation: "Lgbl" });

      expect(params["Applikation"]).toBe("Lgbl");
    });

    it("should allow LgblNO for Lower Austria", () => {
      const params = buildLandesgesetzblattParams({ lgblnummer: "1", applikation: "LgblNO" });

      expect(params["Applikation"]).toBe("LgblNO");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildLandesgesetzblattParams({
        lgblnummer: "50",
        jahrgang: "2023",
        bundesland: "Wien",
        suchworte: "Bauordnung",
        titel: "Baugesetz",
        applikation: "LgblAuth",
        seite: 2,
        limit: 50,
      });

      expect(params["Lgblnummer"]).toBe("50");
      expect(params["Jahrgang"]).toBe("2023");
      expect(params["Bundesland.SucheInWien"]).toBe("true");
      expect(params["Suchworte"]).toBe("Bauordnung");
      expect(params["Titel"]).toBe("Baugesetz");
      expect(params["Applikation"]).toBe("LgblAuth");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// Regierungsvorlagen API Parameter Mapping Tests
// =============================================================================

describe("Regierungsvorlagen API parameter mapping", () => {
  // Re-implement the mapping logic for testing
  function buildRegierungsvorlagenParams(args: {
    nummer?: string;
    gesetzgebungsperiode?: string;
    suchworte?: string;
    titel?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { nummer, gesetzgebungsperiode, suchworte, titel, seite = 1, limit = 20 } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: "RegV",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (nummer) params["Nummer"] = nummer;
    if (gesetzgebungsperiode) params["Gesetzgebungsperiode"] = gesetzgebungsperiode;
    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;

    return params;
  }

  describe("fixed applikation", () => {
    it("should always set Applikation to 'RegV'", () => {
      const params = buildRegierungsvorlagenParams({ suchworte: "Test" });

      expect(params["Applikation"]).toBe("RegV");
    });
  });

  describe("nummer parameter", () => {
    it("should map nummer to 'Nummer' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ nummer: "123" });

      expect(params["Nummer"]).toBe("123");
    });

    it("should not include Nummer when nummer is not provided", () => {
      const params = buildRegierungsvorlagenParams({ suchworte: "Test" });

      expect(params["Nummer"]).toBeUndefined();
    });
  });

  describe("gesetzgebungsperiode parameter", () => {
    it("should map gesetzgebungsperiode to 'Gesetzgebungsperiode' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ gesetzgebungsperiode: "27" });

      expect(params["Gesetzgebungsperiode"]).toBe("27");
    });

    it("should handle Roman numeral periods as strings", () => {
      const params = buildRegierungsvorlagenParams({ gesetzgebungsperiode: "27", nummer: "100" });

      expect(params["Gesetzgebungsperiode"]).toBe("27");
      expect(params["Nummer"]).toBe("100");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildRegierungsvorlagenParams({
        nummer: "123",
        gesetzgebungsperiode: "27",
        suchworte: "Klimaschutz",
        titel: "Klimaschutzgesetz",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("RegV");
      expect(params["Nummer"]).toBe("123");
      expect(params["Gesetzgebungsperiode"]).toBe("27");
      expect(params["Suchworte"]).toBe("Klimaschutz");
      expect(params["Titel"]).toBe("Klimaschutzgesetz");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// New Tools - Validation Requirements Tests
// =============================================================================

describe("Parameter validation patterns for new tools", () => {
  describe("Bundesgesetzblatt search requirements", () => {
    it("should require at least one of: bgblnummer, jahrgang, suchworte, titel", () => {
      const params1 = { bgblnummer: "120" };
      const params2 = { jahrgang: "2023" };
      const params3 = { suchworte: "Test" };
      const params4 = { titel: "Gesetz" };
      const emptyParams = {};

      const hasRequired1 =
        params1.bgblnummer ||
        (params1 as { jahrgang?: string }).jahrgang ||
        (params1 as { suchworte?: string }).suchworte ||
        (params1 as { titel?: string }).titel;
      const hasRequired2 =
        (params2 as { bgblnummer?: string }).bgblnummer ||
        params2.jahrgang ||
        (params2 as { suchworte?: string }).suchworte ||
        (params2 as { titel?: string }).titel;
      const hasRequired3 =
        (params3 as { bgblnummer?: string }).bgblnummer ||
        (params3 as { jahrgang?: string }).jahrgang ||
        params3.suchworte ||
        (params3 as { titel?: string }).titel;
      const hasRequired4 =
        (params4 as { bgblnummer?: string }).bgblnummer ||
        (params4 as { jahrgang?: string }).jahrgang ||
        (params4 as { suchworte?: string }).suchworte ||
        params4.titel;
      const hasRequiredEmpty =
        (emptyParams as { bgblnummer?: string }).bgblnummer ||
        (emptyParams as { jahrgang?: string }).jahrgang ||
        (emptyParams as { suchworte?: string }).suchworte ||
        (emptyParams as { titel?: string }).titel;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequired4).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Landesgesetzblatt search requirements", () => {
    it("should require at least one of: lgblnummer, jahrgang, bundesland, suchworte, titel", () => {
      const params1 = { lgblnummer: "50" };
      const params2 = { bundesland: "Wien" };
      const params3 = { suchworte: "Test" };
      const emptyParams = {};

      const hasRequired1 =
        params1.lgblnummer ||
        (params1 as { jahrgang?: string }).jahrgang ||
        (params1 as { bundesland?: string }).bundesland ||
        (params1 as { suchworte?: string }).suchworte ||
        (params1 as { titel?: string }).titel;
      const hasRequired2 =
        (params2 as { lgblnummer?: string }).lgblnummer ||
        (params2 as { jahrgang?: string }).jahrgang ||
        params2.bundesland ||
        (params2 as { suchworte?: string }).suchworte ||
        (params2 as { titel?: string }).titel;
      const hasRequired3 =
        (params3 as { lgblnummer?: string }).lgblnummer ||
        (params3 as { jahrgang?: string }).jahrgang ||
        (params3 as { bundesland?: string }).bundesland ||
        params3.suchworte ||
        (params3 as { titel?: string }).titel;
      const hasRequiredEmpty =
        (emptyParams as { lgblnummer?: string }).lgblnummer ||
        (emptyParams as { jahrgang?: string }).jahrgang ||
        (emptyParams as { bundesland?: string }).bundesland ||
        (emptyParams as { suchworte?: string }).suchworte ||
        (emptyParams as { titel?: string }).titel;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Regierungsvorlagen search requirements", () => {
    it("should require at least one of: nummer, gesetzgebungsperiode, suchworte, titel", () => {
      const params1 = { nummer: "123" };
      const params2 = { gesetzgebungsperiode: "27" };
      const params3 = { suchworte: "Klimaschutz" };
      const params4 = { titel: "Klimagesetz" };
      const emptyParams = {};

      const hasRequired1 =
        params1.nummer ||
        (params1 as { gesetzgebungsperiode?: string }).gesetzgebungsperiode ||
        (params1 as { suchworte?: string }).suchworte ||
        (params1 as { titel?: string }).titel;
      const hasRequired2 =
        (params2 as { nummer?: string }).nummer ||
        params2.gesetzgebungsperiode ||
        (params2 as { suchworte?: string }).suchworte ||
        (params2 as { titel?: string }).titel;
      const hasRequired3 =
        (params3 as { nummer?: string }).nummer ||
        (params3 as { gesetzgebungsperiode?: string }).gesetzgebungsperiode ||
        params3.suchworte ||
        (params3 as { titel?: string }).titel;
      const hasRequired4 =
        (params4 as { nummer?: string }).nummer ||
        (params4 as { gesetzgebungsperiode?: string }).gesetzgebungsperiode ||
        (params4 as { suchworte?: string }).suchworte ||
        params4.titel;
      const hasRequiredEmpty =
        (emptyParams as { nummer?: string }).nummer ||
        (emptyParams as { gesetzgebungsperiode?: string }).gesetzgebungsperiode ||
        (emptyParams as { suchworte?: string }).suchworte ||
        (emptyParams as { titel?: string }).titel;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequired4).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Bezirke search requirements", () => {
    it("should require at least one of: suchworte, bundesland, bezirk, geschaeftszahl, norm", () => {
      const params1 = { suchworte: "test" };
      const params2 = { bundesland: "Wien" };
      const params3 = { bezirk: "Innsbruck" };
      const params4 = { geschaeftszahl: "12345/2023" };
      const params5 = { norm: "Bauordnung" };
      const emptyParams = {};

      const hasRequired1 =
        params1.suchworte ||
        (params1 as { bundesland?: string }).bundesland ||
        (params1 as { bezirk?: string }).bezirk ||
        (params1 as { geschaeftszahl?: string }).geschaeftszahl ||
        (params1 as { norm?: string }).norm;
      const hasRequired2 =
        (params2 as { suchworte?: string }).suchworte ||
        params2.bundesland ||
        (params2 as { bezirk?: string }).bezirk ||
        (params2 as { geschaeftszahl?: string }).geschaeftszahl ||
        (params2 as { norm?: string }).norm;
      const hasRequired3 =
        (params3 as { suchworte?: string }).suchworte ||
        (params3 as { bundesland?: string }).bundesland ||
        params3.bezirk ||
        (params3 as { geschaeftszahl?: string }).geschaeftszahl ||
        (params3 as { norm?: string }).norm;
      const hasRequired4 =
        (params4 as { suchworte?: string }).suchworte ||
        (params4 as { bundesland?: string }).bundesland ||
        (params4 as { bezirk?: string }).bezirk ||
        params4.geschaeftszahl ||
        (params4 as { norm?: string }).norm;
      const hasRequired5 =
        (params5 as { suchworte?: string }).suchworte ||
        (params5 as { bundesland?: string }).bundesland ||
        (params5 as { bezirk?: string }).bezirk ||
        (params5 as { geschaeftszahl?: string }).geschaeftszahl ||
        params5.norm;
      const hasRequiredEmpty =
        (emptyParams as { suchworte?: string }).suchworte ||
        (emptyParams as { bundesland?: string }).bundesland ||
        (emptyParams as { bezirk?: string }).bezirk ||
        (emptyParams as { geschaeftszahl?: string }).geschaeftszahl ||
        (emptyParams as { norm?: string }).norm;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequired4).toBeTruthy();
      expect(hasRequired5).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });

  describe("Gemeinden search requirements", () => {
    it("should require at least one of: suchworte, titel, bundesland, gemeinde", () => {
      const params1 = { suchworte: "test" };
      const params2 = { titel: "Verordnung" };
      const params3 = { bundesland: "Steiermark" };
      const params4 = { gemeinde: "Graz" };
      const emptyParams = {};

      const hasRequired1 =
        params1.suchworte ||
        (params1 as { titel?: string }).titel ||
        (params1 as { bundesland?: string }).bundesland ||
        (params1 as { gemeinde?: string }).gemeinde;
      const hasRequired2 =
        (params2 as { suchworte?: string }).suchworte ||
        params2.titel ||
        (params2 as { bundesland?: string }).bundesland ||
        (params2 as { gemeinde?: string }).gemeinde;
      const hasRequired3 =
        (params3 as { suchworte?: string }).suchworte ||
        (params3 as { titel?: string }).titel ||
        params3.bundesland ||
        (params3 as { gemeinde?: string }).gemeinde;
      const hasRequired4 =
        (params4 as { suchworte?: string }).suchworte ||
        (params4 as { titel?: string }).titel ||
        (params4 as { bundesland?: string }).bundesland ||
        params4.gemeinde;
      const hasRequiredEmpty =
        (emptyParams as { suchworte?: string }).suchworte ||
        (emptyParams as { titel?: string }).titel ||
        (emptyParams as { bundesland?: string }).bundesland ||
        (emptyParams as { gemeinde?: string }).gemeinde;

      expect(hasRequired1).toBeTruthy();
      expect(hasRequired2).toBeTruthy();
      expect(hasRequired3).toBeTruthy();
      expect(hasRequired4).toBeTruthy();
      expect(hasRequiredEmpty).toBeFalsy();
    });
  });
});

// =============================================================================
// Bezirke API Parameter Mapping Tests
// =============================================================================

describe("Bezirke API parameter mapping", () => {
  // Bundesland mapping constant (mirrors server.ts)
  const BUNDESLAND_MAPPING: Record<string, string> = {
    Wien: "SucheInWien",
    Niederoesterreich: "SucheInNiederoesterreich",
    Oberoesterreich: "SucheInOberoesterreich",
    Salzburg: "SucheInSalzburg",
    Tirol: "SucheInTirol",
    Vorarlberg: "SucheInVorarlberg",
    Kaernten: "SucheInKaernten",
    Steiermark: "SucheInSteiermark",
    Burgenland: "SucheInBurgenland",
  };

  // Re-implement the mapping logic for testing
  function buildBezirkeParams(args: {
    suchworte?: string;
    bundesland?: string;
    bezirk?: string;
    geschaeftszahl?: string;
    entscheidungsdatum_von?: string;
    entscheidungsdatum_bis?: string;
    norm?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const {
      suchworte,
      bundesland,
      bezirk,
      geschaeftszahl,
      entscheidungsdatum_von,
      entscheidungsdatum_bis,
      norm,
      seite = 1,
      limit = 20,
    } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: "Bvb",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (bezirk) params["Bezirk"] = bezirk;
    if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
    if (norm) params["Norm"] = norm;
    if (entscheidungsdatum_von) params["EntscheidungsdatumVon"] = entscheidungsdatum_von;
    if (entscheidungsdatum_bis) params["EntscheidungsdatumBis"] = entscheidungsdatum_bis;
    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = "true";
      }
    }

    return params;
  }

  describe("fixed applikation", () => {
    it("should always set Applikation to 'Bvb'", () => {
      const params = buildBezirkeParams({ suchworte: "Test" });

      expect(params["Applikation"]).toBe("Bvb");
    });
  });

  describe("bezirk parameter", () => {
    it("should map bezirk to 'Bezirk' API parameter", () => {
      const params = buildBezirkeParams({ bezirk: "Innsbruck" });

      expect(params["Bezirk"]).toBe("Innsbruck");
    });

    it("should not include Bezirk when bezirk is not provided", () => {
      const params = buildBezirkeParams({ suchworte: "Test" });

      expect(params["Bezirk"]).toBeUndefined();
    });
  });

  describe("geschaeftszahl parameter", () => {
    it("should map geschaeftszahl to 'Geschaeftszahl' API parameter", () => {
      const params = buildBezirkeParams({ geschaeftszahl: "12345/2023" });

      expect(params["Geschaeftszahl"]).toBe("12345/2023");
    });
  });

  describe("norm parameter", () => {
    it("should map norm to 'Norm' API parameter", () => {
      const params = buildBezirkeParams({ norm: "Bauordnung" });

      expect(params["Norm"]).toBe("Bauordnung");
    });
  });

  describe("date parameters", () => {
    it("should map entscheidungsdatum_von to 'EntscheidungsdatumVon'", () => {
      const params = buildBezirkeParams({ suchworte: "test", entscheidungsdatum_von: "2023-01-01" });

      expect(params["EntscheidungsdatumVon"]).toBe("2023-01-01");
    });

    it("should map entscheidungsdatum_bis to 'EntscheidungsdatumBis'", () => {
      const params = buildBezirkeParams({ suchworte: "test", entscheidungsdatum_bis: "2023-12-31" });

      expect(params["EntscheidungsdatumBis"]).toBe("2023-12-31");
    });
  });

  describe("bundesland parameter", () => {
    it("should map Wien to Bundesland.SucheInWien=true", () => {
      const params = buildBezirkeParams({ bundesland: "Wien" });

      expect(params["Bundesland.SucheInWien"]).toBe("true");
    });

    it("should map all 9 Bundeslaender correctly", () => {
      const bundeslaender = Object.keys(BUNDESLAND_MAPPING);
      for (const bl of bundeslaender) {
        const params = buildBezirkeParams({ bundesland: bl });
        expect(params[`Bundesland.${BUNDESLAND_MAPPING[bl]}`]).toBe("true");
      }
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildBezirkeParams({
        suchworte: "Baubewilligung",
        bundesland: "Tirol",
        bezirk: "Innsbruck",
        geschaeftszahl: "12345/2023",
        norm: "Bauordnung",
        entscheidungsdatum_von: "2023-01-01",
        entscheidungsdatum_bis: "2023-12-31",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("Bvb");
      expect(params["Suchworte"]).toBe("Baubewilligung");
      expect(params["Bundesland.SucheInTirol"]).toBe("true");
      expect(params["Bezirk"]).toBe("Innsbruck");
      expect(params["Geschaeftszahl"]).toBe("12345/2023");
      expect(params["Norm"]).toBe("Bauordnung");
      expect(params["EntscheidungsdatumVon"]).toBe("2023-01-01");
      expect(params["EntscheidungsdatumBis"]).toBe("2023-12-31");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// Gemeinden API Parameter Mapping Tests
// =============================================================================

describe("Gemeinden API parameter mapping", () => {
  // Bundesland mapping constant (mirrors server.ts)
  const BUNDESLAND_MAPPING: Record<string, string> = {
    Wien: "SucheInWien",
    Niederoesterreich: "SucheInNiederoesterreich",
    Oberoesterreich: "SucheInOberoesterreich",
    Salzburg: "SucheInSalzburg",
    Tirol: "SucheInTirol",
    Vorarlberg: "SucheInVorarlberg",
    Kaernten: "SucheInKaernten",
    Steiermark: "SucheInSteiermark",
    Burgenland: "SucheInBurgenland",
  };

  // Re-implement the mapping logic for testing
  function buildGemeindenParams(args: {
    suchworte?: string;
    titel?: string;
    bundesland?: string;
    gemeinde?: string;
    applikation?: "Gr" | "GrA";
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { suchworte, titel, bundesland, gemeinde, applikation = "Gr", seite = 1, limit = 20 } = args;

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
    if (gemeinde) params["Gemeinde"] = gemeinde;
    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = "true";
      }
    }

    return params;
  }

  describe("applikation parameter", () => {
    it("should default to 'Gr'", () => {
      const params = buildGemeindenParams({ suchworte: "Test" });

      expect(params["Applikation"]).toBe("Gr");
    });

    it("should allow 'GrA' for cross-border municipal law", () => {
      const params = buildGemeindenParams({ suchworte: "Test", applikation: "GrA" });

      expect(params["Applikation"]).toBe("GrA");
    });
  });

  describe("gemeinde parameter", () => {
    it("should map gemeinde to 'Gemeinde' API parameter", () => {
      const params = buildGemeindenParams({ gemeinde: "Graz" });

      expect(params["Gemeinde"]).toBe("Graz");
    });

    it("should not include Gemeinde when gemeinde is not provided", () => {
      const params = buildGemeindenParams({ suchworte: "Test" });

      expect(params["Gemeinde"]).toBeUndefined();
    });
  });

  describe("titel parameter", () => {
    it("should map titel to 'Titel' API parameter", () => {
      const params = buildGemeindenParams({ titel: "Gebuehrenordnung" });

      expect(params["Titel"]).toBe("Gebuehrenordnung");
    });
  });

  describe("bundesland parameter", () => {
    it("should map Steiermark to Bundesland.SucheInSteiermark=true", () => {
      const params = buildGemeindenParams({ bundesland: "Steiermark" });

      expect(params["Bundesland.SucheInSteiermark"]).toBe("true");
    });

    it("should map all 9 Bundeslaender correctly", () => {
      const bundeslaender = Object.keys(BUNDESLAND_MAPPING);
      for (const bl of bundeslaender) {
        const params = buildGemeindenParams({ bundesland: bl });
        expect(params[`Bundesland.${BUNDESLAND_MAPPING[bl]}`]).toBe("true");
      }
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildGemeindenParams({
        suchworte: "Parkgebuehren",
        titel: "Gebuehrenordnung",
        bundesland: "Steiermark",
        gemeinde: "Graz",
        applikation: "Gr",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("Gr");
      expect(params["Suchworte"]).toBe("Parkgebuehren");
      expect(params["Titel"]).toBe("Gebuehrenordnung");
      expect(params["Bundesland.SucheInSteiermark"]).toBe("true");
      expect(params["Gemeinde"]).toBe("Graz");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});
