# 字体配置说明

## 当前使用的字体

- **Architects Daughter** - 手写风格字体

## 字体文件位置

字体文件已下载到：`public/fonts/ArchitectsDaughter-Regular.ttf`

## 配置说明

### 1. CSS 配置

字体已在 `index.css` 中通过 `@font-face` 定义：

```css
@font-face {
  font-family: 'Architects Daughter';
  src: url('/fonts/ArchitectsDaughter-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 2. Vite 打包

Vite 会自动将 `public/` 目录下的文件复制到 `dist/` 目录，字体文件会被包含在构建产物中。

### 3. Tauri 打包

Tauri 会打包 `dist/` 目录下的所有文件，包括字体文件，所以字体会被包含在最终的应用安装包中。

## 验证字体是否加载

1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 刷新页面
4. 查找 `ArchitectsDaughter-Regular.ttf` 文件，应该返回 200 状态码

## 重新下载字体

如果需要重新下载字体，运行：

```bash
cd tools
./download-fonts.sh
```

## 注意事项

- 字体文件大小约 43KB
- 字体文件会被包含在应用安装包中
- 应用可以在离线环境下正常显示字体


