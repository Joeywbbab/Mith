import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Cloud, ArrowRight, ArrowUpCircle, Trash2, Plus, Search, Sparkles, Pin } from 'lucide-react';
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { PartialBlock } from "@blocknote/core";

// Helper Tooltip Component
const ActionTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="relative group flex items-center justify-center">
    {children}
    <div className="absolute top-full mt-2 px-2.5 py-1 bg-zinc-900 text-zinc-50 text-[11px] font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 translate-y-[-2px] group-hover:translate-y-0">
      {label}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-900"></div>
    </div>
  </div>
);

// Note Editor Component with BlockNote
interface NoteEditorProps {
  initialContent: string | undefined;
  onSave: (content: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ initialContent, onSave }) => {
  // Parse initial content from JSON string
  const getInitialBlocks = useCallback((): PartialBlock[] | undefined => {
    if (!initialContent) return undefined;
    try {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed)) return parsed as PartialBlock[];
    } catch {
      // If not JSON, convert plain text to a paragraph block
      if (initialContent.trim()) {
        return [{ type: "paragraph", content: initialContent }];
      }
    }
    return undefined;
  }, [initialContent]);

  // Handle file uploads - convert to base64 for local storage
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }, []);

  const editor = useCreateBlockNote({
    initialContent: getInitialBlocks(),
    uploadFile,
  });

  // Handle content changes
  const handleChange = useCallback(() => {
    const content = JSON.stringify(editor.document);
    onSave(content);
  }, [editor, onSave]);

  return (
    <BlockNoteView
      editor={editor}
      onChange={handleChange}
      theme="light"
      data-theming-css-variables-demo
    />
  );
};

// Helper to extract plain text from BlockNote JSON for preview
const extractTextFromNote = (note: string | undefined): string => {
  if (!note) return '';
  try {
    const parsed = JSON.parse(note);
    if (Array.isArray(parsed)) {
      // Extract text from BlockNote blocks
      const texts: string[] = [];
      for (const block of parsed) {
        if (block.content) {
          if (typeof block.content === 'string') {
            texts.push(block.content);
          } else if (Array.isArray(block.content)) {
            for (const item of block.content) {
              if (item.text) texts.push(item.text);
              else if (typeof item === 'string') texts.push(item);
            }
          }
        }
      }
      return texts.join(' ').trim();
    }
  } catch {
    // If not JSON, return as-is
    return note;
  }
  return '';
};

export const SomedayView: React.FC = () => {
  const { somedayItems, addSomedayItem, updateSomedayItem, deleteSomedayItem, convertToProject, convertToFocus } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter and sort items: pinned first, then by date
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let items = somedayItems;

    if (query) {
      items = items.filter(i =>
        i.title.toLowerCase().includes(query) ||
        (i.note && i.note.toLowerCase().includes(query))
      );
    }

    // Sort: pinned first, then by createdAt descending
    return [...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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

  const handleTogglePin = (id: string) => {
    const item = somedayItems.find(i => i.id === id);
    if (item) {
      updateSomedayItem(id, { isPinned: !item.isPinned });
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* LEFT SIDEBAR: LIST */}
      <div className="w-[320px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col shrink-0">
        {/* Header */}
        <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between bg-white/50 backdrop-blur-sm shrink-0">
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

        <div className="p-4 border-b border-zinc-100 bg-white/50 shrink-0">
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
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
              {searchQuery ? 'No matching ideas found.' : 'Capture an idea to get started.\nDrag items here to organize.'}
            </div>
          ) : (
             filteredItems.map(item => (
                <div
                  key={item.id}
                  data-id={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`px-4 py-3.5 rounded-xl cursor-pointer transition-all group border border-transparent relative ${
                    selectedId === item.id
                      ? 'bg-white text-zinc-900 shadow-sm border-zinc-200'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.isPinned && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(item.id); }}
                        className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                        title="Unpin"
                      >
                        <Pin size={12} className="text-amber-500 fill-amber-500" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate mb-1 pr-6">
                        {item.title}
                      </h3>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-[11px] text-zinc-400 truncate flex-1 min-w-0">
                          {extractTextFromNote(item.note) || "No details yet"}
                        </p>
                        <span className="text-[10px] text-zinc-300 group-hover:text-zinc-400 shrink-0">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Pin button on hover - only show when not pinned */}
                  {!item.isPinned && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePin(item.id); }}
                      className="absolute right-2 top-2 p-1 rounded transition-all text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100"
                      title="Pin to top"
                    >
                      <Pin size={12} />
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: EDITOR */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedItem ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-10 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-100 hover:border-zinc-300 transition-all shadow-sm">
                  <Sparkles size={12} />
                  <span>Brainstorm</span>
                </button>
                <ActionTooltip label={selectedItem.isPinned ? 'Unpin' : 'Pin to top'}>
                  <button
                    onClick={() => handleTogglePin(selectedItem.id)}
                    className={`p-2 rounded-lg transition-all ${
                      selectedItem.isPinned
                        ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                        : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Pin size={18} className={selectedItem.isPinned ? 'fill-amber-500' : ''} />
                  </button>
                </ActionTooltip>
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
            <div className="flex-1 overflow-y-auto">
              <div className="px-10 py-6 max-w-4xl w-full">
                <input
                  type="text"
                  className="w-full text-4xl font-bold text-zinc-900 placeholder-zinc-300 border-transparent focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 focus:bg-zinc-50/50 rounded-lg px-2 -mx-2 py-1 bg-transparent mb-6 tracking-tight leading-tight transition-all outline-none"
                  placeholder="Idea Title"
                  value={selectedItem.title}
                  onChange={(e) => updateSomedayItem(selectedItem.id, { title: e.target.value })}
                />

                {/* BlockNote Rich Text Editor */}
                <div className="min-h-[300px]">
                  <NoteEditor
                    key={selectedItem.id}
                    initialContent={selectedItem.note}
                    onSave={(content) => updateSomedayItem(selectedItem.id, { note: content })}
                  />
                </div>
              </div>
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
