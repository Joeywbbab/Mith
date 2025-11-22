export enum ProjectType {
  Assignment = 'Assignment',
  Initiative = 'Initiative',
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate?: string; // ISO String
  note?: string;
  isDone: boolean;
}

export enum FocusStatus {
  Backlog = 'Backlog',
  Scheduled = 'Scheduled',
  Done = 'Done',
}

export interface Focus {
  id: string;
  title: string;
  projectId?: string;
  scheduledDate?: string; // ISO String YYYY-MM-DD
  status: FocusStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  deadline?: string; // ISO String
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SomedayItem {
  id: string;
  title: string;
  note?: string;
  createdAt: string;
}

export type ViewMode = 'month' | 'week';