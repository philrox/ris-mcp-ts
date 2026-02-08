OGD-RIS API Handbuch

V2_6

Wien, Mai 2024

Inhalt

Einleitung ................................................................................................................. 6

Bundesrecht ............................................................................................................ 6

Bundesrecht konsolidiert ................................................................................... 6

Bundesgesetzblatt authentisch ab 2004 ............................................................ 7

Staats- und Bundesgesetzblatt 1945 - 2003 ...................................................... 7

Reichs-, Staats- und Bundesgesetzblatt 1848 - 1940 ......................................... 7

Begutachtungsentwürfe ..................................................................................... 7

Regierungsvorlagen ............................................................................................ 7

Rechtsvorschriften in englischer Sprache (Austrian Laws) ................................ 7

Landesrecht ............................................................................................................. 7

Landesrecht in konsolidierter Fassung............................................................... 7

Landesgesetzblätter ........................................................................................... 7

Verordnungsblätter authentisch ........................................................................ 8

Bezirke ..................................................................................................................... 8

Kundmachungen der Bezirksverwaltungsbehörden .......................................... 8

Gemeinden .............................................................................................................. 8

Gemeinderecht .................................................................................................. 8

Gemeinderecht authentisch .............................................................................. 9

Judikatur .................................................................................................................. 9

Verfassungsgerichtshof (VfGH) .......................................................................... 9

Verwaltungsgerichtshof (VwGH) ........................................................................ 9

Justiz (OGH, OLG, LG, BG, OPMS, AUSL) ............................................................ 9

Bundesverwaltungsgericht (BVwG) ................................................................... 9

Landesverwaltungsgerichte (LVwG) ................................................................... 9

Datenschutzbehörde .......................................................................................... 9

Bundesdisziplinarbehörde, Disziplinarkommissionen ..................................... 10

OGD-RIS API Handbuch V2_6

Seite 2 von 60

Personalvertretungsaufsichtsbehörde (vor 2014: Personalvertretungs-

Aufsichtskommission) ...................................................................................... 10

Gleichbehandlungskommissionen ab 2014 ..................................................... 10

Unabhängige Verwaltungssenate .................................................................... 10

Asylgerichtshof (AsylGH) .................................................................................. 10

Unabhängiger Bundesasylsenat ....................................................................... 10

Umweltsenat .................................................................................................... 10

Bundeskommunikationssenat .......................................................................... 10

Vergabekontrollbehörden ................................................................................ 11

Sonstige Kundmachungen ..................................................................................... 11

Prüfungsordnungen gemäß Gewerbeordnung ................................................ 11

Amtliche Verlautbarungen der Sozialversicherung - authentisch ab 2002 ..... 11

Strukturpläne Gesundheit (ÖSG, RSG) ............................................................. 11

Amtliche Veterinärnachrichten (AVN) ab 15.09.2004 ..................................... 11

Kundmachungen der Gerichte ......................................................................... 11

Entscheidungen des unabhängigen Parteien-Transparenz-Senats ................. 11

Ministerratsprotokolle ..................................................................................... 12

Erlässe der Bundesministerien ......................................................................... 12

OGD-RIS API ........................................................................................................... 13

Glossar ................................................................................................................... 15

Änderungen in aktueller Version (V2.6) ................................................................ 16

November 2023 ..................................................................................................... 16

Dezember 2022 ..................................................................................................... 16

Folgende Änderungen wurden gegenüber der Version V2_5 vorgenommen ...... 17

Suche Datenquellen .............................................................................................. 17

Umstrukturierung der API (Controller) Namen inklusive abfragbarer

Applikationen: ....................................................................................................... 17

Suche/Bezirke ........................................................................................................ 17

Suche/Bundesrecht (Bundesnormen) ................................................................... 18

OGD-RIS API Handbuch V2_6

Seite 3 von 60

Suche/Gemeinden ................................................................................................. 18

Suche Aenderungen (History) ............................................................................... 18

Suche/Judikatur ..................................................................................................... 18

Suche/Landesrecht (Landesnormen) .................................................................... 19

Suche/Sonstige ...................................................................................................... 19

Parameter der API und Applikationen .................................................................. 21

Abfrage Bundesrecht/Bundesrecht in konsolidierter Fassung ............................. 21

Abfrage Bundesrecht/Bundesgesetzblatt authentisch ab 2004 ........................... 22

Abfrage Bundesrecht/Staats- und Bundesgesetzblatt 1945 - 2003 ...................... 25

Abfrage Bundesrecht/Reichs-, Staats- und Bundesgesetzblatt 1848 - 1940 ........ 25

Abfrage Bundesrecht/Begutachtungsentwürfe .................................................... 26

Abfrage Bundesrecht/Regierungsvorlagen ........................................................... 28

Abfrage Bundesrecht/Rechtsvorschriften in englischer Sprache (Austrian Laws) 30

Abfrage Landesrecht/Landesrecht konsolidiert (Landesnormen) ........................ 30

Abfrage Landesrecht/Landesgesetzblätter authentisch ....................................... 31

Abfrage Landesrecht/Landesgesetzblätter nicht authentisch .............................. 32

Abfrage Landesrecht/Landesgesetzblätter Niederösterreich ............................... 32

Abfrage Landesrecht/Verordnungsblätter der Länder ......................................... 33

Abfrage Bezirke/Kundmachungen der Bezirksverwaltungsbehörden .................. 34

Abfrage Gemeinden/Rechtsnormen von Gemeinden .......................................... 36

Abfrage Gemeinden/Rechtsverbindliche Kundmachungen, Verordnungen von

Gemeinden ............................................................................................................ 36

Abfrage Judikatur/Verfassungsgerichtshof (VfGH) ............................................... 37

Abfrage Judikatur/Verwaltungsgerichtshof (VwGH) ............................................. 38

Abfrage Judikatur/Normenliste des Verwaltungsgerichtshofes ........................... 38

Abfrage Judikatur/Justiz ........................................................................................ 39

Abfrage Judikatur/Bundesverwaltungsgericht (BVwG) ........................................ 40

OGD-RIS API Handbuch V2_6

Seite 4 von 60

Abfrage Judikatur/Landesverwaltungsgerichte (LVwG) ........................................ 41

Abfrage Judikatur/Datenschutzbehörde, Datenschutzkommission ..................... 41

Abfrage Judikatur/Bundesdisziplinarbehörde, Disziplinarkommissionen ............ 42

Abfrage Judikatur/Personalvertretungsaufsichtsbehörde, Personalvertretungs-

Aufsichtskommission ............................................................................................. 44

Abfrage Judikatur/Bundes-Gleichbehandlungskommission,

Gleichbehandlungskommission ............................................................................ 44

Abfrage Judikatur/Unabhängige Verwaltungssenate (UVS) ................................. 45

Abfrage Judikatur/Asylgerichtshof (AsylGH) ......................................................... 46

Abfrage Judikatur/Unabhängiger Bundesasylsenat (UBAS) .................................. 46

Abfrage Judikatur/Umweltsenat (UMSE) .............................................................. 47

Abfrage Judikatur/Bundeskommunikationssenat ................................................. 48

Abfrage Judikatur/Vergabekontrollbehörden ....................................................... 48

Abfrage Kundmachungen, Erlässe/Prüfungsordnungen gemäß

Gewerbeordnung .................................................................................................. 49

Abfrage Kundmachungen, Erlässe/Amtliche Verlautbarungen der

Sozialversicherung - authentisch ab 2002 ............................................................. 50

Abfrage Kundmachungen, Erlässe/Strukturpläne Gesundheit (ÖSG, RSG) .......... 52

Abfrage Kundmachungen, Erlässe/Amtliche Veterinärnachrichten (AVN) ab

15.09.2004 ............................................................................................................. 53

Abfrage Kundmachungen, Erlässe/Kundmachungen der Gerichte ...................... 53

Abfrage Kundmachungen, Erlässe/Entscheidungen des unabhängigen Parteien-

Transparenz-Senats ............................................................................................... 54

Abfrage Kundmachungen, Erlässe/Ministerratsprotokolle .................................. 55

Abfrage Kundmachungen, Erlässe/Erlässe der Bundesministerien ...................... 56

Abfrage History (Änderungen) .............................................................................. 58

Anwendungsbeispiele (http Post) ......................................................................... 59

Fehlermeldungen und Warnungen ....................................................................... 59

OGD-RIS API Handbuch V2_6

Seite 5 von 60

Einleitung

Auf Grund bundes- oder landesgesetzlicher Vorschriften sind die amtssignierten

Dokumente folgender RIS-Anwendungen rechtlich verbindlich:

•  Bundesgesetzblatt authentisch ab 2004

•

Landesgesetzblätter authentisch

•  Verordnungsblätter authentisch

•  Kundmachungen der Bezirksverwaltungsbehörden

•  Prüfungsordnungen gemäß Gewerbeordnung

•  Amtliche Verlautbarungen der Sozialversicherung - authentisch ab 2002

•  Strukturpläne Gesundheit (ÖSG, RSG)

•  Amtliche Veterinärnachrichten (AVN) ab 15.09.2004

•  Kundmachungen der Gerichte

Das RIS dient weiters der Information über das Recht von Bund und Ländern und

bietet einen Zugang zur Rechtsprechung, zu ausgewählten Rechtsnormen von

Gemeinden, zu ausgewählten Erlässen von Bundesministerien sowie zu sonstigen

Kundmachungen.

Für technische Anfragen wenden Sie sich bitte an: ris.it@bka.gv.at

Beim Rechtsinformationssystem handelt es sich um eine Dokumentation des

österreichischen Rechts. Daher können keinerlei Rechtsauskünfte erteiltwerden.

Das RIS besteht aus 59 eigenständigen Anwendungen, die hier nach Bereichen

gegliedert kurz vorgestellt werden.

Bundesrecht

Bundesrecht konsolidiert
Hier finden Sie das österreichische Bundesrecht in konsolidierter Fassung, wobei

Konsolidierung bedeutet, dass in einer Rechtsvorschrift sämtliche später

kundgemachten Änderungen und Berichtigungen eingearbeitet wurden. Diese

Dokumente dienen lediglich der Information, sind also rechtlich unverbindlich. Die

OGD-RIS API Handbuch V2_6, Dezember 2022

Seite 6 von 60

Dokumentationseinheit (ein Dokument) ist ein Paragraf oder ein Artikel oder eine

Anlage einer Rechtsvorschrift.

Bundesgesetzblatt authentisch ab 2004
Hier finden Sie das Bundesgesetzblatt in seiner rechtlich verbindlichen Form. Seit 1.

Jänner 2004 ist die hier kundgemachte elektronische Fassung die authentische.

Staats- und Bundesgesetzblatt 1945 - 2003
Hier sind die Jahrgänge 1945 bis einschließlich 2003 des Bundesgesetzblattes und

das Staatsgesetzblatt 1945 in rechtlich unverbindlicher Form verfügbar.

Reichs-, Staats- und Bundesgesetzblatt 1848 - 1940
Hier finden Sie das Reichsgesetzblatt 1849 bis 1918, das Staatsgesetzblatt 1918 bis

1920, das Bundesgesetzblatt 1920 bis 1938 und das Gesetzblatt für das Land

Österreich 1938 bis 1940 in rechtlich unverbindlicher Form. Für die Darstellung der

Dokumente wird mittels Link auf das Internetangebot der Österreichischen

Nationalbibliothek verwiesen.

Begutachtungsentwürfe
Hier finden Sie Begutachtungsentwürfe, soweit diese verfügbar sind.

Regierungsvorlagen
Hier finden Sie Regierungsvorlagen seit dem Jahr 2004.

Rechtsvorschriften in englischer Sprache (Austrian Laws)
Hier finden Sie englische Übersetzungen ausgewählter Rechtsvorschriften.

Landesrecht

Landesrecht in konsolidierter Fassung
Analog zum konsolidierten Bundesrecht bieten Ihnen diese Anwendungen die

Möglichkeit, das Landesrecht in konsolidierter Fassung abzufragen.

Landesgesetzblätter
In diesen Anwendungen finden Sie die authentischen Landesgesetzblätter. Ferner

sind auch die nicht authentischen Landesgesetzblätter im RIS enthalten.

OGD-RIS API Handbuch V2_6

Seite 7 von 60

Verordnungsblätter authentisch
Hier finden Sie Verordnungsblätter der Länder, die rechtsverbindlich kundgemacht

