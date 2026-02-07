/**
 * MCP Server for the Austrian RIS (Rechtsinformationssystem).
 *
 * This module provides an MCP server with tools for searching and retrieving
 * Austrian legal documents including federal laws, state laws, and court decisions.
 *
 * API Documentation: https://data.bka.gv.at/ris/api/v2.6/
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  getDocumentByNumber,
  getDocumentContent,
  isAllowedUrl,
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
} from './client.js';
import {
  formatDocument,
  formatSearchResults,
  truncateResponse,
  type DocumentMetadata,
} from './formatting.js';
import { findDocumentByDokumentnummer, parseSearchResults } from './parser.js';
import {
  type NormalizedSearchResults,
  BundeslandSchema,
  BundesrechtApplikationSchema,
  DateSchema,
  JudikaturGerichtSchema,
  LandesrechtBundeslandSchema,
  limitToDokumenteProSeite,
} from './types.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Mapping of Bundesland names to their API parameter suffixes.
 * The RIS API expects boolean flags in the format `Bundesland.SucheIn[StateName]=true`.
 */
const BUNDESLAND_MAPPING: Record<string, string> = {
  Wien: 'SucheInWien',
  Niederoesterreich: 'SucheInNiederoesterreich',
  Oberoesterreich: 'SucheInOberoesterreich',
  Salzburg: 'SucheInSalzburg',
  Tirol: 'SucheInTirol',
  Vorarlberg: 'SucheInVorarlberg',
  Kaernten: 'SucheInKaernten',
  Steiermark: 'SucheInSteiermark',
  Burgenland: 'SucheInBurgenland',
};

/**
 * Index categories for Gemeinden (Gr) application.
 * Used to filter municipal law by subject area.
 * Values from API documentation: OGD_Gemeinderecht_Request.xsd
 */
const GEMEINDEN_INDEX_VALUES = [
  'Undefined',
  'VertretungskoerperUndAllgemeineVerwaltung',
  'OeffentlicheOrdnungUndSicherheit',
  'UnterrichtErziehungSportUndWissenschaft',
  'KunstKulturUndKultus',
  'SozialeWohlfahrtUndWohnbaufoerderung',
  'Gesundheit',
  'StraßenUndWasserbauVerkehr',
  'Wirtschaftsfoerderung',
  'Dienstleistungen',
  'Finanzwirtschaft',
] as const;

/**
 * ImRisSeit values for time-based filtering.
 */
const IM_RIS_SEIT_VALUES = [
  'EinerWoche',
  'ZweiWochen',
  'EinemMonat',
  'DreiMonaten',
  'SechsMonaten',
  'EinemJahr',
] as const;

/**
 * Political parties for UPTS (Parteien-Transparenz-Senat) application.
 */
const UPTS_PARTEIEN = [
  'SPÖ - Sozialdemokratische Partei Österreichs',
  'ÖVP - Österreichische Volkspartei',
  'FPÖ - Freiheitliche Partei Österreichs',
  'GRÜNE - Die Grünen - Die Grüne Alternative',
  'NEOS - NEOS – Das Neue Österreich und Liberales Forum',
  'BZÖ - Bündnis Zukunft Österreich',
] as const;

/**
 * Federal ministries for Erlaesse (decrees) application.
 * Values from API documentation - full names without abbreviations.
 */
const BUNDESMINISTERIEN = [
  'Bundeskanzleramt',
  'Bundesministerium für Kunst, Kultur, öffentlichen Dienst und Sport',
  'Bundesministerium für europäische und internationale Angelegenheiten',
  'Bundesministerium für Arbeit und Wirtschaft',
  'Bundesministerium für Bildung, Wissenschaft und Forschung',
  'Bundesministerium für Finanzen',
  'Bundesministerium für Inneres',
  'Bundesministerium für Justiz',
  'Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie',
  'Bundesministerium für Landesverteidigung',
  'Bundesministerium für Land- und Forstwirtschaft, Regionen und Wasserwirtschaft',
  'Bundesministerium für Soziales, Gesundheit, Pflege und Konsumentenschutz',
] as const;

/**
 * Document types for KmGer (court announcements) application.
 * Values from API documentation page 53-54: Geschaeftsordnung, Geschaeftsverteilung
 */
const KMGER_TYP_VALUES = ['Geschaeftsordnung', 'Geschaeftsverteilung'] as const;

// Note: Avsv dokumentart is a FulltextSearchExpression (free text), not an enum

/**
 * Authors (Urheber) for Avsv application.
 * Values from API documentation - full names WITH abbreviations in parentheses.
 */
const AVSV_URHEBER_VALUES = [
  'Dachverband der Sozialversicherungsträger (DVSV)',
  'Pensionsversicherungsanstalt (PVA)',
  'Österreichische Gesundheitskasse (ÖGK)',
  'Allgemeine Unfallversicherungsanstalt (AUVA)',
  'Sozialversicherungsanstalt der Selbständigen (SVS)',
  'Versicherungsanstalt öffentlich Bediensteter, Eisenbahnen und Bergbau (BVAEB)',
] as const;

/**
 * Type values for Avn (veterinary notices) application.
 */
const AVN_TYP_VALUES = ['Kundmachung', 'Verordnung', 'Erlass'] as const;

/**
 * OSG (Österreichischer Strukturplan Gesundheit) types for Spg application.
 */
const SPG_OSG_TYP_VALUES = ['ÖSG', 'ÖSG - Großgeräteplan'] as const;

/**
 * RSG (Regionaler Strukturplan Gesundheit) types for Spg application.
 */
const SPG_RSG_TYP_VALUES = ['RSG', 'RSG - Großgeräteplan'] as const;

/**
 * PruefGewO examination types.
 */
const PRUEFGEWO_TYP_VALUES = ['Befähigungsprüfung', 'Eignungsprüfung', 'Meisterprüfung'] as const;

/**
 * Valid application names for the History API endpoint.
 * The History API uses "Anwendung" parameter with specific application names.
 */
