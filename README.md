# RIS MCP Server

[![CI](https://github.com/philrox/ris-mcp-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/philrox/ris-mcp-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ris-mcp-ts.svg)](https://www.npmjs.com/package/ris-mcp-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI assistants access to Austria's official legal database — the **Rechtsinformationssystem (RIS)**.

Ask your AI assistant about Austrian law, and it will search and retrieve legal documents directly from the official government API. No API key required.

## What You Can Do

Once connected, you can ask your AI assistant things like:

> "What does Austrian law say about tenancy rights?"

> "Find Constitutional Court decisions on freedom of expression."

> "Show me §1295 of the ABGB (Austrian Civil Code)."

> "What laws about climate protection were published in 2024?"

> "Look up the building code for the province of Salzburg."

> "Get the full text of document NOR40052761."

The server translates these natural language requests into structured API calls against the [RIS Open Government Data API](https://data.bka.gv.at/ris/api/v2.6/).

## Features

- **12 specialized tools** covering all major RIS collections
- **Federal law** (ABGB, StGB, UGB, ...) and **state law** for all 9 provinces
- **Court decisions** from 11 court types (Supreme Court, Constitutional Court, Administrative Court, ...)
- **Law gazettes** — Federal (BGBl) and state (LGBl)
- **Government bills**, ministerial decrees, cabinet protocols
- **Full document retrieval** with smart prefix-based routing
- **Change history tracking** across 30 application types
- **Markdown and JSON** output formats
- **Free and open** — uses Austria's Open Government Data API, no API key needed

## Quick Start

Run directly without installation:

```bash
npx ris-mcp-ts
```

Or install globally:

```bash
npm install -g ris-mcp-ts
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (Settings > Developer > Edit Config):

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ris": {
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

> **Note:** The "Add custom connector" UI in Claude Desktop only supports remote MCP servers (HTTP/SSE). Local stdio servers like this one must be configured via the JSON file.

### Claude Code

Add to your project or user settings:

```bash
claude mcp add ris -- npx -y ris-mcp-ts
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "ris": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global access):

```json
{
  "mcpServers": {
    "ris": {
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP config at `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "ris": {
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

### Other MCP Clients

Any MCP-compatible client can connect via stdio transport:

```bash
npx ris-mcp-ts
```

## Available Tools

| Tool | Description |
|------|-------------|
| `ris_bundesrecht` | Search federal laws (ABGB, StGB, UGB, etc.) |
| `ris_landesrecht` | Search state/provincial laws (all 9 provinces) |
| `ris_judikatur` | Search court decisions (11 court types) |
| `ris_bundesgesetzblatt` | Search Federal Law Gazettes (BGBl I/II/III) |
| `ris_landesgesetzblatt` | Search State Law Gazettes (LGBl) |
| `ris_regierungsvorlagen` | Search government bills |
| `ris_dokument` | Retrieve full document text by ID or URL |
| `ris_bezirke` | Search district authority announcements |
| `ris_gemeinden` | Search municipal law and regulations |
| `ris_sonstige` | Search miscellaneous collections (8 sub-apps) |
| `ris_history` | Track document change history (30 app types) |
| `ris_verordnungen` | Search state ordinance gazettes |

## Tool Reference

<details>
<summary><strong>ris_bundesrecht</strong> — Federal Laws</summary>

Search Austrian federal laws such as ABGB, StGB, UGB, and more.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search (e.g., "Mietrecht", "Schadenersatz") |
| `titel` | string | Search in law titles (e.g., "ABGB", "Strafgesetzbuch") |
| `paragraph` | string | Section number (e.g., "1295" for §1295) |
| `applikation` | string | "BrKons" (consolidated, default), "Begut" (draft reviews), "Erv" (English version) |
| `fassung_vom` | string | Date for historical version (YYYY-MM-DD) |
| `seite` | number | Page number (default: 1) |
| `limit` | number | Results per page: 10, 20, 50, 100 (default: 20) |
| `response_format` | string | "markdown" (default) or "json" |

All parameters are optional. At least one search parameter (`suchworte`, `titel`, or `paragraph`) should be provided.

</details>

<details>
<summary><strong>ris_landesrecht</strong> — State/Provincial Laws</summary>

Search state laws of the nine Austrian provinces.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search |
| `titel` | string | Search in law titles |
| `bundesland` | string | Province: Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `applikation` | string | "LrKons" (consolidated, default) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

<details>
<summary><strong>ris_judikatur</strong> — Court Decisions</summary>

Search court decisions from Austrian courts.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search in decisions |
| `gericht` | string | Court type (see below) |
| `norm` | string | Legal norm (e.g., "1319a ABGB") |
| `geschaeftszahl` | string | Case number (e.g., "5Ob234/20b") |
| `entscheidungsdatum_von` | string | Decision date from (YYYY-MM-DD) |
| `entscheidungsdatum_bis` | string | Decision date to (YYYY-MM-DD) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

**Available courts:**

| Value | Court |
|-------|-------|
| `Justiz` | Supreme Court (OGH), Higher Regional Courts (OLG), Regional Courts (LG) — default |
| `Vfgh` | Constitutional Court |
| `Vwgh` | Supreme Administrative Court |
| `Bvwg` | Federal Administrative Court |
| `Lvwg` | Provincial Administrative Courts |
| `Dsk` | Data Protection Authority |
| `AsylGH` | Asylum Court (historical) |
| `Normenliste` | Index of legal norms |
| `Pvak` | Personnel Representation Supervisory Commission |
| `Gbk` | Equal Treatment Commission |
| `Dok` | Disciplinary Commission |

</details>

<details>
<summary><strong>ris_bundesgesetzblatt</strong> — Federal Law Gazette</summary>

Search the Federal Law Gazette (BGBl) — official publications of federal legislation.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bgblnummer` | string | Gazette number (e.g., "120") |
| `teil` | string | "1" (I = Acts), "2" (II = Regulations), "3" (III = Treaties) |
| `jahrgang` | string | Year (e.g., "2023") |
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `applikation` | string | "BgblAuth" (authentic from 2004, default), "BgblPdf" (PDF), "BgblAlt" (1945–2003) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

<details>
<summary><strong>ris_landesgesetzblatt</strong> — State Law Gazette</summary>

Search State Law Gazettes (LGBl) — official publications of state legislation.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lgblnummer` | string | Gazette number (e.g., "50") |
| `jahrgang` | string | Year (e.g., "2023") |
| `bundesland` | string | Province name |
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `applikation` | string | "LgblAuth" (authentic, default), "Lgbl" (general), "LgblNO" (Niederoesterreich) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

<details>
<summary><strong>ris_regierungsvorlagen</strong> — Government Bills</summary>

Search government bills — draft legislation submitted to parliament.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `beschlussdatum_von` | string | Approval date from (YYYY-MM-DD) |
| `beschlussdatum_bis` | string | Approval date to (YYYY-MM-DD) |
| `einbringende_stelle` | string | Submitting ministry (e.g., BKA, BMF, BMJ, BMK) |
| `im_ris_seit` | string | Added recently: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `sortierung_richtung` | string | Ascending or Descending |
| `sortierung_spalte` | string | Kurztitel, EinbringendeStelle, Beschlussdatum |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

<details>
<summary><strong>ris_dokument</strong> — Full Document Retrieval</summary>

Retrieve the full text of a legal document by its ID or URL. Uses a dual strategy: direct URL access first, then search API fallback.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dokumentnummer` | string | RIS document number (e.g., "NOR40052761") |
| `url` | string | Direct URL to document content |
| `response_format` | string | "markdown" (default) or "json" |

At least one of `dokumentnummer` or `url` is required. Long documents are truncated to 25,000 characters.

**Supported document prefixes:**

| Prefix | Type |
|--------|------|
| NOR | Federal norms |
| LBG, LKT, LNO, LOO, LSB, LST, LTI, LVB, LWI | State laws (9 provinces) |
| JWR, JFR, JWT, BVWG, LVWG, DSB, GBK, PVAK, ASYLGH | Court decisions |
| BGBLA, BGBL | Federal Law Gazette |
| REGV | Government bills |
| BVB | District authorities |
| VBL | Ordinance gazettes |
| MRP, ERL | Cabinet protocols, ministerial decrees |

</details>

<details>
<summary><strong>ris_bezirke</strong> — District Authority Announcements</summary>

Search announcements from district administrative authorities.

> **Note:** Only available for: Niederoesterreich, Oberoesterreich, Tirol, Vorarlberg, Burgenland, Steiermark.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `bundesland` | string | Province name |
| `bezirksverwaltungsbehoerde` | string | District authority name |
| `kundmachungsnummer` | string | Announcement number |
| `kundmachungsdatum_von` | string | Date from (YYYY-MM-DD) |
| `kundmachungsdatum_bis` | string | Date to (YYYY-MM-DD) |
| `im_ris_seit` | string | Added recently: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

<details>
<summary><strong>ris_gemeinden</strong> — Municipal Law</summary>

Search municipal law — local ordinances and regulations.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `bundesland` | string | Province name |
| `gemeinde` | string | Municipality name (e.g., "Graz") |
| `applikation` | string | "Gr" (municipal law, default) or "GrA" (official gazettes) |
| `im_ris_seit` | string | Added recently |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

Additional parameters depend on the selected application. See `Gr` (municipal law) and `GrA` (official gazettes) specific parameters in the source code.

</details>

<details>
<summary><strong>ris_sonstige</strong> — Miscellaneous Collections</summary>

Search miscellaneous legal collections and specialized databases.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `applikation` | string | **Required.** Collection to search (see below) |
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `datum_von` | string | Date from (YYYY-MM-DD) |
| `datum_bis` | string | Date to (YYYY-MM-DD) |
| `im_ris_seit` | string | Added recently |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

**Available collections:**

| Value | Description |
|-------|-------------|
| `Mrp` | Cabinet protocols (Ministerratsprotokolle) |
| `Erlaesse` | Ministerial decrees |
| `Upts` | Party transparency reports |
| `KmGer` | Court announcements |
| `Avsv` | Social insurance regulations |
| `Avn` | Veterinary notices |
| `Spg` | Health structure plans |
| `PruefGewO` | Trade licensing exams |

Each collection has additional specific parameters. See the tool description for details.

</details>

<details>
<summary><strong>ris_history</strong> — Document Change History</summary>

Track document creation, modification, and deletion across the RIS database.

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `applikation` | string | **Required.** Application type (30 options — see below) |
| `aenderungen_von` | string | Changes from date (YYYY-MM-DD) |
| `aenderungen_bis` | string | Changes to date (YYYY-MM-DD) |
| `include_deleted` | boolean | Include deleted documents (default: false) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

**Available applications (30):**

Federal law: `Bundesnormen`, `BgblAuth`, `BgblAlt`, `BgblPdf`, `RegV`
State law: `Landesnormen`, `LgblAuth`, `Lgbl`, `LgblNO`, `Vbl`, `Gemeinderecht`, `GemeinderechtAuth`
Case law: `Justiz`, `Vfgh`, `Vwgh`, `Bvwg`, `Lvwg`, `Dsk`, `Gbk`, `Pvak`, `AsylGH`
Other: `Bvb`, `Mrp`, `Erlaesse`, `PruefGewO`, `Avsv`, `Spg`, `KmGer`, `Dok`, `Normenliste`

</details>

<details>
<summary><strong>ris_verordnungen</strong> — State Ordinance Gazettes</summary>

Search state ordinance gazettes (Verordnungsblätter).

> **Note:** Currently only data from **Tirol** is available (since January 2022).

**Inputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suchworte` | string | Full-text search |
| `titel` | string | Search in titles |
| `bundesland` | string | Province name |
| `kundmachungsnummer` | string | Announcement number |
| `kundmachungsdatum_von` | string | Date from (YYYY-MM-DD) |
| `kundmachungsdatum_bis` | string | Date to (YYYY-MM-DD) |
| `seite` | number | Page number |
| `limit` | number | Results per page |
| `response_format` | string | "markdown" or "json" |

</details>

## Development

### Prerequisites

- Node.js >= 20.0.0

### Setup

```bash
git clone https://github.com/philrox/ris-mcp-ts.git
cd ris-mcp-ts
npm install
npm run build
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled version |
| `npm test` | Run all tests |
| `npm run check` | Typecheck + lint + format check + tests |
| `npm run inspect` | Launch MCP Inspector for manual testing |

### Project Structure

```
src/
├── index.ts           # Entry point (stdio transport)
├── server.ts          # MCP server setup, delegates to tools/
├── client.ts          # HTTP client for RIS API
├── types.ts           # Zod schemas + TypeScript types
├── parser.ts          # JSON parsing and response normalization
├── formatting.ts      # Output formatting (markdown/json)
├── helpers.ts         # Shared helper functions
├── constants.ts       # Static mappings and configuration
├── tools/             # One file per tool handler
│   ├── index.ts
│   ├── bundesrecht.ts
│   ├── landesrecht.ts
│   ├── judikatur.ts
│   └── ...
└── __tests__/         # Unit and integration tests
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

---

Built on the [Open Government Data API](https://data.bka.gv.at/ris/api/v2.6/) provided by the Austrian Federal Chancellery (Bundeskanzleramt).
