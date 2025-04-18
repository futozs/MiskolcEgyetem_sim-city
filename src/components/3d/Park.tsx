'use client';

import { useRef, useMemo, useState } from 'react';
import { Vector3, Color } from 'three';
import { Box, Sphere, useTexture, Cylinder, MeshTransmissionMaterial, Float } from '@react-three/drei';

// Pad komponens a parkhoz
function Bench({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Ülőke */}
      <Box
        args={[2, 0.1, 0.5]}
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
        />
      </Box>
      
      {/* Háttámla */}
      <Box
        args={[2, 0.5, 0.1]}
        position={[0, 0.8, -0.2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
        />
      </Box>
      
      {/* Lábak */}
      {[[-0.8, 0.25, 0], [0.8, 0.25, 0]].map((pos, i) => (
        <Box
          key={i}
          args={[0.1, 0.5, 0.5]}
          position={pos as [number, number, number]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#555555"
            roughness={0.7}
            metalness={0.3}
          />
        </Box>
      ))}
    </group>
  );
}

// Szökőkút komponens
function Fountain({ position }: { position: [number, number, number] }) {
  const particlesRef = useRef<any>();

  // Vízrészecskék alakítása
  const waterParticles = useMemo(() => {
    const particles = [];
    const count = 100;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      const height = 0.5 + Math.random() * 1.5;
      
      particles.push({
        position: [
          Math.cos(angle) * radius * 0.5,
          height,
          Math.sin(angle) * radius * 0.5
        ],
        scale: 0.05 + Math.random() * 0.05
      });
    }
    
    return particles;
  }, []);

  return (
    <group position={position}>
      {/* Szökőkút medence */}
      <Cylinder
        args={[3, 3, 0.5, 32]}
        position={[0, 0.25, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#aaaaaa"
          roughness={0.7}
          metalness={0.1}
        />
      </Cylinder>
      
      {/* Belső víz a medencében */}
      <Cylinder
        args={[2.7, 2.7, 0.4, 32]}
        position={[0, 0.3, 0]}
      >
        <MeshTransmissionMaterial
          backside={true}
          samples={16}
          thickness={0.2}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          roughness={0}
          metalness={0}
          transmission={1}
          color="#5EA3E5"
        />
      </Cylinder>
      
      {/* Szökőkút központi oszlop */}
      <Cylinder
        args={[0.3, 0.5, 0.7, 16]}
        position={[0, 0.6, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#888888"
          roughness={0.7}
          metalness={0.3}
        />
      </Cylinder>
      
      {/* Vízsugár részecskék */}
      <group ref={particlesRef}>
        {waterParticles.map((particle, i) => (
          <Float
            key={i}
            speed={5}
            rotationIntensity={0}
            floatIntensity={2}
            position={particle.position as [number, number, number]}
          >
            <Sphere
              args={[particle.scale, 8, 8]}
              castShadow
            >
              <MeshTransmissionMaterial
                backside={false}
                samples={4}
                thickness={0.5}
                roughness={0}
                metalness={0}
                transmission={1}
                color="#7BB2E5"
              />
            </Sphere>
          </Float>
        ))}
      </group>
    </group>
  );
}

// Virágágyás komponens
function FlowerBed({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const flowerTypes = useMemo(() => {
    const posHash = Math.abs(Math.floor(position[0] * 100) + Math.floor(position[2] * 100));
    const flowers = [];
    
    // Véletlen, de determinisztikus eloszlása a virágoknak
    for (let i = 0; i < 20; i++) {
      const hash = posHash + i * 321;
      const type = hash % 5; // 5 különböző virág típus
      
      // Virág színe a típus alapján
      let color: string;
      switch(type) {
        case 0: color = "#FF5555"; break; // piros
        case 1: color = "#FFAA00"; break; // narancssárga
        case 2: color = "#FFFF77"; break; // sárga
        case 3: color = "#AA77FF"; break; // lila
        case 4: color = "#FF77AA"; break; // rózsaszín
        default: color = "#FFFFFF";
      }
      
      // Pozíció az ágyáson belül
      const angle = (i / 20) * Math.PI * 2;
      const radius = (hash % 100) / 100 * 0.8;
      
      flowers.push({
        position: [
          Math.cos(angle) * radius,
          0.1,
          Math.sin(angle) * radius
        ],
        color,
        scale: 0.05 + (hash % 50) / 1000
      });
    }
    
    return flowers;
  }, [position]);
  
  return (
    <group position={position} scale={scale}>
      {/* Virágágy föld */}
      <Cylinder
        args={[1, 1, 0.2, 24]}
        position={[0, 0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#3D2817"
          roughness={0.9}
          metalness={0}
        />
      </Cylinder>
      
      {/* Virágok */}
      {flowerTypes.map((flower, i) => (
        <group key={i} position={flower.position as [number, number, number]}>
          {/* Virág szár */}
          <Cylinder
            args={[0.01, 0.01, 0.2, 6]}
            position={[0, 0.1, 0]}
          >
            <meshStandardMaterial
              color="#4CAF50"
              roughness={0.8}
              metalness={0}
            />
          </Cylinder>
          
          {/* Virág fej */}
          <Sphere
            args={[flower.scale, 6, 6]}
            position={[0, 0.25, 0]}
          >
            <meshStandardMaterial
              color={flower.color}
              roughness={0.7}
              metalness={0}
              emissive={flower.color}
              emissiveIntensity={0.2}
            />
          </Sphere>
        </group>
      ))}
    </group>
  );
}

// Alacsony kerítés a park körül
function LowFence({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
  // Kiszámoljuk a hosszát és az irányt
  const direction = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const length = Math.sqrt(direction[0] * direction[0] + direction[2] * direction[2]);
  const angle = Math.atan2(direction[2], direction[0]);
  
  // A középpontot használjuk pozícióként
  const position: [number, number, number] = [
    start[0] + direction[0] / 2,
    start[1] + direction[1] / 2,
    start[2] + direction[2] / 2
  ];
  
  // Oszlopok számítása
  const postCount = Math.max(2, Math.floor(length / 0.5));
  const posts = [];
  
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    posts.push({
      position: [
        start[0] + direction[0] * t,
        start[1],
        start[2] + direction[2] * t
      ] as [number, number, number]
    });
  }
  
  return (
    <group>
      {/* Vízszintes léc */}
      <Box
        args={[length, 0.05, 0.05]}
        position={position}
        rotation={[0, angle, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#A7815E"
          roughness={0.9}
          metalness={0}
        />
      </Box>
      
      {/* Oszlopok */}
      {posts.map((post, i) => (
        <Box
          key={i}
          args={[0.05, 0.4, 0.05]}
          position={[post.position[0], post.position[1] + 0.2, post.position[2]]}
          castShadow
        >
          <meshStandardMaterial
            color="#A7815E"
            roughness={0.9}
            metalness={0}
          />
        </Box>
      ))}
    </group>
  );
}

// Fő Park komponens
export function Park({ 
  position = [0, 0, 0], 
  size = [20, 1, 20], 
  performance = 'high',
  theme = 'classic'
}: { 
  position?: [number, number, number], 
  size?: [number, number, number],
  performance?: 'high' | 'medium' | 'low',
  theme?: 'classic' | 'modern' | 'natural'
}) {
  // Determinisztikus seed az elrendezéshez
  const seed = useMemo(() => Math.abs(Math.floor(position[0] * 1000) + Math.floor(position[2] * 1000)), [position]);
  
  // Park elemek generálása a seed alapján
  const parkElements = useMemo(() => {
    // Elemek száma a teljesítmény alapján
    const benchCount = performance === 'low' ? 3 : performance === 'medium' ? 5 : 8;
    const flowerBedCount = performance === 'low' ? 3 : performance === 'medium' ? 6 : 10;
    
    const halfWidth = size[0] / 2;
    const halfDepth = size[2] / 2;
    
    // Padok
    const benches = [];
    for (let i = 0; i < benchCount; i++) {
      const hash = seed + i * 123;
      
      // Park széle mentén elhelyezve
      const isOnEdge = i % 2 === 0;
      const angle = (i / benchCount) * Math.PI * 2;
      
      // Elhelyezés a park szélén vagy belül
      const radius = isOnEdge 
        ? Math.min(halfWidth, halfDepth) * 0.85 
        : Math.min(halfWidth, halfDepth) * 0.5;
      
      benches.push({
        position: [
          position[0] + Math.cos(angle) * radius,
          position[1],
          position[2] + Math.sin(angle) * radius
        ] as [number, number, number],
        rotation: angle + Math.PI / 2
      });
    }
    
    // Virágágyások
    const flowerBeds = [];
    for (let i = 0; i < flowerBedCount; i++) {
      const hash = seed + i * 456;
      const angle = (i / flowerBedCount) * Math.PI * 2;
      const radius = Math.min(halfWidth, halfDepth) * ((hash % 50) / 100 + 0.3);
      
      flowerBeds.push({
        position: [
          position[0] + Math.cos(angle) * radius,
          position[1],
          position[2] + Math.sin(angle) * radius
        ] as [number, number, number],
        scale: 0.8 + (hash % 40) / 100
      });
    }
    
    // Szökőkút a középen (csak jobb teljesítménynél)
    const hasFountain = performance !== 'low';
    
    // Alacsony kerítés a park körül
    const fenceSegments = [];
    const fencePointCount = 8;
    const fencePoints = [];
    
    for (let i = 0; i < fencePointCount; i++) {
      const angle = (i / fencePointCount) * Math.PI * 2;
      fencePoints.push([
        position[0] + Math.cos(angle) * halfWidth * 0.9,
        position[1],
        position[2] + Math.sin(angle) * halfDepth * 0.9
      ] as [number, number, number]);
    }
    
    for (let i = 0; i < fencePointCount; i++) {
      fenceSegments.push({
        start: fencePoints[i],
        end: fencePoints[(i + 1) % fencePointCount]
      });
    }
    
    return {
      benches,
      flowerBeds,
      hasFountain,
      fenceSegments
    };
  }, [position, size, performance, seed]);
  
  return (
    <group>
      {/* Park talaj */}
      <Box
        args={size}
        position={[position[0], position[1] + size[1] / 2, position[2]]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#335522"
          roughness={0.9}
          metalness={0}
        />
      </Box>
      
      {/* Padok */}
      {parkElements.benches.map((bench, i) => (
        <Bench key={`bench-${i}`} position={bench.position} rotation={bench.rotation} />
      ))}
      
      {/* Virágágyások */}
      {parkElements.flowerBeds.map((flowerBed, i) => (
        <FlowerBed key={`flowerbed-${i}`} position={flowerBed.position} scale={flowerBed.scale} />
      ))}
      
      {/* Szökőkút (ha van) */}
      {parkElements.hasFountain && (
        <Fountain position={[position[0], position[1], position[2]]} />
      )}
      
      {/* Alacsony kerítés */}
      {parkElements.fenceSegments.map((segment, i) => (
        <LowFence key={`fence-${i}`} start={segment.start} end={segment.end} />
      ))}
    </group>
  );
} 