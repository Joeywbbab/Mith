import React, { useState } from 'react';
import { FolderKanban, Calendar, Layers, Pencil, ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react';
import appIcon from '../../src-tauri/icons/icon.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("Mith");
  const [isEditingName, setIsEditingName] = useState(false);

  const navItems = [
    { id: 'projects', label: 'Phases', icon: FolderKanban },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'someday', label: 'Dumping', icon: Layers },
    { id: 'canva', label: 'Canva', icon: Pencil },
  ];

  return (
    <div 
      className={`${isCollapsed ? 'w-[72px]' : 'w-[260px]'} bg-zinc-50/50 flex flex-col h-full border-r border-zinc-200 select-none transition-all duration-300 relative group/sidebar`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 rounded-full p-1 shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-opacity z-50"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Header / Workspace Switcher */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-5'} border-b border-zinc-100/50 transition-all`}>
        <div className="flex items-center gap-3 text-zinc-900 font-semibold text-sm tracking-tight overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
            <img src={appIcon} alt="Mith" className="w-full h-full object-cover" />
          </div>
          
          {!isCollapsed && (
             <div className="flex-1 min-w-0 group flex items-center gap-2">
               {isEditingName ? (
                 <div className="flex items-center gap-1">
                   <input 
                     autoFocus
                     className="w-full bg-white border border-zinc-200 rounded px-1 py-0.5 text-sm focus:ring-2 focus:ring-zinc-200 outline-none"
                     value={workspaceName}
                     onChange={(e) => setWorkspaceName(e.target.value)}
                     onBlur={() => setIsEditingName(false)}
                     onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                   />
                   <button onClick={() => setIsEditingName(false)} className="text-green-600"><Check size={14}/></button>
                 </div>
               ) : (
                 <>
                  <span onClick={() => setIsEditingName(true)} className="cursor-pointer hover:text-zinc-600 transition-colors">{workspaceName}</span>
                  <Edit2 
                    size={12} 
                    className="text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-zinc-900 transition-all"
                    onClick={() => setIsEditingName(true)}
                  />
                 </>
               )}
             </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Workspace</span>
          </div>
        )}
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-zinc-200/60 text-zinc-900 font-medium shadow-sm' 
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-zinc-900" : "text-zinc-500"} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-5 border-t border-zinc-100/50 opacity-0 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-2 h-2 bg-green-500 rounded-full ring-4 ring-green-500/10"></div>
            <span>v1.0 Online</span>
          </div>
        </div>
      )}
    </div>
  );
};
