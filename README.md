# RIS MCP Server

[![CI](https://github.com/philrox/ris-mcp-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/philrox/ris-mcp-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ris-mcp-ts.svg)](https://www.npmjs.com/package/ris-mcp-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for Austria's **Rechtsinformationssystem (RIS)** — the official legal database of the Republic of Austria. Search federal and state laws, court decisions, government bills, gazettes, and more — directly from any MCP-compatible AI assistant.

## Features

- **12 specialized tools** covering all major RIS collections
- **Federal law** (ABGB, StGB, UGB, ...) and **state law** for all 9 provinces
- **Court decisions** from 11 court types (Supreme Court, Constitutional Court, Administrative Court, ...)
- **Federal & state law gazettes** (BGBl, LGBl)
- **Government bills**, ministerial decrees, cabinet protocols
- **Full document retrieval** with smart prefix-based routing
- **Change history tracking** across 30 application types
- **Markdown and JSON** output formats
- **No API key required** — uses Austria's Open Government Data API

## Quick Install

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

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ris-mcp": {
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

### Claude Code

Add to your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "ris-mcp": {
      "command": "npx",
      "args": ["-y", "ris-mcp-ts"]
    }
  }
}
```

### Other MCP Clients

Any MCP-compatible client can connect to the server via stdio transport:

```bash
npx ris-mcp-ts
```

Or if installed from source:

```bash
node dist/index.js
```

## Tool Overview

| Tool | Description |
|------|-------------|
| `ris_bundesrecht` | Search federal laws (ABGB, StGB, UGB, etc.) |
| `ris_landesrecht` | Search state/provincial laws of all 9 provinces |
| `ris_judikatur` | Search court decisions (11 court types) |
| `ris_bundesgesetzblatt` | Search Federal Law Gazettes (BGBl I/II/III) |
| `ris_landesgesetzblatt` | Search State Law Gazettes (LGBl) |
| `ris_regierungsvorlagen` | Search government bills to parliament |
| `ris_dokument` | Retrieve full document text by ID or URL |
| `ris_bezirke` | Search district authority announcements |
| `ris_gemeinden` | Search municipal law and regulations |
| `ris_sonstige` | Search miscellaneous collections (8 apps) |
| `ris_history` | Track document change history (30 apps) |
| `ris_verordnungen` | Search state ordinance gazettes |

## Tool Reference

<details>
<summary><strong>ris_bundesrecht</strong> — Federal Laws</summary>

Search Austrian federal laws such as ABGB, StGB, UGB, and more.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search (e.g., "Mietrecht", "Schadenersatz") |
| `titel` | string | No | Search in law titles (e.g., "ABGB", "Strafgesetzbuch") |
| `paragraph` | string | No | Section number (e.g., "1295" for §1295) |
| `applikation` | string | No | Data source: "BrKons" (consolidated, default), "Begut" (draft reviews), "Erv" (English version) |
| `fassung_vom` | string | No | Date for historical version (YYYY-MM-DD) |
| `seite` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page: 10, 20, 50, 100 (default: 20) |
| `response_format` | string | No | "markdown" (default) or "json" |

**Examples:**

```
suchworte="Mietrecht"
titel="ABGB", paragraph="1319a"
titel="StGB", suchworte="Koerperverletzung"
```

</details>

<details>
<summary><strong>ris_landesrecht</strong> — State/Provincial Laws</summary>

Search state laws of the nine Austrian provinces.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in law titles |
| `bundesland` | string | No | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `applikation` | string | No | "LrKons" (consolidated, default) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Examples:**

```
suchworte="Bauordnung", bundesland="Salzburg"
bundesland="Wien", titel="Bauordnung"
```

</details>

<details>
<summary><strong>ris_judikatur</strong> — Court Decisions</summary>

Search court decisions from Austrian courts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search in decisions |
| `gericht` | string | No | Court type (see below) |
| `norm` | string | No | Legal norm (e.g., "1319a ABGB") |
| `geschaeftszahl` | string | No | Case number (e.g., "5Ob234/20b") |
| `entscheidungsdatum_von` | string | No | Decision date from (YYYY-MM-DD) |
| `entscheidungsdatum_bis` | string | No | Decision date to (YYYY-MM-DD) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Available courts:**

| Value | Court |
|-------|-------|
| `Justiz` | Supreme Court (OGH), Higher Regional Courts (OLG), Regional Courts (LG) — default |
| `Vfgh` | Constitutional Court (Verfassungsgerichtshof) |
| `Vwgh` | Supreme Administrative Court (Verwaltungsgerichtshof) |
| `Bvwg` | Federal Administrative Court (Bundesverwaltungsgericht) |
| `Lvwg` | Provincial Administrative Courts (Landesverwaltungsgerichte) |
| `Dsk` | Data Protection Authority (Datenschutzbehörde) |
| `AsylGH` | Asylum Court (historical) |
| `Normenliste` | Index of legal norms |
| `Pvak` | Personnel Representation Supervisory Commission |
| `Gbk` | Equal Treatment Commission |
| `Dok` | Disciplinary Commission |

**Examples:**

```
gericht="Vfgh", suchworte="Grundrecht"
gericht="Justiz", geschaeftszahl="5Ob234/20b"
norm="823 ABGB", gericht="Justiz"
```

</details>

<details>
<summary><strong>ris_bundesgesetzblatt</strong> — Federal Law Gazette</summary>

Search the Federal Law Gazette (BGBl) — official publications of federal legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgblnummer` | string | No | Gazette number (e.g., "120") |
| `teil` | string | No | "1" (I = Acts), "2" (II = Regulations), "3" (III = Treaties) |
| `jahrgang` | string | No | Year (e.g., "2023") |
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `applikation` | string | No | "BgblAuth" (authentic from 2004, default), "BgblPdf" (PDF), "BgblAlt" (1945–2003) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Examples:**

