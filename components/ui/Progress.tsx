
import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
  indicatorColor?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '', indicatorColor = 'bg-primary' }) => {
  const progress = Math.max(0, Math.min(100, value || 0));

  return (
    <div className={`relative h-4 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className={`h-full w-full flex-1 ${indicatorColor} transition-all`}
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </div>
  );
};
