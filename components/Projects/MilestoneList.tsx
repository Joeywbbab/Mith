import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import { Milestone } from '../../types';
import { DatePicker } from './DatePicker';

interface MilestoneListProps {
  milestones: Milestone[];
  projectId: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (data: Omit<Milestone, 'id'>) => void;
  onUpdate?: (id: string, data: Partial<Milestone>) => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  projectId,
  onToggle,
  onDelete,
  onAdd,
  onUpdate
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title) return;
    onAdd({
      projectId,
      title,
      dueDate: date || undefined,
      isDone: false
    });
    setTitle('');
    setDate('');
  };

  return (
    <div className="space-y-1 flex-1">
      {milestones.length === 0 && (
          <div className="text-center py-4 text-zinc-300 text-xs italic">No milestones yet.</div>
      )}
      {milestones.map(m => (
        <div key={m.id} className="group relative flex items-center py-1.5 pr-14 hover:bg-zinc-50 rounded-md transition-colors -mx-2 px-2">
            <button
                onClick={() => onToggle(m.id)}
                className={`mr-3 transition-colors ${m.isDone ? 'text-zinc-800' : 'text-zinc-300 hover:text-zinc-400'}`}
            >
                {m.isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>
            {onUpdate ? (
                <input
                    className={`flex-1 min-w-0 text-sm font-medium transition-all bg-transparent border-none p-0 focus:ring-0 focus:outline-none ${m.isDone ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-800'}`}
                    value={m.title}
                    onChange={(e) => onUpdate(m.id, { title: e.target.value })}
                    placeholder="Milestone title..."
                />
            ) : (
                <div className={`flex-1 min-w-0 text-sm font-medium transition-all truncate ${m.isDone ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-800'}`}>
                    {m.title}
                </div>
            )}
            {onUpdate ? (
                <DatePicker
                    date={m.dueDate}
                    onSelect={(selectedDate) => onUpdate(m.id, { dueDate: selectedDate })}
                    compact
                />
            ) : (
                m.dueDate && (
                    <div className="text-[10px] text-zinc-400">
                        {new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )
            )}
            <button onClick={() => onDelete(m.id)} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={13} />
            </button>
        </div>
      ))}
      <div className="pt-1">
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
            <div className="w-[140px]">
              <DatePicker
                date={date || undefined}
                onSelect={(selectedDate) => setDate(selectedDate)}
              />
            </div>
          )}
          <button type="submit" className="hidden">Add</button>
        </form>
      </div>
    </div>
  );
};
