/**
 * HTTP client for the Austrian RIS (Rechtsinformationssystem) API v2.6.
 *
 * This module provides a client for querying the Austrian legal information
 * system API, which includes federal law, state law, case law, and other legal
 * documents.
 *
 * API Documentation: https://data.bka.gv.at/ris/api/v2.6/
 */

import type { NormalizedSearchResults, RawApiResponse, RawDocumentReference, RawHitsInfo } from "./types.js";

// =============================================================================
// Custom Errors
// =============================================================================

/**
 * Base exception for RIS API errors.
 */
export class RISAPIError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "RISAPIError";
    this.statusCode = statusCode;
  }
}

/**
 * Raised when a request to the RIS API times out.
 */
export class RISTimeoutError extends RISAPIError {
  constructor(message = "Request to RIS API timed out") {
    super(message);
    this.name = "RISTimeoutError";
  }
}

/**
 * Raised when JSON parsing fails.
 */
export class RISParsingError extends RISAPIError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "RISParsingError";
    this.originalError = originalError;
  }
}

// =============================================================================
// RIS Client
// =============================================================================

const BASE_URL = "https://data.bka.gv.at/ris/api/v2.6/";
const DEFAULT_TIMEOUT = 30000; // 30 seconds in milliseconds

/**
 * Build query parameters for API request.
 * Converts all values to strings and filters out undefined/null values.
 */
function buildParams(params: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams;
}

/**
 * Parse JSON response from the RIS API.
 */
function parseJsonResponse(jsonContent: string): RawApiResponse {
  try {
    return JSON.parse(jsonContent) as RawApiResponse;
  } catch (e) {
    throw new RISParsingError(
      `Failed to parse JSON response: ${e instanceof Error ? e.message : String(e)}`,
      e instanceof Error ? e : undefined
    );
  }
}

/**
 * Extract and normalize search results from parsed API response.
 */
function extractSearchResults(parsedResponse: RawApiResponse): NormalizedSearchResults {
  const searchResult = parsedResponse.OgdSearchResult ?? {};
  const documentResults = searchResult.OgdDocumentResults ?? {};

  // Extract pagination info from Hits element
  const hitsInfo = documentResults.Hits;

  let totalHits = 0;
  let pageNumber = 1;
  let pageSize = 10;

  if (typeof hitsInfo === "object" && hitsInfo !== null) {
    const hitsObj = hitsInfo as RawHitsInfo;
    totalHits = Number(hitsObj["#text"] ?? 0);
    pageNumber = Number(hitsObj["@pageNumber"] ?? 1);
    pageSize = Number(hitsObj["@pageSize"] ?? 10);
  } else if (hitsInfo !== undefined && hitsInfo !== null) {
    totalHits = Number(hitsInfo);
  }

  // Extract document references
  let docRefs = documentResults.OgdDocumentReference;

  // Ensure docRefs is always an array
  if (docRefs === undefined || docRefs === null) {
    docRefs = [];
  } else if (!Array.isArray(docRefs)) {
    docRefs = [docRefs];
  }

  return {
    hits: totalHits,
    page_number: pageNumber,
    page_size: pageSize,
    documents: docRefs as RawDocumentReference[],
  };
}

/**
 * Make a request to the RIS API.
 */
async function request(
  endpoint: string,
  params: Record<string, unknown>,
  timeout = DEFAULT_TIMEOUT
): Promise<NormalizedSearchResults> {
  const url = new URL(endpoint, BASE_URL);
  url.search = buildParams(params).toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new RISAPIError(
        `HTTP error ${response.status} for ${endpoint}: ${text}`,
        response.status
      );
    }

    const jsonText = await response.text();
    const parsed = parseJsonResponse(jsonText);
    return extractSearchResults(parsed);
  } catch (e) {
    clearTimeout(timeoutId);

    if (e instanceof RISAPIError || e instanceof RISParsingError) {
      throw e;
    }

    if (e instanceof Error) {
      if (e.name === "AbortError") {
        throw new RISTimeoutError(
          `Request to ${endpoint} timed out after ${timeout}ms`
        );
      }
      throw new RISAPIError(`Request failed for ${endpoint}: ${e.message}`);
    }

    throw new RISAPIError(`Request failed for ${endpoint}: ${String(e)}`);
  }
}

/**
 * Search federal law (Bundesrecht).
 */
export async function searchBundesrecht(
  params: Record<string, unknown>,
  timeout = DEFAULT_TIMEOUT
): Promise<NormalizedSearchResults> {
  return request("Bundesrecht", params, timeout);
}

/**
 * Search state/provincial law (Landesrecht).
 */
export async function searchLandesrecht(
  params: Record<string, unknown>,
  timeout = DEFAULT_TIMEOUT
): Promise<NormalizedSearchResults> {
  return request("Landesrecht", params, timeout);
}

/**
 * Search case law/jurisprudence (Judikatur).
 */
export async function searchJudikatur(
  params: Record<string, unknown>,
  timeout = DEFAULT_TIMEOUT
): Promise<NormalizedSearchResults> {
  return request("Judikatur", params, timeout);
}

/**
 * Fetch HTML content from a document URL.
 */
export async function getDocumentContent(
  url: string,
  timeout = DEFAULT_TIMEOUT
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new RISAPIError(
        `HTTP error ${response.status} fetching document: ${text}`,
        response.status
      );
    }

    return await response.text();
  } catch (e) {
    clearTimeout(timeoutId);

    if (e instanceof RISAPIError) {
      throw e;
    }

    if (e instanceof Error) {
      if (e.name === "AbortError") {
        throw new RISTimeoutError(
          `Request to document URL timed out after ${timeout}ms`
        );
      }
      throw new RISAPIError(`Request failed fetching document: ${e.message}`);
    }

    throw new RISAPIError(`Request failed fetching document: ${String(e)}`);
  }
}
