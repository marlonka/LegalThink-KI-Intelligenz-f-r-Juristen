
import React from 'react';
import { View } from '../../types';
import { FileText, Shield, FileCheck, AlertTriangle, LayoutGrid, Fingerprint, History, ArrowLeftRight, Megaphone } from 'lucide-react';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  // Ordered by frequency of use for Lawyers
  const navItems = [
    { id: View.DASHBOARD, icon: LayoutGrid, label: 'Übersicht' },

    // Core Tools (Daily)
    { id: View.CONTRACT_REVIEW, icon: FileText, label: 'Analyse' },
    { id: View.CHRONOLOGY_BUILDER, icon: History, label: 'Sachverhalt' },
    { id: View.CONTRACT_COMPARISON, icon: ArrowLeftRight, label: 'Vergleich' },

    // Standard Tools (Weekly)
    { id: View.NDA_TRIAGE, icon: FileCheck, label: 'Vorprüfung' },
    { id: View.RISK_ASSESSMENT, icon: AlertTriangle, label: 'Risiko' },

    // Specialized Tools (Project based)
    { id: View.COMPLIANCE, icon: Shield, label: 'Compliance' },
    { id: View.MARKETING_CHECK, icon: Megaphone, label: 'UWG Radar' },
    { id: View.DPIA_GENERATOR, icon: Fingerprint, label: 'DSFA' },
  ];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center px-4">
      {/* The Tool Dock - Always dark for visual anchor */}
      <nav className="flex items-center gap-2 bg-[#05050A]/95 backdrop-blur-xl shadow-dock rounded-2xl px-3 py-2 border border-[#334155]/20 overflow-x-auto max-w-full no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                relative flex items-center justify-center min-w-[3.5rem] h-12 rounded-xl transition-all duration-300 group
                ${isActive ? 'bg-firm-accent/15 text-firm-accent' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}
              `}
              title={item.label}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[1.5px] group-hover:stroke-[2px]"} />

              {/* Subtle Active Indicator - Gold Dash */}
              {isActive && (
                <div className="absolute -bottom-1 w-4 h-[2px] bg-firm-accent rounded-full shadow-firm-glow"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;
