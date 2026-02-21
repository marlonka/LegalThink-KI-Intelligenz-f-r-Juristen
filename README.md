
# LegalThink – KI-Intelligenz für Juristen ⚖️

> **Vom 1x zum 10x Anwalt: Hochperformante KI-Vertragsanalyse und juristische Assistenz, maßgeschneidert für den deutschen Rechtsmarkt (BGB, DSGVO, UWG).**

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) ![Model](https://img.shields.io/badge/Model-Gemini%203.1%20Pro-4285F4.svg) ![Aesthetic](https://img.shields.io/badge/UI-Minimal%20Editorial%20Luxury-D4AF37.svg)

## 🏛 Über LegalThink

LegalThink überträgt die Leistungsfähigkeit des brandneuen **Google Gemini 3.1 Pro Preview** Modells auf den deutschen Kanzleialltag. 

Inspiriert von internationalen Legal-Tech-Vorreitern, aber **streng optimiert auf deutsches Recht**, bietet diese Open-Source-Lösung eine lokale, datenschutzbewusste Oberfläche für juristische Analysen. Das Interface besticht durch die neue Designsprache **"Minimal Editorial Luxury"** – konzipiert für erfahrene Partner, die Wert auf einen souveränen, klaren und visuell anspruchsvollen Arbeitsbereich legen.

Es ist kein generischer "Chatbot", sondern eine Suite spezialisierter Werkzeuge für Partner, Associates und Rechtsabteilungen.

### Der "Wow-Faktor" für Ihre Kanzlei
LegalThink agiert wie ein hochqualifizierter Associate, der nie müde wird:
*   **Präzise:** Prüft Klauseln gegen BGB-Standards und aktuelle Rechtsprechung (inklusive Google Search Grounding).
*   **Schnell:** Erstellt Synopsen und Chronologien in Sekunden statt Stunden.
*   **Strategisch:** Denkt mit – von der Verhandlungstaktik bis zur wirtschaftlichen Risikoanalyse.
*   **Ästhetisch:** Eine Benutzeroberfläche out-of-the-box, die Mandanten und Kollegen beeindruckt.

---

## 🚀 Funktionen (Die Werkzeuge)

### 1. 📄 Vertragsanalyse & Redlining
Laden Sie Verträge (PDF/Word) hoch. LegalThink seziert das Dokument nicht nur, es versteht es.
*   **Ampelsystem:** Risiken werden sofort in einer edlen Risiko-Matrix klassifiziert.
*   **Lückenanalyse:** Findet Klauseln, die *fehlen* (z.B. fehlende Schutzklauseln in einem SaaS-Vertrag).
*   **Redlining:** Generiert konkrete Formulierungsvorschläge für die Verhandlung ("Track Changes").

### 2. ↔️ Intelligente Synopse (Versionsvergleich)
Vergessen Sie das mühsame Wort-für-Wort-Vergleichen.
*   Vergleicht Ihren Entwurf (V1) mit dem Gegenentwurf (V2).
*   Erkennt nicht nur Textänderungen, sondern **strategische Verschiebungen** (z.B. "Gegenseite versucht, die Haftung subtil zu verschieben").

### 3. ⏳ Sachverhalts-Architekt (Chronologie)
Verwandeln Sie unsortierte Aktenberge (E-Mails, Notizen, PDFs) in eine strukturierte Zeittafel.
*   Extrahiert Daten und Ereignisse automatisch.
*   Erstellt eine **prozesstaktische Tabelle** mit Beweismitteln.
*   Identifiziert Lücken in der Kausalkette und formuliert Fragen an den Mandanten.

### 4. 🛡️ Compliance & Datenschutz (DSGVO)
*   **AVV-Check:** Prüft Auftragsverarbeitungsverträge technisch gegen Art. 28 DSGVO.
*   **DSFA-Generator:** Entwirft Datenschutz-Folgenabschätzungen nach dem Standard der DSK.

### 5. 📢 UWG-Radar (Wettbewerbsrecht)
Prüft Marketing-Materialien und Webseiten-Texte auf "Abmahnfallen".
*   Erkennt Greenwashing, unzulässige Heilversprechen und irreführende Werbung.
*   Gleicht Aussagen mittels **Google Search Grounding** live gegen Fakten ab.

### 6. 🧠 Kanzlei-Playbooks
Laden Sie Ihre eigenen Muster, AGBs oder "Corporate Wording" Richtlinien hoch. LegalThink prüft und schreibt dann genau in **Ihrem** Stil, wodurch die KI zum perfekten Votums-Schreiber wird.

---

## 🔒 Datenschutz & Sicherheit (WICHTIG)

LegalThink ist eine "Client-Side Application" (React/Vite). Das bedeutet:
1.  Der Code läuft in Ihrem Browser auf Ihrem Endgerät.
2.  Daten werden **nur** zur Analyse an die Google Gemini API gesendet.
3.  Es gibt keinen "LegalThink-Server", der Ihre Daten speichert.

**⚠️ Wichtiger berufsrechtlicher Hinweis:**
Die API von Google wird genutzt. Die Verantwortung für die Einhaltung von § 203 StGB (Verschwiegenheitspflicht) liegt beim Anwender. Laden Sie **niemals** Dokumente mit ungeschwärzten personenbezogenen Daten (Namen, Adressen, Unterschriften) hoch, es sei denn, Sie haben einen entsprechenden Vertrag (AVV) mit Google geschlossen, der dies legitimiert.

---

## 💻 Installation

Diese Anwendung nutzt Vite für maximale Performance. Um das Programm lokal zu starten, folgen Sie diesen Schritten:

### Schritt 1: API Key besorgen
Damit die KI juristisch arbeiten kann, benötigt sie Zugang zu **Gemini 3.1 Pro**.
1.  Besuchen Sie [Google AI Studio](https://aistudio.google.com/api-keys).
2.  Klicken Sie auf den blauen Button **"Create API Key"**.
3.  Kopieren Sie den generierten Schlüssel.

### Schritt 2: Code herunterladen & installieren
Öffnen Sie Ihr Terminal (oder die Antigravity-Kommandozeile):
```bash
git clone https://github.com/marlonka/LegalThink-KI-Intelligenz-f-r-Juristen.git
cd LegalThink-KI-Intelligenz-f-r-Juristen
npm install
```

### Schritt 3: API Key in `.env.local` hinterlegen
Sie müssen Vite autorisieren, indem Sie eine `.env.local` Datei im Hauptverzeichnis des Projekts anlegen.

Erstellen Sie eine Datei namens `.env.local` und fügen Sie exakt diese Zeile ein:
```env
VITE_GEMINI_API_KEY=Ihr-Kopierter-Schlüssel-Hier
```
*(Das Präfix `VITE_` ist zwingend erforderlich!)*

### Schritt 4: LegalThink starten
Starten Sie den Entwicklungsserver:
```bash
npm run dev
```
Rufen Sie nun [http://localhost:3000](http://localhost:3000) in Ihrem Browser auf, um die KI-Suite zu nutzen!

---

## ⚖️ Haftungsausschluss (Disclaimer)

**Keine Rechtsberatung:**
Diese Software ist ein technisches Hilfsmittel zur Unterstützung von Juristen ("Assisted Intelligence"). Die Ergebnisse sind maschinell generiert und können Fehler ("Halluzinationen") enthalten.

1.  **Kein Mandat:** Die Nutzung begründet kein Mandatsverhältnis.
2.  **Verantwortung:** Die berufliche Verantwortung für die Prüfung der Ergebnisse und deren Verwendung liegt ausschließlich beim nutzenden Rechtsanwalt / Juristen.
3.  **Haftung:** Die Software wird "as is" unter der MIT-Lizenz zur Verfügung gestellt. Jegliche Gewährleistung oder Haftung für Schäden, die aus der Nutzung resultieren, wird – soweit gesetzlich zulässig – ausgeschlossen.

---

## 🤝 Mitwirken

LegalThink ist Open Source. Wir laden Legal Engineers und entwickelnde Juristen herzlich ein, Pull Requests zu stellen, um das Tool gemeinsam zu verbessern.

## 📄 Lizenz (MIT)

Copyright (c) 2026 LegalThink

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction...
