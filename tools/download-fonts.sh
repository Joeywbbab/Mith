#!/bin/bash

# 下载 Architects Daughter 字体
# 从 Google Fonts 下载字体文件

FONT_DIR="../public/fonts"
FONT_NAME="ArchitectsDaughter"
FONT_URL="https://github.com/google/fonts/raw/main/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf"

# 创建字体目录
mkdir -p "$FONT_DIR"

# 下载字体文件
echo "正在下载 Architects Daughter 字体..."
curl -L "$FONT_URL" -o "$FONT_DIR/$FONT_NAME-Regular.ttf"

if [ $? -eq 0 ]; then
    echo "✅ 字体下载成功: $FONT_DIR/$FONT_NAME-Regular.ttf"
else
    echo "❌ 字体下载失败，请手动下载："
    echo "   访问: https://fonts.google.com/specimen/Architects+Daughter"
    echo "   下载 Regular 字体文件，保存到: $FONT_DIR/$FONT_NAME-Regular.ttf"
fi