```
bgblnummer="120", jahrgang="2023", teil="1"
suchworte="Klimaschutz", jahrgang="2024"
```

</details>

<details>
<summary><strong>ris_landesgesetzblatt</strong> — State Law Gazette</summary>

Search State Law Gazettes (LGBl) — official publications of state legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lgblnummer` | string | No | Gazette number (e.g., "50") |
| `jahrgang` | string | No | Year (e.g., "2023") |
| `bundesland` | string | No | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `applikation` | string | No | "LgblAuth" (authentic, default), "Lgbl" (general), "LgblNO" (Niederoesterreich) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Examples:**

```
lgblnummer="50", jahrgang="2023", bundesland="Wien"
suchworte="Bauordnung", bundesland="Salzburg"
```

</details>

<details>
<summary><strong>ris_regierungsvorlagen</strong> — Government Bills</summary>

Search government bills — draft legislation submitted by the federal government to parliament.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `beschlussdatum_von` | string | No | Approval date from (YYYY-MM-DD) |
| `beschlussdatum_bis` | string | No | Approval date to (YYYY-MM-DD) |
| `einbringende_stelle` | string | No | Submitting ministry (see below) |
| `im_ris_seit` | string | No | Time filter: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `sortierung_richtung` | string | No | Ascending or Descending |
| `sortierung_spalte` | string | No | Kurztitel, EinbringendeStelle, Beschlussdatum |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Available ministries:**

| Code | Ministry |
|------|----------|
| BKA | Federal Chancellery (Bundeskanzleramt) |
| BMF | Federal Ministry of Finance |
| BMI | Federal Ministry of the Interior |
| BMJ | Federal Ministry of Justice |
| BMK | Federal Ministry for Climate Action |
| BMLV | Federal Ministry of Defence |
| BMAW | Federal Ministry of Labour and Economy |
| BMBWF | Federal Ministry of Education, Science and Research |
| BMDW | Federal Ministry for Digital and Economic Affairs |
| BMEIA | Federal Ministry for European and International Affairs |
| BMSGPK | Federal Ministry of Social Affairs, Health, Care and Consumer Protection |
| BML | Federal Ministry of Agriculture, Forestry, Regions and Water Management |
| BMKOES | Federal Ministry of Arts, Culture, Civil Service and Sport |
| BMFSFJ | Federal Ministry of Women, Family, Integration and Media |

**Examples:**

```
suchworte="Klimaschutz"
einbringende_stelle="BMK", beschlussdatum_von="2024-01-01"
titel="Steuerreform", sortierung_richtung="Descending"
```

</details>

<details>
<summary><strong>ris_dokument</strong> — Full Document Retrieval</summary>

Retrieve the full text of a legal document. Uses a dual strategy: first tries direct URL access, then falls back to the search API.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dokumentnummer` | string | No | RIS document number (e.g., "NOR40052761") — from search results |
| `url` | string | No | Direct URL to document content |
| `response_format` | string | No | "markdown" (default) or "json" |

