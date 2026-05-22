import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ClaimAnimationProps {
  running: boolean;
  claimType: 'chow' | 'pong' | 'kong';
  fromPositions: [number, number, number][]; // tile positions to claim
  toPosition: [number, number, number]; // meld zone position
  duration?: number;
  onComplete?: () => void;
}

/**
 * ClaimAnimation: Multiple tiles slide from hand/discard to meld zone.
 * Used for Pong, Chow, Kong claims.
 */
export default function ClaimAnimation({
  running,
  claimType,
  fromPositions,
  toPosition,
  duration = 0.5,
  onComplete,
}: ClaimAnimationProps) {
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
  const eased = 1 - Math.pow(1 - progress, 3);

  const to = new THREE.Vector3(...toPosition);

  // Highlight color based on claim type
  const colors: Record<string, string> = {
    chow: '#4fc3f7',
    pong: '#ffb74d',
    kong: '#ce93d8',
  };

  return (
    <group>
      {fromPositions.map((from, i) => {
        const start = new THREE.Vector3(...from);

        // Spread tiles slightly in x direction at destination
        const targetX = to.x + (i - (fromPositions.length - 1) / 2) * 0.095;
        const target = new THREE.Vector3(targetX, to.y, to.z);

        // Slide from origin to meld zone
        const pos = new THREE.Vector3().lerpVectors(start, target, eased);

        return (
          <mesh key={`claim-${i}`} position={pos}>
            <boxGeometry args={[0.09, 0.12, 0.06]} />
            <meshStandardMaterial
              color={colors[claimType] ?? '#ffffff'}
              roughness={0.4}
              emissive={colors[claimType] ?? '#ffffff'}
              emissiveIntensity={0.3 * (1 - eased)}
              opacity={0.8}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}
