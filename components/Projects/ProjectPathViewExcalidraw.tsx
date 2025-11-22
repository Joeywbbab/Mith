import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import rough from 'roughjs';
import type { RoughSVG } from 'roughjs/bin/svg';
import { useStore } from '../../context/StoreContext';
import { Phase, FocusStatus, ProjectType } from '../../types';
import { renderArrow } from './LineRenderer';

interface Point {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
const PADDING = 120;
const SPINE_X = CANVAS_WIDTH * 0.32;
const PHASE_RADIUS = 65;
const PROJECT_RADIUS = 32;
const ACTION_RADIUS = 10;
const DETAIL_WIDTH = 280;
const DETAIL_MIN_HEIGHT = 150;
const VIEWBOX_MIN_ZOOM = 0.2;
const VIEWBOX_MAX_ZOOM = 4;
const PHASE_COLORS = ['#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffd8a8', '#e9fac8', '#d0bfff'];
const MIN_PHASE_SPACING = 0.18;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const ProjectPathViewExcalidraw: React.FC = () => {
  const { projects, phases: storePhases, focuses, milestones, addPhase, addProject, deleteProject, deletePhase, updateProject } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [anchorOverrides, setAnchorOverrides] = useState<Record<string, Point>>({});
  const [phaseOverrides, setPhaseOverrides] = useState<Record<string, Point>>({});
  const [projectOverrides, setProjectOverrides] = useState<Record<string, Point>>({});
  const [draggingAnchorId, setDraggingAnchorId] = useState<string | null>(null);
  const [draggingPhaseId, setDraggingPhaseId] = useState<string | null>(null);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const selectedPhaseRef = useRef<string | null>(null);

  // 排序后的 phases，便于计算
  const phases: Phase[] = useMemo(
    () => [...storePhases].sort((a, b) => a.position - b.position),
    [storePhases]
  );

  // 将未绑定 Phase 的项目自动绑定到第一个 Phase，避免列表/路径不同步
  useEffect(() => {
    if (!phases.length) return;
    const firstPhaseId = phases[0].id;
    projects.forEach((p) => {
      if (!p.phaseId) {
        updateProject(p.id, { phaseId: firstPhaseId });
      }
    });
  }, [projects, phases, updateProject]);

  // 计算路径范围，允许轻微溢出便于摆放
  const pathRange = useMemo(() => {
    if (phases.length === 0) return { min: 0, max: 1 };
    const positions = phases.map((p) =>
      p.y !== undefined ? clamp((p.y - PADDING) / (CANVAS_HEIGHT - PADDING * 2), 0, 1) : p.position
    );
    const min = Math.max(0, Math.min(...positions) - 0.1);
    const max = Math.max(1, Math.max(...positions) + 0.2);
    return { min, max };
  }, [phases]);

  // 通过 Catmull-Rom 生成平滑曲线，确保经过所有锚点（phase）
  const generateSmoothPathPoints = useCallback((anchors: Point[], samples = 160): Point[] => {
    if (anchors.length === 0) return [];
    if (anchors.length === 1) return anchors;

    const pts = anchors.map((p) => ({ x: p.x, y: p.y }));
    // 端点复制以获得更平滑的插值
    pts.unshift(pts[0]);
    pts.push(pts[pts.length - 1]);

      const result: Point[] = [];
    for (let i = 0; i < pts.length - 3; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const p2 = pts[i + 2];
      const p3 = pts[i + 3];
      for (let t = 0; t < 1; t += 1 / samples) {
        const t2 = t * t;
        const t3 = t2 * t;
        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        result.push({ x, y });
      }
    }
    result.push(pts[pts.length - 2]);
    return result;
  }, []);

  // 基于 phase 位置生成主脊柱锚点，可被拖拽覆盖
  const spineAnchors = useMemo(() => {
    if (phases.length === 0) {
      return [
        { x: CANVAS_WIDTH * 0.32, y: PADDING },
        { x: CANVAS_WIDTH * 0.32, y: CANVAS_HEIGHT - PADDING },
      ];
    }
    return phases.map((phase) => {
      const basePos =
        phase.y !== undefined ? clamp((phase.y - PADDING) / (CANVAS_HEIGHT - PADDING * 2), 0, 1) : phase.position;
      const y = PADDING + (CANVAS_HEIGHT - PADDING * 2) * basePos;
      const x = SPINE_X;
      const override = anchorOverrides[phase.id] ?? phaseOverrides[phase.id];
      return override ? { x: override.x, y: override.y } : { x, y };
    });
  }, [phases, anchorOverrides, phaseOverrides]);

  // 主路径采样点，用于绘制曲线及沿曲线取点
  const pathPoints = useMemo(() => {
    if (spineAnchors.length < 2) return spineAnchors;
    const sortedAnchors = [...spineAnchors].sort((a, b) => a.y - b.y);
    const samples: Point[] = [];
    for (let i = 1; i < sortedAnchors.length; i++) {
      const prev = sortedAnchors[i - 1];
      const curr = sortedAnchors[i];
      const dy = curr.y - prev.y;
      const dir = i % 2 === 0 ? -1 : 1; // 交替左右偏移
      const bend = 70 * dir;
      const c1 = { x: SPINE_X + bend, y: prev.y + dy / 3 };
      const c2 = { x: SPINE_X + bend * 0.9, y: curr.y - dy / 3 };
      const steps = 40;
      for (let tStep = 0; tStep <= steps; tStep++) {
        const t = tStep / steps;
        const x =
          Math.pow(1 - t, 3) * prev.x +
          3 * Math.pow(1 - t, 2) * t * c1.x +
          3 * (1 - t) * Math.pow(t, 2) * c2.x +
          Math.pow(t, 3) * curr.x;
        const y =
          Math.pow(1 - t, 3) * prev.y +
          3 * Math.pow(1 - t, 2) * t * c1.y +
          3 * (1 - t) * Math.pow(t, 2) * c2.y +
          Math.pow(t, 3) * curr.y;
        samples.push({ x, y });
      }
    }
    return samples;
  }, [spineAnchors]);

  const getPointOnPathByY = useCallback(
    (y: number): Point => {
      if (pathPoints.length === 0) return { x: SPINE_X, y };
      const sorted = [...pathPoints].sort((a, b) => a.y - b.y);
      const clampedY = clamp(y, sorted[0].y, sorted[sorted.length - 1].y);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        if (clampedY >= a.y && clampedY <= b.y) {
          const t = (clampedY - a.y) / (b.y - a.y || 1);
          return { x: a.x + (b.x - a.x) * t, y: clampedY };
        }
      }
      return sorted[sorted.length - 1];
    },
    [pathPoints]
  );

