/**
 * Procedural 3D garment (tee or hoodie) with a "print pass" reveal (plan 01, signature moments 1 and 2).
 * Swap for the real GLB models (plan 02, "3D garment models") by replacing <GarmentBody> with useGLTF;
 * the print decal and shader uniforms stay the same.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { CategorySlug, PrintDesign } from '@/lib/types';
import { makePrintTexture } from './printTexture';

import type { PrintPassState } from './types';
export type { PrintPassState };

type Props = {
  category: CategorySlug;
  color: string;
  ink: string;
  design: PrintDesign;
  lineColor?: string;
  state: React.RefObject<PrintPassState>;
  showBack?: boolean;
};

const HALF_HEIGHT = 2.2;

/* ---------- Silhouettes (same outlines as the SVG mockups, in scene units) ---------- */
function teeShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.6, 2.0);
  s.bezierCurveTo(-0.4, 1.8, 0.4, 1.8, 0.6, 2.0);
  s.lineTo(1.32, 1.78);
  s.quadraticCurveTo(1.62, 1.48, 1.94, 1.0);
  s.lineTo(1.46, 0.66);
  s.lineTo(1.2, 0.9);
  s.lineTo(1.2, -2.0);
  s.quadraticCurveTo(0, -2.14, -1.2, -2.0);
  s.lineTo(-1.2, 0.9);
  s.lineTo(-1.46, 0.66);
  s.lineTo(-1.94, 1.0);
  s.quadraticCurveTo(-1.62, 1.48, -1.32, 1.78);
  s.closePath();
  return s;
}
function hoodieShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.54, 1.74);
  s.bezierCurveTo(-0.32, 1.6, 0.32, 1.6, 0.54, 1.74);
  s.lineTo(1.22, 1.52);
  s.quadraticCurveTo(1.7, 1.26, 1.82, 0.36);
  s.lineTo(1.98, -1.52);
  s.lineTo(1.52, -1.62);
  s.lineTo(1.34, 0.04);
  s.lineTo(1.28, -0.12);
  s.lineTo(1.28, -2.06);
  s.quadraticCurveTo(0, -2.2, -1.28, -2.06);
  s.lineTo(-1.28, -0.12);
  s.lineTo(-1.34, 0.04);
  s.lineTo(-1.52, -1.62);
  s.lineTo(-1.98, -1.52);
  s.lineTo(-1.82, 0.36);
  s.quadraticCurveTo(-1.7, 1.26, -1.22, 1.52);
  s.closePath();
  return s;
}
function hoodShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.74, 1.46);
  s.bezierCurveTo(-0.92, 2.42, 0.92, 2.42, 0.74, 1.46);
  s.closePath();
  return s;
}

/** Soft "pillow" bulge so the flat outline reads as fabric with a body inside. */
const bulge = (x: number, y: number) => 0.32 * Math.max(0, 1 - (x / 1.9) ** 2) * Math.max(0, 1 - (y / 2.3) ** 2);

function puffy(shape: THREE.Shape, depth = 0.18) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.1,
    bevelSegments: 8,
    curveSegments: 40,
    steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    p.setZ(i, z + Math.sign(z || 1) * bulge(x, y));
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- Shader patches ---------- */
type Uniforms = {
  uLineY: { value: number };
  uLineColor: { value: THREE.Color };
  uLineStrength: { value: number };
  uVelocity: { value: number };
  uTime: { value: number };
};

function patchFabric(mat: THREE.MeshPhysicalMaterial, u: Uniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uVelocity; uniform float uTime; varying float vWorldY;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float rip = sin(position.y * 3.2 + uTime * 2.4) * cos(position.x * 2.1 + uTime * 1.3);
         transformed.z += rip * uVelocity * 0.09;
         transformed.x += sin(position.y * 2.0 + uTime) * uVelocity * 0.03;`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         vWorldY = (modelMatrix * vec4(transformed, 1.0)).y;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uLineY; uniform vec3 uLineColor; uniform float uLineStrength; varying float vWorldY;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float band = exp(-abs(vWorldY - uLineY) * 22.0) * uLineStrength;
         gl_FragColor.rgb += uLineColor * band * 1.3;`,
      );
  };
}