werden. Es handelt sich dabei um Verordnungen (von Landeshauptmann/frau,

Landesregierung, Amt der Landesregierung oder sonstigen Landesbehörden) die

nicht im Landesgesetzblatt kundgemacht werden und um keine Verordnungen von

Bezirksverwaltungsbehörden. Seit 1. Jänner 2022 werden die Verordnungsblätter

des Bundeslandes Tirol im RIS veröffentlicht.

Bezirke

Kundmachungen der Bezirksverwaltungsbehörden
Hier finden Sie Kundmachungen, insbesondere Verordnungen, von

Bezirksverwaltungsbehörden. Derzeit werden ausschließlich Kundmachungen der

Bezirksverwaltungsbehörden aus Niederösterreich (seit 1.9.2021), Oberösterreich

(seit 1.1.2022), Tirol (seit 1.1.2022), Vorarlberg (seit 1.7.2022), Burgenland (seit

1.1.2023) und die Steiermark (seit 1.1.2013) im RIS rechtsverbindlich kundgemacht.

Die Kundmachung von Verordnungen der Salzburger Bezirksverwaltungsbehörden

erfolgt seit 1. Juli 2022 im Salzburger Landesgesetzblatt.

Gemeinden

Gemeinderecht
Hier finden Sie ausgewählte Rechtsnormen von Gemeinden (entweder in der Form

von konsolidierten Texten oder Stammfassungen und Kundmachungen der

Novellen) folgender Bundesländer:

•  Kärnten (alle Gemeinden)

•  Niederösterreich

•  Oberösterreich

•  Salzburg

•  Steiermark

•  Wien

OGD-RIS API Handbuch V2_6

Seite 8 von 60

Gemeinderecht authentisch
Hier finden Sie rechtsverbindliche Kundmachungen, insbesondere Verordnungen,

von Gemeinden. Derzeit werden ausschließlich Kundmachungen von Gemeinden

folgender Bundesländer im RIS rechtsverbindlich kundgemacht:

•  Vorarlberg

Judikatur

Verfassungsgerichtshof (VfGH)
Hier finden Sie die Entscheidungen des Verfassungsgerichtshofes (VfGH) ab dem

Jahr 1980.

Verwaltungsgerichtshof (VwGH)
Hier finden Sie die Entscheidungen des Verwaltungsgerichtshofes (VwGH) ab dem

Jahr 1990 und ausgewählte Entscheidungen aus früheren Jahrgängen.

Justiz (OGH, OLG, LG, BG, OPMS, AUSL)
Hier finden Sie ausgewählte Entscheidungen des Obersten Gerichtshofes (OGH), der

Oberlandesgerichte (OLG), der Landesgerichte (LG), der Bezirksgerichte (BG),

Entscheidungen des Obersten Patent- und Markensenats (OPMS) und ausländische

Entscheidungen (AUSL).

Bundesverwaltungsgericht (BVwG)
Hier finden Sie die Entscheidungen des Bundesverwaltungsgerichts (BVwG) ab dem

Jahr 2014.

Landesverwaltungsgerichte (LVwG)
Hier finden Sie ausgewählte Entscheidungen der neun Landesverwaltungsgerichte

(LVwG) ab dem Jahr 2014.

Datenschutzbehörde
Hier finden Sie ausgewählte Entscheidungen der Datenschutzkommission von 1990

bis 2013. Ab 2014 finden Sie hier ausgewählte Entscheidungen der

Datenschutzbehörde.

OGD-RIS API Handbuch V2_6

Seite 9 von 60

Bundesdisziplinarbehörde, Disziplinarkommissionen
Hier finden Sie ausgewählte Entscheidungen der Bundesdisziplinarbehörde (seit 1.

Oktober 2020), der Disziplinarkommissionen (größtenteils bis 30. September 2020),

der Disziplinaroberkommission (bis 2013) und der Berufungskommission (bis 2013).

Personalvertretungsaufsichtsbehörde (vor 2014: Personalvertretungs-
Aufsichtskommission)
Hier finden Sie ausgewählte Entscheidungen der Personalvertretungs-Aufsichts-

kommission von 1999 bis 2013. Ab 2014 finden Sie hier die rechtskräftigen Ent-

scheidungen der Personalvertretungsaufsichtsbehörde.

Gleichbehandlungskommissionen ab 2014
Hier finden Sie die anonymisierten Entscheidungen der Bundes-Gleichbehandlungs-

kommission (Senat I und II) und der Gleichbehandlungskommission für die

Privatwirtschaft (Senate I, II und III) ab 1.1.2014.

Unabhängige Verwaltungssenate
Hier finden Sie ausgewählte Entscheidungen der Unabhängigen Verwaltungssenate

(UVS) von 1991 bis 2013.

Asylgerichtshof (AsylGH)
Diese Applikation beinhaltet die Entscheidungen des Asylgerichtshofes von Juli 2008

bis 2013.

Unabhängiger Bundesasylsenat
Hier finden Sie ausgewählte Entscheidungen des Unabhängigen Bundesasylsenates

(UBAS) von 1998 bis Ende Juni 2008.

Umweltsenat
Hier finden Sie ausgewählte Entscheidungen des Umweltsenates von 1994 bis 2013.

Bundeskommunikationssenat
Hier finden Sie ausgewählte Entscheidungen des Bundeskommunikationssenates

von 2001 bis 2013.

OGD-RIS API Handbuch V2_6

Seite 10 von 60

Vergabekontrollbehörden
Hier finden Sie ausgewählte Entscheidungen der Vergabekontrollbehörden (Bundes-

vergabeamt, Vergabekontrollkommission von Salzburg und Wien, ehemalige

Bundes-Vergabekontrollkommission) bis 2013.

Sonstige Kundmachungen

Prüfungsordnungen gemäß Gewerbeordnung
Hier finden Sie die Meister- und Befähigungsprüfungsordnungen gemäß

Gewerbeordnung. Diese bestehen aus den Prüfungsmodulen sowie den zu

prüfenden Gegenständen.

Amtliche Verlautbarungen der Sozialversicherung - authentisch ab 2002
Hier finden Sie die Rechtsvorschriften der Sozialversicherungsträger und des Dach-

verbandes nach den §§ 30a Abs. 3 bis 5, 30b Abs. 2 sowie § 30c Abs. 1 Z 3 ASVG

(Allgemeines Sozialversicherungsgesetz) und anderen Gesetzen. Seit 1. Jänner 2002

ist die hier kundgemachte elektronische Fassung die authentische.

Strukturpläne Gesundheit (ÖSG, RSG)
In dieser Anwendung sind der Österreichische Strukturplan Gesundheit (ÖSG) und

die Regionalen Strukturpläne Gesundheit (RSG) verfügbar. Weiters können Sie hier

die Verordnungen zum ÖSG und zu den RSG finden.

Amtliche Veterinärnachrichten (AVN) ab 15.09.2004
Sie finden hier die Amtlichen Veterinärnachrichten (AVN) des Bundesministeriums

für Soziales, Gesundheit Pflege und Konsumentenschutz.

Kundmachungen der Gerichte
Hier finden Sie die Kundmachungen der Gerichte, wie beispielsweise die

Geschäftsverteilung.

Entscheidungen des unabhängigen Parteien-Transparenz-Senats
Hier finden Sie die Entscheidungen des unabhängigen Parteien-Transparenz-Senats

(UPTS). Der UPTS ist eine unabhängige Behörde zur Verhängung von Geldbußen und

Geldstrafen bei Verstößen gegen bestimmte Regelungen des Parteiengesetzes.

OGD-RIS API Handbuch V2_6

Seite 11 von 60

Ministerratsprotokolle
Hier finden Sie die Beschlussprotokolle der Ministerratssitzungen sowie die

Ministerratsvorträge und die dazugehörenden Beilagen, sofern sie für die

Veröffentlichung bestimmt sind (ab dem Jahr 2020).

Erlässe der Bundesministerien
Hier finden Sie ausgewählte Erlässe der Bundesministerien.

Diese Anwendungen des Rechtsinformationssystems des Bundes (RIS),

https://www.ris.bka.gv.at/) sind tagesaktuell in maschinenlesbarer Form verfügbar.

OGD-RIS API Handbuch V2_6

Seite 12 von 60

OGD-RIS API

Basiert auf dem gleichnamigen Webservice "OGD-RIS Service" v2.6

