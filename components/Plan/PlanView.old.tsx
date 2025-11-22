import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Focus, FocusStatus, ViewMode, Project } from '../../types';
import { ChevronLeft, ChevronRight, GripVertical, LayoutGrid, Calendar as CalendarIcon, Filter, Target, Plus, Check, ChevronDown, X, CornerDownLeft } from 'lucide-react';
import { addDays, endOfMonth, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, addMonths, isToday } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';

// --- New Task Dialog ---
interface AddTaskDialogProps {
  date: Date;
  projects: Project[];
  onClose: () => void;
  onAdd: (title: string, projectId?: string) => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ date, projects, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title, projectId || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl border border-zinc-200 w-[400px] p-4 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">Add Task for {format(date, 'MMM do')}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-800"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-zinc-700"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">No Project (Optional)</option>
            {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 rounded-md">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Filter Popover ---
interface FilterPopoverProps {
  activeFilter: string;
  projects: Project[];
  onFilterChange: (id: string) => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ activeFilter, projects, onFilterChange }) => {
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
}

// --- Main Component ---

export const PlanView: React.FC = () => {
  const { focuses, projects, updateFocus, scheduleFocus, addFocus } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projectFilter, setProjectFilter] = useState<string>('All');
  
  // New Focus input (Sidebar)
  const [quickFocusTitle, setQuickFocusTitle] = useState('');
  const [isAddingSideTask, setIsAddingSideTask] = useState(false);
  const quickFocusInputRef = useRef<HTMLInputElement>(null);

