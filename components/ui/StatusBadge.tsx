import React from 'react';
import { RiskColor } from '../../types';

interface StatusBadgeProps {
  status: RiskColor | string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClass = "";
  let glowClass = "";
  
  switch (status) {
    case 'GRÜN':
      colorClass = "bg-neon-lime/10 text-neon-lime border-neon-lime/20";
      glowClass = "shadow-[0_0_10px_rgba(132,204,22,0.3)]";
      break;
    case 'GELB':
      colorClass = "bg-yellow-400/10 text-yellow-500 border-yellow-400/20";
      glowClass = "shadow-[0_0_10px_rgba(250,204,21,0.3)]";
      break;
    case 'ROT':
      colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
      glowClass = "shadow-[0_0_10px_rgba(239,68,68,0.3)]";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-600 border-gray-200";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  };

  return (
    <span className={`inline-flex items-center justify-center font-semibold rounded-full border ${colorClass} ${glowClass} ${sizeClasses[size]} backdrop-blur-sm transition-all duration-300`}>
      {status}
    </span>
  );
};

export default StatusBadge;