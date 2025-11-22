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
  phaseId?: string; // 关联到 Phase
  position?: number; // 在路径上的位置偏移（相对于phase.position，可选）- 用于向后兼容
  x?: number; // 2D坐标X（可选，如果存在则优先使用）
  y?: number; // 2D坐标Y（可选，如果存在则优先使用）
  deadline?: string; // ISO String
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SomedayItem {
  id: string;
  title: string;
  note?: string;
  canvasData?: string;
  createdAt: string;
}

export interface Phase {
  id: string;
  title: string;
  description?: string;
  color: string; // 用于节点颜色
  position: number; // 在路径上的位置 (0-1) - 用于向后兼容
  x?: number; // 2D坐标X（可选，如果存在则优先使用）
  y?: number; // 2D坐标Y（可选，如果存在则优先使用）
  createdAt: string;
}

export type ViewMode = 'month' | 'week';
