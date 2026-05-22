import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WinCelebrationProps {
  running: boolean;
  duration?: number;
  onComplete?: () => void;
}

/**
 * WinCelebration: 3D confetti/fireworks effect when a player wins.
 * Spawns colorful particles that fly upward and fade.
 */
export default function WinCelebration({
  running,
  duration = 3.0,
  onComplete,
}: WinCelebrationProps) {
  const progressRef = useRef(0);
  const calledRef = useRef(false);
  const particlesRef = useRef<THREE.Points>(null!);

  // Generate random particles
  const particleCount = 200;
  const { positions, colors, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const vels: { vx: number; vy: number; vz: number; hue: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Start from center, spread in circle
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 0.2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.3);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      vels.push({
        vx: (Math.random() - 0.5) * 3,
        vy: 1 + Math.random() * 3,
        vz: (Math.random() - 0.5) * 3,
        hue,
      });
    }

    return { positions: pos, colors: cols, velocities: vels };
  }, []);

  useEffect(() => {
    if (running) {
      progressRef.current = 0;
      calledRef.current = false;
    }
  }, [running]);

  useFrame((_, delta) => {
    if (!running || !particlesRef.current) return;

    progressRef.current += delta / duration;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete?.();
      }
      return;
    }

    const t = progressRef.current;
    const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colArr = particlesRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const vel = velocities[i];

      // Update position (gravity + drift)
      posArr[i * 3] += vel.vx * delta;
      posArr[i * 3 + 1] += vel.vy * delta;
      posArr[i * 3 + 2] += vel.vz * delta;

      // Gravity
      vel.vy -= 1.5 * delta;

      // Fade colors based on progress
      const life = 1 - t;
      const color = new THREE.Color().setHSL(vel.hue, life * 0.8 + 0.2, life * 0.6 + 0.2);
      colArr[i * 3] = color.r;
      colArr[i * 3 + 1] = color.g;
      colArr[i * 3 + 2] = color.b;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  if (!running) return null;

  return (
    <group>
      {/* Particle system (confetti) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Center glow ring */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 64]} />
        <meshBasicMaterial
          color="#ffd700"
          side={THREE.DoubleSide}
          transparent
          opacity={Math.sin(progressRef.current * Math.PI * 4) * 0.5 + 0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
