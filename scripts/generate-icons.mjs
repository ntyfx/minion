import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function makeSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.2) : Math.round(size * 0.09375);
  const inner = size - padding * 2;
  const rx = Math.round(inner * 0.21875);

  const gradId = "g";
  const boltScale = inner / 26;
  const boltTx = padding + (inner - 26 * boltScale) / 2;
  const boltTy = padding + (inner - 26 * boltScale) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  ${maskable ? `<rect width="${size}" height="${size}" fill="#141414"/>` : ""}
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${rx}" fill="url(#${gradId})"/>
  <g transform="translate(${boltTx}, ${boltTy}) scale(${boltScale})">
    <path d="M14.5 5L9.5 13.5h4l-1.5 7 6.5-9h-4.5L14.5 5Z" fill="#fff" opacity="0.92"/>
  </g>
</svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(resolve(outDir, `icon-${size}x${size}.png`));
  console.log(`Generated icon-${size}x${size}.png`);
}

const maskSvg = Buffer.from(makeSvg(512, true));
await sharp(maskSvg).png().toFile(resolve(outDir, "icon-maskable-512x512.png"));
console.log("Generated icon-maskable-512x512.png");

const appleSvg = Buffer.from(makeSvg(180));
await sharp(appleSvg).png().toFile(resolve(outDir, "apple-touch-icon.png"));
console.log("Generated apple-touch-icon.png");
