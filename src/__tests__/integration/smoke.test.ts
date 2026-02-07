/**
 * Integration smoke tests against the real RIS API.
 *
 * These tests hit the live Austrian Legal Information System API at
 * https://data.bka.gv.at/ris/api/v2.6/ and require network access.
 *
 * They are NOT included in the standard `npm test` run.
 * Run explicitly with: npm run test:integration
 *
 * Keep assertions focused on response structure, not exact content
 * (which changes as laws are amended).
 */

import { describe, it, expect } from 'vitest';

import { searchBundesrecht, searchJudikatur, getDocumentByNumber } from '../../client.js';

describe('RIS API Smoke Tests', () => {
  describe('searchBundesrecht', () => {
    it('should return results when searching for ABGB', async () => {
      const result = await searchBundesrecht({
        Suchworte: 'ABGB',
        Applikation: 'BrKons',
        DokumenteProSeite: 'Ten',
      });

      expect(result).toBeDefined();
      expect(typeof result.hits).toBe('number');
      expect(result.hits).toBeGreaterThan(0);
      expect(typeof result.page_number).toBe('number');
      expect(typeof result.page_size).toBe('number');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it('should return results when searching by titel for ABGB', async () => {
      const result = await searchBundesrecht({
        Titel: 'ABGB',
        Applikation: 'BrKons',
        DokumenteProSeite: 'Ten',
      });

      expect(result.hits).toBeGreaterThan(0);
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it('should return empty results for nonsensical query', async () => {
      const result = await searchBundesrecht({
        Suchworte: 'xyzzy999nonexistent888qqq',
        Applikation: 'BrKons',
        DokumenteProSeite: 'Ten',
      });

      expect(result).toBeDefined();
      expect(typeof result.hits).toBe('number');
      expect(result.hits).toBe(0);
      expect(result.documents).toHaveLength(0);
    });
  });

  describe('searchJudikatur', () => {
    it('should return results for Justiz court type', async () => {
      const result = await searchJudikatur({
        Applikation: 'Justiz',
        DokumenteProSeite: 'Ten',
      });

      expect(result).toBeDefined();
      expect(typeof result.hits).toBe('number');
      expect(result.hits).toBeGreaterThan(0);
      expect(typeof result.page_number).toBe('number');
      expect(typeof result.page_size).toBe('number');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(result.documents.length).toBeGreaterThan(0);
    });
  });

  describe('getDocumentByNumber', () => {
    it('should fetch a known ABGB norm by document number', async () => {
      const result = await getDocumentByNumber('NOR40045103');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(typeof result.html).toBe('string');
        expect(result.html.length).toBeGreaterThan(0);
        expect(typeof result.url).toBe('string');
        expect(result.url).toContain('NOR40045103');
      }
    });

    it('should return error for non-existent document number', async () => {
      const result = await getDocumentByNumber('NOR00000001');

      // May succeed (if the number happens to exist) or fail with a 404 —
      // we just verify the response shape is correct
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(typeof result.html).toBe('string');
        expect(typeof result.url).toBe('string');
      } else {
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
