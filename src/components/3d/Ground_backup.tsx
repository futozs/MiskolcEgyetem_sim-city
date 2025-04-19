'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3, Color } from 'three';
import { Plane, Box, Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/appStore';

// Simplified Tree component - more efficient with fewer details
function Tree({ position, scale = 1, type = 'normal' }: { 
  position: [number, number, number], 
  scale?: number,
  type?: 'normal' | 'pine' | 'bush'
}) {
  // Memoize tree colors based on type
  const treeVariation = useMemo(() => {
    // Deterministic colors based on position to ensure consistency
    const posHash = Math.abs(position[0] * 1000 + position[2]);
    const season = posHash % 10 > 8 ? 'autumn' : 'summer'; // 20% chance of autumn colors
    
    const leafColor = season === 'autumn' 
      ? new Color(`hsl(${20 + (posHash % 40)}, 70%, ${40 + (posHash % 20)}%)`) // Orange/Red
      : new Color(`hsl(${90 + (posHash % 60)}, 70%, ${25 + (posHash % 25)}%)`); // Greens

    return {
      trunkColor: new Color(`hsl(${20 + (posHash % 20)}, 60%, ${20 + (posHash % 20)}%)`),
      leavesColor: leafColor,
      trunkHeight: 1.0 + (posHash % 8) / 10,
      leavesSize: 0.8 + (posHash % 5) / 10
    };
  }, [position]);
  
  // Simplified tree geometry based on type
  if (type === 'pine') {
    return (
      <group position={position} scale={scale}>
        {/* Trunk */}
        <Box 
          args={[0.3, treeVariation.trunkHeight * 2, 0.3]} 
          position={[0, treeVariation.trunkHeight, 0]}
        >
          <meshStandardMaterial 
            color={treeVariation.trunkColor}
            roughness={0.9}
          />
        </Box>
        
        {/* Pine layers - simplified */}
        {[0.9, 0.7, 0.5, 0.3].slice(0, 3).map((layerSize, index) => (
          <Box
            key={index}
            args={[layerSize * 2 * scale, 0.9 * scale, layerSize * 2 * scale]} 
            position={[0, 1.2 + index * 0.9 * scale, 0]}
          >
            <meshStandardMaterial
              color={treeVariation.leavesColor}
              roughness={0.8}
            />
          </Box>
        ))}
      </group>
    );
  } else if (type === 'bush') {
    return (
      <group position={position} scale={scale}>
        <Sphere
          args={[treeVariation.leavesSize, 4, 4]}
          position={[0, treeVariation.leavesSize, 0]}
        >
          <meshStandardMaterial
            color={treeVariation.leavesColor}
            roughness={0.8}
          />
        </Sphere>
      </group>
    );
  } else {
    return (
      <group position={position} scale={scale}>
        {/* Trunk */}
        <Box 
          args={[0.3, treeVariation.trunkHeight * 1.5, 0.3]} 
          position={[0, treeVariation.trunkHeight * 0.75, 0]}
        >
          <meshStandardMaterial 
            color={treeVariation.trunkColor}
            roughness={0.9}
          />
        </Box>
        
        {/* Main leaves crown */}
        <Sphere
          args={[treeVariation.leavesSize, 6, 6]}
          position={[0, treeVariation.trunkHeight * 1.5, 0]}
        >
          <meshStandardMaterial
            color={treeVariation.leavesColor}
            roughness={0.8}
          />
        </Sphere>
      </group>
    );
  }
}

// Simplified StreetLight component
function StreetLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Light pole */}
      <Box 
        args={[0.2, 5, 0.2]} 
        position={[0, 2.5, 0]}
      >
        <meshStandardMaterial 
          color="#555555" 
          roughness={0.5}
          metalness={0.8}
        />
      </Box>
      
      {/* Light head */}
      <Box
        args={[0.6, 0.3, 0.6]}
        position={[0, 5, 0.3]}
      >
        <meshStandardMaterial
          color="#FFCC66"
          emissive="#FFCC66"
          emissiveIntensity={0.5}
        />
      </Box>
      
      {/* Add a small point light */}
      <pointLight 
        position={[0, 5, 0.3]} 
        distance={10}
        intensity={0.5}
        color="#FFCC66"
      />
    </group>
  );
}