  const getPointOnPathByPos = useCallback(
    (position: number): Point => {
      const y = PADDING + (CANVAS_HEIGHT - PADDING * 2) * position;
      return getPointOnPathByY(y);
    },
    [getPointOnPathByY]
  );

  // Phase / Project 布局
  const layout = useMemo(() => {
    const posFromY = (y: number) => clamp((y - PADDING) / (CANVAS_HEIGHT - PADDING * 2), 0, 1);
    // 自适应 phase 间距：若未提供 y，则基于 position 并做最小间距处理
    const sorted = [...phases].sort((a, b) => a.position - b.position);
    const adjustedPositions: Record<string, number> = {};
    let lastPos = 0;
    sorted.forEach((p, idx) => {
      const base = p.position ?? idx / Math.max(1, sorted.length - 1);
      const pos = idx === 0 ? base : Math.max(base, lastPos + MIN_PHASE_SPACING);
      adjustedPositions[p.id] = Math.min(1, pos);
      lastPos = adjustedPositions[p.id];
    });

    return phases.map((phase, phaseIdx) => {
      const phasePos =
        phaseOverrides[phase.id]?.y !== undefined
          ? posFromY(phaseOverrides[phase.id].y)
          : phase.y !== undefined
          ? posFromY(phase.y)
          : adjustedPositions[phase.id] ?? phase.position;

      const basePhasePoint =
        phase.x !== undefined && phase.y !== undefined ? { x: phase.x, y: phase.y } : getPointOnPathByPos(phasePos);
      const phasePoint =
        phaseOverrides[phase.id] ?? { ...basePhasePoint, x: SPINE_X };

      const phaseProjects = projects.filter(
        (p) => p.phaseId === phase.id || (!p.phaseId && phaseIdx === 0)
      );
      const projectSpacing = 0.045;
      const projectStart = 0.03;
      const phaseAnchorPos = posFromY(phasePoint.y);
      const projectItems = phaseProjects.map((project, idx) => {
        const overridden = projectOverrides[project.id];
        const pos =
          overridden?.y !== undefined
            ? posFromY(overridden.y)
            : project.y !== undefined
            ? posFromY(project.y)
            : phaseAnchorPos + projectStart + idx * projectSpacing;
        const basePoint = getPointOnPathByPos(pos);
        const y = overridden?.y ?? basePoint.y;
        const anchoredPoint = getPointOnPathByPos(posFromY(y));
        const point = overridden
          ? { x: overridden.x ?? anchoredPoint.x + 80, y: y }
          : { x: anchoredPoint.x + 80, y: anchoredPoint.y };
        return { project, pos, point };
      });

      return { phase, phasePoint, projectItems };
    });
  }, [phases, projects, getPointOnPathByPos, phaseOverrides, projectOverrides]);

