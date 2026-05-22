import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tile } from '@/types';

// Mahjong character mapping
const SUIT_CHARS: Record<string, string[]> = {
  wan: ['一', '二', '三', '四', '五', '六', '七', '八', '九'],
  tong: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'],
  tiao: ['🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒'],
  wind: ['東', '南', '西', '北'],
  dragon: ['中', '發', '白'],
  flower: ['春', '夏', '秋', '冬', '梅', '蘭', '竹', '菊'],
};

const SUIT_COLORS: Record<string, string> = {
  wan: '#8b0000',
  tong: '#0000cd',
  tiao: '#006400',
  wind: '#2f2f2f',
  dragon: '#cc0000',
  flower: '#8b4513',
};

// Tile dimensions: SPEC section 3.3
const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_D = 0.06;

type Highlight = 'none' | 'hover' | 'selected' | 'hint' | 'danger';

interface Tile3DProps {
  tile?: Tile;
  faceUp: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  highlight?: Highlight;
}

function generateTileFaceTexture(tile: Tile): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Ivory background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = '#c8b896';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, size - 12, size - 12);

  // Inner border
  ctx.strokeStyle = '#b8a080';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, size - 32, size - 32);

  const char = SUIT_CHARS[tile.suit]?.[tile.suit === 'flower' ? tile.rank % 8 : tile.rank] ?? '?';
  const color = SUIT_COLORS[tile.suit] ?? '#333';

  ctx.fillStyle = color;

  // Render character centered
  if (tile.suit === 'wan') {
    // 萬 tiles: rank number + 萬 character
    ctx.font = 'bold 72px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rankNum = (tile.rank + 1).toString();
    ctx.fillText(rankNum, size * 0.42, size * 0.48);

    ctx.font = 'italic 48px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('萬', size * 0.42, size * 0.52);
  } else if (tile.suit === 'tong') {
    // 筒: circles representation
    ctx.font = 'bold 80px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);
  } else if (tile.suit === 'tiao') {
    // 條: bamboo Unicode characters
    ctx.font = 'bold 80px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);
  } else if (tile.suit === 'dragon') {
    // 龍: red/green/white
    ctx.font = 'bold 90px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);
  } else {
    // Winds & Flowers
    ctx.font = 'bold 72px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);
  }

  return canvas;
}

function generateTileBackTexture(): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark wood base
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3e2723');
  gradient.addColorStop(0.5, '#5d4037');
  gradient.addColorStop(1, '#3e2723');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Bamboo pattern lines
  ctx.strokeStyle = '#2e1a11';
  ctx.lineWidth = 2;
  for (let i = 16; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Center diamond
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  const cx = size / 2;
  const cy = size / 2;
  const diamondSize = 60;
  ctx.moveTo(cx, cy - diamondSize);
  ctx.lineTo(cx + diamondSize, cy);
  ctx.lineTo(cx, cy + diamondSize);
  ctx.lineTo(cx - diamondSize, cy);
  ctx.closePath();
  ctx.fill();

  // Inner diamond
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  const innerSize = 40;
  ctx.moveTo(cx, cy - innerSize);
  ctx.lineTo(cx + innerSize, cy);
  ctx.lineTo(cx, cy + innerSize);
  ctx.lineTo(cx - innerSize, cy);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = '#1a0a00';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  return canvas;
}

// Texture cache
const backTexture = new THREE.CanvasTexture(generateTileBackTexture());
backTexture.wrapS = backTexture.wrapT = THREE.ClampToEdgeWrapping;
backTexture.colorSpace = THREE.SRGBColorSpace;

const faceTextureCache = new Map<string, THREE.CanvasTexture>();

function getFaceTexture(tile: Tile): THREE.CanvasTexture {
  const key = `${tile.suit}-${tile.rank}`;
  if (!faceTextureCache.has(key)) {
    const canvas = generateTileFaceTexture(tile);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    faceTextureCache.set(key, tex);
  }
  return faceTextureCache.get(key)!;
}

export default function Tile3D({
  tile,
  faceUp,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  highlight = 'none',
}: Tile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const effectiveHighlight = hovered ? 'hover' : highlight;

  // Materials
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f5f0e8',
        roughness: 0.35,
        metalness: 0.02,
      }),
    [],
  );

  const faceMaterial = useMemo(() => {
    if (!faceUp || !tile) {
      return new THREE.MeshStandardMaterial({
        map: backTexture,
        roughness: 0.6,
        metalness: 0.05,
      });
    }
    return new THREE.MeshStandardMaterial({
      map: getFaceTexture(tile),
      roughness: 0.3,
      metalness: 0.02,
    });
  }, [faceUp, tile]);

  // Highlight glow animation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = effectiveHighlight === 'selected' ? 0.025 : effectiveHighlight === 'hover' ? 0.015 : 0;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * Math.min(delta * 10, 1);

    // Pulse for hint
    if (effectiveHighlight === 'hint') {
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      const mats = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color('#ffff00');
          mat.emissiveIntensity = pulse * 0.3;
        }
      }
    } else if (effectiveHighlight === 'danger') {
      const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
      const mats = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color('#ff0000');
          mat.emissiveIntensity = pulse * 0.4;
        }
      }
    } else if (effectiveHighlight === 'selected') {
      const mats = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color('#ffd700');
          mat.emissiveIntensity = 0.4;
        }
      }
    } else {
      const mats = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    }
  });

  return (
    <group
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Tile body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[TILE_W, TILE_H, TILE_D]} />
        {/* Front face gets tile texture, rest get ivory */}
        <meshStandardMaterial attach="material-0" />
        <meshStandardMaterial attach="material-1" />
        <meshStandardMaterial {...bodyMaterial} attach="material-2" />
        <meshStandardMaterial {...bodyMaterial} attach="material-3" />
        <meshStandardMaterial {...faceMaterial} attach="material-4" />
        <meshStandardMaterial {...bodyMaterial} attach="material-5" />
      </mesh>

      {/* Selection highlight ring */}
      {effectiveHighlight === 'selected' && (
        <mesh position={[0, TILE_H / 2 + 0.003, 0]}>
          <ringGeometry args={[TILE_W * 0.42, TILE_W * 0.48, 4]} />
          <meshBasicMaterial color="#ffd700" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover indicator */}
      {effectiveHighlight === 'hover' && (
        <mesh position={[0, TILE_H / 2 + 0.002, 0]}>
          <ringGeometry args={[TILE_W * 0.4, TILE_W * 0.44, 4]} />
          <meshBasicMaterial color="#ffffff" opacity={0.3} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
