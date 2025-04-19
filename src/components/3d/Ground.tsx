'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3, Color, DoubleSide, MeshStandardMaterial } from 'three';
import { Plane, Box } from '@react-three/drei';
import axios from 'axios';

// Épületek típusa az API-ból
type Epulet = {
  id: number;
  nev: string;
  tipus: string;
  szin: string;
  magassag: number;
  szelesseg: number;
  melyseg: number;
};

// Low poly road segment
function RoadSegment({ 
  position, 
  rotation = 0, 
  length = 10, 
  isIntersection = false 
}: { 
  position: [number, number, number], 
  rotation?: number,
  length?: number,
  isIntersection?: boolean
}) {
  const roadWidth = 4.5;
  const roadColor = "#444444";
  const asphaltColor = "#333333";
  const laneMarkerColor = "#FFFFFF";
  const sidewalkColor = "#BBBBBB";
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Wider base layer for the road with sidewalks */}
      <Box 
        args={[isIntersection ? roadWidth + 2.5 : length, 0.08, isIntersection ? roadWidth + 2.5 : roadWidth + 2.5]} 
        position={[0, -0.02, 0]}
      >
        <meshStandardMaterial color={sidewalkColor} roughness={0.9} />
      </Box>
      
      {/* Main road surface - slightly darker and raised */}
      <Box 
        args={[isIntersection ? roadWidth : length, 0.1, isIntersection ? roadWidth : roadWidth]} 
        position={[0, 0.02, 0]}
      >
        <meshStandardMaterial color={roadColor} roughness={0.7} metalness={0.1} />
      </Box>
      
      {/* Road texture overlay - adds asphalt detail */}
      <Box 
        args={[isIntersection ? roadWidth - 0.2 : length - 0.2, 0.11, isIntersection ? roadWidth - 0.2 : roadWidth - 0.2]} 
        position={[0, 0.03, 0]}
      >
        <meshStandardMaterial 
          color={asphaltColor} 
          roughness={0.9} 
          metalness={0.1}
          transparent={true}
          opacity={0.7}
        />
      </Box>
      
      {/* Road markings */}
      {!isIntersection && (
        <>
          {/* Center line */}
          <Box 
            args={[length * 0.95, 0.12, 0.2]} 
            position={[0, 0.04, 0]}
          >
            <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
          </Box>
          
          {/* Side markings */}
          <Box 
            args={[length * 0.95, 0.12, 0.12]} 
            position={[0, 0.04, roadWidth / 2 - 0.3]}
          >
            <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
          </Box>
          
          <Box 
            args={[length * 0.95, 0.12, 0.12]} 
            position={[0, 0.04, -roadWidth / 2 + 0.3]}
          >
            <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
          </Box>
          
          {/* Dash markings */}
          {Array.from({ length: Math.floor(length / 2) }).map((_, i) => (
            <Box 
              key={i}
              args={[0.8, 0.12, 0.12]} 
              position={[-length / 2 + 1 + i * 2, 0.04, 0]}
            >
              <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
            </Box>
          ))}
        </>
      )}
      
      {/* Intersection markings */}
      {isIntersection && (
        <>
          {/* Crosswalk lines - horizontal */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Box 
              key={`h-${i}`}
              args={[0.8, 0.12, roadWidth * 0.7]} 
              position={[-roadWidth / 2 + 1 + i * roadWidth / 4, 0.04, roadWidth / 2 + 0.6]}
            >
              <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
            </Box>
          ))}
          
          {/* Crosswalk lines - vertical */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Box 
              key={`v-${i}`}
              args={[roadWidth * 0.7, 0.12, 0.8]} 
              position={[roadWidth / 2 + 0.6, 0.04, -roadWidth / 2 + 1 + i * roadWidth / 4]}
            >
              <meshStandardMaterial color={laneMarkerColor} roughness={0.4} />
            </Box>
          ))}
        </>
      )}
    </group>
  );
}

// Low-poly building component for performance
interface LowPolyBuildingProps {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  color: string;
  name: string;
  onClick?: () => void;
  isSelected: boolean;
}