(https://data.bka.gv.at/ris/ogd/v2.6)

OGD-RIS API ist ein REST Service implementiert mit ASP.NET MVC 5.2.7 Web API und

.Net Framework 4.8. Mit einem einfachen Http Request auf die jeweilige API-

Schnittstelle (Hauptgruppe und Applikation) mit der GET oder POST Methode und

den gewünschten Parametern kann eine OGD-RIS Datenabfrage durchgeführt

werden. Bei komplexen Abfrageparametern wie z.B.: Abschnitt, Fassung, Sortierung

gibt es eine Unterteilung des Parameternamens mit einem Trennzeichen (<spec>).

Das Ergebnis entspricht komplett dem "OGD-RIS Service" Response und ist immer im

Format JSON (Content-Type: application/json; charset=utf-8)

Ausnahme: Die Nutzdaten, also beispielsweise Rechtsvorschriften oder

Gerichtsentscheidungen, können derzeit nur im Format Xml, Html, Pdf oder Rtf

unter dem Zweig „.../Dokumentliste/ContentReference/Urls“ direkt von der RIS

Bürgerapplikation abgeholt werden. Der Url für die gesamte Rechtsvorschrift ist

unter dem Tag „GesamteRechtsvorschriftUrl“ zu finden und wird als Html

zurückgegeben. Das Abrufen der gesamten Rechtsvorschrift im PDF/RTF Format ist

im "Kapitel 5.6 Gesamte Rechtsvorschrift in einem Dokument anzeigen" des RIS-

Abfragehandbuches Bundesrecht konsolidiert (bka.gv.at) nachzulesen.

Request basiert auf den Schemadateien:

•  OGD_Bezirke_Request.xsd

•  OGD_Bundesrecht_Request.xsd

•  OGD_Gemeinden_Request.xsd

•  OGD_History_Request.xsd

•  OGD_Judikatur_Request.xsd

•  OGD_Landesrecht_Request.xsd

•  OGD_Request.xsd

•  OGD_Request_Types.xsd

•  OGD_Sonstige_Request.xsd

OGD-RIS API Handbuch V2_6

Seite 13 von 60

Response basiert auf den Schemadateien:

•  OGD_Bezirke_Response.xsd

•  OGD_Bundesrecht_Response.xsd

•  OGD_Dokumentliste_Response.xsd

•  OGD_Gemeinden_Response.xsd

•  OGD_Judikatur_Response.xsd

•  OGD_Landesrecht_Response.xsd

•  OGD_Response.xsd

•  OGD_Response_Types.xsd

•  OGD_Sonstige_Response.xsd

OGD-RIS API Handbuch V2_6

Seite 14 von 60

Glossar

<domain>

https://data.bka.gv.at/

<vers>

<spec>

v2.6

. _ - (akzeptierte Trennzeichen)

("Wert1", "Wert2")

Aufzählung: Einer der vorgegebenen Werte steht zur

Auswahl

("Wert1" | "Wert2")  Mögliche Wertekombinationen (kein, ein oder mehrere).

Bürgerapplikation

https://www.ris.bka.gv.at/

Mand

Opt

Mandatory, Verpflichtend

Optional, muss nicht vorkommen

Start= u. Infoseite:

https://data.bka.gv.at/ris/api/v2.6/

OGD-RIS API Handbuch V2_6

Seite 15 von 60

Änderungen in aktueller Version (V2.6)

November 2023

•  Bei der Abfrage von Gemeinderecht (Gr) wurden im Schema

OGD_Gemeinderecht_Response.xsd die Spalten Typ, Geschaeftszahl (nun ein

Array), PlanlicheDarstellung und Anmerkung vom Pfad

OgdSearchResult/OgdDocumentResults/OgdDocumentReference/Data/Metadat

en/Gemeinden/Gr in den Pfad

OgdSearchResult/OgdDocumentResults/OgdDocumentReference/Data/Metadat

en/Gemeinden verschoben. Die Abfrage der neuen RIS Applikation

Gemeinderecht authentisch (technisch GrA) wurde hinzugefügt.

Dezember 2022

•  Ergänzung der Wertelisten von „EinbringendeStelle“ bei

Bundesrecht/Bundesgesetzblatt authentisch ab 2004,

Bundesrecht/Begutachtungsentwürfe u. Bundesrecht/Regierungsvorlagen auf

Grund von Bundesministeriengesetz-Novelle 2022, der Wertelisten

„Bundesland“ und „Bezirksverwaltungsbehoerde“ bei Kundmachungen der

Bezirksverwaltungsbehörden, der Wertelisten „Rechtsgebiet“, „Fachgebiet“ u.

„Entscheidungsart“ bei Judikatur/Justiz, der Werteliste „Gericht“ bei

Kundemachungen der Gerichte, der Werteliste „Einbringer“ bei

Ministerratsprotokolle, der Werteliste „Einbringer“ bei Erlässe der

Bundesministerien.

•  Auf Grund von Neuerungen in der Applikation https://ris.bka.gv.at/Jus/ unter

Judikatur wurde auch die OGD RIS API erweitert. Bei JustizSearchRequest kann

nun zusätzlich mit den optionalen Spalten Rechtsgebiet, Fachgeiet,

Entscheidungsart u. Spruch abgefragt werden (Siehe JustizSearchRequest  in

OGD_Judikatur_Request.xsd). Im Response von JustizResponse sind nun

folgende Spalten, falls belegt vorhanden: Rechtsgebiete, Fachgebiete,

Entscheidungsart u. Entscheidungsart in JustizEntscheidungstext (Siehe

JustizResponse in OGD_Judikatur_Response.xsd)

OGD-RIS API Handbuch V2_6

Seite 16 von 60

Folgende Änderungen wurden
gegenüber der Version V2_5
vorgenommen

Suche Datenquellen

•  Ab Version V2.6 können alle derzeit im RIS veröffentlichten Daten über OGD-RIS

API abgefragt werden.

Umstrukturierung der API (Controller) Namen inklusive abfragbarer
Applikationen:

Tabelle 1: Umstrukturierung der API (Controller)Namen inklusive abfragbarer Applikationen

Bereich

Bezirke

Abfragbare Applikationen

Bvb

Bundesrecht

BrKons, BgblAuth, BgblPdf, BgblAlt, Begut, RegV, Erv

Gemeinden

Gr, GrA

History

Änderungen bei allen Applikationen abfragbar

Judikatur

Vfgh, Vwgh, Normenliste, Justiz, Bvwg, AsylGH, Lvwg, Dsk, Verg, Dok, Pvak,
Gbk, Uvs, Ubas, Umse, Bks

Landesrecht

LrKons, LgblAuth, Lgbl, LgblNO, Vbl

Sonstige

PruefGewO, Avsv, Spg, Avn, KmGer, Upts, Mrp, Erlaesse

Version

Version abfragbar

Suche/Bezirke

•  Neue API Bezirke und Applikation „Bvb“

OGD-RIS API Handbuch V2_6

Seite 17 von 60

Suche/Bundesrecht (Bundesnormen)

•  Abfrage Bundesrecht konsolidiert (Appl = „BrKons“) nun über Bundesrecht-API

Fassung.VonInkrafttretedatum -> Fassung.VonInkrafttretensdatum

Fassung.BisInkrafttretedatum -> Fassung.BisInkrafttretensdatum

Fassung.VonAusserkrafttretedatum -> Fassung.VonAusserkrafttretensdatum

Fassung.BisAusserkrafttretedatum -> Fassung.BisAusserkrafttretensdatum

Sortierung.SortedByColumn: Inkrafttretedatum -> Inkrafttretensdatum

•  Abfrage Bundesgesetzblätter authentisch (Appl = „BgblAuth“) nun über

Bundesrecht-API.

Neues Abfragefeld „EinbringendeStelle“

•  Abfrage Staats- und Bundesgesetzblatt 1945 - 2003 nun über Bundesrecht-API.

•  Neu, Abfrage Reichs-, Staats- und Bundesgesetzblatt 1848 – 1940 über

Bundesrecht-API.

(Appl = „BgblAlt“)

•  Abfrage Begutachtungsentwürfe nun über Bundesrecht-API (Appl = „Begut“).

•  Abfrage Regierungsvorlagen nun über Bundesrecht-API (Appl = „RegV“).

•  Abfrage Rechtsvorschriften in englischer Sprache (Austrian Laws) nun über

Bundesrecht-API (Appl = „Erv“).

InRisSince -> ImRisSeit

Suche/Gemeinden

•  Neue API Gemeinden und Applikation „Gr, GrA“

Suche Aenderungen (History)

•

Im Element <Anwendung> wurden in der Aufzählung folgende Werte AsylGH,

BgblAlt, Bks, Bvb, Gemeinderecht, KmGer, Normenliste, PruefGewO, Spg, Ubas,

Umse, Upts, Uvs, Verg, Vbl hinzugefügt.

Suche/Judikatur

•  Neue Applikation zum Abfragen: „Normenliste“, „AsylGH“, „Verg“, „Uvs“,

„Ubas“, „Umse“, „Bks“

OGD-RIS API Handbuch V2_6

Seite 18 von 60

Suche/Landesrecht (Landesnormen)

•  Abfrage Landesrecht in konsolidierter Fassung (Appl = „LrKons“) nun über

Landesrecht-API

Sortierung.SortedByColumn Inkrafttretedatum -> Inkrafttretensdatum

•  Abfrage Landesgesetzblätter authentisch nun über Landesrecht-API (Appl =

„LgblAuth“).

•  Abfrage Landesgesetzblätter nicht authentisch nun über Landesrecht-API (Appl =

„Lgbl“).

•  Abfrage Landesgesetzblätter nicht authentisch NÖ nun über Landesrecht-API

(Appl = „LgblNO“).

•  Abfrage Verordnungsblätter der Länder über Landesrecht-API (Appl = „Vbl“)

Suche/Sonstige

•  Alte/Neue Applikation zum Abfragen: „PruefGewO“, „Avsv“, „Spg“, „Avn“,

„Kmger“, „Upts“, „Mrp“, „Erlaesse“

Versionsabfrage:

<domain>/ris/api/<vers>/version

Information zu den verfügbaren Applikationen:

Detaillierte Informationen zu den einzelnen Applikationen sind den

OGD_*_Request.xsd Schemadateien zu entnehmen.

Beschreibung der verschiedenen Suchausdrücke:

•  FulltextSearchExpression

Suche nach einer „textuellen“ Volltextabfrage, die Syntax (Klammern,

Anführungszeichen, Whitespace) ist analog zu den Suchworten in der

Bürgerapplikation

(https://www.ris.bka.gv.at/UI/Help.aspx?Abfrage=Bundesnormen&Field=Suchw

orteField).

Hiermit kann eine Eingabe des Benutzers 1:1 an die Abfragelogik weitergegeben

werden. Dafür muss der Benutzer allerdings auch die beschriebene Grammatik

einhalten, andernfalls wird ein Validierungsfehler gemeldet.

OGD-RIS API Handbuch V2_6

Seite 19 von 60

•  PhraseSearchExpression

Suche nach einem (potentiell durch Leerzeichen getrennten) Begriff. Es kann der

„*“ als Wildcard verwendet werden. Wird überall angeboten, wo die

Sucheingabe mit einer Volltextsuche implementiert ist, aber der gesuchte

Begriff in der Regel nicht die vollständige Grammatik einer Volltextsuche

benötigt bzw. mit einer Wildcard-Suche auskommt.

Da die Regeln entsprechend einfach gehalten sind, ist hier eine zusätzliche

Validierung am Client möglich, damit dem Benutzer eine präzise Fehlermeldung

inkl. dem betroffenen Feld geben werden kann. Sinnvolle Werte müssen auf der

jeweiligen Metadatenseite nachgeschlagen werden, da sie rein durch den

aktuellen Datenbestand definiert sind und das Suchfeld in seiner Intention der

Suche in der Bürgerapplikation folgt.

•  TermSearchExpression

Suche nach einem Begriff, welcher keine Leerzeichen enthält. Es kann der „*“ als

Wildcard verwendet werden. Wird überall angeboten, wo in der Sucheingabe

Wildcards sinnvoll sind.

Da die Regeln entsprechend einfach gehalten sind, ist hier eine zusätzliche

Validierung am Client möglich, damit dem Benutzer eine präzise Fehlermeldung

inkl. Parameter gegeben werden kann. Sinnvolle Werte müssen auf der

jeweiligen Metadatenseite nachgeschlagen werden, da sie rein durch den

aktuellen Datenbestand definiert sind und das Suchfeld in seiner Intention der

Suche in der Bürgerapplikation folgt.

•  ExactMatchSearchExpression

Suche nach einem exakten Begriff, welcher auch Leerzeichen enthalten darf. Es

sind keine Wildcards zulässig. Wird überall angeboten, wo z.B. ein bestimmter,

aber änderbarer Wertevorrat (z.B. Einbringer bei den Erlässen oder

Gesetzesnummer bei Bundesnormen/Landesnormen) existiert.

Da die Regeln entsprechend einfach gehalten sind, ist hier eine zusätzliche

Validierung am Client möglich, damit dem Benutzer eine präzise Fehlermeldung inkl.

Parameter gegeben werden kann. Sofern die Werte in der Anwendung hinterlegt

sind (z.B. Einbringer bei den Erlässen), ist es empfehlenswert, den gültigen

Wertevorrat zu dokumentieren.

OGD-RIS API Handbuch V2_6

Seite 20 von 60

Parameter der API und
Applikationen

Abfrage Bundesrecht/Bundesrecht in konsolidierter Fassung

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("BrKons"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•

Index (FulltextSearchExpression, Opt)

•  Typ (FulltextSearchExpression, Opt)

•  Abschnitt (NormabschnittSucheinschraenkung, Opt)

o  Abschnitt<spec>Von (Opt)
o  Abschnitt<spec>Bis (Opt)
o  Abschnitt<spec>Typ (("Alle", "Artikel", "Paragraph", "Anlage"), Mand)

•  Fassung (Fassungsangabe, Opt)

o  Fassung<spec>FassungVom (YYYY-mm-dd, Mand)
o  oder
o  Fassung<spec>VonInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>VonAusserkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisAusserkrafttretensdatum (YYYY-mm-dd, Opt)

•  Gesetzesnummer (ExactMatchSearchExpression, Opt)

•  Kundmachungsorgan (("BGBl. I Nr.","BGBl. II Nr.","BGBl. III Nr.","BGBl.

Nr.","RGBl. Nr.", "StGBl. Nr.","ASlg. Nr.","AmtlNHW Nr.","DJ S","DRAnz.

Nr.","dRGBl. I S","dRGBl. II S","dRGBl. S","GBlÖ Nr.","GVBlTirVbg.Nr.","JABl.

Nr.","JakschGL II, S","JGS Nr.","JMVBl. Nr.", "JosGS II., Nr.","LGBl. Nr.","LGBlBgld.

Nr.","LGBlSbg. Nr.","LGBlStmk. Nr.","LGuVBlStmk. Nr.", "LGVBlTir. Nr.","LGBlKtn.

Nr.","LGBlNÖ. Nr.","LGBlOÖ. Nr.","LGBlTir. Nr.","LGBlVbg. Nr.", "LGVBlSbg.

Nr.","LGVBlStmk. Nr.","LGVBlW. Nr.","MBl. I S","MThGS Bd. 6, Nr.", "MThGS Bd.

7, Nr.","NSlgpolVerwD Nr.","PGS Nr.","PTVBl. Nr.","RMinBl. S","RVBl. Nr.",

"RVBl. S","SlgGOeudEns14","StGBl.Nr.","VABlNiederdonau S","VABlWien Nr.",

"VerBKAVVers. Nr.","Zl. II b Nr."), Opt)

OGD-RIS API Handbuch V2_6

Seite 21 von 60

•  Kundmachungsorgannummer (PhraseSearchExpression, Opt)

•  Unterzeichnungsdatum (YYYY-mm-dd, Opt)

•  Sortierung (BrKonsSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("ArtikelParagraphAnlage",

"Kurzinformtion", "Inkrafttretensdatum", "Ausserkrafttretensdatum"),

Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen",

"EinemMonat","DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Bundesrecht/Bundesgesetzblatt authentisch ab 2004

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("BgblAuth"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bgblnummer (PhraseSearchExpression, Opt)

•  Kundmachung (DateInterval, Opt)

o  Kundmachung<spec>Periode (("Undefined", "EinerWoche",

"ZweiWochen","EinemMonat", "DreiMonaten", "SechsMonaten",

"EinemJahr"), Mand)

o  oder
o  Kundmachung<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachung<spec>Bis (YYYY-mm-dd, Opt)
•  EinbringendeStelle (("BKA (Bundeskanzleramt)",

o  "BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im

Bundeskanzleramt)",

o  "BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)",
o  "BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und

Sport)",

o  "BMEIA (Bundesministerium für europäische und internationale

Angelegenheiten)",

o  "BMAW (Bundesministerium für Arbeit und Wirtschaft)",
o  "BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)",

OGD-RIS API Handbuch V2_6

Seite 22 von 60

o  "BMF (Bundesministerium für Finanzen)",
o  "BMI (Bundesministerium für Inneres)",
o  "BMJ (Bundesministerium für Justiz)",
o  "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität,

Innovation und Technologie)",

o  "BMLV (Bundesministerium für Landesverteidigung)",
o  "BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und

Wasserwirtschaft)",

o  "BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und

Konsumentenschutz)",
o  "PARLAMENT (Parlament)",
o  "Abschlussprüferaufsichtsbehörde",
o  "Finanzmarktaufsichtsbehörde",
o  "Kommunikationsbehörde",
o  "Oesterreichische Nationalbank",
o  "Österreichische Ärztekammer",
o  "Präsident/in des Nationalrates",
o  "Präsident/in des Bundesrates",
o  "Präsidentschaftskanzlei",
o  "Rechnungshof",
o  "Regulierungskommission der E-Control",
o  "Rundfunk und Telekom Regulierungs-GmbH",
o  "Verfassungsgerichtshof",
o  "Verwaltungsgerichtshof",
o  "Volksanwaltschaft",
o  "Vorstand der E-Control",
o  "Vorstandsvorsitzende/r der Österreichischen Post AG",
o  "Vorstandsvorsitzende/r der Postbus AG",
o  "Vorstandsvorsitzende/r der Telekom Austria AG",
o  "BMAA (Bundesministerium für auswärtige Angelegenheiten)",
o  "BMA (Bundesministerium für Arbeit)",
o  "BMASK (Bundesministerium für Arbeit, Soziales und Konsumentenschutz)",
o  "BMASGK (Bundesministerium für Arbeit, Soziales, Gesundheit und