const VALID_HISTORY_APPLICATIONS = [
  'Bundesnormen',
  'Landesnormen',
  'Justiz',
  'Vfgh',
  'Vwgh',
  'Bvwg',
  'Lvwg',
  'BgblAuth',
  'BgblAlt',
  'BgblPdf',
  'LgblAuth',
  'Lgbl',
  'LgblNO',
  'Gemeinderecht',
  'GemeinderechtAuth',
  'Bvb',
  'Vbl',
  'RegV',
  'Mrp',
  'Erlaesse',
  'PruefGewO',
  'Avsv',
  'Spg',
  'KmGer',
  'Dsk',
  'Gbk',
  'Dok',
  'Pvak',
  'Normenliste',
  'AsylGH',
] as const;

// =============================================================================
// Server Setup
// =============================================================================

export const server = new McpServer({
  name: 'ris-mcp',
  version: '1.0.0',
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
      '**Fehler:** Die Anfrage an das RIS hat zu lange gedauert.\n\n' +
      'Bitte versuche es erneut oder verwende spezifischere Suchparameter.'
    );
  }

  if (error instanceof RISParsingError) {
    return (
      '**Fehler:** Die Antwort des RIS konnte nicht verarbeitet werden.\n\n' +
      `Technische Details: ${error.message}`
    );
  }

  if (error instanceof RISAPIError) {
    const statusInfo = error.statusCode ? ` (Status: ${error.statusCode})` : '';
    return (
      `**Fehler:** Das RIS hat einen Fehler zurueckgegeben${statusInfo}.\n\n` +
      `Details: ${error.message}`
    );
  }

  return (
    '**Fehler:** Ein unerwarteter Fehler ist aufgetreten.\n\n' +
    `Details: ${error instanceof Error ? error.message : String(error)}`
  );
}

// =============================================================================
// Helper Functions for Code Deduplication
// =============================================================================

/** MCP tool response type with index signature for SDK compatibility */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type McpToolResponse = {
  [x: string]: unknown;
  content: [{ type: 'text'; text: string }];
};

/**
 * Create a standard MCP text response.
 */
function createMcpResponse(text: string): McpToolResponse {
  return { content: [{ type: 'text' as const, text }] };
}

/**
 * Create a validation error response listing required parameters.
 */
function createValidationErrorResponse(requiredParams: string[]): McpToolResponse {
  const paramList = requiredParams.map((p) => `- \`${p}\``).join('\n');
  return createMcpResponse(
    '**Fehler:** Bitte gib mindestens einen Suchparameter an:\n' + paramList,
  );
}

/**
 * Check if any of the specified parameters has a truthy value.
 */
function hasAnyParam(args: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = args[key];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Build base API parameters common to all search requests.
 */
function buildBaseParams(
  applikation: string,
  limit: number,
  seite: number,
): Record<string, unknown> {
  return {
    Applikation: applikation,
    DokumenteProSeite: limitToDokumenteProSeite(limit),
    Seitennummer: seite,
  };
}

/**
 * Add optional parameters to the params object.
 * Only adds values that are truthy (not undefined, null, or empty string).
 */
function addOptionalParams(
  params: Record<string, unknown>,
  mappings: [value: unknown, key: string][],
): void {
  for (const [value, key] of mappings) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value;
    }
  }
}

/** Search function type for API calls */
type SearchFunction = (params: Record<string, unknown>) => Promise<unknown>;

/**
 * Execute a search tool and return formatted results.
 * Handles the common try-catch, parsing, formatting, and truncation logic.
 */
async function executeSearchTool(
  searchFn: SearchFunction,
  params: Record<string, unknown>,
  responseFormat: 'markdown' | 'json',
): Promise<McpToolResponse> {
  try {
    const apiResponse = await searchFn(params);
    const searchResult = parseSearchResults(apiResponse as NormalizedSearchResults);
    const formatted = formatSearchResults(searchResult, responseFormat);
    const result = truncateResponse(formatted);
    return createMcpResponse(result);
  } catch (e) {
    return createMcpResponse(formatErrorResponse(e));
  }
}

// =============================================================================
// Tool 1: ris_bundesrecht
// =============================================================================

server.tool(
  'ris_bundesrecht',
  `Search Austrian federal laws (Bundesrecht).

Use this tool to find Austrian federal legislation like ABGB, StGB, UGB, etc.

Example queries:
  - suchworte="Mietrecht" -> Find laws mentioning rent law
  - titel="ABGB", paragraph="1319a" -> Find specific ABGB section
  - applikation="Begut" -> Search draft legislation`,
  {
    suchworte: z
      .string()
      .max(1000)
      .optional()
      .describe('Full-text search terms (e.g., "Mietrecht", "Schadenersatz")'),
    titel: z
      .string()
      .max(500)
      .optional()
      .describe('Search in law titles (e.g., "ABGB", "Strafgesetzbuch")'),
    paragraph: z
      .string()
      .max(100)
      .optional()
      .describe('Paragraph number to search for (e.g., "1295" for §1295)'),
    applikation: BundesrechtApplikationSchema.default('BrKons').describe(
      'Data source - "BrKons" (consolidated, default), "Begut" (drafts), "BgblAuth" (gazette), "Erv" (English)',
    ),
    fassung_vom: DateSchema.optional().describe('Date for historical version (YYYY-MM-DD)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { suchworte, titel, paragraph, applikation, fassung_vom, seite, limit, response_format } =
      args;

    if (!hasAnyParam(args, ['suchworte', 'titel', 'paragraph'])) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Gesetzesnamen',
        'paragraph` fuer Suche nach Paragraphen',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [fassung_vom, 'FassungVom'],
    ]);

    if (paragraph) {
      params['Abschnitt.Von'] = paragraph;
      params['Abschnitt.Bis'] = paragraph;
      params['Abschnitt.Typ'] = 'Paragraph';
    }

    return executeSearchTool(searchBundesrecht, params, response_format);
  },
);

// =============================================================================
// Tool 2: ris_landesrecht
// =============================================================================

