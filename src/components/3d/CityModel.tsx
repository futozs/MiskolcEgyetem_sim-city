'use client';

import { useAppStore } from '@/store/appStore';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Vector3, MathUtils, Color, DirectionalLight, SpotLight, Scene, Points } from 'three';
import { Building } from './Building';
import { ConstructionSite } from './ConstructionSite';
import { Ground } from './Ground';
import { 
  OrbitControls, 
  Sky, 
  Text, 
  Cloud, 
  PerspectiveCamera,
  Stars,
  AdaptiveDpr,
  PerformanceMonitor,
  Box,
  Sphere,
  Float,
  Environment,
  BakeShadows,
  useProgress,
  Instances,
  Instance
} from '@react-three/drei';
import { Weather } from './Weather';
import { City } from './City';
import { Park } from './Park';
import { StreetLight, StreetLightStyle } from './StreetLight';
import { Vehicle, VehicleType } from './Vehicle';
import { PeopleGroup } from './People';

// Tree component optimized for the 3D city
function Tree({ position, scale = 1, type = 'normal', performance = 'high' }: { 
  position: [number, number, number], 
  scale?: number,
  type?: 'normal' | 'pine' | 'bush',
  performance?: 'high' | 'medium' | 'low'
}) {
  // Use instanced mesh rendering when possible
  const isVisible = useRef(true);
  
  // Calculate distance from camera to decide LOD
  useFrame(({ camera }) => {
    const distance = new Vector3(...position).distanceTo(camera.position);
    // Dynamically hide very distant trees to improve performance
    if (distance > 150 && performance !== 'high') {
      isVisible.current = false;
    } else {
      isVisible.current = true;
    }
  });
  
  // Return null for distant trees in low performance mode
  if (!isVisible.current) return null;
  
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
      // Drastically reduce geometry complexity based on performance
      leavesDetail: performance === 'low' ? 3 : performance === 'medium' ? 4 : 6,
      hasFlowers: seed % 10 === 0 && performance !== 'low', // 10% chance of flowers only in better performance
      flowerColor: new Color(`hsl(${300 + (seed % 60)}, ${70 + (seed % 20)}%, ${70 + (seed % 20)}%)`),
      variation: seed % 4 // 4 variations of each tree type
    };
  }, [position, performance]);
  
  // Memoize the tree to prevent unnecessary rerenders
  const TreeContent = useMemo(() => {
    // Extremely simplified trees for low performance
    if (performance === 'low') {
      return (
        <group scale={scale}>
          {/* Just a simple shape for low performance */}
          <Box 
            args={[0.3, treeVariation.trunkHeight * 1.5, 0.3]} 
            position={[0, treeVariation.trunkHeight * 0.75, 0]}
          >
            <meshBasicMaterial color={treeVariation.trunkColor} />
          </Box>
          
          <Sphere
            args={[treeVariation.leavesSize, 4, 4]}
            position={[0, treeVariation.trunkHeight * 1.5, 0]}
          >
            <meshBasicMaterial color={treeVariation.leavesColor} />
          </Sphere>
        </group>
      );
    } else if (type === 'pine') {
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
                    args={[
                      treeVariation.leavesSize * (0.6 - index * 0.1),
                      treeVariation.leavesDetail, 
                      treeVariation.leavesDetail
                    ]} 
                    position={[
                      Math.cos(angle) * radius,
                      treeVariation.trunkHeight * 1.5 - 0.2 + index * 0.4,
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
                      opacity={0.95}
                    />
                  </Sphere>
                );
              })}
            </>
          )}
        </group>
      );
    }
  }, [scale, type, treeVariation, performance]);
  
  return TreeContent;
}

