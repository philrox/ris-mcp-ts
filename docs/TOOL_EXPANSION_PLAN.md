# RIS-MCP Server - Tool Expansion Plan

Basierend auf der Analyse der OGD-RIS API v2.6 Dokumentation.

## Aktueller Stand

| #   | Tool                     | Endpoint     | Applikationen                       | Status           |
| --- | ------------------------ | ------------ | ----------------------------------- | ---------------- |
| 1   | `ris_bundesrecht`        | /Bundesrecht | BrKons, Begut, Erv                  | ✅ Implementiert |
| 2   | `ris_landesrecht`        | /Landesrecht | LrKons                              | ✅ Implementiert |
| 3   | `ris_judikatur`          | /Judikatur   | Justiz, Vfgh, Vwgh, Bvwg, Lvwg, Dsk, AsylGH, Normenliste, Pvak, Gbk, Dok | ✅ Implementiert |
| 4   | `ris_bundesgesetzblatt`  | /Bundesrecht | BgblAuth, BgblPdf, BgblAlt          | ✅ Implementiert |
| 5   | `ris_landesgesetzblatt`  | /Landesrecht | LgblAuth, Lgbl, LgblNO              | ✅ Implementiert |
| 6   | `ris_regierungsvorlagen` | /Bundesrecht | RegV                                | ✅ Implementiert |
| 7   | `ris_dokument`           | -            | Direktabruf via URL                 | ✅ Implementiert |
| 8   | `ris_bezirke`            | /Bezirke     | Bvb                                 | ✅ Implementiert |
| 9   | `ris_gemeinden`          | /Gemeinden   | Gr, GrA                             | ✅ Implementiert |
| 10  | `ris_sonstige`           | /Sonstige    | PruefGewO, Avsv, Spg, KmGer, Mrp, Erlaesse | ✅ Implementiert |
| 11  | `ris_history`            | /History     | Alle Anwendungen                           | ✅ Implementiert |
| 12  | `ris_verordnungen`       | /Landesrecht | Vbl                                        | ✅ Implementiert |

---

## Geplante Erweiterungen

### Priorität 1: Hohe Relevanz für juristische Recherche

#### 1.1 `ris_bundesgesetzblatt`

**Endpoint:** `/Bundesrecht`

**Beschreibung:** Zugriff auf nicht-konsolidierte Bundesgesetzblätter - essentiell für historische Recherche und Nachvollziehbarkeit von Gesetzesänderungen.

| Applikation | Beschreibung               | Parameter                  |
| ----------- | -------------------------- | -------------------------- |
| BgblAuth    | BGBl authentisch (ab 2004) | Bgblnummer, Teil, Jahrgang |
| BgblPdf     | BGBl als PDF               | Bgblnummer, Teil, Jahrgang |
| BgblAlt     | BGBl 1945-2003             | Bgblnummer, Teil, Jahrgang |

**Beispiel-Parameter:**

```typescript
{
  applikation: "BgblAuth" | "BgblPdf" | "BgblAlt",
  bgblnummer: string,        // z.B. "120"
  teil: "1" | "2" | "3",     // I, II, III
  jahrgang: string,          // z.B. "2023"
  suchworte: string,
  titel: string
}
```

**Aufwand:** Mittel
**Nutzen:** Hoch

---

#### 1.2 `ris_landesgesetzblatt`

**Endpoint:** `/Landesrecht`

**Beschreibung:** Landesgesetzblätter aller 9 Bundesländer - wichtig für landesrechtliche Recherche.

| Applikation | Beschreibung                         | Parameter                        |
| ----------- | ------------------------------------ | -------------------------------- |
| LgblAuth    | LGBl authentisch                     | Bundesland, Lgblnummer, Jahrgang |
| Lgbl        | LGBl allgemein                       | Bundesland, Lgblnummer, Jahrgang |
| LgblNO      | LGBl Niederösterreich (Sonderformat) | Lgblnummer, Jahrgang             |

**Beispiel-Parameter:**

```typescript
{
  applikation: "LgblAuth" | "Lgbl" | "LgblNO",
  bundesland: "Burgenland" | "Kaernten" | "Niederoesterreich" |
              "Oberoesterreich" | "Salzburg" | "Steiermark" |
              "Tirol" | "Vorarlberg" | "Wien",
  lgblnummer: string,
  jahrgang: string,
  suchworte: string
}
```

