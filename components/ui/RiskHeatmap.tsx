import React from 'react';
import { RiskPoint } from '../../types';
import { Check } from 'lucide-react';

interface RiskHeatmapProps {
  points: RiskPoint[];
  activeCell: { prob: number, imp: number } | null;
  onCellClick: (prob: number, imp: number) => void;
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ points, activeCell, onCellClick }) => {

  const getCellLabel = (prob: number, imp: number) => {
    return points.filter(p => Math.round(p.probability) === prob && Math.round(p.impact) === imp);
  };

  const getCellColor = (prob: number, imp: number, isActive: boolean, hasRisks: boolean) => {
    if (!hasRisks) return 'bg-firm-card hover:bg-slate-50';

    const score = prob * imp;
    let base = '';

    if (score >= 15) base = 'bg-red-500 text-white';
    else if (score >= 8) base = 'bg-amber-400 text-amber-900';
    else base = 'bg-emerald-500 text-white';

    if (isActive) {
      return `${base} ring-4 ring-firm-navy/20 scale-105 z-20 shadow-lg`;
    }

    // Dim others if one is active elsewhere
    if (activeCell && !isActive) {
      return `${base} opacity-40 grayscale-[0.5]`;
    }

    return base;
  };

  return (
    <div className="relative p-2 md:p-8 bg-firm-card rounded-xl border border-slate-200 shadow-sm mt-8 select-none">

      <div className="flex gap-4 md:gap-8">
        {/* Y-Axis Label */}
        <div className="hidden md:flex flex-col justify-center items-center w-8 shrink-0 relative h-[350px]">
          <div className="absolute inset-y-0 -left-4 flex flex-col justify-between py-4 pointer-events-none">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hoch</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Niedrig</span>
          </div>
          <div className="-rotate-90 whitespace-nowrap text-xs font-bold text-firm-navy uppercase tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 text-center">
            Eintrittswahrscheinlichkeit
          </div>
        </div>

        <div className="flex-1 relative">
          {/* Grid Container */}
          <div className="grid grid-cols-5 gap-1.5 auto-rows-[1fr] h-[350px] md:h-[400px] relative z-10 bg-slate-100 dark:bg-firm-card p-1.5 rounded-lg border border-slate-200 dark:border-firm-slate/20">
            {/* Render Grid Cells - Top to Bottom (Prob 5 -> 1) */}
            {[5, 4, 3, 2, 1].map((prob) => (
              <React.Fragment key={prob}>
                {[1, 2, 3, 4, 5].map((imp) => {
                  const cellRisks = getCellLabel(prob, imp);
                  const hasRisks = cellRisks && cellRisks.length > 0;
                  const isActive = activeCell?.prob === prob && activeCell?.imp === imp;

                  return (
                    <div
                      key={`${prob}-${imp}`}
                      onClick={() => hasRisks && onCellClick(prob, imp)}
                      className={`
                        relative rounded transition-all duration-200 flex items-center justify-center border border-transparent
                        ${getCellColor(prob, imp, isActive, !!hasRisks)}
                        ${hasRisks ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
                      `}
                    >
                      {hasRisks && (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-lg md:text-2xl font-serif leading-none">
                            {cellRisks.length}
                          </span>
                          {isActive && <Check size={12} className="mt-1" strokeWidth={4} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* X-Axis Label */}
          <div className="mt-4 flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geringer Schaden</span>
            <div className="h-px flex-1 bg-slate-200 mx-4 relative top-[1px]"></div>
            <span className="text-xs font-bold text-firm-navy uppercase tracking-widest">Schadensausmaß (Impact)</span>
            <div className="h-px flex-1 bg-slate-200 mx-4 relative top-[1px]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Katastrophal</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-[10px] text-slate-400 italic">
        Klicken Sie auf eine farbige Zelle, um die Details unten zu filtern.
      </div>
    </div>
  );
};

export default RiskHeatmap;
