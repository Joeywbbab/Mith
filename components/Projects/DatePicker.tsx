import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface DatePickerProps {
  date?: string; // ISO date string (YYYY-MM-DD)
  onSelect: (date: string) => void; // Returns ISO date string (YYYY-MM-DD)
  compact?: boolean; // Show only icon with date on hover/tooltip
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, onSelect, compact = false }) => {
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
      {compact ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 text-[10px] transition-all rounded px-1.5 py-0.5 hover:bg-zinc-100 ${
            date ? 'text-zinc-500' : 'text-zinc-300 hover:text-zinc-400'
          }`}
          title={date ? format(new Date(date), 'PPP') : 'Set date'}
        >
          <CalendarIcon size={10} />
          {date && <span>{format(new Date(date), 'MMM d')}</span>}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 w-full text-sm border rounded-md transition-all shadow-sm hover:bg-zinc-50 ${
            date ? 'text-zinc-900 border-zinc-200' : 'text-zinc-400 border-zinc-200 bg-transparent'
          }`}
        >
          <CalendarIcon size={14} className={date ? 'text-zinc-900' : 'text-zinc-400'} />
          <span>{date ? format(new Date(date), 'PPP') : 'Pick a date'}</span>
        </button>
      )}

      {isOpen && (
        <div className={`absolute top-full mt-2 z-50 bg-white border border-zinc-200 rounded-md shadow-lg p-3 w-[280px] animate-in fade-in zoom-in-95 duration-100 ${compact ? 'right-0' : 'left-0'}`}>
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
                    ${isSelected ? 'bg-zinc-500 text-white hover:bg-zinc-600 hover:text-white font-medium' : ''}
                    ${!isSelected && isTodayDate ? 'text-zinc-900 font-bold ring-1 ring-zinc-300' : ''}
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

