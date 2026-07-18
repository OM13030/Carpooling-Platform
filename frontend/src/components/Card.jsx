import React from 'react';

export const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-5 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