  // 生成动作点（Action/Focus）在 project 周围
  const getActionPoints = (projectId: string, center: Point): Point[] => {
    const related = focuses.filter((f) => f.projectId === projectId);
    const maxDots = 4;
    const angleStep = Math.PI / (maxDots + 1);
    return related.slice(0, maxDots).map((_, idx) => {
      const angle = -Math.PI / 2 + (idx + 1) * angleStep;
      const radius = PROJECT_RADIUS + 24;
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
  };

  useEffect(() => {
    selectedPhaseRef.current = selectedPhaseId;
  }, [selectedPhaseId]);

  // 点击处理
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleClick = (e: MouseEvent) => {
      // 忽略拖拽后的 mouseup
      if (isPanning) return;
      const target = e.target as HTMLElement;
      let el: HTMLElement | null = target;
      while (el) {
        const phaseId = el.getAttribute('data-phase-id');
        if (phaseId && isAddingProject) {
          const phase = phases.find(p => p.id === phaseId);
          if (phase) {
            const basePos = phase.position ?? 0;
            const pos = Math.min(1, basePos + 0.08);
            addProject({
              title: 'New Project',
              type: ProjectType.Assignment,
              phaseId: phase.id,
              position: pos,
            });
          }
          setIsAddingProject(false);
          setIsAddingPhase(false);
          return;
        } else if (phaseId) {
          setSelectedPhaseId(phaseId);
          setSelectedProjectId(null);
          return;
        }
        const projectId = el.getAttribute('data-project-id');
        if (projectId) {
          setSelectedProjectId((prev) => (prev === projectId ? null : projectId));
          setSelectedPhaseId(null);
          break;
        }
        el = el.parentElement;
      }
      if (isAddingProject) {
        setIsAddingProject(false);
      }
    };

    svg.addEventListener('click', handleClick);
    return () => svg.removeEventListener('click', handleClick);
  }, [isPanning, isAddingProject, phases, addProject]);

