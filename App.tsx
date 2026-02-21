
import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import TokenPill from './components/Layout/TokenPill';
import LegalModal from './components/Layout/LegalModal';
import PageTransition from './components/Layout/PageTransition';
import { AnimatePresence } from 'framer-motion';
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
    : "max-w-6xl";

  const renderView = () => {
    let viewContent;
    switch (currentView) {
      case View.DASHBOARD:
        viewContent = <Dashboard onNavigate={setCurrentView} />; break;
      case View.CONTRACT_REVIEW:
        viewContent = <ContractReview />; break;
      case View.CONTRACT_COMPARISON:
        viewContent = <ContractComparison />; break;
      case View.NDA_TRIAGE:
        viewContent = <NdaTriage />; break;
      case View.COMPLIANCE:
        viewContent = <ComplianceCheck />; break;
      case View.DPIA_GENERATOR:
        viewContent = <DpiaGenerator />; break;
      case View.CHRONOLOGY_BUILDER:
        viewContent = <ChronologyBuilder />; break;
      case View.RISK_ASSESSMENT:
        viewContent = <RiskAssessment />; break;
      case View.MARKETING_CHECK:
        viewContent = <MarketingCheck />; break;
      case View.LEGAL_NOTICE:
        viewContent = <LegalNotice />; break;
      default:
        viewContent = <Dashboard onNavigate={setCurrentView} />; break;
    }
    return (
      <AnimatePresence mode="wait">
        <PageTransition viewKey={currentView}>
          {viewContent}
        </PageTransition>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-firm-paper relative selection:bg-firm-accent/20 font-sans text-firm-navy">

      {/* Background Ambience - Premium Editorial */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle radial gradient instead of flat color */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-firm-paper to-firm-paper" />
        {/* Distinctive gold ambient glow - Expanded to prevent cutoff on ultrawide monitors */}
        <div className="absolute top-[-30%] right-[-20%] w-[150vw] md:w-[120vw] lg:w-[1500px] h-[1000px] md:h-[1500px] rounded-[100%] bg-firm-accent/5 blur-[120px] md:blur-[180px]" />
      </div>

      {/* Legal Gatekeeper */}
      <LegalModal onAccept={() => { }} />

      <Header currentView={currentView} />
      <TokenPill />

      <main className={`flex-1 w-full mx-auto px-6 pt-8 md:pt-12 pb-48 relative z-10 transition-[max-width] duration-500 ease-in-out ${containerClass}`}>
        {renderView()}

        {/* Risk-Reduced Disclaimer Footer */}
        <div className="mt-12 text-center border-t border-firm-slate/10 pt-8 pb-4 opacity-70">
          <p className="text-[10px] text-firm-slate uppercase tracking-widest font-bold">
            LegalThink – KI-Assistenz für Rechtsanwälte
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={() => setCurrentView(View.LEGAL_NOTICE)}
              className="text-[10px] text-firm-accent hover:underline font-semibold transition-colors duration-200"
            >
              Haftungsausschluss & Datenschutz
            </button>
          </div>
          <p className="text-[10px] text-firm-slate/70 mt-3 max-w-lg mx-auto leading-relaxed">
            <strong>Wichtiger technischer Hinweis:</strong> Zur Analyse werden Daten an die <strong>Google Gemini API</strong> übertragen.
            Einzelheiten zur Datennutzung und Sicherheit entnehmen Sie bitte den <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="underline hover:text-firm-accent transition-colors">Google Gemini API Terms</a>.
            LegalThink übernimmt keine Gewähr für die Einhaltung dieser Bedingungen durch Drittanbieter.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-firm-paper via-firm-paper/90 to-transparent pointer-events-none z-20" />

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