function LowPolyBuilding({ position, width, height, depth, color, name, onClick, isSelected }: LowPolyBuildingProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Combine hover and selected state for visual effects
  const isActive = hovered || isSelected;
  const materialColor = isSelected ? '#ffaa44' : hovered ? '#ffffff' : color;
  const emissiveColor = isActive ? color : '#000000';
  const emissiveIntensity = isSelected ? 0.7 : hovered ? 0.5 : 0;

  return (
    <group position={position}>
      {/* Base building */}
      <mesh 
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={materialColor} 
          roughness={0.8} 
          metalness={0.2}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Simple roof */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial 
          color={isSelected ? "#dddddd" : "#333333"} 
          emissive={isSelected ? "#999999" : undefined}
          emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </mesh>
      
      {/* Floating name for debugging if needed */}
      {/*
      <Text
        position={[0, height + 1, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      */}
    </group>
  );
}

// API épület komponens
function ApiBuilding({ position, epulet, onSelectBuilding, isSelected }: { 
  position: [number, number, number], 
  epulet: any,
  onSelectBuilding?: (building: any) => void,
  isSelected: boolean
}) {
  // Calculate building size based on floor area
  const baseScale = Math.sqrt(epulet.alapterulet) / 20;
  // Ensure buildings have a reasonable size
  const scale = Math.max(0.8, Math.min(baseScale, 4));
  
  // Different building types have different colors and shapes
  const getTypeColor = () => {
    const type = epulet.tipus.toLowerCase();
    if (type.includes('lakó') || type.includes('lako')) return "#4285F4"; // Blue
    if (type.includes('közép') || type.includes('kozep')) return "#0F9D58"; // Green
    if (type.includes('vallási')) return "#9C27B0"; // Purple
    if (type.includes('iroda')) return "#4DD0E1"; // Cyan
    if (type.includes('keresk')) return "#F4B400"; // Yellow
    return "#757575"; // Default gray
  };

  const getBuildingType = () => {
    const type = epulet.tipus.toLowerCase();
    if (type.includes('vallási') || type.includes('templom')) return 'religious';
    if (type.includes('közép') || type.includes('városháza')) return 'government';
    if (type.includes('lakó') || type.includes('panel')) return 'residential';
    if (type.includes('keresk') || type.includes('üzlet')) return 'commercial';
    return 'default';
  };

  const handleClick = () => {
    if (onSelectBuilding) {
      onSelectBuilding(epulet);
    }
  };

  // Get building properties
  const color = getTypeColor();
  const buildingType = getBuildingType();
  const heightFactor = buildingType === 'religious' ? 2.5 : 
                      buildingType === 'government' ? 2.0 :
                      buildingType === 'commercial' ? 1.8 : 1.5;

  // Render different building types with distinctive shapes
  if (buildingType === 'religious') {
    return (
      <group>
        {/* Church with tower */}
        <mesh position={[0, scale * 0.75, 0]} onClick={handleClick}>
          <boxGeometry args={[scale * 1.5, scale * 1.5, scale * 2.5]} />
          <meshStandardMaterial color={isSelected ? "#ffaa44" : color} emissive={isSelected ? color : undefined} emissiveIntensity={isSelected ? 0.5 : 0} />
        </mesh>
        <mesh position={[0, scale * 2.5, 0]} onClick={handleClick}>
          <coneGeometry args={[scale * 0.8, scale * 1.2, 4]} />
          <meshStandardMaterial color={isSelected ? "#ddaa88" : "#9966CC"} emissive={isSelected ? "#9966CC" : undefined} emissiveIntensity={isSelected ? 0.5 : 0} />
        </mesh>
      </group>
    );
  } else if (buildingType === 'government') {
    return (
      <group>
        {/* Government building with columns */}
        <mesh position={[0, scale * 1, 0]} onClick={handleClick}>
          <boxGeometry args={[scale * 2.5, scale * 2, scale * 1.8]} />
          <meshStandardMaterial color={isSelected ? "#ffaa44" : color} emissive={isSelected ? color : undefined} emissiveIntensity={isSelected ? 0.5 : 0} />
        </mesh>
        <mesh position={[0, scale * 2.2, 0]} onClick={handleClick}>
          <boxGeometry args={[scale * 2.8, scale * 0.4, scale * 2]} />
          <meshStandardMaterial color={isSelected ? "#dddddd" : "#CCCCCC"} emissive={isSelected ? "#CCCCCC" : undefined} emissiveIntensity={isSelected ? 0.5 : 0} />
        </mesh>
      </group>
    );
  } else {
    // Default building type
    return (
      <LowPolyBuilding 
        position={position} 
        width={scale * 1.5}
        height={scale * heightFactor}
        depth={scale * 1.5}
        color={color}
        name={epulet.nev}
        onClick={handleClick}
        isSelected={isSelected}
      />
    );
  }
}

