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
    primary: "bg-firm-navy text-white shadow-firm hover:bg-[#1e293b]", 
    secondary: "bg-white text-firm-navy border border-slate-200 hover:border-firm-navy hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:text-firm-navy hover:bg-slate-100"
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