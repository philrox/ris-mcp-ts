/**
 * MCP Server for the Austrian RIS (Rechtsinformationssystem).
 *
 * This module provides an MCP server with tools for searching and retrieving
 * Austrian legal documents including federal laws, state laws, and court decisions.
 *
 * API Documentation: https://data.bka.gv.at/ris/api/v2.6/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getDocumentByNumber,
  getDocumentContent,
  RISAPIError,
  RISParsingError,
  RISTimeoutError,
  searchBezirke,
  searchBundesrecht,
  searchGemeinden,
  searchHistory,
  searchJudikatur,
  searchLandesrecht,
  searchSonstige,
} from "./client.js";
import {
  formatDocument,
  formatSearchResults,
  truncateResponse,
  type DocumentMetadata,
} from "./formatting.js";
import { findDocumentByDokumentnummer, parseSearchResults } from "./parser.js";
import { limitToDokumenteProSeite } from "./types.js";

// =============================================================================
// Constants
// =============================================================================

/**
 * Mapping of Bundesland names to their API parameter suffixes.
 * The RIS API expects boolean flags in the format `Bundesland.SucheIn[StateName]=true`.
 */
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

/**
 * Index categories for Gemeinden (Gr) application.
 * Used to filter municipal law by subject area.
 * Values from API documentation: OGD_Gemeinderecht_Request.xsd
 */
const GEMEINDEN_INDEX_VALUES = [
  "Undefined",
  "VertretungskoerperUndAllgemeineVerwaltung",
  "OeffentlicheOrdnungUndSicherheit",
  "UnterrichtErziehungSportUndWissenschaft",
  "KunstKulturUndKultus",
  "SozialeWohlfahrtUndWohnbaufoerderung",
  "Gesundheit",
  "StraßenUndWasserbauVerkehr",
  "Wirtschaftsfoerderung",
  "Dienstleistungen",
  "Finanzwirtschaft",
] as const;

/**
 * ImRisSeit values for time-based filtering.
 */
const IM_RIS_SEIT_VALUES = [
  "EinerWoche",
  "ZweiWochen",
  "EinemMonat",
  "DreiMonaten",
  "SechsMonaten",
  "EinemJahr",
] as const;

/**
 * Political parties for UPTS (Parteien-Transparenz-Senat) application.
 */
const UPTS_PARTEIEN = [
  "SPÖ - Sozialdemokratische Partei Österreichs",
  "ÖVP - Österreichische Volkspartei",
  "FPÖ - Freiheitliche Partei Österreichs",
  "GRÜNE - Die Grünen - Die Grüne Alternative",
  "NEOS - NEOS – Das Neue Österreich und Liberales Forum",
  "BZÖ - Bündnis Zukunft Österreich",
] as const;

/**
 * Federal ministries for Erlaesse (decrees) application.
 */
const BUNDESMINISTERIEN = [
  "BKA (Bundeskanzleramt)",
  "BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im Bundeskanzleramt)",
  "BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)",
  "BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und Sport)",
  "BMEIA (Bundesministerium für europäische und internationale Angelegenheiten)",
  "BMAW (Bundesministerium für Arbeit und Wirtschaft)",
  "BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)",
  "BMF (Bundesministerium für Finanzen)",
  "BMI (Bundesministerium für Inneres)",
  "BMJ (Bundesministerium für Justiz)",
  "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie)",
  "BMLV (Bundesministerium für Landesverteidigung)",
  "BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und Wasserwirtschaft)",
  "BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und Konsumentenschutz)",
] as const;

/**
 * Document types for KmGer (court announcements) application.
 */
const KMGER_TYP_VALUES = [
  "Konkursverfahren",
  "Sanierungsverfahren",
] as const;

/**
 * Document types for Avsv (social insurance announcements) application.
 */
const AVSV_DOKUMENTART_VALUES = [
  "Richtlinie",
  "Kundmachung",
  "Verlautbarung",
] as const;

/**
 * Authors (Urheber) for Avsv application.
 */
const AVSV_URHEBER_VALUES = [
  "Dachverband der Sozialversicherungsträger",
  "Pensionsversicherungsanstalt",
  "Österreichische Gesundheitskasse",
  "Allgemeine Unfallversicherungsanstalt",
  "Sozialversicherungsanstalt der Selbständigen",
  "Versicherungsanstalt öffentlich Bediensteter, Eisenbahnen und Bergbau",
] as const;

/**
 * Type values for Avn (veterinary notices) application.
 */
const AVN_TYP_VALUES = [
  "Kundmachung",
  "Verordnung",
  "Erlass",
] as const;

/**
 * OSG (Österreichischer Strukturplan Gesundheit) types for Spg application.
 */
const SPG_OSG_TYP_VALUES = [
  "ÖSG",
  "ÖSG - Großgeräteplan",
] as const;

/**
 * RSG (Regionaler Strukturplan Gesundheit) types for Spg application.
 */
const SPG_RSG_TYP_VALUES = [
  "RSG",
  "RSG - Großgeräteplan",
] as const;

/**
 * PruefGewO examination types.
 */
const PRUEFGEWO_TYP_VALUES = [
  "Befähigungsprüfung",
  "Eignungsprüfung",
  "Meisterprüfung",
] as const;

/**
 * Valid application names for the History API endpoint.
 * The History API uses "Anwendung" parameter with specific application names.
 */
const VALID_HISTORY_APPLICATIONS = [
  "Bundesnormen",
  "Landesnormen",
  "Justiz",
  "Vfgh",
  "Vwgh",
  "Bvwg",
  "Lvwg",
  "BgblAuth",
  "BgblAlt",
  "BgblPdf",
  "LgblAuth",
  "Lgbl",
  "LgblNO",
  "Gemeinderecht",
  "GemeinderechtAuth",
  "Bvb",
  "Vbl",
  "RegV",
  "Mrp",
  "Erlaesse",
  "PruefGewO",
  "Avsv",
  "Spg",
  "KmGer",
  "Dsk",
  "Gbk",
  "Dok",
  "Pvak",
  "Normenliste",
  "AsylGH",
] as const;

// =============================================================================
// Server Setup
// =============================================================================

