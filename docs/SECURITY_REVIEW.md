# Security Review Report — RIS MCP Server

**Date:** 2026-02-07
**Reviewer:** Automated Security Review (Claude)
**Scope:** Full source code review of `src/` directory
**Version:** 1.0.0 (commit `148a8a1` on `open-source-release-plan` branch)

---

## Executive Summary

The RIS MCP Server demonstrates **strong security posture** for an open-source MCP tool. The codebase has no hardcoded secrets, no direct SSRF vulnerabilities (URLs are constructed server-side from validated document numbers), uses Zod schemas for input validation, and properly URL-encodes parameters via `URLSearchParams`. HTML parsing with Cheerio extracts text only — no raw HTML is re-emitted.

**Key findings:**

| Severity | Count | Summary |
|----------|-------|---------|
| CRITICAL | 0 | — |
| HIGH | 1 | `ris_dokument` accepts arbitrary URLs without domain allowlist |
| MEDIUM | 2 | No max-length on free-text string inputs; `applikation`/`gericht` params on some tools accept freeform strings |
| LOW | 2 | Error messages include upstream API response bodies; no rate limiting |
| INFO | 2 | Good defense-in-depth patterns noted |

**Overall assessment: PASS with 1 HIGH and 2 MEDIUM issues to address before public release.**

---

## Detailed Findings

### 1. Input Validation (Zod Schemas)

#### 1.1 Enum-restricted parameters — PASS

All enumerated parameters use Zod `z.enum()` schemas, which strictly restrict values:

- `BundesrechtApplikationSchema` — `src/types.ts:18-23`
- `JudikaturGerichtSchema` — `src/types.ts:29-41`
- `BundeslandSchema` / `LandesrechtBundeslandSchema` — `src/types.ts:48-78`
- `DokumenteProSeiteSchema` — `src/types.ts:93-98`
- `ResponseFormatSchema` — `src/types.ts:104`
- `DateSchema` — `src/types.ts:84-86` (regex-validated `YYYY-MM-DD`)
- Tool-specific enums in `src/server.ts`: `GEMEINDEN_INDEX_VALUES` (line 67), `IM_RIS_SEIT_VALUES` (line 84), `UPTS_PARTEIEN` (line 96), `BUNDESMINISTERIEN` (line 109), `KMGER_TYP_VALUES` (line 128), `AVSV_URHEBER_VALUES` (line 136), `AVN_TYP_VALUES` (line 148), `SPG_OSG_TYP_VALUES` (line 153), `SPG_RSG_TYP_VALUES` (line 158), `PRUEFGEWO_TYP_VALUES` (line 163), `VALID_HISTORY_APPLICATIONS` (line 169), `VALID_VBL_BUNDESLAENDER` (line 1614)

**Status: PASS** — All discrete-value parameters are properly constrained by enums.

#### 1.2 Free-text string parameters — WARNING

Multiple tools accept free-text `z.string().optional()` parameters **without max-length restrictions**:

| Parameter | Tools affected | Risk |
|-----------|---------------|------|
| `suchworte` | All 12 tools | Unbounded query string |
| `titel` | Most tools | Unbounded query string |
| `paragraph` | `ris_bundesrecht` | Unbounded |
| `norm` | `ris_judikatur`, `ris_sonstige` | Unbounded |
| `geschaeftszahl` | `ris_judikatur`, `ris_sonstige`, `ris_gemeinden` | Unbounded |
| `gemeinde` | `ris_gemeinden` | Unbounded |
| `bezirksverwaltungsbehoerde` | `ris_bezirke` | Unbounded |
| `einbringer` | `ris_sonstige` | Unbounded |
| `dokumentart` | `ris_sonstige` (Avsv) | Unbounded |
| `gericht` | `ris_sonstige` (KmGer) | Unbounded |
| Various number/ID params | Multiple tools | Unbounded |

**Locations:** `src/server.ts` lines 353-374, 417-428, 470-486, 537-554, etc.

**Risk:** An MCP client (LLM) could send extremely long strings, causing:
- Memory pressure on the server process
- Oversized HTTP requests to the RIS API (which may reject or behave unpredictably)

**Recommendation:** Add `.max(500)` or `.max(1000)` to all free-text `z.string()` parameters. Example:
```typescript
suchworte: z.string().max(500).optional().describe('Full-text search terms')
```

**Status: WARNING (MEDIUM)**

#### 1.3 `applikation` and `gericht` on some tools — WARNING

Two tools accept freeform string `applikation`/`gericht` values that are not enum-restricted:

