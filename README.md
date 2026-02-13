# LegalThink – KI-Intelligenz für Juristen ⚖️

> **Vom 1x zum 10x Anwalt: Hochperformante KI-Vertragsanalyse und juristische Assistenz, maßgeschneidert für den deutschen Rechtsmarkt (BGB, DSGVO, UWG).**

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) ![Tech](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4.svg)

## 🏛 Über LegalThink

LegalThink überträgt die Leistungsfähigkeit modernster Sprachmodelle (LLMs) wie Gemini 3 Pro auf den deutschen Kanzleialltag. Inspiriert von internationalen Legal-Tech-Vorreitern, aber **streng optimiert auf deutsches Recht**, bietet diese Open-Source-Lösung eine lokale, datenschutzbewusste Oberfläche für juristische Analysen.

Es ist kein "Chatbot", sondern eine Suite spezialisierter Werkzeuge für Partner, Associates und Rechtsabteilungen.

### Der "Wow-Faktor" für Ihre Kanzlei
LegalThink agiert wie ein hochqualifizierter Associate, der nie müde wird:
*   **Präzise:** Prüft Klauseln gegen BGB-Standards und aktuelle Rechtsprechung.
*   **Schnell:** Erstellt Synopsen und Chronologien in Sekunden statt Stunden.
*   **Strategisch:** Denkt mit – von der Verhandlungstaktik bis zur wirtschaftlichen Risikoanalyse.

---

## 🚀 Funktionen (Die Werkzeuge)

### 1. 📄 Vertragsanalyse & Redlining
Laden Sie Verträge (PDF/Word) hoch. LegalThink seziert das Dokument nicht nur, es versteht es.
*   **Ampelsystem:** Risiken werden sofort als Grün/Gelb/Rot klassifiziert.
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
Laden Sie Ihre eigenen Muster, AGBs oder "Corporate Wording" Richtlinien hoch. LegalThink prüft und schreibt dann genau in **Ihrem** Stil.

---

## 🔒 Datenschutz & Sicherheit (WICHTIG)

LegalThink ist eine "Client-Side Application". Das bedeutet:
1.  Der Code läuft in Ihrem Browser.
2.  Daten werden **nur** zur Analyse an die Google Gemini API (Google Cloud) gesendet.
3.  Es gibt keinen "LegalThink-Server", der Ihre Daten speichert.

**⚠️ Warnung:**
Laden Sie **niemals** Dokumente mit ungeschwärzten personenbezogenen Daten (Namen, Adressen, Unterschriften) hoch, es sei denn, Sie haben einen entsprechenden AVV mit Google. Die Verantwortung für die Anonymisierung liegt beim Nutzer.

---

## 💻 Installation (Für IT & Legal Engineers)

Sie benötigen keine IT-Abteilung, um dies zu testen. Alles, was Sie brauchen, ist ein Computer mit Node.js und einen API Key.

### Voraussetzungen
*   [Node.js](https://nodejs.org/) installiert.
*   Einen **Google Gemini API Key** (erhältlich via Google AI Studio).

### Starten
1.  Repository klonen:
    ```bash
    git clone https://github.com/IhrUsername/LegalThink.git
    cd LegalThink
    ```
2.  Abhängigkeiten installieren:
    ```bash
    npm install
    ```
3.  API Key setzen (Linux/Mac):
    ```bash
    export API_KEY="Ihr-Google-Gemini-Key-Hier"
    ```
    *(Windows Powershell: `$env:API_KEY="Ihr-Key-Hier"`)*
4.  Anwendung starten:
    ```bash
    npm start
    ```
    Der Browser öffnet sich automatisch unter `http://localhost:1234`.

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

**Lizenz:** [MIT](LICENSE)
