import React, { useState, useRef, useEffect } from 'react';
import { X, CornerDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '../../types';

interface AddTaskDialogProps {
  date: Date;
  projects: Project[];
  onClose: () => void;
  onAdd: (title: string, projectId?: string) => void;
}

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ date, projects, onClose, onAdd }) => {
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
