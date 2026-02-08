/**
 * Tool: ris_judikatur — Search Austrian court decisions (Judikatur).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { searchJudikatur } from '../client.js';
import {
  addOptionalParams,
  buildBaseParams,
  createValidationErrorResponse,
  executeSearchTool,
  hasAnyParam,
} from '../helpers.js';
import { DateSchema, JudikaturGerichtSchema } from '../types.js';

export function registerJudikaturTool(server: McpServer): void {
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
}
