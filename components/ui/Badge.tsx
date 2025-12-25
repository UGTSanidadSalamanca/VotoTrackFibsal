
import React, { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'destructive' | 'outline';
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variants = {
    default: 'border-transparent bg-primary text-white',
    accent: 'border-transparent bg-accent text-white',
    destructive: 'border-transparent bg-destructive text-white',
    outline: 'text-foreground border-white/20',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</div>;
};
