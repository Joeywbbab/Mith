import React, { useState, useRef, useEffect } from 'react';
import { Target, Plus, GripVertical, CornerDownLeft } from 'lucide-react';
import { Focus, Project } from '../../types';
import { FilterPopover } from './FilterPopover';

interface FocusSidebarProps {
  focuses: Focus[];
  projects: Project[];
  projectFilter: string;
  onFilterChange: (filterId: string) => void;
  onDragStart: (e: React.DragEvent, focusId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddFocus: (title: string) => void;
}

export const FocusSidebar: React.FC<FocusSidebarProps> = ({
  focuses,
  projects,
  projectFilter,
  onFilterChange,
  onDragStart,
  onDragOver,
  onDrop,
  onAddFocus
}) => {
  const [quickFocusTitle, setQuickFocusTitle] = useState('');
  const [isAddingSideTask, setIsAddingSideTask] = useState(false);
  const quickFocusInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingSideTask) {
        quickFocusInputRef.current?.focus();
    }
  }, [isAddingSideTask]);

  const handleQuickAddSidebar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFocusTitle.trim()) return;
    onAddFocus(quickFocusTitle);
    setQuickFocusTitle('');
    quickFocusInputRef.current?.focus();
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId)?.title;
  };

  return (
    <div
      className="w-[280px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col z-10 shrink-0"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="p-4 border-b border-zinc-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
          <h2 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
            <Target size={16} className="text-zinc-500" />
            Focus
            <span className="text-xs text-zinc-400 font-normal bg-zinc-100 px-2 py-0.5 rounded-full">{focuses.length}</span>
          </h2>
          <div className="flex items-center gap-1">
              <FilterPopover
                activeFilter={projectFilter}
                projects={projects}
                onFilterChange={onFilterChange}
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
        {focuses.map(focus => (
          <div
            key={focus.id}
            draggable
            onDragStart={(e) => onDragStart(e, focus.id)}
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

        {focuses.length === 0 && !isAddingSideTask && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-200/50 m-2 rounded-xl bg-zinc-50/50 p-8">
            <span className="text-xs italic mb-1">All clear</span>
            <span className="text-[10px] text-zinc-400">Drop tasks here to unschedule</span>
          </div>
        )}
      </div>
    </div>
  );
};
