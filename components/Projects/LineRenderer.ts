/**
 * 线条渲染工具
 * 提供两种渲染方式：
 * 1. 使用 rough.js（默认，轻量级）
 * 2. 使用 Excalidraw 渲染引擎（可选，更精确）
 */

import rough from 'roughjs';
import type { RoughSVG } from 'roughjs/bin/svg';

export interface LineOptions {
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  seed?: number;
  // Excalidraw 风格选项
  useExcalidrawStyle?: boolean;
}

export interface ArrowOptions extends LineOptions {
  startArrowhead?: 'arrow' | 'dot' | null;
  endArrowhead?: 'arrow' | 'dot' | null;
  arrowSize?: number;
}

/**
 * 使用 rough.js 渲染线条
 */
export function renderLineWithRough(
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions = {}
): SVGElement {
  const {
    stroke = '#adb5bd',
    strokeWidth = 1.5,
    roughness = 1.0,
    bowing = 0.8,
    seed,
  } = options;

  const line = rc.line(x1, y1, x2, y2, {
    stroke,
    strokeWidth,
    roughness,
    bowing,
    seed,
  });

  return line;
}

/**
 * 使用 rough.js 渲染箭头
 */
export function renderArrowWithRough(
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: ArrowOptions = {}
): SVGElement {
  const {
    stroke = '#495057',
    strokeWidth = 2,
    roughness = 1.2,
    bowing = 0.5,
    endArrowhead = 'arrow',
    arrowSize = 10,
    seed,
  } = options;

  // 计算箭头方向
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // 绘制主线
  const line = rc.line(x1, y1, x2, y2, {
    stroke,
    strokeWidth,
    roughness,
    bowing,
    seed,
  });

  // 如果需要箭头，绘制箭头头部
  if (endArrowhead === 'arrow' && length > arrowSize) {
    const arrowAngle = Math.PI / 6; // 30度
    const arrowLength = arrowSize;
    
    // 箭头左侧点
    const arrowLeftX = x2 - arrowLength * Math.cos(angle - arrowAngle);
    const arrowLeftY = y2 - arrowLength * Math.sin(angle - arrowAngle);
    
    // 箭头右侧点
    const arrowRightX = x2 - arrowLength * Math.cos(angle + arrowAngle);
    const arrowRightY = y2 - arrowLength * Math.sin(angle + arrowAngle);

    // 绘制箭头头部
    const arrowPath = `M ${x2} ${y2} L ${arrowLeftX} ${arrowLeftY} M ${x2} ${y2} L ${arrowRightX} ${arrowRightY}`;
    const arrowHead = rc.path(arrowPath, {
      stroke,
      strokeWidth: strokeWidth * 1.2,
      roughness: roughness * 0.8,
      bowing: 0.3,
      seed: seed ? seed + 1 : undefined,
    });

    // 创建组来包含线和箭头
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(line);
    group.appendChild(arrowHead);
    return group;
  }

  return line;
}

/**
 * 使用 Excalidraw 渲染引擎渲染线条（如果可用）
 * 这是一个可选的增强功能
 */
export function renderLineWithExcalidraw(
  svgElement: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions = {}
): SVGElement | null {
  // 检查是否可以使用 Excalidraw 渲染
  // 这里需要动态导入 Excalidraw 的渲染函数
  // 由于 Excalidraw 的渲染 API 比较复杂，这里提供一个占位实现
  // 实际使用时需要根据 Excalidraw 的 API 进行调整
  
  try {
    // 尝试使用 Excalidraw 的渲染引擎
    // 注意：这需要 Excalidraw 的 renderStaticScene 或类似 API
    // 目前 Excalidraw 没有提供独立的渲染函数，所以这里返回 null
    // 使用 rough.js 作为后备方案
    return null;
  } catch (error) {
    console.warn('Excalidraw renderer not available, falling back to rough.js');
    return null;
  }
}

/**
 * 智能线条渲染器
 * 自动选择最佳的渲染方式
 */
export function renderLine(
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions = {}
): SVGElement {
  if (options.useExcalidrawStyle) {
    // 使用 Excalidraw 风格的参数
    return renderLineWithRough(rc, x1, y1, x2, y2, {
      ...options,
      roughness: options.roughness ?? 1.2,
      bowing: options.bowing ?? 1.0,
    });
  }
  
  return renderLineWithRough(rc, x1, y1, x2, y2, options);
}

/**
 * 智能箭头渲染器
 */
export function renderArrow(
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: ArrowOptions = {}
): SVGElement {
  if (options.useExcalidrawStyle) {
    // 使用 Excalidraw 风格的参数
    return renderArrowWithRough(rc, x1, y1, x2, y2, {
      ...options,
      roughness: options.roughness ?? 1.2,
      bowing: options.bowing ?? 0.8,
    });
  }
  
  return renderArrowWithRough(rc, x1, y1, x2, y2, options);
}

/**
 * 创建平滑的贝塞尔曲线连接线
 */
export function renderSmoothConnector(
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions & { curvature?: number } = {}
): SVGElement {
  const { curvature = 0.3, ...lineOptions } = options;
  
  // 计算控制点，创建平滑的曲线
  const dx = x2 - x1;
  const dy = y2 - y1;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // 控制点偏移（垂直于连接线方向）
  const perpX = -dy * curvature;
  const perpY = dx * curvature;
  
  const cp1X = midX + perpX;
  const cp1Y = midY + perpY;
  
  // 使用二次贝塞尔曲线
  const pathData = `M ${x1} ${y1} Q ${cp1X} ${cp1Y} ${x2} ${y2}`;
  
  return rc.path(pathData, {
    stroke: lineOptions.stroke ?? '#adb5bd',
    strokeWidth: lineOptions.strokeWidth ?? 1.5,
    roughness: lineOptions.roughness ?? 1.0,
    bowing: lineOptions.bowing ?? 0.8,
    seed: lineOptions.seed,
  });
}