  // Dialog State for Calendar Add
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);

  // Focus the input when adding starts
  useEffect(() => {
    if (isAddingSideTask) {
        quickFocusInputRef.current?.focus();
    }
  }, [isAddingSideTask]);

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, focusId: string) => {
    e.dataTransfer.setData('focusId', focusId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDate = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.stopPropagation();
    const focusId = e.dataTransfer.getData('focusId');
    if (focusId) {
      scheduleFocus(focusId, dateStr);
    }
  };

  const handleDropToBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const focusId = e.dataTransfer.getData('focusId');
    if (focusId) {
        // Unschedule: Remove date and set status back to Backlog
        updateFocus(focusId, { 
            status: FocusStatus.Backlog, 
            scheduledDate: undefined 
        });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // --- Data Prep ---
  const unscheduledFocuses = useMemo(() => {
    let filtered = focuses.filter(f => f.status === FocusStatus.Backlog);
    if (projectFilter !== 'All') {
      filtered = filtered.filter(f => f.projectId === projectFilter);
    }
    return filtered;
  }, [focuses, projectFilter]);

  const calendarDays = useMemo(() => {
    const start = viewMode === 'month' ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate);
    const end = viewMode === 'month' ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const getFocusesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return focuses.filter(f => 
      f.scheduledDate === dateStr && 
      (projectFilter === 'All' || f.projectId === projectFilter)
    );
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId)?.title;
  };

  // --- Handlers ---

  const handleQuickAddSidebar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFocusTitle.trim()) return;
    addFocus({ 
        title: quickFocusTitle, 
        status: FocusStatus.Backlog,
        projectId: projectFilter !== 'All' ? projectFilter : undefined
    });
    setQuickFocusTitle('');
    // Keep focus
    quickFocusInputRef.current?.focus();
  };

  const handleAddTaskOnDate = (title: string, projectId?: string) => {
    if (!newTaskDate) return;
    addFocus({
      title,
      status: FocusStatus.Scheduled,
      scheduledDate: format(newTaskDate, 'yyyy-MM-dd'),
      projectId: projectId || (projectFilter !== 'All' ? projectFilter : undefined)
    });
    setNewTaskDate(null);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    // If in week mode, verify scroll
    setTimeout(() => {
        const dateStr = format(today, 'yyyy-MM-dd');
        const el = document.getElementById(`day-column-${dateStr}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, 100);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* LEFT SIDEBAR: FOCUS (Drop Zone for Unscheduling) */}
      <div 
        className="w-[280px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col z-10 shrink-0"
        onDragOver={handleDragOver}
        onDrop={handleDropToBacklog}
      >
        <div className="p-4 border-b border-zinc-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
            <h2 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              <Target size={16} className="text-zinc-500" />
              Focus
              <span className="text-xs text-zinc-400 font-normal bg-zinc-100 px-2 py-0.5 rounded-full">{unscheduledFocuses.length}</span>
            </h2>
            <div className="flex items-center gap-1">
                <FilterPopover 
                  activeFilter={projectFilter} 
                  projects={projects} 
                  onFilterChange={setProjectFilter} 
                />
                <button 
                    onClick={() => setIsAddingSideTask(true)}
                    className={`p-1.5 rounded-md transition-colors ${isAddingSideTask ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
                    title="Add Focus"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
          {unscheduledFocuses.map(focus => (
            <div
              key={focus.id}
              draggable
              onDragStart={(e) => handleDragStart(e, focus.id)}
              className="group p-3 bg-white rounded-lg border border-zinc-200 shadow-sm cursor-move hover:border-zinc-300 hover:shadow-md transition-all select-none active:cursor-grabbing flex flex-col gap-1"
            >
              <div className="flex items-start gap-2">
                <GripVertical size={14} className="text-zinc-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 leading-snug truncate">{focus.title}</p>
                  {focus.projectId && (
                    <div className="mt-1.5 flex">
                        <span className="text-[9px] font-medium text-zinc-500 px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-100 truncate max-w-full">
                        {getProjectName(focus.projectId)}
                        </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Task Form */}
          {isAddingSideTask && (
             <div className="p-3 bg-white border border-zinc-200 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200 mb-2">
                <form onSubmit={handleQuickAddSidebar}>
                    <input 
                        ref={quickFocusInputRef}
                        className="w-full text-sm font-medium text-zinc-700 placeholder-zinc-400 border-none p-0 focus:ring-0 bg-transparent mb-3"
                        placeholder="Focus item..."
                        value={quickFocusTitle}
                        onChange={(e) => setQuickFocusTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Escape') setIsAddingSideTask(false);
                        }}
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                            <div className="text-xs text-zinc-400 truncate max-w-[100px]">
                                {projectFilter !== 'All' && (
                                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px]">{getProjectName(projectFilter)}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsAddingSideTask(false)}
                                className="px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={!quickFocusTitle.trim()}
                                className="px-2 py-1 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                Add <CornerDownLeft size={10} className="opacity-50"/>
                            </button>
                            </div>
                    </div>
                </form>
            </div>
          )}

          {unscheduledFocuses.length === 0 && !isAddingSideTask && (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-200/50 m-2 rounded-xl bg-zinc-50/50 p-8">
              <span className="text-xs italic mb-1">All clear</span>
              <span className="text-[10px] text-zinc-400">Drop tasks here to unschedule</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: CALENDAR/BOARD */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white shrink-0 z-30">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight w-40">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/50">
              <button onClick={() => setViewMode('month')} className={`p-1.5 px-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'month' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
                <CalendarIcon size={14} strokeWidth={2} />
                <span>Month</span>
              </button>
              <button onClick={() => setViewMode('week')} className={`p-1.5 px-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'week' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
                <LayoutGrid size={14} strokeWidth={2} />
                <span>Board</span>
              </button>
            </div>
            <div className="h-5 w-px bg-zinc-200"></div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
              <button onClick={handleJumpToToday} className="text-xs font-medium px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200">Today</button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className={`flex-1 ${viewMode === 'week' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto relative'}`}>
             
             {/* Sticky Header Row for Month View */}
             {viewMode === 'month' && (
                <div className="grid grid-cols-7 border-b border-zinc-200 sticky top-0 z-20 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="h-9 bg-zinc-50/80 backdrop-blur-sm text-[10px] font-semibold text-zinc-400 flex items-center justify-center uppercase tracking-widest border-r border-zinc-100/50 last:border-r-0">
                            {d}
                        </div>
                    ))}
                </div>
             )}

             <div className={`${
                 viewMode === 'week' 
                 ? 'flex h-full' 
                 : 'grid grid-cols-7 auto-rows-fr gap-px bg-zinc-100 border-l border-b border-zinc-200 min-h-[calc(100%-36px)]'
                 }`}>
                
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const dayFocuses = getFocusesForDate(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isTodayDate = isToday(day);

                    if (viewMode === 'week') {
                    // WEEK / BOARD VIEW
                    const hasTasks = dayFocuses.length > 0;
                    const isCompact = !isTodayDate && !hasTasks;

                    return (
                        <div 
                        key={dateStr} 
                        id={`day-column-${dateStr}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnDate(e, dateStr)}
                        className={`${isCompact ? 'min-w-[120px] w-[120px]' : 'min-w-[280px] w-[280px]'} flex-shrink-0 h-full bg-zinc-50/30 flex flex-col border-r border-zinc-200 transition-all duration-300 ${isTodayDate ? 'bg-zinc-50' : ''} group/col`}
                        >
                        <div className={`p-4 border-b border-zinc-200/50 flex justify-between items-center ${isTodayDate ? 'bg-zinc-100/80' : ''}`}>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                {isCompact ? format(day, 'EEE') : format(day, 'EEEE')}
                                </span>
                                <span className={`text-sm font-bold ${isTodayDate ? 'text-zinc-900' : 'text-zinc-400'}`}>{format(day, 'MM/dd')}</span>
                            </div>
                            {!isCompact && (
                                <button 
                                    onClick={() => setNewTaskDate(day)}
                                    className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover/col:opacity-100 transition-opacity"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                            {dayFocuses.map(focus => (
                            <div 
                                key={focus.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, focus.id)}
                                className={`p-3 bg-white rounded-lg border shadow-sm text-sm cursor-move group relative transition-all ${
                                focus.status === FocusStatus.Done ? 'opacity-60 grayscale border-zinc-100' : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start gap-3 mb-1">
                                <button 
                                    onClick={() => updateFocus(focus.id, { status: focus.status === FocusStatus.Done ? FocusStatus.Scheduled : FocusStatus.Done })}
                                    className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                                    focus.status === FocusStatus.Done 
                                    ? 'bg-zinc-800 border-zinc-800 text-white' 
                                    : 'border-zinc-300 hover:border-zinc-500 bg-white'
                                    }`}
                                >
                                    {focus.status === FocusStatus.Done && <div className="w-2 h-2 bg-white rounded-full"/>}
                                </button>
                                <span className={`leading-snug font-medium ${focus.status === FocusStatus.Done ? 'line-through decoration-zinc-300 text-zinc-400' : 'text-zinc-800'}`}>
                                    {focus.title}
                                </span>
                                </div>
                                {focus.projectId && (
                                <div className="ml-7">
                                    <span className="text-[9px] text-zinc-500 px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-100 truncate max-w-full inline-block">
                                        {getProjectName(focus.projectId)}
                                    </span>
                                </div>
                                )}
                            </div>
                            ))}
                             <button 
                                onClick={() => setNewTaskDate(day)}
                                className="w-full py-2 flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100/50 rounded-lg border border-dashed border-transparent hover:border-zinc-200 transition-all text-xs gap-1"
                            >
                                <Plus size={12} /> Add Task
                            </button>
                        </div>
                        </div>
                    )
                    } else {
                    // MONTH VIEW
                    return (
                        <div
                        key={dateStr}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnDate(e, dateStr)}
                        onClick={(e) => {
                            // Only trigger if clicking the background itself, not a child element
                            if (e.target === e.currentTarget) {
                                setNewTaskDate(day);
                            }
                        }}
                        className={`min-h-[120px] bg-white p-2 flex flex-col gap-1 transition-colors group/day ${
                            !isCurrentMonth ? 'bg-zinc-50/40' : ''
                        } hover:bg-zinc-50 relative cursor-pointer`}
                        >
                        <div className="flex justify-between items-start mb-1 pointer-events-none">
                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                                isTodayDate ? 'bg-zinc-900 text-white' : isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300'
                            }`}>
                                {format(day, 'd')}
                            </span>
                            {/* Add Button (Visible on Hover) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNewTaskDate(day);
                                }}
                                className="pointer-events-auto p-1 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-200 rounded-md opacity-0 group-hover/day:opacity-100 transition-opacity"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        
                        <div className="flex-1 space-y-1 pointer-events-none">
                            {dayFocuses.slice(0, 4).map(focus => (
                                <div 
                                key={focus.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, focus.id)}
                                className={`pointer-events-auto text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer border transition-all font-medium flex items-center gap-1 ${
                                    focus.status === FocusStatus.Done 
                                    ? 'bg-zinc-50 text-zinc-400 border-zinc-100 line-through' 
                                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 shadow-sm'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateFocus(focus.id, { status: focus.status === FocusStatus.Done ? FocusStatus.Scheduled : FocusStatus.Done });
                                }}
                                >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${focus.projectId ? 'bg-zinc-300' : 'bg-transparent border border-zinc-300'}`} />
                                <span className="truncate">{focus.title}</span>
                                </div>
                            ))}
                            {dayFocuses.length > 4 && (
                                <div className="text-[9px] text-zinc-400 pl-1 font-medium">
                                + {dayFocuses.length - 4} more
                                </div>
                            )}
                        </div>
                        </div>
                    );
                    }
                })}
            </div>
        </div>
        
        {/* Add Task Modal */}
        {newTaskDate && (
            <AddTaskDialog 
                date={newTaskDate} 
                projects={projects}
                onClose={() => setNewTaskDate(null)} 
                onAdd={handleAddTaskOnDate} 
            />
        )}
      </div>
    </div>
  );
};