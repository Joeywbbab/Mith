#!/usr/bin/env node

/**
 * 图标生成脚本
 * 从 SVG 设计生成所有需要的图标格式并保存到 src-tauri/icons/
 * 
 * 使用方法：
 *   node tools/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const ICON_DIR = path.join(__dirname, '../src-tauri/icons');
const SIZES = [
  { size: 32, name: '32x32.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 512, name: 'icon.png' }
];

function drawIcon(ctx, size) {
  const padding = size * 0.1;
  const width = size - padding * 2;
  const height = size - padding * 2;
  
  // 清除画布
  ctx.clearRect(0, 0, size, size);
  
  // 绘制深色背景渐变（圆角矩形）
  const radius = size * 0.2;
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // 绘制橙色山脉线条（带发光效果）
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = size * 0.092;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = size * 0.08;
  ctx.shadowColor = '#ff6b35';
  
  // 主山脉路径
  const startX = padding + width * 0.12;
  const startY = padding + width * 0.78;
  const leftPeakX = padding + width * 0.38;
  const leftPeakY = padding + width * 0.42;
  const midX = padding + width * 0.45;
  const midY = padding + width * 0.40;
  const rightPeakX = padding + width * 0.50;
  const rightPeakY = padding + width * 0.45;
  const endX = padding + width * 0.78;
  const endY = padding + width * 0.62;
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(
    startX + (leftPeakX - startX) * 0.4,
    startY - (startY - leftPeakY) * 0.5,
    leftPeakX,
    leftPeakY
  );
  ctx.quadraticCurveTo(
    leftPeakX + (midX - leftPeakX) * 0.6,
    leftPeakY + (midY - leftPeakY) * 0.4,
    midX,
    midY
  );
  ctx.quadraticCurveTo(
    midX + (rightPeakX - midX) * 0.6,
    midY - (midY - rightPeakY) * 0.3,
    rightPeakX,
    rightPeakY
  );
  ctx.quadraticCurveTo(
    rightPeakX + (endX - rightPeakX) * 0.5,
    rightPeakY + (endY - rightPeakY) * 0.4,
    endX,
    endY
  );
  ctx.stroke();
  
  // 底部较短的曲线
  ctx.lineWidth = size * 0.075;
  const baseStartX = padding + width * 0.76;
  const baseStartY = padding + width * 0.62;
  const baseMidX = padding + width * 0.84;
  const baseMidY = padding + width * 0.60;
  const baseEndX = padding + width * 0.90;
  const baseEndY = padding + width * 0.66;
  
  ctx.beginPath();
  ctx.moveTo(baseStartX, baseStartY);
  ctx.quadraticCurveTo(baseMidX, baseMidY, baseEndX, baseEndY);
  ctx.stroke();
  
  ctx.shadowBlur = 0;
}

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  drawIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(ICON_DIR, filename);
  
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ 生成: ${filename} (${size}x${size})`);
}

// 确保图标目录存在
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
  console.log(`📁 创建目录: ${ICON_DIR}`);
}

console.log('🎨 开始生成图标文件...\n');

// 生成所有尺寸
SIZES.forEach(({ size, name }) => {
  generateIcon(size, name);
});

console.log('\n✅ 所有图标文件已生成！');
console.log(`📂 文件位置: ${ICON_DIR}`);
console.log('\n📝 下一步：');
console.log('   1. 运行 ./tools/generate-icns.sh 生成 macOS .icns 文件（仅 macOS）');
console.log('   2. 运行 npm run tauri:build 重新构建应用');


