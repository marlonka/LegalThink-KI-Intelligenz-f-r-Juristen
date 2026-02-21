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
    primary: "bg-firm-accent text-firm-navy font-bold shadow-firm hover:brightness-105 dark:bg-firm-accent/10 dark:text-firm-accent dark:font-medium dark:ring-1 dark:ring-inset dark:ring-firm-accent/20 dark:hover:bg-firm-accent/20 dark:shadow-none",
    secondary: "bg-firm-card dark:bg-firm-card/5 text-firm-navy dark:text-slate-200 border border-firm-border dark:border-firm-slate/20 hover:border-firm-accent/50 dark:hover:border-firm-accent/80 hover:bg-firm-card/80 dark:hover:bg-firm-accent/10",
    ghost: "bg-transparent text-firm-slate dark:text-slate-400 hover:text-firm-navy dark:hover:text-white hover:bg-firm-navy/5 dark:hover:bg-firm-accent/20"
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