- `ris_bundesrecht`: `applikation: z.string().default('BrKons')` — `src/server.ts:363-367`
  - Should be restricted to `z.enum(['BrKons', 'Begut', 'BgblAuth', 'Erv'])`
- `ris_judikatur`: `gericht: z.string().default('Justiz')` — `src/server.ts:471-476`
  - Should be restricted to `z.enum(['Justiz', 'Vfgh', 'Vwgh', ...])` (using `JudikaturGerichtSchema`)
- `ris_landesrecht`: `applikation: z.string().default('LrKons')` — `src/server.ts:422`
  - Should be restricted to `z.enum(['LrKons'])` or a broader enum if more values are valid

**Risk:** Arbitrary `Applikation` values are sent directly to the RIS API as a query parameter. While the API likely rejects unknown values, this could be used to probe for undocumented API behavior.

**Recommendation:** Replace `z.string()` with the corresponding `z.enum()` schemas already defined in `types.ts`.

**Status: WARNING (MEDIUM)**

#### 1.4 Numeric parameters — PASS (minor note)

- `seite: z.number().default(1)` and `limit: z.number().default(20)` have no `.min()` / `.max()` constraints.
- The `limitToDokumenteProSeite()` function (`src/types.ts:283-291`) safely maps to a fixed set of values (`Ten`, `Twenty`, `Fifty`, `OneHundred`) and defaults to `Twenty` for unknown values. This neutralizes out-of-range `limit` values.
- Negative `seite` values would be passed to the API but are unlikely to cause server-side issues.

**Status: PASS** — Low risk due to downstream mapping, but `.min(1).max(100)` on `limit` and `.min(1)` on `seite` would improve clarity.

---

### 2. URL Validation in `ris_dokument` — FAIL (HIGH)

#### 2.1 Direct URL parameter accepts arbitrary URLs

**Location:** `src/server.ts:786-787, 982-1001`

The `ris_dokument` tool accepts a `url` parameter:
```typescript
url: z.string().optional().describe('Direct URL to document content')
```

When a `url` is provided (without `dokumentnummer`), the code at line 999-1000 calls:
```typescript
htmlContent = await getDocumentContent(contentUrl);
```

**There is NO domain validation on the user-supplied `url`.** The `getDocumentContent()` function (`src/client.ts:261-298`) makes an unrestricted HTTP GET request to whatever URL is provided.

**SSRF Risk:** A malicious MCP client or a prompt-injected LLM could supply:
- `url: "http://169.254.169.254/latest/meta-data/"` (AWS metadata)
- `url: "http://localhost:8080/admin"` (internal services)
- `url: "file:///etc/passwd"` (local file access, though `fetch` typically blocks `file://`)

**Note:** When `dokumentnummer` is provided (the primary use case), the URLs are constructed server-side from hardcoded patterns (`src/client.ts:328-377`) after strict validation via `isValidDokumentnummer()` (`src/client.ts:315-322`). This path is secure.

**Recommendation:** Add domain allowlist validation:
```typescript
const ALLOWED_DOMAINS = ['data.bka.gv.at', 'www.ris.bka.gv.at', 'ris.bka.gv.at'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}
```

Apply this check before calling `getDocumentContent()` with a user-supplied URL.

**Status: FAIL (HIGH)** — Must be fixed before public release.

#### 2.2 Server-side URL construction from `dokumentnummer` — PASS

**Location:** `src/client.ts:315-402`

- `isValidDokumentnummer()` enforces: 5-50 chars, starts with uppercase letter, only `[A-Z0-9_]`
- URL patterns are hardcoded to `ris.bka.gv.at` domain
- `constructDocumentUrl()` validates first, then uses string replacement with the validated document number
- Defense-in-depth: validation happens in both `constructDocumentUrl()` and `getDocumentByNumber()`

**Status: PASS** — Excellent defense-in-depth pattern.

---

### 3. Parameter Injection (URL Encoding)

#### 3.1 Query parameter encoding — PASS

**Location:** `src/client.ts:69-77`

```typescript
function buildParams(params: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams;
}
```

`URLSearchParams.set()` automatically URL-encodes both keys and values. This prevents:
- Query parameter injection (e.g., `value="foo&admin=true"` → encoded as `foo%26admin%3Dtrue`)
- Path traversal through parameter values

**Status: PASS** — Proper use of `URLSearchParams` for encoding.

#### 3.2 Base URL construction — PASS

**Location:** `src/client.ts:142-143`

