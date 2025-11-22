# 设计系统更新说明

## 概述

已成功将应用迁移到使用统一的设计系统，包含字体、配色、间距、阴影和圆角规范。

---

## 📝 更新内容

### 1. **字体系统** ✓

#### 主字体更新
- **之前**: Inter
- **现在**: Architects Daughter (手写风格字体)

#### 字体家族
```css
--font-sans: 'Architects Daughter', sans-serif;
--font-serif: "Times New Roman", Times, serif;
--font-mono: "Courier New", Courier, monospace;
```

#### 字母间距
```css
--tracking-tighter: calc(0.5px - 0.05em)
--tracking-tight: calc(0.5px - 0.025em)
--tracking-normal: 0.5px
--tracking-wide: calc(0.5px + 0.025em)
--tracking-wider: calc(0.5px + 0.05em)
--tracking-widest: calc(0.5px + 0.1em)
```

---

### 2. **边框圆角（Border Radius）** ✓

#### 圆角系统
```css
--radius: 0.625rem (10px 基准值)
--radius-sm: calc(--radius - 4px)  // 6px
--radius-md: calc(--radius - 2px)  // 8px
--radius-lg: var(--radius)         // 10px
--radius-xl: calc(--radius + 4px)  // 14px
```

#### Tailwind 类名对应
- `rounded-sm` → 6px
- `rounded-md` → 8px
- `rounded-lg` → 10px
- `rounded-xl` → 14px
- `rounded-full` → 9999px (不变)

---

### 3. **阴影系统（Box Shadow）** ✓

#### 阴影定义
```css
shadow-2xs: 1px 4px 5px 0px hsl(0 0% 0% / 0.01)
shadow-xs:  1px 4px 5px 0px hsl(0 0% 0% / 0.01)
shadow-sm:  1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03)
shadow:     1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03)
shadow-md:  1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 2px 4px -1px hsl(0 0% 0% / 0.03)
shadow-lg:  1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 4px 6px -1px hsl(0 0% 0% / 0.03)
shadow-xl:  1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 8px 10px -1px hsl(0 0% 0% / 0.03)
shadow-2xl: 1px 4px 5px 0px hsl(0 0% 0% / 0.07)
```

#### 特点
- 轻量阴影设计（透明度 0.01-0.07）
- 统一的偏移量（1px x, 4px y）
- 柔和的视觉效果

---

### 4. **配色系统（Color System）** ✓

#### 使用 OKLCH 色彩空间

OKLCH 优势：
- 感知上更均匀的色彩
- 更好的色彩过渡
- 现代浏览器支持

#### 核心颜色
```css
--background: oklch(0.9821 0 0)     /* 接近白色 */
--foreground: oklch(0.3485 0 0)     /* 深灰色文字 */
--primary: oklch(0.4891 0 0)        /* 主要色 */
--secondary: oklch(0.9006 0 0)      /* 次要色 */
--muted: oklch(0.9158 0 0)          /* 柔和色 */
--border: oklch(0.5538 0.0025 17.2320)
```

#### 侧边栏颜色
```css
--sidebar: oklch(0.9551 0 0)
--sidebar-foreground: oklch(0.3485 0 0)
--sidebar-border: oklch(0.8078 0 0)
```

---

### 5. **间距系统（Spacing）** ✓

#### 基础间距
```css
--spacing: 0.25rem  /* 4px */
```

#### 应用方式
- 使用 Tailwind 默认间距系统（基于 4px）
- 配合设计系统间距变量

---

### 6. **滚动条样式** ✓

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: var(--muted);
  border-radius: calc(var(--radius) / 2);
}
```

- 细窄滚动条（6px）
- 使用设计系统颜色
- 圆角与系统保持一致

---

### 7. **焦点样式** ✓

```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

- 使用设计系统 ring 颜色
- 2px 外边距，提升可访问性

---

## 📁 更新的文件

### 新建文件
1. **index.css** - 设计系统 CSS 变量定义
   - 完整的 CSS 变量定义
   - 明暗主题支持
   - Tailwind 工具类覆盖

### 修改文件
1. **index.html**
   - 更新字体为 Architects Daughter
   - 添加设计系统 Tailwind 配置
   - 自定义 borderRadius
   - 自定义 letterSpacing
   - 自定义 boxShadow

---

## 🎨 设计系统视觉效果

### 字体特点
**Architects Daughter** 是一款：
- 手写风格字体
- 友好、温暖的视觉感受
- 适合创意、个人项目管理应用
- 增强视觉辨识度

### 阴影特点
- **轻量设计**: 透明度极低（1%-7%）
- **方向一致**: 统一的 x:1px, y:4px 偏移
- **层级清晰**: 从 2xs 到 2xl 逐步加深
- **柔和过渡**: 不突兀，不生硬

### 圆角特点
- **统一基准**: 10px 为基础
- **渐进式**: ±2px/4px 的差异
- **现代感**: 适中的圆角大小
- **一致性**: 所有元素使用同一套规则

---

## 🔧 如何使用

### 在 React 组件中使用

#### 方式1: 使用 Tailwind 类名
```tsx
<div className="rounded-lg shadow-md">
  {/* 自动应用设计系统的圆角和阴影 */}
</div>
```

#### 方式2: 使用 CSS 变量
```tsx
<div style={{
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  fontFamily: 'var(--font-sans)'
}}>
  {/* 直接使用 CSS 变量 */}
</div>
```

#### 方式3: 在 CSS 文件中
```css
.custom-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-family: var(--font-sans);
  letter-spacing: var(--tracking-normal);
}
```

---

## 📊 对比表

| 属性 | 之前 | 现在 |
|------|------|------|
| 主字体 | Inter | Architects Daughter |
| 字母间距 | 默认 | 0.5px (可配置) |
| 基础圆角 | 8px (0.5rem) | 10px (0.625rem) |
| 阴影透明度 | 标准 | 超轻量 (1%-7%) |
| 阴影方向 | 默认 | 统一 (1px, 4px) |
| 颜色空间 | RGB | OKLCH |

---

## 🌓 深色模式支持

设计系统已包含完整的深色模式配置：

```css
.dark {
  --background: oklch(0.2891 0 0);
  --foreground: oklch(0.8945 0 0);
  /* ... 完整的深色模式变量 */
}
```

### 启用深色模式（未来实现）
```tsx
<html className="dark">
  {/* 应用自动使用深色模式颜色 */}
</html>
```

---

## ✅ 验证清单

应用已在 http://localhost:3000/ 运行，建议验证：

### 视觉检查
- [ ] 字体已更新为 Architects Daughter
- [ ] 所有圆角统一且符合设计系统
- [ ] 阴影效果轻量柔和
- [ ] 文字间距适中
- [ ] 滚动条样式统一

### 功能检查
- [ ] 所有交互功能正常
- [ ] 焦点样式正确显示
- [ ] 响应式布局未受影响
- [ ] 性能无明显下降

---

## 🚀 后续优化建议

1. **深色模式实现**
   - 添加主题切换功能
   - 使用已定义的深色模式变量

2. **字体优化**
   - 考虑字体子集加载
   - 优化首屏加载性能

3. **动效系统**
   - 定义统一的过渡时间
   - 统一的缓动函数

4. **响应式排版**
   - 基于视口的字体大小
   - 流体排版系统

---

## 📚 参考资源

- **OKLCH 色彩**: https://oklch.com/
- **Architects Daughter 字体**: Google Fonts
- **设计系统**: 基于 Shadcn/UI 设计规范

---

*更新时间: 2025-11-22*
*设计系统版本: v1.0*
