import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Environment() {
  const { scene } = useThree();
  const tableRef = useRef<THREE.Mesh>(null!);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} color="#fff8e7" />

      {/* Key light (directional sun) */}
      <directionalLight
        position={[8, 12, 4]}
        intensity={0.9}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
      />

      {/* Warm point light — table lamp effect */}
      <pointLight
        position={[0, 3, 0]}
        intensity={0.6}
        color="#ffe8c0"
        distance={10}
        decay={1.5}
      />

      {/* Fill light from bottom */}
      <pointLight
        position={[0, -0.5, 6]}
        intensity={0.2}
        color="#c8d8ff"
        distance={8}
      />

      {/* Table surface — dark wood base */}
      <mesh ref={tableRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[3.6, 3.6]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Felt playing area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 3.0]} />
        <meshStandardMaterial color="#0d6b2e" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Table border / frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[1.48, 1.55, 64]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Sky color background */}
      <color attach="background" args={['#1a1520']} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#1a1520', 8, 20]} />

      {/* Shadow-catching ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
    </>
  );
}
