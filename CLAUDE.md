# CLAUDE.md

MCP Server for the Austrian Legal Information System (RIS - Rechtsinformationssystem).

## Quick Start

```bash
npm install
npm run build
```

## Development Commands

```bash
npm run dev          # Start with tsx (hot reload)
npm run build        # Compile TypeScript
npm start            # Run compiled version
npm run check        # Run typecheck + lint + tests
```

## Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
```

Test files are located in `src/__tests__/` with 524 tests across 7 test files.

### Manual Testing with MCP Inspector

```bash
npm run inspect
```

## Code Architecture

```
src/
├── index.ts       # Entry point (stdio transport)
├── server.ts      # MCP Server with 12 tools (~1,700 lines)
├── client.ts      # HTTP client for RIS API
├── parser.ts      # JSON parsing and response normalization
├── types.ts       # Zod schemas + TypeScript types
├── formatting.ts  # Output formatting (markdown/json)
└── __tests__/     # Test files (7 files, 524 tests)
```

## Key Architecture Patterns

### Helper Functions (server.ts:266-328)
- `createMcpResponse()` - Standard response creation
- `createValidationErrorResponse()` - Validation error responses
- `hasAnyParam()` - Parameter presence checking
- `buildBaseParams()` - Base parameter construction
- `addOptionalParams()` - Optional parameter mapping
- `executeSearchTool()` - Search execution with error handling

### Error Classes (client.ts)
- `RISAPIError` - Base error with status code
- `RISTimeoutError` - 30s timeout exceeded
- `RISParsingError` - JSON parsing failures

### Constants
- Timeout: 30 seconds
- Character limit: 25,000 characters
- Pagination: 10/20/50/100 documents per page

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

Bundesnormen, BgblAuth, BgblAlt, BgblPdf, RegV, Landesnormen, LgblAuth, Lgbl, LgblNO, Vbl, Gemeinderecht, GemeinderechtAuth, Justiz, Vfgh, Vwgh, Bvwg, Lvwg, Dsk, Gbk, Pvak, AsylGH, Bvb, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dok, Normenliste

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

- API Docs: `docs/Dokumentation_OGD-RIS_API.pdf`
- RIS API v2.6: https://data.bka.gv.at/ris/api/v2.6/
