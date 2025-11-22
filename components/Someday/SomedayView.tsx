import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useStore } from '../../context/StoreContext';
import { Cloud, ArrowRight, ArrowUpCircle, Trash2, Plus, Search, Sparkles } from 'lucide-react';

// Helper Tooltip Component
const ActionTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="relative group flex items-center justify-center">
    {children}
    <div className="absolute top-full mt-2 px-2.5 py-1 bg-zinc-900 text-zinc-50 text-[11px] font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 translate-y-[-2px] group-hover:translate-y-0">
      {label}
      {/* Arrow */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-900"></div>
    </div>
  </div>
);

export const SomedayView: React.FC = () => {
  const { somedayItems, addSomedayItem, updateSomedayItem, deleteSomedayItem, convertToProject, convertToFocus } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lastSerializedNote = useRef<string | null>(null);
  const [showInlineCanvas, setShowInlineCanvas] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(420);
  const [isResizingCanvas, setIsResizingCanvas] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(420);

  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item when it changes
  useEffect(() => {
    if (selectedId && listRef.current) {
      const element = listRef.current.querySelector(`[data-id="${selectedId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedId]);

  const selectedItem = useMemo(() => 
    somedayItems.find(i => i.id === selectedId), 
  [somedayItems, selectedId]);

  const parsedNote = useMemo(() => {
    if (!selectedItem) return null;
    try {
      return selectedItem.canvasData ? JSON.parse(selectedItem.canvasData) : null;
    } catch {
      return null;
    }
  }, [selectedItem?.id, selectedItem?.canvasData]);

  useEffect(() => {
    lastSerializedNote.current = selectedItem?.canvasData ?? null;
    setShowInlineCanvas(!!parsedNote?.elements);
  }, [parsedNote, selectedItem?.canvasData]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isResizingCanvas) return;
      const delta = e.clientY - resizeStartY.current;
      const next = Math.min(900, Math.max(260, resizeStartHeight.current + delta));
      setCanvasHeight(next);
    };
    const handleUp = () => setIsResizingCanvas(false);
    if (isResizingCanvas) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isResizingCanvas]);

  const filteredItems = useMemo(() => {
    return somedayItems.filter(i => 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.note && i.note.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [somedayItems, searchQuery]);

  const handleCreate = () => {
    const title = "New Idea";
    const newId = addSomedayItem(title);
    setSelectedId(newId);
  };

  const handleDelete = (id: string) => {
    deleteSomedayItem(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex h-full bg-white w-full">
      {/* LEFT SIDEBAR: LIST */}
      <div className="w-[320px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col">
        {/* Header */}
        <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between bg-white/50 backdrop-blur-sm">
           <div className="flex items-center gap-2.5 text-zinc-900 font-semibold text-sm">
            <Cloud size={18} className="text-zinc-500" />
            <span>Dumping</span>
           </div>
           <button 
            onClick={handleCreate}
            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="p-4 border-b border-zinc-100 bg-white/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search ideas..." 
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-all placeholder-zinc-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-xs leading-relaxed">
              {searchQuery ? 'No matching ideas found.' : 'Capture an idea to get started.\nDrag items here to organize.'}
            </div>
          ) : (
             filteredItems.map(item => (
                <div 
                  key={item.id}
                  data-id={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`px-4 py-3.5 rounded-xl cursor-pointer transition-all group border border-transparent ${
                    selectedId === item.id 
                      ? 'bg-white text-zinc-900 shadow-sm border-zinc-200' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <h3 className="text-sm font-semibold truncate mb-1">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                      {item.note || "No details yet"}
                    </p>
                    <span className="text-[10px] text-zinc-300 group-hover:text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: EDITOR */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
        {selectedItem ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-10 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-100 hover:border-zinc-300 transition-all shadow-sm">
                  <Sparkles size={12} />
                  <span>Brainstorm</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <ActionTooltip label="Move to Backlog (Create Task)">
                  <button 
                    onClick={() => convertToFocus(selectedItem.id)}
                    className="p-2 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                </ActionTooltip>
                
                <ActionTooltip label="Promote to Project">
                  <button 
                    onClick={() => convertToProject(selectedItem.id)}
                    className="p-2 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <ArrowUpCircle size={18} />
                  </button>
                </ActionTooltip>

                <div className="w-px h-5 bg-zinc-200 mx-3"></div>
                
                <ActionTooltip label="Delete Idea">
                  <button 
                    onClick={() => handleDelete(selectedItem.id)}
                    className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </ActionTooltip>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-14 max-w-4xl mx-auto w-full">
              <input
                type="text"
                className="w-full text-4xl font-bold text-zinc-900 placeholder-zinc-300 border-transparent focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 focus:bg-zinc-50/50 rounded-lg px-2 -mx-2 py-1 bg-transparent mb-9 tracking-tight leading-tight transition-all outline-none"
                placeholder="Idea Title"
                value={selectedItem.title}
                onChange={(e) => updateSomedayItem(selectedItem.id, { title: e.target.value })}
              />
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide bg-zinc-900 text-white">
                  Notes
                </span>
              </div>

              <textarea
                className="w-full h-[calc(100%-200px)] resize-none text-zinc-700 leading-relaxed text-lg placeholder-zinc-200 border-none focus:ring-0 p-1 bg-transparent focus:outline-none font-light"
                placeholder="Start typing your thoughts..."
                value={selectedItem.note || ''}
                onChange={(e) => {
                    const val = e.target.value;
                    const lower = val.toLowerCase();
                    if (lower.endsWith('/canvas') || lower.endsWith('/canva')) {
                      const trimmed = val.replace(/\/canvas$/i, '').replace(/\/canva$/i, '').trimEnd();
                      updateSomedayItem(selectedItem.id, { note: trimmed });
                      setShowInlineCanvas(true);
                    } else {
                      updateSomedayItem(selectedItem.id, { note: val });
                    }
                  }}
                />

              {(showInlineCanvas || parsedNote?.elements) && (
                <div className="mt-6 border border-zinc-200 rounded-xl overflow-hidden shadow-sm" style={{ height: canvasHeight }}>
                  <Excalidraw
                    initialData={
                      parsedNote?.elements
                        ? { ...parsedNote, appState: { ...(parsedNote.appState || {}), collaborators: [] } }
                        : { elements: [], appState: { viewBackgroundColor: '#ffffff', collaborators: [] } }
                    }
                    onChange={(elements, appState) => {
                      const safeAppState = { ...appState, collaborators: [] };
                      const data = JSON.stringify({ elements, appState: safeAppState });
                      if (data !== lastSerializedNote.current) {
                        lastSerializedNote.current = data;
                        updateSomedayItem(selectedItem.id, { canvasData: data });
                      }
                    }}
                  />
                  <div
                    className="w-full h-3 bg-zinc-100 hover:bg-zinc-200 cursor-ns-resize flex items-center justify-center text-[10px] text-zinc-500 select-none"
                    onMouseDown={(e) => {
                      resizeStartY.current = e.clientY;
                      resizeStartHeight.current = canvasHeight;
                      setIsResizingCanvas(true);
                    }}
                  >
                    Drag to resize
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300">
            <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Cloud size={40} className="text-zinc-300" strokeWidth={1} />
            </div>
            <p className="text-base font-medium text-zinc-400">Select an idea to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