export const server = new McpServer({
  name: "ris-mcp",
  version: "1.0.0",
});

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Format an error response in German.
 */
function formatErrorResponse(error: unknown): string {
  if (error instanceof RISTimeoutError) {
    return (
      "**Fehler:** Die Anfrage an das RIS hat zu lange gedauert.\n\n" +
      "Bitte versuche es erneut oder verwende spezifischere Suchparameter."
    );
  }

  if (error instanceof RISParsingError) {
    return (
      "**Fehler:** Die Antwort des RIS konnte nicht verarbeitet werden.\n\n" +
      `Technische Details: ${error.message}`
    );
  }

  if (error instanceof RISAPIError) {
    const statusInfo = error.statusCode ? ` (Status: ${error.statusCode})` : "";
    return (
      `**Fehler:** Das RIS hat einen Fehler zurueckgegeben${statusInfo}.\n\n` +
      `Details: ${error.message}`
    );
  }

  return (
    "**Fehler:** Ein unerwarteter Fehler ist aufgetreten.\n\n" +
    `Details: ${error instanceof Error ? error.message : String(error)}`
  );
}

// =============================================================================
// Tool 1: ris_bundesrecht
// =============================================================================

server.tool(
  "ris_bundesrecht",
  `Search Austrian federal laws (Bundesrecht).

Use this tool to find Austrian federal legislation like ABGB, StGB, UGB, etc.

Example queries:
  - suchworte="Mietrecht" -> Find laws mentioning rent law
  - titel="ABGB", paragraph="1319a" -> Find specific ABGB section
  - applikation="Begut" -> Search draft legislation`,
  {
    suchworte: z
      .string()
      .optional()
      .describe('Full-text search terms (e.g., "Mietrecht", "Schadenersatz")'),
    titel: z
      .string()
      .optional()
      .describe('Search in law titles (e.g., "ABGB", "Strafgesetzbuch")'),
    paragraph: z
      .string()
      .optional()
      .describe('Paragraph number to search for (e.g., "1295" for §1295)'),
    applikation: z
      .string()
      .default("BrKons")
      .describe(
        'Data source - "BrKons" (consolidated, default), "Begut" (drafts), "Erv" (English)'
      ),
    fassung_vom: z
      .string()
      .optional()
      .describe("Date for historical version (YYYY-MM-DD)"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z
      .number()
      .default(20)
      .describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { suchworte, titel, paragraph, applikation, fassung_vom, seite, limit, response_format } =
      args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !paragraph) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Gesetzesnamen\n" +
              "- `paragraph` fuer Suche nach Paragraphen",
          },
        ],
      };
    }

    // Build API parameters
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

    try {
      const apiResponse = await searchBundesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 2: ris_landesrecht
// =============================================================================

server.tool(
  "ris_landesrecht",
  `Search Austrian state/provincial laws (Landesrecht).

Use this tool to find laws enacted by Austrian federal states (Bundeslaender).

Example: suchworte="Bauordnung", bundesland="Salzburg"`,
  {
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in law titles"),
    bundesland: z
      .string()
      .optional()
      .describe(
        "Filter by state - Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland"
      ),
    applikation: z
      .string()
      .default("LrKons")
      .describe('"LrKons" (consolidated, default)'),
    seite: z.number().default(1).describe("Page number"),
    limit: z.number().default(20).describe("Results per page"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" or "json"'),
  },
  async (args) => {
    const { suchworte, titel, bundesland, applikation, seite, limit, response_format } = args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !bundesland) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Gesetzesnamen\n" +
              "- `bundesland` fuer Suche nach Bundesland",
          },
        ],
      };
    }

    // Build API parameters
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

    try {
      const apiResponse = await searchLandesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 3: ris_judikatur
// =============================================================================

server.tool(
  "ris_judikatur",
  `Search Austrian court decisions (Judikatur).

Use this tool to find court decisions from Austrian courts.

Example: gericht="Vfgh", suchworte="Grundrecht"`,
  {
    suchworte: z.string().optional().describe("Full-text search in decisions"),
    gericht: z
      .string()
      .default("Justiz")
      .describe(
        'Court - "Justiz" (OGH/OLG/LG, default), "Vfgh" (Constitutional), "Vwgh" (Administrative), "Bvwg", "Lvwg", "Dsk" (Data Protection), "AsylGH" (historical), "Normenliste", "Pvak", "Gbk", "Dok"'
      ),
    norm: z
      .string()
      .optional()
      .describe('Search by legal norm (e.g., "1319a ABGB")'),
    geschaeftszahl: z
      .string()
      .optional()
      .describe('Case number (e.g., "5Ob234/20b")'),
    entscheidungsdatum_von: z.string().optional().describe("Decision date from (YYYY-MM-DD)"),
    entscheidungsdatum_bis: z.string().optional().describe("Decision date to (YYYY-MM-DD)"),
    seite: z.number().default(1).describe("Page number"),
    limit: z.number().default(20).describe("Results per page"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" or "json"'),
  },
  async (args) => {
    const {
      suchworte,
      gericht,
      norm,
      geschaeftszahl,
      entscheidungsdatum_von,
      entscheidungsdatum_bis,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter
    if (!suchworte && !norm && !geschaeftszahl) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `norm` fuer Suche nach Rechtsnorm\n" +
              "- `geschaeftszahl` fuer Suche nach Geschaeftszahl",
          },
        ],
      };
    }

    // Build API parameters
    const params: Record<string, unknown> = {
      Applikation: gericht,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (norm) params["Norm"] = norm;
    if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
    if (entscheidungsdatum_von) params["EntscheidungsdatumVon"] = entscheidungsdatum_von;
    if (entscheidungsdatum_bis) params["EntscheidungsdatumBis"] = entscheidungsdatum_bis;

    try {
      const apiResponse = await searchJudikatur(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 4: ris_bundesgesetzblatt
// =============================================================================

server.tool(
  "ris_bundesgesetzblatt",
  `Search Austrian Federal Law Gazettes (Bundesgesetzblatt).

Use this tool for historical research and tracking when laws were enacted.
Contains official publications of federal laws, ordinances, and treaties.

Example queries:
  - bgblnummer="120", jahrgang="2023", teil="1" -> Find specific gazette
  - suchworte="Klimaschutz" -> Full-text search in gazettes`,
  {
    bgblnummer: z.string().optional().describe('Gazette number (e.g., "120")'),
    teil: z
      .enum(["1", "2", "3"])
      .optional()
      .describe('Part - "1" (I=Laws), "2" (II=Ordinances), "3" (III=Treaties)'),
    jahrgang: z.string().optional().describe('Year (e.g., "2023")'),
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in gazette titles"),
    applikation: z
      .enum(["BgblAuth", "BgblPdf", "BgblAlt"])
      .default("BgblAuth")
      .describe('"BgblAuth" (authentic 2004+, default), "BgblPdf" (PDF), "BgblAlt" (1945-2003)'),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { bgblnummer, teil, jahrgang, suchworte, titel, applikation, seite, limit, response_format } =
      args;

    // Validate at least one search parameter
    if (!bgblnummer && !jahrgang && !suchworte && !titel) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `bgblnummer` fuer Gesetzblatt-Nummer\n" +
              "- `jahrgang` fuer Jahr\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Titeln",
          },
        ],
      };
    }

    // Build API parameters
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

    try {
      const apiResponse = await searchBundesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 5: ris_landesgesetzblatt
// =============================================================================

server.tool(
  "ris_landesgesetzblatt",
  `Search Austrian State Law Gazettes (Landesgesetzblatt).

Use this tool to find official publications of state/provincial laws.
Covers all 9 federal states (Bundeslaender).

Example queries:
  - lgblnummer="50", jahrgang="2023", bundesland="Wien"
  - suchworte="Bauordnung", bundesland="Salzburg"`,
  {
    lgblnummer: z.string().optional().describe('Gazette number (e.g., "50")'),
    jahrgang: z.string().optional().describe('Year (e.g., "2023")'),
    bundesland: z
      .string()
      .optional()
      .describe(
        "Filter by state - Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland"
      ),
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in gazette titles"),
    applikation: z
      .enum(["LgblAuth", "Lgbl", "LgblNO"])
      .default("LgblAuth")
      .describe('"LgblAuth" (authentic, default), "Lgbl" (general), "LgblNO" (Lower Austria)'),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { lgblnummer, jahrgang, bundesland, suchworte, titel, applikation, seite, limit, response_format } =
      args;

    // Validate at least one search parameter
    if (!lgblnummer && !jahrgang && !bundesland && !suchworte && !titel) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `lgblnummer` fuer Gesetzblatt-Nummer\n" +
              "- `jahrgang` fuer Jahr\n" +
              "- `bundesland` fuer Bundesland\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Titeln",
          },
        ],
      };
    }

    // Build API parameters
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

    try {
      const apiResponse = await searchLandesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 6: ris_regierungsvorlagen
// =============================================================================

server.tool(
  "ris_regierungsvorlagen",
  `Search Austrian Government Bills (Regierungsvorlagen).

Use this tool for legislative history and parliamentary materials.
Contains government proposals submitted to parliament.

Example queries:
  - suchworte="Klimaschutz" -> Full-text search in bills
  - einbringende_stelle="BMF (Bundesministerium für Finanzen)" -> Bills from Finance Ministry
  - beschlussdatum_von="2024-01-01", beschlussdatum_bis="2024-12-31" -> Bills from 2024`,
  {
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in bill titles"),
    beschlussdatum_von: z
      .string()
      .optional()
      .describe("Decision date from (YYYY-MM-DD)"),
    beschlussdatum_bis: z
      .string()
      .optional()
      .describe("Decision date to (YYYY-MM-DD)"),
    einbringende_stelle: z
      .enum([
        "BKA (Bundeskanzleramt)",
        "BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im Bundeskanzleramt)",
        "BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)",
        "BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und Sport)",
        "BMEIA (Bundesministerium für europäische und internationale Angelegenheiten)",
        "BMAW (Bundesministerium für Arbeit und Wirtschaft)",
        "BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)",
        "BMF (Bundesministerium für Finanzen)",
        "BMI (Bundesministerium für Inneres)",
        "BMJ (Bundesministerium für Justiz)",
        "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie)",
        "BMLV (Bundesministerium für Landesverteidigung)",
        "BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und Wasserwirtschaft)",
        "BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und Konsumentenschutz)",
      ])
      .optional()
      .describe("Filter by submitting ministry"),
    im_ris_seit: z
      .enum([
        "EinerWoche",
        "ZweiWochen",
        "EinemMonat",
        "DreiMonaten",
        "SechsMonaten",
        "EinemJahr",
      ])
      .optional()
      .describe("Filter by time in RIS"),
    sortierung_richtung: z
      .enum(["Ascending", "Descending"])
      .optional()
      .describe("Sort direction"),
    sortierung_spalte: z
      .enum(["Kurztitel", "EinbringendeStelle", "Beschlussdatum"])
      .optional()
      .describe("Sort by column"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      suchworte,
      titel,
      beschlussdatum_von,
      beschlussdatum_bis,
      einbringende_stelle,
      im_ris_seit,
      sortierung_richtung,
      sortierung_spalte,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !beschlussdatum_von && !einbringende_stelle && !im_ris_seit) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` für Volltextsuche\n" +
              "- `titel` für Suche in Titeln\n" +
              "- `beschlussdatum_von/bis` für Datumsfilter\n" +
              "- `einbringende_stelle` für Ministerium\n" +
              "- `im_ris_seit` für Zeitfilter",
          },
        ],
      };
    }

    // Build API parameters
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

    try {
      const apiResponse = await searchBundesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 7: ris_dokument
// =============================================================================

server.tool(
  "ris_dokument",
  `Retrieve full text of a legal document.

Use this after searching to load the complete text of a specific law or decision.

Note: For long documents, content may be truncated. Use specific searches to narrow down.`,
  {
    dokumentnummer: z
      .string()
      .optional()
      .describe('RIS document number (e.g., "NOR40052761") - from search results'),
    url: z.string().optional().describe("Direct URL to document content"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { dokumentnummer, url: inputUrl, response_format } = args;

    if (!dokumentnummer && !inputUrl) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib entweder eine `dokumentnummer` oder eine `url` an.\n\n" +
              "Die Dokumentnummer findest du in den Suchergebnissen von `ris_bundesrecht`, " +
              "`ris_landesrecht` oder `ris_judikatur`.",
          },
        ],
      };
    }

    try {
      let contentUrl = inputUrl;
      let htmlContent: string | undefined;
      let metadata: DocumentMetadata;

      if (dokumentnummer && !inputUrl) {
        // Strategy: Try direct URL construction first, fallback to search API
        const directResult = await getDocumentByNumber(dokumentnummer);

        if (directResult.success) {
          // Direct fetch succeeded - use minimal metadata
          htmlContent = directResult.html;
          contentUrl = directResult.url;
          metadata = {
            dokumentnummer,
            applikation: "Unbekannt",
            titel: dokumentnummer,
            kurztitel: null,
            citation: {},
            dokument_url: directResult.url,
          };
        } else {
          // Direct fetch failed - fallback to search API
          let apiResponse;

          if (dokumentnummer.startsWith("NOR")) {
            apiResponse = await searchBundesrecht({
              Applikation: "BrKons",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (
            dokumentnummer.startsWith("LBG") ||
            dokumentnummer.startsWith("LNO") ||
            dokumentnummer.startsWith("LST") ||
            dokumentnummer.startsWith("LTI") ||
            dokumentnummer.startsWith("LVO") ||
            dokumentnummer.startsWith("LWI") ||
            dokumentnummer.startsWith("LSB") ||
            dokumentnummer.startsWith("LOO") ||
            dokumentnummer.startsWith("LKT")
          ) {
            apiResponse = await searchLandesrecht({
              Applikation: "LrKons",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("JFR") || dokumentnummer.startsWith("JFT")) {
            apiResponse = await searchJudikatur({
              Applikation: "Vfgh",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("JWR") || dokumentnummer.startsWith("JWT")) {
            apiResponse = await searchJudikatur({
              Applikation: "Vwgh",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("BVWG")) {
            apiResponse = await searchJudikatur({
              Applikation: "Bvwg",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("LVWG")) {
            apiResponse = await searchJudikatur({
              Applikation: "Lvwg",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("DSB")) {
            apiResponse = await searchJudikatur({
              Applikation: "Dsk",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("GBK")) {
            apiResponse = await searchJudikatur({
              Applikation: "Gbk",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("PVAK")) {
            apiResponse = await searchJudikatur({
              Applikation: "Pvak",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("ASYLGH")) {
            apiResponse = await searchJudikatur({
              Applikation: "AsylGH",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("BGBLA") || dokumentnummer.startsWith("BGBL")) {
            // Bundesgesetzblätter - use Bundesrecht endpoint
            const applikation = dokumentnummer.startsWith("BGBLA") ? "BgblAuth" : "BgblAlt";
            apiResponse = await searchBundesrecht({
              Applikation: applikation,
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("REGV")) {
            // Regierungsvorlagen - use Bundesrecht endpoint
            apiResponse = await searchBundesrecht({
              Applikation: "RegV",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else if (dokumentnummer.startsWith("MRP") || dokumentnummer.startsWith("ERL")) {
            // Sonstige Sammlungen - use Sonstige endpoint
            apiResponse = await searchSonstige({
              Applikation: dokumentnummer.startsWith("MRP") ? "Mrp" : "Erlaesse",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          } else {
            // Default to Justiz for unknown prefixes
            apiResponse = await searchJudikatur({
              Applikation: "Justiz",
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: "Ten",
            });
          }

          // Find the document with matching dokumentnummer (don't blindly take first result)
          const findResult = findDocumentByDokumentnummer(apiResponse.documents, dokumentnummer);

          if (!findResult.success) {
            // Both direct fetch and search failed - provide helpful error
            const directError = directResult.error;
            if (findResult.error === "no_documents") {
              return {
                content: [
                  {
                    type: "text" as const,
                    text:
                      `**Fehler:** Kein Dokument mit der Nummer \`${dokumentnummer}\` gefunden.\n\n` +
                      `Direkter Abruf: ${directError}\n` +
                      `Suche: Keine Ergebnisse.\n\n` +
                      "Bitte pruefe die Dokumentnummer oder verwende eine Suche, " +
                      "um das gewuenschte Dokument zu finden.",
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text:
                      `**Fehler:** Dokument \`${dokumentnummer}\` nicht gefunden.\n\n` +
                      `Direkter Abruf: ${directError}\n` +
                      `Suche: ${findResult.totalResults} Ergebnisse, aber keines mit dieser Dokumentnummer.\n\n` +
                      `Bitte verwende eine alternative Suche oder die direkte URL.`,
                  },
                ],
              };
            }
          }

          const doc = findResult.document;
          contentUrl = doc.content_urls.html ?? undefined;

          if (!contentUrl) {
            return {
              content: [
                {
                  type: "text" as const,
                  text:
                    `**Fehler:** Keine Inhalts-URL fuer Dokument \`${dokumentnummer}\` verfuegbar.\n\n` +
                    "Das Dokument hat moeglicherweise keinen abrufbaren Volltext.",
                },
              ],
            };
          }

          // Build metadata from search result
          metadata = {
            dokumentnummer: doc.dokumentnummer,
            applikation: doc.applikation,
            titel: doc.titel,
            kurztitel: doc.kurztitel,
            citation: {
              kurztitel: doc.citation.kurztitel,
              langtitel: doc.citation.langtitel,
              kundmachungsorgan: doc.citation.kundmachungsorgan,
              paragraph: doc.citation.paragraph,
              eli: doc.citation.eli,
              inkrafttreten: doc.citation.inkrafttreten,
              ausserkrafttreten: doc.citation.ausserkrafttreten,
            },
            dokument_url: doc.dokument_url,
            gesamte_rechtsvorschrift_url: doc.gesamte_rechtsvorschrift_url,
          };
        }
      } else {
        // Only URL provided - minimal metadata
        metadata = {
          dokumentnummer: dokumentnummer ?? "Unbekannt",
          applikation: "Unbekannt",
          titel: inputUrl ?? "",
          kurztitel: null,
          citation: {},
          dokument_url: inputUrl,
        };
      }

      if (!contentUrl) {
        return {
          content: [
            {
              type: "text" as const,
              text: "**Fehler:** Keine gueltige URL zum Abrufen des Dokuments.",
            },
          ],
        };
      }

      // Fetch document content if not already fetched via direct URL
      if (!htmlContent) {
        htmlContent = await getDocumentContent(contentUrl);
      }

      // Format the document
      const formatted = formatDocument(htmlContent, metadata, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 8: ris_bezirke
// =============================================================================

server.tool(
  "ris_bezirke",
  `Search Austrian district administrative authority announcements (Kundmachungen der Bezirksverwaltungsbehörden).

Use this tool to find announcements and ordinances from district administrative authorities.

Note: Only certain states publish here: Niederösterreich, Oberösterreich, Tirol, Vorarlberg, Burgenland, Steiermark.

Example queries:
  - bundesland="Niederösterreich", suchworte="Bauordnung"
  - bezirksverwaltungsbehoerde="Bezirkshauptmannschaft Innsbruck"`,
  {
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in titles"),
    bundesland: z
      .string()
      .optional()
      .describe(
        "Filter by state - Burgenland, Kärnten, Niederösterreich, Oberösterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien"
      ),
    bezirksverwaltungsbehoerde: z
      .string()
      .optional()
      .describe(
        'District authority name (e.g., "Bezirkshauptmannschaft Innsbruck", "Bezirkshauptmannschaft Amstetten")'
      ),
    kundmachungsnummer: z.string().optional().describe("Announcement number"),
    kundmachungsdatum_von: z.string().optional().describe("Announcement date from (YYYY-MM-DD)"),
    kundmachungsdatum_bis: z.string().optional().describe("Announcement date to (YYYY-MM-DD)"),
    im_ris_seit: z
      .enum(["EinerWoche", "ZweiWochen", "EinemMonat", "DreiMonaten", "SechsMonaten", "EinemJahr"])
      .optional()
      .describe("Filter by time in RIS"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      suchworte,
      titel,
      bundesland,
      bezirksverwaltungsbehoerde,
      kundmachungsnummer,
      kundmachungsdatum_von,
      kundmachungsdatum_bis,
      im_ris_seit,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !bundesland && !bezirksverwaltungsbehoerde && !kundmachungsnummer) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` für Volltextsuche\n" +
              "- `titel` für Titelsuche\n" +
              "- `bundesland` für Bundesland\n" +
              "- `bezirksverwaltungsbehoerde` für Bezirksverwaltungsbehörde\n" +
              "- `kundmachungsnummer` für Kundmachungsnummer",
          },
        ],
      };
    }

    // Build API parameters
    const params: Record<string, unknown> = {
      Applikation: "Bvb",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (bundesland) params["Bundesland"] = bundesland;
    if (bezirksverwaltungsbehoerde) params["Bezirksverwaltungsbehoerde"] = bezirksverwaltungsbehoerde;
    if (kundmachungsnummer) params["Kundmachungsnummer"] = kundmachungsnummer;
    if (kundmachungsdatum_von) params["Kundmachungsdatum.Von"] = kundmachungsdatum_von;
    if (kundmachungsdatum_bis) params["Kundmachungsdatum.Bis"] = kundmachungsdatum_bis;
    if (im_ris_seit) params["ImRisSeit"] = im_ris_seit;

    try {
      const apiResponse = await searchBezirke(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 9: ris_gemeinden
// =============================================================================

server.tool(
  "ris_gemeinden",
  `Search Austrian municipal law (Gemeinderecht).

Use this tool to find municipal regulations and local ordinances.

Applications:
  - Gr: Municipal law (Gemeinderecht) - default
  - GrA: Cross-border municipal law (Gemeinderecht Authentisch/Amtsblätter)

Example queries:
  - gemeinde="Graz", suchworte="Parkgebuehren"
  - bundesland="Tirol", titel="Gebuehrenordnung"
  - applikation="Gr", index="Baurecht"
  - applikation="GrA", bezirk="Bregenz"`,
  {
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in titles"),
    bundesland: z
      .string()
      .optional()
      .describe(
        "Filter by state - Burgenland, Kärnten, Niederösterreich, Oberösterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien"
      ),
    gemeinde: z.string().optional().describe('Municipality name (e.g., "Graz")'),
    applikation: z
      .enum(["Gr", "GrA"])
      .default("Gr")
      .describe('"Gr" (municipal law, default) or "GrA" (cross-border/Amtsblätter)'),
    // Parameters for Gr application
    geschaeftszahl: z
      .string()
      .optional()
      .describe("File number/Aktenzeichen (Gr only)"),
    index: z
      .enum(GEMEINDEN_INDEX_VALUES)
      .optional()
      .describe(
        "Subject area index (Gr only) - VertretungskoerperUndAllgemeineVerwaltung, OeffentlicheOrdnungUndSicherheit, UnterrichtErziehungSportUndWissenschaft, KunstKulturUndKultus, SozialeWohlfahrtUndWohnbaufoerderung, Gesundheit, StraßenUndWasserbauVerkehr, Wirtschaftsfoerderung, Dienstleistungen, Finanzwirtschaft"
      ),
    fassung_vom: z
      .string()
      .optional()
      .describe("Historical version date (YYYY-MM-DD, Gr only)"),
    // Parameters for GrA application
    bezirk: z
      .string()
      .optional()
      .describe('District name (GrA only, e.g., "Bregenz")'),
    gemeindeverband: z
      .string()
      .optional()
      .describe("Municipal association name (GrA only)"),
    kundmachungsnummer: z
      .string()
      .optional()
      .describe("Announcement number (GrA only)"),
    kundmachungsdatum_von: z
      .string()
      .optional()
      .describe("Announcement date from (YYYY-MM-DD, GrA only)"),
    kundmachungsdatum_bis: z
      .string()
      .optional()
      .describe("Announcement date to (YYYY-MM-DD, GrA only)"),
    // Common parameters
    im_ris_seit: z
      .enum(IM_RIS_SEIT_VALUES)
      .optional()
      .describe("Filter by time in RIS - EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr"),
    sortierung_richtung: z
      .enum(["Ascending", "Descending"])
      .optional()
      .describe("Sort direction"),
    sortierung_spalte_gr: z
      .enum(["Geschaeftszahl", "Bundesland", "Gemeinde"])
      .optional()
      .describe("Sort column (Gr only)"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      suchworte,
      titel,
      bundesland,
      gemeinde,
      applikation,
      geschaeftszahl,
      index,
      fassung_vom,
      bezirk,
      gemeindeverband,
      kundmachungsnummer,
      kundmachungsdatum_von,
      kundmachungsdatum_bis,
      im_ris_seit,
      sortierung_richtung,
      sortierung_spalte_gr,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !bundesland && !gemeinde && !geschaeftszahl && !index && !bezirk && !kundmachungsnummer) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Titeln\n" +
              "- `bundesland` fuer Bundesland\n" +
              "- `gemeinde` fuer Gemeinde\n" +
              "- `geschaeftszahl` fuer Aktenzeichen (Gr)\n" +
              "- `index` fuer Sachgebiet (Gr)\n" +
              "- `bezirk` fuer Bezirk (GrA)\n" +
              "- `kundmachungsnummer` fuer Kundmachungsnummer (GrA)",
          },
        ],
      };
    }

    // Build API parameters
    const params: Record<string, unknown> = {
      Applikation: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    // Common parameters
    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (gemeinde) params["Gemeinde"] = gemeinde;
    if (bundesland) params["Bundesland"] = bundesland;
    if (im_ris_seit) params["ImRisSeit"] = im_ris_seit;
    if (sortierung_richtung) params["Sortierung.SortDirection"] = sortierung_richtung;

    // Gr-specific parameters
    if (applikation === "Gr") {
      if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
      if (index) params["Index"] = index;
      if (fassung_vom) params["FassungVom"] = fassung_vom;
      if (sortierung_spalte_gr) params["Sortierung.SortedByColumn"] = sortierung_spalte_gr;
    }

    // GrA-specific parameters
    if (applikation === "GrA") {
      if (bezirk) params["Bezirk"] = bezirk;
      if (gemeindeverband) params["Gemeindeverband"] = gemeindeverband;
      if (kundmachungsnummer) params["Kundmachungsnummer"] = kundmachungsnummer;
      if (kundmachungsdatum_von) params["Kundmachungsdatum.Von"] = kundmachungsdatum_von;
      if (kundmachungsdatum_bis) params["Kundmachungsdatum.Bis"] = kundmachungsdatum_bis;
    }

    try {
      const apiResponse = await searchGemeinden(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 10: ris_sonstige
// =============================================================================

server.tool(
  "ris_sonstige",
  `Search miscellaneous Austrian legal collections (Sonstige).

Use this tool for specialized legal documents and historical materials.

Available applications:
  - PruefGewO: Trade licensing examinations (Gewerbeordnung)
  - Avsv: Social insurance announcements (Sozialversicherung)
  - Spg: Health structure plans (Strukturpläne Gesundheit)
  - Avn: Official veterinary notices (Amtliche Veterinärnachrichten)
  - KmGer: Court announcements (Kundmachungen der Gerichte)
  - Upts: Party transparency decisions (Parteien-Transparenz-Senat)
  - Mrp: Council of Ministers protocols (Ministerratsprotokolle)
  - Erlaesse: Ministerial decrees (Erlässe der Bundesministerien)

Example queries:
  - applikation="Mrp", suchworte="Budget", einbringer="BMF..."
  - applikation="Erlaesse", bundesministerium="BMF (Bundesministerium für Finanzen)"
  - applikation="Upts", partei="SPÖ - Sozialdemokratische Partei Österreichs"
  - applikation="KmGer", kmger_typ="Konkursverfahren"
  - applikation="Avsv", dokumentart="Richtlinie"`,
  {
    applikation: z
      .enum(["PruefGewO", "Avsv", "Spg", "Avn", "KmGer", "Upts", "Mrp", "Erlaesse"])
      .describe(
        'Collection to search - "PruefGewO" (trade exams), "Avsv" (social insurance), "Spg" (health plans), "Avn" (veterinary notices), "KmGer" (court announcements), "Upts" (party transparency), "Mrp" (cabinet protocols), "Erlaesse" (decrees)'
      ),
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in titles"),
    datum_von: z.string().optional().describe("Date from (YYYY-MM-DD)"),
    datum_bis: z.string().optional().describe("Date to (YYYY-MM-DD)"),
    // Common parameters
    im_ris_seit: z
      .enum(IM_RIS_SEIT_VALUES)
      .optional()
      .describe("Filter by time in RIS - EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr"),
    sortierung_richtung: z
      .enum(["Ascending", "Descending"])
      .optional()
      .describe("Sort direction"),
    geschaeftszahl: z
      .string()
      .optional()
      .describe("File number/Aktenzeichen (for Mrp, Upts, KmGer)"),
    norm: z
      .string()
      .optional()
      .describe("Legal norm reference (for Erlaesse, Upts)"),
    fassung_vom: z
      .string()
      .optional()
      .describe("Historical version date (YYYY-MM-DD, for Erlaesse)"),
    // Mrp-specific parameters
    einbringer: z
      .string()
      .optional()
      .describe("Submitter (Mrp only, e.g., ministry abbreviation)"),
    sitzungsnummer: z
      .string()
      .optional()
      .describe("Session number (Mrp only)"),
    gesetzgebungsperiode: z
      .string()
      .optional()
      .describe("Legislative period (Mrp only, e.g., '27')"),
    // Erlaesse-specific parameters
    bundesministerium: z
      .enum(BUNDESMINISTERIEN)
      .optional()
      .describe("Federal ministry (Erlaesse only)"),
    abteilung: z
      .string()
      .optional()
      .describe("Department/division (Erlaesse only)"),
    fundstelle: z
      .string()
      .optional()
      .describe("Source reference (Erlaesse only)"),
    // Upts-specific parameters
    partei: z
      .enum(UPTS_PARTEIEN)
      .optional()
      .describe("Political party (Upts only)"),
    // KmGer-specific parameters
    kmger_typ: z
      .enum(KMGER_TYP_VALUES)
      .optional()
      .describe("Announcement type (KmGer only) - Konkursverfahren, Sanierungsverfahren"),
    gericht: z
      .string()
      .optional()
      .describe("Court name (KmGer only)"),
    // Avsv-specific parameters
    dokumentart: z
      .enum(AVSV_DOKUMENTART_VALUES)
      .optional()
      .describe("Document type (Avsv only) - Richtlinie, Kundmachung, Verlautbarung"),
    urheber: z
      .enum(AVSV_URHEBER_VALUES)
      .optional()
      .describe("Author/institution (Avsv only)"),
    avsvnummer: z
      .string()
      .optional()
      .describe("AVSV number (Avsv only)"),
    // Avn-specific parameters
    avnnummer: z
      .string()
      .optional()
      .describe("AVN number (Avn only)"),
    avn_typ: z
      .enum(AVN_TYP_VALUES)
      .optional()
      .describe("Notice type (Avn only) - Kundmachung, Verordnung, Erlass"),
    // Spg-specific parameters
    spgnummer: z
      .string()
      .optional()
      .describe("SPG number (Spg only)"),
    osg_typ: z
      .enum(SPG_OSG_TYP_VALUES)
      .optional()
      .describe("Austrian health structure plan type (Spg only) - ÖSG, ÖSG - Großgeräteplan"),
    rsg_typ: z
      .enum(SPG_RSG_TYP_VALUES)
      .optional()
      .describe("Regional health structure plan type (Spg only) - RSG, RSG - Großgeräteplan"),
    rsg_land: z
      .string()
      .optional()
      .describe("Federal state for RSG (Spg only)"),
    // PruefGewO-specific parameters
    pruefgewo_typ: z
      .enum(PRUEFGEWO_TYP_VALUES)
      .optional()
      .describe("Examination type (PruefGewO only) - Befähigungsprüfung, Eignungsprüfung, Meisterprüfung"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      applikation,
      suchworte,
      titel,
      datum_von,
      datum_bis,
      im_ris_seit,
      sortierung_richtung,
      geschaeftszahl,
      norm,
      fassung_vom,
      einbringer,
      sitzungsnummer,
      gesetzgebungsperiode,
      bundesministerium,
      abteilung,
      fundstelle,
      partei,
      kmger_typ,
      gericht,
      dokumentart,
      urheber,
      avsvnummer,
      avnnummer,
      avn_typ,
      spgnummer,
      osg_typ,
      rsg_typ,
      rsg_land,
      pruefgewo_typ,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter beyond applikation
    const hasSearchParam =
      suchworte ||
      titel ||
      geschaeftszahl ||
      norm ||
      einbringer ||
      sitzungsnummer ||
      gesetzgebungsperiode ||
      bundesministerium ||
      abteilung ||
      fundstelle ||
      partei ||
      kmger_typ ||
      gericht ||
      dokumentart ||
      urheber ||
      avsvnummer ||
      avnnummer ||
      avn_typ ||
      spgnummer ||
      osg_typ ||
      rsg_typ ||
      rsg_land ||
      pruefgewo_typ ||
      im_ris_seit ||
      datum_von ||
      datum_bis;

    if (!hasSearchParam) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Suche in Titeln\n" +
              "- oder applikationsspezifische Parameter (siehe Tool-Beschreibung)",
          },
        ],
      };
    }

    // Build API parameters
    const params: Record<string, unknown> = {
      Applikation: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    // Common parameters
    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (im_ris_seit) params["ImRisSeit"] = im_ris_seit;
    if (sortierung_richtung) params["Sortierung.SortDirection"] = sortierung_richtung;

    // Build date parameters based on application type
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

    // Application-specific parameters
    switch (applikation) {
      case "Mrp":
        if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
        if (einbringer) params["Einbringer"] = einbringer;
        if (sitzungsnummer) params["Sitzungsnummer"] = sitzungsnummer;
        if (gesetzgebungsperiode) params["Gesetzgebungsperiode"] = gesetzgebungsperiode;
        break;
      case "Erlaesse":
        if (norm) params["Norm"] = norm;
        if (fassung_vom) params["FassungVom"] = fassung_vom;
        if (bundesministerium) params["Bundesministerium"] = bundesministerium;
        if (abteilung) params["Abteilung"] = abteilung;
        if (fundstelle) params["Fundstelle"] = fundstelle;
        break;
      case "Upts":
        if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
        if (norm) params["Norm"] = norm;
        if (partei) params["Partei"] = partei;
        break;
      case "KmGer":
        if (geschaeftszahl) params["Geschaeftszahl"] = geschaeftszahl;
        if (kmger_typ) params["Typ"] = kmger_typ;
        if (gericht) params["Gericht"] = gericht;
        break;
      case "Avsv":
        if (dokumentart) params["Dokumentart"] = dokumentart;
        if (urheber) params["Urheber"] = urheber;
        if (avsvnummer) params["Avsvnummer"] = avsvnummer;
        break;
      case "Avn":
        if (avnnummer) params["Avnnummer"] = avnnummer;
        if (avn_typ) params["Typ"] = avn_typ;
        break;
      case "Spg":
        if (spgnummer) params["Spgnummer"] = spgnummer;
        if (osg_typ) params["OsgTyp"] = osg_typ;
        if (rsg_typ) params["RsgTyp"] = rsg_typ;
        if (rsg_land) params["RsgLand"] = rsg_land;
        break;
      case "PruefGewO":
        if (pruefgewo_typ) params["Typ"] = pruefgewo_typ;
        break;
    }

    try {
      const apiResponse = await searchSonstige(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 11: ris_history
// =============================================================================

server.tool(
  "ris_history",
  `Search document change history (Aenderungshistorie).

Use this tool to track changes to legal documents over time.
Shows when documents were created, modified, or deleted.

Available applications (30 total):
  - Bundesrecht: Bundesnormen, BgblAuth, BgblAlt, BgblPdf, RegV
  - Landesrecht: Landesnormen, LgblAuth, Lgbl, LgblNO, Vbl, Gemeinderecht, GemeinderechtAuth
  - Judikatur: Justiz, Vfgh, Vwgh, Bvwg, Lvwg, Dsk, Gbk, Pvak, AsylGH
  - Sonstige: Bvb, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dok, Normenliste

Example queries:
  - applikation="Bundesnormen", aenderungen_von="2024-01-01", aenderungen_bis="2024-01-31"
  - applikation="Justiz", aenderungen_von="2024-06-01"`,
  {
    applikation: z
      .enum(VALID_HISTORY_APPLICATIONS)
      .describe(
        'Application to search history for - categories: Bundesrecht (Bundesnormen, BgblAuth, BgblAlt, BgblPdf, RegV), ' +
          'Landesrecht (Landesnormen, LgblAuth, Lgbl, LgblNO, Vbl, Gemeinderecht), ' +
          'Judikatur (Justiz, Vfgh, Vwgh, Bvwg, Lvwg, Dsk, Gbk, Pvak, AsylGH), ' +
          'Sonstige (Bvb, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dok, Normenliste)'
      ),
    aenderungen_von: z.string().optional().describe("Changes from date (YYYY-MM-DD)"),
    aenderungen_bis: z.string().optional().describe("Changes to date (YYYY-MM-DD)"),
    include_deleted: z
      .boolean()
      .default(false)
      .describe("Include deleted documents in results (default: false)"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { applikation, aenderungen_von, aenderungen_bis, include_deleted, seite, limit, response_format } =
      args;

    // Validate at least one date parameter
    if (!aenderungen_von && !aenderungen_bis) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Datumsparameter an:\n" +
              "- `aenderungen_von` fuer Aenderungen ab Datum\n" +
              "- `aenderungen_bis` fuer Aenderungen bis Datum",
          },
        ],
      };
    }

    // Build API parameters
    // Note: History endpoint uses "Anwendung" not "Applikation"
    const params: Record<string, unknown> = {
      Anwendung: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (aenderungen_von) params["AenderungenVon"] = aenderungen_von;
    if (aenderungen_bis) params["AenderungenBis"] = aenderungen_bis;
    if (include_deleted) params["IncludeDeletedDocuments"] = "true";

    try {
      const apiResponse = await searchHistory(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);

// =============================================================================
// Tool 12: ris_verordnungen
// =============================================================================

/**
 * Valid Bundesland values for Vbl (Verordnungsblätter) API.
 * Note: Vbl uses direct Bundesland values, NOT the SucheIn format used by Lgbl.
 */
const VALID_VBL_BUNDESLAENDER = [
  "Burgenland",
  "Kaernten",
  "Niederoesterreich",
  "Oberoesterreich",
  "Salzburg",
  "Steiermark",
  "Tirol",
  "Vorarlberg",
  "Wien",
] as const;

server.tool(
  "ris_verordnungen",
  `Search Austrian state ordinance gazettes (Verordnungsblaetter der Laender).

Use this tool to find official publications of state/provincial ordinances.
NOTE: Currently only Tirol data is available (since January 1, 2022).
Other federal states have not yet published their ordinance gazettes in RIS.

Example queries:
  - suchworte="Wolf" -> Full-text search
  - titel="Verordnung" -> Search in title
  - bundesland="Tirol" -> Filter by state (currently only Tirol has data)
  - kundmachungsnummer="25" -> Search by publication number
  - kundmachungsdatum_von="2024-01-01", kundmachungsdatum_bis="2024-12-31" -> Date range`,
  {
    suchworte: z.string().optional().describe("Full-text search terms"),
    titel: z.string().optional().describe("Search in title"),
    bundesland: z
      .enum(VALID_VBL_BUNDESLAENDER)
      .optional()
      .describe("Filter by state (currently only Tirol has data)"),
    kundmachungsnummer: z.string().optional().describe("Publication number"),
    kundmachungsdatum_von: z.string().optional().describe("Publication date from (YYYY-MM-DD)"),
    kundmachungsdatum_bis: z.string().optional().describe("Publication date to (YYYY-MM-DD)"),
    seite: z.number().default(1).describe("Page number (default: 1)"),
    limit: z.number().default(20).describe("Results per page 10/20/50/100 (default: 20)"),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      suchworte,
      titel,
      bundesland,
      kundmachungsnummer,
      kundmachungsdatum_von,
      kundmachungsdatum_bis,
      seite,
      limit,
      response_format,
    } = args;

    // Validate at least one search parameter
    if (!suchworte && !titel && !bundesland && !kundmachungsnummer && !kundmachungsdatum_von) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "**Fehler:** Bitte gib mindestens einen Suchparameter an:\n" +
              "- `suchworte` fuer Volltextsuche\n" +
              "- `titel` fuer Titelsuche\n" +
              "- `bundesland` fuer Bundesland-Filter\n" +
              "- `kundmachungsnummer` fuer Verordnungsnummer\n" +
              "- `kundmachungsdatum_von` fuer Datum ab",
          },
        ],
      };
    }

    // Build API parameters
    // Uses Landesrecht endpoint with Applikation="Vbl"
    // Note: Vbl uses direct Bundesland values, NOT the SucheIn format used by Lgbl
    const params: Record<string, unknown> = {
      Applikation: "Vbl",
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    if (suchworte) params["Suchworte"] = suchworte;
    if (titel) params["Titel"] = titel;
    if (bundesland) params["Bundesland"] = bundesland;
    if (kundmachungsnummer) params["Kundmachungsnummer"] = kundmachungsnummer;
    if (kundmachungsdatum_von) params["Kundmachungsdatum.Von"] = kundmachungsdatum_von;
    if (kundmachungsdatum_bis) params["Kundmachungsdatum.Bis"] = kundmachungsdatum_bis;

    try {
      const apiResponse = await searchLandesrecht(params);
      const searchResult = parseSearchResults(apiResponse);
      const formatted = formatSearchResults(searchResult, response_format);
      const result = truncateResponse(formatted);

      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: formatErrorResponse(e) }],
      };
    }
  }
);
