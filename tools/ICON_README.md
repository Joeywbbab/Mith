# Mith 图标使用说明

## 图标设计

Mith 应用图标采用深蓝色背景（`#1e293b`）和橙色山脉线条（`#ff6b35`）的设计，带有柔和的发光效果。

## 生成应用图标文件

### 方法 1：使用 HTML 工具（推荐）

1. 在浏览器中打开 `tools/generate-icon.html`
2. 点击"生成所有尺寸"按钮
3. 将下载的文件复制到 `src-tauri/icons/` 目录：
   - `32x32.png` → `src-tauri/icons/32x32.png`
   - `128x128.png` → `src-tauri/icons/128x128.png`
   - `128x128@2x.png` (256x256) → `src-tauri/icons/128x128@2x.png`
   - `icon.png` (512x512) → `src-tauri/icons/icon.png`

### 方法 2：手动导出

如果需要其他格式（如 `.icns` 或 `.ico`），可以使用以下工具：

- **macOS**: 使用 `iconutil` 或在线工具转换 PNG 为 `.icns`
- **Windows**: 使用在线工具转换 PNG 为 `.ico`

## 在应用中使用

图标组件已经集成到应用中：

- **Sidebar 图标**: 自动使用 `MithIcon` 组件
- **应用图标**: 需要替换 `src-tauri/icons/` 目录下的文件

## 组件使用示例

```tsx
import { MithIcon, MithIconMinimal } from './components/Layout/MithIcon';

// 带背景的图标（用于应用图标）
<MithIcon size={32} variant="default" />

// 只有线条的图标（用于 UI 元素）
<MithIconMinimal size={24} />
```

## 图标规格

- **应用图标**: 512x512px（用于 macOS/Windows）
- **小图标**: 32x32px, 128x128px, 256x256px（用于不同场景）


