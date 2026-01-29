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
  getDocumentContent,
  RISAPIError,
  RISParsingError,
  RISTimeoutError,
  searchBundesrecht,
  searchJudikatur,
  searchLandesrecht,
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
        'Court - "Justiz" (OGH/OLG/LG, default), "Vfgh" (Constitutional), "Vwgh" (Administrative), "Bvwg", "Dsk" (Data Protection)'
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
// Tool 4: ris_dokument
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
      let metadata: DocumentMetadata;

      if (dokumentnummer && !inputUrl) {
        // Determine application type from dokumentnummer prefix
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
        } else {
          // Default to Justiz
          apiResponse = await searchJudikatur({
            Applikation: "Justiz",
            Dokumentnummer: dokumentnummer,
            DokumenteProSeite: "Ten",
          });
        }

        // Find the document with matching dokumentnummer (don't blindly take first result)
        const findResult = findDocumentByDokumentnummer(apiResponse.documents, dokumentnummer);

        if (!findResult.success) {
          if (findResult.error === "no_documents") {
            return {
              content: [
                {
                  type: "text" as const,
                  text:
                    `**Fehler:** Kein Dokument mit der Nummer \`${dokumentnummer}\` gefunden.\n\n` +
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
                    `**Fehler:** Dokument \`${dokumentnummer}\` nicht in den Suchergebnissen gefunden.\n\n` +
                    `Die Suche ergab ${findResult.totalResults} Ergebnisse, aber keines mit dieser Dokumentnummer.\n` +
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

        // Build metadata
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

      // Fetch document content
      const htmlContent = await getDocumentContent(contentUrl);

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
