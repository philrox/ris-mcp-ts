/**
 * Tool: ris_bundesrecht — Search Austrian federal laws (Bundesrecht).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { searchBundesrecht } from '../client.js';
import {
  addOptionalParams,
  buildBaseParams,
  createValidationErrorResponse,
  executeSearchTool,
  hasAnyParam,
} from '../helpers.js';
import { BundesrechtApplikationSchema, DateSchema } from '../types.js';

export function registerBundesrechtTool(server: McpServer): void {
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
      const {
        suchworte,
        titel,
        paragraph,
        applikation,
        fassung_vom,
        seite,
        limit,
        response_format,
      } = args;

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
}
