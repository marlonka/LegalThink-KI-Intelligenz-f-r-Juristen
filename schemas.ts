
import { Type } from "@google/genai";

// Schema for Contract Review
export const ContractAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "A concise summary for the General Counsel." },
    overallRiskScore: { type: Type.INTEGER, description: "Risk score from 0 to 100." },
    clauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Clause title (e.g. 'Liability')." },
          rating: { type: Type.STRING, enum: ["GRÜN", "GELB", "ROT"], description: "Risk rating." },
          analysis: { type: Type.STRING, description: "Legal analysis referencing BGB." },
          recommendation: { type: Type.STRING, description: "Actionable advice." },
          redline: { type: Type.STRING, description: "Proposed text change." }
        },
        required: ["title", "rating", "analysis"]
      }
    },
    missingClauses: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of standard clauses that are missing."
    }
  },
  required: ["executiveSummary", "overallRiskScore", "clauses", "missingClauses"]
};

// Schema for Comparison
export const ComparisonSchema = {
  type: Type.OBJECT,
  properties: {
    summaryOfChanges: { type: Type.STRING, description: "High level summary of what the other party did." },
    strategicShift: { type: Type.STRING, description: "Did they become more aggressive, friendly, or sloppy?" },
    changes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clauseTitle: { type: Type.STRING },
          changeType: { type: Type.STRING, enum: ['ADDED', 'REMOVED', 'MODIFIED'] },
          severity: { type: Type.STRING, enum: ['CRITICAL', 'MAJOR', 'MINOR'] },
          originalText: { type: Type.STRING, nullable: true },
          newText: { type: Type.STRING },
          legalImpact: { type: Type.STRING, description: "What is the legal consequence of this specific change?" },
          strategicComment: { type: Type.STRING, description: "Hidden motive or strategic advice." }
        },
        required: ["clauseTitle", "changeType", "severity", "newText", "legalImpact", "strategicComment"]
      }
    }
  },
  required: ["summaryOfChanges", "strategicShift", "changes"]
};

// Schema for NDA Triage
export const NdaTriageSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["GRÜN", "GELB", "ROT"] },
    score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    durationAnalysis: { type: Type.STRING },
    keyFindings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING },
          isRisk: { type: Type.BOOLEAN }
        },
        required: ["label", "value", "isRisk"]
      }
    }
  },
  required: ["verdict", "score", "summary", "durationAnalysis", "keyFindings"]
};

// Schema for Risk Assessment
export const RiskAssessmentSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    overallRiskLevel: { type: Type.STRING, enum: ["Niedrig", "Mittel", "Hoch", "Kritisch"] },
    riskPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          probability: { type: Type.INTEGER, description: "1 to 5" },
          impact: { type: Type.INTEGER, description: "1 to 5" },
          description: { type: Type.STRING }
        },
        required: ["category", "probability", "impact", "description"]
      }
    }
  },
  required: ["executiveSummary", "overallRiskLevel", "riskPoints"]
};

// Schema for Marketing Check (UWG)
export const MarketingCheckSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Overall verdict on the marketing material." },
    abmahnRiskScore: { type: Type.INTEGER, description: "0-100 likelihood of receiving a warning letter." },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          textSnippet: { type: Type.STRING, description: "The specific text or visual element causing the issue." },
          issueCategory: { type: Type.STRING, enum: ['IRREFÜHRUNG', 'UWG_SCHWARZE_LISTE', 'HEILVERSPRECHEN', 'GREENWASHING', 'PREISANGABEN', 'COPYRIGHT'] },
          riskLevel: { type: Type.STRING, enum: ['HOCH', 'MITTEL', 'NIEDRIG'] },
          legalExplanation: { type: Type.STRING, description: "Reference to UWG or Case Law." },
          safeAlternative: { type: Type.STRING, description: "A compliant way to say the same thing." }
        },
        required: ["textSnippet", "issueCategory", "riskLevel", "legalExplanation", "safeAlternative"]
      }
    },
    requiredDisclaimers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Mandatory information missing (e.g. *prices incl. VAT)."
    }
  },
  required: ["summary", "abmahnRiskScore", "issues", "requiredDisclaimers"]
};
