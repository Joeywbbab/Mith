import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Target, Plus, GripVertical, CornerDownLeft, ChevronDown, Rocket, Lightbulb, Trash2 } from 'lucide-react';
import { Focus, Project } from '../../types';
import { FilterPopover } from './FilterPopover';

interface FocusSidebarProps {
  focuses: Focus[];
  projects: Project[];
  projectFilter: string;
  onFilterChange: (filterId: string) => void;
  onDragStart: (e: React.DragEvent, focusId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnterBacklog: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAddFocus: (title: string) => void;
  onUpdateFocus: (id: string, data: Partial<Focus>) => void;
  onDeleteFocus: (id: string) => void;
  onReorderFocuses: (focusIds: string[]) => void;
}

export const FocusSidebar: React.FC<FocusSidebarProps> = ({
  focuses,
  projects,
  projectFilter,
  onFilterChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnterBacklog,
  onDrop,
  onAddFocus,
  onUpdateFocus,
  onDeleteFocus,
  onReorderFocuses
}) => {
  const [quickFocusTitle, setQuickFocusTitle] = useState('');
  const [isAddingSideTask, setIsAddingSideTask] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [reorderDragId, setReorderDragId] = useState<string | null>(null);
  const [reorderOverId, setReorderOverId] = useState<string | null>(null);
  const quickFocusInputRef = useRef<HTMLInputElement>(null);

  // Sort focuses by sortOrder, then group by project-related vs independent
  const groupedFocuses = useMemo(() => {
    const sorted = [...focuses].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const projectFocuses = sorted.filter(f => f.projectId);
    const independentFocuses = sorted.filter(f => !f.projectId);
    return { projectFocuses, independentFocuses };
  }, [focuses]);

  // Handle reorder drag start (internal reordering)
  const handleReorderDragStart = (e: React.DragEvent, focusId: string) => {
    setReorderDragId(focusId);
    e.dataTransfer.setData('reorderFocusId', focusId);
    e.dataTransfer.effectAllowed = 'move';
    // Also call parent's onDragStart for calendar drag
    onDragStart(e, focusId);
  };

  // Handle reorder drag over
  const handleReorderDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (reorderDragId && reorderDragId !== targetId) {
      setReorderOverId(targetId);
    }
  };

  // Handle reorder drop
  const handleReorderDrop = (e: React.DragEvent, targetId: string, groupFocuses: Focus[]) => {
    e.preventDefault();
    e.stopPropagation();

    if (!reorderDragId || reorderDragId === targetId) {
      setReorderDragId(null);
      setReorderOverId(null);
      return;
    }

    // Find positions
    const dragIndex = groupFocuses.findIndex(f => f.id === reorderDragId);
    const targetIndex = groupFocuses.findIndex(f => f.id === targetId);

    if (dragIndex === -1 || targetIndex === -1) {
      setReorderDragId(null);
      setReorderOverId(null);
      return;
    }

    // Reorder the array
    const newOrder = [...groupFocuses];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Call reorder with new order of IDs
    onReorderFocuses(newOrder.map(f => f.id));

    setReorderDragId(null);
    setReorderOverId(null);
  };

  // Handle reorder drag end
  const handleReorderDragEnd = () => {
    setReorderDragId(null);
    setReorderOverId(null);
    onDragEnd();
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
      className="w-[280px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col z-30 shrink-0 relative"
      data-backlog-dropzone="true"
      onDragOver={onDragOver}
      onDragEnter={(e) => { onDragOver(e); onDragEnterBacklog(); }}
      onDrop={onDrop}
      onMouseUp={onDragEnd}
    >
      <div className="p-4 border-b border-zinc-200 bg-white/50 backdrop-blur-sm flex items-center justify-between relative z-10">
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

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {/* Project Related Group */}
        {groupedFocuses.projectFocuses.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => toggleGroup('project')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:bg-zinc-100 rounded-md transition-colors"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${collapsedGroups['project'] ? '-rotate-90' : ''}`}
              />
              <Rocket size={12} />
              <span>Project Tasks</span>
              <span className="ml-auto text-zinc-400 font-normal bg-zinc-100 px-1.5 py-0.5 rounded text-[9px]">
                {groupedFocuses.projectFocuses.length}
              </span>
            </button>
            {!collapsedGroups['project'] && (
              <div className="mt-1.5 space-y-1.5">
                {groupedFocuses.projectFocuses.map(focus => (
                  <div
                    key={focus.id}
                    draggable
                    onDragStart={(e) => handleReorderDragStart(e, focus.id)}
                    onDragEnd={handleReorderDragEnd}
                    onDragOver={(e) => handleReorderDragOver(e, focus.id)}
                    onDrop={(e) => handleReorderDrop(e, focus.id, groupedFocuses.projectFocuses)}
                    className={`group relative p-3 pr-8 bg-white rounded-lg border shadow-sm cursor-move hover:border-zinc-300 hover:shadow-md transition-all select-none active:cursor-grabbing flex flex-col gap-1 ${
                      reorderOverId === focus.id ? 'border-zinc-400 border-t-2' : 'border-zinc-200'
                    } ${reorderDragId === focus.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-zinc-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full text-sm font-medium text-zinc-800 leading-snug bg-transparent border-none p-0 focus:ring-0 focus:outline-none truncate"
                          value={focus.title}
                          onChange={(e) => onUpdateFocus(focus.id, { title: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          placeholder="Focus title..."
                        />
                        <div className="mt-1.5 flex">
                          <span className="text-[9px] font-medium text-zinc-500 px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-100 truncate max-w-full">
                            {getProjectName(focus.projectId)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteFocus(focus.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Independent Tasks Group */}
        {groupedFocuses.independentFocuses.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => toggleGroup('independent')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:bg-zinc-100 rounded-md transition-colors"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${collapsedGroups['independent'] ? '-rotate-90' : ''}`}
              />
              <Lightbulb size={12} />
              <span>Quick Tasks</span>
              <span className="ml-auto text-zinc-400 font-normal bg-zinc-100 px-1.5 py-0.5 rounded text-[9px]">
                {groupedFocuses.independentFocuses.length}
              </span>
            </button>
            {!collapsedGroups['independent'] && (
              <div className="mt-1.5 space-y-1.5">
                {groupedFocuses.independentFocuses.map(focus => (
                  <div
                    key={focus.id}
                    draggable
                    onDragStart={(e) => handleReorderDragStart(e, focus.id)}
                    onDragEnd={handleReorderDragEnd}
                    onDragOver={(e) => handleReorderDragOver(e, focus.id)}
                    onDrop={(e) => handleReorderDrop(e, focus.id, groupedFocuses.independentFocuses)}
                    className={`group relative p-3 pr-8 bg-white rounded-lg border shadow-sm cursor-move hover:border-zinc-300 hover:shadow-md transition-all select-none active:cursor-grabbing ${
                      reorderOverId === focus.id ? 'border-zinc-400 border-t-2' : 'border-zinc-200'
                    } ${reorderDragId === focus.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-zinc-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input
                        className="flex-1 min-w-0 text-sm font-medium text-zinc-800 leading-snug bg-transparent border-none p-0 focus:ring-0 focus:outline-none truncate"
                        value={focus.title}
                        onChange={(e) => onUpdateFocus(focus.id, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="Focus title..."
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteFocus(focus.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
