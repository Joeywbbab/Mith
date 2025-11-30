import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { FocusStatus, ViewMode, Focus } from '../../types';
import { Plus } from 'lucide-react';
import { addDays, endOfMonth, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, isToday, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import { AddTaskDialog } from './AddTaskDialog';
import { FocusSidebar } from './FocusSidebar';
import { CalendarToolbar } from './CalendarToolbar';

// Types for spanning events
interface SpanningEvent {
  focus: Focus;
  startCol: number; // 0-6 (day of week)
  spanCols: number; // how many columns to span
  row: number; // vertical position within the event area
}

export const PlanView: React.FC = () => {
  const { focuses, projects, updateFocus, deleteFocus, scheduleFocus, addFocus, reorderFocuses } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);
  const [draggingFocusId, setDraggingFocusId] = useState<string | null>(null);

  // Drag-to-create state
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createStartDate, setCreateStartDate] = useState<string | null>(null);
  const [createEndDate, setCreateEndDate] = useState<string | null>(null);

  // Drag-to-resize state
  const [resizingTask, setResizingTask] = useState<{ id: string; edge: 'start' | 'end'; originalStart: string; originalEnd: string } | null>(null);
  const resizingTaskRef = useRef<{ id: string; edge: 'start' | 'end'; originalStart: string; originalEnd: string } | null>(null);

  const draggingFocusIdRef = useRef<string | null>(null);
  const lastHoverDateRef = useRef<string | null>(null);
  const hoveringBacklogRef = useRef<boolean>(false);
  const globalDragListenerAttached = useRef<boolean>(false);
  const globalMoveListenerAttached = useRef<boolean>(false);
  const monthGridRef = useRef<HTMLDivElement | null>(null);
  const weekContainerRef = useRef<HTMLDivElement | null>(null);
  const BACKLOG_HIT_X = 320; // fallback threshold for left sidebar hit
  const logDrag = (...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[drag]', ...args);
    }
  };

  const clearDragging = () => {
    logDrag('clear');
    if (globalDragListenerAttached.current) {
      document.removeEventListener('dragover', handleGlobalDragOver);
      globalDragListenerAttached.current = false;
    }
    if (globalMoveListenerAttached.current) {
      document.removeEventListener('mousemove', handleGlobalMove);
      globalMoveListenerAttached.current = false;
    }
    draggingFocusIdRef.current = null;
    setDraggingFocusId(null);
    lastHoverDateRef.current = null;
    hoveringBacklogRef.current = false;
  };

  // --- Drag and Drop Logic ---
  const getDraggedFocusId = (e: React.DragEvent) => {
    // WebKit (Tauri/WKWebView) only exposes text/plain in some drag events
    const fromEvent = (e.dataTransfer.getData('focusId') || e.dataTransfer.getData('text/plain') || '').trim();
    return fromEvent || draggingFocusIdRef.current || draggingFocusId;
  };

  const handleDragStart = (e: React.DragEvent, focusId: string) => {
    e.dataTransfer.setData('focusId', focusId);
    e.dataTransfer.setData('text/plain', focusId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    draggingFocusIdRef.current = focusId;
    setDraggingFocusId(focusId);
    if (!globalDragListenerAttached.current) {
      document.addEventListener('dragover', handleGlobalDragOver, { passive: false });
      globalDragListenerAttached.current = true;
    }
    if (!globalMoveListenerAttached.current) {
      document.addEventListener('mousemove', handleGlobalMove, { passive: false });
      globalMoveListenerAttached.current = true;
    }
    logDrag('start', focusId);
  };

  const findDateFromPoint = (x: number, y: number): string | null => {
    const dateEls = Array.from(document.querySelectorAll<HTMLElement>('[data-date]')).filter(el => el.offsetWidth && el.offsetHeight);

    // Prefer direct hit
    const direct = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-date]');
    if (direct?.dataset.date) return direct.dataset.date;

    // Choose the nearest cell by distance to its rect (0 if inside)
    let best: { date: string | null; dist: number } | null = null;
    const distToRect = (rect: DOMRect) => {
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      return Math.hypot(dx, dy);
    };

    for (const el of dateEls) {
      const rect = el.getBoundingClientRect();
      const d = distToRect(rect);
      const date = el.dataset.date || null;
      if (!best || d < best.dist) {
        best = { date, dist: d };
      }
    }

    return best?.date || null;
  };

  const findDateAtPoint = (x: number, y: number): string | null => {
    // Week view: 使用水平布局，按实际列位置计算
    if (viewMode === 'week' && weekContainerRef.current) {
      const rect = weekContainerRef.current.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        // Week view 中，列的实际宽度可能不同（compact vs full）
        // 遍历所有日期列，找到鼠标所在的列
        const dateElements = Array.from(weekContainerRef.current.querySelectorAll<HTMLElement>('[data-date]'))
          .filter(el => {
            const elRect = el.getBoundingClientRect();
            return elRect.width > 0 && elRect.height > 0;
          });
        
        // 首先尝试精确匹配：鼠标在列内（包括边界）
        for (const el of dateElements) {
          const elRect = el.getBoundingClientRect();
          if (x >= elRect.left && x <= elRect.right && y >= elRect.top && y <= elRect.bottom) {
            const dateStr = el.dataset.date;
            if (dateStr) {
              logDrag('findDateAtPoint-week-exact', x, y, 'date', dateStr, 'rect', `${Math.round(elRect.left)}-${Math.round(elRect.right)}`);
              return dateStr;
            }
          }
        }
        
        // 如果精确匹配失败，找最近的列（只考虑 X 坐标，允许一定容差）
        let bestMatch: { date: string; dist: number } | null = null;
        for (const el of dateElements) {
          const elRect = el.getBoundingClientRect();
          const dateStr = el.dataset.date;
          if (dateStr) {
            // 计算到列的水平距离
            let dist: number;
            if (x < elRect.left) {
              dist = elRect.left - x;
            } else if (x > elRect.right) {
              dist = x - elRect.right;
            } else {
              // 在列内，距离为 0
              dist = 0;
            }
            
            if (!bestMatch || dist < bestMatch.dist) {
              bestMatch = { date: dateStr, dist };
            }
          }
        }
        
        if (bestMatch && bestMatch.dist < 100) { // 只接受距离小于 100px 的匹配
          logDrag('findDateAtPoint-week-nearest', x, y, 'date', bestMatch.date, 'dist', Math.round(bestMatch.dist));
          return bestMatch.date;
        }
        
        logDrag('findDateAtPoint-week-no-match', x, y, 'elements', dateElements.length);
      }
    }
    
    // Month view: 使用网格布局
    if (viewMode === 'month' && monthGridRef.current) {
      const rect = monthGridRef.current.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const cols = 7;
        const rows = Math.ceil(calendarDays.length / 7);
        const colWidth = rect.width / cols;
        const rowHeight = rect.height / rows;
        const col = Math.min(cols - 1, Math.max(0, Math.floor((x - rect.left) / colWidth)));
        const row = Math.min(rows - 1, Math.max(0, Math.floor((y - rect.top) / rowHeight)));
        const idx = row * cols + col;
        const day = calendarDays[idx];
        if (day) {
          const dateStr = format(day, 'yyyy-MM-dd');
          logDrag('findDateAtPoint-month', x, y, 'row', row, 'col', col, 'date', dateStr);
          return dateStr;
        }
      }
    }
    
    // Fallback: 使用 DOM 查询
    return findDateFromPoint(x, y);
  };

  const isBacklogFromPoint = (x: number, y: number): boolean => {
    const el = document.elementFromPoint(x, y);
    if (x < BACKLOG_HIT_X) return true;
    if (!el) return false;
    return !!el.closest('[data-backlog-dropzone="true"]');
  };

  const handleDragEnd = (e?: React.DragEvent) => {
    // If drop event was swallowed by WKWebView, finalize based on last hover or pointer position
    const pointerDate = e ? findDateAtPoint(e.clientX, e.clientY) : null;
    const pointerBacklog = e ? isBacklogFromPoint(e.clientX, e.clientY) : false;
    
    // 优先使用 hoverDate（拖拽过程中记录的），其次使用 pointerDate（结束时的位置）
    const useBacklog = hoveringBacklogRef.current || pointerBacklog;
    const useDate = lastHoverDateRef.current || pointerDate;

    logDrag(
      'end',
      draggingFocusIdRef.current,
      'hoverDate',
      lastHoverDateRef.current,
      'pointerDate',
      pointerDate,
      'useDate',
      useDate,
      'backlog?',
      hoveringBacklogRef.current || pointerBacklog,
      'willSchedule',
      !useBacklog && !!useDate
    );

    if (draggingFocusIdRef.current) {
      if (useBacklog) {
        logDrag('scheduling-to-backlog', draggingFocusIdRef.current);
        updateFocus(draggingFocusIdRef.current, { status: FocusStatus.Backlog, scheduledDate: undefined });
      } else if (useDate) {
        logDrag('scheduling-to-date', draggingFocusIdRef.current, useDate);
        scheduleFocus(draggingFocusIdRef.current, useDate);
      } else {
        logDrag('no-action', draggingFocusIdRef.current, 'no-date-found');
      }
    }
    clearDragging();
  };

  const handleDropOnDate = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.stopPropagation();
    lastHoverDateRef.current = dateStr;
    hoveringBacklogRef.current = false;
    logDrag('drop-date', getDraggedFocusId(e) || draggingFocusId, dateStr);
    const focusId = getDraggedFocusId(e) || draggingFocusId;
    if (focusId) {
      scheduleFocus(focusId, dateStr);
    }
    clearDragging();
  };

  const handleDropToBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hoveringBacklogRef.current = true;
    lastHoverDateRef.current = null;
    logDrag('drop-backlog', getDraggedFocusId(e) || draggingFocusId);
    const focusId = getDraggedFocusId(e) || draggingFocusId;
    if (focusId) {
        updateFocus(focusId, {
            status: FocusStatus.Backlog,
            scheduledDate: undefined
        });
    }
    clearDragging();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGlobalDragOver = (e: DragEvent) => {
    if (!draggingFocusIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Use elementFromPoint for more accurate detection
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const dateElement = element?.closest<HTMLElement>('[data-date]');
    const backlogElement = element?.closest<HTMLElement>('[data-backlog-dropzone="true"]');
    
    // Try to get date from element first, then fallback to coordinate-based detection
    let dateStr: string | null = null;
    if (dateElement?.dataset.date) {
      dateStr = dateElement.dataset.date;
    } else {
      dateStr = findDateAtPoint(e.clientX, e.clientY);
    }
    
    const inBacklog = backlogElement !== null || isBacklogFromPoint(e.clientX, e.clientY);
    
    // 更新 hover 状态 - 优先使用找到的日期
    if (dateStr) {
      lastHoverDateRef.current = dateStr;
      hoveringBacklogRef.current = false;
    } else if (inBacklog) {
      hoveringBacklogRef.current = true;
      lastHoverDateRef.current = null;
    }
    // 如果都没找到，保持之前的状态
    
    logDrag('global-over', draggingFocusIdRef.current, 'date', dateStr, 'backlog', inBacklog, 'hoverDate', lastHoverDateRef.current, 'element', element?.tagName);
  };

  const handleGlobalMove = (e: MouseEvent) => {
    if (!draggingFocusIdRef.current) return;
    
    // Use elementFromPoint for more accurate detection
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const dateElement = element?.closest<HTMLElement>('[data-date]');
    const backlogElement = element?.closest<HTMLElement>('[data-backlog-dropzone="true"]');
    
    // Try to get date from element first, then fallback to coordinate-based detection
    let dateStr: string | null = null;
    if (dateElement?.dataset.date) {
      dateStr = dateElement.dataset.date;
    } else {
      dateStr = findDateAtPoint(e.clientX, e.clientY);
    }
    
    const inBacklog = backlogElement !== null || isBacklogFromPoint(e.clientX, e.clientY);
    
    // 更新 hover 状态 - 优先使用找到的日期
    if (dateStr) {
      lastHoverDateRef.current = dateStr;
      hoveringBacklogRef.current = false;
    } else if (inBacklog) {
      hoveringBacklogRef.current = true;
      lastHoverDateRef.current = null;
    }
    // 如果都没找到，保持之前的状态
    
    logDrag('global-move', draggingFocusIdRef.current, 'date', dateStr, 'backlog', inBacklog, 'hoverDate', lastHoverDateRef.current);
  };

  const handleDragOverDate = (dateStr: string) => {
    // 始终更新，不检查 draggingFocusIdRef，因为可能在拖拽开始前就被调用
    if (dateStr) {
    lastHoverDateRef.current = dateStr;
    hoveringBacklogRef.current = false;
      logDrag('over-date', draggingFocusIdRef.current, dateStr, 'updated-hoverDate');
    }
  };

  const handleDragEnterBacklog = () => {
    hoveringBacklogRef.current = true;
    lastHoverDateRef.current = null;
    logDrag('over-backlog', draggingFocusIdRef.current);
  };

  // Fallback for environments where drop events lose dataTransfer (observed in some Tauri/WKWebView builds)
  const handleMouseDropOnDate = (dateStr: string) => {
    if (!draggingFocusIdRef.current) return;
    scheduleFocus(draggingFocusIdRef.current, dateStr);
    clearDragging();
  };

  const handleMouseDropToBacklog = () => {
    if (!draggingFocusIdRef.current) return;
    updateFocus(draggingFocusIdRef.current, { status: FocusStatus.Backlog, scheduledDate: undefined });
    clearDragging();
  };

  // --- Data Prep ---
  const unscheduledFocuses = useMemo(() => {
    let filtered = focuses.filter(f => f.status === FocusStatus.Backlog);

    // Apply project filter
    if (projectFilter !== 'All') {
      filtered = filtered.filter(f => f.projectId === projectFilter);
    }

    return filtered;
  }, [focuses, projectFilter]);

  const calendarDays = useMemo(() => {
    const start = viewMode === 'month' ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate);
    const end = viewMode === 'month' ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  // Helper function to check if a task spans a specific date
  const isTaskOnDate = (focus: Focus, dateStr: string): boolean => {
    const startDate = focus.startDate || focus.scheduledDate; // Backward compatibility
    const endDate = focus.endDate || focus.startDate || focus.scheduledDate; // Backward compatibility
    
    if (!startDate) return false;
    
    // Task spans this date if: startDate <= dateStr <= endDate
    return dateStr >= startDate && dateStr <= endDate;
  };

  // Helper function to get task display info for a specific date
  const getTaskDisplayInfo = (focus: Focus, dateStr: string): { showFull: boolean; isStart: boolean; isEnd: boolean; spanDays: number } => {
    const startDate = focus.startDate || focus.scheduledDate;
    const endDate = focus.endDate || focus.startDate || focus.scheduledDate;
    
    if (!startDate) return { showFull: false, isStart: false, isEnd: false, spanDays: 0 };
    
    const isStart = dateStr === startDate;
    const isEnd = dateStr === endDate;
    const spanDays = startDate && endDate ? Math.max(1, Math.ceil((parseISO(endDate).getTime() - parseISO(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
    
    // Show full card on start date, bar indicator on other dates
    return {
      showFull: isStart,
      isStart,
      isEnd,
      spanDays
    };
  };

  const getFocusesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return focuses.filter(f => {
      const isInRange = isTaskOnDate(f, dateStr);
      const matchesFilter = projectFilter === 'All' || f.projectId === projectFilter;
      
      return isInRange && matchesFilter;
    });
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId)?.title;
  };

  const handleAddTaskOnDate = (title: string, projectId?: string, startDate?: string, endDate?: string) => {
    if (!newTaskDate) return;
    const finalStartDate = startDate || format(newTaskDate, 'yyyy-MM-dd');
    const finalEndDate = endDate || finalStartDate;
    addFocus({
      title,
      status: FocusStatus.Scheduled,
      scheduledDate: finalStartDate, // Keep for backward compatibility
      startDate: finalStartDate,
      endDate: finalEndDate,
      projectId: projectId || (projectFilter !== 'All' ? projectFilter : undefined)
    });
    setNewTaskDate(null);
  };

  const handleAddFocusFromSidebar = (title: string) => {
    addFocus({
      title,
      status: FocusStatus.Backlog,
      projectId: projectFilter !== 'All' ? projectFilter : undefined
    });
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);

    setTimeout(() => {
        const dateStr = format(today, 'yyyy-MM-dd');
        const el = document.getElementById(`day-column-${dateStr}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, 100);
  };

  // Calculate week rows for month view with spanning events
  const weekRows = useMemo(() => {
    if (viewMode !== 'month') return [];

    const rows: { weekStart: Date; days: Date[]; spanningEvents: SpanningEvent[] }[] = [];

    // Group calendar days into weeks
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7);
      const weekStart = weekDays[0];
      const weekEndStr = format(weekDays[6], 'yyyy-MM-dd');
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      // Find all scheduled focuses that intersect this week
      const weekFocuses = focuses.filter(f => {
        if (f.status === FocusStatus.Backlog) return false;
        if (projectFilter !== 'All' && f.projectId !== projectFilter) return false;

        const focusStart = f.startDate || f.scheduledDate;
        const focusEnd = f.endDate || focusStart;
        if (!focusStart) return false;

        // Check if focus intersects with this week
        return focusStart <= weekEndStr && focusEnd >= weekStartStr;
      });

      // Calculate spanning events for this week
      const spanningEvents: SpanningEvent[] = [];
      const rowOccupancy: boolean[][] = []; // Track which columns are occupied in each row

      // Sort focuses by start date, then by duration (longer events first)
      const sortedFocuses = [...weekFocuses].sort((a, b) => {
        const aStart = a.startDate || a.scheduledDate || '';
        const bStart = b.startDate || b.scheduledDate || '';
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        // Longer events first
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        return bEnd.localeCompare(aEnd) - aStart.localeCompare(bStart);
      });

      for (const focus of sortedFocuses) {
        const focusStart = focus.startDate || focus.scheduledDate || '';
        const focusEnd = focus.endDate || focusStart;

        // Calculate start column (0-6) - clamp to week boundaries
        let startCol = 0;
        if (focusStart > weekStartStr) {
          const startDate = parseISO(focusStart);
          startCol = differenceInDays(startDate, weekStart);
        }

        // Calculate span columns - clamp to week end
        let endCol = 6;
        if (focusEnd < weekEndStr) {
          const endDate = parseISO(focusEnd);
          endCol = differenceInDays(endDate, weekStart);
        }
        const spanCols = endCol - startCol + 1;

        // Find a row that has space for this event
        let assignedRow = 0;
        for (let row = 0; row < 10; row++) { // Max 10 rows
          if (!rowOccupancy[row]) rowOccupancy[row] = new Array(7).fill(false);
          let hasSpace = true;
          for (let col = startCol; col <= endCol; col++) {
            if (rowOccupancy[row][col]) {
              hasSpace = false;
              break;
            }
          }
          if (hasSpace) {
            assignedRow = row;
            // Mark columns as occupied
            for (let col = startCol; col <= endCol; col++) {
              rowOccupancy[row][col] = true;
            }
            break;
          }
        }

        spanningEvents.push({
          focus,
          startCol,
          spanCols,
          row: assignedRow
        });
      }

      rows.push({ weekStart, days: weekDays, spanningEvents });
    }

    return rows;
  }, [calendarDays, focuses, projectFilter, viewMode]);

  // Drag-to-create handlers
  const handleCreateDragStart = (dateStr: string) => {
    if (draggingFocusIdRef.current) return; // Don't start if dragging a task
    setIsCreatingEvent(true);
    setCreateStartDate(dateStr);
    setCreateEndDate(dateStr);
  };

  const handleCreateDragMove = (dateStr: string) => {
    if (!isCreatingEvent || !createStartDate) return;
    setCreateEndDate(dateStr);
  };

  const handleCreateDragEnd = () => {
    if (!isCreatingEvent || !createStartDate || !createEndDate) {
      setIsCreatingEvent(false);
      setCreateStartDate(null);
      setCreateEndDate(null);
      return;
    }

    // Determine start and end (user might drag backwards)
    const start = createStartDate <= createEndDate ? createStartDate : createEndDate;
    const end = createStartDate <= createEndDate ? createEndDate : createStartDate;

    // Open the add task dialog with the date range
    setNewTaskDate(parseISO(start));
    // Store the end date for the dialog
    (window as any).__createEndDate = end !== start ? end : undefined;

    setIsCreatingEvent(false);
    setCreateStartDate(null);
    setCreateEndDate(null);
  };

  // Check if a date is in the create selection range
  const isInCreateRange = (dateStr: string): boolean => {
    if (!isCreatingEvent || !createStartDate || !createEndDate) return false;
    const start = createStartDate <= createEndDate ? createStartDate : createEndDate;
    const end = createStartDate <= createEndDate ? createEndDate : createStartDate;
    return dateStr >= start && dateStr <= end;
  };

  // Drag-to-resize handlers
  const handleResizeStart = (e: React.MouseEvent, focusId: string, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();

    const focus = focuses.find(f => f.id === focusId);
    if (!focus) return;

    const originalStart = focus.startDate || focus.scheduledDate || '';
    const originalEnd = focus.endDate || focus.startDate || focus.scheduledDate || '';

    const taskInfo = { id: focusId, edge, originalStart, originalEnd };
    setResizingTask(taskInfo);
    resizingTaskRef.current = taskInfo;

    // Add global mouse event listeners
    const handleMove = (ev: MouseEvent) => {
      const task = resizingTaskRef.current;
      if (!task) return;

      const dateStr = findDateAtPoint(ev.clientX, ev.clientY);
      if (!dateStr) return;

      if (task.edge === 'start') {
        // Resizing from start - can't go past original end date
        if (dateStr <= task.originalEnd) {
          updateFocus(task.id, {
            startDate: dateStr,
            scheduledDate: dateStr // Keep backward compatibility
          });
          // Update original end if needed (it's now relative to new start)
          resizingTaskRef.current = { ...task, originalStart: dateStr };
        }
      } else {
        // Resizing from end - can't go before original start date
        if (dateStr >= task.originalStart) {
          updateFocus(task.id, { endDate: dateStr });
          resizingTaskRef.current = { ...task, originalEnd: dateStr };
        }
      }
    };

    const handleEnd = () => {
      setResizingTask(null);
      resizingTaskRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <FocusSidebar
        focuses={unscheduledFocuses}
        projects={projects}
        projectFilter={projectFilter}
        onFilterChange={setProjectFilter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnterBacklog={handleDragEnterBacklog}
        onDrop={handleDropToBacklog}
        onAddFocus={handleAddFocusFromSidebar}
        onUpdateFocus={updateFocus}
        onDeleteFocus={deleteFocus}
        onReorderFocuses={reorderFocuses}
      />

      <div className="flex-1 flex flex-col bg-white overflow-hidden relative z-10">
        <CalendarToolbar
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDateChange={setCurrentDate}
          onJumpToToday={handleJumpToToday}
        />

        <div className={`flex-1 ${viewMode === 'week' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto relative'}`}>

             {viewMode === 'month' && (
                <div className="grid grid-cols-7 border-b border-zinc-200 sticky top-0 z-20 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="h-9 bg-zinc-50/80 backdrop-blur-sm text-[10px] font-semibold text-zinc-400 flex items-center justify-center uppercase tracking-widest border-r border-zinc-100/50 last:border-r-0">
                            {d}
                        </div>
                    ))}
                </div>
             )}

             {/* MONTH VIEW - Apple Calendar style */}
             {viewMode === 'month' && (
               <div className="flex flex-col min-h-[calc(100%-36px)]" ref={monthGridRef}>
                 {weekRows.map((weekRow, weekIndex) => {
                   const maxEventRows = Math.max(3, ...weekRow.spanningEvents.map(e => e.row + 1));
                   const eventAreaHeight = Math.min(maxEventRows, 4) * 22 + 4; // 22px per event row + padding

                   return (
                     <div key={weekIndex} className="flex-1 min-h-[120px] border-b border-zinc-200">
                       {/* Week row container */}
                       <div className="grid grid-cols-7 h-full relative">
                         {/* Day cells (background) */}
                         {weekRow.days.map((day, dayIndex) => {
                           const dateStr = format(day, 'yyyy-MM-dd');
                           const isTodayDate = isToday(day);
                           const isCurrentMonth = isSameMonth(day, currentDate);
                           const inCreateRange = isInCreateRange(dateStr);

                           return (
                             <div
                               key={dateStr}
                               data-date={dateStr}
                               onDragOver={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDragOver(e);
                                 handleDragOverDate(dateStr);
                               }}
                               onDragEnter={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDragOver(e);
                                 handleDragOverDate(dateStr);
                               }}
                               onDrop={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleDropOnDate(e, dateStr);
                               }}
                               onPointerUp={(e) => {
                                 if (draggingFocusIdRef.current) {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   handleMouseDropOnDate(dateStr);
                                 }
                               }}
                               onMouseDown={() => handleCreateDragStart(dateStr)}
                               onMouseEnter={() => handleCreateDragMove(dateStr)}
                               onMouseUp={handleCreateDragEnd}
                               className={`flex flex-col border-r border-zinc-100 last:border-r-0 transition-colors group/day cursor-pointer ${
                                 !isCurrentMonth ? 'bg-zinc-50/40' : 'bg-white'
                               } ${inCreateRange ? 'bg-blue-50' : 'hover:bg-zinc-50'}`}
                             >
                               {/* Date header */}
                               <div className="flex justify-between items-start p-1.5 pb-0">
                                 <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                                   isTodayDate ? 'bg-zinc-900 text-white' : isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300'
                                 }`}>
                                   {format(day, 'd')}
                                 </span>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setNewTaskDate(day);
                                   }}
                                   className="p-1 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-200 rounded-md opacity-0 group-hover/day:opacity-100 transition-opacity"
                                 >
                                   <Plus size={14} />
                                 </button>
                               </div>

                               {/* Spacer for events area */}
                               <div style={{ height: eventAreaHeight }} />
                             </div>
                           );
                         })}

                         {/* Spanning events layer (positioned absolutely) */}
                         <div
                           className="absolute left-0 right-0 pointer-events-none"
                           style={{ top: 32, height: eventAreaHeight }}
                         >
                           {weekRow.spanningEvents.slice(0, 12).map((spanEvent) => {
                             const { focus, startCol, spanCols, row } = spanEvent;
                             if (row >= 4) return null; // Max 4 visible rows

                             const leftPercent = (startCol / 7) * 100;
                             const widthPercent = (spanCols / 7) * 100;
                             const focusStart = focus.startDate || focus.scheduledDate || '';
                             const focusEnd = focus.endDate || focusStart;
                             const weekStartStr = format(weekRow.weekStart, 'yyyy-MM-dd');
                             const isStartInWeek = focusStart >= weekStartStr;
                             const weekEndStr = format(weekRow.days[6], 'yyyy-MM-dd');
                             const isEndInWeek = focusEnd <= weekEndStr;

                             return (
                               <div
                                 key={`${focus.id}-${weekIndex}`}
                                 draggable={!resizingTask}
                                 onDragStart={(e) => {
                                   if (resizingTask) {
                                     e.preventDefault();
                                     return;
                                   }
                                   handleDragStart(e, focus.id);
                                 }}
                                 onDragEnd={handleDragEnd}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (resizingTask) return;
                                   updateFocus(focus.id, { status: focus.status === FocusStatus.Done ? FocusStatus.Scheduled : FocusStatus.Done });
                                 }}
                                 className={`absolute pointer-events-auto cursor-pointer transition-all group/event ${
                                   focus.status === FocusStatus.Done
                                     ? 'bg-zinc-200 text-zinc-400 line-through'
                                     : 'bg-zinc-700 text-white hover:bg-zinc-800'
                                 } ${isStartInWeek ? 'rounded-l-md' : ''} ${isEndInWeek ? 'rounded-r-md' : ''} ${
                                   resizingTask?.id === focus.id ? 'ring-2 ring-blue-400' : ''
                                 }`}
                                 style={{
                                   left: `calc(${leftPercent}% + 2px)`,
                                   width: `calc(${widthPercent}% - 4px)`,
                                   top: row * 22 + 2,
                                   height: 18,
                                 }}
                                 title={focus.title}
                               >
                                 {/* Left resize handle (start date) */}
                                 {isStartInWeek && (
                                   <div
                                     onMouseDown={(e) => handleResizeStart(e, focus.id, 'start')}
                                     className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 hover:bg-white/30 rounded-l-md transition-opacity"
                                     title="Drag to change start date"
                                   />
                                 )}
                                 <div className="px-1.5 text-[10px] font-medium truncate leading-[18px]">
                                   {focus.title}
                                 </div>
                                 {/* Right resize handle (end date) */}
                                 {isEndInWeek && (
                                   <div
                                     onMouseDown={(e) => handleResizeStart(e, focus.id, 'end')}
                                     className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 hover:bg-white/30 rounded-r-md transition-opacity"
                                     title="Drag to change end date"
                                   />
                                 )}
                               </div>
                             );
                           })}

                           {/* Show "+N more" if too many events */}
                           {weekRow.spanningEvents.filter(e => e.row >= 4).length > 0 && (
                             <div
                               className="absolute left-1 text-[9px] text-zinc-400 font-medium"
                               style={{ top: 4 * 22 + 2 }}
                             >
                               +{weekRow.spanningEvents.filter(e => e.row >= 4).length} more
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}

             {/* WEEK VIEW */}
             {viewMode === 'week' && (
               <div className="flex h-full" ref={weekContainerRef}>
                 {calendarDays.map((day) => {
                   const isCurrentMonth = isSameMonth(day, currentDate);
                   const dayFocuses = getFocusesForDate(day);
                   const dateStr = format(day, 'yyyy-MM-dd');
                   const isTodayDate = isToday(day);
                   const hasTasks = dayFocuses.length > 0;
                   const isCompact = !isTodayDate && !hasTasks;

                    return (
                        <div
                        key={dateStr}
                        id={`day-column-${dateStr}`}
                        data-date={dateStr}
                        onDragOver={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          handleDragOver(e); 
                          handleDragOverDate(dateStr); 
                        }}
                        onDragEnter={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          handleDragOver(e); 
                          handleDragOverDate(dateStr); 
                        }}
                        onDragLeave={(e) => {
                          // 只有当鼠标真正离开元素时才清除（避免子元素触发）
                          const relatedTarget = e.relatedTarget as Node;
                          if (!e.currentTarget.contains(relatedTarget) && 
                              !(relatedTarget instanceof Element && relatedTarget.closest('[data-date]'))) {
                            // 不清除，保持最后的状态，因为可能移动到其他日期列
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDropOnDate(e, dateStr);
                        }}
                        onPointerUp={(e) => {
                          // 在 Tauri 中，pointer 事件可能更可靠
                          if (draggingFocusIdRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMouseDropOnDate(dateStr);
                          }
                        }}
                        className={`${isCompact ? 'min-w-[120px] w-[120px]' : 'min-w-[280px] w-[280px]'} flex-shrink-0 h-full bg-zinc-50/30 flex flex-col border-r border-zinc-200 transition-all duration-300 ${isTodayDate ? 'bg-zinc-50' : ''} group/col`}
                        >
                        <div className={`p-4 border-b border-zinc-200/50 flex justify-between items-center ${isTodayDate ? 'bg-zinc-100/80' : ''}`}>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                {isCompact ? format(day, 'EEE') : format(day, 'EEEE')}
                                </span>
                                <span className={`text-sm font-bold ${isTodayDate ? 'text-zinc-900' : 'text-zinc-400'}`}>{format(day, 'MM/dd')}</span>
                            </div>
                            {!isCompact && (
                                <button
                                    onClick={() => setNewTaskDate(day)}
                                    className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover/col:opacity-100 transition-opacity"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                            {dayFocuses.map(focus => {
                              const displayInfo = getTaskDisplayInfo(focus, dateStr);
                              const startDate = focus.startDate || focus.scheduledDate;
                              const endDate = focus.endDate || focus.startDate || focus.scheduledDate;
                              const isSpanning = startDate && endDate && startDate !== endDate;
                              
                              // Show full card on start date, bar indicator on other dates
                              if (displayInfo.showFull || !isSpanning) {
                                return (
                                  <div
                                    key={focus.id}
                                    draggable={!resizingTask}
                                    onDragStart={(e) => {
                                      if (resizingTask) {
                                        e.preventDefault();
                                        return;
                                      }
                                      handleDragStart(e, focus.id);
                                    }}
                                    onDragEnd={handleDragEnd}
                                    className={`p-3 bg-white rounded-lg border shadow-sm text-sm cursor-move group/card relative transition-all ${
                                      focus.status === FocusStatus.Done ? 'opacity-60 grayscale border-zinc-100' : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                                    } ${resizingTask?.id === focus.id ? 'ring-2 ring-blue-400' : ''}`}
                                  >
                                    <div className="flex items-start gap-3 mb-1">
                                      <button
                                        onClick={() => updateFocus(focus.id, { status: focus.status === FocusStatus.Done ? FocusStatus.Scheduled : FocusStatus.Done })}
                                        className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                                          focus.status === FocusStatus.Done
                                          ? 'bg-zinc-800 border-zinc-800 text-white'
                                          : 'border-zinc-300 hover:border-zinc-500 bg-white'
                                        }`}
                                      >
                                        {focus.status === FocusStatus.Done && <div className="w-2 h-2 bg-white rounded-full"/>}
                                      </button>
                                      <span className={`leading-snug font-medium ${focus.status === FocusStatus.Done ? 'line-through decoration-zinc-300 text-zinc-400' : 'text-zinc-800'}`}>
                                        {focus.title}
                                      </span>
                                    </div>
                                    {focus.projectId && (
                                      <div className="ml-7">
                                        <span className="text-[9px] text-zinc-500 px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-100 truncate max-w-full inline-block">
                                          {getProjectName(focus.projectId)}
                                        </span>
                                      </div>
                                    )}
                                    {isSpanning && (
                                      <div className="ml-7 mt-1 text-[9px] text-zinc-400">
                                        {format(parseISO(startDate), 'MMM d')} - {format(parseISO(endDate), 'MMM d')}
                                      </div>
                                    )}
                                    {/* Resize handle at bottom for extending end date */}
                                    <div
                                      onMouseDown={(e) => handleResizeStart(e, focus.id, 'end')}
                                      className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize opacity-0 group-hover/card:opacity-100 hover:bg-zinc-200 rounded-b transition-opacity flex items-center justify-center"
                                      title="Drag to extend duration"
                                    >
                                      <div className="w-8 h-0.5 bg-zinc-300 rounded-full" />
                                    </div>
                                  </div>
                                );
                              } else {
                                // Show bar indicator for spanning tasks on non-start dates
                                const isLastDay = dateStr === endDate;
                                return (
                                  <div
                                    key={`${focus.id}-bar`}
                                    className={`h-8 px-2 flex items-center bg-zinc-100 border-l-2 rounded-r relative group/bar ${
                                      focus.status === FocusStatus.Done
                                        ? 'border-zinc-300 opacity-60'
                                        : 'border-zinc-400 hover:bg-zinc-200'
                                    } transition-all cursor-pointer ${resizingTask?.id === focus.id ? 'ring-2 ring-blue-400' : ''}`}
                                    title={focus.title}
                                    onClick={() => {
                                      if (resizingTask) return;
                                      // Scroll to start date
                                      const startEl = document.getElementById(`day-column-${startDate}`);
                                      if (startEl) {
                                        startEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                                      }
                                    }}
                                  >
                                    <span className={`text-xs truncate ${focus.status === FocusStatus.Done ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
                                      {focus.title}
                                    </span>
                                    {/* Show resize handle on the last day of spanning task */}
                                    {isLastDay && (
                                      <div
                                        onMouseDown={(e) => handleResizeStart(e, focus.id, 'end')}
                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 hover:bg-zinc-300 rounded-r transition-opacity"
                                        title="Drag to change end date"
                                      />
                                    )}
                                  </div>
                                );
                              }
                            })}
                             <button
                                onClick={() => setNewTaskDate(day)}
                                className="w-full py-2 flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100/50 rounded-lg border border-dashed border-transparent hover:border-zinc-200 transition-all text-xs gap-1"
                            >
                                <Plus size={12} /> Add Task
                            </button>
                        </div>
                        </div>
                    );
                 })}
               </div>
             )}
        </div>

        {newTaskDate && (
            <AddTaskDialog
                date={newTaskDate}
                projects={projects}
                onClose={() => setNewTaskDate(null)}
                onAdd={handleAddTaskOnDate}
            />
        )}
      </div>
    </div>
  );
};
