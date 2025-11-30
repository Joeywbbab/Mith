import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check, GraduationCap, Rocket, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Project, ProjectType } from '../../types';
import { DatePicker } from '../Projects/DatePicker';

interface AddTaskDialogProps {
  date: Date;
  projects: Project[];
  onClose: () => void;
  onAdd: (title: string, projectId?: string, startDate?: string, endDate?: string) => void;
}

const getTypeIcon = (type: ProjectType, size: number = 14) => {
  return type === ProjectType.Assignment 
    ? <GraduationCap size={size} />
    : <Rocket size={size} />;
};

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ date, projects, onAdd, onClose }) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState(format(date, 'yyyy-MM-dd'));
  // Check for drag-to-create end date
  const initialEndDate = (window as any).__createEndDate || format(date, 'yyyy-MM-dd');
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Clear the drag-to-create end date after reading
    (window as any).__createEndDate = undefined;
  }, []);

  useEffect(() => {
    if (isProjectDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isProjectDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProjectDropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const finalStartDate = startDate || format(date, 'yyyy-MM-dd');
      const finalEndDate = endDate || finalStartDate;
      onAdd(title, projectId || undefined, finalStartDate, finalEndDate);
      onClose();
    }
  };

  const selectedProject = projects.find(p => p.id === projectId);
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-zinc-200 w-[420px] p-5 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">Add Task for {format(date, 'MMM do')}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="What needs to be done?"
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          
          {/* Date Range Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Start Date</label>
              <DatePicker
                date={startDate}
                onSelect={(selectedDate) => {
                  setStartDate(selectedDate);
                  // If end date is before new start date, update end date
                  if (endDate && selectedDate > endDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">End Date</label>
              <DatePicker
                date={endDate}
                onSelect={(selectedDate) => {
                  setEndDate(selectedDate);
                  // If end date is before start date, update start date
                  if (selectedDate < startDate) {
                    setStartDate(selectedDate);
                  }
                }}
              />
            </div>
          </div>
          
          {/* Custom Project Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all flex items-center justify-between hover:bg-zinc-100"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedProject ? (
                  <>
                    <div className="text-zinc-500 flex-shrink-0">
                      {getTypeIcon(selectedProject.type, 14)}
                    </div>
                    <span className="text-zinc-700 truncate">{selectedProject.title}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">No Project (Optional)</span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                className={`text-zinc-400 flex-shrink-0 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
                {/* Search Input */}
                <div className="p-2 border-b border-zinc-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search projects..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-300"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                {/* Options List */}
                <div className="overflow-y-auto max-h-48">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId('');
                      setIsProjectDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 transition-colors ${
                      !projectId ? 'bg-zinc-50' : ''
                    }`}
                  >
                    {!projectId && <Check size={14} className="text-zinc-600 flex-shrink-0" />}
                    <span className={!projectId ? 'text-zinc-900 font-medium' : 'text-zinc-500'}>
                      No Project (Optional)
                    </span>
                  </button>
                  
                  {filteredProjects.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-zinc-400 text-center">
                      No projects found
                    </div>
                  ) : (
                    filteredProjects.map(project => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setProjectId(project.id);
                          setIsProjectDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 transition-colors ${
                          projectId === project.id ? 'bg-zinc-50' : ''
                        }`}
                      >
                        {projectId === project.id && (
                          <Check size={14} className="text-zinc-600 flex-shrink-0" />
                        )}
                        {projectId !== project.id && (
                          <div className="w-[14px] flex-shrink-0" />
                        )}
                        <div className="text-zinc-500 flex-shrink-0">
                          {getTypeIcon(project.type, 14)}
                        </div>
                        <span className={projectId === project.id ? 'text-zinc-900 font-medium' : 'text-zinc-700 truncate'}>
                          {project.title}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
