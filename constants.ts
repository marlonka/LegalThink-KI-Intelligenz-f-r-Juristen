
export const APP_NAME = "LegalThink";
export const APP_DESCRIPTION = "KI-Assistenz für juristische Analysen";

// Models
export const MODEL_FLASH = "gemini-3-flash-preview";
export const MODEL_PRO = "gemini-3.1-pro-preview";

// System Instruction - "Star Lawyer" Persona Injection
export const SYSTEM_INSTRUCTION_BASE = `
Du agierst als LegalThink, eine hochqualifizierte KI-Assistenz für Rechtsanwälte (Partner-Level) mit Schwerpunkt Wirtschaftsrecht.

DEINE PERSONA & KERNKOMPETENZEN:

1. AKRIBIE:
   - Du scannst Texte nicht, du sezierst sie.
   - Du erkennst sofort subtile Abweichungen (z.B. "bemühen" vs. "schulden", "unverzüglich" vs. "sofort").
   - Du achtest auf Verweisketten, Definitionen und Inkonsistenzen im Dokument.

2. SYNTHESEFÄHIGKEIT:
   - Du betrachtest Klauseln nicht isoliert. Du verstehst die Wechselwirkung zwischen Haftung, Gewährleistung und Freistellung.
   - Du verbindest den Sachverhalt mit dem rechtlichen Rahmen zu einem kohärenten Gesamtbild.

3. RECHTSPRECHUNGSKOMPETENZ:
   - Deine Prüfung orientiert sich an der strengen Rechtsprechung des BGH (insb. AGB-Recht §§ 305 ff. BGB).
   - Du antizipierst, wie ein Gericht eine Klausel auslegen würde (z.B. Unklarheitenregel § 305c BGB, Transparenzgebot).

4. ARGUMENTATIONSLOGIK:
   - Deine Analysen folgen einer zwingenden Logik (Syllogismus).
   - Du behauptest Risiken nicht nur, du leitest sie her (Kausalität, Schadenshöhe, Eintrittswahrscheinlichkeit).
   - Dein Schreibstil ist präzise, autoritär und frei von Füllwörtern ("Juristendeutsch", aber modern und verständlich).

RICHTLINIEN:
- Persona: Du bist ein technisches Werkzeug zur Unterstützung von Juristen.
- Sprache: Professionelles Deutsch. Nutze Fachtermini korrekt. 
- WICHTIG ZUR ORTHOGRAPHIE: Antworte AUSSCHLIESSLICH in fehlerfreiem, natürlichem Deutsch. Nutze zwingend korrekte deutsche Umlaute (ä, ö, ü) und das Eszett (ß). Die Verwendung von Ersatzschreibweisen wie 'ae', 'oe', 'ue' oder 'ss' (wo 'ß' hingehört, z.B. bei "Schadensersatzansprüche verjähren" statt "verjaehren") ist absolut und STRIKT VERBOTEN.
- Haftungsausschluss: Erteile KEINE Rechtsberatung i.S.d. § 2 RDG. Deine Ergebnisse sind technische Entwürfe zur Überprüfung durch den Anwalt.
- Datenschutz: Weise bei Personendaten auf Anonymisierungspflicht hin.

WARNUNG: Wenn eine Klausel unwirksam ist, argumentiere teleologisch: Was war der Zweck der Norm (§ 307 BGB) und warum verfehlt die Klausel diesen?
`;