// Forest component to add additional trees throughout the city
function ForestLayer({ performance = 'high', buildingPositions = [], season, windStrength }: { 
  performance?: 'high' | 'medium' | 'low',
  buildingPositions?: Array<{
    id: number,
    position: number[],
    scale: number[],
    zoneType?: string
  }>,
  season: 'spring' | 'summer' | 'autumn' | 'winter',
  windStrength: number
}) {
  // Use instanced mesh for all trees of the same type
  const additionalTrees = useMemo(() => {
    // Limit total tree count based on performance first
    const maxTrees = performance === 'low' ? 80 : performance === 'medium' ? 200 : 500;
    
    // Convert building positions to Vector3 for distance calculations
    const buildings = buildingPositions.map(b => ({
      position: new Vector3(b.position[0], b.position[1], b.position[2]),
      radius: Math.max(b.scale[0], b.scale[2]) * 4,
      zoneType: b.zoneType || 'other'
    }));
    
    // Function to check if a position is too close to any building
    const isTooCloseToBuilding = (pos: Vector3, minDistance = 2) => {
      for (const building of buildings) {
        const distance = pos.distanceTo(building.position);
        if (distance < building.radius + minDistance) {
          return true;
        }
      }
      return false;
    };
    
    // Define city zones with corresponding tree types
    const cityZones = {
      // Central parks with dense mixed trees
      centralParkNorth: { x: [-20, 20], z: [60, 150], density: 0.6, types: ['normal', 'pine', 'bush'] },
      centralParkSouth: { x: [-20, 20], z: [-150, -60], density: 0.6, types: ['normal', 'pine', 'bush'] },
      
      // Residential areas with yard trees
      residentialWest: { x: [-150, -30], z: [-150, 150], density: 0.2, types: ['normal', 'bush'] },
      
      // Commercial district with sparse decorative trees
      commercialEast: { x: [30, 150], z: [-50, 50], density: 0.1, types: ['normal'] },
      
      // Government area with formal arranged trees
      governmentNE: { x: [30, 150], z: [60, 150], density: 0.15, types: ['pine', 'normal'] },
      
      // Education zone with campus-like tree arrangement
      educationSE: { x: [30, 150], z: [-150, -60], density: 0.2, types: ['normal', 'bush'] },
      
      // Central plaza with formal tree arrangements
      centralPlaza: { x: [-20, 20], z: [-50, 50], density: 0.15, types: ['normal'] },
      
      // Road medians with small trees
      mainRoadNS: { x: [-5, 5], z: [-150, 150], density: 0.05, types: ['bush'] },
      mainRoadEW: { x: [-150, 150], z: [-5, 5], density: 0.05, types: ['bush'] },
    };
    
    // Trees array to store all generated trees
    const trees: Array<{
      position: [number, number, number],
      type: 'normal' | 'pine' | 'bush',
      scale: number
    }> = [];
    
    // Helper function to determine if a position is on a road
    const isOnRoad = (x: number, z: number, roadWidth = 8) => {
      // Main roads (X and Z axes)
      if (Math.abs(x) < roadWidth && Math.abs(z) < 150) return true;
      if (Math.abs(z) < roadWidth && Math.abs(x) < 150) return true;
      
      // Secondary roads - grid pattern (every 30 units)
      const secondaryRoadWidth = 6;
      const blockSize = 30;
      
      // Check if on horizontal or vertical secondary roads
      for (let offset = -120; offset <= 120; offset += blockSize) {
        if (Math.abs(offset) < roadWidth) continue; // Skip where it would overlap with main roads
        
        // Check horizontal secondary roads
        if (Math.abs(z - offset) < secondaryRoadWidth) return true;
        
        // Check vertical secondary roads
        if (Math.abs(x - offset) < secondaryRoadWidth) return true;
      }
      
      return false;
    };
    
    // Generate trees for each zone
    Object.entries(cityZones).forEach(([zoneName, zone]) => {
      const { x, z, density, types } = zone;
      const zoneWidth = x[1] - x[0];
      const zoneDepth = z[1] - z[0];
      
      // Calculate grid size based on zone density
      const gridSpacing = performance === 'low' ? 15 : performance === 'medium' ? 10 : 8;
      
      // Generate trees in a grid pattern with randomized offsets
      for (let xPos = x[0]; xPos <= x[1]; xPos += gridSpacing) {
        for (let zPos = z[0]; zPos <= z[1]; zPos += gridSpacing) {
          // Deterministic random based on position
          const posHash = Math.abs(Math.floor(xPos * 100) + Math.floor(zPos * 100));
          
          // Only place trees based on zone density
          if (posHash % 100 > density * 100) continue;
          
          // Add random offset for natural look (but deterministic)
          const offsetX = ((posHash % 10) / 10 - 0.5) * gridSpacing * 0.5;
          const offsetZ = ((Math.floor(posHash / 10) % 10) / 10 - 0.5) * gridSpacing * 0.5;
          
          const finalX = xPos + offsetX;
          const finalZ = zPos + offsetZ;
          
          // Skip if on a road
          if (isOnRoad(finalX, finalZ)) continue;
          
          // Skip if too close to a building
          if (isTooCloseToBuilding(new Vector3(finalX, 0, finalZ), 3)) continue;
          
          // Choose tree type based on zone
          const typeIndex = posHash % types.length;
          const treeType = types[typeIndex] as 'normal' | 'pine' | 'bush';
          
          // Vary scale by type and with deterministic randomness
          let treeScale = 1.0;
          
          if (treeType === 'normal') {
            treeScale = 0.8 + (posHash % 5) / 10; // 0.8 to 1.3
          } else if (treeType === 'pine') {
            treeScale = 1.0 + (posHash % 6) / 10; // 1.0 to 1.6
          } else if (treeType === 'bush') {
            treeScale = 0.6 + (posHash % 4) / 10; // 0.6 to 1.0
          }
          
          // Add the tree to our array
          trees.push({
            position: [finalX, 0, finalZ],
            type: treeType,
            scale: treeScale
          });
        }
      }
    });
    
    // Generate tree clusters along streets (tree-lined boulevards)
    const addStreetTrees = () => {
      const streetTreeZones = [
        // North-South main boulevard trees
        { x: [-12, -8], z: [-140, 140], spacing: 15, type: 'normal', scale: 0.9 },
        { x: [8, 12], z: [-140, 140], spacing: 15, type: 'normal', scale: 0.9 },
        
        // East-West main boulevard trees
        { x: [-140, 140], z: [-12, -8], spacing: 15, type: 'normal', scale: 0.9 },
        { x: [-140, 140], z: [8, 12], spacing: 15, type: 'normal', scale: 0.9 },
      ];
      
      streetTreeZones.forEach(zone => {
        const { x, z, spacing, type, scale } = zone;
        
        // Determine if vertical or horizontal street
        const isVertical = Math.abs(x[1] - x[0]) < Math.abs(z[1] - z[0]);
        
        if (isVertical) {
          // Place trees along vertical street
          for (let zPos = z[0]; zPos <= z[1]; zPos += spacing) {
            // Center position in the X range
            const xPos = (x[0] + x[1]) / 2;
            
            // Skip intersections
            if (isOnRoad(xPos, zPos, 12)) continue;
            
            // Deterministic variation
            const posHash = Math.abs(Math.floor(xPos * 100) + Math.floor(zPos * 100));
            const offsetX = ((posHash % 10) / 10 - 0.5) * 2;
            
            // Skip some positions for variation
            if (posHash % 7 === 0) continue;
            
            trees.push({
              position: [xPos + offsetX, 0, zPos],
              type: type as 'normal' | 'pine' | 'bush',
              scale: scale + (posHash % 10) / 40 // Small scale variation
            });
          }
        } else {
          // Place trees along horizontal street
          for (let xPos = x[0]; xPos <= x[1]; xPos += spacing) {
            // Center position in the Z range
            const zPos = (z[0] + z[1]) / 2;
            
            // Skip intersections
            if (isOnRoad(xPos, zPos, 12)) continue;
            
            // Deterministic variation
            const posHash = Math.abs(Math.floor(xPos * 100) + Math.floor(zPos * 100));
            const offsetZ = ((posHash % 10) / 10 - 0.5) * 2;
            
            // Skip some positions for variation
            if (posHash % 7 === 0) continue;
            
            trees.push({
              position: [xPos, 0, zPos + offsetZ],
              type: type as 'normal' | 'pine' | 'bush',
              scale: scale + (posHash % 10) / 40 // Small scale variation
            });
          }
        }
      });
    };
    
    // Add street trees if not in low performance mode
    if (performance !== 'low') {
      addStreetTrees();
    }
    
    // Much more aggressive tree filtering - keep only a fraction of trees
    let filteredTrees;
    if (performance === 'low') {
      // Keep only 25% of trees in low performance mode
      filteredTrees = trees.filter((_, i) => i % 4 === 0).slice(0, maxTrees);
    } else if (performance === 'medium') {
      // Keep 50% of trees in medium performance mode
      filteredTrees = trees.filter((_, i) => i % 2 === 0).slice(0, maxTrees);
    } else {
      // Still limit total tree count in high performance mode
      filteredTrees = trees.slice(0, maxTrees);
    }
    
    return filteredTrees;
  }, [buildingPositions, performance]);

  // Split trees by type for instanced rendering
  const treesByType = useMemo(() => {
    const normalTrees: typeof additionalTrees = [];
    const pineTrees: typeof additionalTrees = [];
    const bushes: typeof additionalTrees = [];
    
    additionalTrees.forEach(tree => {
      if (tree.type === 'normal') normalTrees.push(tree);
      else if (tree.type === 'pine') pineTrees.push(tree);
      else if (tree.type === 'bush') bushes.push(tree);
    });
    
    return { normalTrees, pineTrees, bushes };
  }, [additionalTrees]);

  // For low performance mode, use instanced rendering
  if (performance === 'low') {
    return (
      <group>
        {/* Normal Trees */}
        <Instances limit={treesByType.normalTrees.length}>
          {/* Trunk template */}
          <Box args={[0.3, 1.2, 0.3]} position={[0, 0.6, 0]}>
            <meshBasicMaterial color="#5D4037" />
          </Box>
          {/* Leaves template */}
          <Sphere args={[0.8, 4, 4]} position={[0, 1.6, 0]}>
            <meshBasicMaterial color="#4CAF50" />
          </Sphere>
          
          {treesByType.normalTrees.map((tree, index) => (
            <Instance key={`normal-tree-${index}`} position={tree.position} scale={tree.scale} />
          ))}
        </Instances>
        
        {/* Pine Trees */}
        <Instances limit={treesByType.pineTrees.length}>
          {/* Trunk template */}
          <Box args={[0.3, 1.5, 0.3]} position={[0, 0.75, 0]}>
            <meshBasicMaterial color="#5D4037" />
          </Box>
          {/* Pine template - simplified cone */}
          <Box args={[1, 2, 1]} position={[0, 2, 0]}>
            <meshBasicMaterial color="#2E7D32" />
          </Box>
          
          {treesByType.pineTrees.map((tree, index) => (
            <Instance key={`pine-tree-${index}`} position={tree.position} scale={tree.scale} />
          ))}
        </Instances>
        
        {/* Bushes */}
        <Instances limit={treesByType.bushes.length}>
          <Sphere args={[0.7, 4, 4]} position={[0, 0.7, 0]}>
            <meshBasicMaterial color="#388E3C" />
          </Sphere>
          
          {treesByType.bushes.map((tree, index) => (
            <Instance key={`bush-${index}`} position={tree.position} scale={tree.scale} />
          ))}
        </Instances>
      </group>
    );
  }

  // For medium and high performance, use individual trees
  return (
    <group>
      {additionalTrees.map((tree, index) => (
        <Tree
          key={`tree-${index}`}
          position={tree.position}
          type={tree.type}
          scale={tree.scale}
          performance={performance}
        />
      ))}
    </group>
  );
}

