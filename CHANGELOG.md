# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-01

### Added

- 12 MCP tools for querying the Austrian Legal Information System (RIS)
- Full-text search across federal laws (`ris_bundesrecht`), state laws (`ris_landesrecht`), and court decisions (`ris_judikatur`)
- Document retrieval with dual-strategy approach — direct URL fetch with automatic fallback (`ris_dokument`)
- Federal and state law gazette search (`ris_bundesgesetzblatt`, `ris_landesgesetzblatt`)
- Government bills search (`ris_regierungsvorlagen`)
- District authority decisions (`ris_bezirke`) and municipal law (`ris_gemeinden`)
- Miscellaneous collection search with 8 application types (`ris_sonstige`)
- Document change history across 30+ application types (`ris_history`)
- State ordinances search for Tirol (`ris_verordnungen`)
- Markdown and JSON response formats
- Configurable pagination (10, 20, 50, or 100 results per page)
- Comprehensive test suite with 524+ tests across 7 test files
- CI/CD pipeline with GitHub Actions (build, test, lint on Node 18/20/22)
- Security hardening with SSRF protection, input validation, and Zod schemas
- CodeQL scanning and Dependabot dependency updates
- Code quality tooling: Prettier, ESLint, Husky pre-commit hooks

[1.0.0]: https://github.com/philrox/ris-mcp-ts/releases/tag/v1.0.0
