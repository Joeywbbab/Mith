# 图标生成和使用指南

## 快速开始

### 方法 1：使用浏览器工具（推荐）

1. **生成图标文件**
   - 在浏览器中打开 `tools/generate-icon.html`
   - 点击"生成并保存到 icons 文件夹"按钮
   - 如果浏览器支持，会自动保存到 `src-tauri/icons/` 目录
   - 如果不支持，会回退到下载方式，手动将文件复制到 `src-tauri/icons/`

2. **生成 macOS .icns 文件**（仅 macOS）
   ```bash
   cd tools
   ./generate-icns.sh
   ```

3. **重新构建应用**
   ```bash
   npm run tauri:build
   ```

### 方法 2：手动生成

1. **生成 PNG 文件**
   - 在浏览器中打开 `tools/generate-icon.html`
   - 点击"生成所有尺寸并下载"
   - 将下载的文件复制到 `src-tauri/icons/`：
     - `32x32.png`
     - `128x128.png`
     - `128x128@2x.png`
     - `icon.png`

2. **生成 .icns 文件**（macOS）
   ```bash
   cd tools
   ./generate-icns.sh
   ```

3. **重新构建应用**
   ```bash
   npm run tauri:build
   ```

## 文件说明

### PNG 文件（必需）
- `32x32.png` - 小图标（32x32 像素）
- `128x128.png` - 中等图标（128x128 像素）
- `128x128@2x.png` - Retina 图标（256x256 像素）
- `icon.png` - 主图标（512x512 像素）

### macOS 专用文件
- `icon.icns` - macOS 应用图标（由 `generate-icns.sh` 生成）

### Windows 专用文件（可选）
- `icon.ico` - Windows 应用图标（可以使用在线工具从 PNG 转换）

## 图标设计

图标采用深蓝色背景（`#1e293b`）和橙色山脉线条（`#ff6b35`）的设计：
- 深色背景：渐变效果，从 `#0f172a` 到 `#1e293b` 再到 `#0f172a`
- 橙色线条：带发光效果，形成两个山峰的形状
- 圆角矩形：24px 圆角

## 故障排除

### 图标没有更新
1. 确保文件已正确复制到 `src-tauri/icons/` 目录
2. 检查 `src-tauri/tauri.conf.json` 中的图标配置
3. 清理构建缓存：`rm -rf src-tauri/target`
4. 重新构建：`npm run tauri:build`

### .icns 文件生成失败
- 确保在 macOS 系统上运行
- 确保 `icon.png` 文件存在
- 检查 `iconutil` 命令是否可用：`which iconutil`

### 侧边栏图标显示异常
- 侧边栏使用 SVG 组件，不需要 PNG 文件
- 如果显示异常，检查 `components/Layout/MithIcon.tsx` 组件

## 配置文件

图标配置在 `src-tauri/tauri.conf.json`：

```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```


