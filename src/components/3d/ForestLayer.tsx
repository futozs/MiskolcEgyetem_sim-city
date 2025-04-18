'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { Tree } from './Tree';
import { AdvancedTree, Season, TreeType } from './AdvancedTree';
import { VegetationPatch, VegetationType } from './Vegetation';

// Advanced Forest component to add nature elements throughout the city
export function ForestLayer({ 
  performance = 'high', 
  buildingPositions = [],
  season = 'summer',
  windStrength = 0
}: { 
  performance?: 'high' | 'medium' | 'low',
  buildingPositions?: Array<{
    id: number,
    position: number[],
    scale: number[],
    zoneType?: string
  }>,
  season?: Season,
  windStrength?: number
}) {
  // Generate tree positions that don't interfere with buildings
  const additionalTrees = useMemo(() => {
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
      centralParkNorth: { 
        x: [-20, 20], 
        z: [60, 150], 
        density: 0.8,
        types: [
          { type: 'oak' as TreeType, weight: 5 },
          { type: 'maple' as TreeType, weight: 3 },
          { type: 'pine' as TreeType, weight: 2 },
          { type: 'birch' as TreeType, weight: 3 }
        ] 
      },
      centralParkSouth: { 
        x: [-20, 20], 
        z: [-150, -60], 
        density: 0.8,
        types: [
          { type: 'oak' as TreeType, weight: 4 },
          { type: 'maple' as TreeType, weight: 4 },
          { type: 'willow' as TreeType, weight: 2 },
          { type: 'birch' as TreeType, weight: 3 }
        ] 
      },
      
      // Residential areas with yard trees
      residentialWest: { 
        x: [-150, -30], 
        z: [-150, 150], 
        density: 0.4,
        types: [
          { type: 'oak' as TreeType, weight: 3 },
          { type: 'maple' as TreeType, weight: 3 },
          { type: 'birch' as TreeType, weight: 2 }
        ] 
      },
      
      // Commercial district with sparse decorative trees
      commercialEast: { 
        x: [30, 150], 
        z: [-50, 50], 
        density: 0.25,
        types: [
          { type: 'birch' as TreeType, weight: 4 },
          { type: 'maple' as TreeType, weight: 2 }
        ] 
      },
      
      // Government area with formal arranged trees
      governmentNE: { 
        x: [30, 150], 
        z: [60, 150], 
        density: 0.3,
        types: [
          { type: 'pine' as TreeType, weight: 5 },
          { type: 'oak' as TreeType, weight: 2 }
        ] 
      },
      
      // Education zone with campus-like tree arrangement
      educationSE: { 
        x: [30, 150], 
        z: [-150, -60], 
        density: 0.4,
        types: [
          { type: 'oak' as TreeType, weight: 3 },
          { type: 'maple' as TreeType, weight: 3 },
          { type: 'birch' as TreeType, weight: 3 }
        ] 
      },
      
      // Central plaza with formal tree arrangements
      centralPlaza: { 
        x: [-20, 20], 
        z: [-50, 50], 
        density: 0.3,
        types: [
          { type: 'maple' as TreeType, weight: 4 },
          { type: 'birch' as TreeType, weight: 3 }
        ] 
      },
      
      // Road medians with small trees
      mainRoadNS: { 
        x: [-5, 5], 
        z: [-150, 150], 
        density: 0.15,
        types: [
          { type: 'birch' as TreeType, weight: 6 }
        ] 
      },
      
      mainRoadEW: { 
        x: [-150, 150], 
        z: [-5, 5], 
        density: 0.15,
        types: [
          { type: 'birch' as TreeType, weight: 6 }
        ] 
      },
    };
    
    // Trees array to store all generated trees
    const trees: Array<{
      position: [number, number, number],
      type: TreeType,
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
    
    // Function to choose a tree type based on the zone's type distribution
    const chooseTreeType = (types: Array<{ type: TreeType, weight: number }>, seed: number) => {
      // Calculate total weight
      const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
      
      // Generate a random value based on the seed and modulo by total weight
      const randomValue = seed % totalWeight;
      
      // Select a type based on the weights
      let cumulativeWeight = 0;
      for (const typeInfo of types) {
        cumulativeWeight += typeInfo.weight;
        if (randomValue < cumulativeWeight) {
          return typeInfo.type;
        }
      }
      
      // Fallback to the first type
      return types[0].type;
    };
    
    // Generate trees for each zone
    Object.entries(cityZones).forEach(([zoneName, zone]) => {
      const { x, z, density, types } = zone;
      const zoneWidth = x[1] - x[0];
      const zoneDepth = z[1] - z[0];
      
      // Calculate grid size based on zone density
      const gridSpacing = performance === 'low' ? 12 : performance === 'medium' ? 8 : 6;
      
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
          if (isTooCloseToBuilding(new Vector3(finalX, 0, finalZ), 2.5)) continue;
          
          // Choose tree type based on zone
          const treeType = chooseTreeType(types, posHash);
          
          // Vary scale by type and with deterministic randomness
          let treeScale = 1.0;
          
          if (treeType === 'oak') {
            treeScale = 0.8 + (posHash % 5) / 10; // 0.8 to 1.3
          } else if (treeType === 'pine') {
            treeScale = 1.0 + (posHash % 6) / 10; // 1.0 to 1.6
          } else if (treeType === 'maple') {
            treeScale = 0.9 + (posHash % 5) / 10; // 0.9 to 1.4
          } else if (treeType === 'birch') {
            treeScale = 0.7 + (posHash % 4) / 10; // 0.7 to 1.1
          } else if (treeType === 'willow') {
            treeScale = 1.1 + (posHash % 5) / 10; // 1.1 to 1.6
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
        { x: [-12, -8], z: [-140, 140], spacing: 10, type: 'birch' as TreeType, scale: 0.9 },
        { x: [8, 12], z: [-140, 140], spacing: 10, type: 'birch' as TreeType, scale: 0.9 },
        
        // East-West main boulevard trees
        { x: [-140, 140], z: [-12, -8], spacing: 10, type: 'birch' as TreeType, scale: 0.9 },
        { x: [-140, 140], z: [8, 12], spacing: 10, type: 'birch' as TreeType, scale: 0.9 },
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
            if (posHash % 9 === 0) continue;
            
            trees.push({
              position: [xPos + offsetX, 0, zPos],
              type: type,
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
            if (posHash % 9 === 0) continue;
            
            trees.push({
              position: [xPos, 0, zPos + offsetZ],
              type: type,
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
    
    // Return all trees with optimized count based on performance
    let result = trees;
    
    // Limit tree count based on performance
    if (performance === 'low') {
      // Keep only 50% of trees in low performance mode
      result = trees.filter((_, i) => i % 2 === 0);
    } else if (performance === 'medium') {
      // Keep 80% of trees in medium performance mode
      result = trees.filter((_, i) => i % 5 !== 1);
    }
    
    return result;
  }, [buildingPositions, performance]);
  
  // Vegetation and bushes for ground cover
  const groundVegetation = useMemo(() => {
    const vegetation = [];
    const vegetationCount = performance === 'low' ? 150 : performance === 'medium' ? 400 : 650;
    
    // Generate ground vegetation
    for (let i = 0; i < vegetationCount; i++) {
      // Deterministic random position
      const seed = i * 1357;
      const x = (seed % 300) - 150;
      const z = ((seed * 13) % 300) - 150;
      
      // Skip if close to a building
      const pos = new Vector3(x, 0, z);
      let tooClose = false;
      
      // Check distance to buildings
      for (const building of buildingPositions) {
        const buildingPos = new Vector3(building.position[0], 0, building.position[2]);
        const buildingRadius = Math.max(building.scale[0], building.scale[2]) * 3;
        
        if (pos.distanceTo(buildingPos) < buildingRadius) {
          tooClose = true;
          break;
        }
      }
      
      if (tooClose) continue;
      
      // Skip if on a road
      if (Math.abs(x) < 8 && Math.abs(z) < 150) continue;
      if (Math.abs(z) < 8 && Math.abs(x) < 150) continue;
      
      // Only add vegetation in park-like areas
      const inParkArea = 
        (x > -20 && x < 20 && z > 60 && z < 150) || // centralParkNorth
        (x > -20 && x < 20 && z < -60 && z > -150); // centralParkSouth
        
      if (!inParkArea && seed % 3 !== 0) continue;
      
      vegetation.push({
        position: [x, 0, z] as [number, number, number],
        scale: 0.3 + (seed % 10) / 20,
        rotation: seed % 360
      });
    }
    
    return vegetation;
  }, [buildingPositions, performance]);

  // Vegetation patches for more detailed areas
  const vegetationPatches = useMemo(() => {
    const patches = [];
    
    // Park areas with rich vegetation
    const parkAreas = [
      { x: 0, z: 100, radius: 15, types: ['grass', 'flower', 'bush'] as VegetationType[], density: 1.2 }, // North park
      { x: 0, z: -100, radius: 15, types: ['grass', 'flower', 'bush', 'fern'] as VegetationType[], density: 1.3 }, // South park
    ];
    
    // Add vegetation to parks
    parkAreas.forEach((park, i) => {
      patches.push({
        position: [park.x, 0, park.z] as [number, number, number],
        radius: park.radius,
        types: park.types,
        density: park.density,
        id: `park-${i}`
      });
    });
    
    // Road sides with grass and flowers
    if (performance !== 'low') {
      // North-South road sides
      for (let z = -120; z <= 120; z += 40) {
        if (Math.abs(z) < 20) continue; // Skip central area
        
        patches.push({
          position: [-12, 0, z] as [number, number, number],
          radius: 3,
          types: ['grass', 'flower'] as VegetationType[],
          density: 0.7,
          id: `road-ns-left-${z}`
        });
        
        patches.push({
          position: [12, 0, z] as [number, number, number],
          radius: 3,
          types: ['grass', 'flower'] as VegetationType[],
          density: 0.7,
          id: `road-ns-right-${z}`
        });
      }
      
      // East-West road sides
      for (let x = -120; x <= 120; x += 40) {
        if (Math.abs(x) < 20) continue; // Skip central area
        
        patches.push({
          position: [x, 0, -12] as [number, number, number],
          radius: 3,
          types: ['grass', 'flower'] as VegetationType[],
          density: 0.7,
          id: `road-ew-top-${x}`
        });
        
        patches.push({
          position: [x, 0, 12] as [number, number, number],
          radius: 3,
          types: ['grass', 'flower'] as VegetationType[],
          density: 0.7,
          id: `road-ew-bottom-${x}`
        });
      }
    }
    
    // Forest areas with ferns and mushrooms
    const forestAreas = [
      { x: -100, z: 100, radius: 20, types: ['fern', 'mushroom', 'bush'] as VegetationType[], density: 0.8 }, // Northwest forest
      { x: 100, z: -100, radius: 20, types: ['fern', 'mushroom', 'bush'] as VegetationType[], density: 0.6 }, // Southeast forest
    ];
    
    // Add vegetation to forest areas
    if (performance !== 'low') {
      forestAreas.forEach((forest, i) => {
        patches.push({
          position: [forest.x, 0, forest.z] as [number, number, number],
          radius: forest.radius,
          types: forest.types,
          density: forest.density,
          id: `forest-${i}`
        });
      });
    }
    
    return patches;
  }, [performance]);

  return (
    <group>
      {/* Trees with seasonal changes */}
      {additionalTrees.map((tree, index) => (
        <AdvancedTree
          key={`advanced-tree-${index}`}
          position={tree.position}
          type={tree.type}
          scale={tree.scale}
          season={season}
          windStrength={windStrength}
          performance={performance}
        />
      ))}
      
      {/* Vegetation patches for detailed areas */}
      {vegetationPatches.map(patch => (
        <VegetationPatch
          key={patch.id}
          position={patch.position}
          radius={patch.radius}
          types={patch.types}
          density={patch.density}
          season={season}
          windStrength={windStrength}
          performance={performance}
        />
      ))}
      
      {/* Ground vegetation (simplified for performance) */}
      {groundVegetation.map((item, index) => (
        <group 
          key={`vegetation-${index}`}
          position={item.position}
          rotation={[0, item.rotation * Math.PI / 180, 0]}
          scale={item.scale}
        >
          {/* Simple grass clump */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.3, 4, 4]} />
            <meshStandardMaterial 
              color={season === 'winter' ? "#CCCCCC" : 
                    season === 'autumn' ? "#BB8844" : 
                    season === 'spring' ? "#88CC88" : 
                    "#44AA44"}
              roughness={0.8}
              metalness={0.1}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
} 