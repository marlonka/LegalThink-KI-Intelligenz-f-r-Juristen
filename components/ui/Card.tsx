import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', delay = '' }) => {
  return (
    // Removed 'transition-all' - it is extremely heavy on the browser
    <div className={`bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-enter ${delay} ${className}`}>
      {children}
    </div>
  );
};

export default Card;