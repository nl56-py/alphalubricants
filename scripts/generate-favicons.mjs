import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to construct multi-resolution standard ICO file with PNG frames
async function createIcoFile(pngBuffers, outputPath) {
  const count = pngBuffers.length;
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  // Directory entries: 16 bytes each
  let currentOffset = 6 + count * 16;
  const entries = [];

  for (const buf of pngBuffers) {
    const meta = await sharp(buf).metadata();
    const entry = Buffer.alloc(16);
    entry.writeUInt8(meta.width >= 256 ? 0 : meta.width, 0);
    entry.writeUInt8(meta.height >= 256 ? 0 : meta.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset of image data
    entries.push(entry);
    currentOffset += buf.length;
  }

  const finalBuffer = Buffer.concat([header, ...entries, ...pngBuffers]);
  fs.writeFileSync(outputPath, finalBuffer);
  console.log(`✅ Saved ICO (${pngBuffers.length} sizes): ${path.relative(rootDir, outputPath)}`);
}

async function generateFavicons() {
  console.log('🐺 [Favicon Generator] Processing logo.jpg...');
  const logoPath = path.join(rootDir, 'logo.jpg');
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Cannot find logo at ${logoPath}`);
  }

  const logoImage = sharp(logoPath);
  const { data, info } = await logoImage.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 1. Identify wolf head bounds (left partition of logo before the "ALPHA" wordmark)
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 720; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx] < 245 || data[idx + 1] < 245 || data[idx + 2] < 245) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log(`🐺 Detected wolf emblem bounds: (${minX}, ${minY}) to (${maxX}, ${maxY}) [${cropW}x${cropH}]`);

  // 2. Crop wolf head into raw RGBA buffer
  const cropped = await logoImage
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cWidth = cropped.info.width;
  const cHeight = cropped.info.height;
  const cChannels = cropped.info.channels;
  const cData = cropped.data;

  // Convert to RGBA
  const rgba = Buffer.alloc(cWidth * cHeight * 4);
  for (let i = 0; i < cWidth * cHeight; i++) {
    const src = i * cChannels;
    const dst = i * 4;
    rgba[dst] = cData[src];
    rgba[dst + 1] = cData[src + 1];
    rgba[dst + 2] = cData[src + 2];
    rgba[dst + 3] = 255;
  }

  // 3. Flood-fill from outer edges to make background transparent while keeping internal white fur intact
  const visited = new Uint8Array(cWidth * cHeight);
  const queue = [];

  function isBackgroundWhite(x, y) {
    const idx = (y * cWidth + x) * 4;
    return rgba[idx] > 235 && rgba[idx + 1] > 235 && rgba[idx + 2] > 235;
  }

  for (let x = 0; x < cWidth; x++) {
    if (isBackgroundWhite(x, 0)) { queue.push(x, 0); visited[0 * cWidth + x] = 1; }
    if (isBackgroundWhite(x, cHeight - 1)) { queue.push(x, cHeight - 1); visited[(cHeight - 1) * cWidth + x] = 1; }
  }
  for (let y = 0; y < cHeight; y++) {
    if (isBackgroundWhite(0, y)) { queue.push(0, y); visited[y * cWidth + 0] = 1; }
    if (isBackgroundWhite(cWidth - 1, y)) { queue.push(cWidth - 1, y); visited[y * cWidth + (cWidth - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const idx = (cy * cWidth + cx) * 4;
    rgba[idx + 3] = 0; // Transparent

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < cWidth && ny >= 0 && ny < cHeight) {
        const nIdx = ny * cWidth + nx;
        if (!visited[nIdx] && isBackgroundWhite(nx, ny)) {
          visited[nIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  const transparentWolfBuffer = await sharp(rgba, {
    raw: { width: cWidth, height: cHeight, channels: 4 }
  }).png().toBuffer();

  // 4. Create subtle silhouette outline to guarantee high contrast on dark tabs (e.g. Chrome Dark Mode)
  const mask = new Uint8Array(cWidth * cHeight);
  for (let i = 0; i < cWidth * cHeight; i++) {
    mask[i] = rgba[i * 4 + 3] > 30 ? 255 : 0;
  }

  const radius = 5;
  const dilated = new Uint8Array(cWidth * cHeight);
  for (let y = 0; y < cHeight; y++) {
    for (let x = 0; x < cWidth; x++) {
      if (mask[y * cWidth + x] > 0) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < cWidth && ny >= 0 && ny < cHeight) {
                dilated[ny * cWidth + nx] = 255;
              }
            }
          }
        }
      }
    }
  }

  const outlineRgba = Buffer.alloc(cWidth * cHeight * 4);
  for (let i = 0; i < cWidth * cHeight; i++) {
    if (dilated[i] > 0) {
      outlineRgba[i * 4] = 255;
      outlineRgba[i * 4 + 1] = 255;
      outlineRgba[i * 4 + 2] = 255;
      outlineRgba[i * 4 + 3] = 255;
    }
  }

  const outlineBuf = await sharp(outlineRgba, {
    raw: { width: cWidth, height: cHeight, channels: 4 }
  }).png().toBuffer();

  const outlinedWolfBuffer = await sharp(outlineBuf)
    .composite([{ input: transparentWolfBuffer }])
    .png()
    .toBuffer();

  // 5. Generate transparent favicon PNG sizes (16, 32, 48)
  const f16 = await sharp(outlinedWolfBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const f32 = await sharp(outlinedWolfBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const f48 = await sharp(outlinedWolfBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'src', 'app');

  // Save 16x16 and 32x32 PNGs
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), f16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), f32);
  console.log('✅ Saved public/favicon-16x16.png and public/favicon-32x32.png');

  // Generate multi-size favicon.ico
  await createIcoFile([f16, f32, f48], path.join(publicDir, 'favicon.ico'));
  fs.copyFileSync(path.join(publicDir, 'favicon.ico'), path.join(appDir, 'favicon.ico'));
  console.log('✅ Copied favicon.ico to src/app/favicon.ico');

  // 6. Generate Apple Touch Icon (180x180) - with premium branded solid white/wine badge
  // iOS adds a black background if transparent, so a solid white card with brand border is best practice
  const appleSize = 180;
  const appleSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}" viewBox="0 0 ${appleSize} ${appleSize}">
      <rect width="${appleSize}" height="${appleSize}" fill="#ffffff"/>
      <rect x="5" y="5" width="${appleSize - 10}" height="${appleSize - 10}" rx="32" fill="#ffffff" stroke="#801e2b" stroke-width="6"/>
    </svg>
  `);
  const wolfForApple = await sharp(transparentWolfBuffer)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const appleTouchIcon = await sharp(appleSvg)
    .composite([{ input: wolfForApple, gravity: 'center' }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), appleTouchIcon);
  console.log('✅ Saved apple-touch-icon.png (public/ & src/app/)');

  // 7. Generate Android / PWA Icons (192x192 & 512x512)
  const generatePwaIcon = async (targetSize) => {
    const wolfSize = Math.round(targetSize * 0.72);
    const wolfBuf = await sharp(outlinedWolfBuffer)
      .resize(wolfSize, wolfSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    return sharp({
      create: {
        width: targetSize,
        height: targetSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: wolfBuf, gravity: 'center' }])
    .png()
    .toBuffer();
  };

  const pwa192 = await generatePwaIcon(192);
  const pwa512 = await generatePwaIcon(512);

  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), pwa192);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), pwa512);
  fs.writeFileSync(path.join(appDir, 'icon.png'), pwa192);
  console.log('✅ Saved android-chrome icons (192x192, 512x512) and src/app/icon.png');

  // 8. Generate site.webmanifest
  const webManifest = {
    name: "Alpha Lubricants Nepal",
    short_name: "Alpha Lubricants",
    description: "Performance. Protection. Power. Premium motorcycle and engine oils in Nepal.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    theme_color: "#801e2b",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    orientation: "portrait"
  };

  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    `${JSON.stringify(webManifest, null, 2)}\n`,
    'utf8'
  );
  console.log('✅ Saved public/site.webmanifest');
  console.log('\n✨ All favicons and web manifests generated successfully!');
}

generateFavicons().catch((err) => {
  console.error('❌ Failed to generate favicons:', err);
  process.exit(1);
});
