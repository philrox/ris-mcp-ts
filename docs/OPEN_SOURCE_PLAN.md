# Open Source Release Plan - RIS MCP Server

Plan zur Veröffentlichung des RIS MCP Servers als Open-Source-Projekt.

**Repo:** https://github.com/philrox/ris-mcp-ts
**Aktueller Stand:** 524 Tests (alle grün), 12 MCP Tools, ~3.300 LOC

---

## Phase 1: Code Quality & Tooling

### 1.1 Prettier einrichten

Aktuell: Nur ESLint, kein einheitlicher Code-Formatter.

- [x] `prettier` als devDependency installieren
- [x] `.prettierrc` erstellen (singleQuote, trailingComma, printWidth, etc.)
- [x] `.prettierignore` erstellen (dist/, node_modules/, docs/\*.pdf)
- [x] `eslint-config-prettier` installieren (deaktiviert ESLint-Regeln die mit Prettier konflikten)
- [x] ESLint Config um Prettier erweitern
- [x] npm Scripts ergänzen:
  - `"format": "prettier --write src/"`
  - `"format:check": "prettier --check src/"`
- [x] Einmalig `npm run format` ausführen um Codebase zu formatieren
- [x] `npm run check` erweitern: `typecheck && lint && format:check && test`

### 1.2 ESLint Konfiguration erweitern

Aktuell: Gute Basis mit `strict` + `stylistic`. Verbesserungen:

- [x] `eslint-plugin-import` oder `eslint-plugin-import-x` ergänzen (import-Reihenfolge)
- [x] Regel für konsistente Import-Sortierung aktivieren
- [x] Prüfen ob `@typescript-eslint/consistent-type-imports` aktiviert ist
- [x] Security-relevante Regeln prüfen (no-eval, no-implied-eval etc. - sollten durch `strict` schon aktiv sein)

### 1.3 EditorConfig

- [x] `.editorconfig` erstellen für konsistente Formatierung über Editoren hinweg:
  ```
  root = true
  [*]
  indent_style = space
  indent_size = 2
  end_of_line = lf
  charset = utf-8
  trim_trailing_whitespace = true
  insert_final_newline = true
  ```

### 1.4 Git Hooks mit lint-staged

- [x] `husky` + `lint-staged` installieren
- [x] Pre-commit Hook: `lint-staged` (Prettier + ESLint auf staged Files)
- [x] lint-staged Konfiguration in package.json:
  ```json
  "lint-staged": {
    "src/**/*.ts": ["prettier --write", "eslint --fix"]
  }
  ```

---

## Phase 2: Security Audit

### 2.1 Dependency Vulnerabilities beheben

Aktueller `npm audit` Output (6 Vulnerabilities):

| Package                            | Severity                           | Fix                                  |
| ---------------------------------- | ---------------------------------- | ------------------------------------ |
| `@modelcontextprotocol/sdk` 1.25.3 | **HIGH** - Cross-client data leak  | `npm audit fix` → 1.26.0             |
| `hono` (transitive)                | moderate - XSS, Cache, IP Spoofing | `npm audit fix`                      |
| `esbuild`/`vite`/`vitest` (dev)    | moderate - Dev server requests     | `npm audit fix --force` → vitest 4.x |

- [x] `npm audit fix` ausführen (SDK + hono Fixes, non-breaking)
- [x] `vitest` auf v4 updaten (breaking change, Tests ggf. anpassen)
- [x] `npm audit` danach nochmal prüfen → Ziel: 0 Vulnerabilities
- [x] Regelmäßiges Audit via GitHub Dependabot (siehe Phase 4)

### 2.2 Code Security Review

