
export enum View {
  DASHBOARD = 'DASHBOARD',
  CONTRACT_REVIEW = 'CONTRACT_REVIEW',
  CONTRACT_COMPARISON = 'CONTRACT_COMPARISON',
  NDA_TRIAGE = 'NDA_TRIAGE',
  COMPLIANCE = 'COMPLIANCE',
  DPIA_GENERATOR = 'DPIA_GENERATOR',
  CHRONOLOGY_BUILDER = 'CHRONOLOGY_BUILDER',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  MARKETING_CHECK = 'MARKETING_CHECK', // NEW
  LEGAL_NOTICE = 'LEGAL_NOTICE'
}

export type RiskColor = 'GRÜN' | 'GELB' | 'ROT';

// Google Search Grounding Types
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingSupport {
  segment: {
    startIndex: number;
    endIndex: number;
    text: string;
  };
  groundingChunkIndices: number[];
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  searchEntryPoint?: {
    renderedContent: string;
  };
}

export interface ContractClause {
  title: string;
  rating: RiskColor;
  analysis: string;
  recommendation?: string;
  redline?: string;
  relevantParagraph?: string;
}

export interface ContractAnalysisResponse {
  executiveSummary: string;
  overallRiskScore: number;
  clauses: ContractClause[];
  missingClauses: string[];
  negotiationStrategy?: string;
}

export interface ContractChange {
  clauseTitle: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  originalText?: string;
  newText: string;
  legalImpact: string;
  strategicComment: string;
}

export interface ComparisonResponse {
  summaryOfChanges: string;
  strategicShift: string;
  changes: ContractChange[];
}

export interface NdaTriageResponse {
  verdict: RiskColor;
  score: number;
  summary: string;
  durationAnalysis: string;
  keyFindings: {
    label: string;
    value: string;
    isRisk: boolean;
  }[];
}

export interface RiskPoint {
  category: string;
  probability: number;
  impact: number;
  description: string;
}

export interface RiskAssessmentResponse {
  executiveSummary: string;
  overallRiskLevel: string;
  riskPoints: RiskPoint[];
  economicImpactAnalysis?: string;
}

// NEW: Marketing Check Types
export interface MarketingIssue {
  textSnippet: string;
  issueCategory: 'IRREFÜHRUNG' | 'UWG_SCHWARZE_LISTE' | 'HEILVERSPRECHEN' | 'GREENWASHING' | 'PREISANGABEN' | 'COPYRIGHT';
  riskLevel: 'HOCH' | 'MITTEL' | 'NIEDRIG';
  legalExplanation: string; // Why is this a problem?
  safeAlternative: string; // Rewrite suggestion
}

export interface MarketingCheckResponse {
  summary: string;
  abmahnRiskScore: number; // 0-100
  issues: MarketingIssue[];
  requiredDisclaimers: string[]; // e.g. "Includes mandatory impressed info"
}

// Global State Interface
export interface AppState {
  playbookFile: File | null;
  isThinking: boolean;
  referenceUrls: string[];
  useSearch: boolean;

  contractReview: {
    file: File | null;
    perspective: 'BUYER' | 'SELLER' | 'NEUTRAL';
    analysis: ContractAnalysisResponse | null;
    groundingMetadata: GroundingMetadata | null;
  };
  comparison: {
    fileOriginal: File | null;
    fileNew: File | null;
    analysis: ComparisonResponse | null;
    groundingMetadata: GroundingMetadata | null;
  };
  ndaTriage: {
    file: File | null;
    text: string;
    analysis: NdaTriageResponse | null;
    groundingMetadata: GroundingMetadata | null;
  };
  compliance: {
    file: File | null;
    result: string | null;
    groundingMetadata: GroundingMetadata | null;
  };
  dpia: {
    mode: 'CREATE' | 'UPDATE';
    files: File[];
    textInput: string;
    context: string;
    analysis: string | null;
    groundingMetadata: GroundingMetadata | null;
  };
  chronology: {
    files: File[];
    textInput: string;
    context: string;
    result: string | null;
    questions: string | null;
    groundingMetadata: GroundingMetadata | null;
  };
  riskAssessment: {
    text: string;
    disputeValue: string;
    analysis: RiskAssessmentResponse | null;
    groundingMetadata: GroundingMetadata | null;
  };
  marketing: { // NEW
    file: File | null; // Image or Text file
    text: string;
    targetAudience: string;
    analysis: MarketingCheckResponse | null;
    groundingMetadata: GroundingMetadata | null;
  };
}

export interface TokenUsage {
  promptTokens: number;
  cachedTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  model: string;
}

export interface ServiceResponse<T> {
  data: T;
  usage: TokenUsage;
  groundingMetadata?: GroundingMetadata;
}

export interface Pricing {
  input: number;
  cachedInput: number;
  output: number;
}

// UPDATED PRICING (USD per 1M Tokens) based on official list
export const MODEL_PRICING: Record<string, Pricing> = {
  'gemini-3.1-pro-preview': { input: 2.00, cachedInput: 0.20, output: 12.00 }, // Updated Cache from 0.50 to 0.20
  'gemini-3-flash-preview': { input: 0.50, cachedInput: 0.05, output: 3.00 }, // Updated Cache from 0.125 to 0.05
  'gemini-3-pro-image-preview': { input: 2.00, cachedInput: 0.20, output: 0.134 }, // Image output is technically per image/token equiv
};