// Simplified Bench component
function Bench({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <Box
        args={[2, 0.1, 0.5]}
        position={[0, 0.5, 0]}
      >
        <meshStandardMaterial
          color="#A0522D"
          roughness={0.9}
        />
      </Box>
      
      {/* Back support */}
      <Box
        args={[2, 0.5, 0.1]}
        position={[0, 0.8, -0.2]}
      >
        <meshStandardMaterial
          color="#A0522D"
          roughness={0.9}
        />
      </Box>
      
      {/* Legs */}
      {[[-0.8, 0.25, 0], [0.8, 0.25, 0]].map((pos, i) => (
        <Box
          key={i}
          args={[0.1, 0.5, 0.5]}
          position={pos as [number, number, number]}
        >
          <meshStandardMaterial
            color="#555555"
            roughness={0.5}
          />
        </Box>
      ))}
    </group>
  );
}

// Simplified Car component
function Car({ lane, speed, color = '#ff0000' }: { 
  lane: 'north-south' | 'south-north' | 'east-west' | 'west-east', 
  speed: number,
  color?: string
}) {
  const carRef = useRef<Group>(null);
  
  // Deterministic initial positions
  const initialPosition = useMemo(() => {
    switch(lane) {
      case 'north-south': return new Vector3(4, 0.5, -100);
      case 'south-north': return new Vector3(-4, 0.5, 100);
      case 'east-west': return new Vector3(-100, 0.5, -4);
      case 'west-east': return new Vector3(100, 0.5, 4);
      default: return new Vector3(0, 0.5, 0);
    }
  }, [lane]);
  
  const [position, setPosition] = useState(initialPosition);
  
  // Direction vectors
  const directionVector = useMemo(() => {
    switch(lane) {
      case 'north-south': return new Vector3(0, 0, 1);
      case 'south-north': return new Vector3(0, 0, -1);
      case 'east-west': return new Vector3(1, 0, 0);
      case 'west-east': return new Vector3(-1, 0, 0);
      default: return new Vector3(0, 0, 0);
    }
  }, [lane]);
  
  // Rotation based on direction
  const rotation = useMemo(() => {
    switch(lane) {
      case 'north-south': return [0, Math.PI, 0] as [number, number, number];
      case 'south-north': return [0, 0, 0] as [number, number, number];
      case 'east-west': return [0, Math.PI / 2, 0] as [number, number, number];
      case 'west-east': return [0, -Math.PI / 2, 0] as [number, number, number];
      default: return [0, 0, 0] as [number, number, number];
    }
  }, [lane]);
  
  useFrame(({ clock }) => {
    if (!carRef.current) return;
    
    // Simple car movement
    const delta = clock.getDelta();
    const movementDistance = speed * delta;
    
    setPosition(prev => {
      const newPos = prev.clone().add(directionVector.clone().multiplyScalar(movementDistance));
      
      // Reset position when out of bounds
      if (Math.abs(newPos.x) > 100 || Math.abs(newPos.z) > 100) {
        return initialPosition;
      }
      
      return newPos;
    });
    
    // Update car position with smooth interpolation
    if (carRef.current) {
      carRef.current.position.lerp(position, 0.1);
    }
  });
  
  // Simplified car model
  return (
    <group ref={carRef} position={position} rotation={rotation}>
      {/* Car body */}
      <Box args={[2, 0.8, 4]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </Box>
      
      {/* Car cabin */}
      <Box args={[1.8, 0.8, 2]} position={[0, 1.2, -0.5]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </Box>
      
      {/* Windows */}
      <Box args={[1.7, 0.4, 1.9]} position={[0, 1.6, -0.5]}>
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* Wheels */}
      {[[-0.9, 0, 1.2], [0.9, 0, 1.2], [-0.9, 0, -1.2], [0.9, 0, -1.2]].map((pos, i) => (
        <Box key={i} args={[0.4, 0.4, 0.7]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#222" roughness={0.8} />
        </Box>
      ))}
    </group>
  );
}

export function Ground({ 
  rainIntensity = 0, 
  isDaytime = true 
}: { 
  rainIntensity?: number, 
  performance?: 'high' | 'medium' | 'low',
  isDaytime?: boolean
}) {
  const { getTransformedData } = useAppStore();
  
  // Ground ref
  const groundRef = useRef<Mesh>(null);
  
  // Get building positions from API data
  const buildingPositions = useMemo(() => {
    const data = getTransformedData();
    return (data?.buildings3D || []).map(b => ({
      position: new Vector3(b.position[0], b.position[1], b.position[2]),
      scale: new Vector3(b.scale[0], b.scale[1], b.scale[2])
    }));
  }, [getTransformedData]);
  
  // Material colors based on daytime and rain
  const colors = useMemo(() => ({
    concrete: isDaytime ? "#aaaaaa" : "#555555", // Concrete base
    road: rainIntensity > 0 ? "#444444" : "#666666", // Asphalt
    grass: rainIntensity > 0 ? "#3a9d23" : "#4acd33", // Park areas
    water: rainIntensity > 0 ? "#00668a" : "#0088aa", // Lake
    sidewalk: isDaytime ? "#cccccc" : "#999999"  // Concrete sidewalks
  }), [isDaytime, rainIntensity]);
  
  // Simplified tree positions
  const treePositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number], 
      type: 'normal' | 'pine' | 'bush',
      scale: number
    }> = [];
    
    // Central park trees
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 5 + (i % 20);
      
      positions.push({
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        type: (i % 3 === 0) ? 'pine' : (i % 3 === 1) ? 'normal' : 'bush',
        scale: 0.8 + (i % 10) / 10
      });
    }
    
    // Trees near buildings
    if (buildingPositions.length > 0) {
      buildingPositions.forEach((building, index) => {
        if (index % 3 !== 0) return;
        
        for (let i = 0; i < 2; i++) {
          const angle = (i / 2) * Math.PI * 2;
          const radius = 8 + (index % 3);
          
          positions.push({
            position: [
              building.position.x + Math.cos(angle) * radius,
              0,
              building.position.z + Math.sin(angle) * radius
            ],
            type: (index % 3 === 0) ? 'pine' : 'normal',
            scale: 0.6 + (index % 10) / 10
          });
        }
      });
    }
    
    return positions;
  }, [buildingPositions]);
  
  // Street light positions
  const streetLightPositions: [number, number, number][] = useMemo(() => {
    const positions: [number, number, number][] = [];
    
    // Lights along main roads and grid intersections
    // Main road lights
    for (let i = -90; i <= 90; i += 20) {
      // Main cross
      positions.push([i, 0, 8]); // North side
      positions.push([i, 0, -8]); // South side
      positions.push([8, 0, i]); // East side
      positions.push([-8, 0, i]); // West side
    }
    
    // Lights at grid road intersections
    const roadOffsets = [-90, -60, -30, 30, 60, 90];
    roadOffsets.forEach(x => {
      roadOffsets.forEach(z => {
        if (Math.abs(x) > 10 || Math.abs(z) > 10) { // Skip center cross area
          positions.push([x, 0, z]); // Intersection
          
          // Add some lights along the grid roads
          if ((x + z) % 60 === 0) {
            positions.push([x - 15, 0, z]);
            positions.push([x + 15, 0, z]);
            positions.push([x, 0, z - 15]);
            positions.push([x, 0, z + 15]);
          }
        }
      });
    });
    
    return positions;
  }, []);
  
  // Enhanced bench positions
  const benchPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number], rot: number }> = [];
    
    // Central park benches
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      positions.push({
        pos: [Math.cos(angle) * 15, 0, Math.sin(angle) * 15],
        rot: angle + Math.PI / 2
      });
    }
    
    // Park benches throughout the city
    const parkLocations = [
      [-60, 60], [60, 60], [-60, -60], [60, -60], 
      [-30, 0], [30, 0], [0, -30], [0, 60]
    ];
    
    parkLocations.forEach((loc) => {
      // Add 2-4 benches to each park
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const radius = 8;
        positions.push({
          pos: [
            loc[0] + Math.cos(angle) * radius, 
            0, 
            loc[1] + Math.sin(angle) * radius
          ],
          rot: angle + Math.PI / 2
        });
      }
    });
    
    return positions;
  }, []);
  
  // Cars - simple traffic
  const cars = useMemo(() => {
    const carProps: Array<{
      lane: 'north-south' | 'south-north' | 'east-west' | 'west-east',
      speed: number,
      color: string
    }> = [];
    
    const carColors = ['#ff0000', '#0050b5', '#00aa00', '#ffaa00'];
    
    // Create 8 cars for traffic
    for (let i = 0; i < 8; i++) {
      const laneOptions = ['north-south', 'south-north', 'east-west', 'west-east'] as const;
      
      carProps.push({
        lane: laneOptions[i % 4],
        speed: 8 + (i % 5),
        color: carColors[i % carColors.length]
      });
    }
    
    return carProps;
  }, []);
  
  // Cars - enhanced traffic system for city grid
  const cityTraffic = useMemo(() => {
    const carProps: Array<{
      lane: 'north-south' | 'south-north' | 'east-west' | 'west-east',
      speed: number,
      color: string
    }> = [];
    
    const carColors = ['#ff0000', '#0050b5', '#00aa00', '#ffaa00', '#ddaa00', '#aa55ff', '#22ccdd', '#ffffff'];
    
    // Create more cars for traffic
    const roadOffsets = [-90, -60, -30, 0, 30, 60, 90];
    
    // Add cars to each road in the grid
    roadOffsets.forEach((offset, idx) => {
      // Skip adding too many cars on the main roads (0 offset) to avoid congestion
      const carsPerRoad = offset === 0 ? 4 : 2;
      
      for (let i = 0; i < carsPerRoad; i++) {
        // Create cars going in both directions on each road
        const laneOptions = ['north-south', 'south-north', 'east-west', 'west-east'] as const;
        const randomLaneIndex = (i + idx) % 4;
        const colorIndex = (i + idx) % carColors.length;
        const speed = 5 + (i + idx) % 10; // Vary speeds more
        
        carProps.push({
          lane: laneOptions[randomLaneIndex],
          speed: speed,
          color: carColors[colorIndex]
        });
      }
    });
    
    return carProps;
  }, []);
  
  return (
    <>
      {/* Concrete base - With city boundary */}
      <Plane 
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        args={[500, 500]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={colors.concrete}
          roughness={0.9}
          metalness={0.2}
        />
      </Plane>
      
      {/* City boundary - green outskirts */}
      <Plane 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]} 
        args={[300, 300]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={isDaytime ? "#225522" : "#113311"}
          roughness={0.9}
        />
      </Plane>
      
      {/* City area - light concrete */}
      <Plane 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        args={[200, 200]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={isDaytime ? "#aaaaaa" : "#555555"}
          roughness={0.8}
        />
      </Plane>
      
      {/* City border - decorative */}
      <Box
        position={[0, 0.5, 100]}
        args={[200, 1, 2]}
      >
        <meshStandardMaterial 
          color="#666666"
          roughness={0.7}
        />
      </Box>
      <Box
        position={[0, 0.5, -100]}
        args={[200, 1, 2]}
      >
        <meshStandardMaterial 
          color="#666666"
          roughness={0.7}
        />
      </Box>
      <Box
        position={[100, 0.5, 0]}
        args={[2, 1, 200]}
      >
        <meshStandardMaterial 
          color="#666666"
          roughness={0.7}
        />
      </Box>
      <Box
        position={[-100, 0.5, 0]}
        args={[2, 1, 200]}
      >
        <meshStandardMaterial 
          color="#666666"
          roughness={0.7}
        />
      </Box>
      
      {/* Main roads - cross pattern */}
      <Plane 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, 0]} 
        args={[14, 500]}
        receiveShadow
      >
        <meshStandardMaterial 
          roughness={0.8}
          color={colors.road}
        />
      </Plane>
      
      <Plane 
        rotation={[-Math.PI / 2, Math.PI / 2, 0]} 
        position={[0, 0.01, 0]} 
        args={[14, 500]}
        receiveShadow
      >
        <meshStandardMaterial 
          roughness={0.8}
          color={colors.road}
        />
      </Plane>
      
      {/* Grid roads - complete grid pattern */}
      {[-90, -60, -30, 30, 60, 90].map((offset) => (
        <group key={`grid-roads-${offset}`}>
          {/* Horizontal roads (along X-axis) */}
          <Plane 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.01, offset]} 
            args={[500, 8]}
            receiveShadow
          >
            <meshStandardMaterial 
              roughness={0.8}
              color={colors.road}
            />
          </Plane>
          
          {/* Vertical roads (along Z-axis) */}
          <Plane 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[offset, 0.01, 0]} 
            args={[8, 500]}
            receiveShadow
          >
            <meshStandardMaterial 
              roughness={0.8}
              color={colors.road}
            />
          </Plane>
        </group>
      ))}
      
      {/* Sidewalks along main roads */}
      {[15, -15].map((offset, index) => (
        <>
          <Plane 
            key={`sidewalk-h-${index}`}
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.02, offset]} 
            args={[6, 500]}
            receiveShadow
          >
            <meshStandardMaterial 
              roughness={0.7}
              color={colors.sidewalk}
            />
          </Plane>
          
          <Plane 
            key={`sidewalk-v-${index}`}
            rotation={[-Math.PI / 2, Math.PI / 2, 0]} 
            position={[offset, 0.02, 0]} 
            args={[6, 500]}
            receiveShadow
          >
            <meshStandardMaterial 
              roughness={0.7}
              color={colors.sidewalk}
            />
          </Plane>
        </>
      ))}
      
      {/* City building blocks - adding building plots at intersections */}
      {[-60, -30, 30, 60].map((x) => 
        [-60, -30, 30, 60].map((z) => {
          // Skip center and lake areas
          if ((x === 60 && z === -60) || (Math.abs(x) < 20 && Math.abs(z) < 20)) return null;
          
          // Create a building plot
          return (
            <Box
              key={`block-${x}-${z}`}
              position={[x, 2, z]}
              args={[15, 4, 15]}
            >
              <meshStandardMaterial 
                color={`hsl(${Math.abs(x * z) % 360}, 30%, ${40 + (Math.abs(x + z) % 20)}%)`}
                roughness={0.7}
                metalness={0.3}
              />
            </Box>
          );
        })
      )}
      
      {/* Lake - simplified */}
      <Plane 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[60, -0.2, -60]} 
        args={[40, 40]}
        receiveShadow
      >
        <meshStandardMaterial 
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.8}
          color={colors.water}
        />
      </Plane>
      
      {/* Central park */}
      <Plane 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.02, 0]} 
        args={[40, 40]}
        receiveShadow
      >
        <meshStandardMaterial 
          roughness={0.9}
          color={colors.grass}
        />
      </Plane>
      
      {/* Additional small parks - more evenly distributed */}
      {[
        [-60, 60], [60, 60], [-60, -60], [60, -60], 
        [-30, 0], [30, 0], [0, -30], [0, 60]
      ].map((coords, index) => (
        <Plane 
          key={`park-${index}`}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[coords[0], 0.02, coords[1]]} 
          args={[20, 20]}
          receiveShadow
        >
          <meshStandardMaterial 
            roughness={0.9}
            color={colors.grass}
          />
        </Plane>
      ))}
      
      {/* Trees */}
      {treePositions.map((tree, index) => (
        <Tree 
          key={`tree-${index}`} 
          position={tree.position} 
          scale={tree.scale} 
          type={tree.type}
        />
      ))}
      
      {/* Street lights */}
      {streetLightPositions.map((pos, index) => (
        <StreetLight 
          key={`light-${index}`} 
          position={pos}
        />
      ))}
      
      {/* Benches */}
      {benchPositions.map((bench, index) => (
        <Bench 
          key={`bench-${index}`} 
          position={bench.pos} 
          rotation={bench.rot} 
        />
      ))}
      
      {/* Cars */}
      {cityTraffic.map((car, index) => (
        <Car 
          key={`car-${index}`} 
          lane={car.lane} 
          speed={car.speed} 
          color={car.color} 
        />
      ))}
    </>
  );
} 