  // 渲染
  useEffect(() => {
    if (!svgRef.current) return;

    try {
      const existing = svgRef.current.querySelector('#path-view-layer');
      if (existing) existing.remove();
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'path-view-layer');
      svgRef.current.appendChild(group);

      const rc: RoughSVG = rough.svg(svgRef.current);

      // 主路径（柔和转折曲线）
      if (spineAnchors.length > 1) {
        const sortedAnchors = [...spineAnchors].sort((a, b) => a.y - b.y);
        let d = `M ${sortedAnchors[0].x} ${sortedAnchors[0].y}`;
        for (let i = 1; i < sortedAnchors.length; i++) {
          const prev = sortedAnchors[i - 1];
          const curr = sortedAnchors[i];
          const dy = curr.y - prev.y;
          const dir = i % 2 === 0 ? -1 : 1; // 交替左右偏移
          const bend = 70 * dir;
          const c1 = { x: SPINE_X + bend, y: prev.y + dy / 3 };
          const c2 = { x: SPINE_X + bend * 0.9, y: curr.y - dy / 3 };
          d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${curr.x} ${curr.y}`;
        }
        const spine = rc.path(d, {
          stroke: '#555',
          strokeWidth: 2.5,
          roughness: 1.3,
          bowing: 1.1,
        });
        group.appendChild(spine);

        // 主路径锚点可拖拽手柄
        spineAnchors.forEach((anchor, idx) => {
          const handle = rc.circle(anchor.x, anchor.y, 12, {
            stroke: '#3b82f6',
            strokeWidth: 2.2,
            fill: '#ffffff',
            fillStyle: 'solid',
            roughness: 1.2,
          });
          handle.setAttribute('data-anchor-id', phases[idx]?.id || `anchor-${idx}`);
          group.appendChild(handle);

          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          hit.setAttribute('cx', String(anchor.x));
          hit.setAttribute('cy', String(anchor.y));
          hit.setAttribute('r', '18');
          hit.setAttribute('fill', 'transparent');
          hit.setAttribute('data-anchor-id', phases[idx]?.id || `anchor-${idx}`);
          hit.style.pointerEvents = 'all';
          group.appendChild(hit);
        });
      }

      layout.forEach(({ phase, phasePoint, projectItems }) => {
        // Phase diamond
        const diamondSize = PHASE_RADIUS * 1.4;
        const diamondPoints = [
          [phasePoint.x, phasePoint.y - diamondSize],
          [phasePoint.x + diamondSize, phasePoint.y],
          [phasePoint.x, phasePoint.y + diamondSize],
          [phasePoint.x - diamondSize, phasePoint.y],
        ];
        const phaseDiamond = rc.polygon(diamondPoints, {
          stroke: '#353535',
          strokeWidth: 2.5,
          fill: phase.color,
          fillStyle: 'hachure',
          hachureGap: 6,
          hachureAngle: 45,
          roughness: 1.6,
          bowing: 1.3,
        });
        phaseDiamond.setAttribute('data-phase-id', phase.id);
        phaseDiamond.style.pointerEvents = 'all';
        group.appendChild(phaseDiamond);

        // Phase hit area for dragging
        const phaseHit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        phaseHit.setAttribute('x', String(phasePoint.x - diamondSize - 10));
        phaseHit.setAttribute('y', String(phasePoint.y - diamondSize - 10));
        phaseHit.setAttribute('width', String(diamondSize * 2 + 20));
        phaseHit.setAttribute('height', String(diamondSize * 2 + 20));
        phaseHit.setAttribute('fill', 'transparent');
        phaseHit.setAttribute('data-phase-id', phase.id);
        phaseHit.style.pointerEvents = 'all';
        phaseHit.style.cursor = 'grab';
        group.appendChild(phaseHit);

        // Phase label (L size)
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(phasePoint.x + PHASE_RADIUS + 18));
        label.setAttribute('y', String(phasePoint.y + 8));
        label.setAttribute('fill', '#262626');
        label.setAttribute('font-size', '26');
        label.setAttribute('font-family', 'Architects Daughter, ui-monospace, system-ui');
        label.textContent = phase.title;
        label.setAttribute('data-phase-id', phase.id);
        label.style.pointerEvents = 'all';
        group.appendChild(label);

        projectItems.forEach(({ project, point }) => {
          const isSelected = selectedProjectId === project.id;
          const projectCircle = rc.circle(point.x, point.y, PROJECT_RADIUS * 2, {
            stroke: isSelected ? '#111' : '#4a4a4a',
            strokeWidth: isSelected ? 3 : 2.2,
            fill: isSelected ? phase.color : '#ffffff',
            fillStyle: isSelected ? 'hachure' : 'solid',
            hachureGap: 6,
            roughness: 1.4,
            bowing: 1.1,
          });
          group.appendChild(projectCircle);

          // 连接 Phase -> Project
          const connector = renderArrow(
            rc,
            phasePoint.x,
            phasePoint.y + PHASE_RADIUS * 0.4,
            point.x - PROJECT_RADIUS,
            point.y,
            {
              stroke: '#8b8b8b',
              strokeWidth: 1.8,
              roughness: 1.2,
              bowing: 0.8,
              endArrowhead: null,
              arrowSize: 8,
              useExcalidrawStyle: false,
            }
          );
          group.appendChild(connector);

          // Project label (M size)
          const projLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          projLabel.setAttribute('x', String(point.x + PROJECT_RADIUS + 16));
          projLabel.setAttribute('y', String(point.y + 6));
          projLabel.setAttribute('fill', '#262626');
          projLabel.setAttribute('font-size', '24');
          projLabel.setAttribute('font-family', 'Architects Daughter, ui-monospace, system-ui');
          projLabel.textContent = project.title;
          group.appendChild(projLabel);

          // 透明点击区域
          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          hit.setAttribute('cx', String(point.x));
          hit.setAttribute('cy', String(point.y));
          hit.setAttribute('r', String(PROJECT_RADIUS + 10));
          hit.setAttribute('fill', 'transparent');
          hit.setAttribute('data-project-id', project.id);
          hit.style.pointerEvents = 'all';
          hit.style.cursor = 'grab';
          group.appendChild(hit);

          // Actions / Focus dots
          const actionPoints = getActionPoints(project.id, point);
          actionPoints.forEach((p) => {
            const line = rc.line(point.x, point.y, p.x, p.y, {
              stroke: '#8b8b8b',
              strokeWidth: 1.4,
              roughness: 1.2,
              bowing: 0.6,
            });
            group.appendChild(line);
            const dot = rc.circle(p.x, p.y, ACTION_RADIUS * 2, {
              stroke: '#4b5563',
              strokeWidth: 1.8,
              fill: '#fef08a',
              fillStyle: 'hachure',
              hachureGap: 4,
              roughness: 1.4,
            });
            group.appendChild(dot);
          });

          // Detail box + connector
          if (isSelected) {
            const boxX = point.x + PROJECT_RADIUS + 60;
            const boxY = point.y - DETAIL_MIN_HEIGHT * 0.45;
            const boxWidth = DETAIL_WIDTH;
            const boxHeight = Math.max(
              DETAIL_MIN_HEIGHT,
              110 + focuses.filter((f) => f.projectId === project.id).length * 16
            );

            const connector = renderArrow(rc, point.x + PROJECT_RADIUS, point.y, boxX, point.y, {
              stroke: '#4a4a4a',
              strokeWidth: 2.4,
              roughness: 1.1,
              bowing: 0.4,
              endArrowhead: 'arrow',
              arrowSize: 9,
              useExcalidrawStyle: false,
            });
            group.appendChild(connector);

            const detailBox = rc.rectangle(boxX, boxY, boxWidth, boxHeight, {
              stroke: '#2f2f2f',
              strokeWidth: 2.4,
              fill: '#ffffff',
              fillStyle: 'solid',
              roughness: 1.5,
              bowing: 1.2,
            });
            group.appendChild(detailBox);

            const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            fo.setAttribute('x', String(boxX));
            fo.setAttribute('y', String(boxY));
            fo.setAttribute('width', String(boxWidth));
            fo.setAttribute('height', String(boxHeight));
            fo.setAttribute('pointer-events', 'none');

            const wrapper = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            wrapper.style.cssText =
              'width:100%;height:100%;padding:14px 16px;box-sizing:border-box;font-family:Inter, system-ui;pointer-events:none;color:#18181b;';

            const titleInput = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
            titleInput.type = 'text';
            titleInput.value = project.title;
            titleInput.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:6px;width:100%;border:none;outline:none;background:transparent;';
            titleInput.oninput = (e) => {
              updateProject(project.id, { title: (e.target as HTMLInputElement).value });
            };
            wrapper.appendChild(titleInput);

            const desc = document.createElementNS('http://www.w3.org/1999/xhtml', 'textarea');
            desc.value = project.description || '';
            desc.placeholder = 'Add a description...';
            desc.style.cssText = 'font-size:12px;color:#3f3f46;line-height:1.5;margin-bottom:8px;width:100%;border:none;outline:none;background:transparent;resize:none;';
            desc.oninput = (e) => {
              updateProject(project.id, { description: (e.target as HTMLTextAreaElement).value });
            };
            wrapper.appendChild(desc);

            const projectMilestones = milestones.filter((m) => m.projectId === project.id);
            if (projectMilestones.length > 0) {
              const block = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              block.style.cssText = 'margin-top:8px;';
              const header = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              header.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
              const done = projectMilestones.filter((m) => m.isDone).length;
              header.textContent = `Milestones ${done}/${projectMilestones.length}`;
              block.appendChild(header);
              projectMilestones.slice(0, 3).forEach((m) => {
                const row = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:#27272a;';
                const dot = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
                dot.style.cssText = `width:6px;height:6px;border-radius:50%;display:inline-block;background:${m.isDone ? '#22c55e' : '#a1a1aa'};`;
                row.appendChild(dot);
                const text = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
                text.textContent = m.title;
                if (m.isDone) text.style.textDecoration = 'line-through';
                row.appendChild(text);
                block.appendChild(row);
              });
              wrapper.appendChild(block);
            }

            const projectFocuses = focuses.filter((f) => f.projectId === project.id);
            if (projectFocuses.length > 0) {
              const block = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              block.style.cssText = 'margin-top:10px;';
              const header = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              header.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
              const done = projectFocuses.filter((f) => f.status === FocusStatus.Done).length;
              header.textContent = `Actions ${done}/${projectFocuses.length}`;
              block.appendChild(header);
              projectFocuses.slice(0, 4).forEach((f) => {
                const row = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:#27272a;';
                const dot = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
                dot.style.cssText = `width:6px;height:6px;border-radius:50%;display:inline-block;background:${
                  f.status === FocusStatus.Done ? '#22c55e' : '#3b82f6'
                };`;
                row.appendChild(dot);
                const text = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
                text.textContent = f.title;
                if (f.status === FocusStatus.Done) text.style.textDecoration = 'line-through';
                row.appendChild(text);
                block.appendChild(row);
              });
              wrapper.appendChild(block);
            }

            fo.appendChild(wrapper);
            group.appendChild(fo);
          }
        });
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Path view render error', err);
      }
    }
  }, [layout, pathPoints, focuses, milestones, selectedProjectId]);

  const getViewBox = () => {
    const scaledWidth = CANVAS_WIDTH / viewport.zoom;
    const scaledHeight = CANVAS_HEIGHT / viewport.zoom;
    return `${viewport.x} ${viewport.y} ${scaledWidth} ${scaledHeight}`;
  };

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      return {
        x: viewBox.x + (clientX - rect.left) * scaleX,
        y: viewBox.y + (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentViewBox = svg.viewBox.baseVal;
      const worldX = currentViewBox.x + (mouseX / rect.width) * currentViewBox.width;
      const worldY = currentViewBox.y + (mouseY / rect.height) * currentViewBox.height;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clamp(viewport.zoom * delta, VIEWBOX_MIN_ZOOM, VIEWBOX_MAX_ZOOM);
      const scaledWidth = CANVAS_WIDTH / newZoom;
      const scaledHeight = CANVAS_HEIGHT / newZoom;
      const newX = worldX - (mouseX / rect.width) * scaledWidth;
      const newY = worldY - (mouseY / rect.height) * scaledHeight;
      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport.zoom]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchorId = target.getAttribute('data-anchor-id');
    if (anchorId) {
      setDraggingAnchorId(anchorId);
      panStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    const phaseId = target.getAttribute('data-phase-id');
    const projectId = target.getAttribute('data-project-id');
    if (phaseId) {
      setDraggingPhaseId(phaseId);
      panStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    if (projectId) {
      setDraggingProjectId(projectId);
      panStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    if (e.button === 1 || (e.button === 0 && (e.metaKey || e.altKey || e.shiftKey))) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const world = screenToWorld(e.clientX, e.clientY);

      if (draggingAnchorId) {
        setAnchorOverrides((prev) => ({
          ...prev,
          [draggingAnchorId]: { x: world.x, y: world.y },
        }));
        return;
      }

      if (draggingPhaseId) {
        setPhaseOverrides((prev) => ({
          ...prev,
          [draggingPhaseId]: { x: world.x, y: world.y },
        }));
        return;
      }

      if (draggingProjectId) {
        setProjectOverrides((prev) => ({
          ...prev,
          [draggingProjectId]: { y: world.y },
        }));
        return;
      }

      if (isPanning) {
        const dx = (e.clientX - panStart.current.x) / viewport.zoom;
        const dy = (e.clientY - panStart.current.y) / viewport.zoom;
        setViewport((prev) => ({
          ...prev,
          x: prev.x - dx,
          y: prev.y - dy,
        }));
        panStart.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isPanning, viewport.zoom, draggingAnchorId, draggingPhaseId, draggingProjectId, screenToWorld]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingAnchorId(null);
    setDraggingPhaseId(null);
    setDraggingProjectId(null);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPhaseRef.current) {
          deletePhase(selectedPhaseRef.current);
          setSelectedPhaseId(null);
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      svg.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKey);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp, deletePhase]);

  const createPhase = () => {
    const lastPos = phases.length ? Math.max(...phases.map(p => p.position)) : 0;
    const nextPos = Math.min(1, lastPos + 0.2);
    const color = PHASE_COLORS[phases.length % PHASE_COLORS.length];
    addPhase({
      title: 'New Phase',
      color,
      position: nextPos,
    });
  };

  const createProject = () => {
    setIsAddingProject(true);
    setIsAddingPhase(false);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-zinc-50 to-zinc-100 overflow-hidden relative">
      {/* Add controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button
          onClick={createPhase}
          className="px-3 py-1.5 bg-white border border-zinc-300 rounded-lg shadow-sm text-sm text-zinc-700 hover:bg-zinc-50"
        >
          + Phase
        </button>
        <button
          onClick={createProject}
          className="px-3 py-1.5 bg-white border border-zinc-300 rounded-lg shadow-sm text-sm text-zinc-700 hover:bg-zinc-50"
        >
          {isAddingProject ? 'Click a Phase' : '+ Project'}
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={getViewBox()}
        className="absolute inset-0"
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
