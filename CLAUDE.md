# CLAUDE.md

MCP Server for the Austrian Legal Information System (RIS - Rechtsinformationssystem).

## Quick Start

```bash
npm install
npm run build
```

## Development Commands

```bash
npm run dev             # Start with tsx (hot reload)
npm run build           # Compile TypeScript (runs typecheck first)
npm start               # Run compiled version
npm run check           # Run typecheck + lint + format:check + tests
```

## Testing

```bash
npm test                # Run all unit tests (611 tests, 10 files)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Tests with V8 coverage report
npm run test:integration # Integration tests (separate config, requires network)
```

### Manual Testing with MCP Inspector

```bash
npm run inspect
```

## Code Quality

```bash
npm run typecheck       # TypeScript strict mode check
npm run lint            # ESLint (strict + stylistic rules)
npm run lint:fix        # ESLint with auto-fix
npm run format          # Prettier format
npm run format:check    # Prettier check
```

Pre-commit hooks (Husky) auto-run `prettier --write` and `eslint --fix` on staged `.ts` files. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.) — enforced by commitlint.

## Code Architecture

```
src/
├── index.ts           # Entry point (stdio transport)
├── server.ts          # MCP server init, delegates to tools/
├── client.ts          # HTTP client for RIS API, error classes, URL construction
├── types.ts           # Zod schemas + TypeScript types
├── parser.ts          # JSON parsing and response normalization
├── formatting.ts      # Output formatting (markdown/json), character truncation
├── helpers.ts         # Shared helper functions for tool handlers
├── constants.ts       # Static mappings, enum values, configuration
├── tools/
│   ├── index.ts       # registerAllTools() barrel file
│   ├── bundesrecht.ts
│   ├── landesrecht.ts
│   ├── judikatur.ts
│   ├── bundesgesetzblatt.ts
│   ├── landesgesetzblatt.ts
│   ├── regierungsvorlagen.ts
│   ├── dokument.ts    # Full document retrieval (largest handler)
│   ├── bezirke.ts
│   ├── gemeinden.ts
│   ├── sonstige.ts    # 8 sub-applications (second largest)
│   ├── history.ts
│   └── verordnungen.ts
└── __tests__/
    ├── client.test.ts
    ├── document-matching.test.ts
    ├── edge-cases.test.ts
    ├── formatting.test.ts
    ├── history.test.ts
    ├── parser.test.ts
    ├── security.e2e.test.ts
    ├── server.test.ts
    ├── types.test.ts
    └── integration/
        └── smoke.test.ts
```

## Key Patterns

### Adding/Modifying a Tool Handler

Each tool lives in `src/tools/<name>.ts` and exports a `register<Name>Tool(server)` function. Pattern:

1. Define Zod schema inline for the tool's parameters
2. Use `helpers.ts` functions: `hasAnyParam()`, `buildBaseParams()`, `addOptionalParams()`, `executeSearchTool()`
3. Call client search functions from `client.ts`
4. Register in `src/tools/index.ts` if adding a new tool

### Helper Functions (helpers.ts)

| Function | Purpose |
|----------|---------|
| `createMcpResponse()` | Standard MCP text response |
| `createValidationErrorResponse()` | Validation error listing required params |
| `hasAnyParam()` | Check if any specified param has a truthy value |
| `buildBaseParams()` | Build base API params (Applikation, DokumenteProSeite, Seitennummer) |
| `addOptionalParams()` | Add truthy optional params to request |
| `executeSearchTool()` | Execute search with parsing, formatting, truncation, error handling |
| `formatErrorResponse()` | Format errors in German for user-facing output |

### Error Classes (client.ts)

- `RISAPIError` — Base error with statusCode
- `RISTimeoutError` — 30s timeout exceeded
- `RISParsingError` — JSON parsing failures, includes originalError

### Constants

