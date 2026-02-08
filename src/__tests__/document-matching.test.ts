/**
 * Tests for document matching logic in the RIS MCP Server.
 *
 * These tests verify that when the API returns multiple documents,
 * the correct document is selected by matching dokumentnummer
 * rather than blindly taking the first result.
 */

import { describe, it, expect } from 'vitest';

import { findDocumentByDokumentnummer, parseDocumentFromApiResponse } from '../parser.js';
import type { RawDocumentReference } from '../types.js';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create a mock raw document reference with the given dokumentnummer.
 */
function createMockRawDocument(
  dokumentnummer: string,
  options: {
    kurztitel?: string;
    htmlUrl?: string;
    applikation?: string;
  } = {},
): RawDocumentReference {
  const { kurztitel = 'Test Document', htmlUrl, applikation = 'BrKons' } = options;

  return {
    Data: {
      Metadaten: {
        Technisch: {
          ID: dokumentnummer,
          Applikation: applikation,
        },
        Allgemein: {
          DokumentUrl: `https://ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=${dokumentnummer}`,
        },
        Bundesrecht: {
          Kurztitel: kurztitel,
          Langtitel: `${kurztitel} - Full Title`,
          BrKons: {
            Kundmachungsorgan: 'BGBl. I Nr. 1/2024',
            ArtikelParagraphAnlage: 'Art. 1',
            Inkrafttretensdatum: '2024-01-01',
            Ausserkrafttretensdatum: undefined,
          },
        },
      },
      Dokumentliste: {
        ContentReference: {
          ContentType: 'MainDocument',
          Name: kurztitel,
          Urls: {
            ContentUrl: htmlUrl ? [{ DataType: 'Html', Url: htmlUrl }] : undefined,
          },
        },
      },
    },
  };
}

// =============================================================================
// Tests for parseDocumentFromApiResponse
// =============================================================================

describe('parseDocumentFromApiResponse', () => {
  it('should correctly extract dokumentnummer from raw API response', () => {
    const rawDoc = createMockRawDocument('NOR40000001');
    const parsed = parseDocumentFromApiResponse(rawDoc);

    expect(parsed.dokumentnummer).toBe('NOR40000001');
  });

  it('should extract kurztitel from Bundesrecht data', () => {
    const rawDoc = createMockRawDocument('NOR40000001', {
      kurztitel: 'ABGB',
    });
    const parsed = parseDocumentFromApiResponse(rawDoc);

    expect(parsed.kurztitel).toBe('ABGB');
    expect(parsed.titel).toBe('ABGB');
  });

  it('should extract content URLs when available', () => {
    const rawDoc = createMockRawDocument('NOR40000001', {
      htmlUrl: 'https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR40000001/NOR40000001.html',
    });
    const parsed = parseDocumentFromApiResponse(rawDoc);

    expect(parsed.content_urls.html).toBe(
      'https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR40000001/NOR40000001.html',
    );
  });

  it('should handle missing content URLs gracefully', () => {
    const rawDoc = createMockRawDocument('NOR40000001');
    const parsed = parseDocumentFromApiResponse(rawDoc);

    expect(parsed.content_urls.html).toBeNull();
    expect(parsed.content_urls.xml).toBeNull();
    expect(parsed.content_urls.pdf).toBeNull();
    expect(parsed.content_urls.rtf).toBeNull();
  });

  it('should handle empty document reference gracefully', () => {
    const emptyDoc: RawDocumentReference = {};
    const parsed = parseDocumentFromApiResponse(emptyDoc);

    expect(parsed.dokumentnummer).toBe('');
    expect(parsed.applikation).toBe('');
  });
});

// =============================================================================
// Tests for findDocumentByDokumentnummer
// =============================================================================

