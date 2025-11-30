# 字体下载说明

## 当前使用的字体

- **Architects Daughter** - 手写风格字体

## 下载方法

### 方法 1：使用脚本（推荐）

```bash
cd tools
chmod +x download-fonts.sh
./download-fonts.sh
```

### 方法 2：手动下载

1. 访问 [Google Fonts - Architects Daughter](https://fonts.google.com/specimen/Architects+Daughter)
2. 点击 "Download family" 下载字体包
3. 解压后找到 `ArchitectsDaughter-Regular.ttf` 文件
4. 将文件复制到 `public/fonts/ArchitectsDaughter-Regular.ttf`

## 字体文件位置

字体文件应放在：`public/fonts/ArchitectsDaughter-Regular.ttf`

## 注意事项

- 确保字体文件会被打包到 Tauri 应用中
- 字体文件大小约 50-100KB
- 如果下载失败，脚本会提示手动下载方法


