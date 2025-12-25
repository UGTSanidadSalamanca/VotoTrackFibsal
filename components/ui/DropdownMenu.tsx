import React, { useState, useRef, useEffect, ReactNode, ReactElement } from 'react';

interface DropdownMenuProps {
    trigger: ReactNode;
    children: ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-white/10 focus:outline-none z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {React.Children.map(children, child =>
                            React.isValidElement<{ onClick?: () => void }>(child) ? React.cloneElement(child, { onClick: () => { setIsOpen(false); child.props.onClick?.(); } }) : child
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className }) => (
    <a
        href="#"
        className={`block px-4 py-2 text-sm text-foreground hover:bg-white/5 ${className}`}
        role="menuitem"
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
    >
        {children}
    </a>
);

export const DropdownMenuLabel: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="px-4 py-2 text-xs text-gray-400 uppercase">{children}</div>
);

export const DropdownMenuSeparator: React.FC = () => (
    <div className="my-1 border-t border-white/10"></div>
);