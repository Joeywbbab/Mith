import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { FocusStatus, ViewMode } from '../../types';
import { Plus } from 'lucide-react';
import { addDays, endOfMonth, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, isToday } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import { AddTaskDialog } from './AddTaskDialog';
import { FocusSidebar } from './FocusSidebar';
import { CalendarToolbar } from './CalendarToolbar';

export const PlanView: React.FC = () => {
  const { focuses, projects, updateFocus, scheduleFocus, addFocus } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);

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

  const handleAddFocusFromSidebar = (title: string) => {
    addFocus({
      title,
      status: FocusStatus.Backlog,
      projectId: projectFilter !== 'All' ? projectFilter : undefined
    });
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);

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
      <FocusSidebar
        focuses={unscheduledFocuses}
        projects={projects}
        projectFilter={projectFilter}
        onFilterChange={setProjectFilter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDropToBacklog}
        onAddFocus={handleAddFocusFromSidebar}
      />

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <CalendarToolbar
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDateChange={setCurrentDate}
          onJumpToToday={handleJumpToToday}
        />

        <div className={`flex-1 ${viewMode === 'week' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto relative'}`}>

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

                {calendarDays.map((day) => {
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
