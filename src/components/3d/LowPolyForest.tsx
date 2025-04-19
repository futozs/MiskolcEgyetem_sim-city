'use client';

import { useRef, useMemo } from 'react';
import { Box } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';

// Building data type for positioning
interface BuildingPosition {
  id: number;
  position: [number, number, number];
  scale: [number, number, number];
  type?: string;
}

// Tree type definition
type TreeType = 'normal' | 'pine' | 'bush' | 'autumn' | 'yellow' | 'red';

// Component for a single low-poly tree
function LowPolyTree({ 
  position, 
  type = 'normal', 
  scale = 1 
}: {
  position: [number, number, number];
  type?: TreeType;
  scale?: number;
}) {
  // Add a random offset for tree variation
  const randomOffset = useMemo(() => {
    return (Math.random() - 0.5) * 0.2;
  }, []);

  // Enhanced tree colors
  const trunkColor = useMemo(() => {
    const randomVariation = Math.random() * 0.1;
    return type === 'pine' 
      ? `rgb(${Math.round(70 + randomVariation * 20)}, ${Math.round(50 + randomVariation * 10)}, ${Math.round(40 + randomVariation * 10)})`
      : `rgb(${Math.round(120 + randomVariation * 30)}, ${Math.round(85 + randomVariation * 20)}, ${Math.round(70 + randomVariation * 15)})`;
  }, [type]);

  // Enhanced leaf colors with seasonal variations
  const leafColor = useMemo(() => {
    const randomVariation = Math.random() * 0.15;
    
    switch(type) {
      case 'pine':
        return `rgb(${Math.round(40 + randomVariation * 20)}, ${Math.round(100 + randomVariation * 40)}, ${Math.round(40 + randomVariation * 20)})`;
      case 'autumn':
        return `rgb(${Math.round(180 + randomVariation * 40)}, ${Math.round(90 + randomVariation * 30)}, ${Math.round(40 + randomVariation * 20)})`;
      case 'yellow':
        return `rgb(${Math.round(220 + randomVariation * 35)}, ${Math.round(190 + randomVariation * 30)}, ${Math.round(40 + randomVariation * 20)})`;
      case 'red':
        return `rgb(${Math.round(180 + randomVariation * 40)}, ${Math.round(40 + randomVariation * 20)}, ${Math.round(40 + randomVariation * 20)})`;
      default: // normal and bush
        return `rgb(${Math.round(60 + randomVariation * 30)}, ${Math.round(150 + randomVariation * 50)}, ${Math.round(60 + randomVariation * 30)})`;
    }
  }, [type]);

  return (
    <group position={[position[0] + randomOffset, position[1], position[2] + randomOffset]} scale={scale}>
      {type === 'normal' && (
        <>
          {/* Trunk */}
          <Box args={[0.3, 1.5, 0.3]} position={[0, 0.75, 0]}>
            <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0.1} />
          </Box>
          {/* Main Foliage */}
          <Box args={[1.5, 1.5, 1.5]} position={[0, 2, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
              envMapIntensity={1.5}
            />
          </Box>
          {/* Add smaller foliage clusters for more detail */}
          <Box args={[0.8, 0.8, 0.8]} position={[0.4, 2.4, 0.4]}>
            <meshStandardMaterial color={leafColor} roughness={0.8} />
          </Box>
          <Box args={[0.8, 0.8, 0.8]} position={[-0.4, 2.4, -0.4]}>
            <meshStandardMaterial color={leafColor} roughness={0.8} />
          </Box>
        </>
      )}
      
      {type === 'pine' && (
        <>
          {/* Trunk */}
          <Box args={[0.25, 2, 0.25]} position={[0, 1, 0]}>
            <meshStandardMaterial color={trunkColor} roughness={0.9} />
          </Box>
          {/* Pine layers - more detailed */}
          <Box args={[1.8, 1, 1.8]} position={[0, 1.6, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
              envMapIntensity={1.5}
            />
          </Box>
          <Box args={[1.4, 1, 1.4]} position={[0, 2.3, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
            />
          </Box>
          <Box args={[1, 1, 1]} position={[0, 3, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
            />
          </Box>
          <Box args={[0.6, 0.6, 0.6]} position={[0, 3.6, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
            />
          </Box>
        </>
      )}
      
      {type === 'bush' && (
        <>
          <Box args={[1.2, 1, 1.2]} position={[0, 0.5, 0]}>
            <meshStandardMaterial 
              color={leafColor} 
              roughness={0.8} 
              emissive={leafColor} 
              emissiveIntensity={0.08}
              envMapIntensity={1.5}
            />
          </Box>
          {/* Add smaller clusters for more detail */}
          <Box args={[0.7, 0.7, 0.7]} position={[0.4, 0.8, 0.4]}>
            <meshStandardMaterial color={leafColor} roughness={0.8} />
          </Box>
          <Box args={[0.7, 0.7, 0.7]} position={[-0.4, 0.8, -0.4]}>
            <meshStandardMaterial color={leafColor} roughness={0.8} />
          </Box>
        </>
      )}
    </group>
  );
}

// Main forest component
export function LowPolyForest({ 
  density = 1.5, // Tree density
  buildingPositions = [] as BuildingPosition[] 
}) {
  // Using a reference to tree types to avoid linter error
  const allowedTreeTypes = useMemo(() => ['normal', 'pine', 'bush', 'autumn', 'yellow', 'red'] as const, []);
  
  // Generate tree positions with smart placement
  const treePositions = useMemo(() => {
    const trees = [];
    const citySize = 140; // City boundaries
    const safeZone = 5; // Safety margin to keep trees inside map
    const existingPositions = new Set();
    
    // Create building exclusion zones
    const buildingExclusionZones = buildingPositions.map(building => ({
      center: new Vector3(building.position[0], 0, building.position[2]),
      radius: Math.max(...building.scale) + 2 // Buffer around buildings
    }));
    
    // Helper function to check if position is too close to buildings
    const isTooCloseToBuilding = (pos: Vector3) => {
      return buildingExclusionZones.some(zone => {
        return pos.distanceTo(zone.center) < zone.radius;
      });
    };
    
    // Helper function to check if on a road - every third cell is a road
    const isOnRoad = (x: number, z: number) => {
      // Road width with buffer zone
      const roadWidth = 5; 
      
      // Convert world coordinates to grid coordinates
      const gridCellSize = 15;
      const adjustedX = x + citySize/2; 
      const adjustedZ = z + citySize/2;
      
      // Calculate which grid cell this is in
      const gridX = Math.floor(adjustedX / gridCellSize);
      const gridZ = Math.floor(adjustedZ / gridCellSize);
      
      // Check if on a road (every third grid line is a road)
      const roadIndices = [0, 3, 6, 9];
      
      // Check distance to nearest road in both directions
      let minDistToRoad = Infinity;
      
      // X-direction roads
      for (const roadIdx of roadIndices) {
        const roadPos = roadIdx * gridCellSize;
        const distToRoad = Math.abs(adjustedX - roadPos);
        minDistToRoad = Math.min(minDistToRoad, distToRoad);
      }
      
      // Z-direction roads
      for (const roadIdx of roadIndices) {
        const roadPos = roadIdx * gridCellSize;
        const distToRoad = Math.abs(adjustedZ - roadPos);
        minDistToRoad = Math.min(minDistToRoad, distToRoad);
      }
      
      // Return true if too close to any road
      return minDistToRoad < roadWidth;
    };
    
    // Check if position is within map bounds with safety margin
    const isWithinMapBounds = (x: number, z: number) => {
      return Math.abs(x) < (citySize/2 - safeZone) && Math.abs(z) < (citySize/2 - safeZone);
    };
    
    // Create tree clusters and individual trees
    for (let i = 0; i < (density * 300); i++) {
      // Random position within safe city boundaries
      const x = MathUtils.randFloat(-(citySize/2 - safeZone), (citySize/2 - safeZone));
      const z = MathUtils.randFloat(-(citySize/2 - safeZone), (citySize/2 - safeZone));
      const pos = new Vector3(x, 0, z);
      
      // Skip if too close to building or on road
      if (isTooCloseToBuilding(pos) || isOnRoad(x, z)) continue;
      
      // Avoid duplicate positions with higher precision
      const posKey = `${Math.round(x*5)/5},${Math.round(z*5)/5}`;
      if (existingPositions.has(posKey)) continue;
      existingPositions.add(posKey);
      
      // Add variation to tree types - with additional seasonal types and create natural clusters
      // Trees of similar types often grow together
      const r = Math.random();
      let treeType: TreeType;
      
      // Create clusters by using position to influence tree type
      const normalizedX = (x + citySize/2) / citySize; // 0 to 1
      const normalizedZ = (z + citySize/2) / citySize; // 0 to 1
      
      // Position-based biasing for natural clusters
      const positionValue = (normalizedX * normalizedZ * 10) % 1;
      
      if (positionValue < 0.3) {
        // Normal green trees are most common
        if (r < 0.7) treeType = 'normal';
        else if (r < 0.9) treeType = 'bush';
        else treeType = 'pine';
      } else if (positionValue < 0.6) {
        // Pine tree cluster
        if (r < 0.7) treeType = 'pine';
        else if (r < 0.9) treeType = 'normal';
        else treeType = 'bush';
      } else if (positionValue < 0.8) {
        // Autumn colors cluster
        if (r < 0.6) treeType = 'autumn';
        else if (r < 0.8) treeType = 'yellow';
        else treeType = 'red';
      } else {
        // Yellow/red cluster
        if (r < 0.5) treeType = 'yellow';
        else if (r < 0.8) treeType = 'red';
        else treeType = 'autumn';
      }
      
      // Tree size varies slightly within clusters for natural look
      const clusterSizeFactor = 0.2 * positionValue;
      const scale = MathUtils.randFloat(0.8 + clusterSizeFactor, 1.8 - clusterSizeFactor);
      
      trees.push({
        position: [x, 0, z] as [number, number, number],
        scale,
        type: treeType
      });
    }
    
    // Create forest clusters in corners
    const addForestCluster = (centerX: number, centerZ: number, radius: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = centerX + Math.cos(angle) * distance;
        const z = centerZ + Math.sin(angle) * distance;
        
        // Ensure trees stay within map bounds
        if (!isWithinMapBounds(x, z)) continue;
        
        const pos = new Vector3(x, 0, z);
        
        if (isTooCloseToBuilding(pos) || isOnRoad(x, z)) continue;
        
        const posKey = `${Math.round(x*5)/5},${Math.round(z*5)/5}`;
        if (existingPositions.has(posKey)) continue;
        existingPositions.add(posKey);
        
        const treeType = Math.random() < 0.7 ? 'pine' : 'normal';
        const scale = MathUtils.randFloat(1.0, 2.2);
        
        trees.push({
          position: [x, 0, z] as [number, number, number],
          scale,
          type: treeType as TreeType
        });
      }
    };
    
    // Add dense forest clusters in the corners
    const cornerDistance = citySize/3 - safeZone;
    addForestCluster(-cornerDistance, -cornerDistance, 25, 60);
    addForestCluster(cornerDistance, -cornerDistance, 25, 60);
    addForestCluster(-cornerDistance, cornerDistance, 25, 60);
    addForestCluster(cornerDistance, cornerDistance, 25, 60);
    
    return trees;
  }, [density, buildingPositions, allowedTreeTypes]);
  
  return (
    <group>
      {treePositions.map((tree, idx) => (
        <LowPolyTree 
          key={idx} 
          position={tree.position} 
          type={tree.type}
          scale={tree.scale} 
        />
      ))}
    </group>
  );
} 