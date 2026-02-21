
import React from 'react';
import { GroundingMetadata } from '../../types';
import { Globe, ExternalLink, BookOpen } from 'lucide-react';

interface GroundingSourcesProps {
  metadata: GroundingMetadata | null | undefined;
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ metadata }) => {
  if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) {
    return null;
  }

  const sources = metadata.groundingChunks
    .map((chunk) => chunk.web)
    .filter((web) => web !== undefined);

  if (sources.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6 animate-enter">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-slate-100 dark:bg-firm-card text-slate-600 dark:text-slate-400 rounded">
          <BookOpen size={16} />
        </div>
        <h3 className="text-sm font-bold text-firm-navy font-serif uppercase tracking-wider">
          Quellenverzeichnis & Belege
        </h3>
      </div>

      {/* STANDARD GRID LAYOUT - Increased Font Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, idx) => {
          const index = idx + 1;
          let displayUrl = "Externe Quelle";

          try {
            if (source?.uri) {
              const url = new URL(source.uri);
              const path = url.pathname === '/' ? '' : url.pathname;
              const cleanHost = url.hostname.replace('www.', '');

              if (cleanHost.includes('vertexaisearch') || cleanHost.includes('google.com')) {
                displayUrl = "Web-Recherche";
              } else {
                displayUrl = cleanHost + path;
              }
            }
          } catch (e) { }

          return (
            <a
              key={idx}
              href={source?.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              {/* Index Badge */}
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded bg-slate-100 dark:bg-firm-card text-slate-500 text-xs font-mono font-bold group-hover:bg-[#05050A] group-hover:text-white dark:group-hover:bg-firm-accent dark:group-hover:text-[#05050A] transition-colors mt-0.5">
                {index}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-firm-navy leading-snug group-hover:underline decoration-slate-300 underline-offset-2 truncate">
                  {source?.title || "Kein Titel verfügbar"}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe size={12} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 font-medium truncate w-full block" title={displayUrl}>
                    {displayUrl}
                  </span>
                </div>
              </div>
              <ExternalLink size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default GroundingSources;
