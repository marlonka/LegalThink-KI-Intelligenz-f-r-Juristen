
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, ContractAnalysisResponse, NdaTriageResponse, RiskAssessmentResponse, GroundingMetadata, ComparisonResponse, MarketingCheckResponse } from '../types';

interface AppContextType {
  state: AppState;
  toggleDemoMode: (enable: boolean) => void;
  setPlaybookFile: (file: File | null) => void;
  setThinking: (thinking: boolean) => void;
  // Context / Search
  addReferenceUrl: (url: string) => void;
  removeReferenceUrl: (url: string) => void;
  toggleSearch: (enable: boolean) => void;

  setContractFile: (file: File | null) => void;
  setContractPerspective: (perspective: 'BUYER' | 'SELLER' | 'NEUTRAL') => void;
  setContractAnalysis: (data: ContractAnalysisResponse | null, metadata?: GroundingMetadata) => void;

  // Comparison
  setComparisonFiles: (original: File | null, newFile: File | null) => void;
  setComparisonAnalysis: (data: ComparisonResponse | null, metadata?: GroundingMetadata) => void;

  // NDA
  setNdaFile: (file: File | null) => void;
  setNdaText: (text: string) => void;
  setNdaAnalysis: (data: NdaTriageResponse | null, metadata?: GroundingMetadata) => void;

  setComplianceFile: (file: File | null) => void;
  setComplianceResult: (result: string | null, metadata?: GroundingMetadata) => void;

  setRiskText: (text: string) => void;
  setRiskDisputeValue: (value: string) => void;
  setRiskAnalysis: (data: RiskAssessmentResponse | null, metadata?: GroundingMetadata) => void;

  // DPIA Setters
  setDpiaMode: (mode: 'CREATE' | 'UPDATE') => void;
  addDpiaFile: (file: File) => void;
  removeDpiaFile: (index: number) => void;
  setDpiaTextInput: (text: string) => void;
  setDpiaContext: (text: string) => void;
  setDpiaAnalysis: (result: string | null, metadata?: GroundingMetadata) => void;

  // Chronology Setters
  addChronologyFile: (file: File) => void;
  removeChronologyFile: (index: number) => void;
  setChronologyTextInput: (text: string) => void;
  setChronologyContext: (text: string) => void;
  setChronologyResult: (result: string | null, metadata?: GroundingMetadata) => void;
  setChronologyQuestions: (questions: string | null) => void;

  // NEW: Marketing Check Setters
  setMarketingFile: (file: File | null) => void;
  setMarketingText: (text: string) => void;
  setMarketingTargetAudience: (text: string) => void;
  setMarketingAnalysis: (data: MarketingCheckResponse | null, metadata?: GroundingMetadata) => void;
}