// Low poly park area
function ParkArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Grass area */}
      <Box 
        args={[8, 0.1, 8]} 
        position={[0, 0, 0]}
      >
        <meshStandardMaterial color="#88BB44" />
      </Box>
      
      {/* A few trees */}
      {Array.from({ length: 5 }).map((_, i) => {
        const treeX = (Math.random() - 0.5) * 6;
        const treeZ = (Math.random() - 0.5) * 6;
        
        return (
          <group key={i} position={[treeX, 0, treeZ]}>
            {/* Tree trunk */}
            <Box 
              args={[0.3, 1, 0.3]} 
              position={[0, 0.5, 0]}
            >
              <meshStandardMaterial color="#8B4513" />
            </Box>
            
            {/* Tree foliage */}
            <Box 
              args={[1, 1.5, 1]} 
              position={[0, 1.5, 0]}
            >
              <meshStandardMaterial color="#228822" />
            </Box>
          </group>
        );
      })}
    </group>
  );
}

// Main Ground component
interface GroundProps {
  rainIntensity?: number;
  isDaytime?: boolean;
  performance?: 'high' | 'medium' | 'low';
  onSelectBuilding?: (building: any) => void;
  selectedBuildingId?: number;
}

export function Ground({ 
  rainIntensity = 0, 
  isDaytime = true, 
  performance = 'high',
  onSelectBuilding,
  selectedBuildingId
}: GroundProps) {
  // State for storing API data
  const [epuletek, setEpuletek] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);

  // Handle building selection
  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);
    if (onSelectBuilding) {
      onSelectBuilding(building);
    }
  };

  // Fetch buildings from API
  useEffect(() => {
    const fetchEpuletek = async () => {
      try {
        setLoading(true);
        // Use Next.js API route as a proxy
        const response = await fetch('/api/epuletek');
        const data = await response.json();
        if (data && Array.isArray(data.epuletek)) {
          setEpuletek(data.epuletek);
        } else {
          throw new Error('Invalid data format');
        }
        setError(null);
      } catch (err) {
        console.error('Hiba az épületek betöltésekor:', err);
        setError('Nem sikerült betölteni az épületeket az API-ból.');
        // Empty buildings list as fallback
        setEpuletek([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEpuletek();
  }, []);

  // City grid size
  const gridSize = 10;
  const cellSize = 10;
  
  // Create a grid layout for our city
  const cityGrid = useMemo(() => {
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill('empty'));
    
    // Create roads in a grid pattern - every third row/column is a road
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (i % 3 === 0 || j % 3 === 0) {
          grid[i][j] = 'road';
        }
      }
    }
    
    return grid;
  }, [gridSize]);
  
  // Draw the grid with roads
  const gridMesh = useMemo(() => {
    return (
      <group>
        {/* Main ground plane */}
        <mesh 
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.01, 0]}
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial 
            color={isDaytime ? '#6B8E23' : '#374D12'} 
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        
        {/* Roads grid - draw roads as lighter colored strips */}
        {cityGrid.map((row, i) => 
          row.map((cell, j) => {
            if (cell === 'road') {
              // Calculate position based on grid position
              const cellSize = 10;
              const offsetX = (gridSize * cellSize) / 2;
              const offsetZ = (gridSize * cellSize) / 2;
              const posX = j * cellSize - offsetX + (cellSize / 2);
              const posZ = i * cellSize - offsetZ + (cellSize / 2);
              
              // Determine if this is a horizontal or vertical road segment
              const isHorizontalRoad = i % 3 === 0;
              const isVerticalRoad = j % 3 === 0;
              
              // Width and depth for the road segment
              const roadWidth = 3;
              
              return (
                <group key={`road-${i}-${j}`}>
                  {/* Horizontal road segment */}
                  {isHorizontalRoad && (
                    <mesh
                      receiveShadow
                      position={[posX, 0.02, posZ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <planeGeometry args={[cellSize + 0.1, roadWidth]} />
                      <meshStandardMaterial 
                        color="#555555"
                        roughness={0.8} 
                        metalness={0.3}
                      />
                    </mesh>
                  )}
                  
                  {/* Vertical road segment */}
                  {isVerticalRoad && (
                    <mesh
                      receiveShadow
                      position={[posX, 0.02, posZ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <planeGeometry args={[roadWidth, cellSize + 0.1]} />
                      <meshStandardMaterial 
                        color="#555555"
                        roughness={0.8} 
                        metalness={0.3}
                      />
                    </mesh>
                  )}
                </group>
              );
            }
            return null;
          })
        )}
      </group>
    );
  }, [cityGrid, isDaytime, gridSize]);
  
  // Place buildings in the grid cells that are not roads
  const placedBuildings = useMemo(() => {
    if (!epuletek.length) return [];
    
    const buildings: Array<{ position: [number, number, number], epulet: any }> = [];
    const occupied: Record<string, boolean> = {}; // Track occupied positions
    
    // Find valid grid positions (not roads)
    const validPositions: Array<[number, number]> = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (cityGrid[i][j] !== 'road') {
          validPositions.push([i, j]);
        }
      }
    }
    
    // Place each building from the API - with fixed positions
    epuletek.forEach((epulet, index) => {
      if (index < validPositions.length) {
        const [i, j] = validPositions[index];
        
        // Calculate exact world position without random offset
        // to eliminate vibration and ensure consistent positioning
        const x = (i - gridSize/2) * cellSize;
        const z = (j - gridSize/2) * cellSize;
        
        // Mark as occupied - ensure no more than one building per cell
        const key = `${i},${j}`;
        if (occupied[key]) return; // Skip if cell already has a building
        occupied[key] = true;
        
        buildings.push({
          position: [x, 0, z],
          epulet
        });
      }
    });
    
    return buildings;
  }, [epuletek, cityGrid, gridSize, cellSize]);
  
  return (
    <group>
      {/* City base */}
      <Plane 
        args={[gridSize * cellSize + 20, gridSize * cellSize + 20]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
      >
        <meshStandardMaterial color="#599540" side={DoubleSide} />
      </Plane>
      
      {/* Generate roads based on grid */}
      {gridMesh}
      
      {/* Generate buildings from API data with a highlight for the selected one */}
      {placedBuildings.map((building, index) => (
        <group key={`api-building-${index}`}>
          <ApiBuilding 
            position={building.position}
            epulet={building.epulet}
            onSelectBuilding={handleBuildingSelect}
            isSelected={building.epulet.azonosito === selectedBuildingId}
          />
          
          {/* Selection indicator - only show for selected building */}
          {building.epulet.azonosito === selectedBuildingId && (
            <group position={building.position}>
              {/* Pulsing circle on the ground */}
              <mesh 
                position={[0, 0.1, 0]} 
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[2.5, 2.7, 32]} />
                <meshBasicMaterial 
                  color="#4C9BFF" 
                  transparent={true} 
                  opacity={0.8}
                />
              </mesh>
            </group>
          )}
        </group>
      ))}
      
      {/* Loading indicator or error message */}
      {loading && (
        <Box args={[1, 1, 1]} position={[0, 5, 0]}>
          <meshStandardMaterial color="red" />
        </Box>
      )}
    </group>
  );
} 