Konsumentenschutz)",

o  "BMAFJ (Bundesministerium für Arbeit, Familie und Jugend)",
o  "BMB (Bundesministerium für Bildung)",
o  "BMBF (Bundesministerium für Bildung und Frauen)",

OGD-RIS API Handbuch V2_6

Seite 23 von 60

o  "BMBWK (Bundesministerium für Bildung, Wissenschaft und Kultur)",
o  "BMDW (Bundesministerium für Digitalisierung und Wirtschaftsstandort)",
o  "BMEIA (Bundesministerium für Europa, Integration und Äußeres)",
o  "BMFJ (Bundesministerium für Familien und Jugend)",
o  "BMG (Bundesministerium für Gesundheit)",
o  "BMGF (Bundesministerium für Gesundheit und Frauen)",
o  "BMGFJ (Bundesministerium für Gesundheit, Familie und Jugend)",
o  "BMLRT (Bundesministerium für Landwirtschaft, Regionen und Tourismus)",
o  "BMLFUW (Bundesministerium für Land- und Forstwirtschaft, Umwelt und

Wasserwirtschaft)",

o  "BMLVS (Bundesministerium für Landesverteidigung und Sport)",
o  "BMNT (Bundesministerium für Nachhaltigkeit und Tourismus)",
o  "BMOEDS (Bundesministerium für öffentlichen Dienst und Sport)",
o  "BMSG (Bundesministerium für soziale Sicherheit, Generationen und

Konsumentenschutz)",

o  "BMSK (Bundesministerium für Soziales und Konsumentenschutz)",
o  "BMUKK (Bundesministerium für Unterricht, Kunst und Kultur)",
o  "BMVRDJ (Bundesministerium für Verfassung, Reformen, Deregulierung und

Justiz)",

o  "BMVIT (Bundesministerium für Verkehr, Innovation und Technologie)",
o  "BMWA (Bundesministerium für Wirtschaft und Arbeit)",
o  "BMWF (Bundesministerium für Wissenschaft und Forschung)",
o  "BMWFJ (Bundesministerium für Wirtschaft, Familie und Jugend)",
o  "BMWFW (Bundesministerium für Wissenschaft, Forschung und

Wirtschaft)", Opt)

•  Teil<spec>(("SucheInTeil1"="true" | "SucheInTeil2"="true" |

"SucheInTeil3"="true"), Opt)

•  Typ<spec>(("SucheInGesetzen"="true" | "SucheInKundmachungen"="true" |

"SucheInVerordnungen="true" | "SucheInSonstiges"="true"), Opt)

•  Sortierung (BgblAuthSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("BgblNummer",

"Kundmachungsdatum"), Mand)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

OGD-RIS API Handbuch V2_6

Seite 24 von 60

Abfrage Bundesrecht/Staats- und Bundesgesetzblatt 1945 - 2003

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("BgblPdf"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesgesetzblatt (PhraseSearchExpression, Opt)

•  Kundgemacht (RangeDateInterval, Opt)

o  Kundgemacht<spec>Von (YYYY-mm-dd, Opt)
o  Kundgemacht<spec>Bis (YYYY-mm-dd, Opt)

•  Typ<spec>(("SucheInGesetzen"="true" | "SucheInKundmachungen"="true" |

SucheInVerordnungen"="true" | "SucheInSonstiges"="true"), Opt)

•  Teil<spec>(("SucheInAlt"="true" | "SucheInTeil1"="true" | "SucheInTeil2"="true"

| "SucheInTeil3"="true"), Opt)

•  Sortierung (BgblPdfSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Fundstelle", "Kundmachungsdatum"),

Mand)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Bundesrecht/Reichs-, Staats- und Bundesgesetzblatt 1848 -
1940

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("BgblAlt"), Mand)

•  Titel (FulltextSearchExpression, Opt)

•  Gesetzblattnummer (TermSearchExpression, Opt)

•

Jahrgang (TermSearchExpression, Opt)

•  Stuecknummer (TermSearchExpression, Opt)

•  Kundgemacht (RangeDateInterval, Opt)

o  Kundgemacht <spec>Von (YYYY-mm-dd, Opt)
o  Kundgemacht <spec>Bis (YYYY-mm-dd, Opt)

•  Sortierung (BgblAltSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)

OGD-RIS API Handbuch V2_6

Seite 25 von 60

o  Sortierung<spec>SortedByColumn (("Fundstelle", "Kundmachungsdatum"),

Mand)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Bundesrecht/Begutachtungsentwürfe

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("Begut"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•

InBegutachtungAm (YYYY-mm-dd, Opt)

•  EinbringendeStelle (("BKA (Bundeskanzleramt)",

o  "BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im

Bundeskanzleramt)",

o  "BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)",
o  "BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und

Sport)",

o  "BMEIA (Bundesministerium für europäische und internationale

Angelegenheiten)",

o  "BMAW (Bundesministerium für Arbeit und Wirtschaft)",
o  "BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)",
o  "BMF (Bundesministerium für Finanzen)",
o  "BMI (Bundesministerium für Inneres)",
o  "BMJ (Bundesministerium für Justiz)",
o  "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität,

Innovation und Technologie)",

o  "BMLV (Bundesministerium für Landesverteidigung)",
o  "BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und

Wasserwirtschaft)",

o  "BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und

Konsumentenschutz)",

o  "BMAA (Bundesministerium für auswärtige Angelegenheiten)",
o  "BMA (Bundesministerium für Arbeit)",
o  "BMASK (Bundesministerium für Arbeit, Soziales und Konsumentenschutz)",

OGD-RIS API Handbuch V2_6

Seite 26 von 60

o  "BMASGK (Bundesministerium für Arbeit, Soziales, Gesundheit und

Konsumentenschutz)",

o  "BMAFJ (Bundesministerium für Arbeit, Familie und Jugend)",
o  "BMB (Bundesministerium für Bildung)",
o  "BMBF (Bundesministerium für Bildung und Frauen)",
o  "BMBWK (Bundesministerium für Bildung, Wissenschaft und Kultur)",
o  "BMDW (Bundesministerium für Digitalisierung und Wirtschaftsstandort)",
o  "BMEIA (Bundesministerium für Europa, Integration und Äußeres)",
o  "BMFJ (Bundesministerium für Familien und Jugend)",
o  "BMG (Bundesministerium für Gesundheit)",
o  "BMGF (Bundesministerium für Gesundheit und Frauen)",
o  "BMGFJ (Bundesministerium für Gesundheit, Familie und Jugend)",
o  "BMLRT (Bundesministerium für Landwirtschaft, Regionen und Tourismus)",
o  "BMLFUW (Bundesministerium für Land- und Forstwirtschaft, Umwelt und

Wasserwirtschaft)",

o  "BMLVS (Bundesministerium für Landesverteidigung und Sport)",
o  "BMNT (Bundesministerium für Nachhaltigkeit und Tourismus)",
o  "BMOEDS (Bundesministerium für öffentlichen Dienst und Sport)",
o  "BMSG (Bundesministerium für soziale Sicherheit, Generationen und

Konsumentenschutz)",

o  "BMSK (Bundesministerium für Soziales und Konsumentenschutz)",
o  "BMUKK (Bundesministerium für Unterricht, Kunst und Kultur)",
o  "BMVRDJ (Bundesministerium für Verfassung, Reformen, Deregulierung und

Justiz)",

o  "BMVIT (Bundesministerium für Verkehr, Innovation und Technologie)",
o  "BMWA (Bundesministerium für Wirtschaft und Arbeit)",
o  "BMWF (Bundesministerium für Wissenschaft und Forschung)",
o  "BMWFJ (Bundesministerium für Wirtschaft, Familie und Jugend)",
o  "BMWFW (Bundesministerium für Wissenschaft, Forschung und

Wirtschaft)"), Opt)

•  Sortierung (BegutSortableColumn, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn ("Kurztitel", "EinbringendeStelle",

"EndeBegutachtungsfrist"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

OGD-RIS API Handbuch V2_6

Seite 27 von 60

•  Seitennummer (1 - n, Opt)

Abfrage Bundesrecht/Regierungsvorlagen

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("RegV"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  BeschlussdatumVon (YYYY-mm-dd, Opt)

•  BeschlussdatumBis (YYYY-mm-dd, Opt)

•  EinbringendeStelle (("BKA (Bundeskanzleramt)",

o  "BMFFIM (Bundesministerin für Frauen, Familie, Integration und Medien im

Bundeskanzleramt)",

o  "BMEUV (Bundesministerin für EU und Verfassung im Bundeskanzleramt)",
o  "BMKOES (Bundesministerium für Kunst, Kultur, öffentlichen Dienst und

Sport)",

o  "BMEIA (Bundesministerium für europäische und internationale

Angelegenheiten)",

o  "BMAW (Bundesministerium für Arbeit und Wirtschaft)",
o  "BMBWF (Bundesministerium für Bildung, Wissenschaft und Forschung)",
o  "BMF (Bundesministerium für Finanzen)",
o  "BMI (Bundesministerium für Inneres)",
o  "BMJ (Bundesministerium für Justiz)",
o  "BMK (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität,

Innovation und Technologie)",

o  "BMLV (Bundesministerium für Landesverteidigung)",
o  "BML (Bundesministerium für Land- und Forstwirtschaft, Regionen und

Wasserwirtschaft)",

o  "BMSGPK (Bundesministerium für Soziales, Gesundheit, Pflege und

Konsumentenschutz)",

o  "BMAA (Bundesministerium für auswärtige Angelegenheiten)",
o  "BMA (Bundesministerium für Arbeit)",
o  "BMASK (Bundesministerium für Arbeit, Soziales und Konsumentenschutz)",
o  "BMASGK (Bundesministerium für Arbeit, Soziales, Gesundheit und

Konsumentenschutz)",

o  "BMAFJ (Bundesministerium für Arbeit, Familie und Jugend)",

OGD-RIS API Handbuch V2_6

Seite 28 von 60