**Note:** Long documents are truncated to 25,000 characters.

**Supported document types (prefix-based routing):**

| Prefix | Document Type |
|--------|---------------|
| NOR | Federal norms (Bundesnormen) |
| LBG, LKT, LNO, LOO, LSB, LST, LTI, LVB, LWI | State laws (9 provinces) |
| JWR, JFR, JWT | Administrative Court, Constitutional Court, Ordinary Court decisions |
| BVWG, LVWG, DSB, GBK, PVAK, ASYLGH | Other courts and commissions |
| BGBLA, BGBL | Federal Law Gazette |
| REGV | Government bills |
| BVB | District administration authorities |
| VBL | Ordinance gazettes |
| MRP, ERL | Cabinet protocols, ministerial decrees |

**Examples:**

```
dokumentnummer="NOR40052761"
dokumentnummer="JWR_2024100001"
url="https://www.ris.bka.gv.at/..."
```

</details>

<details>
<summary><strong>ris_bezirke</strong> — District Authority Announcements</summary>

Search announcements from district administrative authorities.

**Note:** Only the following provinces publish here: Niederoesterreich, Oberoesterreich, Tirol, Vorarlberg, Burgenland, Steiermark.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `bundesland` | string | No | Niederoesterreich, Oberoesterreich, Tirol, Vorarlberg, Burgenland, Steiermark |
| `bezirksverwaltungsbehoerde` | string | No | District authority (e.g., "Bezirkshauptmannschaft Innsbruck") |
| `kundmachungsnummer` | string | No | Announcement number |
| `kundmachungsdatum_von` | string | No | Announcement date from (YYYY-MM-DD) |
| `kundmachungsdatum_bis` | string | No | Announcement date to (YYYY-MM-DD) |
| `im_ris_seit` | string | No | Time filter: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Examples:**

```
bundesland="Niederoesterreich", suchworte="Bauordnung"
bezirksverwaltungsbehoerde="Bezirkshauptmannschaft Innsbruck"
bundesland="Tirol", im_ris_seit="EinemMonat"
```

</details>

<details>
<summary><strong>ris_gemeinden</strong> — Municipal Law</summary>

Search municipal law — local ordinances and regulations.

**General parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `bundesland` | string | No | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `gemeinde` | string | No | Municipality name (e.g., "Graz") |
| `applikation` | string | No | "Gr" (municipal law, default) or "GrA" (official gazettes) |
| `im_ris_seit` | string | No | Time filter: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `sortierung_richtung` | string | No | Ascending or Descending |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Gr-specific parameters (municipal law):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `geschaeftszahl` | string | File reference number |
| `index` | string | Subject area (see index values) |
| `fassung_vom` | string | Historical version (YYYY-MM-DD) |
| `sortierung_spalte_gr` | string | Geschaeftszahl, Bundesland, Gemeinde |

