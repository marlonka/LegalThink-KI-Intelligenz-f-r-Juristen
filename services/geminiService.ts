
import { GoogleGenAI } from "@google/genai";
import { MODEL_FLASH, SYSTEM_INSTRUCTION_BASE } from "../constants";
import { TokenUsage, ServiceResponse, GroundingMetadata } from "../types";

// Fix: Corrected initialization of GoogleGenAI using process.env.API_KEY exclusively and named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Declare global Mammoth from CDN
declare const mammoth: any;

export interface FileData {
  mimeType: string;
  data: string; // base64
  name?: string; // filename for reference
}

export interface GenerationParams {
  prompt: string;
  fileData?: FileData;    // The specific document to analyze
  contextData?: FileData; // The static context (Playbook)
  additionalFiles?: FileData[]; // Support for multiple files
  referenceUrls?: string[];
  useSearch?: boolean;
  model?: string;
  responseSchema?: any;
  thinkingLevel?: "low" | "medium" | "high";
  mediaResolution?: "media_resolution_low" | "media_resolution_medium" | "media_resolution_high";
  viewContext?: 'CONTRACT' | 'NDA' | 'DPIA' | 'COMPLIANCE' | 'RISK' | 'CHRONOLOGY' | 'MARKETING_CHECK';
}

const getSearchInstruction = (context?: string) => {
  const base = `
  !!! RECHERCHE-ANWEISUNG (GROUNDING) !!!
  Die Google Suche ist AKTIV. Nutze sie, um Fakten zu verifizieren, statt zu halluzinieren.
  `;
  
  if (context === 'DPIA') {
      return `${base}
      - Validieren Sie die genannten technischen Anbieter (z.B. "AWS Serverstandorte DSGVO").
      - Suchen Sie nach Zertifizierungen der Anbieter (z.B. "Microsoft ISO 27001 Zertifikat").
      - Prüfen Sie die aktuelle Rechtslage zu Drittlandtransfers.
      `;
  }
  return base + " Verifiziere alle Tatsachenbehauptungen.";
};

export const injectCitations = (text: string, metadata: GroundingMetadata | undefined): string => {
    if (!metadata || !metadata.groundingSupports || !metadata.groundingChunks) {
        return text;
    }

    const supports = metadata.groundingSupports;
    const chunks = metadata.groundingChunks;
    let newText = text;

    const sortedSupports = [...supports].sort(
        (a, b) => (b.segment.endIndex ?? 0) - (a.segment.endIndex ?? 0)
    );

    for (const support of sortedSupports) {
        const endIndex = support.segment.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices || support.groundingChunkIndices.length === 0) {
            continue;
        }

        const citations = support.groundingChunkIndices.map(i => `${i + 1}`);
        const citationString = ` [${citations.join(', ')}]`;

        if (endIndex <= newText.length) {
            newText = newText.slice(0, endIndex) + citationString + newText.slice(endIndex);
        }
    }

    return newText;
};

/**
 * Extracts text from a Base64 encoded DOCX string using Mammoth.js.
 * Exported for UI preview usage.
 */
export const extractTextFromDocx = async (base64Data: string): Promise<string> => {
    if (typeof mammoth === 'undefined') {
        throw new Error("Mammoth.js library not loaded.");
    }

    try {
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
        return result.value;
    } catch (e) {
        console.error("Error parsing DOCX:", e);
        return "[Fehler beim Lesen der Word-Datei. Bitte als PDF hochladen oder Text kopieren.]";
    }
};

const isNativeGeminiType = (mimeType: string) => {
    return mimeType.startsWith('application/pdf') || 
           mimeType.startsWith('image/') || 
           mimeType.startsWith('audio/') || 
           mimeType.startsWith('video/');
};

const getThinkingBudget = (level: string) => {
    switch (level) {
        case 'low': return 2048;
        case 'medium': return 8192;
        default: return undefined; 
    }
};