server.tool(
  'ris_landesrecht',
  `Search Austrian state/provincial laws (Landesrecht).

Use this tool to find laws enacted by Austrian federal states (Bundeslaender).

Example: suchworte="Bauordnung", bundesland="Salzburg"`,
  {
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in law titles'),
    bundesland: LandesrechtBundeslandSchema.optional().describe(
      'Filter by state - Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland',
    ),
    applikation: z.enum(['LrKons']).default('LrKons').describe('"LrKons" (consolidated, default)'),
    seite: z.number().default(1).describe('Page number'),
    limit: z.number().default(20).describe('Results per page'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" or "json"'),
  },
  async (args) => {
    const { suchworte, titel, bundesland, applikation, seite, limit, response_format } = args;

    if (!hasAnyParam(args, ['suchworte', 'titel', 'bundesland'])) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Gesetzesnamen',
        'bundesland` fuer Suche nach Bundesland',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
    ]);

    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = 'true';
      }
    }

    return executeSearchTool(searchLandesrecht, params, response_format);
  },
);

// =============================================================================
// Tool 3: ris_judikatur
// =============================================================================

server.tool(
  'ris_judikatur',
  `Search Austrian court decisions (Judikatur).

Use this tool to find court decisions from Austrian courts.

Example: gericht="Vfgh", suchworte="Grundrecht"`,
  {
    suchworte: z.string().max(1000).optional().describe('Full-text search in decisions'),
    gericht: JudikaturGerichtSchema.default('Justiz').describe(
      'Court - "Justiz" (OGH/OLG/LG, default), "Vfgh" (Constitutional), "Vwgh" (Administrative), "Bvwg", "Lvwg", "Dsk" (Data Protection), "AsylGH" (historical), "Normenliste", "Pvak", "Gbk", "Dok"',
    ),
    norm: z.string().max(500).optional().describe('Search by legal norm (e.g., "1319a ABGB")'),
    geschaeftszahl: z.string().max(200).optional().describe('Case number (e.g., "5Ob234/20b")'),
    entscheidungsdatum_von: DateSchema.optional().describe('Decision date from (YYYY-MM-DD)'),
    entscheidungsdatum_bis: DateSchema.optional().describe('Decision date to (YYYY-MM-DD)'),
    seite: z.number().default(1).describe('Page number'),
    limit: z.number().default(20).describe('Results per page'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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

    if (!hasAnyParam(args, ['suchworte', 'norm', 'geschaeftszahl'])) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'norm` fuer Suche nach Rechtsnorm',
        'geschaeftszahl` fuer Suche nach Geschaeftszahl',
      ]);
    }

    const params = buildBaseParams(gericht, limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [norm, 'Norm'],
      [geschaeftszahl, 'Geschaeftszahl'],
      [entscheidungsdatum_von, 'EntscheidungsdatumVon'],
      [entscheidungsdatum_bis, 'EntscheidungsdatumBis'],
    ]);

    return executeSearchTool(searchJudikatur, params, response_format);
  },
);

// =============================================================================
// Tool 4: ris_bundesgesetzblatt
// =============================================================================

