import React from 'react';
import Card from '../components/ui/Card';
import { ShieldAlert, Lock, Scale, Server, Github, Bot, Code2 } from 'lucide-react';

const LegalNotice: React.FC = () => {
  return (
    <div className="space-y-8 animate-enter pb-32">
      <div className="px-1 mt-4">
        <h2 className="text-3xl font-bold text-firm-navy mb-3 font-serif tracking-tight">Rechtliche Hinweise</h2>
        <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
          Transparenzpflichten, Datenschutz und Lizenzbestimmungen.
        </p>
      </div>

      <Card>
         <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-firm-navy rounded-lg text-white">
            <Bot size={24} />
          </div>
          <h3 className="text-xl font-bold text-firm-navy font-serif">EU AI Act (KI-Verordnung)</h3>
        </div>
        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
           <section>
            <h4 className="font-bold text-firm-navy text-base">Transparenzhinweis gemäß Art. 50</h4>
            <p>
              Diese Anwendung stellt eine Schnittstelle zu einem <strong>Künstlichen Intelligenzsystem</strong> (General Purpose AI Model: Google Gemini) dar. 
              Alle ausgegebenen Inhalte (Texte, Bewertungen, Tabellen) sind künstlich generiert. 
            </p>
            <p className="bg-amber-50 p-3 rounded border border-amber-200 text-xs">
              Die KI-Ausgaben können Fehler enthalten ("Halluzinationen"), voreingenommen sein oder aktuelle Rechtsprechung ignorieren. 
              Eine menschliche Überprüfung ist zwingend erforderlich.
            </p>
           </section>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-firm-navy font-serif">Datenschutz (DSGVO)</h3>
        </div>

        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
          <section>
            <h4 className="font-bold text-firm-navy text-base text-red-600">WARNUNG: Serverstandort & Drittlandtransfer</h4>
            <p>
              LegalThink ist ein Open-Source-Client für die Google Gemini API. Standardmäßig erfolgt die Datenverarbeitung über globale Endpunkte von Google. 
              <strong>Es kann nicht ausgeschlossen werden, dass Daten auf Servern in den USA (Drittland) verarbeitet werden.</strong>
            </p>
          </section>

          <section>
            <h4 className="font-bold text-firm-navy text-base">Nutzungsvorgabe: Anonymisierung</h4>
            <p>
              Aufgrund der globalen Struktur der API ist die Nutzung mit personenbezogenen Daten (Art. 4 Nr. 1 DSGVO) <strong>untersagt</strong>, sofern keine gesonderte Vereinbarung (Standardvertragsklauseln/Enterprise Agreement) zwischen dem Nutzer und Google besteht.
              <strong>Nutzer sind verpflichtet, Dokumente vor dem Upload vollständig zu anonymisieren (Schwärzung von Namen, Adressen etc.).</strong>
            </p>
          </section>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-firm-navy rounded-lg text-white">
            <Github size={24} />
          </div>
          <h3 className="text-xl font-bold text-firm-navy font-serif">Lizenz & Haftung (MIT / BGB)</h3>
        </div>

        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
          <section>
            <h4 className="font-bold text-firm-navy text-base">Haftungsausschluss nach deutschem Recht</h4>
            <p>
              Soweit die Software unentgeltlich überlassen wird, gelten die gesetzlichen Bestimmungen des Schenkungsrechts (§§ 516 ff. BGB).
              Die Haftung der Entwickler ist auf <strong>Vorsatz und Arglist</strong> beschränkt (§§ 521, 523, 524 BGB).
            </p>
          </section>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-slate-700 rounded-lg text-white">
            <Code2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-firm-navy font-serif">Open Source Attribution</h3>
        </div>

        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
          <section>
            <p>
              LegalThink beinhaltet Logik und Prompt-Strukturen, die von <strong>Anthropic</strong> entwickelt und unter der Apache License 2.0 veröffentlicht wurden.
            </p>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-mono overflow-x-auto">
              <p className="font-bold mb-2">Original Work: Legal Productivity Plugin</p>
              <p className="mb-2">Copyright 2024 Anthropic, PBC.</p>
              <p>
                Licensed under the Apache License, Version 2.0 (the "License");
                you may not use this file except in compliance with the License.
                You may obtain a copy of the License at
              </p>
              <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block my-1">
                http://www.apache.org/licenses/LICENSE-2.0
              </a>
              <p className="mt-2 text-slate-500 italic">
                Modifications: The original prompt logic has been translated to German and adapted for the German Civil Code (BGB) and GDPR (DSGVO) context by LegalThink developers.
              </p>
            </div>
          </section>
        </div>
      </Card>

      <div className="text-center opacity-50 text-[10px] uppercase tracking-widest font-semibold mt-12">
        Stand: Februar 2026 • LegalThink Open Source Initiative
      </div>
    </div>
  );
};

export default LegalNotice;