- [x] **Input Validation prüfen:** Alle 12 Tools nutzen Zod-Schemas → gut. Prüfen ob die Schemas streng genug sind (z.B. max-length auf Strings)
- [x] **URL-Validation in `ris_dokument`:** Prüfen dass nur URLs zu `data.bka.gv.at` und `www.ris.bka.gv.at` akzeptiert werden (SSRF-Schutz)
- [x] **Parameter Injection:** Prüfen ob User-Input korrekt URL-encoded wird bevor es an die RIS API geht
- [x] **Error Messages:** Sicherstellen dass keine internen Pfade oder sensiblen Infos in Fehlermeldungen leaken
- [x] **Cheerio (HTML Parsing):** Prüfen ob HTML-Content von der API sicher gehandhabt wird
- [x] **No Secrets:** Bestätigen dass keine API-Keys, Tokens oder Credentials im Code sind (ist eine öffentliche API, sollte clean sein)

### 2.3 SECURITY.md erstellen

- [x] `SECURITY.md` erstellen mit:
  - Responsible Disclosure Policy
  - Kontakt für Security Issues (E-Mail)
  - Supported Versions
  - Scope (was zählt als Security Issue)

---

## Phase 3: Testing verbessern

### 3.1 Test Coverage messen

- [x] `@vitest/coverage-v8` installieren
- [x] Coverage Script ergänzen: `"test:coverage": "vitest run --coverage"`
- [x] Vitest Config um Coverage-Konfiguration erweitern
- [x] Coverage Thresholds setzen (Ziel: >80% Statements)
- [x] Coverage Report im CI generieren

### 3.2 Integration Tests

Aktuell: Alle Tests nutzen Mocks. Ergänzen:

- [x] Integration Test Suite erstellen (`src/__tests__/integration/`)
- [x] Smoke Tests gegen die echte RIS API (opt-in, nicht im Standard-Testlauf):
  - `ris_bundesrecht` mit `titel="ABGB"` → bekommt Ergebnisse
  - `ris_judikatur` mit `gericht="Justiz"` → bekommt Ergebnisse
  - `ris_dokument` mit bekannter `dokumentnummer` → bekommt Volltext
- [x] npm Script: `"test:integration": "vitest run --config vitest.integration.config.ts"`
- [x] Diese Tests nur in CI als separater Job (nicht bei jedem Push)

### 3.3 Edge Case Tests

- [x] Leere API-Responses (0 Ergebnisse)
- [x] Extrem lange Dokumente (>25.000 Zeichen Truncation)
- [x] Ungültige/malformatierte API-Responses
- [x] Rate Limiting / 429 Responses
- [x] Timeout-Szenarien
- [x] Nicht-existente Dokumentnummern

---

## Phase 4: CI/CD Pipeline (GitHub Actions)

### 4.1 CI Workflow