// Define the city layout with districts
const cityLayout = useMemo(() => {
  return {
    // Downtown/Central Business District
    downtown: {
      center: [0, 0, 0],
      radius: 50,
      buildingDensity: 0.8,
      maxHeight: 80,
      style: 'modern',
      buildingTypes: ['office', 'commercial', 'hotel', 'government'],
    },
    
    // Residential Districts
    residentialNorth: {
      center: [0, 0, 100],
      radius: 80,
      buildingDensity: 0.5,
      maxHeight: 30,
      style: 'modern',
      buildingTypes: ['apartment', 'house', 'duplex']
    },
    residentialEast: {
      center: [100, 0, 0],
      radius: 70,
      buildingDensity: 0.4,
      maxHeight: 25,
      style: 'classic',
      buildingTypes: ['house', 'apartment', 'townhouse']
    },
    residentialSouth: {
      center: [0, 0, -100],
      radius: 80,
      buildingDensity: 0.5,
      maxHeight: 30,
      style: 'modern',
      buildingTypes: ['apartment', 'house', 'duplex']
    },
    residentialWest: {
      center: [-100, 0, 0],
      radius: 70,
      buildingDensity: 0.4,
      maxHeight: 25,
      style: 'victorian', // Historical district
      buildingTypes: ['house', 'townhouse', 'mansion']
    },
    
    // Industrial Zone
    industrial: {
      center: [-80, 0, -80],
      radius: 40,
      buildingDensity: 0.6,
      maxHeight: 20,
      style: 'industrial',
      buildingTypes: ['factory', 'warehouse', 'logistics']
    },
    
    // Educational Campus
    campus: {
      center: [80, 0, 80],
      radius: 35,
      buildingDensity: 0.4,
      maxHeight: 25,
      style: 'modern',
      buildingTypes: ['education', 'research', 'dormitory']
    },
    
    // Entertainment District
    entertainment: {
      center: [50, 0, -50],
      radius: 30,
      buildingDensity: 0.6,
      maxHeight: 35,
      style: 'modern',
      buildingTypes: ['theater', 'mall', 'restaurant', 'stadium']
    },
    
    // Health District
    medical: {
      center: [-50, 0, 50],
      radius: 25,
      buildingDensity: 0.5,
      maxHeight: 30,
      style: 'modern',
      buildingTypes: ['hospital', 'clinic', 'pharmacy']
    }
  };
}, []);

