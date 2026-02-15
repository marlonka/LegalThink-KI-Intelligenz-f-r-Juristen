
# LegalThink – KI-Intelligenz für Juristen ⚖️

> **Vom 1x zum 10x Anwalt: Hochperformante KI-Vertragsanalyse und juristische Assistenz, maßgeschneidert für den deutschen Rechtsmarkt (BGB, DSGVO, UWG).**

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) ![Tech](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4.svg)


## 🏛 Über LegalThink

LegalThink überträgt die Leistungsfähigkeit modernster Sprachmodelle (LLMs) auf den deutschen Kanzleialltag. Inspiriert von internationalen Legal-Tech-Vorreitern, aber **streng optimiert auf deutsches Recht**, bietet diese Open-Source-Lösung eine lokale, datenschutzbewusste Oberfläche für juristische Analysen.

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
2.  Daten werden **nur** zur Analyse an die Google Gemini API (Enterprise Grade) gesendet.
3.  Es gibt keinen "LegalThink-Server", der Ihre Daten speichert.

**⚠️ Warnung:**
Laden Sie **niemals** Dokumente mit ungeschwärzten personenbezogenen Daten (Namen, Adressen, Unterschriften) hoch, es sei denn, Sie haben einen entsprechenden AVV mit Google. Die Verantwortung für die Anonymisierung liegt beim Nutzer.

---

## 💻 Installation (No-Code: Der einfache Weg)

Sie brauchen **keine IT-Kenntnisse** und müssen keine komplexen Befehle tippen. Wir nutzen **Google Antigravity**, eine intelligente Software, bei der eine KI ("Agent") die Installation für Sie übernimmt.

### Schritt 1: Software laden
1.  Laden Sie **Google Antigravity** herunter: [https://antigravity.google/download](https://antigravity.google/download)
2.  Installieren und starten Sie das Programm.

### Schritt 2: API Key besorgen
Damit die KI juristisch arbeiten kann, benötigt sie einen Zugangsschlüssel.
1.  Besuchen Sie [https://aistudio.google.com/api-keys](https://aistudio.google.com/api-keys).
2.  Klicken Sie auf den blauen Button **"Create API Key"**.
3.  Kopieren Sie den generierten Schlüssel (er beginnt mit `AIza...`).

### Schritt 3: LegalThink installieren (In Antigravity)
1.  Erstellen Sie auf Ihrem Computer einen leeren Ordner (z.B. "LegalThink").
2.  Öffnen Sie diesen Ordner in Google Antigravity ("Open Folder").
3.  Rechts sehen Sie ein Chat-Fenster ("Agent"). Kopieren Sie diesen Befehl dort hinein und drücken Sie Enter:
    ```
    /clone https://github.com/marlonka/LegalThink-KI-Intelligenz-f-r-Juristen .
    ```
    *(Wichtig: Der Punkt am Ende sorgt dafür, dass die Dateien direkt in Ihrem Ordner landen).*

### Schritt 4: Schlüssel hinterlegen
Wir müssen der App nun Ihren Schlüssel aus Schritt 2 geben. Das machen wir direkt im Editor, ohne komplizierte Windows-Einstellungen:
1.  Klicken Sie in der linken Spalte (Dateiliste) mit der **rechten Maustaste** in den leeren Bereich.
2.  Wählen Sie **"New File"** (Neue Datei).
3.  Geben Sie der Datei exakt den Namen: `.env` (Punkt am Anfang nicht vergessen!).
4.  Fügen Sie in diese Datei folgende Zeile ein:
    ```text
    API_KEY=Ihr-Kopierter-Schlüssel-Hier
    ```
5.  Speichern Sie die Datei (`Strg + S` oder `Cmd + S`).

### Schritt 5: Starten
Schreiben Sie nun einfach in den Chat rechts an die KI:
> **"Bitte installiere alle Abhängigkeiten und starte die App."**

Die KI führt nun alle technischen Schritte aus (`npm install`, `npm start`). Warten Sie kurz, bis sich LegalThink automatisch in Ihrem Browser öffnet (meist unter `http://localhost:1234`).

---

## 🤓 Installation (Für Entwickler / Manuell)

Falls Sie Node.js bereits installiert haben und das Terminal bevorzugen:

1.  Repository klonen:
    ```bash
    git clone https://github.com/marlonka/LegalThink-KI-Intelligenz-f-r-Juristen.git
    cd LegalThink-KI-Intelligenz-f-r-Juristen
    ```
2.  Abhängigkeiten installieren:
    ```bash
    npm install
    ```
3.  API Key setzen:
    Erstellen Sie eine Datei `.env` im Hauptverzeichnis und fügen Sie ein:
    ```bash
    API_KEY="Ihr-Google-Gemini-Key-Hier"
    ```
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

---

## 📄 Lizenz (MIT)

Copyright (c) 2026 LegalThink

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
