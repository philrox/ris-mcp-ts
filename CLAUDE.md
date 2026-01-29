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

Test files are located in `src/__tests__/`.

### Manual Testing with MCP Inspector

To test the server interactively:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or use the npm script:

```bash
npm run inspect
```

## Code Architecture

```
src/
├── index.ts       # Entry point (stdio transport)
├── server.ts      # MCP Server with 4 tools
├── client.ts      # HTTP client for RIS API
├── parser.ts      # JSON parsing logic
├── types.ts       # Zod schemas + TypeScript types
├── formatting.ts  # Output formatting (markdown/json)
└── __tests__/     # Test files
```

## MCP Tools

- **ris_bundesrecht** - Search Austrian federal laws
- **ris_landesrecht** - Search Austrian state/provincial laws
- **ris_judikatur** - Search Austrian court decisions
- **ris_dokument** - Retrieve full text of legal documents

## Documentation

API documentation is available in `docs/Dokumentation_OGD-RIS_API.pdf`.

RIS API v2.6: https://data.bka.gv.at/ris/api/v2.6/