// Parks - larger, more strategic placement
const cityParks = useMemo(() => {
  return [
    // Central Park
    {
      position: [0, 0, 0],
      size: [60, 1, 60],
      theme: 'classic',
    },
    // North Park
    {
      position: [0, 0, 120],
      size: [40, 1, 30],
      theme: 'natural',
    },
    // East Recreational Area
    {
      position: [120, 0, 0],
      size: [30, 1, 40],
      theme: 'modern',
    },
    // South Plaza
    {
      position: [0, 0, -120],
      size: [35, 1, 35],
      theme: 'classic',
    },
    // West Historical Garden
    {
      position: [-120, 0, 0],
      size: [40, 1, 30],
      theme: 'natural',
    },
    // Northeast Community Park
    {
      position: [50, 0, 50],
      size: [25, 1, 25],
      theme: 'classic',
    },
    // Southwest Entertainment Plaza
    {
      position: [-50, 0, -50],
      size: [20, 1, 20],
      theme: 'modern',
    },
    // Northwest Medical Garden
    {
      position: [-50, 0, 50],
      size: [15, 1, 15],
      theme: 'natural',
    },
    // Southeast Campus Quad
    {
      position: [50, 0, -50],
      size: [20, 1, 20],
      theme: 'modern',
    }
  ];
}, []);

// Street layout with main roads and secondary streets
const streetLayout = useMemo(() => {
  const streets = [];
  
  // Main roads - wider, more defined
  // North-South Main Avenue
  streets.push({
    start: [0, 0.1, -200],
    end: [0, 0.1, 200],
    width: 12,
    type: 'main'
  });
  
  // East-West Main Boulevard
  streets.push({
    start: [-200, 0.1, 0],
    end: [200, 0.1, 0],
    width: 12,
    type: 'main'
  });
  
  // Secondary roads - grid pattern with variations
  const secondaryRoadWidth = 8;
  const spacing = 40; // Block size
  
  // Create a grid of secondary roads
  for (let i = -160; i <= 160; i += spacing) {
    if (Math.abs(i) < 15) continue; // Skip where main roads are
    
    // North-South streets
    streets.push({
      start: [i, 0.1, -200],
      end: [i, 0.1, 200],
      width: secondaryRoadWidth,
      type: 'secondary'
    });
    
    // East-West streets
    streets.push({
      start: [-200, 0.1, i],
      end: [200, 0.1, i],
      width: secondaryRoadWidth,
      type: 'secondary'
    });
  }
  
  // Diagonal boulevards for visual interest
  streets.push({
    start: [-150, 0.1, -150],
    end: [150, 0.1, 150],
    width: 10,
    type: 'boulevard'
  });
  
  streets.push({
    start: [-150, 0.1, 150],
    end: [150, 0.1, -150],
    width: 10,
    type: 'boulevard'
  });
  
  return streets;
}, []);