o  "BMB (Bundesministerium für Bildung)",
o  "BMBF (Bundesministerium für Bildung und Frauen)",
o  "BMBWK (Bundesministerium für Bildung, Wissenschaft und Kultur)",
o  "BMDW (Bundesministerium für Digitalisierung und Wirtschaftsstandort)",
o  "BMEIA (Bundesministerium für Europa, Integration und Äußeres)",
o  "BMFJ (Bundesministerium für Familien und Jugend)",
o  "BMG (Bundesministerium für Gesundheit)",
o  "BMGF (Bundesministerium für Gesundheit und Frauen)",
o  "BMGFJ (Bundesministerium für Gesundheit, Familie und Jugend)",
o  "BMLRT (Bundesministerium für Landwirtschaft, Regionen und Tourismus)",
o  "BMLFUW (Bundesministerium für Land- und Forstwirtschaft, Umwelt und

Wasserwirtschaft)",

o  "BMLVS (Bundesministerium für Landesverteidigung und Sport)",
o  "BMNT (Bundesministerium für Nachhaltigkeit und Tourismus)",
o  "BMOEDS (Bundesministerium für öffentlichen Dienst und Sport)",
o  "BMSG (Bundesministerium für soziale Sicherheit, Generationen und

Konsumentenschutz)",

o  "BMSK (Bundesministerium für Soziales und Konsumentenschutz)",
o  "BMUKK (Bundesministerium für Unterricht, Kunst und Kultur)",
o  "BMVRDJ (Bundesministerium für Verfassung, Reformen, Deregulierung und

Justiz)",

o  "BMVIT (Bundesministerium für Verkehr, Innovation und Technologie)",
o  "BMWA (Bundesministerium für Wirtschaft und Arbeit)",
o  "BMWF (Bundesministerium für Wissenschaft und Forschung)",
o  "BMWFJ (Bundesministerium für Wirtschaft, Familie und Jugend)",
o  "BMWFW (Bundesministerium für Wissenschaft, Forschung und

Wirtschaft)"), Opt)

