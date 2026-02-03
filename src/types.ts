/**
 * Zod schemas and TypeScript types for the RIS MCP Server.
 *
 * This module defines all data models used for interacting with the Austrian
 * Legal Information System (RIS) API, including enums for various search
 * parameters and document models for representing legal documents.
 */

import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

/**
 * Application types for federal law searches in RIS.
 */
export const BundesrechtApplikationSchema = z.enum([
  "BrKons", // Consolidated federal law
  "Begut", // Draft legislation
  "BgblAuth", // Federal Law Gazette authentic
  "Erv", // English translations
]);
export type BundesrechtApplikation = z.infer<typeof BundesrechtApplikationSchema>;

/**
 * Court types for case law searches in RIS.
 */
export const JudikaturGerichtSchema = z.enum([
  "Justiz", // Ordinary courts (OGH, OLG, LG, BG)
  "Vfgh", // Constitutional Court
  "Vwgh", // Supreme Administrative Court
  "Bvwg", // Federal Administrative Court
  "Lvwg", // State Administrative Courts
  "Dsk", // Data Protection Authority
  "AsylGH", // Asylum Court (historical, until 2013)
  "Normenliste", // Court norm lists (judicial review)
  "Pvak", // Personnel Representation Supervision Commission
  "Gbk", // Equal Treatment Commission
  "Dok", // Disciplinary Commission
]);
export type JudikaturGericht = z.infer<typeof JudikaturGerichtSchema>;

/**
 * Austrian federal states (Bundesländer).
 * Note: Uses Umlauts (ö, ä) for display purposes.
 */
export const BundeslandSchema = z.enum([
  "Wien",
  "Niederösterreich",
  "Oberösterreich",
  "Steiermark",
  "Tirol",
  "Kärnten",
  "Salzburg",
  "Vorarlberg",
  "Burgenland",
]);
export type Bundesland = z.infer<typeof BundeslandSchema>;

/**
 * Austrian federal states for Landesrecht API (ASCII versions without Umlauts).
 * The RIS API uses the SucheIn format (e.g., Bundesland.SucheInWien=true).
 */
export const LANDESRECHT_BUNDESLAENDER = [
  "Wien",
  "Niederoesterreich",
  "Oberoesterreich",
  "Salzburg",
  "Tirol",
  "Vorarlberg",
  "Kaernten",
  "Steiermark",
  "Burgenland",
] as const;

export const LandesrechtBundeslandSchema = z.enum(LANDESRECHT_BUNDESLAENDER);
export type LandesrechtBundesland = z.infer<typeof LandesrechtBundeslandSchema>;

/**
 * Date format validation schema (YYYY-MM-DD).
 * Used for date parameters in RIS API requests.
 */
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Datum muss im Format YYYY-MM-DD sein (z.B. 2024-01-15)",
  });

export const OptionalDateSchema = DateSchema.optional();

/**
 * Number of documents per page for paginated API responses.
 */
export const DokumenteProSeiteSchema = z.enum([
  "Ten", // 10 documents
  "Twenty", // 20 documents
  "Fifty", // 50 documents
  "OneHundred", // 100 documents
]);
export type DokumenteProSeite = z.infer<typeof DokumenteProSeiteSchema>;

/**
 * Output format for MCP tool responses.
 */
export const ResponseFormatSchema = z.enum(["markdown", "json"]);
export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;

// =============================================================================
// Document Models
// =============================================================================

/**
 * URLs for accessing document content in different formats.
 */
export const ContentUrlSchema = z.object({
  xml: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  rtf: z.string().nullable().optional(),
  pdf: z.string().nullable().optional(),
});
export type ContentUrl = z.infer<typeof ContentUrlSchema>;

/**
 * Citation information for a legal document.
 */
