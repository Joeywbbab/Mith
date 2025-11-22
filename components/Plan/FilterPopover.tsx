import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';
import { Project } from '../../types';

interface FilterPopoverProps {
  activeFilter: string;
  projects: Project[];
  onFilterChange: (id: string) => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({ activeFilter, projects, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options = useMemo(() => [
    { value: 'All', label: 'All Projects' },
    ...projects.map(p => ({ value: p.id, label: p.title }))
  ], [projects]);

  return (
    <div className="relative" ref={containerRef}>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-md transition-colors ${
                activeFilter !== 'All' ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Filter by Project"
        >
            <Filter size={16} />
        </button>

        {isOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-zinc-200 rounded-md shadow-lg p-1 w-[200px] animate-in fade-in zoom-in-95 duration-100">
                {options.map(option => (
                    <button
                    key={option.value}
                    onClick={() => {
                        onFilterChange(option.value);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
                    >
                    <span className="truncate">{option.label}</span>
                    {activeFilter === option.value && <Check size={12} className="text-zinc-900" />}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};