describe('findDocumentByDokumentnummer', () => {
  describe('when API returns multiple documents', () => {
    it('should find the correct document by dokumentnummer', () => {
      // Simulate API returning multiple documents where the requested one
      // is NOT the first in the list
      const rawDocuments = [
        createMockRawDocument('NOR40000001', { kurztitel: 'Wrong Document 1' }),
        createMockRawDocument('NOR40000002', { kurztitel: 'Correct Document' }),
        createMockRawDocument('NOR40000003', { kurztitel: 'Wrong Document 2' }),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000002');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('NOR40000002');
        expect(result.document.kurztitel).toBe('Correct Document');
      }
    });

    it('should find the document even when it is last in the list', () => {
      const rawDocuments = [
        createMockRawDocument('NOR40000001', { kurztitel: 'First' }),
        createMockRawDocument('NOR40000002', { kurztitel: 'Second' }),
        createMockRawDocument('NOR40000003', { kurztitel: 'Third - Target' }),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000003');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('NOR40000003');
        expect(result.document.kurztitel).toBe('Third - Target');
      }
    });

    it('should find the document when it is first in the list', () => {
      const rawDocuments = [
        createMockRawDocument('NOR40000001', { kurztitel: 'First - Target' }),
        createMockRawDocument('NOR40000002', { kurztitel: 'Second' }),
        createMockRawDocument('NOR40000003', { kurztitel: 'Third' }),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('NOR40000001');
        expect(result.document.kurztitel).toBe('First - Target');
      }
    });
  });

  describe('error handling', () => {
    it('should return not_found error when requested dokumentnummer is not in results', () => {
      const rawDocuments = [
        createMockRawDocument('NOR40000001'),
        createMockRawDocument('NOR40000002'),
        createMockRawDocument('NOR40000003'),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_found');
        expect(result.totalResults).toBe(3);
      }
    });

    it('should return no_documents error when documents array is empty', () => {
      const result = findDocumentByDokumentnummer([], 'NOR40000001');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('no_documents');
        expect(result.totalResults).toBeUndefined();
      }
    });

    it('should return no_documents error when documents is undefined', () => {
      const result = findDocumentByDokumentnummer(
        undefined as unknown as RawDocumentReference[],
        'NOR40000001',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('no_documents');
      }
    });

    it('should return no_documents error when documents is null', () => {
      const result = findDocumentByDokumentnummer(
        null as unknown as RawDocumentReference[],
        'NOR40000001',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('no_documents');
      }
    });
  });

  describe('single document', () => {
    it('should work when only one document is returned and it matches', () => {
      const rawDocuments = [createMockRawDocument('NOR40000001', { kurztitel: 'Only Document' })];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('NOR40000001');
        expect(result.document.kurztitel).toBe('Only Document');
      }
    });

    it('should fail when single document does not match requested dokumentnummer', () => {
      const rawDocuments = [createMockRawDocument('NOR40000001', { kurztitel: 'Wrong Document' })];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_found');
        expect(result.totalResults).toBe(1);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle case-sensitive dokumentnummer matching', () => {
      const rawDocuments = [
        createMockRawDocument('NOR40000001'),
        createMockRawDocument('nor40000002'), // lowercase
      ];

      // Exact match should work
      const result1 = findDocumentByDokumentnummer(rawDocuments, 'NOR40000001');
      expect(result1.success).toBe(true);

      // Different case should not match
      const result2 = findDocumentByDokumentnummer(rawDocuments, 'nor40000001');
      expect(result2.success).toBe(false);
    });

    it('should handle documents with similar dokumentnummer prefixes', () => {
      const rawDocuments = [
        createMockRawDocument('NOR40000001'),
        createMockRawDocument('NOR400000010'), // Longer number
        createMockRawDocument('NOR4000000'), // Shorter number
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('NOR40000001');
      }
    });

    it('should handle Landesrecht document numbers', () => {
      const rawDocuments = [
        createMockRawDocument('LNO40000001', { applikation: 'LrKons' }),
        createMockRawDocument('LNO40000002', { applikation: 'LrKons' }),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'LNO40000002');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('LNO40000002');
      }
    });

    it('should handle Judikatur document numbers', () => {
      const rawDocuments = [
        createMockRawDocument('JWR_2024010001', { applikation: 'Vwgh' }),
        createMockRawDocument('JWR_2024010002', { applikation: 'Vwgh' }),
      ];

      const result = findDocumentByDokumentnummer(rawDocuments, 'JWR_2024010002');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.document.dokumentnummer).toBe('JWR_2024010002');
      }
    });
  });
});

// =============================================================================
// Integration-style tests for the fix behavior
// =============================================================================

describe('Document matching fix behavior', () => {
  it('should NOT return wrong document when API returns documents in unexpected order', () => {
    // This test simulates the bug that was fixed:
    // The API might return documents in an order where the first document
    // is NOT the one we requested. The fix ensures we find the correct document
    // by dokumentnummer rather than taking documents[0].

    const requestedDokumentnummer = 'NOR40250169';
    const rawDocuments = [
      // API returns another document first (wrong one if we take [0])
      createMockRawDocument('NOR40250001', { kurztitel: 'Some Other Law' }),
      // The document we actually requested
      createMockRawDocument('NOR40250169', { kurztitel: 'Requested Law' }),
      // More unrelated documents
      createMockRawDocument('NOR40250200', { kurztitel: 'Another Law' }),
    ];

    const result = findDocumentByDokumentnummer(rawDocuments, requestedDokumentnummer);

    // Verify the fix: we should get the requested document, not the first one
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.document.dokumentnummer).toBe(requestedDokumentnummer);
      expect(result.document.kurztitel).toBe('Requested Law');
      // Make sure we didn't get the first document
      expect(result.document.kurztitel).not.toBe('Some Other Law');
    }
  });

  it('should provide helpful error when document not found among results', () => {
    // When the API returns results but none match the requested dokumentnummer,
    // the error should indicate how many results were returned

    const rawDocuments = [
      createMockRawDocument('NOR40000001'),
      createMockRawDocument('NOR40000002'),
      createMockRawDocument('NOR40000003'),
    ];

    const result = findDocumentByDokumentnummer(rawDocuments, 'NOR40999999');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('not_found');
      // The totalResults should help in error messages
      expect(result.totalResults).toBe(3);
    }
  });
});