// Street light placement along roads
const streetLights = useMemo(() => {
  const lights = [];
  const spacing = 30; // Distance between street lights
  
  // Place lights along main roads
  for (let pos = -180; pos <= 180; pos += spacing) {
    // Lights along North-South main road
    if (Math.abs(pos) > 10) { // Avoid placing lights at intersection
      lights.push({
        position: [6, 0, pos], // Right side of road
        style: 'modern',
        height: 6
      });
      
      lights.push({
        position: [-6, 0, pos], // Left side of road
        style: 'modern',
        height: 6
      });
    }
    
    // Lights along East-West main road
    if (Math.abs(pos) > 10) { // Avoid placing lights at intersection
      lights.push({
        position: [pos, 0, 6], // Right side of road
        style: 'modern',
        height: 6
      });
      
      lights.push({
        position: [pos, 0, -6], // Left side of road
        style: 'modern',
        height: 6
      });
    }
  }
  
  // Place lights along secondary roads
  const secondarySpacing = 40;
  for (let i = -160; i <= 160; i += secondarySpacing) {
    if (Math.abs(i) < 20) continue; // Skip main road areas
    
    for (let j = -160; j <= 160; j += secondarySpacing) {
      if (Math.abs(j) < 20) continue; // Skip main road areas
      
      // Determine style based on district
      let style: StreetLightStyle = 'modern';
      
      // Western residential gets Victorian style
      if (i < -50 && Math.abs(j) < 100) {
        style = 'victorian';
      } 
      // Downtown gets modern style
      else if (Math.abs(i) < 50 && Math.abs(j) < 50) {
        style = 'modern';
      }
      // Other areas get classic style
      else {
        style = 'classic';
      }
      
      lights.push({
        position: [i, 0, j],
        style,
        height: 5
      });
    }
  }
  
  return lights;
}, []);

// Vehicle routes based on street layout
const vehicles = useMemo(() => {
  const vehicles = [];
  const vehicleCount = 30; // Default to high performance
  
  // Vehicle types and their probabilities
  const vehicleTypes: VehicleType[] = ['car', 'car', 'car', 'bus', 'truck']; // 60% cars, 20% buses, 20% trucks
  
  for (let i = 0; i < vehicleCount; i++) {
    // Randomly select a lane
    const lanes = ['north-south', 'south-north', 'east-west', 'west-east'] as const;
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    
    // Randomly select vehicle type
    const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    
    // Speed variation
    const speed = 0.5 + Math.random() * 0.5;
    
    vehicles.push({
      lane,
      type,
      speed
    });
  }
  
  return vehicles;
}, []);

// People group distribution
const peopleGroups = useMemo(() => {
  const groups = [];
  
  // Downtown plaza
  groups.push({
    centerPosition: [0, 0, 0],
    radius: 20,
    count: 15 // Default to high quality
  });
  
  // Shopping district
  groups.push({
    centerPosition: [40, 0, -40],
    radius: 15,
    count: 12 // Default to high quality
  });
  
  // Campus area
  groups.push({
    centerPosition: [80, 0, 80],
    radius: 20,
    count: 14 // Default to high quality
  });
  
  // Park visitors
  groups.push({
    centerPosition: [-40, 0, 40],
    radius: 15,
    count: 10 // Default to high quality
  });
  
  return groups;
}, []);

