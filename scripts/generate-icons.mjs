import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.resolve('./public/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Beautiful SVG icon with tactile cloche and fork/knife, dark theme + neon green
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1e1e" />
      <stop offset="100%" stop-color="#121212" />
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#22c55e" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#22c55e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Squircle Base with 3D tactile edge -->
  <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}" rx="${size * 0.25}" fill="#0d0d0d" />
  <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.88}" rx="${size * 0.25}" fill="url(#bgGrad)" stroke="#2e2e2e" stroke-width="${size * 0.02}" />

  <!-- Inner Plate Ring -->
  <circle cx="${size * 0.5}" cy="${size * 0.48}" r="${size * 0.3}" fill="#181818" stroke="#282828" stroke-width="${size * 0.02}" filter="url(#glow)"/>
  
  <!-- Food / Cloche / Bowl Motif in Neon Green -->
  <!-- Cloche Dome -->
  <path d="M ${size * 0.3} ${size * 0.52} C ${size * 0.3} ${size * 0.34} ${size * 0.7} ${size * 0.34} ${size * 0.7} ${size * 0.52} Z" fill="url(#greenGrad)" />
  <!-- Cloche Handle -->
  <circle cx="${size * 0.5}" cy="${size * 0.31}" r="${size * 0.045}" fill="#4ade80" />
  <!-- Plate Base -->
  <rect x="${size * 0.26}" y="${size * 0.54}" width="${size * 0.48}" height="${size * 0.06}" rx="${size * 0.03}" fill="#15803d" />
  <rect x="${size * 0.26}" y="${size * 0.52}" width="${size * 0.48}" height="${size * 0.06}" rx="${size * 0.03}" fill="url(#greenGrad)" />

  <!-- Steam waves -->
  <path d="M ${size * 0.42} ${size * 0.24} Q ${size * 0.45} ${size * 0.20} ${size * 0.42} ${size * 0.16}" stroke="#4ade80" stroke-width="${size * 0.025}" stroke-linecap="round" fill="none" opacity="0.8" />
  <path d="M ${size * 0.58} ${size * 0.24} Q ${size * 0.61} ${size * 0.20} ${size * 0.58} ${size * 0.16}" stroke="#4ade80" stroke-width="${size * 0.025}" stroke-linecap="round" fill="none" opacity="0.8" />

  <!-- Tactile Bottom Indicator Pill -->
  <rect x="${size * 0.36}" y="${size * 0.72}" width="${size * 0.28}" height="${size * 0.08}" rx="${size * 0.04}" fill="#22c55e" opacity="0.9"/>
  <circle cx="${size * 0.42}" cy="${size * 0.76}" r="${size * 0.02}" fill="#ffffff" />
  <rect x="${size * 0.47}" y="${size * 0.745}" width="${size * 0.12}" height="${size * 0.03}" rx="${size * 0.015}" fill="#ffffff" />
</svg>
`;

async function generate() {
  const sizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.png', size: 64 },
  ];

  for (const s of sizes) {
    const svgBuffer = Buffer.from(createSvg(s.size));
    await sharp(svgBuffer)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(outputDir, s.name));
    console.log(`Generated ${s.name}`);
  }

  // Also save SVG icon
  fs.writeFileSync(path.join(outputDir, 'icon.svg'), createSvg(512));
  console.log('Generated icon.svg');
}

generate().catch(console.error);
