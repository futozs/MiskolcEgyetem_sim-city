'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Cone, useAnimations } from '@react-three/drei';
import { Vector3, Color, Group, AnimationClip } from 'three';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TreeType = 'oak' | 'pine' | 'birch' | 'maple' | 'willow';

interface AdvancedTreeProps {
  position: [number, number, number];
  scale?: number;
  type?: TreeType;
  season?: Season;
  windStrength?: number;
  performance?: 'high' | 'medium' | 'low';
}

export function AdvancedTree({ 
  position, 
  scale = 1,
  type = 'oak',
  season = 'summer',
  windStrength = 0,
  performance = 'high'
}: AdvancedTreeProps) {
  const treeRef = useRef<Group>(null);
  const leavesRef = useRef<Group>(null);
  const windOffsetRef = useRef(Math.random() * Math.PI * 2);
  const [visible, setVisible] = useState(true);
  
  // Tree properties based on the type
  const treeProperties = useMemo(() => {
    // Create a deterministic seed from position
    const seed = Math.abs(Math.floor(position[0] * 1000) + Math.floor(position[2] * 1000));
    
    // Base properties
    const base = {
      trunkHeight: 0,
      trunkRadius: 0,
      leavesRadius: 0,
      trunkColor: new Color(),
      leavesColor: new Color(),
      variation: seed % 3,
      branchCount: performance === 'low' ? 0 : performance === 'medium' ? 2 : 3,
      leavesDetail: performance === 'low' ? 4 : performance === 'medium' ? 6 : 8,
      hasFlowers: false,
      flowerColor: new Color(),
      branchSpread: 0,
      windSensitivity: 0
    };
    
    // Customize based on tree type
    switch (type) {
      case 'oak':
        base.trunkHeight = 3 + (seed % 5) / 10;
        base.trunkRadius = 0.4 + (seed % 5) / 20;
        base.leavesRadius = 2 + (seed % 5) / 10;
        base.trunkColor = new Color("#7D5A4F");
        base.branchSpread = 0.6;
        base.windSensitivity = 0.5;
        break;
      case 'pine':
        base.trunkHeight = 4 + (seed % 6) / 10;
        base.trunkRadius = 0.3 + (seed % 4) / 20;
        base.leavesRadius = 1.5 + (seed % 4) / 10;
        base.trunkColor = new Color("#5E4B3B");
        base.branchSpread = 0.3;
        base.windSensitivity = 0.3;
        break;
      case 'birch':
        base.trunkHeight = 3.5 + (seed % 4) / 10;
        base.trunkRadius = 0.25 + (seed % 3) / 20;
        base.leavesRadius = 1.8 + (seed % 4) / 10;
        base.trunkColor = new Color("#E8E8E0");
        base.branchSpread = 0.5;
        base.windSensitivity = 0.7;
        break;
      case 'maple':
        base.trunkHeight = 3.2 + (seed % 5) / 10;
        base.trunkRadius = 0.35 + (seed % 4) / 20;
        base.leavesRadius = 2.2 + (seed % 5) / 10;
        base.trunkColor = new Color("#6D4C41");
        base.branchSpread = 0.7;
        base.windSensitivity = 0.6;
        break;
      case 'willow':
        base.trunkHeight = 2.8 + (seed % 4) / 10;
        base.trunkRadius = 0.4 + (seed % 4) / 20;
        base.leavesRadius = 2.5 + (seed % 6) / 10;
        base.trunkColor = new Color("#7D6C55");
        base.branchSpread = 1.0;
        base.windSensitivity = 0.8;
        break;
      default:
        base.trunkHeight = 3 + (seed % 5) / 10;
        base.trunkRadius = 0.3 + (seed % 4) / 20;
        base.leavesRadius = 2 + (seed % 5) / 10;
        base.trunkColor = new Color("#8B4513");
        base.branchSpread = 0.5;
        base.windSensitivity = 0.5;
    }
    
    // Customize based on season
    switch (season) {
      case 'spring':
        base.hasFlowers = type !== 'pine' && (seed % 3 === 0);
        base.flowerColor = new Color(['#FFCCE5', '#FFB3DA', '#FF99CC', '#FFE0F0', '#FFC0CB'][seed % 5]);
        if (type === 'pine') {
          base.leavesColor = new Color("#005C29");
        } else {
          base.leavesColor = new Color(['#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047'][seed % 5]);
        }
        break;
      case 'summer':
        if (type === 'pine') {
          base.leavesColor = new Color("#00421F");
        } else {
          base.leavesColor = new Color(['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'][seed % 5]);
        }
        break;
      case 'autumn':
        if (type === 'pine') {
          base.leavesColor = new Color("#004027");
        } else {
          base.leavesColor = new Color(['#FF9800', '#F57C00', '#EF6C00', '#E65100', '#FB8C00', '#F4511E', '#D84315'][seed % 7]);
        }
        break;
      case 'winter':
        base.hasFlowers = false;
        if (type === 'pine') {
          base.leavesColor = new Color("#003B1F");
        } else {
          // No leaves in winter except for pine
          base.leavesRadius = 0;
          // Sometimes snow on branches
          if (seed % 3 === 0) {
            base.hasFlowers = true;
            base.flowerColor = new Color("#FFFFFF");
          }
        }
        break;
      default:
        base.leavesColor = new Color("#22AA44");
    }
    
    return base;
  }, [type, season, performance, position]);
  
  // Optimize rendering based on distance from camera
  useFrame(({ camera }) => {
    if (!treeRef.current) return;
    
    // Calculate distance to camera
    const distance = new Vector3(...position).distanceTo(camera.position);
    
    // Skip rendering very distant trees in medium/low performance mode
    if ((performance === 'low' && distance > 100) || 
        (performance === 'medium' && distance > 150)) {
      if (visible) setVisible(false);
      return;
    } else if (!visible) {
      setVisible(true);
    }
    
    // Apply wind effect
    if (leavesRef.current && windStrength > 0 && treeProperties.windSensitivity > 0) {
      const time = performance.now() / 1000;
      const windEffect = Math.sin(time + windOffsetRef.current) * windStrength * treeProperties.windSensitivity;
      
      // Apply different wind motion based on tree type
      if (type === 'willow') {
        // Willow trees have more dramatic motion
        leavesRef.current.rotation.x = windEffect * 0.06;
        leavesRef.current.rotation.z = windEffect * 0.08;
      } else if (type === 'pine') {
        // Pine trees move less
        leavesRef.current.rotation.x = windEffect * 0.02;
        leavesRef.current.rotation.z = windEffect * 0.03;
      } else {
        leavesRef.current.rotation.x = windEffect * 0.04;
        leavesRef.current.rotation.z = windEffect * 0.05;
      }
    }
  });
  
  if (!visible) return null;
  
  // Render appropriate tree model based on type and season
  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Tree trunk */}
      <Cylinder 
        args={[
          treeProperties.trunkRadius, 
          treeProperties.trunkRadius * 1.5, 
          treeProperties.trunkHeight, 
          performance === 'low' ? 6 : 8
        ]} 
        position={[0, treeProperties.trunkHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={treeProperties.trunkColor} 
          roughness={0.9} 
          metalness={0.1}
        />
      </Cylinder>
      
      {/* Tree leaves/pine needles - based on tree type */}
      {treeProperties.leavesRadius > 0 && (
        <group ref={leavesRef} position={[0, treeProperties.trunkHeight, 0]}>
          {type === 'pine' ? (
            // Pine tree shape - with multiple layers
            <>
              {Array.from({ length: performance === 'low' ? 3 : 5 }).map((_, i) => {
                const layerScale = 1 - i * 0.2;
                return (
                  <Cone
                    key={`pine-layer-${i}`}
                    args={[
                      treeProperties.leavesRadius * layerScale, 
                      treeProperties.leavesRadius * 1.2,
                      treeProperties.leavesDetail
                    ]}
                    position={[0, i * treeProperties.leavesRadius * 0.7, 0]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial 
                      color={treeProperties.leavesColor} 
                      roughness={0.8} 
                      metalness={0.1}
                    />
                  </Cone>
                );
              })}
            </>
          ) : type === 'willow' ? (
            // Willow tree with hanging branches
            <>
              <Sphere
                args={[
                  treeProperties.leavesRadius * 0.8, 
                  treeProperties.leavesDetail, 
                  treeProperties.leavesDetail
                ]}
                position={[0, treeProperties.leavesRadius * 0.3, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial 
                  color={treeProperties.leavesColor} 
                  roughness={0.8} 
                  metalness={0.1}
                  transparent={true}
                  opacity={0.9}
                />
              </Sphere>
              
              {/* Hanging branches - only for medium and high performance */}
              {performance !== 'low' && (
                <>
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = treeProperties.leavesRadius * 0.7;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    
                    return (
                      <Cylinder
                        key={`willow-branch-${i}`}
                        args={[0.05, 0.02, treeProperties.leavesRadius * 1.5, 4]}
                        position={[x, 0, z]}
                        rotation={[Math.PI * 0.4, 0, angle]}
                        castShadow
                      >
                        <meshStandardMaterial 
                          color={treeProperties.leavesColor} 
                          roughness={0.8} 
                          metalness={0.1}
                          transparent={true}
                          opacity={0.8}
                        />
                      </Cylinder>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            // Regular deciduous tree canopy
            <Sphere
              args={[
                treeProperties.leavesRadius, 
                treeProperties.leavesDetail, 
                treeProperties.leavesDetail
              ]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial 
                color={treeProperties.leavesColor} 
                roughness={0.8} 
                metalness={0.1}
                transparent={true}
                opacity={0.9}
              />
            </Sphere>
          )}
          
          {/* Flowers or snow in spring/winter */}
          {treeProperties.hasFlowers && performance !== 'low' && (
            <>
              {Array.from({ length: 12 }).map((_, i) => {
                const phi = Math.acos(-1 + (2 * i) / 12);
                const theta = Math.sqrt(12 * Math.PI) * phi;
                
                const x = Math.cos(theta) * Math.sin(phi) * treeProperties.leavesRadius;
                const y = Math.sin(theta) * Math.sin(phi) * treeProperties.leavesRadius;
                const z = Math.cos(phi) * treeProperties.leavesRadius;
                
                return (
                  <Sphere
                    key={`flower-${i}`}
                    args={[0.15, 4, 4]}
                    position={[x, y, z]}
                  >
                    <meshStandardMaterial
                      color={treeProperties.flowerColor}
                      emissive={treeProperties.flowerColor}
                      emissiveIntensity={0.2}
                    />
                  </Sphere>
                );
              })}
            </>
          )}
        </group>
      )}
      
      {/* Tree branches - only for medium and high performance */}
      {treeProperties.branchCount > 0 && type !== 'pine' && season !== 'winter' && (
        <>
          {Array.from({ length: treeProperties.branchCount }).map((_, i) => {
            const angle = (i / treeProperties.branchCount) * Math.PI * 2;
            const height = treeProperties.trunkHeight * (0.5 + (i / treeProperties.branchCount) * 0.3);
            const length = treeProperties.leavesRadius * 0.7;
            
            return (
              <Cylinder
                key={`branch-${i}`}
                args={[0.1, 0.05, length, 4]}
                position={[
                  0,
                  height,
                  0
                ]}
                rotation={[
                  Math.PI * 0.5 * (0.8 + i * 0.1),
                  angle,
                  0
                ]}
                castShadow
              >
                <meshStandardMaterial 
                  color={treeProperties.trunkColor} 
                  roughness={0.9} 
                  metalness={0.1}
                />
              </Cylinder>
            );
          })}
        </>
      )}
    </group>
  );
} 