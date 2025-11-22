import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ProjectsView } from './components/Projects/ProjectsView';
import { PlanView } from './components/Plan/PlanView';
import { SomedayView } from './components/Someday/SomedayView';
import { StoreProvider } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plan');

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'projects' && <ProjectsView />}
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