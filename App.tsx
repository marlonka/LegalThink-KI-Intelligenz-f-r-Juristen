
import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import TokenPill from './components/Layout/TokenPill';
import LegalModal from './components/Layout/LegalModal';
import Dashboard from './views/Dashboard';
import ContractReview from './views/ContractReview';
import ContractComparison from './views/ContractComparison'; 
import NdaTriage from './views/NdaTriage';
import ComplianceCheck from './views/ComplianceCheck';
import RiskAssessment from './views/RiskAssessment';
import DpiaGenerator from './views/DpiaGenerator';
import ChronologyBuilder from './views/ChronologyBuilder'; 
import MarketingCheck from './views/MarketingCheck';
import LegalNotice from './views/LegalNotice';
import { View } from './types';
import { TokenProvider } from './contexts/TokenContext';
import { AppProvider, useAppContext } from './contexts/AppContext';

// Separated InnerApp to consume Context for layout logic
const InnerApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const { state } = useAppContext();

  // UX Fix: Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  // DYNAMIC LAYOUT LOGIC
  // Some views need a lot of horizontal space (Split Views, Tables)
  const isWideMode = 
    (currentView === View.CONTRACT_REVIEW && state.contractReview.analysis !== null) ||
    (currentView === View.CONTRACT_COMPARISON && state.comparison.analysis !== null);

  const containerClass = isWideMode 
    ? "max-w-[95vw] xl:max-w-[1800px]" 
    : "max-w-3xl";

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case View.CONTRACT_REVIEW:
        return <ContractReview />;
      case View.CONTRACT_COMPARISON: 
        return <ContractComparison />;
      // Fix: Corrected property name from NDA_Triage to NDA_TRIAGE as defined in types.ts
      case View.NDA_TRIAGE:
        return <NdaTriage />;
      case View.COMPLIANCE:
        return <ComplianceCheck />;
      case View.DPIA_GENERATOR:
        return <DpiaGenerator />;
      case View.CHRONOLOGY_BUILDER: 
        return <ChronologyBuilder />;
      case View.RISK_ASSESSMENT:
        return <RiskAssessment />;
      case View.MARKETING_CHECK:
        return <MarketingCheck />;
      case View.LEGAL_NOTICE:
        return <LegalNotice />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] relative selection:bg-slate-200 font-sans text-firm-navy">
      
      {/* Background Ambience - Minimal */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] rounded-full bg-slate-100/40 blur-[150px]" />
      </div>

      {/* Legal Gatekeeper */}
      <LegalModal onAccept={() => {}} />

      <Header currentView={currentView} />
      <TokenPill />
      
      <main className={`flex-1 w-full mx-auto px-6 pt-4 pb-48 relative z-10 transition-[max-width] duration-500 ease-in-out ${containerClass}`}>
        {renderView()}
        
        {/* Risk-Reduced Disclaimer Footer */}
        <div className="mt-12 text-center border-t border-slate-100 pt-8 pb-4 opacity-60">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            LegalThink – KI-Assistenz für Rechtsanwälte
          </p>
          <div className="flex justify-center gap-4 mt-2">
             <button 
               onClick={() => setCurrentView(View.LEGAL_NOTICE)}
               className="text-[10px] text-firm-accent hover:underline font-medium"
             >
               Haftungsausschluss & Datenschutz
             </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            <strong>Wichtiger technischer Hinweis:</strong> Zur Analyse werden Daten an die <strong>Google Gemini API</strong> übertragen. 
            Einzelheiten zur Datennutzung und Sicherheit entnehmen Sie bitte den <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="underline">Google Gemini API Terms</a>. 
            LegalThink übernimmt keine Gewähr für die Einhaltung dieser Bedingungen durch Drittanbieter.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent pointer-events-none z-20" />

      <Navigation currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TokenProvider>
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </TokenProvider>
  );
};

export default App;
