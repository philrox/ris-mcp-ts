# RIS MCP Server

MCP Server fuer das oesterreichische Rechtsinformationssystem (RIS).

Das RIS ist die offizielle Rechtsdatenbank der Republik Oesterreich und enthaelt Bundesgesetze, Landesgesetze, Gerichtsentscheidungen und weitere Rechtsquellen. Dieser MCP Server ermoeglicht den Zugriff auf diese Daten ueber das Model Context Protocol.

## Funktionsuebersicht

| Tool | Beschreibung |
|------|--------------|
| `ris_bundesrecht` | Bundesgesetze (ABGB, StGB, UGB, etc.) |
| `ris_landesrecht` | Landesgesetze der 9 Bundeslaender |
| `ris_judikatur` | Gerichtsentscheidungen (11 Gerichtstypen) |
| `ris_bundesgesetzblatt` | Bundesgesetzblatt I/II/III |
| `ris_landesgesetzblatt` | Landesgesetzblatt |
| `ris_regierungsvorlagen` | Parlamentarische Regierungsvorlagen |
| `ris_dokument` | Volltext eines Dokuments abrufen |
| `ris_bezirke` | Bezirksverwaltungsbehoerden |
| `ris_gemeinden` | Gemeinderecht |
| `ris_sonstige` | Sonstige Sammlungen (Erlaesse, Protokolle, etc.) |
| `ris_history` | Aenderungshistorie von Dokumenten |
| `ris_verordnungen` | Verordnungsblaetter der Laender |

## Installation

### Voraussetzungen

- Node.js >= 18.0.0

### Setup

```bash
npm install
npm run build
```

## Claude Desktop Konfiguration

Fuege folgende Konfiguration zu deiner Claude Desktop Konfigurationsdatei hinzu:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ris-mcp": {
      "command": "node",
      "args": ["/absoluter/pfad/zu/ris-mcp-ts/dist/index.js"]
    }
  }
}
```

## Werkzeug-Referenz

### ris_bundesrecht

Durchsucht oesterreichische Bundesgesetze wie ABGB, StGB, UGB und weitere.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche (z.B. "Mietrecht", "Schadenersatz") |
| `titel` | string | Nein | Suche in Gesetzesnamen (z.B. "ABGB", "Strafgesetzbuch") |
| `paragraph` | string | Nein | Paragraphennummer (z.B. "1295" fuer §1295) |
| `applikation` | string | Nein | Datenquelle: "BrKons" (konsolidiert, Standard), "Begut" (Begutachtungsentwuerfe), "Erv" (englische Version) |
| `fassung_vom` | string | Nein | Datum fuer historische Fassung (YYYY-MM-DD) |
| `seite` | number | Nein | Seitennummer (Standard: 1) |
| `limit` | number | Nein | Ergebnisse pro Seite: 10, 20, 50, 100 (Standard: 20) |
| `response_format` | string | Nein | "markdown" (Standard) oder "json" |

**Beispiele:**

```
suchworte="Mietrecht"
titel="ABGB", paragraph="1319a"
titel="StGB", suchworte="Koerperverletzung"
```

---

### ris_landesrecht

Durchsucht Landesgesetze der neun oesterreichischen Bundeslaender.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Gesetzesnamen |
| `bundesland` | string | Nein | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `applikation` | string | Nein | "LrKons" (konsolidiert, Standard) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
suchworte="Bauordnung", bundesland="Salzburg"
bundesland="Wien", titel="Bauordnung"
```

---

### ris_judikatur

Durchsucht Gerichtsentscheidungen oesterreichischer Gerichte.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche in Entscheidungen |
| `gericht` | string | Nein | Gerichtstyp (siehe unten) |
| `norm` | string | Nein | Rechtsnorm (z.B. "1319a ABGB") |
| `geschaeftszahl` | string | Nein | Geschaeftszahl (z.B. "5Ob234/20b") |
| `entscheidungsdatum_von` | string | Nein | Entscheidungsdatum ab (YYYY-MM-DD) |
| `entscheidungsdatum_bis` | string | Nein | Entscheidungsdatum bis (YYYY-MM-DD) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Verfuegbare Gerichte:**

| Wert | Gericht |
|------|---------|
| `Justiz` | OGH, OLG, LG (Standard) |
| `Vfgh` | Verfassungsgerichtshof |
| `Vwgh` | Verwaltungsgerichtshof |
| `Bvwg` | Bundesverwaltungsgericht |
| `Lvwg` | Landesverwaltungsgerichte |
| `Dsk` | Datenschutzbehoerde |
| `AsylGH` | Asylgerichtshof (historisch) |
| `Normenliste` | Normenliste |
| `Pvak` | Personalvertretungsaufsichtskommission |
| `Gbk` | Gleichbehandlungskommission |
| `Dok` | Disziplinarkommission |

