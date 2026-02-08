/**
 * Tool: ris_landesrecht — Search Austrian state/provincial laws (Landesrecht).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { searchLandesrecht } from '../client.js';
import { BUNDESLAND_MAPPING } from '../constants.js';
import {
  addOptionalParams,
  buildBaseParams,
  createValidationErrorResponse,
  executeSearchTool,
  hasAnyParam,
} from '../helpers.js';
import { LandesrechtBundeslandSchema } from '../types.js';

export function registerLandesrechtTool(server: McpServer): void {
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
      applikation: z
        .enum(['LrKons'])
        .default('LrKons')
        .describe('"LrKons" (consolidated, default)'),
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
}
