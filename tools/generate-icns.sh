#!/bin/bash

# 生成 macOS .icns 图标文件
# 使用方法：在生成 PNG 图标后运行此脚本

ICON_DIR="../src-tauri/icons"
ICONSET_DIR="../src-tauri/icons/Mith.iconset"

echo "🍎 生成 macOS .icns 图标文件..."

# 检查必要的文件是否存在
if [ ! -f "$ICON_DIR/icon.png" ]; then
    echo "❌ 错误: 找不到 $ICON_DIR/icon.png"
    echo "   请先运行 generate-icon.html 生成图标文件"
    exit 1
fi

# 创建 iconset 目录
echo "📦 准备图标文件..."
mkdir -p "$ICONSET_DIR"

# 复制不同尺寸的图标到 iconset
# macOS 需要多个尺寸的图标
if [ -f "$ICON_DIR/32x32.png" ]; then
    cp "$ICON_DIR/32x32.png" "$ICONSET_DIR/icon_16x16.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET_DIR/icon_16x16@2x.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET_DIR/icon_32x32.png"
else
    echo "⚠️  32x32.png 不存在，使用 icon.png 缩放"
    sips -z 16 16 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
    sips -z 32 32 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
    sips -z 32 32 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
fi

if [ -f "$ICON_DIR/128x128.png" ]; then
    cp "$ICON_DIR/128x128.png" "$ICONSET_DIR/icon_128x128.png"
else
    sips -z 128 128 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
fi

if [ -f "$ICON_DIR/128x128@2x.png" ]; then
    cp "$ICON_DIR/128x128@2x.png" "$ICONSET_DIR/icon_256x256.png"
    cp "$ICON_DIR/128x128@2x.png" "$ICONSET_DIR/icon_256x256@2x.png"
    cp "$ICON_DIR/128x128@2x.png" "$ICONSET_DIR/icon_512x512.png"
else
    sips -z 256 256 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
    sips -z 512 512 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
    cp "$ICONSET_DIR/icon_512x512.png" "$ICONSET_DIR/icon_256x256@2x.png"
fi

# 生成 1024x1024 版本（用于 icon_512x512@2x）
sips -z 1024 1024 "$ICON_DIR/icon.png" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1

# 生成 .icns 文件
if command -v iconutil &> /dev/null; then
    echo "🔄 生成 .icns 文件..."
    iconutil -c icns "$ICONSET_DIR" -o "$ICON_DIR/icon.icns"
    if [ $? -eq 0 ]; then
        echo "✅ icon.icns 生成成功！"
        echo "   文件位置: $ICON_DIR/icon.icns"
    else
        echo "❌ icon.icns 生成失败"
        exit 1
    fi
else
    echo "❌ 错误: 找不到 iconutil 命令"
    echo "   请确保您在 macOS 系统上运行此脚本"
    exit 1
fi

# 清理临时目录
rm -rf "$ICONSET_DIR"

echo ""
echo "✅ 完成！所有图标文件已准备就绪"
echo ""
echo "📝 下一步："
echo "   运行 'npm run tauri:build' 重新构建应用"


