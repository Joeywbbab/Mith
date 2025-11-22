import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Project, ProjectType, FocusStatus } from '../../types';
import { Plus, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, CheckSquare, GraduationCap, Rocket, AlignLeft, MoreHorizontal, ChevronLeft, ChevronRight, X, CornerDownLeft, ChevronDown, Edit2 } from 'lucide-react';
import { format, addMonths, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';

// --- Custom DatePicker Component (shadcn style) ---
interface DatePickerProps {
  date?: string;
  onSelect: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(date ? new Date(date) : new Date());
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

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const handleDayClick = (d: Date) => {
    onSelect(format(d, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onSelect(format(today, 'yyyy-MM-dd'));
    setViewDate(today);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 w-full text-sm border rounded-md transition-all shadow-sm hover:bg-zinc-50 ${
          date ? 'text-zinc-900 border-zinc-200' : 'text-zinc-400 border-zinc-200 bg-transparent'
        }`}
      >
        <CalendarIcon size={14} className={date ? 'text-zinc-900' : 'text-zinc-400'} />
        <span>{date ? format(new Date(date), 'PPP') : 'Pick a date'}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-zinc-200 rounded-md shadow-lg p-3 w-[280px] animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-zinc-100 rounded-md text-zinc-500">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-zinc-900">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-zinc-100 rounded-md text-zinc-500">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] text-zinc-400 font-medium uppercase">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(d => {
              const isCurrentMonth = isSameMonth(d, viewDate);
              const isSelected = date && isSameDay(d, new Date(date));
              const isTodayDate = isToday(d);
              
              return (
                <button
                  key={d.toString()}
                  onClick={() => handleDayClick(d)}
                  className={`
                    h-8 w-8 text-xs rounded-md flex items-center justify-center transition-all
                    ${!isCurrentMonth ? 'text-zinc-300' : 'text-zinc-700 hover:bg-zinc-100'}
                    ${isSelected ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white font-medium' : ''}
                    ${!isSelected && isTodayDate ? 'text-zinc-900 font-bold bg-zinc-50' : ''}
                  `}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-2 border-t border-zinc-100">
            <button onClick={handleClear} className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100">
              Clear
            </button>
            <button onClick={handleToday} className="text-xs text-zinc-900 font-medium hover:bg-zinc-100 px-2 py-1 rounded">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export const ProjectsView: React.FC = () => {
  const { 
    projects, milestones, focuses, phases,
    addProject, deleteProject, updateProject,
    addMilestone, toggleMilestone, deleteMilestone,
    addFocus, updateFocus, deleteFocus,
    addPhase, updatePhase, deletePhase
  } = useStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'All' | ProjectType>('All');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all');
  const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPhase, setIsCreatingPhase] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseTitle, setEditingPhaseTitle] = useState('');
  
  // Action Plan State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const addTaskInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProjectType>(ProjectType.Assignment);
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Inline Task Adding State
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Auto-focus add task input
  useEffect(() => {
    if (isAddingTask) {
        addTaskInputRef.current?.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    if (phases.length > 0 && selectedPhaseId === 'all') {
      setSelectedPhaseId(phases[0].id);
    }
    if (selectedPhaseId !== 'all' && !phases.find(p => p.id === selectedPhaseId)) {
      setSelectedPhaseId(phases[0]?.id || 'all');
    }
  }, [phases, selectedPhaseId]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const typeMatch = filterType === 'All' || p.type === filterType;
      const phaseMatch = selectedPhaseId === 'all' ? true : p.phaseId === selectedPhaseId;
      return typeMatch && phaseMatch;
    });
  }, [projects, filterType, selectedPhaseId]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectMilestones = useMemo(() => {
    return milestones.filter(m => m.projectId === selectedProjectId).sort((a, b) => {
      return (new Date(a.dueDate || '9999-12-31').getTime() - new Date(b.dueDate || '9999-12-31').getTime());
    });
  }, [milestones, selectedProjectId]);

  const projectFocuses = useMemo(() => {
    return focuses.filter(f => f.projectId === selectedProjectId);
  }, [focuses, selectedProjectId]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addProject({
      title: newTitle,
      type: newType,
      description: newDesc,
      deadline: newDeadline || undefined,
      phaseId: selectedPhaseId === 'all' ? undefined : selectedPhaseId,
    });
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setIsCreating(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;
    addFocus({
      title: newTaskTitle,
      projectId: selectedProjectId,
      status: FocusStatus.Backlog
    });
    setNewTaskTitle('');
    // Keep input focused for multiple additions
    addTaskInputRef.current?.focus();
  };

  const handleDeleteFocus = (id: string) => {
    deleteFocus(id);
    setOpenMenuId(null);
  };

  // Sub-component for adding milestones
  const AddMilestoneRow = ({ projectId }: { projectId: string }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!title) return;
      addMilestone({
        projectId,
        title,
        dueDate: date || undefined,
        isDone: false
      });
      setTitle('');
      setDate('');
    };

    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-3 pl-1 group opacity-60 hover:opacity-100 transition-opacity">
        <div className="w-5 flex justify-center"><Plus size={14} className="text-zinc-400" /></div>
        <input 
          type="text" 
          placeholder="New milestone..." 
          className="flex-1 px-0 py-1 text-xs border-none bg-transparent focus:ring-0 placeholder-zinc-400 text-zinc-700"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        {title && (
          <input 
            type="date" 
            className="px-2 py-0.5 text-[10px] border border-zinc-200 rounded-md bg-white text-zinc-500 focus:ring-0 focus:border-zinc-300"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        )}
        <button type="submit" className="hidden">Add</button>
      </form>
    );
  };

  const getTypeIcon = (type: ProjectType, size = 14) => {
    return type === ProjectType.Assignment 
      ? <GraduationCap size={size} /> 
      : <Rocket size={size} />;
  };

  const phaseColors = ['#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffd8a8', '#e9fac8', '#d0bfff'];

  const handleCreatePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseTitle.trim()) return;
    const color = phaseColors[phases.length % phaseColors.length];
    addPhase({
      title: newPhaseTitle.trim(),
      color,
      position: Math.min(1, phases.length * 0.15),
    });
    setNewPhaseTitle('');
    setIsCreatingPhase(false);
    setIsPhaseDropdownOpen(false);
  };

  const groupedProjects = useMemo(() => {
    const groups: Record<string, typeof projects> = {};
    projects.forEach(p => {
      const key = p.phaseId || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [projects]);

  const commitPhaseEdit = (phaseId: string) => {
    if (editingPhaseTitle.trim()) {
      updatePhase(phaseId, { title: editingPhaseTitle.trim() });
    }
    setEditingPhaseId(null);
    setEditingPhaseTitle('');
  };

  return (
    <div className="flex h-full bg-white">
      {/* LEFT SIDEBAR: PHASE / PROJECT LIST */}
      <div className="w-[320px] border-r border-zinc-200 flex flex-col bg-zinc-50/30 shrink-0">
        <div className="h-16 px-5 border-b border-zinc-200 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20 relative">
          <button
            onClick={() => setIsPhaseDropdownOpen(!isPhaseDropdownOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-700"
          >
            <span>Phases</span>
            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{phases.length}</span>
            <ChevronDown size={14} className={`transition-transform ${isPhaseDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCreating(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-200"
              title="Add Project"
            >
              <Plus size={16} />
            </button>
          </div>

          {isPhaseDropdownOpen && (
            <div className="absolute left-3 right-3 top-16 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-72 overflow-y-auto divide-y divide-zinc-100 z-30">
              <button
                onClick={() => { setSelectedPhaseId('all'); setIsPhaseDropdownOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50"
              >
                <span>All phases</span>
                <span className="text-xs text-zinc-400">{projects.length}</span>
              </button>
              {phases.map(phase => (
                <div key={phase.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 text-sm gap-2">
                  {editingPhaseId === phase.id ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm border border-zinc-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                      value={editingPhaseTitle}
                      onChange={(e) => setEditingPhaseTitle(e.target.value)}
                      onBlur={() => commitPhaseEdit(phase.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitPhaseEdit(phase.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingPhaseId(null);
                          setEditingPhaseTitle('');
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="flex-1 text-left"
                      onClick={() => { setSelectedPhaseId(phase.id); setIsPhaseDropdownOpen(false); }}
                      onDoubleClick={() => {
                        setEditingPhaseId(phase.id);
                        setEditingPhaseTitle(phase.title);
                      }}
                    >
                      {phase.title}
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPhaseId(phase.id);
                        setEditingPhaseTitle(phase.title);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-zinc-700"
                      title="Rename phase"
                    >
                      <Edit2 size={12} />
                    </button>
                    <span className="text-xs text-zinc-400">{groupedProjects[phase.id]?.length || 0}</span>
                    <button
                      onClick={() => deletePhase(phase.id)}
                      className="text-[10px] text-zinc-400 hover:text-red-500"
                      title="Delete phase"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { setIsCreatingPhase(true); setIsPhaseDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Plus size={14} /> New phase
              </button>
            </div>
          )}
        </div>

        {/* Type filter tabs */}
        <div className="p-3 pb-1 border-b border-zinc-100/50 flex gap-1 bg-white/50 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterType('All')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
              filterType === 'All'
              ? 'bg-zinc-800 text-white' 
              : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType(ProjectType.Assignment)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === ProjectType.Assignment 
              ? 'bg-zinc-200 text-zinc-900' 
              : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <GraduationCap size={12} />
            Assignment
          </button>
          <button
            onClick={() => setFilterType(ProjectType.Initiative)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === ProjectType.Initiative 
              ? 'bg-zinc-200 text-zinc-900' 
              : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Rocket size={12} />
            Initiative
          </button>
        </div>

        {isCreatingPhase && (
          <div className="p-4 border-b border-zinc-200 bg-white animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleCreatePhase} className="space-y-3">
              <input
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200/50 focus:border-zinc-300 transition-all placeholder-zinc-400"
                placeholder="Phase Name"
                value={newPhaseTitle}
                onChange={(e) => setNewPhaseTitle(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreatingPhase(false)} className="text-xs text-zinc-500 hover:text-zinc-800 px-3 py-1.5">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-md hover:bg-zinc-800 shadow-sm">Create Phase</button>
              </div>
            </form>
          </div>
        )}

        {isCreating && (
          <div className="p-4 border-b border-zinc-200 bg-white animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input 
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200/50 focus:border-zinc-300 transition-all placeholder-zinc-400" 
                placeholder="Project Name" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewType(ProjectType.Assignment)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                    newType === ProjectType.Assignment
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setNewType(ProjectType.Initiative)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                    newType === ProjectType.Initiative
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  Initiative
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-zinc-500 hover:text-zinc-800 px-3 py-1.5">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-md hover:bg-zinc-800 shadow-sm">Create</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-2 space-y-3">
          {phases
            .filter(p => selectedPhaseId === 'all' ? true : p.id === selectedPhaseId)
            .map(phase => {
              const phaseProjects = (groupedProjects[phase.id] || []).filter(p => filterType === 'All' || p.type === filterType);
              return (
                <div key={phase.id} className="bg-white/60 border border-zinc-100 rounded-lg shadow-sm">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
                      <span className="text-sm font-semibold text-zinc-800">{phase.title}</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{phaseProjects.length}</span>
                    </div>
                    <button
                      onClick={() => deletePhase(phase.id)}
                      className="text-xs text-zinc-400 hover:text-red-500"
                      title="Delete phase"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {phaseProjects.length === 0 && (
                      <div className="px-4 py-3 text-xs text-zinc-400">No projects</div>
                    )}
                    {phaseProjects.map(project => {
                      const pMilestones = milestones.filter(m => m.projectId === project.id);
                      const completed = pMilestones.filter(m => m.isDone).length;
                      const total = pMilestones.length;
                      const progress = total === 0 ? 0 : (completed / total) * 100;
                      const isSelected = selectedProjectId === project.id;
                      return (
                        <div
                          key={project.id}
                          onClick={() => setSelectedProjectId(project.id)}
                          className={`group px-4 py-3 cursor-pointer transition-all select-none ${
                            isSelected 
                              ? 'bg-white'
                              : 'hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className={`text-sm font-medium truncate flex-1 ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>{project.title}</span>
                            <div className="flex items-center gap-2">
                              <div className={`${isSelected ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {getTypeIcon(project.type, 12)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-zinc-800' : 'bg-zinc-300'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            {project.deadline && (
                              <span className={`text-[10px] whitespace-nowrap font-medium ${
                                  new Date(project.deadline) < new Date() ? 'text-red-500' : isSelected ? 'text-zinc-500' : 'text-zinc-400'
                              }`}>
                                {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RIGHT CONTENT: PROJECT DETAILS */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 w-full animate-in fade-in duration-300">

            {/* PROJECT CARD */}
            <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-6 mb-10 shadow-sm relative group/card">
                {/* Delete Button (Hover) */}
                <button 
                    onClick={() => deleteProject(selectedProject.id)}
                    className="absolute right-4 top-4 text-zinc-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all opacity-0 group-hover/card:opacity-100"
                    title="Delete Project"
                >
                    <Trash2 size={14} />
                </button>

                <div className="flex flex-col gap-6">
                    {/* Title Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                             <span className="px-2 py-0.5 rounded bg-zinc-200/50 text-zinc-600 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                {getTypeIcon(selectedProject.type, 10)}
                                {selectedProject.type}
                             </span>
                        </div>
                        <input 
                            className="w-full text-2xl lg:text-3xl font-bold text-zinc-900 bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-300"
                            value={selectedProject.title}
                            onChange={(e) => updateProject(selectedProject.id, { title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-2">
                         {/* Left Column: Meta Info */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Deadline (Moved Above Description) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                    Deadline
                                </div>
                                <DatePicker 
                                    date={selectedProject.deadline}
                                    onSelect={(date) => updateProject(selectedProject.id, { deadline: date })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                    <AlignLeft size={12}/> Description
                                </div>
                                <textarea 
                                    className="bg-transparent w-full resize-none border-transparent hover:border-zinc-200 border rounded px-2 py-1.5 focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 outline-none text-zinc-700 text-sm leading-relaxed -ml-2"
                                    rows={3}
                                    placeholder="Add a description..."
                                    value={selectedProject.description || ''}
                                    onChange={(e) => updateProject(selectedProject.id, { description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Milestones */}
                        <div className="lg:col-span-3 bg-white rounded-lg border border-zinc-100 p-4 flex flex-col shadow-sm">
                            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                Milestones
                            </h3>
                            <div className="space-y-1 flex-1">
                                {projectMilestones.length === 0 && (
                                    <div className="text-center py-4 text-zinc-300 text-xs italic">No milestones yet.</div>
                                )}
                                {projectMilestones.map(m => (
                                <div key={m.id} className="group relative flex items-start py-1.5 pr-6 hover:bg-zinc-50 rounded-md transition-colors -mx-2 px-2">
                                    <button 
                                        onClick={() => toggleMilestone(m.id)}
                                        className={`mt-0.5 mr-3 transition-colors ${m.isDone ? 'text-zinc-800' : 'text-zinc-300 hover:text-zinc-400'}`}
                                    >
                                        {m.isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium transition-all truncate ${m.isDone ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-800'}`}>
                                            {m.title}
                                        </div>
                                        {m.dueDate && (
                                            <div className="text-[10px] text-zinc-400">
                                                {new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => deleteMilestone(m.id)} className="absolute right-1 top-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                ))}
                                <div className="pt-1">
                                    <AddMilestoneRow projectId={selectedProject.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION PLAN SECTION (Horizontal Full Width) */}
            <section className="animate-in slide-in-from-bottom-2 duration-500 pb-10">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-2">
                     <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                        <CheckSquare size={16} className="text-zinc-500"/>
                        Action Plan
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">{projectFocuses.filter(f => f.status === FocusStatus.Done).length} / {projectFocuses.length} completed</span>
                        <button 
                            onClick={() => setIsAddingTask(true)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="Add Task"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
               
                <div className="grid grid-cols-1 gap-2">
                    {projectFocuses.map(f => (
                    <div key={f.id} className="group flex items-center gap-4 p-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 hover:shadow-sm transition-all relative">
                        <button 
                            onClick={() => updateFocus(f.id, { status: f.status === FocusStatus.Done ? FocusStatus.Backlog : FocusStatus.Done })}
                            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                f.status === FocusStatus.Done ? 'bg-zinc-800 border-zinc-800 text-white' : 'bg-white border-zinc-300 hover:border-zinc-400'
                            }`}
                        >
                            {f.status === FocusStatus.Done && <CheckSquare size={12} />}
                        </button>
                        
                        <div className="flex-1 flex items-center justify-between min-w-0 gap-4">
                            <input 
                                className={`w-full bg-transparent border-none p-0 text-sm font-medium truncate px-2 -ml-2 rounded-md focus:ring-2 focus:ring-zinc-100 focus:bg-zinc-50 transition-all ${f.status === FocusStatus.Done ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-700'}`}
                                value={f.title}
                                onChange={(e) => updateFocus(f.id, { title: e.target.value })}
                            />
                            
                            {f.scheduledDate && (
                                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0 ${
                                    f.status === FocusStatus.Done ? 'bg-zinc-50 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                    <CalendarIcon size={10} />
                                    {new Date(f.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                </span>
                            )}
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setOpenMenuId(openMenuId === f.id ? null : f.id); 
                                }}
                                className={`p-1 rounded hover:bg-zinc-100 text-zinc-300 hover:text-zinc-600 transition-all cursor-pointer ${openMenuId === f.id ? 'text-zinc-600 bg-zinc-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                 <MoreHorizontal size={14} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openMenuId === f.id && (
                                <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    <button 
                                        onClick={() => handleDeleteFocus(f.id)}
                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        Delete Task
                                    </button>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                    ))}
                    
                    {/* Add Task Card (Todoist style) */}
                    {isAddingTask ? (
                        <div className="mt-2 border border-zinc-200 rounded-lg p-3 bg-white shadow-sm animate-in slide-in-from-top-2 duration-200">
                            <form onSubmit={handleAddTask}>
                                <input 
                                    ref={addTaskInputRef}
                                    className="w-full text-sm font-medium text-zinc-700 placeholder-zinc-400 border-none p-0 focus:ring-0 bg-transparent mb-3"
                                    placeholder="What needs to be done?"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Escape') setIsAddingTask(false);
                                    }}
                                />
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                                     <div className="text-xs text-zinc-400">
                                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px]">{selectedProject?.title}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAddingTask(false)}
                                            className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={!newTaskTitle.trim()}
                                            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                        >
                                            Add Task <CornerDownLeft size={10} className="opacity-50"/>
                                        </button>
                                     </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingTask(true)}
                            className="mt-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors w-fit group"
                        >
                            <Plus size={16} className="group-hover:text-zinc-600" />
                            <span className="text-xs font-medium">Add Task</span>
                        </button>
                    )}
                </div>
            </section>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-300 flex-col gap-6 bg-zinc-50/30">
            <div className="w-16 h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm">
               <GraduationCap size={32} strokeWidth={1} className="text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-400">Select a project to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
