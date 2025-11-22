import { Project, ProjectType, Focus, FocusStatus, Milestone, SomedayItem } from './types';
import { v4 as uuidv4 } from 'uuid';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Advanced React Course',
    type: ProjectType.Assignment,
    deadline: '2023-12-15',
    description: 'Complete all modules and the final capstone project for the certification.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    title: 'Personal Portfolio Rewrite',
    type: ProjectType.Initiative,
    deadline: '2024-01-30',
    description: 'Redesign personal website using Next.js and Tailwind.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const MOCK_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    projectId: 'p1',
    title: 'Submit Draft Proposal',
    dueDate: '2023-11-20',
    isDone: true,
  },
  {
    id: 'm2',
    projectId: 'p1',
    title: 'Final Presentation',
    dueDate: '2023-12-15',
    isDone: false,
  }
];

export const MOCK_FOCUS: Focus[] = [
  {
    id: 'f1',
    title: 'Watch Module 4 Lectures',
    projectId: 'p1',
    status: FocusStatus.Backlog,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f2',
    title: 'Fix responsiveness in navbar',
    projectId: 'p2',
    status: FocusStatus.Scheduled,
    scheduledDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f3',
    title: 'Email professor about timeline',
    projectId: 'p1',
    status: FocusStatus.Backlog,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f4',
    title: 'Buy groceries',
    status: FocusStatus.Scheduled,
    scheduledDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const MOCK_SOMEDAY: SomedayItem[] = [
  {
    id: 's1',
    title: 'Learn Rust',
    note: 'Look into the official book.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's2',
    title: 'Trip to Japan',
    note: 'Save up budget for 2025.',
    createdAt: new Date().toISOString(),
  }
];