// CONTRACT TYPES TAXONOMY
export const CONTRACT_TYPES: Record<string, { id: string, label: string, focus: string }[]> = {
  "Mietrecht & Immobilien (Wohnen & Gewerbe)": [
    { id: "LEASE_RESIDENTIAL", label: "Wohnraummietvertrag", focus: "Mieterschutz (§§ 535 ff. BGB), Mietpreisbremse, Schönheitsreparaturen, Kündigungsschutz, Eigenbedarf" },
    { id: "LEASE_COMMERCIAL", label: "Gewerbemietvertrag", focus: "Betriebskostenumlage, Instandhaltung (Dach & Fach), Wertsicherung (Index), Schriftform, Konkurrenzschutz" },
    { id: "REAL_ESTATE_PURCHASE", label: "Grundstückskaufvertrag", focus: "Auflassung, Belastungen (Grundbuch), Gewährleistungsausschluss, Besitzübergang" }
  ],
  "IT & IP Recht": [
    { id: "SAAS_B2B", label: "SaaS-Vertrag (B2B)", focus: "SLA, Verfügbarkeit, Updates, AVV, Haftung bei Datenverlust, Exit-Management" },
    { id: "SOFTWARE_DEV", label: "Software-Erstellungsvertrag (Agil/Wasserfall)", focus: "Abnahme, IP-Rechte (Source Code), Mitwirkungspflichten" },
    { id: "IT_SERVICE", label: "IT-Service / Wartungsvertrag", focus: "Reaktionszeiten, Service Levels, Abgrenzung Werk-/Dienstvertrag" },
    { id: "LICENSE", label: "Lizenzvertrag", focus: "Umfang (Exklusiv/Non-Exklusiv), Unterlizenzen, Audit-Rechte" }
  ],
  "Commercial & Vertrieb": [
    { id: "PURCHASE", label: "Kaufvertrag / Liefervertrag", focus: "Gewährleistung, Lieferverzug, Incoterms, Eigentumsvorbehalt" },
    { id: "DISTRIBUTION", label: "Vertriebshändlervertrag", focus: "Gebietsschutz, Ausgleichsanspruch § 89b HGB, Wettbewerbsverbot" },
    { id: "SERVICE_GENERIC", label: "Allg. Dienstleistungsvertrag", focus: "Kündigungsfristen, Vergütung, Haftungsbeschränkung" },
    { id: "LOGISTICS", label: "Logistik / Spedition", focus: "ADSp, Haftungshöchstgrenzen, Standgelder" }
  ],
  "Corporate & M&A": [
    { id: "NDA_MNA", label: "NDA (M&A Kontext)", focus: "Weitergaberechte an Berater, Laufzeit > 2 Jahre, Abwerbeverbot" },
    { id: "SHARE_PURCHASE", label: "SPA (Unternehmenskauf)", focus: "Garantiekatalog, De-Minimis, Basket, Cap, Verjährung" },
    { id: "SHAREHOLDERS", label: "Gesellschaftervereinbarung (SHA)", focus: "Drag-Along, Tag-Along, Vinkulierung, Good/Bad Leaver" }
  ],
  "Arbeitsrecht": [
    { id: "EMPLOYMENT_STD", label: "Arbeitsvertrag (Angestellte)", focus: "Ausschlussfristen, Überstundenregelung, Probezeit, Urlaubsanspruch" },
    { id: "EMPLOYMENT_EXEC", label: "Geschäftsführer-Dienstvertrag", focus: "D&O Versicherung, Change of Control, Nachvertragliches Wettbewerbsverbot" },
    { id: "FREELANCE", label: "Freier Mitarbeiter Vertrag", focus: "Abgrenzung Scheinselbstständigkeit, Rentenversicherungspflicht" }
  ],
  "Verbraucher & Sonstiges": [
    { id: "CONSUMER_GENERAL", label: "Verbrauchervertrag (Allgemein)", focus: "AGB-Kontrolle (§ 307 BGB), Widerrufsrecht, Transparenzgebot" },
    { id: "LOAN", label: "Darlehensvertrag", focus: "Zinsanpassung, Kündigungsrechte, Sicherheiten" }
  ]
};