**GrA-specific parameters (official gazettes):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bezirk` | string | District name (e.g., "Bregenz") |
| `gemeindeverband` | string | Municipal association |
| `kundmachungsnummer` | string | Announcement number |
| `kundmachungsdatum_von` | string | Announcement date from (YYYY-MM-DD) |
| `kundmachungsdatum_bis` | string | Announcement date to (YYYY-MM-DD) |

**Index values (for Gr):**

- VertretungskoerperUndAllgemeineVerwaltung
- OeffentlicheOrdnungUndSicherheit
- UnterrichtErziehungSportUndWissenschaft
- KunstKulturUndKultus
- SozialeWohlfahrtUndWohnbaufoerderung
- Gesundheit
- StrassenUndWasserbauVerkehr
- Wirtschaftsfoerderung
- Dienstleistungen
- Finanzwirtschaft
- Undefined

**Examples:**

```
gemeinde="Graz", suchworte="Parkgebuehren"
bundesland="Tirol", titel="Gebuehrenordnung"
applikation="Gr", index="Gesundheit", bundesland="Wien"
applikation="GrA", bezirk="Bregenz", kundmachungsdatum_von="2024-01-01"
```

</details>

<details>
<summary><strong>ris_sonstige</strong> — Miscellaneous Collections</summary>

Search miscellaneous legal collections and specialized databases.

**General parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applikation` | string | Yes | Collection (see below) |
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `datum_von` | string | No | Date from (YYYY-MM-DD) — field name varies by collection |
| `datum_bis` | string | No | Date to (YYYY-MM-DD) |
| `im_ris_seit` | string | No | Time filter: EinerWoche, ZweiWochen, EinemMonat, DreiMonaten, SechsMonaten, EinemJahr |
| `sortierung_richtung` | string | No | Ascending or Descending |
| `geschaeftszahl` | string | No | File reference (Mrp, Upts, KmGer) |
| `norm` | string | No | Legal norm (Erlaesse, Upts) |
| `fassung_vom` | string | No | Historical version (Erlaesse) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Available collections (8):**

| Value | Description | Specific Parameters |
|-------|-------------|---------------------|
| `Mrp` | Cabinet protocols (Ministerratsprotokolle) | einbringer, sitzungsnummer, gesetzgebungsperiode |
| `Erlaesse` | Ministerial decrees | bundesministerium, abteilung, fundstelle |
| `Upts` | Party transparency | partei |
| `KmGer` | Court announcements | kmger_typ, gericht |
| `Avsv` | Social insurance | dokumentart, urheber, avsvnummer |
| `Avn` | Veterinary notices | avnnummer, avn_typ |
| `Spg` | Health structure plans | spgnummer, osg_typ, rsg_typ, rsg_land |
| `PruefGewO` | Trade licensing exams | pruefgewo_typ |

<details>
<summary>Collection-specific parameters</summary>

**Mrp parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `einbringer` | string | Ministry code (BKA, BMF, BMI, etc.) |
| `sitzungsnummer` | string | Session number |
| `gesetzgebungsperiode` | string | Legislative period (e.g., "27") |

**Erlaesse parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bundesministerium` | string | Federal ministry |
| `abteilung` | string | Department |
| `fundstelle` | string | Source reference |

**Upts parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `partei` | string | SPÖ, ÖVP, FPÖ, GRÜNE, NEOS, BZÖ |

**Avsv parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dokumentart` | string | Document type |
| `urheber` | string | ASVG, BSVG, GSVG, B-KUVG, FSVG, GehG |
| `avsvnummer` | string | AVSV number |

**Avn parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `avnnummer` | string | AVN number |
| `avn_typ` | string | Kundmachung, Verordnung, Erlass |

**Spg parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `spgnummer` | string | SPG number |
| `osg_typ` | string | ÖSG, ÖSG - Großgeräteplan |
| `rsg_typ` | string | RSG, RSG - Großgeräteplan |
| `rsg_land` | string | Province for RSG |

**PruefGewO parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pruefgewo_typ` | string | Befähigungsprüfung, Eignungsprüfung, Meisterprüfung |

**KmGer parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `kmger_typ` | string | Geschaeftsordnung, Geschaeftsverteilung |
| `gericht` | string | Court name |

</details>

**Examples:**

```
applikation="Mrp", suchworte="Budget"
applikation="Erlaesse", bundesministerium="BMF"
applikation="Upts", partei="SPÖ"
applikation="Avsv", urheber="ASVG"
```

</details>

<details>
<summary><strong>ris_history</strong> — Document Change History</summary>

Search the change history of legal documents. Track document creation, modification, and deletion.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applikation` | string | Yes | Application (30 options, see below) |
| `aenderungen_von` | string | No | Changes from date (YYYY-MM-DD) |
| `aenderungen_bis` | string | No | Changes to date (YYYY-MM-DD) |
| `include_deleted` | boolean | No | Include deleted documents (default: false) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Available applications (30):**