```typescript
const url = new URL(endpoint, BASE_URL);
url.search = buildParams(params).toString();
```

The `new URL()` constructor properly resolves the endpoint relative to the base URL. The `endpoint` values are hardcoded strings (`'Bundesrecht'`, `'Landesrecht'`, etc.) not user-controlled.

**Status: PASS**

---

### 4. Error Message Information Leakage

#### 4.1 API error responses may expose upstream details — LOW

**Location:** `src/client.ts:160-164`

```typescript
if (!response.ok) {
  const text = await response.text();
  throw new RISAPIError(
    `HTTP error ${response.status} for ${endpoint}: ${text}`,
    response.status,
  );
}
```

The full response body from the RIS API is included in the error message. This body is then passed to the MCP client via `formatErrorResponse()` (`src/server.ts:233-238`):

```typescript
if (error instanceof RISAPIError) {
  const statusInfo = error.statusCode ? ` (Status: ${error.statusCode})` : '';
  return `**Fehler:** Das RIS hat einen Fehler zurueckgegeben${statusInfo}.\n\nDetails: ${error.message}`;
}
```

**Risk:** The RIS API error body could contain:
- Internal server details or stack traces
- Internal path information
- Version numbers

**Recommendation:** Truncate or sanitize the API response body before including it in error messages. For example, limit to 200 characters:
```typescript
const text = (await response.text()).slice(0, 200);
```

**Status: WARNING (LOW)**

#### 4.2 Generic error fallback — LOW

**Location:** `src/server.ts:241-244`

```typescript
return (
  '**Fehler:** Ein unerwarteter Fehler ist aufgetreten.\n\n' +
  `Details: ${error instanceof Error ? error.message : String(error)}`
);
```

Generic `Error.message` could potentially contain file paths or other system information from Node.js runtime errors (e.g., file not found errors, DNS resolution failures with hostnames).

**Risk:** Low — these are network errors to an external API, unlikely to contain sensitive local paths.

**Status: WARNING (LOW)**

#### 4.3 No stack traces exposed — PASS

Error classes (`RISAPIError`, `RISTimeoutError`, `RISParsingError`) do not include `.stack` in their serialized output. The `formatErrorResponse()` function only uses `.message` and `.statusCode`.

**Status: PASS**

#### 4.4 Entry point error handling — PASS

**Location:** `src/index.ts:21-24`

```typescript
main().catch((error) => {
  console.error('Failed to start RIS MCP server:', error);
  process.exit(1);
});
```

This goes to stderr (not to MCP clients). Acceptable for server startup errors.

**Status: PASS**

---

### 5. Cheerio HTML Parsing

#### 5.1 HTML to text extraction — PASS

**Location:** `src/formatting.ts:52-75`

```typescript
export function htmlToText(htmlContent: string): string {
  const $ = cheerio.load(htmlContent);
  $('script, style, head').remove();
  let text = $('body').length > 0 ? $('body').text() : $.text();
  // ... whitespace cleanup ...
  return text;
}
```

**Security analysis:**
- Cheerio's `.text()` method extracts **only text content** — no HTML tags, attributes, or JavaScript survive
- `<script>`, `<style>`, and `<head>` elements are explicitly removed before text extraction
- No raw HTML is ever returned to the MCP client — only plain text
- No `eval()`, `innerHTML`, or similar dangerous operations
- No `$.html()` calls that would preserve HTML structure

**Status: PASS** — Cheerio is used safely for text extraction only.

#### 5.2 No XSS vectors in output — PASS

The server returns content as MCP text responses (`type: 'text'`). The output goes through:
1. `htmlToText()` — strips all HTML, returns plain text
2. `truncateResponse()` — limits output length
3. `createMcpResponse()` — wraps as `{ content: [{ type: 'text', text }] }`

No HTML is rendered in a browser context. MCP clients consume this as plain text.

**Status: PASS**

---

### 6. No Hardcoded Secrets

#### 6.1 Source code — PASS

Reviewed all 6 source files. Found:
- **No API keys, tokens, or passwords**
- **No authentication credentials** — the RIS API is a public Open Government Data (OGD) API requiring no authentication
- **No private keys or certificates**
- **Base URL is a public government endpoint:** `https://data.bka.gv.at/ris/api/v2.6/`

**Status: PASS**

#### 6.2 Configuration files — PASS

- `.gitignore` correctly excludes `.env` and `.env.local`
- No `.env` files exist in the repository
- `package.json` contains only public metadata
- No hardcoded secrets in any configuration file

**Status: PASS**

#### 6.3 Author email in package.json — INFO

