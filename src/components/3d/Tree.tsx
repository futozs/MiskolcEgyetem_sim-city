'use client';

import { useMemo } from 'react';
import { Color } from 'three';
import { Box, Sphere } from '@react-three/drei';

// Tree component optimized for the 3D city
export function Tree({ position, scale = 1, type = 'normal', performance = 'high' }: { 
  position: [number, number, number], 
  scale?: number,
  type?: 'normal' | 'pine' | 'bush',
  performance?: 'high' | 'medium' | 'low'
}) {
  // Deterministic tree properties based on position to ensure stability
  const treeVariation = useMemo(() => {
    // Create a deterministic seed from position
    const seed = Math.abs(Math.floor(position[0] * 1000) + Math.floor(position[2] * 1000));
    
    // Deterministic "season" based on position - 20% autumn
    const isAutumn = seed % 5 === 0;
    
    // Deterministic colors based on position and season
    const leafColor = isAutumn 
      ? new Color(`hsl(${20 + (seed % 40)}, ${70 + (seed % 20)}%, ${40 + (seed % 20)}%)`) 
      : new Color(`hsl(${90 + (seed % 40)}, ${70 + (seed % 25)}%, ${25 + (seed % 25)}%)`);

    return {
      trunkColor: new Color(`hsl(${20 + (seed % 20)}, ${60 + (seed % 30)}%, ${20 + (seed % 20)}%)`),
      leavesColor: leafColor,
      trunkHeight: 0.8 + (seed % 12) / 10, // More varied heights
      leavesSize: 0.8 + (seed % 7) / 10,  // More varied sizes
      branchSpread: 0.3 + (seed % 6) / 10,
      leavesDetail: performance === 'low' ? 4 : performance === 'medium' ? 6 : 8,
      hasFlowers: seed % 10 === 0, // 10% chance of flowers
      flowerColor: new Color(`hsl(${300 + (seed % 60)}, ${70 + (seed % 20)}%, ${70 + (seed % 20)}%)`),
      variation: seed % 4 // 4 variations of each tree type
    };
  }, [position, performance]);
  
  // Memoize the tree to prevent unnecessary rerenders
  const TreeContent = useMemo(() => {
    if (type === 'pine') {
      return (
        <group scale={scale}>
          {/* Trunk */}
          <Box 
            args={[0.3, treeVariation.trunkHeight * 2, 0.3]} 
            position={[0, treeVariation.trunkHeight, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial 
              color={treeVariation.trunkColor}
              roughness={0.9}
              metalness={0.1}
              // Add texture-like effect with shader
              emissive={treeVariation.trunkColor}
              emissiveIntensity={0.05}
            />
          </Box>
          
          {/* Pine layers with improved geometry */}
          {Array.from({ length: performance === 'low' ? 3 : 5 }).map((_, index) => {
            const layerSize = 0.9 - index * (performance === 'low' ? 0.2 : 0.15);
            const heightOffset = 1.2 + index * (performance === 'low' ? 0.8 : 0.5);
            
            // Slightly vary each layer's position for natural look
            const xOffset = ((treeVariation.variation + index) % 3) * 0.05;
            const zOffset = ((treeVariation.variation + index + 1) % 3) * 0.05;
            
            return (
              <Box
                key={index}
                args={[layerSize * 2 * scale, 0.8 * scale, layerSize * 2 * scale]} 
                position={[xOffset, heightOffset, zOffset]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={treeVariation.leavesColor}
                  roughness={0.8}
                  metalness={0}
                  // Add texture-like effect with shader
                  emissive={treeVariation.leavesColor}
                  emissiveIntensity={0.05}
                  // Add translucency effect
                  transparent={true}
                  opacity={0.95}
                />
              </Box>
            );
          })}
        </group>
      );
    } else if (type === 'bush') {
      return (
        <group scale={scale}>
          {/* Main bush shape */}
          <Sphere
            args={[treeVariation.leavesSize, treeVariation.leavesDetail, treeVariation.leavesDetail]}
            position={[0, treeVariation.leavesSize, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={treeVariation.leavesColor}
              roughness={0.8}
              metalness={0}
              // Add texture-like effect with shader
              emissive={treeVariation.leavesColor}
              emissiveIntensity={0.05}
              // Add translucency effect
              transparent={true}
              opacity={0.95}
            />
          </Sphere>
          
          {/* Additional foliage clumps for more complex bush shapes */}
          {performance !== 'low' && (
            <>
              {Array.from({ length: performance === 'medium' ? 2 : 3 }).map((_, index) => {
                // Position offsets based on deterministic variation
                const offsetX = (((treeVariation.variation + index) % 4) / 4 - 0.5) * treeVariation.branchSpread * 2;
                const offsetZ = (((treeVariation.variation + index + 2) % 4) / 4 - 0.5) * treeVariation.branchSpread * 2;
                const size = treeVariation.leavesSize * (0.7 - index * 0.1);
                
                return (
                  <Sphere
                    key={index}
                    args={[size, treeVariation.leavesDetail, treeVariation.leavesDetail]} 
                    position={[
                      offsetX, 
                      treeVariation.leavesSize * (index * 0.1 + 0.7), 
                      offsetZ
                    ]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      color={treeVariation.leavesColor}
                      roughness={0.8}
                      metalness={0}
                      emissive={treeVariation.leavesColor}
                      emissiveIntensity={0.05}
                      transparent={true}
                      opacity={0.95}
                    />
                  </Sphere>
                );
              })}
            </>
          )}
          
          {/* Optional flowers */}
          {treeVariation.hasFlowers && performance !== 'low' && (
            <>
              {Array.from({ length: 4 }).map((_, index) => {
                const angle = (index / 4) * Math.PI * 2;
                const radius = treeVariation.leavesSize * 0.8;
                
                return (
                  <Sphere
                    key={`flower-${index}`}
                    args={[0.1, 4, 4]}
                    position={[
                      Math.cos(angle) * radius,
                      treeVariation.leavesSize * 1.2,
                      Math.sin(angle) * radius
                    ]}
                  >
                    <meshStandardMaterial
                      color={treeVariation.flowerColor}
                      emissive={treeVariation.flowerColor}
                      emissiveIntensity={0.2}
                    />
                  </Sphere>
                );
              })}
            </>
          )}
        </group>
      );
    } else {
      return (
        <group scale={scale}>
          {/* Trunk with slight curve for realism */}
          <Box 
            args={[0.3, treeVariation.trunkHeight * 1.5, 0.3]} 
            position={[
              treeVariation.variation === 0 ? 0.1 : treeVariation.variation === 1 ? -0.1 : 0, 
              treeVariation.trunkHeight * 0.75,
              treeVariation.variation === 2 ? 0.1 : treeVariation.variation === 3 ? -0.1 : 0
            ]}
            rotation={[
              0,
              0,
              treeVariation.variation === 0 ? 0.05 : 
              treeVariation.variation === 1 ? -0.05 : 
              0
            ]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial 
              color={treeVariation.trunkColor}
              roughness={0.9}
              metalness={0.1}
              // Add wood-like texture effect
              emissive={treeVariation.trunkColor}
              emissiveIntensity={0.05}
            />
          </Box>
          
          {/* Main leaves crown */}
          <Sphere
            args={[treeVariation.leavesSize, treeVariation.leavesDetail, treeVariation.leavesDetail]}
            position={[0, treeVariation.trunkHeight * 1.5, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={treeVariation.leavesColor}
              roughness={0.8}
              metalness={0}
              // Add leaf-like texture effect
              emissive={treeVariation.leavesColor}
              emissiveIntensity={0.05}
              // Add translucency effect
              transparent={true}
              opacity={0.95}
            />
          </Sphere>
          
          {/* Additional smaller leaf clusters for more complex trees */}
          {performance !== 'low' && (
            <>
              {Array.from({ length: performance === 'medium' ? 2 : 3 }).map((_, index) => {
                // Position offsets based on deterministic variation
                const angle = ((treeVariation.variation + index) % 4) * Math.PI / 2;
                const radius = treeVariation.branchSpread;
                
                return (
                  <Sphere
                    key={index}
                    args={[treeVariation.leavesSize * 0.6, treeVariation.leavesDetail, treeVariation.leavesDetail]} 
                    position={[
                      Math.cos(angle) * radius,
                      treeVariation.trunkHeight * 1.5 + (index * 0.2 - 0.2),
                      Math.sin(angle) * radius
                    ]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      color={treeVariation.leavesColor}
                      roughness={0.8}
                      metalness={0}
                      emissive={treeVariation.leavesColor}
                      emissiveIntensity={0.05}
                      transparent={true}
                      opacity={0.9}
                    />
                  </Sphere>
                );
              })}
            </>
          )}
        </group>
      );
    }
  }, [type, scale, treeVariation, performance]);

  return TreeContent;
} 