server.tool(
  'ris_bundesgesetzblatt',
  `Search Austrian Federal Law Gazettes (Bundesgesetzblatt).

Use this tool for historical research and tracking when laws were enacted.
Contains official publications of federal laws, ordinances, and treaties.

Example queries:
  - bgblnummer="120", jahrgang="2023", teil="1" -> Find specific gazette
  - suchworte="Klimaschutz" -> Full-text search in gazettes`,
  {
    bgblnummer: z.string().max(100).optional().describe('Gazette number (e.g., "120")'),
    teil: z
      .enum(['1', '2', '3'])
      .optional()
      .describe('Part - "1" (I=Laws), "2" (II=Ordinances), "3" (III=Treaties)'),
    jahrgang: z.string().max(10).optional().describe('Year (e.g., "2023")'),
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in gazette titles'),
    applikation: z
      .enum(['BgblAuth', 'BgblPdf', 'BgblAlt'])
      .default('BgblAuth')
      .describe('"BgblAuth" (authentic 2004+, default), "BgblPdf" (PDF), "BgblAlt" (1945-2003)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      bgblnummer,
      teil,
      jahrgang,
      suchworte,
      titel,
      applikation,
      seite,
      limit,
      response_format,
    } = args;

    if (!hasAnyParam(args, ['bgblnummer', 'jahrgang', 'suchworte', 'titel'])) {
      return createValidationErrorResponse([
        'bgblnummer` fuer Gesetzblatt-Nummer',
        'jahrgang` fuer Jahr',
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Titeln',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [bgblnummer, 'Bgblnummer'],
      [teil, 'Teil'],
      [jahrgang, 'Jahrgang'],
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
    ]);

    return executeSearchTool(searchBundesrecht, params, response_format);
  },
);

// =============================================================================
// Tool 5: ris_landesgesetzblatt
// =============================================================================

server.tool(
  'ris_landesgesetzblatt',
  `Search Austrian State Law Gazettes (Landesgesetzblatt).

Use this tool to find official publications of state/provincial laws.
Covers all 9 federal states (Bundeslaender).

Example queries:
  - lgblnummer="50", jahrgang="2023", bundesland="Wien"
  - suchworte="Bauordnung", bundesland="Salzburg"`,
  {
    lgblnummer: z.string().max(100).optional().describe('Gazette number (e.g., "50")'),
    jahrgang: z.string().max(10).optional().describe('Year (e.g., "2023")'),
    bundesland: LandesrechtBundeslandSchema.optional().describe(
      'Filter by state - Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland',
    ),
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in gazette titles'),
    applikation: z
      .enum(['LgblAuth', 'Lgbl', 'LgblNO'])
      .default('LgblAuth')
      .describe('"LgblAuth" (authentic, default), "Lgbl" (general), "LgblNO" (Lower Austria)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      lgblnummer,
      jahrgang,
      bundesland,
      suchworte,
      titel,
      applikation,
      seite,
      limit,
      response_format,
    } = args;

    if (!hasAnyParam(args, ['lgblnummer', 'jahrgang', 'bundesland', 'suchworte', 'titel'])) {
      return createValidationErrorResponse([
        'lgblnummer` fuer Gesetzblatt-Nummer',
        'jahrgang` fuer Jahr',
        'bundesland` fuer Bundesland',
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Titeln',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [lgblnummer, 'Lgblnummer'],
      [jahrgang, 'Jahrgang'],
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
    ]);

    if (bundesland) {
      const apiKey = BUNDESLAND_MAPPING[bundesland];
      if (apiKey) {
        params[`Bundesland.${apiKey}`] = 'true';
      }
    }

    return executeSearchTool(searchLandesrecht, params, response_format);
  },
);

// =============================================================================
// Tool 6: ris_regierungsvorlagen
// =============================================================================

server.tool(
  'ris_regierungsvorlagen',
  `Search Austrian Government Bills (Regierungsvorlagen).

Use this tool for legislative history and parliamentary materials.
Contains government proposals submitted to parliament.

Example queries:
  - suchworte="Klimaschutz" -> Full-text search in bills
  - einbringende_stelle="BMF (Bundesministerium für Finanzen)" -> Bills from Finance Ministry
  - beschlussdatum_von="2024-01-01", beschlussdatum_bis="2024-12-31" -> Bills from 2024`,
  {
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in bill titles'),
    beschlussdatum_von: DateSchema.optional().describe('Decision date from (YYYY-MM-DD)'),
    beschlussdatum_bis: DateSchema.optional().describe('Decision date to (YYYY-MM-DD)'),
    einbringende_stelle: z
      .enum([
        'BKA (Bundeskanzleramt)',
        'BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im Bundeskanzleramt)',
        'BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)',
        'BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und Sport)',
        'BMEIA (Bundesministerium für europäische und internationale Angelegenheiten)',
        'BMAW (Bundesministerium für Arbeit und Wirtschaft)',
        'BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)',
        'BMF (Bundesministerium für Finanzen)',
        'BMI (Bundesministerium für Inneres)',
        'BMJ (Bundesministerium für Justiz)',
        'BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie)',
        'BMLV (Bundesministerium für Landesverteidigung)',
        'BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und Wasserwirtschaft)',
        'BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und Konsumentenschutz)',
      ])
      .optional()
      .describe('Filter by submitting ministry'),
    im_ris_seit: z
      .enum(['EinerWoche', 'ZweiWochen', 'EinemMonat', 'DreiMonaten', 'SechsMonaten', 'EinemJahr'])
      .optional()
      .describe('Filter by time in RIS'),
    sortierung_richtung: z.enum(['Ascending', 'Descending']).optional().describe('Sort direction'),
    sortierung_spalte: z
      .enum(['Kurztitel', 'EinbringendeStelle', 'Beschlussdatum'])
      .optional()
      .describe('Sort by column'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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

    if (
      !hasAnyParam(args, [
        'suchworte',
        'titel',
        'beschlussdatum_von',
        'einbringende_stelle',
        'im_ris_seit',
      ])
    ) {
      return createValidationErrorResponse([
        'suchworte` für Volltextsuche',
        'titel` für Suche in Titeln',
        'beschlussdatum_von/bis` für Datumsfilter',
        'einbringende_stelle` für Ministerium',
        'im_ris_seit` für Zeitfilter',
      ]);
    }

    const params = buildBaseParams('RegV', limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [beschlussdatum_von, 'BeschlussdatumVon'],
      [beschlussdatum_bis, 'BeschlussdatumBis'],
      [einbringende_stelle, 'EinbringendeStelle'],
      [im_ris_seit, 'ImRisSeit'],
      [sortierung_richtung, 'Sortierung.SortDirection'],
      [sortierung_spalte, 'Sortierung.SortedByColumn'],
    ]);

    return executeSearchTool(searchBundesrecht, params, response_format);
  },
);

// =============================================================================
// Tool 7: ris_dokument
// =============================================================================

server.tool(
  'ris_dokument',
  `Retrieve full text of a legal document.

Use this after searching to load the complete text of a specific law or decision.

Note: For long documents, content may be truncated. Use specific searches to narrow down.`,
  {
    dokumentnummer: z
      .string()
      .optional()
      .describe('RIS document number (e.g., "NOR40052761") - from search results'),
    url: z.string().optional().describe('Direct URL to document content'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const { dokumentnummer, url: inputUrl, response_format } = args;

    if (!dokumentnummer && !inputUrl) {
      return createMcpResponse(
        '**Fehler:** Bitte gib entweder eine `dokumentnummer` oder eine `url` an.\n\n' +
          'Die Dokumentnummer findest du in den Suchergebnissen von `ris_bundesrecht`, ' +
          '`ris_landesrecht` oder `ris_judikatur`.',
      );
    }

    // SSRF protection: validate user-supplied URLs against domain allowlist
    if (inputUrl && !isAllowedUrl(inputUrl)) {
      return createMcpResponse(
        '**Fehler:** Die angegebene URL ist nicht erlaubt.\n\n' +
          'Nur HTTPS-URLs zu offiziellen RIS-Domains sind zulaessig ' +
          '(data.bka.gv.at, www.ris.bka.gv.at, ris.bka.gv.at).',
      );
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
            applikation: 'Unbekannt',
            titel: dokumentnummer,
            kurztitel: null,
            citation: {},
            dokument_url: directResult.url,
          };
        } else {
          // Direct fetch failed - fallback to search API
          let apiResponse;

          if (dokumentnummer.startsWith('NOR')) {
            apiResponse = await searchBundesrecht({
              Applikation: 'BrKons',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (
            dokumentnummer.startsWith('LBG') ||
            dokumentnummer.startsWith('LNO') ||
            dokumentnummer.startsWith('LST') ||
            dokumentnummer.startsWith('LTI') ||
            dokumentnummer.startsWith('LVO') ||
            dokumentnummer.startsWith('LWI') ||
            dokumentnummer.startsWith('LSB') ||
            dokumentnummer.startsWith('LOO') ||
            dokumentnummer.startsWith('LKT')
          ) {
            apiResponse = await searchLandesrecht({
              Applikation: 'LrKons',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('JFR') || dokumentnummer.startsWith('JFT')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Vfgh',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('JWR') || dokumentnummer.startsWith('JWT')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Vwgh',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('BVWG')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Bvwg',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('LVWG')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Lvwg',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('DSB')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Dsk',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('GBK')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Gbk',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('PVAK')) {
            apiResponse = await searchJudikatur({
              Applikation: 'Pvak',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('ASYLGH')) {
            apiResponse = await searchJudikatur({
              Applikation: 'AsylGH',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('BGBLA') || dokumentnummer.startsWith('BGBL')) {
            // Bundesgesetzblätter - use Bundesrecht endpoint
            const applikation = dokumentnummer.startsWith('BGBLA') ? 'BgblAuth' : 'BgblAlt';
            apiResponse = await searchBundesrecht({
              Applikation: applikation,
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('REGV')) {
            // Regierungsvorlagen - use Bundesrecht endpoint
            apiResponse = await searchBundesrecht({
              Applikation: 'RegV',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else if (dokumentnummer.startsWith('MRP') || dokumentnummer.startsWith('ERL')) {
            // Sonstige Sammlungen - use Sonstige endpoint
            apiResponse = await searchSonstige({
              Applikation: dokumentnummer.startsWith('MRP') ? 'Mrp' : 'Erlaesse',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          } else {
            // Default to Justiz for unknown prefixes
            apiResponse = await searchJudikatur({
              Applikation: 'Justiz',
              Dokumentnummer: dokumentnummer,
              DokumenteProSeite: 'Ten',
            });
          }

          // Find the document with matching dokumentnummer (don't blindly take first result)
          const findResult = findDocumentByDokumentnummer(apiResponse.documents, dokumentnummer);

          if (!findResult.success) {
            // Both direct fetch and search failed - provide helpful error
            const directError = directResult.error;
            if (findResult.error === 'no_documents') {
              return createMcpResponse(
                `**Fehler:** Kein Dokument mit der Nummer \`${dokumentnummer}\` gefunden.\n\n` +
                  `Direkter Abruf: ${directError}\n` +
                  `Suche: Keine Ergebnisse.\n\n` +
                  'Bitte pruefe die Dokumentnummer oder verwende eine Suche, ' +
                  'um das gewuenschte Dokument zu finden.',
              );
            } else {
              return createMcpResponse(
                `**Fehler:** Dokument \`${dokumentnummer}\` nicht gefunden.\n\n` +
                  `Direkter Abruf: ${directError}\n` +
                  `Suche: ${findResult.totalResults} Ergebnisse, aber keines mit dieser Dokumentnummer.\n\n` +
                  `Bitte verwende eine alternative Suche oder die direkte URL.`,
              );
            }
          }

          const doc = findResult.document;
          contentUrl = doc.content_urls.html ?? undefined;

          if (!contentUrl) {
            return createMcpResponse(
              `**Fehler:** Keine Inhalts-URL fuer Dokument \`${dokumentnummer}\` verfuegbar.\n\n` +
                'Das Dokument hat moeglicherweise keinen abrufbaren Volltext.',
            );
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
          dokumentnummer: dokumentnummer ?? 'Unbekannt',
          applikation: 'Unbekannt',
          titel: inputUrl ?? '',
          kurztitel: null,
          citation: {},
          dokument_url: inputUrl,
        };
      }

      if (!contentUrl) {
        return createMcpResponse('**Fehler:** Keine gueltige URL zum Abrufen des Dokuments.');
      }

      // Fetch document content if not already fetched via direct URL
      if (!htmlContent) {
        htmlContent = await getDocumentContent(contentUrl);
      }

      // Format the document
      const formatted = formatDocument(htmlContent, metadata, response_format);
      const result = truncateResponse(formatted);

      return createMcpResponse(result);
    } catch (e) {
      return createMcpResponse(formatErrorResponse(e));
    }
  },
);

// =============================================================================
// Tool 8: ris_bezirke
// =============================================================================

server.tool(
  'ris_bezirke',
  `Search Austrian district administrative authority announcements (Kundmachungen der Bezirksverwaltungsbehörden).

Use this tool to find announcements and ordinances from district administrative authorities.

Note: Only certain states publish here: Niederösterreich, Oberösterreich, Tirol, Vorarlberg, Burgenland, Steiermark.

Example queries:
  - bundesland="Niederösterreich", suchworte="Bauordnung"
  - bezirksverwaltungsbehoerde="Bezirkshauptmannschaft Innsbruck"`,
  {
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in titles'),
    bundesland: BundeslandSchema.optional().describe(
      'Filter by state - Burgenland, Kärnten, Niederösterreich, Oberösterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien',
    ),
    bezirksverwaltungsbehoerde: z
      .string()
      .max(200)
      .optional()
      .describe(
        'District authority name (e.g., "Bezirkshauptmannschaft Innsbruck", "Bezirkshauptmannschaft Amstetten")',
      ),
    kundmachungsnummer: z.string().max(100).optional().describe('Announcement number'),
    kundmachungsdatum_von: DateSchema.optional().describe('Announcement date from (YYYY-MM-DD)'),
    kundmachungsdatum_bis: DateSchema.optional().describe('Announcement date to (YYYY-MM-DD)'),
    im_ris_seit: z
      .enum(['EinerWoche', 'ZweiWochen', 'EinemMonat', 'DreiMonaten', 'SechsMonaten', 'EinemJahr'])
      .optional()
      .describe('Filter by time in RIS'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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

    if (
      !hasAnyParam(args, [
        'suchworte',
        'titel',
        'bundesland',
        'bezirksverwaltungsbehoerde',
        'kundmachungsnummer',
      ])
    ) {
      return createValidationErrorResponse([
        'suchworte` für Volltextsuche',
        'titel` für Titelsuche',
        'bundesland` für Bundesland',
        'bezirksverwaltungsbehoerde` für Bezirksverwaltungsbehörde',
        'kundmachungsnummer` für Kundmachungsnummer',
      ]);
    }

    const params = buildBaseParams('Bvb', limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [bundesland, 'Bundesland'],
      [bezirksverwaltungsbehoerde, 'Bezirksverwaltungsbehoerde'],
      [kundmachungsnummer, 'Kundmachungsnummer'],
      [kundmachungsdatum_von, 'Kundmachungsdatum.Von'],
      [kundmachungsdatum_bis, 'Kundmachungsdatum.Bis'],
      [im_ris_seit, 'ImRisSeit'],
    ]);

    return executeSearchTool(searchBezirke, params, response_format);
  },
);

// =============================================================================
// Tool 9: ris_gemeinden
// =============================================================================

server.tool(
  'ris_gemeinden',
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
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in titles'),
    bundesland: z
      .string()
      .max(200)
      .optional()
      .describe(
        'Filter by state - Burgenland, Kärnten, Niederösterreich, Oberösterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien',
      ),
    gemeinde: z.string().max(200).optional().describe('Municipality name (e.g., "Graz")'),
    applikation: z
      .enum(['Gr', 'GrA'])
      .default('Gr')
      .describe('"Gr" (municipal law, default) or "GrA" (cross-border/Amtsblätter)'),
    // Parameters for Gr application
    geschaeftszahl: z.string().max(200).optional().describe('File number/Aktenzeichen (Gr only)'),
    index: z
      .enum(GEMEINDEN_INDEX_VALUES)
      .optional()
      .describe(
        'Subject area index (Gr only) - VertretungskoerperUndAllgemeineVerwaltung, OeffentlicheOrdnungUndSicherheit, UnterrichtErziehungSportUndWissenschaft, KunstKulturUndKultus, SozialeWohlfahrtUndWohnbaufoerderung, Gesundheit, StraßenUndWasserbauVerkehr, Wirtschaftsfoerderung, Dienstleistungen, Finanzwirtschaft',
      ),
    fassung_vom: DateSchema.optional().describe('Historical version date (YYYY-MM-DD, Gr only)'),
    // Parameters for GrA application
    bezirk: z.string().max(200).optional().describe('District name (GrA only, e.g., "Bregenz")'),
    gemeindeverband: z
      .string()
      .max(200)
      .optional()
      .describe('Municipal association name (GrA only)'),
    kundmachungsnummer: z.string().max(100).optional().describe('Announcement number (GrA only)'),
    kundmachungsdatum_von: DateSchema.optional().describe(
      'Announcement date from (YYYY-MM-DD, GrA only)',
    ),
    kundmachungsdatum_bis: DateSchema.optional().describe(
      'Announcement date to (YYYY-MM-DD, GrA only)',
    ),
    // Common parameters
    im_ris_seit: z
      .enum(IM_RIS_SEIT_VALUES)
      .optional()
      .describe(
        'Filter by time in RIS - EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr',
      ),
    sortierung_richtung: z.enum(['Ascending', 'Descending']).optional().describe('Sort direction'),
    sortierung_spalte_gr: z
      .enum(['Geschaeftszahl', 'Bundesland', 'Gemeinde'])
      .optional()
      .describe('Sort column (Gr only)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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

    if (
      !hasAnyParam(args, [
        'suchworte',
        'titel',
        'bundesland',
        'gemeinde',
        'geschaeftszahl',
        'index',
        'bezirk',
        'kundmachungsnummer',
      ])
    ) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Titeln',
        'bundesland` fuer Bundesland',
        'gemeinde` fuer Gemeinde',
        'geschaeftszahl` fuer Aktenzeichen (Gr)',
        'index` fuer Sachgebiet (Gr)',
        'bezirk` fuer Bezirk (GrA)',
        'kundmachungsnummer` fuer Kundmachungsnummer (GrA)',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [gemeinde, 'Gemeinde'],
      [bundesland, 'Bundesland'],
      [im_ris_seit, 'ImRisSeit'],
      [sortierung_richtung, 'Sortierung.SortDirection'],
    ]);

    // Gr-specific parameters
    if (applikation === 'Gr') {
      addOptionalParams(params, [
        [geschaeftszahl, 'Geschaeftszahl'],
        [index, 'Index'],
        [fassung_vom, 'FassungVom'],
        [sortierung_spalte_gr, 'Sortierung.SortedByColumn'],
      ]);
    }

    // GrA-specific parameters
    if (applikation === 'GrA') {
      addOptionalParams(params, [
        [bezirk, 'Bezirk'],
        [gemeindeverband, 'Gemeindeverband'],
        [kundmachungsnummer, 'Kundmachungsnummer'],
        [kundmachungsdatum_von, 'Kundmachungsdatum.Von'],
        [kundmachungsdatum_bis, 'Kundmachungsdatum.Bis'],
      ]);
    }

    return executeSearchTool(searchGemeinden, params, response_format);
  },
);

// =============================================================================
// Tool 10: ris_sonstige
// =============================================================================

server.tool(
  'ris_sonstige',
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
  - applikation="Erlaesse", bundesministerium="Bundesministerium für Finanzen"
  - applikation="Upts", partei="SPÖ - Sozialdemokratische Partei Österreichs"
  - applikation="KmGer", kmger_typ="Geschaeftsordnung"
  - applikation="Avsv", dokumentart="Richtlinie"`,
  {
    applikation: z
      .enum(['PruefGewO', 'Avsv', 'Spg', 'Avn', 'KmGer', 'Upts', 'Mrp', 'Erlaesse'])
      .describe(
        'Collection to search - "PruefGewO" (trade exams), "Avsv" (social insurance), "Spg" (health plans), "Avn" (veterinary notices), "KmGer" (court announcements), "Upts" (party transparency), "Mrp" (cabinet protocols), "Erlaesse" (decrees)',
      ),
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in titles'),
    datum_von: DateSchema.optional().describe('Date from (YYYY-MM-DD)'),
    datum_bis: DateSchema.optional().describe('Date to (YYYY-MM-DD)'),
    // Common parameters
    im_ris_seit: z
      .enum(IM_RIS_SEIT_VALUES)
      .optional()
      .describe(
        'Filter by time in RIS - EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr',
      ),
    sortierung_richtung: z.enum(['Ascending', 'Descending']).optional().describe('Sort direction'),
    geschaeftszahl: z
      .string()
      .max(200)
      .optional()
      .describe('File number/Aktenzeichen (for Mrp, Upts, KmGer)'),
    norm: z.string().max(500).optional().describe('Legal norm reference (for Erlaesse, Upts)'),
    fassung_vom: DateSchema.optional().describe(
      'Historical version date (YYYY-MM-DD, for Erlaesse)',
    ),
    // Mrp-specific parameters
    einbringer: z
      .string()
      .max(200)
      .optional()
      .describe('Submitter (Mrp only, e.g., ministry abbreviation)'),
    sitzungsnummer: z.string().max(50).optional().describe('Session number (Mrp only)'),
    gesetzgebungsperiode: z
      .string()
      .max(10)
      .optional()
      .describe("Legislative period (Mrp only, e.g., '27')"),
    // Erlaesse-specific parameters
    bundesministerium: z
      .enum(BUNDESMINISTERIEN)
      .optional()
      .describe('Federal ministry (Erlaesse only)'),
    abteilung: z.string().max(200).optional().describe('Department/division (Erlaesse only)'),
    fundstelle: z.string().max(200).optional().describe('Source reference (Erlaesse only)'),
    // Upts-specific parameters
    partei: z.enum(UPTS_PARTEIEN).optional().describe('Political party (Upts only)'),
    // KmGer-specific parameters
    kmger_typ: z
      .enum(KMGER_TYP_VALUES)
      .optional()
      .describe('Announcement type (KmGer only) - Geschaeftsordnung, Geschaeftsverteilung'),
    gericht: z.string().max(200).optional().describe('Court name (KmGer only)'),
    // Avsv-specific parameters
    dokumentart: z
      .string()
      .max(200)
      .optional()
      .describe('Document type search (Avsv only) - free text search expression'),
    urheber: z.enum(AVSV_URHEBER_VALUES).optional().describe('Author/institution (Avsv only)'),
    avsvnummer: z.string().max(100).optional().describe('AVSV number (Avsv only)'),
    // Avn-specific parameters
    avnnummer: z.string().max(100).optional().describe('AVN number (Avn only)'),
    avn_typ: z
      .enum(AVN_TYP_VALUES)
      .optional()
      .describe('Notice type (Avn only) - Kundmachung, Verordnung, Erlass'),
    // Spg-specific parameters
    spgnummer: z.string().max(100).optional().describe('SPG number (Spg only)'),
    osg_typ: z
      .enum(SPG_OSG_TYP_VALUES)
      .optional()
      .describe('Austrian health structure plan type (Spg only) - ÖSG, ÖSG - Großgeräteplan'),
    rsg_typ: z
      .enum(SPG_RSG_TYP_VALUES)
      .optional()
      .describe('Regional health structure plan type (Spg only) - RSG, RSG - Großgeräteplan'),
    rsg_land: z.string().max(100).optional().describe('Federal state for RSG (Spg only)'),
    // PruefGewO-specific parameters
    pruefgewo_typ: z
      .enum(PRUEFGEWO_TYP_VALUES)
      .optional()
      .describe(
        'Examination type (PruefGewO only) - Befähigungsprüfung, Eignungsprüfung, Meisterprüfung',
      ),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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
    const searchParamKeys = [
      'suchworte',
      'titel',
      'geschaeftszahl',
      'norm',
      'einbringer',
      'sitzungsnummer',
      'gesetzgebungsperiode',
      'bundesministerium',
      'abteilung',
      'fundstelle',
      'partei',
      'kmger_typ',
      'gericht',
      'dokumentart',
      'urheber',
      'avsvnummer',
      'avnnummer',
      'avn_typ',
      'spgnummer',
      'osg_typ',
      'rsg_typ',
      'rsg_land',
      'pruefgewo_typ',
      'im_ris_seit',
      'datum_von',
      'datum_bis',
    ];

    if (!hasAnyParam(args, searchParamKeys)) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'titel` fuer Suche in Titeln',
        'oder applikationsspezifische Parameter (siehe Tool-Beschreibung)',
      ]);
    }

    const params = buildBaseParams(applikation, limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [im_ris_seit, 'ImRisSeit'],
      [sortierung_richtung, 'Sortierung.SortDirection'],
    ]);

    // Build date parameters based on application type
    if (datum_von || datum_bis) {
      switch (applikation) {
        case 'Mrp':
          if (datum_von) params['Sitzungsdatum.Von'] = datum_von;
          if (datum_bis) params['Sitzungsdatum.Bis'] = datum_bis;
          break;
        case 'Upts':
          if (datum_von) params['Entscheidungsdatum.Von'] = datum_von;
          if (datum_bis) params['Entscheidungsdatum.Bis'] = datum_bis;
          break;
        case 'Erlaesse':
          if (datum_von) params['VonInkrafttretensdatum'] = datum_von;
          if (datum_bis) params['BisInkrafttretensdatum'] = datum_bis;
          break;
        case 'PruefGewO':
        case 'Spg':
        case 'KmGer':
          if (datum_von) params['Kundmachungsdatum.Von'] = datum_von;
          if (datum_bis) params['Kundmachungsdatum.Bis'] = datum_bis;
          break;
        case 'Avsv':
        case 'Avn':
          if (datum_von) params['Kundmachung.Von'] = datum_von;
          if (datum_bis) params['Kundmachung.Bis'] = datum_bis;
          break;
      }
    }

    // Application-specific parameters
    switch (applikation) {
      case 'Mrp':
        if (geschaeftszahl) params['Geschaeftszahl'] = geschaeftszahl;
        if (einbringer) params['Einbringer'] = einbringer;
        if (sitzungsnummer) params['Sitzungsnummer'] = sitzungsnummer;
        if (gesetzgebungsperiode) params['Gesetzgebungsperiode'] = gesetzgebungsperiode;
        break;
      case 'Erlaesse':
        if (norm) params['Norm'] = norm;
        if (fassung_vom) params['FassungVom'] = fassung_vom;
        if (bundesministerium) params['Bundesministerium'] = bundesministerium;
        if (abteilung) params['Abteilung'] = abteilung;
        if (fundstelle) params['Fundstelle'] = fundstelle;
        break;
      case 'Upts':
        if (geschaeftszahl) params['Geschaeftszahl'] = geschaeftszahl;
        if (norm) params['Norm'] = norm;
        if (partei) params['Partei'] = partei;
        break;
      case 'KmGer':
        if (geschaeftszahl) params['Geschaeftszahl'] = geschaeftszahl;
        if (kmger_typ) params['Typ'] = kmger_typ;
        if (gericht) params['Gericht'] = gericht;
        break;
      case 'Avsv':
        if (dokumentart) params['Dokumentart'] = dokumentart;
        if (urheber) params['Urheber'] = urheber;
        if (avsvnummer) params['Avsvnummer'] = avsvnummer;
        break;
      case 'Avn':
        if (avnnummer) params['Avnnummer'] = avnnummer;
        if (avn_typ) params['Typ'] = avn_typ;
        break;
      case 'Spg':
        if (spgnummer) params['Spgnummer'] = spgnummer;
        if (osg_typ) params['OsgTyp'] = osg_typ;
        if (rsg_typ) params['RsgTyp'] = rsg_typ;
        if (rsg_land) params['RsgLand'] = rsg_land;
        break;
      case 'PruefGewO':
        if (pruefgewo_typ) params['Typ'] = pruefgewo_typ;
        break;
    }

    return executeSearchTool(searchSonstige, params, response_format);
  },
);

// =============================================================================
// Tool 11: ris_history
// =============================================================================

server.tool(
  'ris_history',
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
          'Sonstige (Bvb, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dok, Normenliste)',
      ),
    aenderungen_von: DateSchema.optional().describe('Changes from date (YYYY-MM-DD)'),
    aenderungen_bis: DateSchema.optional().describe('Changes to date (YYYY-MM-DD)'),
    include_deleted: z
      .boolean()
      .default(false)
      .describe('Include deleted documents in results (default: false)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe('"markdown" (default) or "json"'),
  },
  async (args) => {
    const {
      applikation,
      aenderungen_von,
      aenderungen_bis,
      include_deleted,
      seite,
      limit,
      response_format,
    } = args;

    if (!hasAnyParam(args, ['aenderungen_von', 'aenderungen_bis'])) {
      return createValidationErrorResponse([
        'aenderungen_von` fuer Aenderungen ab Datum',
        'aenderungen_bis` fuer Aenderungen bis Datum',
      ]);
    }

    // Note: History endpoint uses "Anwendung" not "Applikation"
    const params: Record<string, unknown> = {
      Anwendung: applikation,
      DokumenteProSeite: limitToDokumenteProSeite(limit),
      Seitennummer: seite,
    };

    addOptionalParams(params, [
      [aenderungen_von, 'AenderungenVon'],
      [aenderungen_bis, 'AenderungenBis'],
    ]);
    if (include_deleted) params['IncludeDeletedDocuments'] = 'true';

    return executeSearchTool(searchHistory, params, response_format);
  },
);

// =============================================================================
// Tool 12: ris_verordnungen
// =============================================================================

/**
 * Valid Bundesland values for Vbl (Verordnungsblätter) API.
 * Note: Vbl uses direct Bundesland values, NOT the SucheIn format used by Lgbl.
 */
const VALID_VBL_BUNDESLAENDER = [
  'Burgenland',
  'Kaernten',
  'Niederoesterreich',
  'Oberoesterreich',
  'Salzburg',
  'Steiermark',
  'Tirol',
  'Vorarlberg',
  'Wien',
] as const;

server.tool(
  'ris_verordnungen',
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
    suchworte: z.string().max(1000).optional().describe('Full-text search terms'),
    titel: z.string().max(500).optional().describe('Search in title'),
    bundesland: z
      .enum(VALID_VBL_BUNDESLAENDER)
      .optional()
      .describe('Filter by state (currently only Tirol has data)'),
    kundmachungsnummer: z.string().max(100).optional().describe('Publication number'),
    kundmachungsdatum_von: DateSchema.optional().describe('Publication date from (YYYY-MM-DD)'),
    kundmachungsdatum_bis: DateSchema.optional().describe('Publication date to (YYYY-MM-DD)'),
    seite: z.number().default(1).describe('Page number (default: 1)'),
    limit: z.number().default(20).describe('Results per page 10/20/50/100 (default: 20)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
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

    if (
      !hasAnyParam(args, [
        'suchworte',
        'titel',
        'bundesland',
        'kundmachungsnummer',
        'kundmachungsdatum_von',
      ])
    ) {
      return createValidationErrorResponse([
        'suchworte` fuer Volltextsuche',
        'titel` fuer Titelsuche',
        'bundesland` fuer Bundesland-Filter',
        'kundmachungsnummer` fuer Verordnungsnummer',
        'kundmachungsdatum_von` fuer Datum ab',
      ]);
    }

    // Uses Landesrecht endpoint with Applikation="Vbl"
    // Note: Vbl uses direct Bundesland values, NOT the SucheIn format used by Lgbl
    const params = buildBaseParams('Vbl', limit, seite);
    addOptionalParams(params, [
      [suchworte, 'Suchworte'],
      [titel, 'Titel'],
      [bundesland, 'Bundesland'],
      [kundmachungsnummer, 'Kundmachungsnummer'],
      [kundmachungsdatum_von, 'Kundmachungsdatum.Von'],
      [kundmachungsdatum_bis, 'Kundmachungsdatum.Bis'],
    ]);

    return executeSearchTool(searchLandesrecht, params, response_format);
  },
);