**Beispiele:**

```
gericht="Vfgh", suchworte="Grundrecht"
gericht="Justiz", geschaeftszahl="5Ob234/20b"
norm="823 ABGB", gericht="Justiz"
```

---

### ris_bundesgesetzblatt

Durchsucht das Bundesgesetzblatt (BGBl) - offizielle Publikationen von Bundesgesetzen.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `bgblnummer` | string | Nein | Gesetzblatt-Nummer (z.B. "120") |
| `teil` | string | Nein | "1" (I=Gesetze), "2" (II=Verordnungen), "3" (III=Staatsvertraege) |
| `jahrgang` | string | Nein | Jahr (z.B. "2023") |
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `applikation` | string | Nein | "BgblAuth" (authentisch ab 2004, Standard), "BgblPdf" (PDF), "BgblAlt" (1945-2003) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
bgblnummer="120", jahrgang="2023", teil="1"
suchworte="Klimaschutz", jahrgang="2024"
```

---

### ris_landesgesetzblatt

Durchsucht Landesgesetzblaetter (LGBl) - offizielle Publikationen der Landesgesetze.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `lgblnummer` | string | Nein | Gesetzblatt-Nummer (z.B. "50") |
| `jahrgang` | string | Nein | Jahr (z.B. "2023") |
| `bundesland` | string | Nein | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `applikation` | string | Nein | "LgblAuth" (authentisch, Standard), "Lgbl" (allgemein), "LgblNO" (Niederoesterreich) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
lgblnummer="50", jahrgang="2023", bundesland="Wien"
suchworte="Bauordnung", bundesland="Salzburg"
```

---

### ris_regierungsvorlagen

Durchsucht Regierungsvorlagen - Gesetzesentwuerfe der Bundesregierung an das Parlament.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `nummer` | string | Nein | Vorlagen-Nummer (z.B. "123") |
| `gesetzgebungsperiode` | string | Nein | Gesetzgebungsperiode (z.B. "27" fuer XXVII. GP) |
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
nummer="123", gesetzgebungsperiode="27"
suchworte="Klimaschutz"
```

---

### ris_dokument

Ruft den Volltext eines Rechtsdokuments ab.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `dokumentnummer` | string | Nein | RIS Dokumentnummer (z.B. "NOR40052761") - aus Suchergebnissen |
| `url` | string | Nein | Direkte URL zum Dokumentinhalt |
| `response_format` | string | Nein | "markdown" (Standard) oder "json" |

**Hinweis:** Bei langen Dokumenten wird der Inhalt moeglicherweise gekuerzt. Verwende spezifische Suchen, um den Umfang einzugrenzen.

**Beispiele:**

```
dokumentnummer="NOR40052761"
url="https://www.ris.bka.gv.at/..."
```

---

### ris_bezirke

Durchsucht Entscheidungen der Bezirksverwaltungsbehoerden.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche |
| `bundesland` | string | Nein | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `bezirk` | string | Nein | Bezirksname (z.B. "Innsbruck") |
| `geschaeftszahl` | string | Nein | Geschaeftszahl |
| `entscheidungsdatum_von` | string | Nein | Entscheidungsdatum ab (YYYY-MM-DD) |
| `entscheidungsdatum_bis` | string | Nein | Entscheidungsdatum bis (YYYY-MM-DD) |
| `norm` | string | Nein | Rechtsnorm (z.B. "Bauordnung") |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
bundesland="Wien", suchworte="Baubewilligung"
bezirk="Innsbruck", geschaeftszahl="12345/2023"
```

---

### ris_gemeinden

