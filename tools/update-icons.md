# 更新应用图标说明

## 问题
- 侧边栏图标显示异常（已修复：改用 SVG 组件）
- Tauri 应用图标显示默认图标（需要重新生成图标文件）

## 解决步骤

### 1. 生成图标文件

1. 在浏览器中打开 `tools/generate-icon.html`
2. 点击"生成所有尺寸"按钮
3. 下载的文件会包括：
   - `32x32.png`
   - `128x128.png`
   - `128x128@2x.png` (256x256)
   - `icon.png` (512x512)
   - `mith-icon.png` (32x32, 用于侧边栏，可选)

### 2. 复制到 Tauri 目录

将下载的文件复制到 `src-tauri/icons/` 目录：

```bash
# 复制 PNG 文件
cp 32x32.png src-tauri/icons/
cp 128x128.png src-tauri/icons/
cp 128x128@2x.png src-tauri/icons/128x128@2x.png
cp icon.png src-tauri/icons/icon.png

# 如果需要侧边栏图标（可选）
cp mith-icon.png public/mith-icon.png
```

### 3. 生成 macOS .icns 文件

macOS 需要 `.icns` 格式的图标：

```bash
# 方法 1: 使用 iconutil（macOS 自带）
# 首先创建一个 iconset 目录
mkdir -p src-tauri/icons/Mith.iconset

# 复制不同尺寸的图标到 iconset
cp src-tauri/icons/icon.png src-tauri/icons/Mith.iconset/icon_512x512.png
cp src-tauri/icons/128x128@2x.png src-tauri/icons/Mith.iconset/icon_256x256.png
cp src-tauri/icons/128x128.png src-tauri/icons/Mith.iconset/icon_128x128.png
cp src-tauri/icons/32x32.png src-tauri/icons/Mith.iconset/icon_32x32.png

# 生成 .icns 文件
iconutil -c icns src-tauri/icons/Mith.iconset -o src-tauri/icons/icon.icns

# 清理临时目录
rm -rf src-tauri/icons/Mith.iconset
```

### 4. 验证配置

确保 `src-tauri/tauri.conf.json` 中的图标配置正确：

```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```

### 5. 重新构建应用

```bash
npm run tauri:build
```

## 注意事项

- 图标文件必须是 PNG 格式
- macOS 需要 `.icns` 文件
- Windows 需要 `.ico` 文件（可以使用在线工具转换）
- 确保图标文件路径正确


