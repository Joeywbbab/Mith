#!/bin/bash

# 更新 Tauri 应用图标脚本
# 使用方法：在浏览器中生成图标后，运行此脚本

ICON_DIR="../src-tauri/icons"
ICONSET_DIR="../src-tauri/icons/Mith.iconset"

echo "🔄 更新 Tauri 应用图标..."

# 检查图标文件是否存在
if [ ! -f "icon.png" ]; then
    echo "❌ 错误: 找不到 icon.png 文件"
    echo "   请先在浏览器中打开 generate-icon.html 并生成图标文件"
    exit 1
fi

# 创建 iconset 目录
mkdir -p "$ICONSET_DIR"

# 复制不同尺寸的图标到 iconset（macOS 需要）
echo "📦 准备图标文件..."

# 检查文件是否存在，如果不存在则使用 icon.png 缩放
if [ -f "32x32.png" ]; then
    cp "32x32.png" "$ICON_DIR/32x32.png"
    cp "32x32.png" "$ICONSET_DIR/icon_16x16.png"
    cp "32x32.png" "$ICONSET_DIR/icon_16x16@2x.png"
    cp "32x32.png" "$ICONSET_DIR/icon_32x32.png"
else
    echo "⚠️  32x32.png 不存在，使用 icon.png"
fi

if [ -f "128x128.png" ]; then
    cp "128x128.png" "$ICON_DIR/128x128.png"
    cp "128x128.png" "$ICONSET_DIR/icon_128x128.png"
else
    echo "⚠️  128x128.png 不存在，使用 icon.png"
fi

if [ -f "128x128@2x.png" ]; then
    cp "128x128@2x.png" "$ICON_DIR/128x128@2x.png"
    cp "128x128@2x.png" "$ICONSET_DIR/icon_256x256.png"
    cp "128x128@2x.png" "$ICONSET_DIR/icon_256x256@2x.png"
    cp "128x128@2x.png" "$ICONSET_DIR/icon_512x512.png"
    cp "128x128@2x.png" "$ICONSET_DIR/icon_512x512@2x.png"
else
    echo "⚠️  128x128@2x.png 不存在，使用 icon.png"
fi

if [ -f "icon.png" ]; then
    cp "icon.png" "$ICON_DIR/icon.png"
    cp "icon.png" "$ICONSET_DIR/icon_512x512@2x.png"
fi

# 生成 macOS .icns 文件
if command -v iconutil &> /dev/null; then
    echo "🍎 生成 macOS .icns 文件..."
    iconutil -c icns "$ICONSET_DIR" -o "$ICON_DIR/icon.icns"
    if [ $? -eq 0 ]; then
        echo "✅ icon.icns 生成成功"
    else
        echo "❌ icon.icns 生成失败"
    fi
else
    echo "⚠️  iconutil 未找到，跳过 .icns 生成（macOS 需要）"
fi

# 清理临时目录
rm -rf "$ICONSET_DIR"

echo ""
echo "✅ 图标更新完成！"
echo ""
echo "📝 下一步："
echo "   1. 运行 'npm run tauri:build' 重新构建应用"
echo "   2. 如果图标仍未更新，请检查 src-tauri/tauri.conf.json 中的图标配置"


