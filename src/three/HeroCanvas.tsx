/** The WebGL part of the home hero. Loaded lazily by HeroScene so Three.js never delays first paint. */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, Sparkles } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import GarmentMesh from './GarmentMesh';
import type { PrintPassState } from './types';
import type { CategorySlug, PrintDesign } from '@/lib/types';

type Props = {
  state: React.RefObject<PrintPassState>;
  visible: boolean;
  onReady: () => void;
  category: CategorySlug;
  color: string;
  ink: string;
  design: PrintDesign;
  lightColor: string;
};

export default function HeroCanvas({ state, visible, onReady, category, color, ink, design, lightColor }: Props) {
  return (
    <Canvas
      dpr={[1, window.innerWidth < 768 ? 1.5 : 1.85]}
      frameloop={visible ? 'always' : 'never'}
      camera={{ position: [0, 0, 8.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      shadows
      onCreated={onReady}
    >
      <Rig>
        <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
          <GarmentMesh category={category} color={color} ink={ink} design={design} lineColor={lightColor} state={state} />
        </Float>
      </Rig>
      <ambientLight intensity={0.35} />
      <spotLight position={[-5, 6, 6]} angle={0.5} penumbra={1} intensity={90} color={new THREE.Color(lightColor).lerp(new THREE.Color('#ffffff'), 0.55)} castShadow />
      <directionalLight position={[4, 2, -4]} intensity={1.6} color="#ffffff" />
      <Sparkles count={36} scale={[9, 6, 4]} size={2.2} speed={0.25} color={lightColor} opacity={0.6} />
      <ContactShadows position={[0, -2.75, 0]} opacity={0.55} blur={2.6} scale={9} far={4} color="#000000" />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.2} color={lightColor} position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer intensity={0.8} position={[5, 1, -2]} scale={[3, 5, 1]} />
      </Environment>
    </Canvas>
  );
}

/** Garment turns toward the pointer and slowly rotates with scroll. */
function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const { size } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  useFrame((_, dt) => {
    if (!g.current) return;
    const scroll = window.scrollY / window.innerHeight;
    const targetY = pointer.current.x * 0.35 + scroll * 0.9 - 0.28;
    const targetX = pointer.current.y * 0.12;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, targetY, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, targetX, 3, dt);
    // Smaller garment on narrow screens so it sits behind the headline
    const s = size.width < 640 ? 0.78 : size.width < 1024 ? 0.9 : 1;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, s, 4, dt));
  });
  return <group ref={g}>{children}</group>;
}
