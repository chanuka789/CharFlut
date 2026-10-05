/**
 * Product page 3D viewer (plan 04): drag to rotate, colour changes live, zoom on the print.
 * Listens for the "cf:color" event from the buy box so the 3D model and swatches stay in sync.
 */
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import GarmentMesh, { type PrintPassState } from './GarmentMesh';
import { canRun3D } from './capability';
import type { CategorySlug, Colorway, PrintDesign } from '@/lib/types';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';

type Props = {
  category: CategorySlug;
  design: PrintDesign;
  colors: Colorway[];
  title: string;
};

export default function ProductViewer({ category, design, colors, title }: Props) {
  const [color, setColor] = useState(colors[0]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [interacted, setInteracted] = useState(false);
  const state = useRef<PrintPassState>({ progress: 0, velocity: 0 });

  useEffect(() => setSupported(canRun3D()), []);
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const c = colors.find((x) => x.id === id);
      if (c) setColor(c);
    };
    document.addEventListener('cf:color', on);
    return () => document.removeEventListener('cf:color', on);
  }, [colors]);
  // Quick print pass when the viewer opens, so the print "arrives"
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      state.current.progress = Math.min(1, (performance.now() - t0) / 1600);
      if (state.current.progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [supported]);

  if (supported === false) {
    return (
      <div className="grid h-full place-items-center p-[10%]">
        <Garment category={category} color={color.hex} ink={color.ink} design={design} title={`${title} in ${color.name}`} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-cursor="drag">
      {supported && (
        <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0.2, 7.6], fov: 36 }} gl={{ antialias: true, alpha: true }} shadows>
          <GarmentMesh category={category} color={color.hex} ink={color.ink} design={design} state={state} />
          <ambientLight intensity={0.5} />
          <spotLight position={[-4, 6, 6]} angle={0.5} penumbra={1} intensity={70} castShadow />
          <directionalLight position={[4, 2, -5]} intensity={1.4} />
          <ContactShadows position={[0, -2.6, 0]} opacity={0.35} blur={2.4} scale={8} far={4} />
          <Environment resolution={128}>
            <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 2, 1]} />
            <Lightformer intensity={1} position={[-5, 0, 2]} scale={[2, 6, 1]} />
            <Lightformer intensity={1} position={[5, 0, -3]} scale={[2, 6, 1]} />
          </Environment>
          <OrbitControls
            enablePan={false}
            minDistance={4.2}
            maxDistance={9}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={(Math.PI * 2) / 3}
            autoRotate={!interacted}
            autoRotateSpeed={1.2}
            onStart={() => setInteracted(true)}
            makeDefault
          />
        </Canvas>
      )}
      <p className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted">
        <IconR name="rotate" size={18} /> Drag to rotate · scroll or pinch to zoom
      </p>
    </div>
  );
}