const decalVertex = /* glsl */ `
  uniform float uVelocity; uniform float uTime;
  varying vec2 vUv; varying float vWorldY;
  void main() {
    vUv = uv;
    vec3 p = position;
    float rip = sin(p.y * 3.2 + uTime * 2.4) * cos(p.x * 2.1 + uTime * 1.3);
    p.z += rip * uVelocity * 0.09;
    p.x += sin(p.y * 2.0 + uTime) * uVelocity * 0.03;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldY = world.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const decalFragment = /* glsl */ `
  uniform sampler2D uMap; uniform float uLineY; uniform vec3 uLineColor; uniform float uLineStrength;
  varying vec2 vUv; varying float vWorldY;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float printed = smoothstep(uLineY - 0.015, uLineY + 0.015, vWorldY);
    float glow = exp(-abs(vWorldY - uLineY) * 30.0) * uLineStrength;
    vec3 col = mix(tex.rgb, uLineColor, glow * 0.85);
    float a = tex.a * printed;
    a = max(a, tex.a * glow);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

/* ---------- Component ---------- */
export default function GarmentMesh({ category, color, ink, design, lineColor = '#FFC800', state, showBack = true }: Props) {
  const isHoodie = category === 'hoodies';
  const body = useMemo(() => puffy(isHoodie ? hoodieShape() : teeShape()), [isHoodie]);
  const hood = useMemo(() => (isHoodie ? puffy(hoodShape(), 0.1) : null), [isHoodie]);

  const uniforms = useMemo<Uniforms>(
    () => ({
      uLineY: { value: HALF_HEIGHT + 0.5 },
      uLineColor: { value: new THREE.Color(lineColor) },
      uLineStrength: { value: 1 },
      uVelocity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );
  useEffect(() => {
    uniforms.uLineColor.value.set(lineColor);
  }, [lineColor]);

  const fabric = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.86,
      sheen: 1,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color('#ffffff').multiplyScalar(0.35),
    });
    patchFabric(m, uniforms);
    return m;
  }, []);
  useEffect(() => {
    fabric.color.set(color);
  }, [color, fabric]);

  // Print decals (front chest + optional big back print), bent to follow the bulge
  const backPrint = design === 'sunburst' || design === 'stack' || design === 'statement';
  const frontDesign: PrintDesign = backPrint ? 'monogram' : design;
  const front = useDecal(frontDesign, ink, color, uniforms);
  const back = useDecal(design, ink, color, uniforms);

  const frontGeo = useMemo(() => bentPlane(design === 'monogram' || backPrint ? 0.62 : 1.2, isHoodie ? 1.02 : 1.2, 1), [design, isHoodie]);
  const backGeo = useMemo(() => bentPlane(1.9, 0.3, -1), []);

  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const s = state.current;
    uniforms.uTime.value += dt;
    uniforms.uVelocity.value = THREE.MathUtils.damp(uniforms.uVelocity.value, Math.min(1.5, Math.abs(s.velocity)), 4, dt);
    // Line travels from above the garment to below it as progress goes 0 -> 1
    const target = THREE.MathUtils.lerp(HALF_HEIGHT + 0.4, -HALF_HEIGHT - 0.4, s.progress);
    uniforms.uLineY.value = THREE.MathUtils.damp(uniforms.uLineY.value, target, 6, dt);
    uniforms.uLineStrength.value = s.progress > 0.001 && s.progress < 0.999 ? 1 : THREE.MathUtils.damp(uniforms.uLineStrength.value, 0, 3, dt);
  });

  return (
    <group ref={group}>
      {hood && <mesh geometry={hood} material={fabric} position={[0, 0, -0.18]} castShadow />}
      <mesh geometry={body} material={fabric} castShadow receiveShadow />
      {front && <mesh geometry={frontGeo} material={front} renderOrder={2} />}
      {showBack && backPrint && back && <mesh geometry={backGeo} material={back} renderOrder={2} rotation={[0, Math.PI, 0]} />}
    </group>
  );
}

/** A plane sitting on the garment surface. side = 1 front, -1 back (mirrored by rotation). */
function bentPlane(size: number, centerY: number, side: 1 | -1) {
  const g = new THREE.PlaneGeometry(size, size, 24, 24);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i) + centerY;
    p.setY(i, y);
    p.setZ(i, 0.09 + 0.14 + bulge(x * side, y) + 0.006);
  }
  g.computeVertexNormals();
  return g;
}

function useDecal(design: PrintDesign, ink: string, bg: string, uniforms: Uniforms) {
  const [mat, setMat] = useState<THREE.ShaderMaterial | null>(null);
  useEffect(() => {
    let alive = true;
    let tex: THREE.Texture | null = null;
    makePrintTexture(design, ink, bg).then((t) => {
      if (!alive) return t.dispose();
      tex = t;
      setMat(
        new THREE.ShaderMaterial({
          uniforms: { ...uniforms, uMap: { value: t } },
          vertexShader: decalVertex,
          fragmentShader: decalFragment,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
      );
    });
    return () => {
      alive = false;
      tex?.dispose();
    };
  }, [design, ink, bg]);
  return mat;
}