**Aufwand:** Mittel
**Nutzen:** Hoch

---

#### 1.3 `ris_regierungsvorlagen`

**Endpoint:** `/Bundesrecht`

**Beschreibung:** Regierungsvorlagen - wichtig für Gesetzgebungshistorie und parlamentarische Materialien.

| Applikation | Beschreibung       |
| ----------- | ------------------ |
| RegV        | Regierungsvorlagen |

**Beispiel-Parameter:**

```typescript
{
  nummer: string,           // Vorlagennummer
  gesetzgebungsperiode: string,
  suchworte: string,
  titel: string
}
```

**Aufwand:** Gering
**Nutzen:** Mittel-Hoch

---

### Priorität 2: Erweiterte Judikatur

#### 2.1 `ris_judikatur_erweitert`

**Endpoint:** `/Judikatur`

**Beschreibung:** Zusätzliche spezialisierte Rechtsprechungs-Sammlungen, die im aktuellen `ris_judikatur` Tool fehlen.

| Applikation | Beschreibung                   | Besonderheit          |
| ----------- | ------------------------------ | --------------------- |
| AsylGH      | Asylgerichtshof                | Historisch (bis 2013) |
| Normenliste | Normenlisten der Gerichte      | Normenprüfung         |
| Pvak        | Personalvertretungsaufsichtsk. | Arbeitsrecht          |
| Gbk         | Gleichbehandlungskommission    | Diskriminierung       |
| Dok         | Disziplinarkommission          | Beamtenrecht          |

**Implementierungsoptionen:**

1. Bestehenden `ris_judikatur` erweitern (bevorzugt)
2. Separates Tool für Spezialgerichte

**Aufwand:** Gering (Erweiterung) / Mittel (neues Tool)
**Nutzen:** Mittel

---

### Priorität 3: Verwaltungsebenen

#### 3.1 `ris_bezirke`

**Endpoint:** `/Bezirke`

**Beschreibung:** Entscheidungen der Bezirksverwaltungsbehörden.

| Applikation | Beschreibung               |
| ----------- | -------------------------- |
| Bvb         | Bezirksverwaltungsbehörden |

**Beispiel-Parameter:**

```typescript
{
  bundesland: string,
  bezirk: string,
  geschaeftszahl: string,
  entscheidungsdatum: string,
  suchworte: string,
  norm: string
}
```

**Aufwand:** Mittel
**Nutzen:** Mittel

---

#### 3.2 `ris_gemeinden`

**Endpoint:** `/Gemeinden`

**Beschreibung:** Gemeinderecht und kommunale Vorschriften.

| Applikation | Beschreibung                                |
| ----------- | ------------------------------------------- |
| Gr          | Gemeinderecht                               |
| GrA         | Gemeinderecht Ausland (grenzüberschreitend) |

**Beispiel-Parameter:**

```typescript
{
  applikation: "Gr" | "GrA",
  bundesland: string,
  gemeinde: string,
  suchworte: string,
  titel: string
}
```

**Aufwand:** Mittel
**Nutzen:** Mittel

---

### Priorität 4: Spezialsammlungen

#### 4.1 `ris_sonstige`

**Endpoint:** `/Sonstige`

**Beschreibung:** Diverse spezielle Rechtsquellen und historische Dokumente.

| Applikation | Beschreibung                         | Zielgruppe          |
| ----------- | ------------------------------------ | ------------------- |
| PruefGewO   | Prüfungen Gewerbeordnung             | Gewerbetreibende    |
| Avsv        | Amtliche Veterinärnachrichten        | Tierärzte           |
| Spg         | Sicherheitspolizeigesetz Richtlinien | Polizei, Anwälte    |
| KmGer       | Kriegsministerium (historisch)       | Historiker          |
| Mrp         | Ministerratsprotokolle               | Politikwissenschaft |
| Erlaesse    | Erlässe der Ministerien              | Verwaltung          |

**Beispiel-Parameter:**

```typescript
{
  applikation: "PruefGewO" | "Avsv" | "Spg" | "KmGer" | "Mrp" | "Erlaesse",
  suchworte: string,
  titel: string,
  datum_von: string,
  datum_bis: string
}
```

