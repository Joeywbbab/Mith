import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Milestone, Focus, SomedayItem, Phase, FocusStatus, ProjectType } from '../types';
import { MOCK_PROJECTS, MOCK_MILESTONES, MOCK_FOCUS, MOCK_SOMEDAY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface StoreContextType {
  projects: Project[];
  milestones: Milestone[];
  focuses: Focus[];
  somedayItems: SomedayItem[];
  phases: Phase[];

  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Phases
  addPhase: (phase: Omit<Phase, 'id' | 'createdAt'>) => void;
  updatePhase: (id: string, data: Partial<Phase>) => void;
  deletePhase: (id: string) => void;

  // Milestones
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  toggleMilestone: (id: string) => void;
  deleteMilestone: (id: string) => void;

  // Focus
  addFocus: (focus: Omit<Focus, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFocus: (id: string, data: Partial<Focus>) => void;
  deleteFocus: (id: string) => void;
  scheduleFocus: (id: string, date: string) => void;

  // Someday
  addSomedayItem: (title: string) => string;
  updateSomedayItem: (id: string, data: Partial<SomedayItem>) => void;
  deleteSomedayItem: (id: string) => void;
  convertToProject: (id: string) => void;
  convertToFocus: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// LocalStorage keys
const STORAGE_KEYS = {
  PROJECTS: 'mith_projects',
  MILESTONES: 'mith_milestones',
  FOCUSES: 'mith_focuses',
  SOMEDAY: 'mith_someday',
  PHASES: 'mith_phases',
  INITIALIZED: 'mith_initialized'
};

// Default phases
const DEFAULT_PHASES: Phase[] = [
  {
    id: 'phase1',
    title: 'Learning',
    description: '',
    color: '#ffc9c9',
    position: 0.15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'phase2',
    title: 'Practice',
    description: '',
    color: '#b2f2bb',
    position: 0.45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'phase3',
    title: 'Growth',
    description: '',
    color: '#a5d8ff',
    position: 0.75,
    createdAt: new Date().toISOString(),
  },
];

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or use mock data on first load
  const [projects, setProjects] = useState<Project[]>(() => {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return MOCK_PROJECTS;
    }
    return loadFromStorage(STORAGE_KEYS.PROJECTS, MOCK_PROJECTS);
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() =>
    loadFromStorage(STORAGE_KEYS.MILESTONES, MOCK_MILESTONES)
  );

  const [focuses, setFocuses] = useState<Focus[]>(() =>
    loadFromStorage(STORAGE_KEYS.FOCUSES, MOCK_FOCUS)
  );

  const [somedayItems, setSomedayItems] = useState<SomedayItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.SOMEDAY, MOCK_SOMEDAY)
  );

  const [phases, setPhases] = useState<Phase[]>(() => {
    const stored = loadFromStorage<Phase[]>(STORAGE_KEYS.PHASES, []);
    // 如果没有存储的phases，使用默认值
    if (stored.length === 0) {
      return DEFAULT_PHASES;
    }
    return stored;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  }, [projects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
  }, [milestones]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FOCUSES, focuses);
  }, [focuses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SOMEDAY, somedayItems);
  }, [somedayItems]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PHASES, phases);
  }, [phases]);

  // --- Projects ---
  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map((p: Project) => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter((p: Project) => p.id !== id));
    setMilestones(prev => prev.filter((m: Milestone) => m.projectId !== id));
    // Detach focuses from deleted project, but don't delete them
    setFocuses(prev => prev.map((f: Focus) => f.projectId === id ? { ...f, projectId: undefined } : f));
  }, []);

  // --- Milestones ---
  const addMilestone = useCallback((data: Omit<Milestone, 'id'>) => {
    setMilestones(prev => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setMilestones(prev => prev.map((m: Milestone) => m.id === id ? { ...m, isDone: !m.isDone } : m));
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setMilestones(prev => prev.filter((m: Milestone) => m.id !== id));
  }, []);

  // --- Focus ---
  const addFocus = useCallback((data: Omit<Focus, 'id' | 'createdAt' | 'updatedAt'>) => {
    setFocuses(prev => [...prev, {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);
  }, []);

  const updateFocus = useCallback((id: string, data: Partial<Focus>) => {
    setFocuses(prev => prev.map((f: Focus) => f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f));
  }, []);

  const deleteFocus = useCallback((id: string) => {
    setFocuses(prev => prev.filter((f: Focus) => f.id !== id));
  }, []);

  const scheduleFocus = useCallback((id: string, date: string) => {
    setFocuses(prev => prev.map((f: Focus) => {
      if (f.id === id) {
        return {
          ...f,
          scheduledDate: date,
          status: FocusStatus.Scheduled,
          updatedAt: new Date().toISOString()
        };
      }
      return f;
    }));
  }, []);

  // --- Someday ---
  const addSomedayItem = useCallback((title: string) => {
    const id = uuidv4();
    setSomedayItems(prev => [...prev, {
      id,
      title,
      note: '',
      canvasData: '',
      createdAt: new Date().toISOString(),
    }]);
    return id;
  }, []);

  const updateSomedayItem = useCallback((id: string, data: Partial<SomedayItem>) => {
    setSomedayItems(prev => prev.map((item: SomedayItem) => item.id === id ? { ...item, ...data } : item));
  }, []);

  const deleteSomedayItem = useCallback((id: string) => {
    setSomedayItems(prev => prev.filter((s: SomedayItem) => s.id !== id));
  }, []);

  const convertToProject = useCallback((id: string) => {
    const item = somedayItems.find((s: SomedayItem) => s.id === id);
    if (item) {
      addProject({
        title: item.title,
        type: ProjectType.Initiative,
        description: item.note || '',
      });
      deleteSomedayItem(id);
    }
  }, [somedayItems, addProject, deleteSomedayItem]);

  const convertToFocus = useCallback((id: string) => {
    const item = somedayItems.find((s: SomedayItem) => s.id === id);
    if (item) {
      addFocus({
        title: item.title,
        status: FocusStatus.Backlog,
        note: item.note,
      });
      deleteSomedayItem(id);
    }
  }, [somedayItems, addFocus, deleteSomedayItem]);

  // --- Phases ---
  const addPhase = useCallback((data: Omit<Phase, 'id' | 'createdAt'>) => {
    const newPhase: Phase = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setPhases(prev => [...prev, newPhase]);
  }, []);

  const updatePhase = useCallback((id: string, data: Partial<Phase>) => {
    setPhases(prev => prev.map((p: Phase) => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePhase = useCallback((id: string) => {
    setPhases(prev => prev.filter((p: Phase) => p.id !== id));
    setProjects(prev => {
      const removedProjectIds = prev.filter((p: Project) => p.phaseId === id).map(p => p.id);
      const kept = prev.filter((p: Project) => p.phaseId !== id);
      if (removedProjectIds.length) {
        setMilestones(prevM => prevM.filter((m: Milestone) => !removedProjectIds.includes(m.projectId)));
        setFocuses(prevF => prevF.filter((f: Focus) => !removedProjectIds.includes(f.projectId || '')));
      }
      return kept;
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      projects, milestones, focuses, somedayItems, phases,
      addProject, updateProject, deleteProject,
      addMilestone, toggleMilestone, deleteMilestone,
      addFocus, updateFocus, deleteFocus, scheduleFocus,
      addSomedayItem, updateSomedayItem, deleteSomedayItem, convertToProject, convertToFocus,
      addPhase, updatePhase, deletePhase
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
