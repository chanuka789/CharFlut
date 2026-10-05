/**
 * Vector garment mockup used across the store until provider mockups (Printify images, Printful mockup tasks)
 * are synced to R2. Rendered as static HTML from Astro, or inside React islands (cart, search, viewer fallback).
 */
import type { CategorySlug, PrintDesign } from '@/lib/types';

type Props = {
  category: CategorySlug;
  color: string;
  ink: string;
  design: PrintDesign;
  view?: 'front' | 'back';
  className?: string;
  title?: string;
};

const TEE =
  'M140 40C160 60 240 60 260 40L332 62Q362 92 394 140L346 174L320 150L320 440Q200 454 80 440L80 150L54 174L6 140Q38 92 68 62Z';
const TEE_COLLAR = 'M140 40C160 72 240 72 260 40';
const HOODIE =
  'M146 66C168 80 232 80 254 66L322 88Q370 114 382 204L398 392L352 402L334 236L328 252L328 446Q200 460 72 446L72 252L66 236L48 402L2 392L18 204Q30 114 78 88Z';

export default function Garment({ category, color, ink, design, view = 'front', className, title }: Props) {
  const isHoodie = category === 'hoodies';
  const uid = `${category}-${design}-${color.replace('#', '')}-${view}`;
  // Back prints are big; front prints sit on the chest.
  const big = view === 'back';
  const art = { x: 200, y: big ? 230 : isHoodie ? 196 : 180, s: big ? 1.55 : design === 'monogram' ? 0.55 : 0.9 };
  const dark = isDark(color);

  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.1 : 0.35} />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.35 : 0.14} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={isHoodie ? HOODIE : TEE} />
        </clipPath>
      </defs>

      {isHoodie && <path d="M128 92C112 0 288 0 272 92Z" fill={color} />}
      {isHoodie && <path d="M128 92C112 0 288 0 272 92Z" fill="#000" opacity="0.18" />}

      <path d={isHoodie ? HOODIE : TEE} fill={color} />

      <g clipPath={`url(#clip-${uid})`}>
        {/* Fabric folds */}
        <path d="M120 300C150 330 160 380 150 450" stroke="#000" strokeOpacity={dark ? 0.35 : 0.08} strokeWidth="10" fill="none" />
        <path d="M290 260C270 320 280 380 300 450" stroke="#000" strokeOpacity={dark ? 0.3 : 0.07} strokeWidth="8" fill="none" />
        <g transform={`translate(${art.x} ${art.y}) scale(${art.s})`}>
          <PrintArt design={view === 'front' && isBackPrint(design) ? 'monogram' : design} ink={ink} bg={color} />
        </g>
        <rect width="400" height="480" fill={`url(#shade-${uid})`} />
      </g>

      {!isHoodie && <path d={TEE_COLLAR} stroke="#000" strokeOpacity="0.28" strokeWidth="6" fill="none" />}
      {isHoodie && view === 'front' && (
        <>
          <path d="M160 70C174 112 226 112 240 70C226 44 174 44 160 70Z" fill="#000" opacity="0.38" />
          <path d="M130 352H270L288 424H112Z" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="3" />
        </>
      )}
      <path
        d={isHoodie ? 'M72 432Q200 446 328 432' : 'M80 426Q200 440 320 426'}
        stroke="#000"
        strokeOpacity="0.16"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

function isBackPrint(d: PrintDesign) {
  return d === 'sunburst' || d === 'stack' || d === 'statement';
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
}

/** Artwork centred on (0,0), roughly 140 units wide. */
export function PrintArt({ design, ink, bg }: { design: PrintDesign; ink: string; bg: string }) {
  const font = { fontFamily: 'Archivo, Arial Black, sans-serif', fontWeight: 900 } as const;
  switch (design) {
    case 'monogram':
      return (
        <g>
          <rect x="-46" y="-46" width="92" height="92" rx="20" fill={ink} />
          <text x="0" y="17" textAnchor="middle" fontSize="50" letterSpacing="-3" fill={bg} style={font}>
            CF
          </text>
        </g>
      );
    case 'wordmark':
      return (
        <text x="0" y="12" textAnchor="middle" fontSize="34" letterSpacing="-1" fill={ink} style={font}>
          CHARFLUT
        </text>
      );
    case 'stack':
      return (
        <g fill={ink} style={font} textAnchor="middle" letterSpacing="-3">
          <rect x="-32" y="-104" width="64" height="64" rx="14" />
          <text x="0" y="-60" fontSize="34" fill={bg}>
            CF
          </text>
          <text x="0" y="10" fontSize="58">
            CHAR
          </text>
          <text x="0" y="62" fontSize="58">
            FLUT
          </text>
        </g>
      );
    case 'sunburst':
      return (
        <g>
          {Array.from({ length: 24 }).map((_, i) => (
            <rect
              key={i}
              x="-3"
              y="-92"
              width="6"
              height="34"
              rx="3"
              fill={ink}
              transform={`rotate(${i * 15})`}
              opacity={i % 2 ? 0.55 : 1}
            />
          ))}
          <circle r="44" fill={ink} />
          <rect x="-70" y="40" width="140" height="70" fill={bg} />
          <rect x="-82" y="36" width="164" height="5" fill={ink} />
        </g>
      );
    case 'grid':
      return (
        <g stroke={ink} strokeWidth="3" fill="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1={-60 + i * 30} y1="-60" x2={-60 + i * 30} y2="60" />
              <line x1="-60" y1={-60 + i * 30} x2="60" y2={-60 + i * 30} />
            </g>
          ))}
          <rect x="0" y="-30" width="30" height="30" fill={ink} />
        </g>
      );
    case 'flow':
      return (
        <g stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M-70 ${-50 + i * 20}C-35 ${-75 + i * 20} -5 ${-25 + i * 20} 30 ${-50 + i * 20}S70 ${-60 + i * 20} 72 ${-50 + i * 20}`} />
          ))}
        </g>
      );
    case 'statement':
      return (
        <g fill={ink} style={font} textAnchor="middle" letterSpacing="-2">
          <text x="0" y="-36" fontSize="44">
            WEAR
          </text>
          <text x="0" y="6" fontSize="44">
            YOUR
          </text>
          <text x="0" y="48" fontSize="44">
            OWN.
          </text>
        </g>
      );
    case 'orbit':
      return (
        <g stroke={ink} strokeWidth="3" fill="none">
          <ellipse rx="70" ry="26" />
          <ellipse rx="70" ry="26" transform="rotate(60)" />
          <ellipse rx="70" ry="26" transform="rotate(-60)" />
          <circle r="10" fill={ink} />
        </g>
      );
  }
}
