
import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionContextValue {
  openItem: string | null;
  toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export const Accordion: React.FC<{ children: ReactNode; type: 'single'; collapsible?: boolean; }> = ({ children }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (value: string) => {
    setOpenItem(prev => (prev === value ? null : value));
  };

  return (
    <AccordionContext.Provider value={{ openItem, toggleItem }}>
      <div className="border border-white/10 rounded-md overflow-hidden">{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItemContext = createContext<{ value: string }>({ value: '' });

export const AccordionItem: React.FC<{ children: ReactNode; value: string }> = ({ children, value }) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className="border-b border-white/10 last:border-b-0">{children}</div>
    </AccordionItemContext.Provider>
  );
};

export const AccordionTrigger: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  const accordionContext = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);

  if (!accordionContext || !itemContext) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }

  const isOpen = accordionContext.openItem === itemContext.value;

  return (
    <h3 className="w-full">
      <button
        type="button"
        className={`flex justify-between items-center w-full p-4 font-medium text-left text-foreground hover:bg-white/5 transition-colors ${className}`}
        onClick={() => accordionContext.toggleItem(itemContext.value)}
        aria-expanded={isOpen}
      >
        <span className="flex-1">{children}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </h3>
  );
};

export const AccordionContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  const accordionContext = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);

  if (!accordionContext || !itemContext) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }
  
  const isOpen = accordionContext.openItem === itemContext.value;

  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} ${className}`}
    >
      <div className="overflow-hidden">
        <div className="p-4 bg-black/20">
          {children}
        </div>
      </div>
    </div>
  );
};