const initialState: AppState = {
  isDemoMode: false,
  playbookFile: null,
  isThinking: false,
  referenceUrls: [],
  useSearch: false,
  // CHANGED: Default is now 'BUYER' (Auftraggeber) as requested
  contractReview: { file: null, perspective: 'BUYER', analysis: null, groundingMetadata: null },
  comparison: { fileOriginal: null, fileNew: null, analysis: null, groundingMetadata: null },
  ndaTriage: { file: null, text: '', analysis: null, groundingMetadata: null },
  compliance: { file: null, result: null, groundingMetadata: null },
  dpia: { mode: 'CREATE', files: [], textInput: '', context: '', analysis: null, groundingMetadata: null },
  chronology: { files: [], textInput: '', context: '', result: null, questions: null, groundingMetadata: null },
  riskAssessment: { text: '', disputeValue: '', analysis: null, groundingMetadata: null },
  marketing: { file: null, text: '', targetAudience: '', analysis: null, groundingMetadata: null },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const toggleDemoMode = (enable: boolean) =>
    setState(prev => ({ ...prev, isDemoMode: enable }));

  const setPlaybookFile = (file: File | null) =>
    setState(prev => ({ ...prev, playbookFile: file }));

  const setThinking = (thinking: boolean) =>
    setState(prev => ({ ...prev, isThinking: thinking }));

  // New Context Logic
  const addReferenceUrl = (url: string) =>
    setState(prev => ({ ...prev, referenceUrls: [...prev.referenceUrls, url] }));

  const removeReferenceUrl = (url: string) =>
    setState(prev => ({ ...prev, referenceUrls: prev.referenceUrls.filter(u => u !== url) }));

  const toggleSearch = (enable: boolean) =>
    setState(prev => ({ ...prev, useSearch: enable }));

  const setContractFile = (file: File | null) =>
    setState(prev => ({ ...prev, contractReview: { ...prev.contractReview, file } }));

  const setContractPerspective = (perspective: 'BUYER' | 'SELLER' | 'NEUTRAL') =>
    setState(prev => ({ ...prev, contractReview: { ...prev.contractReview, perspective } }));

  const setContractAnalysis = (analysis: ContractAnalysisResponse | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, contractReview: { ...prev.contractReview, analysis, groundingMetadata: metadata || null } }));

  // Comparison Logic
  const setComparisonFiles = (original: File | null, newFile: File | null) =>
    setState(prev => ({ ...prev, comparison: { ...prev.comparison, fileOriginal: original, fileNew: newFile } }));

  const setComparisonAnalysis = (analysis: ComparisonResponse | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, comparison: { ...prev.comparison, analysis, groundingMetadata: metadata || null } }));

  const setNdaFile = (file: File | null) =>
    setState(prev => ({ ...prev, ndaTriage: { ...prev.ndaTriage, file } }));

  const setNdaText = (text: string) =>
    setState(prev => ({ ...prev, ndaTriage: { ...prev.ndaTriage, text } }));

  const setNdaAnalysis = (analysis: NdaTriageResponse | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, ndaTriage: { ...prev.ndaTriage, analysis, groundingMetadata: metadata || null } }));

  const setComplianceFile = (file: File | null) =>
    setState(prev => ({ ...prev, compliance: { ...prev.compliance, file } }));

  const setComplianceResult = (result: string | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, compliance: { ...prev.compliance, result, groundingMetadata: metadata || null } }));

  const setRiskText = (text: string) =>
    setState(prev => ({ ...prev, riskAssessment: { ...prev.riskAssessment, text } }));

  const setRiskDisputeValue = (value: string) =>
    setState(prev => ({ ...prev, riskAssessment: { ...prev.riskAssessment, disputeValue: value } }));

  const setRiskAnalysis = (analysis: RiskAssessmentResponse | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, riskAssessment: { ...prev.riskAssessment, analysis, groundingMetadata: metadata || null } }));

  // DPIA Logic
  const setDpiaMode = (mode: 'CREATE' | 'UPDATE') =>
    setState(prev => ({ ...prev, dpia: { ...prev.dpia, mode } }));

  const addDpiaFile = (file: File) =>
    setState(prev => ({ ...prev, dpia: { ...prev.dpia, files: [...prev.dpia.files, file] } }));

  const removeDpiaFile = (index: number) =>
    setState(prev => ({
      ...prev,
      dpia: { ...prev.dpia, files: prev.dpia.files.filter((_, i) => i !== index) }
    }));

  const setDpiaTextInput = (text: string) =>
    setState(prev => ({ ...prev, dpia: { ...prev.dpia, textInput: text } }));

  const setDpiaContext = (text: string) =>
    setState(prev => ({ ...prev, dpia: { ...prev.dpia, context: text } }));

  const setDpiaAnalysis = (result: string | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, dpia: { ...prev.dpia, analysis: result, groundingMetadata: metadata || null } }));

  // Chronology Logic
  const addChronologyFile = (file: File) =>
    setState(prev => ({ ...prev, chronology: { ...prev.chronology, files: [...prev.chronology.files, file] } }));

  const removeChronologyFile = (index: number) =>
    setState(prev => ({
      ...prev,
      chronology: { ...prev.chronology, files: prev.chronology.files.filter((_, i) => i !== index) }
    }));

  const setChronologyTextInput = (text: string) =>
    setState(prev => ({ ...prev, chronology: { ...prev.chronology, textInput: text } }));

  const setChronologyContext = (text: string) =>
    setState(prev => ({ ...prev, chronology: { ...prev.chronology, context: text } }));

  const setChronologyResult = (result: string | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, chronology: { ...prev.chronology, result: result, groundingMetadata: metadata || null } }));

  const setChronologyQuestions = (questions: string | null) =>
    setState(prev => ({ ...prev, chronology: { ...prev.chronology, questions } }));

  // Marketing Check Logic
  const setMarketingFile = (file: File | null) =>
    setState(prev => ({ ...prev, marketing: { ...prev.marketing, file } }));

  const setMarketingText = (text: string) =>
    setState(prev => ({ ...prev, marketing: { ...prev.marketing, text } }));

  const setMarketingTargetAudience = (text: string) =>
    setState(prev => ({ ...prev, marketing: { ...prev.marketing, targetAudience: text } }));

  const setMarketingAnalysis = (analysis: MarketingCheckResponse | null, metadata?: GroundingMetadata) =>
    setState(prev => ({ ...prev, marketing: { ...prev.marketing, analysis, groundingMetadata: metadata || null } }));

  return (
    <AppContext.Provider value={{
      state,
      toggleDemoMode,
      setPlaybookFile,
      setThinking,
      addReferenceUrl,
      removeReferenceUrl,
      toggleSearch,
      setContractFile,
      setContractPerspective,
      setContractAnalysis,
      setComparisonFiles,
      setComparisonAnalysis,
      setNdaFile,
      setNdaText,
      setNdaAnalysis,
      setComplianceFile,
      setComplianceResult,
      setRiskText,
      setRiskDisputeValue,
      setRiskAnalysis,
      setDpiaMode,
      addDpiaFile,
      removeDpiaFile,
      setDpiaTextInput,
      setDpiaContext,
      setDpiaAnalysis,
      addChronologyFile,
      removeChronologyFile,
      setChronologyTextInput,
      setChronologyContext,
      setChronologyResult,
      setChronologyQuestions,
      setMarketingFile,
      setMarketingText,
      setMarketingTargetAudience,
      setMarketingAnalysis
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
