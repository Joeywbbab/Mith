import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ViewMode } from '../../types';

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
  onJumpToToday: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onDateChange,
  onJumpToToday
}) => {
  return (
    <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white shrink-0 z-30">
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight w-40">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/50">
          <button onClick={() => onViewModeChange('month')} className={`p-1.5 px-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'month' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <CalendarIcon size={14} strokeWidth={2} />
            <span>Month</span>
          </button>
          <button onClick={() => onViewModeChange('week')} className={`p-1.5 px-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'week' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <LayoutGrid size={14} strokeWidth={2} />
            <span>Week</span>
          </button>
        </div>
        <div className="h-5 w-px bg-zinc-200"></div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDateChange(subMonths(currentDate, 1))} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={onJumpToToday} className="text-xs font-medium px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200">Today</button>
          <button onClick={() => onDateChange(addMonths(currentDate, 1))} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};
