"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";

/* ── WebGL detection ─────────────────────────────────────── */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/* ── Mouse tracker ───────────────────────────────────────── */
function useMouse() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return mouse;
}

/* ── Central floating icosahedron ────────────────────────── */
function CoreGem({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Slow idle rotation
    meshRef.current.rotation.y = t * 0.12;
    meshRef.current.rotation.x = Math.sin(t * 0.07) * 0.25;
    // Subtle mouse parallax
    meshRef.current.position.x = mouse.current.x * 0.4;
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.12 + mouse.current.y * 0.2;

    wireRef.current.rotation.y = t * 0.08;
    wireRef.current.rotation.x = meshRef.current.rotation.x;
    wireRef.current.position.copy(meshRef.current.position);
  });

  return (
    <>
      {/* Solid core with amber emission */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial
          color="#1a0e00"
          emissive="#d97706"
          emissiveIntensity={0.25}
          roughness={0.15}
          metalness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wireframe shell slightly larger */}
      <mesh ref={wireRef} scale={1.06}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial
          color="#f59e0b"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </>
  );
}

/* ── Orbiting rings ──────────────────────────────────────── */
function OrbitRing({
  radius,
  tilt,
  speed,
  color,
  opacity,
}: {
  radius: number;
  tilt: number;
  speed: number;
  color: string;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.getElapsedTime() * speed;
  });

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 8, 120]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ── Particle field ──────────────────────────────────────── */
function Particles({
  count,
  mouse,
}: {
  count: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const points = useRef<THREE.Points>(null!);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Scatter in a sphere shell
      const r = 3 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = Math.random() * 2.5 + 0.5;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    points.current.rotation.y = t * 0.025;
    points.current.rotation.x = mouse.current.y * 0.08;
    points.current.rotation.z = mouse.current.x * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[sizes, 1]} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        color="#f59e0b"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.45}
        fog={false}
      />
    </points>
  );
}

/* ── Floating document planes ────────────────────────────── */
function DocPlane({
  position,
  rotation,
  speed,
  mouse,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const initialPos = useRef(position);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y =
      initialPos.current[1] + Math.sin(t * speed + initialPos.current[0]) * 0.18;
    ref.current.rotation.y =
      rotation[1] + Math.sin(t * speed * 0.4) * 0.1 + mouse.current.x * 0.06;
    ref.current.rotation.x =
      rotation[0] + Math.cos(t * speed * 0.3) * 0.05 + mouse.current.y * 0.04;
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <planeGeometry args={[0.55, 0.75, 1, 1]} />
      <meshStandardMaterial
        color="#18100a"
        emissive="#92400e"
        emissiveIntensity={0.3}
        transparent
        opacity={0.55}
        roughness={0.4}
        metalness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── Scene camera auto-distance ──────────────────────────── */
function CameraRig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (mouse.current.y * 0.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ── Inner Three.js scene ────────────────────────────────── */
function Scene3DInner({ isMobile }: { isMobile: boolean }) {
  const mouse = useMouse();
  const particleCount = isMobile ? 80 : 180;

  const docPlanes = [
    { pos: [-2.8, 0.6, -1.2] as [number,number,number], rot: [0.2, 0.5, 0.1] as [number,number,number], speed: 0.6 },
    { pos: [2.6, -0.3, -1.8] as [number,number,number], rot: [-0.1, -0.7, 0.05] as [number,number,number], speed: 0.45 },
    { pos: [-1.8, -1.6, -2.5] as [number,number,number], rot: [0.3, 0.3, -0.2] as [number,number,number], speed: 0.7 },
    { pos: [3.2, 1.4, -2.0] as [number,number,number], rot: [-0.2, -0.4, 0.15] as [number,number,number], speed: 0.55 },
  ];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} color="#fbbf24" />
      <pointLight position={[-4, -2, 2]} intensity={0.6} color="#f59e0b" />
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#ffffff" />

      {/* Camera rig */}
      <CameraRig mouse={mouse} />

      {/* Core animated gem */}
      <CoreGem mouse={mouse} />

      {/* Orbiting rings */}
      <OrbitRing radius={2.1} tilt={Math.PI / 3}    speed={0.35}  color="#f59e0b" opacity={0.25} />
      <OrbitRing radius={2.7} tilt={-Math.PI / 5}   speed={-0.2}  color="#fbbf24" opacity={0.15} />
      <OrbitRing radius={3.3} tilt={Math.PI / 7}    speed={0.15}  color="#d97706" opacity={0.1}  />

      {/* Floating document cards */}
      {!isMobile && docPlanes.map((p, i) => (
        <DocPlane key={i} position={p.pos} rotation={p.rot} speed={p.speed} mouse={mouse} />
      ))}

      {/* Particle field */}
      <Particles count={particleCount} mouse={mouse} />

      <Preload all />
    </>
  );
}

/* ── Public export — with WebGL guard + Suspense ─────────── */
export function Scene3D() {
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWebgl(detectWebGL());
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
    setReady(true);
  }, []);

  if (!ready) return null;

  // Fallback for no WebGL
  if (!webgl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20" />
    );
  }

  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={isMobile ? 1 : [1, 2]}
      performance={{ min: 0.5 }}
      gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
    >
      <Scene3DInner isMobile={isMobile} />
    </Canvas>
  );
}
