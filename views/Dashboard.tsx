
import React from 'react';
import { View } from '../types';
import { ArrowUpRight, FileText, Shield, FileCheck, AlertTriangle, Lock, BookOpen, CheckCircle, Fingerprint, History, Scale, ArrowLeftRight, Megaphone } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

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
    <div className="space-y-8 animate-enter">
      {/* Intro Section - Reduced margins */}
      <div className="px-1 mt-2">
        <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
          <strong className="text-firm-navy">Wir machen 1x Anwälte zu 10x Anwälten.</strong> <br/>
          Konzipiert für erfahrene Partner, spezialisierte Einzelanwälte und Rechtsabteilungen.
        </p>
      </div>

      {/* Context / Playbook Configuration Card */}
      <div className="bg-gradient-to-r from-firm-navy to-[#1e293b] rounded-xl p-6 shadow-firm-lg text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Scale size={120} />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <BookOpen size={20} className="text-neon-cyan" />
                 <h3 className="font-bold font-serif text-lg text-white">Rechts-Kontext, Vorlagen & Standards</h3>
               </div>
               <p className="text-slate-300 text-sm max-w-lg leading-relaxed">
                  Laden Sie Ihre Standards hoch. Wir nutzen dieses Wissen im Hintergrund, um der KI mehr Kontext zu Ihren Wünschen und der Situation zu geben.
                  <br/>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Geeignet z.B. für: <strong>Vertrags-Vorlagen, Verhandlungs-Playbooks, AGBs, Unternehmensprofile ("Wer sind wir?"), Mandanten-Briefings.</strong>
                  </span>
               </p>
               
               {state.playbookFile && (
                 <div className="mt-3 flex items-center gap-2 text-xs font-medium text-neon-lime bg-neon-lime/10 px-3 py-1.5 rounded-full w-fit">
                    <CheckCircle size={12} />
                    <span>Aktiv: {state.playbookFile.name}</span>
                 </div>
               )}
            </div>

            <div className="relative shrink-0">
                <button className="bg-white text-firm-navy px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-slate-100 transition-colors pointer-events-none whitespace-nowrap">
                   {state.playbookFile ? 'Playbook aktualisieren' : 'Playbook hochladen'}
                </button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.docx,.txt"
                  onChange={handlePlaybookUpload}
                />
            </div>
         </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {actions.map((action) => {
          const Icon = action.icon;
          const bgClass = action.bgClass || "bg-slate-50 group-hover:bg-firm-navy";
          const textClass = action.textClass || "text-firm-navy group-hover:text-white";

          return (
            <button 
              key={action.title}
              onClick={() => onNavigate(action.view)}
              className={`
                group relative bg-white border border-slate-200 rounded-lg p-6 text-left transition-all duration-300 
                hover:shadow-firm-lg hover:-translate-y-0.5 ${action.borderColor}
              `}
            >
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded transition-colors duration-300 ${bgClass} ${textClass}`}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-firm-navy transition-colors" />
              </div>
              
              <div>
                <h3 className="font-bold text-firm-navy text-lg font-serif mb-1">{action.title}</h3>
                <p className="text-sm text-slate-500 font-medium">{action.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Security Badge (Legally Accurate) */}
      <div className="mx-1 mt-8 border-t border-slate-200 pt-6 flex items-start gap-4 opacity-80">
        <div className="bg-slate-100 p-2 rounded-full">
            <Lock size={16} className="text-firm-navy" />
        </div>
        <div>
           <h4 className="text-sm font-bold text-firm-navy mb-1">Datensicherheit & Vertraulichkeit</h4>
           <p className="text-xs text-slate-500 leading-relaxed max-w-md">
             Die Analyse erfolgt durch die <strong>Google Gemini API</strong>. 
             Die Datenübertragung ist TLS-verschlüsselt. 
             Bitte beachten Sie Ihre berufsrechtliche Verschwiegenheitspflicht (§ 203 StGB) bei der Nutzung von Cloud-Diensten.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