Durchsucht Gemeinderecht - kommunale Verordnungen und Vorschriften.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `bundesland` | string | Nein | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `gemeinde` | string | Nein | Gemeindename (z.B. "Graz") |
| `applikation` | string | Nein | "Gr" (Gemeinderecht, Standard) oder "GrA" (grenzueberschreitend) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
gemeinde="Graz", suchworte="Parkgebuehren"
bundesland="Tirol", titel="Gebuehrenordnung"
```

---

### ris_sonstige

Durchsucht sonstige Rechtssammlungen und historische Materialien.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `applikation` | string | Ja | Sammlung (siehe unten) |
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `datum_von` | string | Nein | Datum ab (YYYY-MM-DD) |
| `datum_bis` | string | Nein | Datum bis (YYYY-MM-DD) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Verfuegbare Sammlungen:**

| Wert | Beschreibung |
|------|--------------|
| `PruefGewO` | Gewerberechtliche Pruefungen |
| `Avsv` | Amtliche Veterinaerkundmachungen |
| `Spg` | Sicherheitspolizeigesetz-Richtlinien |
| `KmGer` | Kriegsministerium (historisch) |
| `Mrp` | Ministerratsprotokolle |
| `Erlaesse` | Ministerialerlaesse |

**Beispiele:**

```
applikation="Mrp", suchworte="Budget"
applikation="Erlaesse", titel="Finanzministerium"
```

---

### ris_history

Durchsucht die Aenderungshistorie von Rechtsdokumenten.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `applikation` | string | Ja | Anwendung (z.B. "Bundesnormen", "Landesnormen", "Justiz", "Vfgh", "Vwgh") |
| `aenderungen_von` | string | Nein | Aenderungen ab Datum (YYYY-MM-DD) |
| `aenderungen_bis` | string | Nein | Aenderungen bis Datum (YYYY-MM-DD) |
| `include_deleted` | boolean | Nein | Geloeschte Dokumente einbeziehen (Standard: false) |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
applikation="Bundesnormen", aenderungen_von="2024-01-01", aenderungen_bis="2024-01-31"
applikation="Justiz", aenderungen_von="2024-06-01"
```

---

### ris_verordnungen

Durchsucht Verordnungsblaetter der Laender.

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `suchworte` | string | Nein | Volltextsuche |
| `titel` | string | Nein | Suche in Titeln |
| `bundesland` | string | Nein | Wien, Niederoesterreich, Oberoesterreich, Salzburg, Tirol, Vorarlberg, Kaernten, Steiermark, Burgenland |
| `vblnummer` | string | Nein | Verordnungsblatt-Nummer (z.B. "25") |
| `jahrgang` | string | Nein | Jahr (z.B. "2023") |
| `seite` | number | Nein | Seitennummer |
| `limit` | number | Nein | Ergebnisse pro Seite |
| `response_format` | string | Nein | "markdown" oder "json" |

**Beispiele:**

```
bundesland="Tirol", suchworte="Parkordnung"
vblnummer="25", jahrgang="2023", bundesland="Wien"
```

## Anwendungsbeispiele

### Mietrecht im ABGB recherchieren

```
ris_bundesrecht: titel="ABGB", suchworte="Mietrecht"
```

Findet alle Paragraphen des ABGB, die sich mit Mietrecht befassen.

### VfGH-Entscheidung zu Grundrechten suchen

```
ris_judikatur: gericht="Vfgh", suchworte="Grundrecht Meinungsfreiheit"
```

Durchsucht Entscheidungen des Verfassungsgerichtshofs zu Grundrechten.

### Salzburger Bauordnung finden

```
ris_landesrecht: bundesland="Salzburg", titel="Bauordnung"
```

Findet die Bauordnung des Landes Salzburg.

### BGBl nach Nummer und Jahr

```
ris_bundesgesetzblatt: bgblnummer="120", jahrgang="2023", teil="1"
```

Findet ein spezifisches Bundesgesetzblatt.

### OGH-Entscheidung nach Geschaeftszahl

```
ris_judikatur: gericht="Justiz", geschaeftszahl="5Ob234/20b"
```

Findet eine spezifische OGH-Entscheidung anhand der Geschaeftszahl.

### Volltext eines Dokuments abrufen

```
ris_dokument: dokumentnummer="NOR40052761"
```

Ruft den vollstaendigen Text eines Dokuments ab, dessen Nummer aus einer vorherigen Suche stammt.

## Entwicklung

### NPM Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet Server mit tsx (Hot Reload) |
| `npm run build` | Kompiliert TypeScript |
| `npm start` | Startet kompilierte Version |
| `npm run check` | Typecheck + Lint + Tests |
| `npm test` | Fuehrt alle Tests aus |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run inspect` | MCP Inspector zum Testen |

### Projektstruktur

```
ris-mcp-ts/
├── src/
│   ├── index.ts       # Einstiegspunkt (stdio Transport)
│   ├── server.ts      # MCP Server mit 12 Tools
│   ├── client.ts      # HTTP Client fuer RIS API
│   ├── parser.ts      # JSON Parsing
│   ├── types.ts       # Zod Schemas + TypeScript Typen
│   ├── formatting.ts  # Ausgabeformatierung
│   └── __tests__/     # Tests
├── dist/              # Kompiliertes JavaScript
├── docs/              # API Dokumentation
├── package.json
├── tsconfig.json
└── README.md
```

### API Referenz

Dieser Server verwendet die oesterreichische RIS API v2.6:

- Dokumentation: https://data.bka.gv.at/ris/api/v2.6/

## Lizenz

MIT

Dieses Projekt nutzt die Open Government Data API des oesterreichischen Bundeskanzleramts.
