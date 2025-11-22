import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ProjectsView } from './components/Projects/ProjectsView';
import { ProjectPathViewExcalidraw } from './components/Projects/ProjectPathViewExcalidraw';
import { PlanView } from './components/Plan/PlanView';
import { SomedayView } from './components/Someday/SomedayView';
import { StoreProvider } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutGrid, GitBranch } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [usePathView, setUsePathView] = useState(false); // 默认列表视图

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'projects' && (
          <>
            {usePathView ? <ProjectPathViewExcalidraw /> : <ProjectsView />}
            {/* 视图切换按钮 */}
            <button
              onClick={() => setUsePathView(!usePathView)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-zinc-200 flex items-center gap-2 text-xs font-medium text-zinc-700 z-50"
              title={usePathView ? 'Switch to list view' : 'Switch to path view'}
            >
              {usePathView ? <LayoutGrid size={16} /> : <GitBranch size={16} />}
              <span>{usePathView ? 'List view' : 'Path view'}</span>
            </button>
          </>
        )}
        {activeTab === 'plan' && <PlanView />}
        {activeTab === 'someday' && <SomedayView />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default App;
