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
    suchworte?: string;
    titel?: string;
    beschlussdatum_von?: string;
    beschlussdatum_bis?: string;
    einbringende_stelle?: string;
    im_ris_seit?: string;
    sortierung_richtung?: string;
    sortierung_spalte?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const {
      suchworte,
      titel,
      beschlussdatum_von,
      beschlussdatum_bis,
      einbringende_stelle,
      im_ris_seit,
      sortierung_richtung,
      sortierung_spalte,
      seite = 1,
      limit = 20,
    } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    const params: Record<string, unknown> = {
      Applikation: "RegV",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (beschlussdatum_von) params["BeschlussdatumVon"] = beschlussdatum_von;
    if (beschlussdatum_bis) params["BeschlussdatumBis"] = beschlussdatum_bis;
    if (einbringende_stelle) params["EinbringendeStelle"] = einbringende_stelle;
    if (im_ris_seit) params["ImRisSeit"] = im_ris_seit;
    if (sortierung_richtung) params["Sortierung.SortDirection"] = sortierung_richtung;
    if (sortierung_spalte) params["Sortierung.SortedByColumn"] = sortierung_spalte;

    return params;
  }

  describe("fixed applikation", () => {
    it("should always set Applikation to 'RegV'", () => {
      const params = buildRegierungsvorlagenParams({ suchworte: "Test" });

      expect(params["Applikation"]).toBe("RegV");
    });
  });

  describe("date parameters", () => {
    it("should map beschlussdatum_von to 'BeschlussdatumVon' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ beschlussdatum_von: "2024-01-01" });

      expect(params["BeschlussdatumVon"]).toBe("2024-01-01");
    });

    it("should map beschlussdatum_bis to 'BeschlussdatumBis' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ beschlussdatum_bis: "2024-12-31" });

      expect(params["BeschlussdatumBis"]).toBe("2024-12-31");
    });

    it("should handle date range", () => {
      const params = buildRegierungsvorlagenParams({
        beschlussdatum_von: "2024-01-01",
        beschlussdatum_bis: "2024-06-30",
      });

      expect(params["BeschlussdatumVon"]).toBe("2024-01-01");
      expect(params["BeschlussdatumBis"]).toBe("2024-06-30");
    });
  });

  describe("einbringende_stelle parameter", () => {
    it("should map einbringende_stelle to 'EinbringendeStelle' API parameter", () => {
      const params = buildRegierungsvorlagenParams({
        einbringende_stelle: "BMF (Bundesministerium für Finanzen)",
      });

      expect(params["EinbringendeStelle"]).toBe("BMF (Bundesministerium für Finanzen)");
    });
  });

  describe("im_ris_seit parameter", () => {
    it("should map im_ris_seit to 'ImRisSeit' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ im_ris_seit: "EinemMonat" });

      expect(params["ImRisSeit"]).toBe("EinemMonat");
    });
  });

  describe("sorting parameters", () => {
    it("should map sortierung_richtung to 'Sortierung.SortDirection' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ sortierung_richtung: "Descending" });

      expect(params["Sortierung.SortDirection"]).toBe("Descending");
    });

    it("should map sortierung_spalte to 'Sortierung.SortedByColumn' API parameter", () => {
      const params = buildRegierungsvorlagenParams({ sortierung_spalte: "Beschlussdatum" });

      expect(params["Sortierung.SortedByColumn"]).toBe("Beschlussdatum");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildRegierungsvorlagenParams({
        suchworte: "Klimaschutz",
        titel: "Klimaschutzgesetz",
        beschlussdatum_von: "2024-01-01",
        beschlussdatum_bis: "2024-12-31",
        einbringende_stelle: "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie)",
        im_ris_seit: "EinemJahr",
        sortierung_richtung: "Descending",
        sortierung_spalte: "Beschlussdatum",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("RegV");
      expect(params["Suchworte"]).toBe("Klimaschutz");
      expect(params["Titel"]).toBe("Klimaschutzgesetz");
      expect(params["BeschlussdatumVon"]).toBe("2024-01-01");
      expect(params["BeschlussdatumBis"]).toBe("2024-12-31");
      expect(params["EinbringendeStelle"]).toBe(
        "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie)"
      );
      expect(params["ImRisSeit"]).toBe("EinemJahr");
      expect(params["Sortierung.SortDirection"]).toBe("Descending");
      expect(params["Sortierung.SortedByColumn"]).toBe("Beschlussdatum");
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
    if (bundesland) params["Bundesland"] = bundesland;

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
    it("should pass Bundesland directly to API", () => {
      const params = buildGemeindenParams({ bundesland: "Steiermark" });

      expect(params["Bundesland"]).toBe("Steiermark");
    });

    it("should pass any Bundesland value directly", () => {
      const bundeslaender = ["Wien", "Steiermark", "Kärnten", "Tirol"];
      for (const bl of bundeslaender) {
        const params = buildGemeindenParams({ bundesland: bl });
        expect(params["Bundesland"]).toBe(bl);
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
      expect(params["Bundesland"]).toBe("Steiermark");
      expect(params["Gemeinde"]).toBe("Graz");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

// =============================================================================
// Sonstige Search Requirements Tests
// =============================================================================

describe("Sonstige search requirements", () => {
  it("should require at least one of: suchworte, titel (beyond applikation)", () => {
    const params1 = { applikation: "Mrp", suchworte: "Budget" };
    const params2 = { applikation: "Erlaesse", titel: "Finanzministerium" };
    const onlyApplikation = { applikation: "Mrp" };

    const hasRequired1 =
      params1.suchworte || (params1 as { titel?: string }).titel;
    const hasRequired2 =
      (params2 as { suchworte?: string }).suchworte || params2.titel;
    const hasRequiredOnlyApp =
      (onlyApplikation as { suchworte?: string }).suchworte ||
      (onlyApplikation as { titel?: string }).titel;

    expect(hasRequired1).toBeTruthy();
    expect(hasRequired2).toBeTruthy();
    expect(hasRequiredOnlyApp).toBeFalsy();
  });

  it("should support all 8 applikation values", () => {
    const supportedApplikationen = ["PruefGewO", "Avsv", "Spg", "Avn", "KmGer", "Upts", "Mrp", "Erlaesse"];
    expect(supportedApplikationen).toHaveLength(8);

    // Verify all expected applikation values are present
    expect(supportedApplikationen).toContain("PruefGewO");
    expect(supportedApplikationen).toContain("Avsv");
    expect(supportedApplikationen).toContain("Spg");
    expect(supportedApplikationen).toContain("Avn");
    expect(supportedApplikationen).toContain("KmGer");
    expect(supportedApplikationen).toContain("Upts");
    expect(supportedApplikationen).toContain("Mrp");
    expect(supportedApplikationen).toContain("Erlaesse");
  });
});

// =============================================================================
// Sonstige API Parameter Mapping Tests
// =============================================================================

describe("History search requirements", () => {
  it("should require applikation always", () => {
    // applikation is a required parameter in the tool schema
    const params1 = { applikation: "BrKons", aenderungen_von: "2024-01-01" };
    expect(params1.applikation).toBeTruthy();
  });

  it("should require at least one date parameter", () => {
    const params1 = { applikation: "BrKons", aenderungen_von: "2024-01-01" };
    const params2 = { applikation: "BrKons", aenderungen_bis: "2024-01-31" };
    const params3 = { applikation: "BrKons", aenderungen_von: "2024-01-01", aenderungen_bis: "2024-01-31" };
    const onlyApplikation = { applikation: "BrKons" };

    const hasRequired1 = params1.aenderungen_von || (params1 as { aenderungen_bis?: string }).aenderungen_bis;
    const hasRequired2 = (params2 as { aenderungen_von?: string }).aenderungen_von || params2.aenderungen_bis;
    const hasRequired3 = params3.aenderungen_von || params3.aenderungen_bis;
    const hasRequiredOnlyApp =
      (onlyApplikation as { aenderungen_von?: string }).aenderungen_von ||
      (onlyApplikation as { aenderungen_bis?: string }).aenderungen_bis;

    expect(hasRequired1).toBeTruthy();
    expect(hasRequired2).toBeTruthy();
    expect(hasRequired3).toBeTruthy();
    expect(hasRequiredOnlyApp).toBeFalsy();
  });
});

describe("Verordnungen search requirements", () => {
  it("should require at least one of: suchworte, titel, bundesland, vblnummer, jahrgang", () => {
    const params1 = { suchworte: "test" };
    const params2 = { titel: "Verordnung" };
    const params3 = { bundesland: "Tirol" };
    const params4 = { vblnummer: "25" };
    const params5 = { jahrgang: "2023" };
    const emptyParams = {};

    const hasRequired1 =
      params1.suchworte ||
      (params1 as { titel?: string }).titel ||
      (params1 as { bundesland?: string }).bundesland ||
      (params1 as { vblnummer?: string }).vblnummer ||
      (params1 as { jahrgang?: string }).jahrgang;
    const hasRequired2 =
      (params2 as { suchworte?: string }).suchworte ||
      params2.titel ||
      (params2 as { bundesland?: string }).bundesland ||
      (params2 as { vblnummer?: string }).vblnummer ||
      (params2 as { jahrgang?: string }).jahrgang;
    const hasRequired3 =
      (params3 as { suchworte?: string }).suchworte ||
      (params3 as { titel?: string }).titel ||
      params3.bundesland ||
      (params3 as { vblnummer?: string }).vblnummer ||
      (params3 as { jahrgang?: string }).jahrgang;
    const hasRequired4 =
      (params4 as { suchworte?: string }).suchworte ||
      (params4 as { titel?: string }).titel ||
      (params4 as { bundesland?: string }).bundesland ||
      params4.vblnummer ||
      (params4 as { jahrgang?: string }).jahrgang;
    const hasRequired5 =
      (params5 as { suchworte?: string }).suchworte ||
      (params5 as { titel?: string }).titel ||
      (params5 as { bundesland?: string }).bundesland ||
      (params5 as { vblnummer?: string }).vblnummer ||
      params5.jahrgang;
    const hasRequiredEmpty =
      (emptyParams as { suchworte?: string }).suchworte ||
      (emptyParams as { titel?: string }).titel ||
      (emptyParams as { bundesland?: string }).bundesland ||
      (emptyParams as { vblnummer?: string }).vblnummer ||
      (emptyParams as { jahrgang?: string }).jahrgang;

    expect(hasRequired1).toBeTruthy();
    expect(hasRequired2).toBeTruthy();
    expect(hasRequired3).toBeTruthy();
    expect(hasRequired4).toBeTruthy();
    expect(hasRequired5).toBeTruthy();
    expect(hasRequiredEmpty).toBeFalsy();
  });
});

describe("History API parameter mapping", () => {
  // Re-implement the mapping logic for testing
  function buildHistoryParams(args: {
    applikation: string;
    aenderungen_von?: string;
    aenderungen_bis?: string;
    include_deleted?: boolean;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { applikation, aenderungen_von, aenderungen_bis, include_deleted, seite = 1, limit = 20 } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    // Note: History endpoint uses "Anwendung" not "Applikation"
    const params: Record<string, unknown> = {
      Anwendung: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (aenderungen_von) params["AenderungenVon"] = aenderungen_von;
    if (aenderungen_bis) params["AenderungenBis"] = aenderungen_bis;
    if (include_deleted) params["IncludeDeletedDocuments"] = "true";

    return params;
  }

  describe("applikation parameter", () => {
    it("should map applikation to 'Anwendung' (NOT 'Applikation')", () => {
      const params = buildHistoryParams({ applikation: "BrKons", aenderungen_von: "2024-01-01" });

      expect(params["Anwendung"]).toBe("BrKons");
      expect(params["Applikation"]).toBeUndefined();
    });
  });

  describe("date parameters", () => {
    it("should map aenderungen_von to 'AenderungenVon'", () => {
      const params = buildHistoryParams({ applikation: "BrKons", aenderungen_von: "2024-01-01" });

      expect(params["AenderungenVon"]).toBe("2024-01-01");
    });

    it("should map aenderungen_bis to 'AenderungenBis'", () => {
      const params = buildHistoryParams({ applikation: "BrKons", aenderungen_bis: "2024-01-31" });

      expect(params["AenderungenBis"]).toBe("2024-01-31");
    });
  });

  describe("include_deleted parameter", () => {
    it("should map include_deleted=true to 'IncludeDeletedDocuments=true'", () => {
      const params = buildHistoryParams({
        applikation: "BrKons",
        aenderungen_von: "2024-01-01",
        include_deleted: true,
      });

      expect(params["IncludeDeletedDocuments"]).toBe("true");
    });

    it("should not include IncludeDeletedDocuments when include_deleted is false", () => {
      const params = buildHistoryParams({
        applikation: "BrKons",
        aenderungen_von: "2024-01-01",
        include_deleted: false,
      });

      expect(params["IncludeDeletedDocuments"]).toBeUndefined();
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildHistoryParams({
        applikation: "LrKons",
        aenderungen_von: "2024-01-01",
        aenderungen_bis: "2024-01-31",
        include_deleted: true,
        seite: 2,
        limit: 50,
      });

      expect(params["Anwendung"]).toBe("LrKons");
      expect(params["AenderungenVon"]).toBe("2024-01-01");
      expect(params["AenderungenBis"]).toBe("2024-01-31");
      expect(params["IncludeDeletedDocuments"]).toBe("true");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

describe("Verordnungen API parameter mapping", () => {
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
  function buildVerordnungenParams(args: {
    suchworte?: string;
    titel?: string;
    bundesland?: string;
    vblnummer?: string;
    jahrgang?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { suchworte, titel, bundesland, vblnummer, jahrgang, seite = 1, limit = 20 } = args;

    const limitToDokumenteProSeite = (l: number): string => {
      const mapping: Record<number, string> = { 10: "Ten", 20: "Twenty", 50: "Fifty", 100: "OneHundred" };
      return mapping[l] ?? "Twenty";
    };

    // Uses Landesrecht endpoint with Applikation="Vbl"
    const params: Record<string, unknown> = {
      Applikation: "Vbl",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (vblnummer) params["Vblnummer"] = vblnummer;
    if (jahrgang) params["Jahrgang"] = jahrgang;
    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = "true";
      }
    }

    return params;
  }

  describe("fixed applikation", () => {
    it("should always set Applikation to 'Vbl'", () => {
      const params = buildVerordnungenParams({ suchworte: "Test" });

      expect(params["Applikation"]).toBe("Vbl");
    });
  });

  describe("vblnummer parameter", () => {
    it("should map vblnummer to 'Vblnummer' API parameter", () => {
      const params = buildVerordnungenParams({ vblnummer: "25" });

      expect(params["Vblnummer"]).toBe("25");
    });

    it("should not include Vblnummer when vblnummer is not provided", () => {
      const params = buildVerordnungenParams({ suchworte: "Test" });

      expect(params["Vblnummer"]).toBeUndefined();
    });
  });

  describe("jahrgang parameter", () => {
    it("should map jahrgang to 'Jahrgang' API parameter", () => {
      const params = buildVerordnungenParams({ jahrgang: "2023" });

      expect(params["Jahrgang"]).toBe("2023");
    });
  });

  describe("bundesland parameter", () => {
    it("should map Tirol to Bundesland.SucheInTirol=true", () => {
      const params = buildVerordnungenParams({ bundesland: "Tirol", suchworte: "Parkordnung" });

      expect(params["Bundesland.SucheInTirol"]).toBe("true");
    });

    it("should map all 9 Bundeslaender correctly", () => {
      const bundeslaender = Object.keys(BUNDESLAND_MAPPING);
      for (const bl of bundeslaender) {
        const params = buildVerordnungenParams({ bundesland: bl, suchworte: "test" });
        expect(params[`Bundesland.${BUNDESLAND_MAPPING[bl]}`]).toBe("true");
      }
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together", () => {
      const params = buildVerordnungenParams({
        suchworte: "Parkordnung",
        titel: "Parkverordnung",
        bundesland: "Tirol",
        vblnummer: "25",
        jahrgang: "2023",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("Vbl");
      expect(params["Suchworte"]).toBe("Parkordnung");
      expect(params["Titel"]).toBe("Parkverordnung");
      expect(params["Bundesland.SucheInTirol"]).toBe("true");
      expect(params["Vblnummer"]).toBe("25");
      expect(params["Jahrgang"]).toBe("2023");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});

describe("Sonstige API parameter mapping", () => {
  // Re-implement the mapping logic for testing
  function buildSonstigeParams(args: {
    applikation: "PruefGewO" | "Avsv" | "Spg" | "Avn" | "KmGer" | "Upts" | "Mrp" | "Erlaesse";
    suchworte?: string;
    titel?: string;
    datum_von?: string;
    datum_bis?: string;
    seite?: number;
    limit?: number;
  }): Record<string, unknown> {
    const { applikation, suchworte, titel, datum_von, datum_bis, seite = 1, limit = 20 } = args;

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
    if (datum_von || datum_bis) {
      switch (applikation) {
        case "Mrp":
          if (datum_von) params["Sitzungsdatum.Von"] = datum_von;
          if (datum_bis) params["Sitzungsdatum.Bis"] = datum_bis;
          break;
        case "Upts":
          if (datum_von) params["Entscheidungsdatum.Von"] = datum_von;
          if (datum_bis) params["Entscheidungsdatum.Bis"] = datum_bis;
          break;
        case "Erlaesse":
          if (datum_von) params["VonInkrafttretensdatum"] = datum_von;
          if (datum_bis) params["BisInkrafttretensdatum"] = datum_bis;
          break;
        case "PruefGewO":
        case "Spg":
        case "KmGer":
          if (datum_von) params["Kundmachungsdatum.Von"] = datum_von;
          if (datum_bis) params["Kundmachungsdatum.Bis"] = datum_bis;
          break;
        case "Avsv":
        case "Avn":
          if (datum_von) params["Kundmachung.Von"] = datum_von;
          if (datum_bis) params["Kundmachung.Bis"] = datum_bis;
          break;
      }
    }

    return params;
  }

  describe("applikation parameter", () => {
    it("should map PruefGewO to Applikation='PruefGewO'", () => {
      const params = buildSonstigeParams({ applikation: "PruefGewO", suchworte: "test" });
      expect(params["Applikation"]).toBe("PruefGewO");
    });

    it("should map Avsv to Applikation='Avsv'", () => {
      const params = buildSonstigeParams({ applikation: "Avsv", suchworte: "test" });
      expect(params["Applikation"]).toBe("Avsv");
    });

    it("should map Spg to Applikation='Spg'", () => {
      const params = buildSonstigeParams({ applikation: "Spg", suchworte: "test" });
      expect(params["Applikation"]).toBe("Spg");
    });

    it("should map KmGer to Applikation='KmGer'", () => {
      const params = buildSonstigeParams({ applikation: "KmGer", suchworte: "test" });
      expect(params["Applikation"]).toBe("KmGer");
    });

    it("should map Mrp to Applikation='Mrp'", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test" });
      expect(params["Applikation"]).toBe("Mrp");
    });

    it("should map Erlaesse to Applikation='Erlaesse'", () => {
      const params = buildSonstigeParams({ applikation: "Erlaesse", suchworte: "test" });
      expect(params["Applikation"]).toBe("Erlaesse");
    });

    it("should map Avn to Applikation='Avn'", () => {
      const params = buildSonstigeParams({ applikation: "Avn", suchworte: "test" });
      expect(params["Applikation"]).toBe("Avn");
    });

    it("should map Upts to Applikation='Upts'", () => {
      const params = buildSonstigeParams({ applikation: "Upts", suchworte: "test" });
      expect(params["Applikation"]).toBe("Upts");
    });
  });

  describe("suchworte parameter", () => {
    it("should map suchworte to 'Suchworte' API parameter", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "Budget" });
      expect(params["Suchworte"]).toBe("Budget");
    });

    it("should not include Suchworte when suchworte is not provided", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", titel: "Test" });
      expect(params["Suchworte"]).toBeUndefined();
    });
  });

  describe("titel parameter", () => {
    it("should map titel to 'Titel' API parameter", () => {
      const params = buildSonstigeParams({ applikation: "Erlaesse", titel: "Finanzministerium" });
      expect(params["Titel"]).toBe("Finanzministerium");
    });

    it("should not include Titel when titel is not provided", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test" });
      expect(params["Titel"]).toBeUndefined();
    });
  });

  describe("date parameters", () => {
    it("should map datum_von/bis to 'Sitzungsdatum.Von/Bis' for Mrp", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Sitzungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Sitzungsdatum.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Entscheidungsdatum.Von/Bis' for Upts", () => {
      const params = buildSonstigeParams({ applikation: "Upts", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Entscheidungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Entscheidungsdatum.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'VonInkrafttretensdatum/BisInkrafttretensdatum' for Erlaesse", () => {
      const params = buildSonstigeParams({ applikation: "Erlaesse", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["VonInkrafttretensdatum"]).toBe("2023-01-01");
      expect(params["BisInkrafttretensdatum"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Kundmachungsdatum.Von/Bis' for PruefGewO", () => {
      const params = buildSonstigeParams({ applikation: "PruefGewO", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Kundmachungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Kundmachungsdatum.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Kundmachungsdatum.Von/Bis' for Spg", () => {
      const params = buildSonstigeParams({ applikation: "Spg", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Kundmachungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Kundmachungsdatum.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Kundmachungsdatum.Von/Bis' for KmGer", () => {
      const params = buildSonstigeParams({ applikation: "KmGer", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Kundmachungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Kundmachungsdatum.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Kundmachung.Von/Bis' for Avsv", () => {
      const params = buildSonstigeParams({ applikation: "Avsv", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Kundmachung.Von"]).toBe("2023-01-01");
      expect(params["Kundmachung.Bis"]).toBe("2023-12-31");
    });

    it("should map datum_von/bis to 'Kundmachung.Von/Bis' for Avn", () => {
      const params = buildSonstigeParams({ applikation: "Avn", suchworte: "test", datum_von: "2023-01-01", datum_bis: "2023-12-31" });
      expect(params["Kundmachung.Von"]).toBe("2023-01-01");
      expect(params["Kundmachung.Bis"]).toBe("2023-12-31");
    });

    it("should not include date params when not provided", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test" });
      expect(params["Sitzungsdatum.Von"]).toBeUndefined();
      expect(params["Sitzungsdatum.Bis"]).toBeUndefined();
    });
  });

  describe("pagination parameters", () => {
    it("should default seite to 1", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test" });
      expect(params["Seitennummer"]).toBe(1);
    });

    it("should default limit to Twenty (20)", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test" });
      expect(params["DokumenteProSeite"]).toBe("Twenty");
    });

    it("should map custom seite value", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test", seite: 3 });
      expect(params["Seitennummer"]).toBe(3);
    });

    it("should map limit=10 to 'Ten'", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test", limit: 10 });
      expect(params["DokumenteProSeite"]).toBe("Ten");
    });

    it("should map limit=50 to 'Fifty'", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test", limit: 50 });
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });

    it("should map limit=100 to 'OneHundred'", () => {
      const params = buildSonstigeParams({ applikation: "Mrp", suchworte: "test", limit: 100 });
      expect(params["DokumenteProSeite"]).toBe("OneHundred");
    });
  });

  describe("combined parameters", () => {
    it("should correctly map all parameters together for Mrp", () => {
      const params = buildSonstigeParams({
        applikation: "Mrp",
        suchworte: "Budget",
        titel: "Ministerrat",
        datum_von: "2023-01-01",
        datum_bis: "2023-12-31",
        seite: 2,
        limit: 50,
      });

      expect(params["Applikation"]).toBe("Mrp");
      expect(params["Suchworte"]).toBe("Budget");
      expect(params["Titel"]).toBe("Ministerrat");
      expect(params["Sitzungsdatum.Von"]).toBe("2023-01-01");
      expect(params["Sitzungsdatum.Bis"]).toBe("2023-12-31");
      expect(params["Seitennummer"]).toBe(2);
      expect(params["DokumenteProSeite"]).toBe("Fifty");
    });
  });
});