export const generateAnalysis = async <T = any>({
  prompt,
  fileData,
  contextData,
  additionalFiles,
  referenceUrls,
  useSearch,
  model = MODEL_FLASH,
  responseSchema,
  thinkingLevel = "high",
  mediaResolution = "media_resolution_high",
  viewContext
}: GenerationParams): Promise<ServiceResponse<T>> => {
  // Fix: Directly check process.env.API_KEY for presence.
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  try {
    const finalConfig: any = {
      systemInstruction: SYSTEM_INSTRUCTION_BASE,
    };

    const tools: any[] = [];
    if (referenceUrls && referenceUrls.length > 0) tools.push({ urlContext: {} });
    if (useSearch) tools.push({ googleSearch: {} });
    if (tools.length > 0) finalConfig.tools = tools;

    const parts: any[] = [];
    const resolutionLevel = mediaResolution ? mediaResolution.toUpperCase() : "MEDIA_RESOLUTION_HIGH";
    
    let extractedTextPrompt = "";

    const processFile = async (file: FileData, label: string) => {
        if (isNativeGeminiType(file.mimeType)) {
            parts.push({ text: `${label}:` });
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                },
                ...(file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') 
                    ? { mediaResolution: { level: resolutionLevel } } 
                    : {})
            });
        } else if (file.mimeType.includes('wordprocessingml') || file.mimeType.includes('text/plain')) {
            let textContent = "";
            if (file.mimeType.includes('wordprocessingml')) {
                textContent = await extractTextFromDocx(file.data);
            } else {
                textContent = window.atob(file.data); 
            }
            extractedTextPrompt += `\n\n=== ${label} (Extrahierter Inhalt) ===\n${textContent}\n==================\n`;
        } else {
           console.warn(`Unsupported file type skipped: ${file.mimeType}`);
        }
    };

    if (contextData) await processFile(contextData, "REFERENZ-PLAYBOOK");
    if (fileData) await processFile(fileData, "HAUPTDOKUMENT ZUR ANALYSE");
    if (additionalFiles && additionalFiles.length > 0) {
        for (let i = 0; i < additionalFiles.length; i++) {
            await processFile(additionalFiles[i], `ANLAGE ${i + 1}`);
        }
    }

    if (referenceUrls && referenceUrls.length > 0) {
        let urlPrompt = "\n\nBERÜCKSICHTIGE FOLGENDE EXTERNE QUELLEN (URL Context):\n";
        referenceUrls.forEach(url => { urlPrompt += `- ${url}\n`; });
        parts.push({ text: urlPrompt });
    }

    let finalPrompt = prompt;
    if (extractedTextPrompt) finalPrompt += "\n\n" + extractedTextPrompt;
    if (useSearch) finalPrompt += "\n\n" + getSearchInstruction(viewContext);
    
    parts.push({ text: finalPrompt });

    if ((model.includes("gemini-3") || model.includes("gemini-2.5"))) {
        const budget = getThinkingBudget(thinkingLevel);
        if (budget) {
            finalConfig.thinkingConfig = { thinkingBudget: budget };
        }
    }

    if (responseSchema) {
      finalConfig.responseMimeType = "application/json";
      finalConfig.responseSchema = responseSchema;
    }

    // Fix: Updated call to generateContent to use the correct contents structure { parts }.
    const response = await ai.models.generateContent({
      model: model,
      config: finalConfig,
      contents: { parts: parts }
    });

    const text = response.text || "";
    const usageMetadata = response.usageMetadata;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    const usage: TokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      cachedTokens: usageMetadata?.cachedContentTokenCount || 0,
      candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
      model: model
    };

    let data: T;

    if (responseSchema) {
      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleanText) as T;
      } catch (e) {
        console.error("JSON Parse Error", e);
        throw new Error("Strukturierter Output fehlgeschlagen.");
      }
    } else {
      const textWithCitations = injectCitations(text, groundingMetadata);
      data = textWithCitations as unknown as T;
    }

    return { data, usage, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
