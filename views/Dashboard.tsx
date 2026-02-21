
import React from 'react';
import { View } from '../types';
import { ArrowUpRight, FileText, Shield, FileCheck, AlertTriangle, Lock, BookOpen, CheckCircle, Fingerprint, History, Scale, ArrowLeftRight, Megaphone } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { motion, Variants } from 'framer-motion';

const itemVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 15 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 }
  }
};

interface DashboardProps {
  onNavigate: (view: View) => void;
}

interface ActionItem {
  view: View;
  title: string;
  desc: string;
  icon: React.ElementType;
  borderColor: string;
  bgClass?: string;
  textClass?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, setPlaybookFile } = useAppContext();

  const handlePlaybookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPlaybookFile(e.target.files[0]);
    }
  };

  const actions: ActionItem[] = [
    // 1. HIGH FREQUENCY / CORE LEGAL WORK
    {
      view: View.CONTRACT_REVIEW,
      title: "Vertragsanalyse",
      desc: "Risikoprüfung & Redlining",
      icon: FileText,
      borderColor: "group-hover:border-firm-navy/30",
    },
    {
      view: View.CHRONOLOGY_BUILDER,
      title: "Sachverhalts-Architekt",
      desc: "Chronologie & Lückenanalyse aus Akten",
      icon: History,
      borderColor: "group-hover:border-firm-navy/30",
    },
    {
      view: View.CONTRACT_COMPARISON,
      title: "Versionsvergleich (Synopse)",
      desc: "Abweichungsanalyse Entwurf vs. Gegenentwurf",
      icon: ArrowLeftRight,
      borderColor: "group-hover:border-firm-navy/30",
    },
    {
      view: View.NDA_TRIAGE,
      title: "NDA Vorprüfung",
      desc: "Prüfung auf Marktstandards & Fristen",
      icon: FileCheck,
      borderColor: "group-hover:border-firm-navy/30",
    },

    // 2. STRATEGIC / ADVISORY
    {
      view: View.RISK_ASSESSMENT,
      title: "Risiko-Matrix",
      desc: "Strategische Sachverhaltsbewertung",
      icon: AlertTriangle,
      borderColor: "group-hover:border-firm-navy/30",
    },

    // 3. SPECIALIZED / COMPLIANCE
    {
      view: View.COMPLIANCE,
      title: "Compliance Check",
      desc: "Technischer Abgleich (DSGVO Art. 28)",
      icon: Shield,
      borderColor: "group-hover:border-firm-navy/30",
    },
    {
      view: View.MARKETING_CHECK,
      title: "Wettbewerbs-Radar (UWG)",
      desc: "Prüfung auf Abmahnrisiken für Marketing-Materialien",
      icon: Megaphone,
      borderColor: "group-hover:border-firm-navy/30",
    },
    {
      view: View.DPIA_GENERATOR,
      title: "DSFA Generator",
      desc: "Art. 35 DSGVO Folgenabschätzung (Entwurf)",
      icon: Fingerprint,
      borderColor: "group-hover:border-firm-navy/30",
    }
  ];

  return (
    <div className="space-y-8">
      {/* Intro Section - Reduced margins */}
      <motion.div variants={itemVariants} className="px-2 mt-2">
        <p className="text-firm-slate/80 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
          <strong className="text-firm-navy">Wir machen 1x Anwälte zu 10x Anwälten.</strong> <br />
          Konzipiert für erfahrene Partner, spezialisierte Einzelanwälte und Rechtsabteilungen.
        </p>
      </motion.div>

      {/* Context / Playbook Configuration Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-firm-navy via-[#111926] to-[#0A0F1C] rounded-[2rem] p-8 shadow-firm-lg text-white relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 text-firm-accent">
          <Scale size={180} />
        </div>

        {/* Subtle Gold Glow on Hover */}
        <div className="absolute inset-0 bg-firm-accent/0 group-hover:bg-firm-accent/5 transition-colors duration-700 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={24} className="text-firm-accent" />
              <h3 className="font-bold font-serif text-xl sm:text-2xl text-white tracking-wide">Rechts-Kontext & Standards</h3>
            </div>
            <p className="text-slate-300/80 text-sm max-w-xl leading-relaxed font-medium">
              Laden Sie Ihr anwaltliches Playbook hoch. Wir nutzen dieses Wissen im Hintergrund, um der KI den exakten juristischen Kontext, Ihre Vorlagen und Ihren Verhandlungsstil zu injizieren.
              <br />
              <span className="text-xs text-white/90 mt-4 block p-3.5 bg-white/10 rounded-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <strong className="text-firm-accent mr-1">Tipp:</strong> Laden Sie Ihre Standard-AGB, "Must-Haves" für Vertragsprüfungen oder ein Mandantenprofil hoch. Erhöht die Präzision massiv.
              </span>
            </p>

            {state.playbookFile && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-firm-accent bg-firm-accent/10 px-4 py-2 rounded-full w-fit border border-firm-accent/20">
                <CheckCircle size={14} />
                <span>Aktiv: {state.playbookFile.name}</span>
              </div>
            )}
          </div>

          <div className="relative shrink-0 w-full md:w-auto">
            <button className="w-full bg-firm-paper text-firm-navy px-6 py-3.5 rounded-2xl text-sm font-bold shadow-firm hover:bg-white transition-all duration-300 pointer-events-none whitespace-nowrap active:scale-95">
              {state.playbookFile ? 'Playbook aktualisieren' : 'Playbook hochladen'}
            </button>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              accept=".pdf,.docx,.txt"
              onChange={handlePlaybookUpload}
            />
          </div>
        </div>
      </motion.div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const bgClass = action.bgClass || "bg-firm-paper group-hover:bg-firm-navy group-hover:shadow-firm-glow";
          const textClass = action.textClass || "text-firm-navy group-hover:text-firm-accent";

          return (
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              key={action.title}
              onClick={() => onNavigate(action.view)}
              className={`
                group bg-white border border-firm-slate/15 rounded-[2rem] p-8 text-left transition-colors duration-500 ease-out-expo
                hover:shadow-firm-lg hover:border-firm-accent/30
              `}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl transition-all duration-500 ease-out-expo ${bgClass} ${textClass}`}>
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <div className="bg-firm-paper group-hover:bg-firm-accent/10 p-2 rounded-full transition-colors duration-500">
                  <ArrowUpRight size={20} className="text-firm-slate/40 group-hover:text-firm-accent transition-colors" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-firm-navy text-xl sm:text-2xl font-serif mb-2">{action.title}</h3>
                <p className="text-sm text-firm-slate/80 font-medium leading-relaxed">{action.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Security Badge (Legally Accurate) */}
      <motion.div variants={itemVariants} className="mx-2 mt-10 p-5 bg-firm-paper border border-firm-slate/10 rounded-2xl flex items-start gap-4 shadow-firm-sm">
        <div className="bg-firm-slate/5 p-3 rounded-full shrink-0">
          <Lock size={18} className="text-firm-navy" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-firm-navy mb-1 flex items-center gap-2">
            Datensicherheit & Vertraulichkeit
            <span className="text-[10px] bg-green-100/50 text-green-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-green-200/50">TLS gesichert</span>
          </h4>
          <p className="text-xs text-firm-slate/80 leading-relaxed max-w-2xl">
            Die Analyse erfolgt durch die <strong>Google Gemini API</strong>.
            Alle Dokumente werden nach der Verarbeitung verworfen und <strong>nicht</strong> für Modelltraining verwendet.
            Bitte beachten Sie Ihre berufsrechtliche Verschwiegenheitspflicht (§ 203 StGB).
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
