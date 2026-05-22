import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DealAnimationProps {
  running: boolean;
  tileCount: number;
  duration?: number; // seconds
  onComplete?: () => void;
}

/**
 * DealAnimation: Staggered tile dealing effect.
 * Renders particles that fly from wall position to hand positions.
 * Uses GSAP-style interpolation via useFrame.
 */
export default function DealAnimation({
  running,
  tileCount,
  duration = 1.5,
  onComplete,
}: DealAnimationProps) {
  const progressRef = useRef(0);
  const calledRef = useRef(false);

  useEffect(() => {
    if (running) {
      progressRef.current = 0;
      calledRef.current = false;
    }
  }, [running]);

  useFrame((_, delta) => {
    if (!running) return;

    progressRef.current += delta / duration;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete?.();
      }
    }
  });

  if (!running || tileCount === 0) return null;

  const progress = progressRef.current;
  const tiles = Array.from({ length: Math.min(tileCount, 52) }, (_, i) => i);

  return (
    <group>
      {tiles.map((i) => {
        // Stagger: each tile starts with a delay
        const staggerDelay = (i / tiles.length) * 0.8;
        const localProgress = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)));

        if (localProgress <= 0) return null;

        // Ease-out animation
        const eased = 1 - Math.pow(1 - localProgress, 3);

        // Start: wall position (top-center, z=1.3, high)
        const startPos = new THREE.Vector3(
          (i % 17 - 8) * 0.091,
          0.3,
          1.3,
        );

        // End positions: 4 players
        const destinations = [
          /* bottom (human) */ new THREE.Vector3((i % 13 - 6) * 0.093, 0, 1.15),
          /* left */         new THREE.Vector3(-1.2, 0, (i % 13 - 6) * 0.093),
          /* top */          new THREE.Vector3((i % 13 - 6) * 0.093, 0, -1.15),
          /* right */        new THREE.Vector3(1.2, 0, (i % 13 - 6) * 0.093),
        ];

        const playerIndex = Math.floor(i / 13) % 4;
        const endPos = destinations[playerIndex];

        // Arc path
        const mid = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
        mid.y += 0.3;

        // Quadratic bezier interpolation
        const t = eased;
        const u = 1 - t;
        const pos = new THREE.Vector3(
          u * u * startPos.x + 2 * u * t * mid.x + t * t * endPos.x,
          u * u * startPos.y + 2 * u * t * mid.y + t * t * endPos.y,
          u * u * startPos.z + 2 * u * t * mid.z + t * t * endPos.z,
        );

        return (
          <mesh key={`deal-${i}`} position={pos}>
            <boxGeometry args={[0.09, 0.12, 0.06]} />
            <meshStandardMaterial
              color="#f5f0e8"
              roughness={0.4}
              opacity={0.6 * eased + 0.4}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}