- [x] `.github/workflows/ci.yml` erstellen:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    check:
      runs-on: ubuntu-latest
      strategy:
        matrix:
          node-version: [18, 20, 22]
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: npm ci
        - run: npm run check # typecheck + lint + format:check + test
        - run: npm run test:coverage
  ```

### 4.2 Weitere CI Features

- [x] **Dependabot** konfigurieren (`.github/dependabot.yml`) für automatische Security Updates
- [x] **CodeQL Analysis** — `.github/workflows/codeql.yml` (weekly cron + push/PR to main, security-extended queries)
- [x] **npm publish Workflow** — `.github/workflows/release.yml` (auf Tag Push `v*`)
- [x] **Badge** in README für CI Status

### 4.3 Release Workflow

- [x] GitHub Release Workflow (auf Tags):
  - Build
  - Tests (`npm run check`)
  - npm publish (mit `NPM_TOKEN` Secret)
  - GitHub Release erstellen (auto-generated release notes)
- [x] Semantic Versioning Strategie festgelegt:
  - **MAJOR** (x.0.0): Breaking changes to tool schemas or behavior
  - **MINOR** (0.x.0): New tools, new parameters, new features
  - **PATCH** (0.0.x): Bug fixes, documentation updates

---

## Phase 5: Projekt-Dokumentation

### 5.1 README.md komplett überarbeiten

Die README ist aktuell auf Deutsch und sehr ausführlich. Für Open Source:

- [ ] **Sprache:** Auf Englisch umschreiben (internationale Zielgruppe)
- [ ] **Struktur:**
  - Kurze Beschreibung + Badges (CI, npm, License, Node Version)
  - Features auf einen Blick (12 Tools, was sie können)
  - Quick Install (`npx ris-mcp-ts` oder `npm install -g ris-mcp-ts`)
  - Configuration für Claude Desktop / Claude Code / andere MCP Clients
  - Tool-Übersicht (kompakte Tabelle, Details in separater Docs-Page)
  - Contributing Link
  - License
- [ ] Detaillierte Tool-Referenz nach `docs/TOOLS.md` oder in die README als klappbare Sections (`<details>`)
- [ ] Screenshots oder GIFs der Nutzung (optional aber empfehlenswert)

### 5.2 LICENSE Datei

- [ ] `LICENSE` Datei erstellen (MIT - steht schon in package.json)
- [ ] Vollständiger MIT-Lizenztext mit Copyright-Hinweis

### 5.3 CONTRIBUTING.md

- [ ] Erstellen mit:
  - Wie man das Projekt lokal einrichtet
  - Code Style (Prettier + ESLint)
  - Branch-Strategie
  - Wie man Tests schreibt
  - PR-Prozess
  - Issue Templates

### 5.4 CHANGELOG.md

- [ ] Erstellen mit initialem Release (v1.0.0)
- [ ] Keep a Changelog Format verwenden (https://keepachangelog.com)
- [ ] Ggf. `conventional-commits` + Tooling für automatische Changelog-Generierung

### 5.5 .gitignore anpassen

Aktuell ignoriert `docs/` → das muss weg, docs sollen im Repo sein:

- [ ] `docs/` aus `.gitignore` entfernen
- [ ] Stattdessen nur `docs/*.pdf` ignorieren (oder PDFs ins Repo aufnehmen)
- [ ] Prüfen ob `docs/Dokumentation_OGD-RIS_API.pdf` ins Repo gehört oder zu groß ist

### 5.6 GitHub Repository Setup

- [ ] **Description:** "MCP Server for the Austrian Legal Information System (RIS) - Access Austrian federal laws, state laws, court decisions and more"
- [ ] **Topics:** `mcp`, `model-context-protocol`, `austria`, `legal`, `ris`, `law`, `typescript`, `claude`
- [ ] **Issue Templates** erstellen (Bug Report, Feature Request)
- [ ] **PR Template** erstellen
- [ ] **Branch Protection** für `main` (require PR, require CI pass)

---

## Phase 6: npm Package vorbereiten

### 6.1 package.json erweitern

- [ ] `files` Feld hinzufügen (nur dist/ + README + LICENSE publizieren):
  ```json
  "files": ["dist/", "README.md", "LICENSE"]
  ```
- [ ] `repository` Feld hinzufügen:
  ```json
  "repository": {
    "type": "git",
    "url": "https://github.com/philrox/ris-mcp-ts.git"
  }
  ```
- [ ] `homepage` und `bugs` Felder ergänzen
- [ ] `prepublishOnly` Script: `"prepublishOnly": "npm run check && npm run build"`
- [ ] Prüfen ob `bin` Feld korrekt ist (Shebang in index.ts? `#!/usr/bin/env node`)

### 6.2 Shebang & Entry Point

- [ ] Prüfen ob `src/index.ts` / `dist/index.js` ein Shebang hat (`#!/usr/bin/env node`)
- [ ] Wenn nicht, hinzufügen damit `npx ris-mcp-ts` funktioniert
- [ ] Testen: `npm pack` + lokale Installation prüfen

### 6.3 npm Publish

- [ ] npm Account bereit (npmjs.com)
- [ ] `npm publish --dry-run` testen
- [ ] Prüfen was im Package landet (keine Tests, keine Source)
- [ ] Erstveröffentlichung: `npm publish`

---

## Phase 7: Code Refactoring (optional aber empfohlen)

### 7.1 server.ts aufbrechen

`server.ts` hat 1.735 Zeilen - für Open Source Contributor schwer zu navigieren:

- [ ] Tool-Handler in separate Dateien extrahieren:
  ```
  src/
  ├── tools/
  │   ├── bundesrecht.ts
  │   ├── landesrecht.ts
  │   ├── judikatur.ts
  │   ├── dokument.ts
  │   ├── ...
  │   └── index.ts         # Re-exports
  ├── server.ts             # Nur noch Server-Setup + Tool-Registration
  ```
- [ ] Oder zumindest: Helper Functions in eigene Datei (`src/helpers.ts`)
- [ ] Bewertung: Macht den Code zugänglicher, aber erfordert mehr Aufwand

### 7.2 Dependencies aktualisieren

Aktuell veraltete Packages:

| Package                     | Current | Latest | Breaking? |
| --------------------------- | ------- | ------ | --------- |
| `@modelcontextprotocol/sdk` | 1.25.3  | 1.26.0 | Nein      |
| `vitest`                    | 1.6.1   | 4.0.18 | **Ja**    |
| `zod`                       | 3.25.76 | 4.3.6  | **Ja**    |
| `@types/node`               | 20.x    | 25.x   | Minor     |
| `eslint`                    | 9.x     | 10.x   | **Ja**    |

- [ ] SDK + Hono zuerst (non-breaking `npm audit fix`)
- [ ] Vitest 4.x Update (Test-Syntax prüfen)
- [ ] Zod 4 evaluieren (größeres Refactoring, kann auch nach Release)
- [ ] ESLint 10 evaluieren (Config-Format ggf. anpassen)

---

## Phase 8: Community & Discoverability

### 8.1 MCP Server Registries

- [ ] Bei [Smithery](https://smithery.ai) registrieren (MCP Server Registry)
- [ ] In der offiziellen [MCP Server Liste](https://github.com/modelcontextprotocol/servers) einen PR erstellen
- [ ] In [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) listen lassen

### 8.2 Docker Support (optional)

- [ ] `Dockerfile` erstellen
- [ ] Docker-Anleitung in README
- [ ] Ermöglicht einfaches Deployment ohne Node.js Installation

### 8.3 Announcements

- [ ] Blog Post / Social Media Ankündigung
- [ ] In relevanten Communities posten (Reddit r/austria, dev.to, etc.)
- [ ] Ggf. Demo-Video erstellen

---

## Prioritäts-Reihenfolge

Empfohlene Reihenfolge für die Umsetzung:

| Prio | Phase         | Begründung                                    |
| ---- | ------------- | --------------------------------------------- |
| 1    | Phase 2.1     | Security Fixes zuerst (npm audit fix)         |
| 2    | Phase 1.1-1.3 | Prettier + EditorConfig = Grundlage für alles |
| 3    | Phase 5.5     | .gitignore fixen (docs/ freigeben)            |
| 4    | Phase 5.1-5.2 | README + LICENSE = Minimum für Open Source    |
| 5    | Phase 4.1     | CI Pipeline = Qualitätssicherung              |
| 6    | Phase 6       | npm Package = Distribution                    |
| 7    | Phase 5.3-5.6 | Restliche Docs + GitHub Setup                 |
| 8    | Phase 3       | Coverage + Integration Tests                  |
| 9    | Phase 1.4     | Git Hooks (nice to have)                      |
| 10   | Phase 7       | Refactoring (nach initialem Release)          |
| 11   | Phase 8       | Community + Registries                        |

---

## Checkliste: Minimum Viable Open Source

Absolute Minimum-Anforderungen bevor der erste Public Release:

- [x] 0 npm audit Vulnerabilities
- [ ] LICENSE Datei (MIT)
- [ ] README.md auf Englisch mit Install-Anleitung
- [x] CI Pipeline (GitHub Actions)
- [x] Prettier + ESLint funktionieren und formatieren den Code
- [x] `npm run check` läuft fehlerfrei durch
- [ ] `npm publish` funktioniert
- [x] Alle 1070 Tests grün