| Category | Applications |
|----------|-------------|
| Federal law | Bundesnormen, BgblAuth, BgblAlt, BgblPdf, RegV |
| State law | Landesnormen, LgblAuth, Lgbl, LgblNO, Vbl, Gemeinderecht, GemeinderechtAuth |
| Case law | Justiz, Vfgh, Vwgh, Bvwg, Lvwg, Dsk, Gbk, Pvak, AsylGH |
| Miscellaneous | Bvb, Mrp, Erlaesse, PruefGewO, Avsv, Spg, KmGer, Dok, Normenliste |

**Examples:**

```
applikation="Bundesnormen", aenderungen_von="2024-01-01", aenderungen_bis="2024-01-31"
applikation="Justiz", aenderungen_von="2024-06-01"
applikation="Vfgh", aenderungen_von="2024-01-01", include_deleted=true
```

</details>

<details>
<summary><strong>ris_verordnungen</strong> — State Ordinance Gazettes</summary>

Search state ordinance gazettes (Verordnungsblätter).

**Note:** Currently only data from **Tirol** is available (since January 1, 2022). Other provinces have not yet published their ordinance gazettes in RIS.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suchworte` | string | No | Full-text search |
| `titel` | string | No | Search in titles |
| `bundesland` | string | No | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `kundmachungsnummer` | string | No | Announcement number |
| `kundmachungsdatum_von` | string | No | Announcement date from (YYYY-MM-DD) |
| `kundmachungsdatum_bis` | string | No | Announcement date to (YYYY-MM-DD) |
| `seite` | number | No | Page number |
| `limit` | number | No | Results per page |
| `response_format` | string | No | "markdown" or "json" |

**Examples:**

```
bundesland="Tirol", suchworte="Parkordnung"
kundmachungsdatum_von="2024-01-01", bundesland="Tirol"
```

</details>

## Usage Examples

### Search tenancy law in the ABGB

```
ris_bundesrecht: titel="ABGB", suchworte="Mietrecht"
```

Finds all sections of the Austrian Civil Code (ABGB) related to tenancy law.

### Search Constitutional Court decisions on fundamental rights

```
ris_judikatur: gericht="Vfgh", suchworte="Grundrecht Meinungsfreiheit"
```

Searches Constitutional Court decisions on fundamental rights and freedom of expression.

### Find the Salzburg building code

```
ris_landesrecht: bundesland="Salzburg", titel="Bauordnung"
```

Finds the building code of the province of Salzburg.

### Look up a specific Federal Law Gazette

```
ris_bundesgesetzblatt: bgblnummer="120", jahrgang="2023", teil="1"
```

Finds a specific Federal Law Gazette by number, year, and part.

### Find a Supreme Court decision by case number

```
ris_judikatur: gericht="Justiz", geschaeftszahl="5Ob234/20b"
```

Finds a specific Supreme Court decision by its case number.

### Retrieve full document text

```
ris_dokument: dokumentnummer="NOR40052761"
```

Retrieves the full text of a document using its ID from a previous search.

## Development

### Prerequisites

- Node.js >= 18.0.0

### Setup

```bash
git clone https://github.com/philrox/ris-mcp-ts.git
cd ris-mcp-ts
npm install
npm run build
```

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with tsx (hot reload) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled version |
| `npm run check` | Typecheck + lint + format check + tests |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run inspect` | Launch MCP Inspector for testing |

### Project Structure

```
ris-mcp-ts/
├── src/
│   ├── index.ts       # Entry point (stdio transport)
│   ├── server.ts      # MCP Server with 12 tools
│   ├── client.ts      # HTTP client for RIS API
│   ├── parser.ts      # JSON parsing and response normalization
│   ├── types.ts       # Zod schemas + TypeScript types
│   ├── formatting.ts  # Output formatting (markdown/json)
│   └── __tests__/     # Test files
├── dist/              # Compiled JavaScript
├── docs/              # API documentation
├── package.json
├── tsconfig.json
└── README.md
```

### API Reference

This server uses the Austrian RIS Open Government Data API v2.6:

- Documentation: https://data.bka.gv.at/ris/api/v2.6/

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

[MIT](LICENSE)

---

This project uses the Open Government Data API provided by the Austrian Federal Chancellery (Bundeskanzleramt).