•  Sortierung (RegVSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kurztitel", "EinbringendeStelle"

,"Beschlussdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

OGD-RIS API Handbuch V2_6

Seite 29 von 60

Abfrage Bundesrecht/Rechtsvorschriften in englischer Sprache
(Austrian Laws)

Query: <domain>/ris/api/<vers>/Bundesrecht

Parameter:

•  Applikation (("Erv"), Mand)

•  SearchTerms (FulltextSearchExpression, Opt)

•  Title (FulltextSearchExpression, Opt)

•  Source (FulltextSearchExpression, Opt)

•  Sort (ErvSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kurztitel"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Landesrecht/Landesrecht konsolidiert (Landesnormen)

Query: <domain>/ris/api/<vers>/Landesrecht

Parameter:

•  Applikation (("LrKons"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesland<spec>(("SucheInBurgenland"="true" | "SucheInKaernten"="true" |

"SucheInNiederoesterreich="true" | "SucheInOberoesterreich"="true") |

"SucheInSalzburg="true" | "SucheInSteiermark"="true") | "SucheInTirol="true" |

"SucheInVorarlberg"="true") | "SucheInWien="true"), Opt)

•

Index (FulltextSearchExpression, Opt)

•  Typ (FulltextSearchExpression, Opt)

•  Abschnitt (NormabschnittSucheinschraenkung, Opt)

o  Abschnitt<spec>Von (Opt)
o  Abschnitt<spec>Bis (Opt)
o  Abschnitt<spec>Typ (("Alle", "Artikel", "Paragraph", "Anlage"), Mand)

•  Fassung (Fassungsangabe, Opt)

o  Fassung<spec>FassungVom (date, YYYY-mm-dd, Mand)
o  oder

OGD-RIS API Handbuch V2_6

Seite 30 von 60

o  Fassung<spec>VonInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>VonAusserkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisAusserkrafttretensdatum (YYYY-mm-dd, Opt)

•  Gesetzesnummer (ExactMatchSearchExpression, Opt)

•  Kundmachungsorgan (PhraseSearchExpression, Opt)

•  Kundmachungsorgannummer (PhraseSearchExpression, Opt)

•  Unterzeichnungsdatum (YYYY-mm-dd, Opt)

•  Sortierung (LrKonsSortableColumn, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("ArtikelParagraphAnlage",

"Kurzinformation", "Inkrafttretensdatum", "Ausserkrafttretensdatum"),

Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Landesrecht/Landesgesetzblätter authentisch

Query: <domain>/ris/api/<vers>/Landesrecht

Parameter:

•  Applikation (("LgblAuth"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•

Lgblnummer (PhraseSearchExpression, Opt)

•  Bundesland<spec>(("SucheInBurgenland"="true" | "SucheInKaernten"="true" |

"SucheInNiederoesterreich="true" | "SucheInOberoesterreich"="true")

"SucheInSalzburg="true" | "SucheInSteiermark"="true") | "SucheInTirol="true" |

"SucheInVorarlberg"="true") | "SucheInWien="true"), Opt)

•  Kundmachung (DateInterval, Opt)

o  Kundmachung<spec>Periode (("Undefined", "EinerWoche", "ZweiWochen",
o  "EinemMonat", "DreiMonaten", "SechsMonaten", "EinemJahr"), Mand)
o  oder
o  Kundmachung<spec>Von (date, YYYY-mm-dd, Opt)
o  Kundmachung<spec>Bis (date, YYYY-mm-dd, Opt)

OGD-RIS API Handbuch V2_6

Seite 31 von 60

•  Typ<spec>(("SucheInGesetzen"="true" | "SucheInKundmachungen"="true" |

"SucheInVerordnungen="true" | "SucheInSonstiges"="true"), Opt)

•  Sortierung (LgblAuthSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("LgblNummer",
"Kundmachungsdatum", "Bundesland"), Mand)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, integer, Opt)

Abfrage Landesrecht/Landesgesetzblätter nicht authentisch

Query: <domain>/ris/api/<vers>/Landesrecht

Parameter:

•  Applikation (("Lgbl"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•

Lgblnummer (PhraseSearchExpression, Opt)

•  Kundmachung (RangeDateInterval, Opt)

o  Kundmachung<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachung<spec>Bis (YYYY-mm-dd, Opt)

•  Bundesland<spec>("SucheInBurgenland"="true" | "SucheInKaernten"="true" |

"SucheInOberoesterreich"="true") | "SucheInSalzburg="true" |

"SucheInSteiermark"="true") | "SucheInTirol="true" |

"SucheInVorarlberg"="true"), Opt)

•  Typ<spec>("SucheInGesetzen"="true", "SucheInKundmachungen"="true",

"SucheInVerordnungen="true", "SucheInSonstiges"="true"), Opt)

•  Sortierung (LgblSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Fundstelle", "Kundmachungsdatum",

"Bundesland"), Mand)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Landesrecht/Landesgesetzblätter Niederösterreich

Query: <domain>/ris/api/<vers>/Landesrecht

Parameter:

OGD-RIS API Handbuch V2_6

Seite 32 von 60

•  Applikation (("LgblNO"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Gliederungszahl (ExactMatchSearchExpression, Opt)

•  Typ<spec>(("SucheInGesetzen"="true" | "SucheInKundmachungen"="true" |

"SucheInVerordnungen="true" | "SucheInSonstiges"="true"), Opt)

•

Index (("Undefined", "VerfassungsUndOrganisationsrecht", "Gemeinderecht",

"Dienstrecht", "Finanzrecht", "InnereVerwaltung", "Kulturrecht",

"LandUndForstwirtschaft", "Wirtschaftsrecht", "BodenUndVerkehrsrecht",

"Sozialrecht"), Opt)

•  FassungVom (YYYY-mm-dd, Opt)

•  Ausgabedatum (RangeDateInterval, Opt)

o  Ausgabedatum <spec>Von (YYYY-mm-dd, Opt)
o  Ausgabedatum <spec>Bis (YYYY-mm-dd, Opt)

•  Sortierung (LgblNoSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Gliederungszahl", "Ausgabedatum"),

Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Landesrecht/Verordnungsblätter der Länder

Query: <domain>/ris/api/<vers>/Landesrecht

Parameter:

•  Applikation (("Vbl"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesland

("Undefined","Burgenland","Kaernten","Niederoesterreich","Oberoesterreich",

"Salzburg","Steiermark","Tirol","Vorarlberg","Wien"), Opt)

•  Einbringer (ExactMatchSearchExpression,

("Landeshauptmann/frau","Landesregierung", "Amt der

Landesregierung","Sonstige Landesbehörden"), Opt)

•  Kundmachungsnummer (ExactMatchSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 33 von 60

•  Kundmachungsdatum (RangeDateInterval, Opt)

o  Kundmachungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Sortierung (VblSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending","Descending"), Mand)
o  Sortierung<spec>SortedByColumn

(("Kundmachungsorgan","Kundmachungsdatum","Bundesland","Einbringer"

), Mand)

•

ImRisSeit (("Undefined","EinerWoche","ZweiWochen","EinemMonat",

"DreiMonaten","SechsMonaten","EinemJahr"), Opt)

•  DokumenteProSeite (("Ten","Twenty","Fifty","OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Bezirke/Kundmachungen der Bezirksverwaltungsbehörden

Query: <domain>/ris/api/<vers>/Bezirke

Parameter:

•  Applikation (("Bvb"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesland (("Undefined", "Burgenland", "Kärnten", "Niederösterreich",

"Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"), Opt)

•  Bezirksverwaltungsbehoerde (("Bezirkshauptmannschaft Amstetten",

"Bezirkshauptmannschaft Baden","Bezirkshauptmannschaft Bruck an der

Leitha", "Bezirkshauptmannschaft Gänserndorf", "Bezirkshauptmannschaft

Gmünd", "Bezirkshauptmannschaft Hollabrunn", "Bezirkshauptmannschaft

Horn", "Bezirkshauptmannschaft Korneuburg", "Bezirkshauptmannschaft Krems

an der Donau", "Bezirkshauptmannschaft Lilienfeld", "Bezirkshauptmannschaft

Melk", "Bezirkshauptmannschaft Mistelbach", "Bezirkshauptmannschaft

Mödling", "Bezirkshauptmannschaft Neunkirchen", "Bezirkshauptmannschaft St.

Pölten", "Bezirkshauptmannschaft Scheibbs", "Bezirkshauptmannschaft Tulln",

"Bezirkshauptmannschaft Waidhofen an der Thaya", "Bezirkshauptmannschaft

Wiener Neustadt", "Bezirkshauptmannschaft Zwettl", "Statutarstadt Wr.

Neustadt", "Statutarstadt Krems an der Donau", "Statutarstadt Waidhofen an

der Ybbs", "Statutarstadt St. Pölten", "Bezirkshauptmannschaft Imst",

"Bezirkshauptmannschaft Innsbruck", "Bezirkshauptmannschaft Kitzbühel",

"Bezirkshauptmannschaft Kufstein", "Bezirkshauptmannschaft Landeck",

OGD-RIS API Handbuch V2_6

Seite 34 von 60

"Bezirkshauptmannschaft Lienz", "Bezirkshauptmannschaft Reutte",

"Bezirkshauptmannschaft Schwaz", "Statutarstadt Innsbruck",

"Bezirkshauptmannschaft Braunau", "Bezirkshauptmannschaft Eferding",

"Bezirkshauptmannschaft Freistadt", "Bezirkshauptmannschaft Gmunden",

"Bezirkshauptmannschaft Grieskirchen", "Bezirkshauptmannschaft Kirchdorf",

"Bezirkshauptmannschaft Linz-Land", "Bezirkshauptmannschaft Perg",

"Bezirkshauptmannschaft Ried", "Bezirkshauptmannschaft Rohrbach",

"Bezirkshauptmannschaft Schärding", "Bezirkshauptmannschaft Steyr-Land",

"Bezirkshauptmannschaft Urfahr-Umgebung", "Bezirkshauptmannschaft

Vöcklabruck", "Bezirkshauptmannschaft Wels-Land", "Bezirkshauptmannschaft

Bludenz", "Bezirkshauptmannschaft Bregenz", "Bezirkshauptmannschaft

Dornbirn", "Bezirkshauptmannschaft Feldkirch", "Bezirkshauptmannschaft

Eisenstadt-Umgebung", "Bezirkshauptmannschaft Güssing",

"Bezirkshauptmannschaft Jennersdorf", "Bezirkshauptmannschaft Mattersburg",

"Bezirkshauptmannschaft Neusiedl am See", "Bezirkshauptmannschaft

Oberpullendorf", "Bezirkshauptmannschaft Oberwart",

"Bezirkshauptmannschaft Bruck-Mürzzuschlag", "Bezirkshauptmannschaft

Deutschlandsberg", "Bezirkshauptmannschaft Graz-Umgebung",

"Bezirkshauptmannschaft Hartberg-Fürstenfeld", "Bezirkshauptmannschaft

Leibnitz", "Bezirkshauptmannschaft Leoben", "Bezirkshauptmannschaft Liezen",

"Bezirkshauptmannschaft Murau", "Bezirkshauptmannschaft Murtal",

"Bezirkshauptmannschaft Südoststeiermark", "Bezirkshauptmannschaft

Voitsberg", "Bezirkshauptmannschaft Weiz"), Opt)

•  Kundmachungsnummer (ExactMatchSearchExpression, Opt)

•  Kundmachungsdatum (RangeDateInterval, Opt)

Kundmachungsdatum<spec>Von (YYYY-mm-dd, Opt)

Kundmachungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Sortierung (BvbSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kundmachungsdatum",

"Bezirksverwaltungsbehoerde"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

OGD-RIS API Handbuch V2_6

Seite 35 von 60

Abfrage Gemeinden/Rechtsnormen von Gemeinden

Query: <domain>/ris/api/<vers>/Gemeinden

Parameter:

•  Applikation (("Gr"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesland (("Burgenland", "Kaernten","Niederoesterreich", "Oberoesterreich",

"Salzburg ","Steiermark","Tirol ","Vorarlberg","Wien"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Gemeinde (PhraseSearchExpression, Opt)

•

Index (("Undefined", "VertretungskoerperUndAllgemeineVerwaltung",

"OeffentlicheOrdnungUndSicherheit",

"UnterrichtErziehungSportUndWissenschaft", "KunstKulturUndKultus" ,"

SozialeWohlfahrtUndWohnbaufoerderung", "Gesundheit",

"StraßenUndWasserbauVerkehr", "Wirtschaftsfoerderung", "Dienstleistungen",

"Finanzwirtschaft"), Opt)

•  FassungVom (date, YYYY-mm-dd, Opt)

•  Sortierung (GemeinderechtSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Bundesland",

"Gemeinde"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Gemeinden/Rechtsverbindliche Kundmachungen,
Verordnungen von Gemeinden

Query: <domain>/ris/api/<vers>/Gemeinden

Parameter:

•  Applikation (("GrA"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Bundesland (("Undefined", "Burgenland", "Kärnten", "Niederösterreich",

"Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"), Opt)

OGD-RIS API Handbuch V2_6

Seite 36 von 60

•  Bezirk (ExactMatchSearchExpression, Opt)

•  Gemeinde (ExactMatchSearchExpression, Opt)

•  Gemeindeverband (ExactMatchSearchExpression, Opt)

•  Kundmachungsnummer (ExactMatchSearchExpression, Opt)

•  Kundmachungsdatum (RangeDateInterval, Opt)

o  Kundmachungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Sortierung (GemeinderechtSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kundmachungsdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Verfassungsgerichtshof (VfGH)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Vfgh"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis",

"Vergleich",“KeineAngabe“), Opt)

•

Index (PhraseSearchExpression, Opt)

•  Sammlungsnummer (TermSearchExpression, Opt)

•  Sortierung (VfghSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ"), Mand)

o

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

OGD-RIS API Handbuch V2_6

Seite 37 von 60

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Verwaltungsgerichtshof (VwGH)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Vwgh"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis",

"BeschlussVS","ErkenntnisVS"), Opt)

•

Index (PhraseSearchExpression, Opt)

•  Sammlungsnummer (PhraseSearchExpression, Opt)

•  Sortierung (VwghSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, integer, Opt)

Abfrage Judikatur/Normenliste des Verwaltungsgerichtshofes

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Normenliste"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•

Index (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 38 von 60

•  Typ (FulltextSearchExpression, Opt)

•  Kundmachungsorgan (PhraseSearchExpression, Opt)

•  Sortierung (NormenlisteSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kurzinformation"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Justiz

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Justiz"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp (("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Rechtsgebiet (("Zivilrecht", "Strafrecht"), Opt)

•  Fachgebiet (("Amtsdelikte/Korruption ", "Amtshaftung inkl. StEG

","Anfechtungsrecht","Arbeitsrecht","Bestandrecht","Datenschutzrecht","Erbrec

ht und Verlassenschaftsverfahren", "Erwachsenenschutzrecht",

"Exekutionsrecht", "Familienrecht (ohne Unterhalt)","

Finanzstrafsachen","Gewerblicher

Rechtsschutz","Grundbuchsrecht","Grundrechte","Insolvenzrecht","Internationa

les Privat- und Zivilverfahrensrecht", "Jugendstrafsachen", "Kartellrecht",

"Klauselentscheidungen", "Konsumentenschutz und Produkthaftung",

"Medienrecht","Persönlichkeitsschutzrecht","Schadenersatz nach

Verkehrsunfall",

"Schlepperei/FPG","Schiedsverfahrensrecht","Sexualdelikte","Sozialrecht","Stan

des- und Disziplinarrecht für Anwälte", "Suchtgiftdelikte", "Transportrecht",

"Unionsrecht","Unterbringungs- und Heimaufenthaltsrecht">Unterbringungs-

und Heimaufenthaltsrecht","Unterhaltsrecht inkl. UVG","Unternehmens-,

OGD-RIS API Handbuch V2_6

Seite 39 von 60

Gesellschafts- und Wertpapierrecht", "Urheberrecht",

"Versicherungsvertragsrecht",

"Wirtschaftsstrafsachen","Wohnungseigentumsrecht","Zivilverfahrensrecht"),

Opt)

•  Gericht (FulltextSearchExpression, Opt)

•  Rechtssatznummer (FulltextSearchExpression, Opt)

•  Entscheidungsart (("Ordentliche Erledigung (Sachentscheidung)",

"Zurückweisung mangels erheblicher Rechtsfrage","Zurückweisung aus anderen

Gründen", "Verstärkter Senat"), Opt))

•  RechtlicheBeurteilung (FulltextSearchExpression, Opt)

•  Spruch (FulltextSearchExpression, Opt)

•  Fundstelle (FulltextSearchExpression, Opt)

•  AenderungenSeit (NamedDateInterval, Opt)

AenderungenSeit<spec>Periode (("Undefined", "EinerWoche",

"ZweiWochen",

"EinemMonat", "DreiMonaten", "SechsMonaten", "EinemJahr"), Mand)

•  Sortierung (JustizSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Gericht",

"Typ", "Kurzinformation")

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Bundesverwaltungsgericht (BVwG)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Bvwg"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

OGD-RIS API Handbuch V2_6

Seite 40 von 60

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis"), Opt)

•  Sortierung (BvwgSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Landesverwaltungsgerichte (LVwG)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Lvwg"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis", "Bescheid"), Opt)

•

 Bundesland ("Undefined", "Burgenland", "Kaernten", "Niederoesterreich",

"Oberoesterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"), Opt)

•  Sortierung (LvwgSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ", "Gericht"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Datenschutzbehörde, Datenschutzkommission

Query: <domain>/ris/api/<vers>/Judikatur

OGD-RIS API Handbuch V2_6

Seite 41 von 60

Parameter:

•  Applikation (("Dsk"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "BescheidBeschwerde",

"BescheidAmtswegigesPruefverfahren","VerwaltungsstraferkenntnisVerwarnun

gErmahnung", "BescheidWissenschaftStatistikArchiv",

"BescheidInternatDatenverkehr", "BescheidAkkreditierungZertifizierung",

"BescheidVerhaltensregeln", "BescheidWarnung", "BescheidRegistrierung",

"BescheidSonstiger", "Empfehlung", "Verfahrensschriftsaetze"), Opt)

•  EntscheidendeBehoerde(("Undefined", "Datenschutzkommission",

"Datenschutzbehoerde"), Opt)

•  Sortierung (DskSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Bundesdisziplinarbehörde, Disziplinarkommissionen

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Dok"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

OGD-RIS API Handbuch V2_6

Seite 42 von 60

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  EntscheidendeBehoerde (ExactMatchSearchExpression,(

"Bundesdisziplinarbehörde", "Parlamentsdirektion", "Rechnungshof",

"Volksanwaltschaft", "Berufungskommission", "Disziplinaroberkommission",

"Bildungsdirektion Burgenland", "Bildungsdirektion Kärnten", "Bildungsdirektion

Niederösterreich", "Bildungsdirektion Oberösterreich", "Bildungsdirektion

Salzburg", "Bildungsdirektion Steiermark", "Bildungsdirektion Tirol",

"Bildungsdirektion Vorarlberg", "Bildungsdirektion Wien", "Bundeskanzleramt",

"BM für Arbeit, Familie und Jugend", "BM für Arbeit, Soziales und

Konsumentenschutz", "BM für Arbeit, Soziales, Gesundheit und

Konsumentenschutz", "BM für Bildung und Frauen", "BM für Bildung", "BM für

Bildung, Wissenschaft und Forschung", "BM für Digitalisierung und

Wirtschaftsstandort", "BM für Europa, Integration und Äußeres", "BM für

europäische und internationale Angelegenheiten", "BM für Familien und

Jugend", "BM für Finanzen", "BM für Gesundheit und Frauen", "BM für

Gesundheit", "BM für Inneres", "BM für Justiz", "BM für Klimaschutz, Umwelt,

Energie, Mobilität, Innovation und Technologie", "BM für Kunst, Kultur,

öffentlichen Dienst und Sport", "BM für Land- u. Forstwirtschaft, Umwelt und

Wasserwirtschaft", "BM für Landesverteidigung und Sport", "BM für

Landesverteidigung", "BM für Landwirtschaft, Regionen und Tourismus", "BM

für Nachhaltigkeit und Tourismus", "BM für öffentlichen Dienst und Sport", "BM

für Soziales, Gesundheit, Pflege und Konsumentenschutz", "BM für Unterricht,

Kunst und Kultur", "BM für Verfassung, Reformen, Deregulierung und Justiz",

"BM für Verkehr, Innovation und Technologie", "BM für Wirtschaft, Familie und

Jugend", "BM für Wissenschaft und Forschung", "BM für Wissenschaft,

Forschung und Wirtschaft", "Bundesfinanzgericht", "Land Kärnten", "Land

Salzburg", "Land Tirol", "Land Vorarlberg", "Landesschulrat Burgenland",

"Landesschulrat Niederösterreich", "Landesschulrat Oberösterreich",

"Landesschulrat Steiermark", "Präsidentschaftskanzlei", "Stadtschulrat Wien",

"Verfassungsgerichtshof", "Verwaltungsgerichtshof"), Opt)

•  Sortierung (DokSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Behoerde",

"Datum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

OGD-RIS API Handbuch V2_6

Seite 43 von 60

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Personalvertretungsaufsichtsbehörde,
Personalvertretungs-Aufsichtskommission

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Pvak"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  EntscheidendeBehoerde(("Undefined",

"PersonalvertretungsAufsichtskommission",

"Personalvertretungsaufsichtsbehoerde"), Opt)

•  Sortierung (PvakSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Bundes-Gleichbehandlungskommission,
Gleichbehandlungskommission

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Gbk"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

OGD-RIS API Handbuch V2_6

Seite 44 von 60

•  Entscheidungsart (("Undefined", "Einzelfallpruefungsergebnis", "Gutachten"),

Opt)

•  Kommission (("Undefined", "BundesGleichbehandlungskommission",

"Gleichbehandlungskommission"), Opt)

•  Senat (("Undefined", "I", "II", "III"), Opt)

•  Diskriminierungsgrund (("Undefined", "Geschlecht", "EthnischeZugehoerigkeit",

"Religion", "Weltanschauung", "Alter", "SexuelleOrientierung",

"Mehrfachdiskriminierung"),Opt)

•  Sortierung (GbkSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Kommission",

"Senat", "Datum" ,"Diskriminierungsgrund"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Unabhängige Verwaltungssenate (UVS)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Uvs"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis", "Bescheid"), Opt)

•  Bundesland ("Undefined", "Burgenland", "Kaernten", "Niederoesterreich",

"Oberoesterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"), Opt)

•

Index (PhraseSearchExpression, Opt)

•  Sammlungsnummer (PhraseSearchExpression, Opt)

•  Sortierung (UvsSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)

OGD-RIS API Handbuch V2_6

Seite 45 von 60

o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Behoerde",

"Datum", "Art", "Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Asylgerichtshof (AsylGH)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("AsylGH"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Beschluss", "Erkenntnis",

"ErkenntnisGrundsatzentscheidung", "ErkenntnisVerstaerkterSenat",

"Bescheid"), Opt)

•  Sortierung (AsylGHSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", " Datum", " Art "

,”Typ "), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Unabhängiger Bundesasylsenat (UBAS)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Ubas"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 46 von 60

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Bescheid ", “Ersatzbescheid"), Opt)

•  Verfasser (PhraseSearchExpression, Opt)

•

Index (PhraseSearchExpression, Opt)

•  Spruch (FulltextSearchExpression, Opt)

•  Sortierung (UbasSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Umweltsenat (UMSE)

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

Applikation (("Umse"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Kurzbezeichnung (FulltextSearchExpression, Opt)

•  Sortierung (UmseSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Art",

"Typ", “Kurzinformation”), Mand)

OGD-RIS API Handbuch V2_6

Seite 47 von 60

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Bundeskommunikationssenat

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Bks"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Bereich (ExactMatchSearchExpression,( "Audiovisuelle Mediendienste-Gesetz",

"Fernseh-Exklusivrechtegesetz", "KommAustria-Gesetz", "ORF-Gesetz",

"Privatfernsehgesetz", "Privatradiogesetz", "Telekommunikationsgesetz 2003"),

Opt)

•  Sortierung (BksSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Datum", "Bereich",

"Typ", “Rechtsnorm”), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Judikatur/Vergabekontrollbehörden

Query: <domain>/ris/api/<vers>/Judikatur

Parameter:

•  Applikation (("Verg"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 48 von 60

•  Dokumenttyp<spec>(("SucheInRechtssaetzen"="true" |

"SucheInEntscheidungstexten"="true"), Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  EntscheidungsdatumVon (YYYY-mm-dd, Opt)

•  EntscheidungsdatumBis (YYYY-mm-dd, Opt)

•  Entscheidungsart (("Undefined", "Bescheid ", "Beschluss", "Empfehlung",

"Gutachten", "Vorabentscheidungsantrag", "Vorabentscheidung"), Opt)

•  EntscheidendeBehoerde (TermSearchExpression, ("Bundesvergabeamt",
"Bundes-Vergabekontrollkommission", "Vergabekontrollsenat Salzburg",

"Vergabekontrollsenat Wien"), Opt)

•  Sortierung (VergSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl", "Behoerde",

"Datum", "Art", "Typ"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Prüfungsordnungen gemäß
Gewerbeordnung

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("PruefGewO"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Typ (("Undefined", "Befaehigungspruefungsordnung",

"Meisterpruefungsordnung"), Opt)

•  Kundmachungsdatum (RangeDateInterval, Opt)

o  Kundmachungsdatum <spec>Von (YYYY-mm-dd, Opt)
o  Kundmachungsdatum <spec>Bis (YYYY-mm-dd, Opt)

•  Fassung (Fassungsangabe, Opt)

o  Fassung<spec>FassungVom (YYYY-mm-dd, Mand)
o  oder
o  Fassung<spec>VonInkrafttretensdatum (YYYY-mm-dd, Opt)

OGD-RIS API Handbuch V2_6

Seite 49 von 60

o  Fassung<spec>BisInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>VonAusserkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisAusserkrafttretensdatum (YYYY-mm-dd, Opt)

•  Sortierung (PruefGewOSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Kundmachungsdatum", "

Kurzinformation", "Inkrafttretensdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Amtliche Verlautbarungen der
Sozialversicherung - authentisch ab 2002

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Avsv"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Dokumentart (FulltextSearchExpression, Opt)

•  Urheber (ExactMatchSearchExpression, ("Undefined", "Österreichische

Gesundheitskasse (ÖGK)", "Sozialversicherungsanstalt der Selbständigen (SVS)",

"Versicherungsanstalt öffentlich Bediensteter, Eisenbahnen und Bergbau

(BVAEB)", "Allgemeine Unfallversicherungsanstalt (AUVA)",

"Pensionsversicherungsanstalt (PVA)", "Pensionsinstitut der Linz AG (PI Linz

AG)", "Dachverband der Sozialversicherungsträger (DVSV)", "DVSV

Gesamtvertrag", "ÖGK Gesamtvertrag", "SVS Gesamtvertrag", "BVAEB

Gesamtvertrag", "Bundesschiedskommission (BSK)", "Wiener

Gebietskrankenkasse (WGKK)", "Niederösterreichische Gebietskrankenkasse

(NÖGKK)", "Burgenländische Gebietskrankenkasse (BGKK)",

"Oberösterreichische Gebietskrankenkasse (OÖGKK)", "Steiermärkische

Gebietskrankenkasse (STGKK)", "Kärntner Gebietskrankenkasse (KGKK)",

"Salzburger Gebietskrankenkasse (SGKK)", "Tiroler Gebietskrankenkasse

(TGKK)", "Vorarlberger Gebietskrankenkasse (VGKK)",

"Sozialversicherungsanstalt der gewerblichen Wirtschaft (SVA)",

"Sozialversicherungsanstalt der Bauern (SVB)", "Versicherungsanstalt öffentlich

OGD-RIS API Handbuch V2_6

Seite 50 von 60

Bediensteter (BVA)", "Versicherungsanstalt für Eisenbahnen und Bergbau

(VAEB)", "Hauptverband der österreichischen Sozialversicherungsträger (HVSV)",

"Versicherungsanstalt des österreichischen Bergbaues", "Versicherungsanstalt

der österreichischen Eisenbahnen", "Pensionsversicherungsanstalt der

Angestellten", "Pensionsversicherungsanstalt der Arbeiter",

"Betriebskrankenkasse der Wiener Verkehrsbetriebe (BKK-WVB)",

"Betriebskrankenkasse Mondi (BKK Mondi)", "Betriebskrankenkasse voestalpine

Bahnsysteme (BKK-VA)", "Betriebskrankenkasse Zeltweg (BKK-ZW)",

"Betriebskrankenkasse Kapfenberg (BKK-KA)", "Betriebskrankenkasse Austria

Tabak (BKK-AT)", "Betriebskrankenkasse Mondi Business Paper",

"Betriebskrankenkasse Neusiedler", "Betriebskrankenkasse Alpine Donawitz",

"Betriebskrankenkasse Semperit", "Betriebskrankenkasse Kindberg",

"Betriebskrankenkasse Pengg", "Pensionsinstitut für Verkehr und öffentliche

Einrichtungen", "HVSV Gesamtvertrag", "Wiener Gesamtvertrag",

"Niederösterreichischer Gesamtvertrag", "Burgenländischer Gesamtvertrag",

"Oberösterreichischer Gesamtvertrag", "Steiermärkischer Gesamtvertrag",

"Kärntner Gesamtvertrag", "Salzburger Gesamtvertrag", "Tiroler

Gesamtvertrag", "Vorarlberger Gesamtvertrag", "SVA Gesamtvertrag", "SVB

Gesamtvertrag", "BVA Gesamtvertrag", "VAEB Gesamtvertrag"), Opt)

•  Kundmachung (DateInterval, Opt)

o  Kundmachung<spec>Periode (("Undefined", "EinerWoche", "ZweiWochen",
"EinemMonat", "DreiMonaten", "SechsMonaten", "EinemJahr"), Mand)

o  oder
o  Kundmachung<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachung<spec>Bis (YYYY-mm-dd, Opt)

•  Avsvnummer (ExactMatchSearchExpression, Opt)

•  Sortierung (AvsvSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Avsvnummer",

"Kundmachungsdatum", "Einbringer", "Kurzinformation"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

OGD-RIS API Handbuch V2_6

Seite 51 von 60

Abfrage Kundmachungen, Erlässe/Strukturpläne Gesundheit (ÖSG,
RSG)

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Spg"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Spgnummer (Opt)

•  OsgSuchEinschraenkung (OsgSuchEinschraenkung, Opt)

o  OsgSuchEinschraenkung<spec>SpgStrukturplanType (("Alle", "Gutachten",

"Verordnungen"), Mand)

•  RsgSuchEinschraenkung (RsgSuchEinschraenkung, Opt)

o  RsgSuchEinschraenkung<spec>SpgStrukturplanType (("Alle", "Gutachten",

"Verordnungen"), Mand)

o  RsgSuchEinschraenkung<spec>Land (("Burgenland", "Kaernten",

"Niederoesterreich", "Oberoestereich", "Salzburg",

"Steiermark","Tirol","Vorarlberg","Wien"), Mand)

•  Kundmachungsdatum (RangeDateInterval, Opt)

o  Kundmachungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Fassung (Fassungsangabe, Opt)

o  Fassung<spec>FassungVom (YYYY-mm-dd, Mand)
o  oder
o  Fassung<spec>VonInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>VonAusserkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisAusserkrafttretensdatum (YYYY-mm-dd, Opt)

•  Sortierung (SpgSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Inkrafttretensdatum", "Spgnummer",

"Kurzinformation"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat"

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

OGD-RIS API Handbuch V2_6

Seite 52 von 60

Abfrage Kundmachungen, Erlässe/Amtliche Veterinärnachrichten
(AVN) ab 15.09.2004

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Avn"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

•  Avnnummer (PhraseSearchExpression, Opt)

•  Typ<spec>(("SucheInKundmachungen"="true" |

"SucheInVeroeffentlichungenAufGrundVEVO"="true" |

"SucheInSonstigeVeroeffentlichungen"="true"), Opt)

•  Kundmachung (DateInterval, Opt))

o  Kundmachung<spec>Periode (("Undefined", "EinerWoche", "ZweiWochen",
"EinemMonat", "DreiMonaten", "SechsMonaten", "EinemJahr"), Mand)

o  oder
o  Kundmachung<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachung<spec>Bis (YYYY-mm-dd, Opt)

•  FassungVom (YYYY-mm-dd, Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  Sortierung (AvnSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Avnnummer", "Kundmachungsdatum",

"Kurzinformation"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Kundmachungen der Gerichte

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("KmGer"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Titel (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 53 von 60

•  Typ (("Geschaeftsordnung", "Geschaeftsverteilung"), Opt)

•  Gericht (("LVwG Tirol ", "LVwG Vorarlberg "), Opt)

•  Kundmachungsdatum (RangeDateInterval, Opt)

o  Kundmachungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Kundmachungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Fassung (Fassungsangabe, Opt)

o  Fassung<spec>FassungVom (YYYY-mm-dd, Mand)
o  oder
o  Fassung<spec>VonInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisInkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>VonAusserkrafttretensdatum (YYYY-mm-dd, Opt)
o  Fassung<spec>BisAusserkrafttretensdatum (YYYY-mm-dd, Opt)

•  Sortierung (KmGerSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Gericht","Kurzinformation",

"Inkrafttretensdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Entscheidungen des unabhängigen
Parteien-Transparenz-Senats

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Upts"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Entscheidungsdatum (RangeDateInterval, Opt)

o  Entscheidungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Entscheidungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Partei (("ÖVP (Österreichische Volkspartei)", "SPÖ (Sozialdemokratische Partei

Österreichs)", "FPÖ (Freiheitliche Partei Österreichs)", "KPÖ (Kommunistische

Partei Österreichs)", "BZÖ (Bündnis für die Zukunft Österreichs)", "Team

Stronach (Team Stronach für Österreich)"), Opt)

•  GZ (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 54 von 60

•  Sortierung (UptsSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("GZ","Partei", "Entscheidungsdatum"),

Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Ministerratsprotokolle

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Mrp"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

•  Einbringer (ExactMatchSearchExpression, ("BKA (Bundeskanzleramt)", " BMFFIM

(Bundesministerin für Frauen, Familie, Integration und Medien im

Bundeskanzleramt", "BMEUV (Bundesministerin für EU und Verfassung im

Bundeskanzleramt)", "BMKOES (Bundesministerium für Kunst, Kultur,

öffentlichen Dienst und Sport)", "BMEIA (Bundesministerium für europäische

und internationale Angelegenheiten)", "BMAW (Bundesministerium für Arbeit

und Wirtschaft)", "BMBWF (Bundesministerium für Bildung, Wissenschaft und

Forschung)", "BMF (Bundesministerium für Finanzen)", "BMI

(Bundesministerium für Inneres)", "BMJ (Bundesministerium für Justiz)", "BMK

(Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und

Technologie)", "BMLV (Bundesministerium für Landesverteidigung)", "BML

(Bundesministerium für Land- und Forstwirtschaft, Regionen und

Wasserwirtschaft)", "BMSGPK (Bundesministerium für Soziales, Gesundheit,

Pflege und Konsumentenschutz)", "BMAA (Bundesministerium für auswärtige

Angelegenheiten)", "BMA (Bundesministerium für Arbeit)", "BMASK

(Bundesministerium für Arbeit, Soziales und Konsumentenschutz)", "BMASGK

(Bundesministerium für Arbeit, Soziales, Gesundheit und

Konsumentenschutz)","BMAFJ (Bundesministerium für Arbeit, Familie und

Jugend)", "BMB (Bundesministerium für Bildung)", "BMBF (Bundesministerium

für Bildung und Frauen)", "BMBWK (Bundesministerium für Bildung,

Wissenschaft und Kultur)", "BMDW (Bundesministerium für Digitalisierung und

Wirtschaftsstandort)", "BMEIA (Bundesministerium für Europa, Integration und

OGD-RIS API Handbuch V2_6

Seite 55 von 60

Äußeres)", "BMFJ (Bundesministerium für Familien und Jugend)", "BMG

(Bundesministerium für Gesundheit)", "BMGF (Bundesministerium für

Gesundheit und Frauen)", "BMGFJ (Bundesministerium für Gesundheit, Familie

und Jugend)", " BMLRT (Bundesministerium für Landwirtschaft, Regionen und

Tourismus)", "BMLFUW (Bundesministerium für Land- und Forstwirtschaft,

Umwelt und Wasserwirtschaft)", "BMLVS (Bundesministerium für

Landesverteidigung und Sport)"," BMNT (Bundesministerium für Nachhaltigkeit

und Tourismus)"," BMOEDS (Bundesministerium für öffentlichen Dienst und

Sport)"," BMSG (Bundesministerium für soziale Sicherheit, Generationen und

Konsumentenschutz)", "BMSK (Bundesministerium für Soziales und

Konsumentenschutz)", "BMUKK (Bundesministerium für Unterricht, Kunst und

Kultur)", " BMVRDJ (Bundesministerium für Verfassung, Reformen,

Deregulierung und Justiz)", "BMVIT (Bundesministerium für Verkehr, Innovation

und Technologie)", "BMWA (Bundesministerium für Wirtschaft und Arbeit)",

"BMWF (Bundesministerium für Wissenschaft und Forschung)"," BMWFJ

(Bundesministerium für Wirtschaft, Familie und Jugend)"," BMWFW

(Bundesministerium für Wissenschaft, Forschung und Wirtschaft)"), Opt)

•  Sitzungsdatum (RangeDateInterval, Opt)

o  Sitzungsdatum<spec>Von (YYYY-mm-dd, Opt)
o  Sitzungsdatum<spec>Bis (YYYY-mm-dd, Opt)

•  Sitzungsnummer (ExactMatchSearchExpression, Opt)

•  Gesetzgebungsperiode (ExactMatchSearchExpression, ("XXVII", "XXVI",

"XXV"),Opt)

•  Sortierung (MrpSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Sitzungsdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage Kundmachungen, Erlässe/Erlässe der Bundesministerien

Query: <domain>/ris/api/<vers>/Sonstige

Parameter:

•  Applikation (("Erlaesse"), Mand)

•  Suchworte (FulltextSearchExpression, Opt)

OGD-RIS API Handbuch V2_6

Seite 56 von 60

•  Titel (FulltextSearchExpression, Opt)

•  VonInkrafttretensdatum (YYYY-mm-dd, Opt)

•  BisInkrafttretensdatum (YYYY-mm-dd, Opt)

•  FassungVom (YYYY-mm-dd, Opt)

•  Bundesministerium (ExactMatchSearchExpression, ("Bundeskanzleramt",
"Bundesministerium für Kunst, Kultur, öffentlichen Dienst und Sport",

"Bundesministerium für europäische und internationale Angelegenheiten",

"Bundesministerium für Arbeit", "Bundesministerium für Arbeit und Wirtschaft",

"Bundesministerium für Bildung, Wissenschaft und Forschung",

"Bundesministerium für Digitalisierung und Wirtschaftsstandort",

"Bundesministerium für Finanzen", "Bundesministerium für Inneres",

"Bundesministerium für Justiz", "Bundesministerium für Klimaschutz, Umwelt,

Energie, Mobilität, Innovation und Technologie", "Bundesministerium für

Landesverteidigung", "Bundesministerium für Landwirtschaft, Regionen und

Tourismus", "Bundesministerium für Land- und Forstwirtschaft, Regionen und

Wasserwirtschaft", "Bundesministerium für Soziales, Gesundheit, Pflege und

Konsumentenschutz", "Bundesministerium für Arbeit","Bundesministerium für

Arbeit und Soziales", "Bundesministerium für Arbeit, Gesundheit und Soziales",

"Bundesministerium für Arbeit, Soziales und Konsumentenschutz",

"Bundesministerium für Arbeit, Soziales, Gesundheit und Konsumentenschutz",

"Bundesministerium für Arbeit, Familie und Jugend", "Bundesministerium für

auswärtige Angelegenheiten", "Bundesministerium für Auswärtige

Angelegenheiten", "Bundesministerium für Bauten und Technik",

"Bundesministerium für Bildung", "Bundesministerium für Bildung und Frauen",

"Bundesministerium für Bildung, Wissenschaft und Kultur", "Bundesministerium

für Digitalisierung und Wirtschaftsstandort","Bundesministerium für Europa,

Integration und Äußeres", "Bundesministerium für Familie, Jugend und

Konsumentenschutz", "Bundesministerium für Familien und Jugend",

"Bundesministerium für Gesundheit", "Bundesministerium für Gesundheit,

Familie und Jugend", "Bundesministerium für Gesundheit, Sport und

Konsumentenschutz", "Bundesministerium für Gesundheit und Frauen",

"Bundesministerium für Gesundheit und Konsumentenschutz",

"Bundesministerium für Gesundheit und Umweltschutz", "Bundesministerium

für Handel, Gewerbe und Industrie", "Bundesministerium für Jugend und

Familie", "Bundesministerium für Landwirtschaft, Regionen und

Tourismus","Bundesministerium für Land- und Forstwirtschaft, Umwelt und

Wasserwirtschaft", "Bundesministerium für Land- und Forstwirtschaft",

OGD-RIS API Handbuch V2_6

Seite 57 von 60

"Bundesministerium für Landesverteidigung und Sport", "Bundesministerium für

Nachhaltigkeit und Tourismus", "Bundesministerium für öffentlichen Dienst und

Sport", "Bundesministerium für öffentliche Leistung und Sport",

"Bundesministerium für öffentliche Wirtschaft und Verkehr",

"Bundesministerium für soziale Sicherheit und Generationen",

"Bundesministerium für soziale Sicherheit, Generationen und

Konsumentenschutz", "Bundesministerium für soziale Verwaltung",

"Bundesministerium für Soziales und Konsumentenschutz", "Bundesministerium

für Umwelt, Jugend und Familie", "Bundesministerium für Unterricht und

kulturelle Angelegenheiten", "Bundesministerium für Unterricht und Kunst",

"Bundesministerium für Unterricht, Kunst und Kultur", "Bundesministerium für

Unterricht, Kunst und Sport", "Bundesministerium für Verfassung, Reformen,

Deregulierung und Justiz", "Bundesministerium für Verkehr, Innovation und

Technologie", "Bundesministerium für Wirtschaft und Arbeit",

"Bundesministerium für Wirtschaft, Familie und Jugend", "Bundesministerium

für wirtschaftliche Angelegenheiten", "Bundesministerium für Wissenschaft und

Forschung", "Bundesministerium für Wissenschaft und Verkehr",

"Bundesministerium für Wissenschaft, Forschung und Wirtschaft",

"Bundesministerium für Wissenschaft, Forschung und Kunst",

"Bundesministerium für Wissenschaft, Verkehr und Kunst"),Opt)

•  Abteilung (PhraseSearchExpression, Opt)

•  Fundstelle (PhraseSearchExpression, Opt)

•  Geschaeftszahl (FulltextSearchExpression, Opt)

•  Norm (FulltextSearchExpression, Opt)

•  Sortierung (ErlaesseSortExpression, Opt)

o  Sortierung<spec>SortDirection (("Ascending", "Descending"), Mand)
o  Sortierung<spec>SortedByColumn (("Geschaeftszahl"," Bundesministerium",

" Genehmigungsdatum"), Mand)

•

ImRisSeit (("Undefined", "EinerWoche", "ZweiWochen", "EinemMonat",

"DreiMonaten", "SechsMonaten", "EinemJahr"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Abfrage History (Änderungen)

Query: <domain>/ris/api/<vers>/History

Parameter:

OGD-RIS API Handbuch V2_6

Seite 58 von 60

•  Anwendung

("AsylGH","Avn","Avsv","Begut","BgblAlt","BgblAuth","BgblPdf","Bks",

"Bundesnormen","Bvb","Bvwg","Dok","Dsk","Erlaesse","Erv","Gbk","Gemeinder

echt","GemeinderechtAuth","Justiz","KmGer","Lgbl","LgblAuth","LgblNO","Land

esnormen","Lvwg","Mrp","Normenliste","PruefGewO","Pvak","RegV","Spg","Ub

as","Umse", "Upts","Uvs","Vbl","Verg","Vfgh","Vwgh"), Mand)

•  AenderungenVon (YYYY-mm-dd, Opt)

•  AenderungenBis (YYYY-mm-dd, Opt)

•

IncludeDeletedDocuments (("True"), Opt)

•  DokumenteProSeite (("Ten", "Twenty", "Fifty", "OneHundred"), Opt)

•  Seitennummer (1 - n, Opt)

Anwendungsbeispiele (http Post)

<domain>/ris/api/<vers>/content/examples.zip

Fehlermeldungen und Warnungen

Auf Seite von RIS-OGD API im folgendem Format:

{
  "OgdSearchResult": {
    "Error": {
      "Applikation": "Landesnormen",
      "Message": "soap:Client. Schema Validation Error: The
        'http://ris.bka.gv.at/ogd/V2_6:ImRisSeit' element is
        invalid
      The value 'Undef' is invalid according to its datatype
      'http://ris.bka.gv.at/ogd/V2_6:ChangeSetInterval' –
      The Enumeration constraint failed."
    }
  }
}

{
  "OgdSearchResult": {
    "Error": {
      "Applikation": "Landesnormen",
      "Message": "soap:Client Die Seitennummer ist höher als die
        Anzahl der verfügbaren Seiten"
    }

OGD-RIS API Handbuch V2_6

Seite 59 von 60

  }
}

{
  "OgdSearchResult": {
    "Error": {
      "Applikation": "BgblPdf",
      "Message": "soap:Client.Validation:Die eingegebene
        Suchabfrage ist ungültig: Die Eingabe \"3*\" enthält zu
        wenige Zeichen vor oder nach dem Platzhalter (*). Es
        müssen mindestens 2 Zeichen vor und nach dem Platzhalter
        sein. Bitte korrigieren Sie Ihre Eingabe."
    }
  }
}

{
  "OgdSearchResult": {
    "Error": {
      "Applikation": "Undefined",
      "Message": "soap:Client. Schema Validation Error: The
          element 'Bundesrecht' in namespace
        'http://ris.bka.gv.at/ogd/V2_6' has
        element 'Bgbl' in namespace
        'http://ris.bka.gv.at/ogd/V2_6'. List of possible
        elements expected: 'BrKons, BgblAuth, BgblPdf, BgblAlt,
        Begut, RegV, Erv' in
        namespace'http://ris.bka.gv.at/ogd/V2_6'."
    }
  }
}

invalid child

Bei einem Fehler seitens des Servers wird zusätzlich der http Statuscode 500

zurückgeliefert.

OGD-RIS API Handbuch V2_6

Seite 60 von 60

