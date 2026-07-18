import React from 'react';

export const LiveBadge = ({ label = 'LIVE', className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 live-pulse ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
      {label}
    </span>
  );
};

export default LiveBadge;