**Location:** `package.json:65`

```json
"author": "philrox <phil@resultsbymagic.com>"
```

This is a public-facing field for npm packages. Standard practice, not a security issue.

**Status: INFO**

---

### 7. Additional Security Observations

#### 7.1 Timeout protection — PASS

**Location:** `src/client.ts:63, 144-146`

All HTTP requests use `AbortController` with a 30-second timeout. This prevents:
- Hanging connections to the RIS API
- Resource exhaustion from slow responses

**Status: PASS**

#### 7.2 Response size limiting — PASS

**Location:** `src/formatting.ts:476-514`

The `truncateResponse()` function limits output to 25,000 characters. This prevents:
- Memory exhaustion from very large API responses
- Oversized MCP responses that could affect client stability

**Status: PASS**

#### 7.3 No rate limiting — INFO

There is no rate limiting on tool invocations. An aggressive MCP client could flood the RIS API with requests.

**Risk:** Low for the MCP use case (single-user tool), but worth noting for documentation. The RIS API itself likely has server-side rate limiting.

**Recommendation:** Document the lack of rate limiting in README/SECURITY.md. Consider adding basic client-side throttling for production use.

**Status: INFO**

#### 7.4 Dependency security — INFO

Runtime dependencies are minimal:
- `@modelcontextprotocol/sdk` — MCP framework
- `cheerio` — HTML parsing (no browser execution context)
- `zod` — Schema validation

All are well-maintained, widely-used libraries with no known critical vulnerabilities at time of review.

**Status: INFO**

---

## Summary Table

| # | Check Item | Status | Severity | Location |
|---|-----------|--------|----------|----------|
| 1.1 | Enum-restricted parameters | PASS | — | `src/types.ts`, `src/server.ts` |
| 1.2 | Free-text string max-length | WARNING | MEDIUM | `src/server.ts` (all tools) |
| 1.3 | Freeform applikation/gericht params | WARNING | MEDIUM | `src/server.ts:363,422,471` |
| 1.4 | Numeric parameter bounds | PASS | — | `src/types.ts:283-291` |
| 2.1 | URL parameter domain validation | **FAIL** | **HIGH** | `src/server.ts:786,999` |
| 2.2 | Server-side URL construction | PASS | — | `src/client.ts:315-402` |
| 3.1 | Query parameter encoding | PASS | — | `src/client.ts:69-77` |
| 3.2 | Base URL construction | PASS | — | `src/client.ts:142-143` |
| 4.1 | API error body leakage | WARNING | LOW | `src/client.ts:160-164` |
| 4.2 | Generic error messages | WARNING | LOW | `src/server.ts:241-244` |
| 4.3 | No stack traces exposed | PASS | — | `src/server.ts:218-244` |
| 4.4 | Entry point error handling | PASS | — | `src/index.ts:21-24` |
| 5.1 | Cheerio HTML text extraction | PASS | — | `src/formatting.ts:52-75` |
| 5.2 | No XSS vectors in output | PASS | — | `src/formatting.ts` |
| 6.1 | No secrets in source code | PASS | — | All files |
| 6.2 | No secrets in config files | PASS | — | `.gitignore`, `package.json` |
| 7.1 | Timeout protection | PASS | — | `src/client.ts:63,144-146` |
| 7.2 | Response size limiting | PASS | — | `src/formatting.ts:476-514` |
| 7.3 | No rate limiting | INFO | — | — |
| 7.4 | Dependency security | INFO | — | `package.json` |

---

## Recommended Fixes (Priority Order)

### HIGH — Must fix before release

1. **Add URL domain allowlist to `ris_dokument`** (`src/server.ts`)
   - Validate that user-supplied URLs match `https://*.bka.gv.at` before fetching
   - Reject non-HTTPS protocols

### MEDIUM — Should fix before release

2. **Add `.max()` to all free-text string parameters** (`src/server.ts`)
   - Suggested limit: `.max(500)` for search terms, `.max(200)` for shorter fields

3. **Restrict `applikation`/`gericht` to enum values** (`src/server.ts`)
   - Replace `z.string()` with `z.enum()` on `ris_bundesrecht`, `ris_landesrecht`, `ris_judikatur`

### LOW — Nice to have

4. **Truncate API error response bodies** (`src/client.ts:162`)
   - Limit to 200 characters to avoid leaking upstream error details

5. **Add `.min(1)` to `seite` and `.min(1).max(100)` to `limit`** (`src/server.ts`)
   - Cosmetic improvement for schema documentation
