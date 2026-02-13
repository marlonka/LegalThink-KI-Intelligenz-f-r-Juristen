import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { ShieldAlert, Scale, CheckCircle, Github, Server } from 'lucide-react';

interface LegalModalProps {
  onAccept: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check local storage to see if disclaimer was already accepted
    const accepted = localStorage.getItem('legalthink_legal_accepted_v1'); // Version bumped to force re-accept for name change
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('legalthink_legal_accepted_v1', 'true');
    setIsOpen(false);
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-firm-navy/90 backdrop-blur-md animate-enter">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-firm-navy p-6 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-full text-white">
            <Scale size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Nutzungsbedingungen & Datenschutz</h2>
            <p className="text-firm-slate text-xs uppercase tracking-widest mt-1">EU AI Act • DSGVO • MIT License</p>
          </div>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300">
          
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-900 text-xs">
            <div className="flex items-center gap-2 mb-1 font-bold">
                <ShieldAlert size={14} />
                <span>DSGVO WARNUNG - VERBOT VON PERSONENDATEN</span>
            </div>
            Die Software nutzt die globale Google Gemini API. Es kann nicht garantiert werden, dass Daten die EU nicht verlassen. 
            <strong> Es ist strikt untersagt, Dokumente mit ungeschwärzten personenbezogenen Daten (Namen, Adressen, Unterschriften) hochzuladen. </strong>
            Der Nutzer ist für die Anonymisierung verantwortlich.
          </div>

          <section>
            <h3 className="font-bold text-firm-navy mb-2 font-serif">1. EU AI Act Transparenz (Art. 50)</h3>
            <p>
              Hiermit werden Sie informiert, dass Sie mit einem <strong>Künstlichen Intelligenzsystem</strong> interagieren.
              Die ausgegebenen Texte, Analysen und Risikobewertungen sind maschinell generiert (Google Gemini 3.0).
              Sie unterliegen keiner menschlichen Vorabkontrolle durch den Softwareanbieter.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-firm-navy mb-2 font-serif">2. Status der Software & Haftung (MIT / BGB)</h3>
            <p>
              Diese Software ist <strong>Open Source</strong> (MIT License). Für Nutzer in Deutschland gilt ergänzend das <strong>Schenkungsrecht (§§ 516 ff. BGB)</strong>.
              Die Haftung der Entwickler ist auf <strong>Vorsatz und Arglist</strong> beschränkt.
              Es wird keine Gewähr für juristische Richtigkeit übernommen.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-firm-navy mb-2 font-serif">3. Kein Mandatsverhältnis (§ 2 RDG)</h3>
            <p>
              LegalThink ist ein technisches Hilfsmittel. Die Nutzung begründet <strong>kein Mandatsverhältnis</strong>. 
              Die Ergebnisse stellen keine Rechtsberatung dar. Sie ersetzen keinesfalls die eigenverantwortliche Prüfung durch qualifizierte Berufsträger.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-firm-navy mb-2 font-serif">4. Berufsrechtliche Verantwortung</h3>
            <p>
              Der Nutzer (Rechtsanwalt/Jurist) trägt die alleinige berufsrechtliche Verantwortung (§ 203 StGB, BRAO) für die Verwendung der Ergebnisse und die Einhaltung der Verschwiegenheitspflicht bei der Nutzung von Cloud-Diensten.
            </p>
          </section>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
          <Button onClick={handleAccept} fullWidth>
            <CheckCircle size={18} />
            Ich bestätige: Keine Personendaten & Bedingungen akzeptiert
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;