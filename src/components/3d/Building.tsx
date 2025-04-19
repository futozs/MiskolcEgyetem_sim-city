'use client';

import { useAppStore } from '@/store/appStore';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Mesh, Color, AdditiveBlending, MeshStandardMaterial, Group, Vector3 } from 'three';
import { Box, useTexture, Instances, Instance, Text, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Define our own BuildingData type if not available from import
type BuildingData = {
  id: number;
  position: number[];
  scale: number[];
  type?: string;
  condition?: number;
  name?: string;
};

type BuildingProps = {
  building: BuildingData;
  onHover?: (id: number, isHovered: boolean) => void;
  isSelected?: boolean;
  performance?: 'high' | 'medium' | 'low';
};

// Colors for different building types (removing duplicates)
const typeColors = {
  'lakóház': '#4e79a7',
  'középület': '#f28e2c',
  'vallási': '#e15759',
  'lakóépület': '#76b7b2',
  'iroda': '#b07aa1',
  'kereskedelmi': '#edc948',
  'oktatási': '#ff9da7',
  // Default
  'default': '#59a14f',
};

// Opacity/brightness based on condition (removing duplicates)
const conditionModifiers = {
  'kiváló': { opacity: 1, brightness: 1.2, emissiveIntensity: 0.15, metalness: 0.7, roughness: 0.2 },
  'megfelelő': { opacity: 0.95, brightness: 1, emissiveIntensity: 0.05, metalness: 0.5, roughness: 0.4 },
  'rossz': { opacity: 0.9, brightness: 0.8, emissiveIntensity: 0, metalness: 0.2, roughness: 0.8 },
  // Default
  'default': { opacity: 0.95, brightness: 1, emissiveIntensity: 0.05, metalness: 0.5, roughness: 0.4 },
};

// Optimized window placement function
function generateWindowPositions(
  width: number, 
  height: number, 
  depth: number,
  floors: number,
  density: number = 1
): Vector3[] {
  const positions: Vector3[] = [];
  
  // Determine window spacing based on building size
  const horizontalSpacing = Math.max(0.5, width / Math.ceil(width * 2 * density));
  const verticalSpacing = Math.max(0.4, height / (floors * 3));
  
  // For each floor
  for (let floor = 0; floor < floors; floor++) {
    const y = -height/2 + (floor + 1) * height / (floors + 1);
    
    // Windows on front and back
    for (let x = -width/2 + horizontalSpacing; x < width/2 - horizontalSpacing/2; x += horizontalSpacing) {
      if (Math.random() < 0.8) positions.push(new Vector3(x, y, depth/2 + 0.01));
      if (Math.random() < 0.8) positions.push(new Vector3(x, y, -depth/2 - 0.01));
    }
    
    // Windows on sides
    for (let z = -depth/2 + horizontalSpacing; z < depth/2 - horizontalSpacing/2; z += horizontalSpacing) {
      if (Math.random() < 0.8) positions.push(new Vector3(width/2 + 0.01, y, z));
      if (Math.random() < 0.8) positions.push(new Vector3(-width/2 - 0.01, y, z));
    }
  }
  
  return positions;
}

// Function to determine building colors based on type
const getBuildingColors = (buildingType: string, condition: number = 100) => {
  const types: { [key: string]: { color: string, emissive: string, intensity: number } } = {
    residential: {
      color: '#e6e6e6',
      emissive: '#ffeddb',
      intensity: 0.3
    },
    commercial: {
      color: '#a9d1e8',
      emissive: '#a9c8e8',
      intensity: 0.4
    },
    industrial: {
      color: '#C7C7C7',
      emissive: '#868686',
      intensity: 0.2
    },
    office: {
      color: '#bde0ff',
      emissive: '#8db9ff',
      intensity: 0.5
    },
    government: {
      color: '#d1c0a8',
      emissive: '#ffd0a0',
      intensity: 0.3
    },
    education: {
      color: '#ffcf9e',
      emissive: '#ffe5a0',
      intensity: 0.3
    },
    healthcare: {
      color: '#ffcfcf',
      emissive: '#ffaaaa',
      intensity: 0.3
    },
    entertainment: {
      color: '#d19eff',
      emissive: '#9d4eff',
      intensity: 0.4
    }
  };

  // Default to gray if type not found
  const defaultStyle = {
    color: '#CCCCCC',
    emissive: '#555555',
    intensity: 0.2
  };

  // Get base colors
  const style = types[buildingType] || defaultStyle;
  
  // Adjust based on condition (0-100)
  const conditionFactor = Math.max(0.5, condition / 100);
  
  // Modify color with condition
  const color = style.color;
  const emissiveColor = style.emissive;
  const emissiveIntensity = style.intensity * conditionFactor;
  
  return { color, emissiveColor, emissiveIntensity };
};

// Function to generate window pattern for buildings
const generateWindowPattern = (width: number, height: number, depth: number, type: string) => {
  const pattern: [number, number, number, number, number][] = [];
  
  // Different window patterns based on building type
  const windowDensity = 
    type === 'residential' ? 0.7 :
    type === 'commercial' ? 0.8 :
    type === 'office' ? 0.9 :
    type === 'industrial' ? 0.4 :
    0.6; // default for other types
  
  // Window size varies by building type
  const windowSize = 
    type === 'residential' ? 0.4 :
    type === 'commercial' ? 0.5 :
    type === 'office' ? 0.6 :
    type === 'industrial' ? 0.7 :
    0.5; // default
  
  // Window grid spacing
  const xSpacing = width / Math.max(2, Math.floor(width * 1.5));
  const ySpacing = 1.2; // floor height
  
  // Generate windows for front, back, left, right sides
  const sides = [
    { dim: width, pos: depth/2, dir: 'z', rot: 0 },           // front
    { dim: width, pos: -depth/2, dir: 'z', rot: Math.PI },    // back
    { dim: depth, pos: width/2, dir: 'x', rot: Math.PI/2 },   // right
    { dim: depth, pos: -width/2, dir: 'x', rot: -Math.PI/2 }  // left
  ];
  
  sides.forEach(side => {
    const dimension = side.dim;
    const windows = Math.max(2, Math.floor(dimension * 1.5));
    const offset = dimension / windows;
    
    // Start from bottom of building and go up floor by floor
    for (let y = 1; y < height - 0.5; y += ySpacing) {
      // For each floor, place windows across the facade
      for (let i = 0; i < windows; i++) {
        // Skip some windows based on density
        if (Math.random() > windowDensity) continue;
        
        const xpos = (i * offset) - (dimension / 2) + (offset / 2);
        
        // Position data: [x, y, z, rotation, size]
        if (side.dir === 'z') {
          pattern.push([xpos, y, side.pos, side.rot, windowSize]);
        } else {
          pattern.push([side.pos, y, xpos, side.rot, windowSize]);
        }
      }
    }
  });
  
  return pattern;
};

export function Building({ building, onHover, isSelected = false, performance = 'high' }: BuildingProps) {
  const buildingRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [glowScale, setGlowScale] = useState(1.05);
  const [windowsVisible, setWindowsVisible] = useState(true);
  const [windowPattern, setWindowPattern] = useState<[number, number, number, number, number][]>([]);
  
  const { selectBuilding } = useAppStore();
  
  // Position data from the building
  const position: [number, number, number] = [
    building.position[0],
    building.position[1] || 0,
    building.position[2]
  ];
  
  // Scale data from the building
  const width = building.scale[0];
  const height = building.scale[1];
  const depth = building.scale[2];
  
  // Extract building properties
  const type = building.type || 'residential';
  const condition = building.condition || 100;
  const displayName = building.name || `Building ${building.id}`;
  
  // Compute distance to camera for level of detail (LOD)
  const [distanceToCamera, setDistanceToCamera] = useState(0);
  useFrame(({ camera }) => {
    const dist = new Vector3(...position).distanceTo(camera.position);
    setDistanceToCamera(dist);
  });
  
  // Get colors based on building type
  const { color, emissiveColor, emissiveIntensity } = getBuildingColors(type, condition);
  
  // Generate windows only once or when performance mode changes
  useEffect(() => {
    // Skip detailed windows for low performance mode or distant buildings
    if (performance === 'low' || distanceToCamera > 100) {
      setWindowPattern([]);
      setWindowsVisible(false);
      return;
    }
    
    // Generate windows with reduced density for medium performance
    const density = performance === 'medium' ? 0.5 : 1.0;
    const windowPat = generateWindowPattern(width, height, depth, type);
    
    // Filter windows based on density and performance
    const filteredPattern = windowPat.filter(() => Math.random() < density);
    setWindowPattern(filteredPattern);
    setWindowsVisible(true);
  }, [width, height, depth, type, performance, distanceToCamera]);
  
  // For detail levels based on performance and distance
  const detailLevel = useMemo(() => {
    if (performance === 'low' || distanceToCamera > 150) {
      return 'low';
    } else if (performance === 'medium' || distanceToCamera > 80) {
      return 'medium';
    } else {
      return 'high';
    }
  }, [performance, distanceToCamera]);
  
  // Use simplified geometry for distant buildings
  const buildingGeometry = useMemo(() => {
    // For low detail, use a simple box with basic material
    if (detailLevel === 'low') {
      return (
        <Box 
          args={[width, height, depth]} 
          position={[0, height / 2, 0]}
          castShadow={false}
          receiveShadow={false}
        >
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.95}
          />
        </Box>
      );
    }
    
    // For medium detail, use standard material but no fancy effects
    if (detailLevel === 'medium') {
      return (
        <Box 
          args={[width, height, depth]} 
          position={[0, height / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color={color}
            roughness={0.6}
            metalness={0.2}
            transparent
            opacity={0.95}
          />
        </Box>
      );
    }
    
    // For high detail, use full quality materials and effects
    return (
      <Box 
        args={[width, height, depth]} 
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        ref={meshRef}
      >
        <meshStandardMaterial 
          color={color}
          roughness={0.6}
          metalness={0.2}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.95}
        />
      </Box>
    );
  }, [width, height, depth, color, emissiveColor, emissiveIntensity, detailLevel]);
  
  // Handle pointer events for interactivity
  const handlePointerOver = () => {
    setHovered(true);
    if (onHover) onHover(building.id, true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    if (onHover) onHover(building.id, false);
    document.body.style.cursor = 'auto';
  };
  
  const handleClick = () => {
    selectBuilding(building.id);
  };
  
  // Effect to animate selection/hover state
  useEffect(() => {
    if (isSelected || hovered) {
      setGlowOpacity(isSelected ? 0.6 : 0.3);
      setGlowScale(isSelected ? 1.1 : 1.05);
    } else {
      setGlowOpacity(0);
      setGlowScale(1.05);
    }
  }, [isSelected, hovered]);
  
  // Based on distance and performance, decide whether to render windows
  const shouldRenderWindows = useMemo(() => {
    return windowsVisible && windowPattern.length > 0 && detailLevel === 'high';
  }, [windowsVisible, windowPattern, detailLevel]);
  
  // Skip rendering completely for extremely distant buildings
  if (distanceToCamera > 300 && !isSelected) {
    return null;
  }
  
  return (
    <group 
      ref={buildingRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Main building geometry */}
      {buildingGeometry}
      
      {/* Selection glow effect - only render when selected/hovered */}
      {(isSelected || hovered) && (
        <Box 
          ref={glowRef}
          args={[width * glowScale, height * glowScale, depth * glowScale]} 
          position={[0, height / 2, 0]}
        >
          <meshBasicMaterial 
            color={isSelected ? '#4488ff' : '#ffffff'} 
            transparent
            opacity={glowOpacity}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </Box>
      )}
      
      {/* Windows - only rendered for high detail level */}
      {shouldRenderWindows && windowPattern.map((windowData, i) => {
        const [x, y, z, rotation, size] = windowData;
        return (
          <mesh 
            key={`window-${i}`} 
            position={[x, y, z]} 
            rotation={[0, rotation, 0]}
          >
            <planeGeometry args={[size, size * 1.5]} />
            <meshBasicMaterial
              color="#ffeecc"  
              transparent
              opacity={Math.random() * 0.5 + 0.2} // Randomize window brightness
            />
          </mesh>
        );
      })}
      
      {/* Building label - only shown when selected or for high detail */}
      {(isSelected || (detailLevel === 'high' && distanceToCamera < 60)) && (
        <Float
          position={[0, height + 0.5, 0]}
          rotation={[0, Math.PI / 4, 0]} 
          floatIntensity={0.2}
          speed={1.5}
        >
          <Text
            color="white"
            fontSize={0.5}
            maxWidth={5}
            lineHeight={1}
            letterSpacing={0.02}
            textAlign="center"
            font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
            anchorX="center"
            anchorY="middle"
          >
            {displayName}
          </Text>
        </Float>
      )}
    </group>
  );
} 