- **Timeout**: 30,000ms (30 seconds)
- **Character limit**: 25,000 characters (formatting.ts `CHARACTER_LIMIT`)
- **Pagination**: 10/20/50/100 documents per page (mapped via `limitToDokumenteProSeite()` in types.ts)
- **Allowed document hosts**: `data.bka.gv.at`, `www.ris.bka.gv.at`, `ris.bka.gv.at` (SSRF protection in client.ts)

### Conventions

- **Language**: Error messages and tool descriptions are in **German**
- **Imports**: Enforced order — builtin > external > internal > parent > sibling > index (alphabetized)
- **Types**: Use `type` imports (`import type { ... }`), no explicit `any`
- **Unused vars**: Must be prefixed with `_`
- **ESM**: Project uses ES modules (`"type": "module"` in package.json, `.js` extensions in imports)

## CI/CD

GitHub Actions runs on push/PR to main:
- **CI**: Matrix test (Node 18, 20, 22) → `npm run check` + coverage
- **Release**: Tag push (`v*`) → check + build + GitHub Release + npm publish
- **CodeQL**: Weekly security scanning

## MCP Tools (12)

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `ris_bundesrecht` | Federal laws (ABGB, StGB, etc.) | /Bundesrecht |
| `ris_landesrecht` | State/provincial laws | /Landesrecht |
| `ris_judikatur` | Court decisions (11 court types) | /Judikatur |
| `ris_bundesgesetzblatt` | Federal Law Gazettes | /Bundesrecht |
| `ris_landesgesetzblatt` | State Law Gazettes | /Landesrecht |
| `ris_regierungsvorlagen` | Government Bills | /Sonstige |
| `ris_dokument` | Full document text | Direct URL + fallback |
| `ris_bezirke` | District authority decisions | /Bezirke |
| `ris_gemeinden` | Municipal law | /Gemeinden |
| `ris_sonstige` | Misc collections (8 apps) | /Sonstige |
| `ris_history` | Document change history | /History |
| `ris_verordnungen` | State ordinances (Tirol only) | /Landesrecht |

## ris_sonstige Applications

| App | Description | Special Parameters |
|-----|-------------|-------------------|
| `Mrp` | Council of Ministers protocols | einbringer, sitzungsnummer, gesetzgebungsperiode |
| `Erlaesse` | Ministerial decrees | bundesministerium, abteilung, fundstelle |
| `Upts` | Party transparency | partei (6 parties) |
| `KmGer` | Court announcements | kmger_typ, gericht |
| `Avsv` | Social insurance | dokumentart, urheber, avsvnummer |
| `Avn` | Veterinary notices | avnnummer, avn_typ |
| `Spg` | Health structure plans | spgnummer, osg_typ, rsg_typ |
| `PruefGewO` | Trade licensing exams | pruefgewo_typ |

## ris_history Applications (30)

Bundesnormen, Landesnormen, Justiz, Vfgh, Vwgh, Bvwg, Lvwg, BgblAuth, BgblAlt, BgblPdf, LgblAuth, Lgbl, LgblNO, Gemeinderecht, GemeinderechtAuth, Bvb, Vbl, RegV, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dsk, Gbk, Dok, Pvak, Normenliste, AsylGH

## Document Prefixes (ris_dokument routing)

| Prefix | Document Type |
|--------|--------------|
| NOR | Federal law (Bundesnormen) |
| LBG, LKT, LNO, LOO, LSB, LST, LTI, LVB, LWI | State laws (9 states) |
| JWR, JFR, JWT, BVWG, LVWG, DSB, GBK, PVAK, ASYLGH | Court decisions |
| BGBLA, BGBL | Federal Law Gazettes |
| REGV | Government bills |
| MRP, ERL | Cabinet protocols, decrees |

## Documentation

- API Docs: `docs/Dokumentation_OGD-RIS_API.md` (Markdown) / `docs/Dokumentation_OGD-RIS_API.pdf`
- RIS API v2.6: https://data.bka.gv.at/ris/api/v2.6/
