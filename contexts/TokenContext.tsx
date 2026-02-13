
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TokenUsage, MODEL_PRICING } from '../types';

interface TokenContextType {
  totalUsage: {
    input: number;
    cached: number; // NEW
    output: number;
    total: number;
  };
  totalCost: number;
  requestCount: number;
  trackUsage: (usage: TokenUsage) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalUsage, setTotalUsage] = useState({ input: 0, cached: 0, output: 0, total: 0 });
  const [totalCost, setTotalCost] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  const trackUsage = (usage: TokenUsage) => {
    // Increment API Call Counter
    setRequestCount(prev => prev + 1);

    // Update raw token counts
    setTotalUsage(prev => ({
      input: prev.input + usage.promptTokens,
      cached: prev.cached + usage.cachedTokens, // Track cached separately
      output: prev.output + usage.candidatesTokens,
      total: prev.total + usage.totalTokens
    }));

    // Calculate Cost - CONSERVATIVE ESTIMATE (WORST CASE)
    // We intentionally ignore cache discounts for the displayed cost to avoid
    // underestimating liability for the user. We treat cached tokens as standard input tokens.
    const pricing = MODEL_PRICING[usage.model];
    if (pricing) {
      // Treat cached tokens as standard input tokens for cost estimation
      const effectiveInputTokens = usage.promptTokens + usage.cachedTokens;
      
      const costForRequest = 
        (effectiveInputTokens / 1_000_000 * pricing.input) + 
        (usage.candidatesTokens / 1_000_000 * pricing.output);
      
      setTotalCost(prev => prev + costForRequest);
    }
  };

  return (
    <TokenContext.Provider value={{ totalUsage, totalCost, requestCount, trackUsage }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
};
