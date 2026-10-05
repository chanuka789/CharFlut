/**
 * Draws print artwork to a canvas for use as a 3D texture. Mirrors <PrintArt> in Garment.tsx.
 * (Canvas instead of SVG-as-image so the Archivo webfont is used for type.)
 * When provider print files are synced to R2, load those PNGs instead.
 */
import * as THREE from 'three';
import type { PrintDesign } from '@/lib/types';

const SIZE = 1024;

export async function makePrintTexture(design: PrintDesign, ink: string, bg: string): Promise<THREE.CanvasTexture> {
  try {
    await document.fonts.load('900 100px Archivo');
  } catch {
    /* fall back to system font */
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(SIZE / 2, SIZE / 2);
  // Artwork units match PrintArt (about 140 wide) -> scale to fill the canvas.
  ctx.scale(SIZE / 200, SIZE / 200);
  draw(ctx, design, ink, bg);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const font = (px: number) => `900 ${px}px Archivo, "Arial Black", sans-serif`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, design: PrintDesign, ink: string, bg: string) {
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  switch (design) {
    case 'monogram': {
      roundRect(ctx, -46, -46, 92, 92, 20);
      ctx.fillStyle = bg;
      ctx.font = font(50);
      ctx.letterSpacing = '-3px';
      ctx.fillText('CF', 0, 17);
      break;
    }
    case 'wordmark': {
      ctx.font = font(34);
      ctx.letterSpacing = '-1px';
      ctx.fillText('CHARFLUT', 0, 12);
      break;
    }
    case 'stack': {
      ctx.scale(0.62, 0.62);
      roundRect(ctx, -32, -104, 64, 64, 14);
      ctx.letterSpacing = '-3px';
      ctx.fillStyle = bg;
      ctx.font = font(34);
      ctx.fillText('CF', 0, -60);
      ctx.fillStyle = ink;
      ctx.font = font(58);
      ctx.fillText('CHAR', 0, 10);
      ctx.fillText('FLUT', 0, 62);
      break;
    }
    case 'sunburst': {
      ctx.scale(0.7, 0.7);
      for (let i = 0; i < 24; i++) {
        ctx.save();
        ctx.rotate((i * 15 * Math.PI) / 180);
        ctx.globalAlpha = i % 2 ? 0.55 : 1;
        roundRect(ctx, -3, -92, 6, 34, 3);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.clearRect(-90, 40, 180, 80);
      ctx.fillRect(-82, 36, 164, 5);
      break;
    }
    case 'grid': {
      ctx.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-60 + i * 30, -60);
        ctx.lineTo(-60 + i * 30, 60);
        ctx.moveTo(-60, -60 + i * 30);
        ctx.lineTo(60, -60 + i * 30);
        ctx.stroke();
      }
      ctx.fillRect(0, -30, 30, 30);
      break;
    }
    case 'flow': {
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const o = i * 20;
        ctx.beginPath();
        ctx.moveTo(-70, -50 + o);
        ctx.bezierCurveTo(-35, -75 + o, -5, -25 + o, 30, -50 + o);
        ctx.quadraticCurveTo(70, -60 + o, 72, -50 + o);
        ctx.stroke();
      }
      break;
    }
    case 'statement': {
      ctx.font = font(44);
      ctx.letterSpacing = '-2px';
      ctx.fillText('WEAR', 0, -36);
      ctx.fillText('YOUR', 0, 6);
      ctx.fillText('OWN.', 0, 48);
      break;
    }
    case 'orbit': {
      ctx.lineWidth = 3;
      for (const a of [0, 60, -60]) {
        ctx.save();
        ctx.rotate((a * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}