export const PROMPTS = {
  CONTRACT_REVIEW: `
    Führe eine vertiefte juristische Vertragsprüfung durch.
    
    DOKUMENTENTYP: [[CONTRACT_TYPE_LABEL]]
    PRÜFUNGSSCHWERPUNKT: [[CONTRACT_TYPE_FOCUS]]
    
    DEINE AUFGABE:
    Du bist der verantwortliche Partner. Das Ziel ist eine belastbare Risikoeinschätzung (Rechtliche Due Diligence) vor der Unterschrift.
    
    VERHANDLUNGSSTIL (HÄRTEGRAD): [[AGGRESSIVENESS_INSTRUCTION]]
    
    METHODIK:
    1. AKRIBIE: Identifiziere sprachliche Ungenauigkeiten ("Weasel Words"), die die Rechtsposition deines Mandanten schwächen.
    2. ARGUMENTATIONSLOGIK: Begründe jedes Risiko materiell-rechtlich. Warum ist Klausel X gefährlich? (z.B. "Abweichung vom gesetzlichen Leitbild").
    3. SYNTHESEFÄHIGKEIT: Prüfe auf Widersprüche zwischen Individualvereinbarungen und AGB.
    
    MANDANTENPERSPEKTIVE: [[PERSPECTIVE_INSTRUCTION]]
    [[REFERENCE_STANDARD_INSTRUCTION]]

    AUSGABE-FORMAT (JSON - ABER INHALTE AUF DEUTSCH):
    - executiveSummary: Prägnante Zusammenfassung der Rechtslage für die Geschäftsführung (Management Summary).
    - overallRiskScore: 0-100 (Bewerte konservativ).
    - negotiationStrategy: Strategische Empfehlung für die Verhandlung.
    - clauses: Detaillierte Prüfung der Einzelklauseln.
      - analysis: Juristische Subsumtion. Zitiere einschlägige Normen wo sinnvoll.
      - recommendation: Konkrete Handlungsempfehlung (z.B. "Streichen", "Anpassen", "Akzeptieren").
      - redline: Formulierungsvorschlag (Änderungsmodus-Stil).
    - missingClauses: Lückenanalyse. Welche Klauseln fehlen, die in diesem Vertragstyp zwingend üblich wären?
  `,

  CLIENT_LETTER: `
    Erstelle ein Mandantenrundschreiben (E-Mail) basierend auf der vorangegangenen Vertragsprüfung.
    
    EMPFÄNGER (MANDANT): 
    [[TARGET_AUDIENCE]] 
    (Passe die Ansprache entsprechend an. Wenn "Geschäftsführung", dann förmlich. Wenn Privatperson/Mieter, dann allgemein verständlich. Nutze Platzhalter wie [Name] für die Anrede).
    
    TONFALL: 
    Souverän, lösungsorientiert, auf den Punkt.
    
    INHALT:
    - Zusammenfassung des Ergebnisses (Freigabe / Ablehnung / Unter Vorbehalt).
    - Die Top 3 Risiken verständlich erklärt ("Was kann passieren?").
    - Nächste Schritte (Verhandlung mit Gegenseite, Unterschrift, etc.).

    WICHTIG (STRIKTE REGEL):
    Generiere NUR den Inhalt der E-Mail (Betreff, Anrede, Text). 
    Fange NIEMALS mit Meta-Sätzen an wie "Hier ist der Entwurf" oder "Das folgende Rundschreiben wurde erstellt...". 
    Starte DIREKT mit der Betreffzeile. Schreibe zwingend in normalem Deutsch mit korrekten Umlauten.
    
    BASIS-DATEN (JSON der Analyse):
    [[ANALYSIS_JSON]]
  `,

  CONTRACT_COMPARISON: `
    Erstelle eine juristische Synopse (Vergleich) zwischen zwei Vertragsversionen.
    
    INPUT:
    1. V1 (Original / Eigener Entwurf)
    2. V2 (Gegenentwurf / Überarbeitung)
    
    ANALYSE-TIEFE:
    Ignoriere reine Formatierungen. Fokussiere dich auf materielle Änderungen der Rechtslage.
    
    FÄHIGKEITEN:
    - Synthesefähigkeit: Hat die Gegenseite durch viele kleine Änderungen das Haftungskonzept verschoben ("Tod durch tausend Nadelstiche")?
    - Akribie: Achte auf Änderungen bei Fristen, Zuständigkeiten und Rechtsfolgen.
    
    AUSGABE (JSON - ABER INHALTE AUF DEUTSCH):
    - strategicShift: Bewertung der Verhandlungsatmosphäre (z.B. "Aggressive Risikoabwälzung" vs. "Konstruktive Präzisierung").
    - changes: Liste der materiellen Änderungen.
       - legalImpact: Rechtliche Konsequenz der Änderung (z.B. "Verschiebung der Beweislast").
       - strategicComment: Taktische Einschätzung (z.B. "Kritischer Punkt - hier hart bleiben").
  `,

  CONTRACT_EMAIL: `
    Entwirf eine Verhandlungs-E-Mail an die Gegenseite (Rechtsanwalt/Rechtsabteilung).
    
    VORGABE:
    - Tonfall: [[TONE_INSTRUCTION]]
    - Stil: Professionell, sachlich, bestimmt.
    
    STRATEGIE:
    - Argumentiere interessengerecht ("Unser Mandant benötigt X aufgrund von Y").
    - Nutze das Prinzip der Reziprozität.
    - Bündele Themen sinnvoll.
    
    FORMAT:
    Versandfertiger E-Mail-Text auf Deutsch (Markdown). Nutze zwingend korrekte Umlaute.
  `,

  NDA_TRIAGE: `
    Führe eine Risikoprüfung (Triage) der vorliegenden Vertraulichkeitsvereinbarung (NDA) durch.
    
    ZIEL:
    Identifikation von marktunüblichen oder überraschenden Klauseln (§ 305c BGB), die den Unterzeichner benachteiligen.
    
    PRÜFUNGSSCHEMA:
    1. Definition "Vertrauliche Information" (Zu weit? Fangfragen?).
    2. Vertragsstrafe (Angemessenheit, Bestimmtheit, "Hamburger Brauch"?).
    3. Laufzeit & Nachwirkung (Unangemessen lang?).
    4. Reverse Engineering & Zulässige Nutzung.
    5. Abwerbeverbote (Non-Solicitation - oft versteckt).
    
    FÄHIGKEITEN:
    - Rechtsprechungskompetenz: Ist die Vertragsstrafe nach aktueller Rechtsprechung wirksam?
    - Akribie: Prüfe Schriftformerfordernisse, die E-Mail-Verkehr ausschließen könnten.
    
    Ausgabe als JSON (Texte in Deutsch).
  `,

  COMPLIANCE_CHECK: `
    Prüfe das Dokument (AVV/DPA) auf Konformität mit Art. 28 DSGVO.
    
    ROLLE:
    Datenschutz-Auditor.
    
    METHODIK:
    - Harter Abgleich Soll/Ist mit den gesetzlichen Mindestinhalten des Art. 28 Abs. 3 DSGVO.
    - Prüfe auf Drittlandtransfer-Problematik (Schrems II, EU-US Data Privacy Framework).
    - Akribie: Sind die technisch-organisatorischen Maßnahmen (TOMs) hinreichend konkretisiert?
    
    Erstelle einen Lückenanalyse-Bericht auf Deutsch (Markdown). Sei pedantisch genau.
  `,

  DPIA_GENERATOR: `
    Erstelle den Entwurf einer Datenschutz-Folgenabschätzung (DSFA) gemäß Art. 35 DSGVO.
    
    AUFGABE:
    Synthetisiere die Informationen zu einem behördenfesten Dokument nach dem Standard der DSK (Datenschutzkonferenz).
    
    ARGUMENTATION:
    1. Notwendigkeit & Verhältnismäßigkeit: Warum ist die Datenverarbeitung unverzichtbar?
    2. Risikoanalyse: Bewerte Eintrittswahrscheinlichkeit und Schadensschwere logisch nachvollziehbar.
    3. Risikobehandlung: Welche TOMs senken das Risiko auf ein akzeptables Niveau?
    
    Sprache: Formell, technisch-juristisch.
  `,

  DPIA_UPDATE: `
    Führe eine Delta-Prüfung der DSFA durch.
    
    FOKUS:
    Wie verändert die neue Funktion/Änderung die Risikolandschaft für die Betroffenenrechte?
    Isoliere neue Risiken und bewerte sie neu.
  `,

  DPIA_FINALIZE: `
    Finalisiere die DSFA zu einem konsistenten Gesamtdokument.
    Eliminiere Widersprüche. Stelle sicher, dass die Argumentation schlüssig ist.
  `,

  CHRONOLOGY_BUILDER: `
    Rekonstruiere den Sachverhalt für einen Prozesses (Tatbestand).
    
    ROLLE:
    Prozessanwalt.
    
    METHODIK:
    1. AKRIBIE: Extrahiere präzise Daten, Uhrzeiten und Zugangsbelege.
    2. SYNTHESEFÄHIGKEIT: Verdichte Dokumenteninhalte zu substantiierte Tatsachenbehauptungen.
    3. LOGIK: Identifiziere logische Brüche oder Lücken in der Kausalkette (Non-Liquet Risiko).
    
    TABELLEN-FORMAT (Markdown):
    | Datum | Uhrzeit | Wer | Handlung/Behauptung (Substantiiert) | Beweis (Anlage) |
    
    Markiere fehlende Informationen ("Fehlendes Bindeglied") deutlich.
  `,

  CHRONOLOGY_UPDATE: `
    Integriere neue Beweismittel in die Prozess-Chronologie.
    Achte auf strikte zeitliche Kausalität. Prüfe, ob neue Beweise bisherige Lücken schließen oder Widersprüche erzeugen.
  `,

  CHRONOLOGY_QUESTIONS: `
    Erstelle einen Fragenkatalog an den Mandanten zur Schließung von Sachverhaltslücken.
    
    ZIEL:
    Substantiierung des Parteivortrags. Wir benötigen Beweise, um die Darlegungslast zu erfüllen.
    Frage präzise nach Tatsachen ("Wann genau...", "Wer war Zeuge...").
  `,

  RISK_ASSESSMENT: `
    Erstelle eine juristische Risikomatrix (Prozessrisikoanalyse).
    
    METHODIK:
    - Rechtsprechungskompetenz: Wie entscheiden Gerichte in vergleichbaren Konstellationen?
    - Synthesefähigkeit: Verknüpfe rechtliche Risiken (Prozessrisiko) mit wirtschaftlichen Folgen (Schaden, Reputation).
    - Logik: Die Bewertung muss aus dem Sachverhalt herleitbar sein, nicht geraten.
    
    AUSGABE: JSON (Schweregrad x Wahrscheinlichkeit, Texte auf Deutsch).
  `,

  MARKETING_CHECK: `
    Führe eine wettbewerbsrechtliche Prüfung (UWG) von Werbematerial durch.
    
    ZIELGRUPPE: [[TARGET_AUDIENCE]]

    FÄHIGKEITEN:
    1. RECHTSPRECHUNGSKOMPETENZ (BGH/EuGH): Lege die strengen Maßstäbe der Rechtsprechung an (z.B. "Klimaneutral", "Spitzenstellung").
    2. AKRIBIE: Prüfe Sternchenhinweise, Lesbarkeit und Zuordnung von Disclaimern.
    3. ARGUMENTATIONSLOGIK: Warum ist eine Aussage irreführend (§ 5 UWG)? Worüber wird getäuscht?
    
    PRÜFUNG:
    - Health Claims (HCVO): Sind die Aussagen zugelassen? (Grounding nutzen!)
    - Greenwashing: Sind Umweltaussagen hinreichend erklärt?
    - Alleinstellung: Ist "Nr. 1" beweisbar?
    - PAngV: Sind Preise transparent inkl. MwSt/Versand?
    
    AUSGABE (JSON - Deutsch):
    Analysiere streng (als Anwalt der Gegenseite). Schlage rechtssichere Alternativformulierungen vor.
  `
};
