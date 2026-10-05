/** 404 page: a 3D CF monogram tile you can spin (plan 04, system pages). */
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { canRun3D } from './capability';

function Tile() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    // Black "CF" letters on a transparent canvas; the yellow comes from the tile itself.
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    document.fonts.load('900 280px Archivo').finally(() => {
      ctx.fillStyle = '#111111';
      ctx.font = '900 280px Archivo, "Arial Black", sans-serif';
      ctx.letterSpacing = '-18px';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CF', 256, 276);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
    });
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[2.6, 2.6, 0.6]} radius={0.42} smoothness={8}>
        <meshPhysicalMaterial color="#FFC800" roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      {tex && (
        <>
          <mesh position={[0, 0, 0.305]}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshBasicMaterial map={tex} transparent />
          </mesh>
          <mesh position={[0, 0, -0.305]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshBasicMaterial map={tex} transparent />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function Monogram404() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(canRun3D()), []);
  if (!ok) return <img src="/brand/icon.svg" alt="" width={220} height={220} className="mx-auto" />;
  return (
    <div className="h-full w-full" data-cursor="drag">
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 1.8]} gl={{ alpha: true }}>
        <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
          <Tile />
        </Float>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 3, 4]} scale={[6, 2, 1]} />
          <Lightformer intensity={1} position={[-4, 0, 2]} scale={[2, 5, 1]} />
        </Environment>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
