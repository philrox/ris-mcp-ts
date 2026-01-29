# RIS MCP Server (TypeScript)

MCP Server for the Austrian Legal Information System (Rechtsinformationssystem - RIS).

This TypeScript implementation provides Model Context Protocol (MCP) tools for searching and retrieving Austrian legal documents including federal laws, state laws, and court decisions.

## Features

- **ris_bundesrecht** - Search Austrian federal laws (ABGB, StGB, UGB, etc.)
- **ris_landesrecht** - Search Austrian state/provincial laws
- **ris_judikatur** - Search Austrian court decisions (VfGH, VwGH, OGH, etc.)
- **ris_dokument** - Retrieve full text of legal documents

## Installation

```bash
npm install
npm run build
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### MCP Inspector

Test the server with the MCP Inspector:

```bash
npm run inspect
```

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ris-mcp": {
      "command": "node",
      "args": ["/path/to/ris-mcp-ts/dist/index.js"]
    }
  }
}
```

## Tools

### ris_bundesrecht

Search Austrian federal laws.

**Parameters:**
- `suchworte` - Full-text search terms (e.g., "Mietrecht", "Schadenersatz")
- `titel` - Search in law titles (e.g., "ABGB", "Strafgesetzbuch")
- `paragraph` - Search for specific section (e.g., "1319a", "25")
- `applikation` - Data source: "BrKons" (default), "Begut", "Erv"
- `fassung_vom` - Date for historical version (YYYY-MM-DD)
- `seite` - Page number (default: 1)
- `limit` - Results per page: 10, 20, 50, 100 (default: 20)
- `response_format` - "markdown" (default) or "json"

**Example:**
```
suchworte="Mietrecht"
titel="ABGB", paragraph="1319a"
```

### ris_landesrecht

Search Austrian state/provincial laws.

**Parameters:**
- `suchworte` - Full-text search terms
- `titel` - Search in law titles
- `bundesland` - Filter by state (Wien, Niederösterreich, Oberösterreich, Salzburg, Tirol, Vorarlberg, Kärnten, Steiermark, Burgenland)
- `applikation` - Data source: "LrKons" (default)
- `seite` - Page number
- `limit` - Results per page
- `response_format` - "markdown" or "json"

**Example:**
```
suchworte="Bauordnung", bundesland="Salzburg"
```

### ris_judikatur

Search Austrian court decisions.

**Parameters:**
- `suchworte` - Full-text search in decisions
- `gericht` - Court: "Justiz" (default, OGH/OLG/LG), "Vfgh", "Vwgh", "Bvwg", "Dsk"
- `norm` - Search by legal norm (e.g., "1319a ABGB")
- `geschaeftszahl` - Case number (e.g., "5Ob234/20b")
- `entscheidungsdatum_von` - Decision date from (YYYY-MM-DD)
- `entscheidungsdatum_bis` - Decision date to (YYYY-MM-DD)
- `seite` - Page number
- `limit` - Results per page
- `response_format` - "markdown" or "json"

**Example:**
```
gericht="Vfgh", suchworte="Grundrecht"
```

### ris_dokument

Retrieve full text of a legal document.

**Parameters:**
- `dokumentnummer` - RIS document number (e.g., "NOR40052761") from search results
- `url` - Direct URL to document content
- `response_format` - "markdown" (default) or "json"

**Example:**
```
dokumentnummer="NOR40052761"
```

## API Reference

This server uses the Austrian RIS API v2.6:
- Documentation: https://data.bka.gv.at/ris/api/v2.6/

## Project Structure

```
ris-mcp-ts/
├── src/
│   ├── index.ts          # Entry point (stdio transport)
│   ├── server.ts         # MCP Server with 4 tools
│   ├── client.ts         # HTTP client for RIS API
│   ├── parser.ts         # JSON parsing logic
│   ├── types.ts          # Zod schemas + TypeScript types
│   └── formatting.ts     # Output formatting
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK for server implementation
- `zod` - Schema validation
- `cheerio` - HTML parsing for document content

## License

MIT
