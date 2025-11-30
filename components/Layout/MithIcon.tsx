import React, { useMemo } from 'react';

interface MithIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'minimal'; // default 有背景，minimal 只有线条
}

/**
 * Mith 应用图标组件
 * 深蓝色背景上的橙色山脉线条
 */
export const MithIcon: React.FC<MithIconProps> = ({ 
  size = 32, 
  className = '',
  variant = 'default' 
}) => {
  const viewBox = variant === 'default' ? '0 0 120 120' : '0 0 100 100';
  const padding = variant === 'default' ? 10 : 0;
  
  // 生成唯一的 filter ID，避免多个实例冲突
  const filterId = useMemo(() => `mith-glow-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 定义渐变和滤镜 */}
      <defs>
        {/* 深色背景渐变（带纹理效果） */}
        <linearGradient id={`bg-gradient-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
          <stop offset="50%" stopColor="#1e293b" stopOpacity="1" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </linearGradient>
        
        {/* 发光效果滤镜 */}
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* 纹理效果（模拟水彩/烟雾） */}
        <filter id={`texture-${filterId}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
        </filter>
      </defs>
      
      {/* 深色背景（圆角矩形，带渐变） */}
      {variant === 'default' && (
        <rect
          x="0"
          y="0"
          width="120"
          height="120"
          rx="24"
          fill={`url(#bg-gradient-${filterId})`}
          opacity="0.95"
        />
      )}
      
      {/* 橙色山脉线条 */}
      <g transform={`translate(${padding}, ${padding})`}>
        {/* 主山脉线条 - 连续的单一线条，形成两个明显的峰 */}
        {/* 左侧更高更宽的主峰，右侧稍小更尖的次峰 */}
        <path
          d="M 12 78 
             Q 18 65, 25 58
             Q 32 48, 38 42
             Q 42 38, 45 40
             Q 48 42, 50 45
             Q 52 48, 55 50
             Q 58 52, 62 54
             Q 66 56, 70 58
             Q 74 60, 78 62"
          stroke="#ff6b35"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${filterId})`}
          opacity="1"
        />
        
        {/* 底部较短的曲线（代表低峰或前景元素） */}
        <path
          d="M 76 62
             Q 80 60, 84 62
             Q 88 64, 90 66"
          stroke="#ff6b35"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${filterId})`}
          opacity="0.95"
        />
      </g>
    </svg>
  );
};

/**
 * 简化版图标（只有线条，无背景）
 */
export const MithIconMinimal: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => {
  return (
    <MithIcon size={size} className={className} variant="minimal" />
  );
};

