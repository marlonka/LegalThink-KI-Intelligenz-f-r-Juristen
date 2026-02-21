import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // REPLACED transition-all with specific properties for performance
  const baseStyles = "relative px-6 py-3.5 rounded-lg font-medium tracking-wide transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform-gpu";
  
  const variants = {
    primary: "bg-[#05050A] text-white shadow-firm hover:bg-[#1e293b] dark:bg-firm-accent dark:text-[#05050A] dark:hover:bg-firm-accent/90", 
    secondary: "bg-firm-card text-firm-navy border border-firm-border hover:border-firm-accent/50 hover:bg-firm-card/80",
    ghost: "bg-transparent text-firm-slate hover:text-firm-navy hover:bg-firm-navy/5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
