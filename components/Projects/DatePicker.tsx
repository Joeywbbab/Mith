import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';

interface DatePickerProps {
  date?: string;
  onSelect: (date: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, onSelect }) => {
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