export function CityModel() {
  const [rainIntensity, setRainIntensity] = useState(0);
  const [isDaytime, setIsDaytime] = useState(true);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<number | null>(null);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const [fps, setFps] = useState(60);
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rainy'>('clear');
  const [nextWeatherChange, setNextWeatherChange] = useState(60);
  const [season, setSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('summer');
  const [windStrength, setWindStrength] = useState(0);
  const sunRef = useRef<DirectionalLight>(null);
  const [activeEffects, setActiveEffects] = useState({
    lights: true,
    vehicles: true,
    people: true,
    shadows: true
  });
  
  const { 
    building3DData,
    selectedBuildingId,
    constructionVizData,
    setHoveredBuildingId: appStoreSetHoveredBuildingId,
    setSelectedBuildingId,
    cameraView,
    showLabels,
    isDaytime: appStoreIsDaytime,
    filters
  } = useAppStore();
  
  // Épületek pozícióinak kinyerése
  const buildingPositions = useMemo(() => {
    if (!building3DData) return [];
    
    return building3DData.map(building => ({
      id: building.id,
      position: [building.position.x, building.position.y, building.position.z],
      scale: [building.scale.x, building.scale.y, building.scale.z],
      zoneType: building.buildingType
    }));
  }, [building3DData]);
  
  // Create a reference to hold the time of day
  const timeRef = useRef({
    lastTimeChange: Date.now(),
    dayDuration: 120000, // 2 minutes of daytime
    nightDuration: 60000, // 1 minute of nighttime
    lastSeasonChange: Date.now(),
    seasonDuration: 300000, // 5 minutes per season
    seasonCycle: ['spring', 'summer', 'autumn', 'winter'] as const
  });
  
  // Check if any building is selected
  const isAnyBuildingSelected = selectedBuildingId !== null;
  
  // Function to handle building hover for UI feedback
  const handleBuildingHover = (id: number, isHovered: boolean) => {
    if (isHovered) {
      setHoveredBuildingId(id);
    } else if (hoveredBuildingId === id) {
      setHoveredBuildingId(null);
    }
  };
  
  // Effect to automatically change the time of day
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const { lastTimeChange, dayDuration, nightDuration } = timeRef.current;
      const elapsed = currentTime - lastTimeChange;
      
      if (appStoreIsDaytime && elapsed >= dayDuration) {
        setIsDaytime(false);
        timeRef.current.lastTimeChange = currentTime;
      } else if (!appStoreIsDaytime && elapsed >= nightDuration) {
        setIsDaytime(true);
        timeRef.current.lastTimeChange = currentTime;
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [appStoreIsDaytime]);
  
  // Effect to manage seasonal changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const { lastSeasonChange, seasonDuration, seasonCycle } = timeRef.current;
      const elapsed = currentTime - lastSeasonChange;
      
      if (elapsed >= seasonDuration) {
        // Get current season index and calculate next season
        const currentIndex = seasonCycle.indexOf(season);
        const nextIndex = (currentIndex + 1) % seasonCycle.length;
        setSeason(seasonCycle[nextIndex]);
        
        // Update the last change time
        timeRef.current.lastSeasonChange = currentTime;
        
        // Apply season-specific effects
        if (seasonCycle[nextIndex] === 'winter') {
          // Higher chance of cloudy/rainy weather in winter
          if (Math.random() < 0.5) {
            setWeather('cloudy');
          }
          // Less wind in winter
          setWindStrength(Math.random() * 0.3);
        } else if (seasonCycle[nextIndex] === 'autumn') {
          // Strong winds in autumn
          setWindStrength(0.5 + Math.random() * 0.5);
        } else if (seasonCycle[nextIndex] === 'spring') {
          // Moderate wind and higher chance of rain in spring
          setWindStrength(0.3 + Math.random() * 0.3);
          if (Math.random() < 0.4) {
            setWeather('rainy');
            setRainIntensity(0.3 + Math.random() * 0.4);
          }
        } else if (seasonCycle[nextIndex] === 'summer') {
          // Light winds in summer
          setWindStrength(0.1 + Math.random() * 0.2);
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [season]);
  
  // Effect to periodically change weather conditions
  useEffect(() => {
    // Random time between weather changes (between 30s and 2min)
    const minInterval = 30000;
    const maxInterval = 120000;
    
    const getNextWeatherInterval = () => {
      return minInterval + Math.random() * (maxInterval - minInterval);
    };
    
    let timeout: NodeJS.Timeout;
    
    const changeWeather = () => {
      // Base chance of rain depends on the season
      const baseRainChance = season === 'spring' ? 0.4 :
                             season === 'summer' ? 0.2 :
                             season === 'autumn' ? 0.3 :
                             0.5; // winter
      
      // Random weather selection with seasonal adjustments
      const weatherRoll = Math.random();
      if (weatherRoll < baseRainChance) {
        // Rainy weather
        setWeather('rainy');
        // Rain intensity varies by season
        const maxIntensity = season === 'summer' ? 0.7 : 1.0;
        const minIntensity = season === 'summer' ? 0.3 : 0.5;
        const intensity = minIntensity + Math.random() * (maxIntensity - minIntensity);
        setRainIntensity(intensity);
        
        // Wind increases during rain
        const baseWindStrength = windStrength;
        const rainWindIncrease = 0.2 + Math.random() * 0.3;
        setWindStrength(Math.min(1.0, baseWindStrength + rainWindIncrease));
        
        // Rain lasts between 15s and 45s
        const rainDuration = 15000 + Math.random() * 30000;
        
        // Schedule end of rain
        timeout = setTimeout(() => {
          // Gradually reduce rain
          const fadeSteps = 10;
          const stepDuration = 500;
          
          for (let i = 0; i < fadeSteps; i++) {
            setTimeout(() => {
              const newIntensity = intensity * (1 - (i + 1) / fadeSteps);
              setRainIntensity(newIntensity);
              
              // Wind reduces as rain stops
              if (i === fadeSteps - 1) {
                setWindStrength(Math.max(0.1, baseWindStrength));
                setWeather('cloudy');
                // Clear weather after cloud period
                setTimeout(() => {
                  setWeather('clear');
                  timeout = setTimeout(changeWeather, getNextWeatherInterval());
                }, 10000 + Math.random() * 20000);
              }
            }, i * stepDuration);
          }
        }, rainDuration);
      } else if (weatherRoll < baseRainChance + 0.3) {
        // Cloudy weather
        setWeather('cloudy');
        setRainIntensity(0);
        
        // Wind during cloudy periods
        const cloudyWindFactor = 0.3 + Math.random() * 0.4;
        setWindStrength(cloudyWindFactor);
        
        // Duration of cloudy period
        const cloudyDuration = 20000 + Math.random() * 40000;
        
        timeout = setTimeout(() => {
          setWeather('clear');
          // Wind reduces as clouds clear
          setWindStrength(Math.max(0.1, windStrength * 0.7));
          timeout = setTimeout(changeWeather, getNextWeatherInterval());
        }, cloudyDuration);
      } else {
        // Clear weather, schedule next change
        setWeather('clear');
        setRainIntensity(0);
        
        // Base wind for clear weather depending on season
        const clearWindFactor = season === 'winter' ? 0.1 + Math.random() * 0.2 :
                              season === 'autumn' ? 0.3 + Math.random() * 0.4 :
                              season === 'spring' ? 0.2 + Math.random() * 0.3 :
                              0.1 + Math.random() * 0.2; // summer
        setWindStrength(clearWindFactor);
        
        timeout = setTimeout(changeWeather, getNextWeatherInterval());
      }
    };
    
    // Start the weather cycle
    timeout = setTimeout(changeWeather, getNextWeatherInterval());
    
    return () => {
      clearTimeout(timeout);
    };
  }, [season, windStrength]);
  
  // Choose performance level based on device capability (once on mount)
  useEffect(() => {
    // Check if device is likely mobile/low-powered
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Initial performance level
    if (isMobile) {
      setPerformanceMode('low');
    } else {
      // For desktop, start with high and let the PerformanceMonitor adjust
      setPerformanceMode('high');
    }
  }, []);
  
  // Memoize building ID to data lookup for performance
  const buildingLookup = useMemo(() => {
    const lookup: Record<number, typeof building3DData[0]> = {};
    building3DData.forEach(building => {
      lookup[building.id] = building;
    });
    return lookup;
  }, [building3DData]);
  
  // Throttle state updates
  const [lastPerformanceUpdate, setLastPerformanceUpdate] = useState(0);
  const [fpsCounter, setFpsCounter] = useState(0);
  
  // Optimized frame tracking
  useFrame(({ clock }) => {
    // Only update FPS every second
    if (clock.elapsedTime - lastPerformanceUpdate > 1) {
      setLastPerformanceUpdate(clock.elapsedTime);
      
      // Adjust performance mode based on framerate
      if (fpsCounter < 25 && performanceMode !== 'low') {
        setPerformanceMode('low');
      } else if (fpsCounter >= 25 && fpsCounter < 45 && performanceMode !== 'medium') {
        setPerformanceMode('medium');
      } else if (fpsCounter >= 45 && performanceMode !== 'high') {
        setPerformanceMode('high');
      }
      
      // Reset counter
      setFpsCounter(0);
    } else {
      setFpsCounter(fpsCounter + 1);
    }
  });
  
  // Dynamically cull objects based on camera position
  const [visibleArea, setVisibleArea] = useState({ x: [-150, 150], z: [-150, 150] });
  
  // Update visible area based on camera position
  useFrame(({ camera }) => {
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;
    const viewDistance = performanceMode === 'low' ? 150 : (performanceMode === 'medium' ? 200 : 250);
    
    setVisibleArea({
      x: [cameraX - viewDistance, cameraX + viewDistance],
      z: [cameraZ - viewDistance, cameraZ + viewDistance]
    });
  });
  
  // Filter objects based on visibility
  const visibleBuildings = useMemo(() => {
    if (!building3DData) return [];
    
    return building3DData.filter(building => {
      const x = building.position.x;
      const z = building.position.z;
      
      return x >= visibleArea.x[0] && x <= visibleArea.x[1] && 
             z >= visibleArea.z[0] && z <= visibleArea.z[1];
    });
  }, [building3DData, visibleArea]);
  
  const visibleConstructions = useMemo(() => {
    if (!constructionVizData) return [];
    
    return constructionVizData.filter(construction => {
      const x = construction.position.x;
      const z = construction.position.z;
      
      return x >= visibleArea.x[0] && x <= visibleArea.x[1] && 
             z >= visibleArea.z[0] && z <= visibleArea.z[1];
    });
  }, [constructionVizData, visibleArea]);
  
  // Add memory cleanup on component unmount
  useEffect(() => {
    // Cache for textures and geometries to avoid duplicates
    const textureCache = new Map();
    const geometryCache = new Map();
    
    // Cleanup function to dispose resources
    return () => {
      // Dispose textures
      textureCache.forEach((texture) => {
        if (texture && texture.dispose) {
          texture.dispose();
        }
      });
      textureCache.clear();
      
      // Dispose geometries
      geometryCache.forEach((geometry) => {
        if (geometry && geometry.dispose) {
          geometry.dispose();
        }
      });
      geometryCache.clear();
    };
  }, []);
  
  // Throttle rendering FPS when not focused to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is not visible, reduce update rate
        if (performanceMode !== 'low') {
          setPerformanceMode('low');
        }
      } else {
        // Page is visible again, resume normal performance after short delay
        setTimeout(() => {
          // Only change if still visible after delay
          if (!document.hidden) {
            // Resume previous performance setting from before hiding
            if (performanceMode === 'low') {
              setPerformanceMode('medium');
            }
          }
        }, 1000);
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performanceMode, setPerformanceMode]);
  
  // Throttle frame rate when not interacting
  const [lastInteraction, setLastInteraction] = useState<number>(Date.now());
  
  useEffect(() => {
    const handleUserInteraction = () => {
      setLastInteraction(Date.now());
    };
    
    // Add event listeners for common interaction events
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('wheel', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
  
  // Lower FPS when not interacting for 10 seconds
  useFrame(() => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteraction;
    
    // If no interaction for 10 seconds and not in low performance mode
    if (timeSinceLastInteraction > 10000 && performanceMode !== 'low') {
      // Throttle to low performance mode
      setPerformanceMode('low');
    } 
    // If recent interaction and not in at least medium mode
    else if (timeSinceLastInteraction < 1000 && performanceMode === 'low') {
      // Restore to at least medium performance 
      setPerformanceMode('medium');
    }
  });
  
  // Loading state UI
  if (isLoading.epuletek) {
    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <Text
          color="white"
          fontSize={1}
          maxWidth={200}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          anchorX="center"
          anchorY="middle"
        >
          Adatok betöltése...
        </Text>
      </div>
    );
  }
  
  // Error state UI
  if (errors.epuletek) {
    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <Text
          color="red"
          fontSize={0.5}
          maxWidth={200}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          anchorX="center"
          anchorY="middle"
        >
          Hiba történt az adatok betöltésekor!
        </Text>
      </div>
    );
  }
  
  return (
    <group>
      {/* Adaptive performance - using more aggressive thresholds */}
      <PerformanceMonitor
        onIncline={() => {
          if (performanceMode === 'low') setPerformanceMode('medium');
          else if (performanceMode === 'medium') setPerformanceMode('high');
        }}
        onDecline={() => {
          if (performanceMode === 'high') setPerformanceMode('medium');
          else if (performanceMode === 'medium') setPerformanceMode('low');
        }}
        bounds={[30, 40, 50]} // Lower thresholds for performance changes
      >
        <AdaptiveDpr pixelated />
      </PerformanceMonitor>
      
      {/* Kamera beállítása */}
      <PerspectiveCamera 
        makeDefault 
        position={cameraView === 'isometric' ? [40, 40, 40] : [0, 60, 0.001]} 
        fov={cameraView === 'isometric' ? 50 : 60}
        near={0.1}
        far={1000}
      />
      <OrbitControls 
        makeDefault 
        target={[0, 0, 0]}
        enableDamping 
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={5}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        minPolarAngle={0.1} // Prevent going to exact top view (0)
      />
      
      {/* Ég és környezet */}
      <Environment preset="city" />
      <Sky 
        distance={450000} 
        sunPosition={isDaytime ? [100, 100, 100] : [0, -100, -100]} 
        inclination={isDaytime ? 0.5 : 0.2}
        azimuth={0.25}
        mieCoefficient={isDaytime ? 0.005 : 0.001}
        mieDirectionalG={isDaytime ? 0.8 : 0.7}
        rayleigh={isDaytime ? 0.5 : 0.2}
        turbidity={isDaytime ? 10 : 20}
      />
      
      {/* Csillagok éjszaka */}
      {!isDaytime && (
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          fade
        />
      )}
      
      {/* Nap / Napfény */}
      <directionalLight
        ref={sunRef}
        position={isDaytime ? [50, 100, 50] : [-50, -200, -50]}
        intensity={isDaytime ? 1 : 0.1}
        color={isDaytime ? "#FFFFFF" : "#102080"}
        castShadow={activeEffects.shadows && isDaytime && performanceMode !== 'low'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      
      {/* Ambiens fény - mindig jelen */}
      <ambientLight 
        intensity={isDaytime ? 0.5 : 0.2} 
        color={isDaytime ? "#C0E0FF" : "#050A24"} 
      />
      
      {/* Éjszakai hangulatfény */}
      {!isDaytime && (
        <pointLight
          position={[0, 50, 0]}
          intensity={0.3}
          color="#2040C0"
          distance={300}
          decay={2}
        />
      )}
      
      {/* Időjárás */}
      <Weather 
        type={weather} 
        intensity={weather === 'cloudy' ? 0.5 : weather === 'rainy' ? rainIntensity : 0}
        isDaytime={isDaytime}
        performance={performanceMode}
      />
      
      {/* Pályaszínt */}
      <Ground 
        rainIntensity={weather === 'rainy' ? rainIntensity : 0} 
        isDaytime={isDaytime}
        performance={performanceMode}
      />
      
      {/* Erdő és növényzet */}
      <ForestLayer 
        performance={performanceMode} 
        buildingPositions={buildingPositions}
        season={season}
        windStrength={windStrength}
      />
      
      {/* Minden épület */}
      {visibleBuildings?.map(building => (
        <Building
          key={building.id}
          building={building}
          isHovered={building.id === hoveredBuildingId}
          isSelected={building.id === selectedBuildingId}
          onHover={(isOver: boolean) => handleBuildingHover(building.id, isOver)}
          performance={performanceMode} 
        />
      ))}
      
      {/* Építési projektek */}
      {visibleConstructions?.map(construction => (
        <ConstructionSite
          key={construction.id}
          construction={construction}
          isHovered={construction.id === hoveredBuildingId}
          isSelected={construction.id === selectedBuildingId}
          onHover={(isOver: boolean) => handleBuildingHover(construction.id, isOver)}
          performance={performanceMode}
        />
      ))}
      
      {/* Parkok elhelyezése */}
      {cityParks.map((park, index) => (
        <Park
          key={`park-${index}`}
          position={park.position as [number, number, number]}
          size={park.size as [number, number, number]}
          performance={performanceMode}
          theme={park.theme}
        />
      ))}
      
      {/* Utcai lámpák */}
      {activeEffects.lights && streetLights.map((light, index) => (
        <StreetLight
          key={`light-${index}`}
          position={light.position}
          style={light.style}
          height={light.height}
          performance={performanceMode}
        />
      ))}
      
      {/* Járművek */}
      {activeEffects.vehicles && vehicles.map((vehicle, index) => (
        <Vehicle
          key={`vehicle-${index}`}
          lane={vehicle.lane}
          speed={vehicle.speed}
          type={vehicle.type}
          performance={performanceMode}
        />
      ))}
      
      {/* Emberek csoportjai */}
      {activeEffects.people && peopleGroups.map((group, index) => (
        <PeopleGroup
          key={`people-${index}`}
          centerPosition={group.centerPosition}
          radius={group.radius}
          count={group.count}
          performance={performanceMode}
        />
      ))}
      
      {/* Shadow optimization - only in high performance */}
      {activeEffects.shadows && performanceMode === 'high' && <BakeShadows />}
    </group>
  );
} 