import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DiscardAnimationProps {
  running: boolean;
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  duration?: number;
  onComplete?: () => void;
}

/**
 * DiscardAnimation: Animates a single tile flying from hand to discard pool.
 * Follows an arc path for natural feel.
 */
export default function DiscardAnimation({
  running,
  fromPosition,
  toPosition,
  duration = 0.35,
  onComplete,
}: DiscardAnimationProps) {
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

  if (!running) return null;

  const progress = progressRef.current;
  const eased = 1 - Math.pow(1 - progress, 2.5);

  const start = new THREE.Vector3(...fromPosition);
  const end = new THREE.Vector3(...toPosition);

  // Arc: lift up halfway
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  mid.y += 0.15;

  const t = eased;
  const u = 1 - t;
  const pos = new THREE.Vector3(
    u * u * start.x + 2 * u * t * mid.x + t * t * end.x,
    u * u * start.y + 2 * u * t * mid.y + t * t * end.y,
    u * u * start.z + 2 * u * t * mid.z + t * t * end.z,
  );

  // Tilt as it flies
  const rotX = eased * -Math.PI / 4;

  return (
    <mesh position={pos} rotation={[rotX, 0, 0]}>
      <boxGeometry args={[0.09, 0.12, 0.06]} />
      <meshStandardMaterial
        color="#f5f0e8"
        roughness={0.35}
        opacity={0.8}
        transparent
      />
    </mesh>
  );
}