export const CitationSchema = z.object({
  kurztitel: z.string().nullable().optional(),
  langtitel: z.string().nullable().optional(),
  kundmachungsorgan: z.string().nullable().optional(),
  paragraph: z.string().nullable().optional(),
  eli: z.string().nullable().optional(),
  inkrafttreten: z.string().nullable().optional(),
  ausserkrafttreten: z.string().nullable().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;

/**
 * A single legal document from the RIS database.
 */
export const DocumentSchema = z.object({
  dokumentnummer: z.string(),
  applikation: z.string(),
  titel: z.string(),
  kurztitel: z.string().nullable().optional(),
  citation: CitationSchema,
  content_urls: ContentUrlSchema,
  dokument_url: z.string().nullable().optional(),
  gesamte_rechtsvorschrift_url: z.string().nullable().optional(),
});
export type Document = z.infer<typeof DocumentSchema>;

/**
 * Paginated search results from the RIS API.
 */
export const SearchResultSchema = z.object({
  total_hits: z.number().min(0),
  page: z.number().min(1),
  page_size: z.number().min(1).max(100),
  has_more: z.boolean(),
  documents: z.array(DocumentSchema),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// =============================================================================
// Raw API Response Types
// =============================================================================

/**
 * Raw content URL from API response.
 */
export interface RawContentUrl {
  DataType?: string;
  Url?: string;
}

/**
 * Raw URLs container from API response.
 */
export interface RawUrls {
  ContentUrl?: RawContentUrl | RawContentUrl[];
}

/**
 * Raw content reference from API response.
 */
export interface RawContentReference {
  ContentType?: string;
  Name?: string | { "#text"?: string };
  Urls?: RawUrls;
}

/**
 * Raw hits info from API response.
 */
export interface RawHitsInfo {
  "#text"?: string | number;
  "@pageNumber"?: string | number;
  "@pageSize"?: string | number;
}

/**
 * Raw document reference from API response.
 */
export interface RawDocumentReference {
  Data?: {
    Metadaten?: {
      Technisch?: {
        ID?: string;
        Applikation?: string;
      };
      Allgemein?: {
        DokumentUrl?: string;
      };
      Bundesrecht?: {
        Kurztitel?: string;
        Langtitel?: string;
        Titel?: string;
        Eli?: string;
        BrKons?: {
          Kundmachungsorgan?: string;
          ArtikelParagraphAnlage?: string;
          Inkrafttretensdatum?: string;
          Ausserkrafttretensdatum?: string;
          GesamteRechtsvorschriftUrl?: string;
        };
      };
      Landesrecht?: {
        Kurztitel?: string;
        Langtitel?: string;
        Titel?: string;
        Eli?: string;
        LrKons?: {
          Kundmachungsorgan?: string;
          ArtikelParagraphAnlage?: string;
          Inkrafttretensdatum?: string;
          Ausserkrafttretensdatum?: string;
          GesamteRechtsvorschriftUrl?: string;
        };
      };
      Judikatur?: {
        Geschaeftszahl?: { item?: string | string[] } | string;
        Entscheidungsdatum?: string;
        Vfgh?: { Leitsatz?: string };
        Vwgh?: { Leitsatz?: string };
        Justiz?: { Leitsatz?: string };
        Bvwg?: { Leitsatz?: string };
      };
    };
    Dokumentliste?: {
      ContentReference?: RawContentReference | RawContentReference[];
    };
  };
}

/**
 * Raw API search response structure.
 */
export interface RawApiResponse {
  OgdSearchResult?: {
    OgdDocumentResults?: {
      Hits?: RawHitsInfo | string | number;
      OgdDocumentReference?: RawDocumentReference | RawDocumentReference[];
    };
  };
}

/**
 * Normalized search results from client.
 */
export interface NormalizedSearchResults {
  hits: number;
  page_number: number;
  page_size: number;
  documents: RawDocumentReference[];
}

// =============================================================================
// Helper for limit mapping
// =============================================================================

/**
 * Map numeric limit to RIS API DokumenteProSeite value.
 */
export function limitToDokumenteProSeite(limit: number): DokumenteProSeite {
  const mapping: Record<number, DokumenteProSeite> = {
    10: "Ten",
    20: "Twenty",
    50: "Fifty",
    100: "OneHundred",
  };
  return mapping[limit] ?? "Twenty";
}
