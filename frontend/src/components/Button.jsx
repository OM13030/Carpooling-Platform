import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-5 py-2.5 rounded-xl font-medium transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer shadow-sm flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:opacity-90 border border-secondary/20",
    outline: "bg-transparent border border-border text-foreground hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-red-600 text-white hover:bg-red-700 border border-red-800/20",
    ghost: "bg-transparent text-foreground hover:bg-accent"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
