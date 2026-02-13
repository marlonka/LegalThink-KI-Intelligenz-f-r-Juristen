
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
      {/* The Tool Dock - Dark Navy, very sleek */}
      <nav className="flex items-center gap-1 bg-firm-navy shadow-dock rounded-2xl px-2 py-2 border border-slate-700/50 overflow-x-auto max-w-full no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                relative flex items-center justify-center min-w-[3rem] h-12 rounded-xl transition-all duration-300
                ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
              title={item.label}
            >
              <Icon size={20} strokeWidth={2} />
              
              {/* Subtle Active Indicator */}
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;