**Aufwand:** Mittel
**Nutzen:** Gering-Mittel (spezialisiert)

---

### Priorität 5: Infrastruktur-Features

#### 5.1 `ris_history`

**Endpoint:** `/History`

**Beschreibung:** Änderungshistorie für alle Dokumente - ermöglicht Tracking von Änderungen über Zeit.

**Beispiel-Parameter:**

```typescript
{
  applikation: string,       // z.B. "BrKons"
  dokumentnummer: string,
  von_datum: string,
  bis_datum: string
}
```

**Aufwand:** Mittel
**Nutzen:** Mittel (für Power-User)

---

#### 5.2 `ris_verordnungen`

**Endpoint:** `/Landesrecht` und `/Bundesrecht`

**Beschreibung:** Dediziertes Tool für Verordnungsblätter.

| Applikation  | Beschreibung                |
| ------------ | --------------------------- |
| Vbl          | Verordnungsblätter (Länder) |
| Bgbl Teil II | Verordnungen (Bund)         |

**Aufwand:** Gering
**Nutzen:** Mittel

---

## Implementierungsplan

### Phase 1: Kern-Erweiterungen ✅ ABGESCHLOSSEN

| #   | Tool                     | Aufwand | Geschätzter Nutzen | Status           |
| --- | ------------------------ | ------- | ------------------ | ---------------- |
| 1.1 | `ris_bundesgesetzblatt`  | Mittel  | ⭐⭐⭐⭐⭐         | ✅ Implementiert |
| 1.2 | `ris_landesgesetzblatt`  | Mittel  | ⭐⭐⭐⭐           | ✅ Implementiert |
| 1.3 | `ris_regierungsvorlagen` | Gering  | ⭐⭐⭐⭐           | ✅ Implementiert |

### Phase 2: Judikatur-Vervollständigung ✅ ABGESCHLOSSEN

| #   | Tool                      | Aufwand | Status           |
| --- | ------------------------- | ------- | ---------------- |
| 2.1 | `ris_judikatur` erweitern | Gering  | ✅ Implementiert |

### Phase 3: Verwaltungsebenen ✅ ABGESCHLOSSEN

| #   | Tool            | Aufwand | Status           |
| --- | --------------- | ------- | ---------------- |
| 3.1 | `ris_bezirke`   | Mittel  | ✅ Implementiert |
| 3.2 | `ris_gemeinden` | Mittel  | ✅ Implementiert |

### Phase 4: Spezialsammlungen ✅ ABGESCHLOSSEN

| #   | Tool           | Aufwand | Status           |
| --- | -------------- | ------- | ---------------- |
| 4.1 | `ris_sonstige` | Mittel  | ✅ Implementiert |

### Phase 5: Infrastruktur ✅ ABGESCHLOSSEN

| #   | Tool               | Aufwand | Status           |
| --- | ------------------ | ------- | ---------------- |
| 5.1 | `ris_history`      | Mittel  | ✅ Implementiert |
| 5.2 | `ris_verordnungen` | Gering  | ✅ Implementiert |

---

## Technische Hinweise

### API-Basis

```
https://data.bka.gv.at/ris/api/v2.6/
```

### Gemeinsame Parameter (alle Endpoints)

| Parameter   | Typ    | Beschreibung        |
| ----------- | ------ | ------------------- |
| Suchworte   | string | Volltextsuche       |
| Titel       | string | Titelsuche          |
| Seite       | number | Paginierung (ab 1)  |
| DokProSeite | number | Dokumente pro Seite |
| Sort        | string | Sortierung          |

### Zu beachtende Besonderheiten

1. **Bundesland-Kodierung:** Jedes Bundesland hat spezifische Codes
2. **Datums-Format:** ISO 8601 (YYYY-MM-DD)
3. **Rate Limiting:** API hat keine dokumentierten Limits, aber respektvolle Nutzung empfohlen
4. **Encoding:** UTF-8, Umlaute werden korrekt verarbeitet

---

## Referenzen

- API Dokumentation: `/docs/Dokumentation_OGD-RIS_API.pdf`
- API Base URL: https://data.bka.gv.at/ris/api/v2.6/
- RIS Portal: https://www.ris.bka.gv.at/
