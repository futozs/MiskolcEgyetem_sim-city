'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  OrbitControls,
  Sky,
  Text,
  PerspectiveCamera,
  Stars,
  Plane,
  Sphere,
  Box
} from '@react-three/drei';
import { Mesh, Vector3, Color, DoubleSide, Group as ThreeGroup, MeshBasicMaterial } from 'three';
import { Epulet } from '@/lib/api/types';
import { motion } from 'framer-motion';
import { Spinner, Button, ButtonGroup, Tooltip } from '@nextui-org/react';
import { IconZoomIn, IconZoomOut, IconRotate, IconArrowsMaximize, IconSun, IconMoon } from '@tabler/icons-react';

// Props for the EpuletekMap component
interface EpuletekMapProps {
  buildings: Epulet[];
  onSelectBuilding: (building: Epulet) => void;
  selectedBuildingId: number | null;
  isLoading: boolean;
}

// Building component for the 3D representation
interface BuildingProps {
  building: Epulet;
  position: [number, number, number];
  size: [number, number, number];
  onSelect: () => void;
  isSelected: boolean;
  onHover: (isHovered: boolean) => void;
}

// Building component
const Building = ({ building, position, size, onSelect, isSelected, onHover }: BuildingProps) => {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<ThreeGroup>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate building color based on type and condition
  const getBaseColor = () => {
    // Different colors for different building types
    const typeColors = {
      'lakóház': '#4285F4',       // Blue
      'lakóépület': '#4285F4',    // Blue
      'középület': '#0F9D58',     // Green
      'vallási': '#9C27B0',       // Purple
      'oktatási': '#E67C73',      // Coral
      'kereskedelmi': '#F4B400',  // Yellow
      'ipari': '#DB4437',         // Red
      'iroda': '#4DD0E1',         // Cyan
    };
    
    // Default color if type is not found
    const defaultColor = '#757575'; // Gray
    
    // Get the color based on building type (case insensitive)
    const type = building.tipus.toLowerCase();
    let color = defaultColor;
    
    for (const [key, value] of Object.entries(typeColors)) {
      if (type.includes(key.toLowerCase())) {
        color = value;
        break;
      }
    }
    
    return color;
  };
  
  // Get building parameters
  const baseColor = getBaseColor();
  const baseColorObj = new Color(baseColor);
  
  // Material properties based on condition
  const getMaterialProps = () => {
    const condition = building.allapot.toLowerCase();
    
    if (condition.includes('kiváló')) {
      return {
        roughness: 0.2,
        metalness: 0.8,
        emissiveIntensity: 0.2,
        opacity: 1.0
      };
    } else if (condition.includes('megfelelő') || condition.includes('megfelelo')) {
      return {
        roughness: 0.5,
        metalness: 0.5,
        emissiveIntensity: 0.1,
        opacity: 0.9
      };
    } else {
      return {
        roughness: 0.8,
        metalness: 0.2,
        emissiveIntensity: 0.05,
        opacity: 0.8
      };
    }
  };
  
  const { roughness, metalness, emissiveIntensity, opacity } = getMaterialProps();
  
  // Building type helper
  const getBuildingType = () => {
    const type = building.tipus.toLowerCase();
    if (type.includes('lakó')) return 'residential';
    if (type.includes('vallási')) return 'religious';
    if (type.includes('közép')) return 'government';
    if (type.includes('keresk')) return 'commercial';
    return 'generic';
  };
  
  const buildingType = getBuildingType();
  
  // Animation for hover and selection
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Hover animation
    if (hovered || isSelected) {
      // Make the building float up slightly when hovered or selected
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.3;
      
      // Make selected buildings glow more and animate scale
      if (isSelected) {
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
        groupRef.current.scale.set(
          size[0] * pulseScale,
          size[1] * pulseScale,
          size[2] * pulseScale
        );
      }
    } else {
      // Reset position and scale when not hovered or selected
      groupRef.current.position.y = position[1];
      groupRef.current.scale.set(size[0], size[1], size[2]);
    }
  });
  
  // Event handlers
  const handlePointerOver = () => {
    setHovered(true);
    onHover(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    onHover(false);
    document.body.style.cursor = 'default';
  };
  
  // Render building based on type
  const renderBuildingByType = () => {
    switch (buildingType) {
      case 'religious':
        return (
          <>
            {/* Base */}
            <Box args={[1, 0.15, 1]} position={[0, -0.425, 0]}>
              <meshStandardMaterial 
                color="#d1c4e9" 
                roughness={0.7} 
                metalness={0.3}
              />
            </Box>
            
            {/* Main building */}
            <Box args={[0.8, 0.7, 0.8]} position={[0, 0, 0]}>
              <meshStandardMaterial 
                color={baseColorObj}
                roughness={roughness} 
                metalness={metalness}
                emissive={baseColorObj}
                emissiveIntensity={emissiveIntensity}
              />
            </Box>
            
            {/* Tower */}
            <Box args={[0.3, 1.2, 0.3]} position={[0, 0.95, 0]}>
              <meshStandardMaterial 
                color={baseColorObj}
                roughness={roughness} 
                metalness={metalness}
                emissive={baseColorObj}
                emissiveIntensity={emissiveIntensity}
              />
            </Box>
            
            {/* Roof */}
            <Sphere args={[0.2, 16, 16]} position={[0, 1.65, 0]}>
              <meshStandardMaterial 
                color="#b39ddb" 
                roughness={0.1} 
                metalness={0.9}
                emissive="#b39ddb"
                emissiveIntensity={0.2}
              />
            </Sphere>
          </>
        );
        
      case 'government':
        return (
          <>
            {/* Base */}
            <Box args={[1.2, 0.1, 1.2]} position={[0, -0.45, 0]}>
              <meshStandardMaterial 
                color="#b2dfdb" 
                roughness={0.7} 
                metalness={0.3}
              />
            </Box>
            
            {/* Columns */}
            {[-0.4, 0.4].map((x) => (
              [-0.4, 0.4].map((z) => (
                <Box 
                  key={`column-${x}-${z}`} 
                  args={[0.1, 0.7, 0.1]} 
                  position={[x, -0.15, z]}
                >
                  <meshStandardMaterial 
                    color="#e0f2f1" 
                    roughness={0.5} 
                    metalness={0.5} 
                  />
                </Box>
              ))
            ))}
            
            {/* Main building */}
            <Box args={[1, 0.6, 1]} position={[0, 0.15, 0]}>
              <meshStandardMaterial 
                color={baseColorObj}
                roughness={roughness} 
                metalness={metalness}
                emissive={baseColorObj}
                emissiveIntensity={emissiveIntensity}
              />
            </Box>
            
            {/* Roof */}
            <Box args={[1.1, 0.2, 1.1]} position={[0, 0.55, 0]}>
              <meshStandardMaterial 
                color="#80cbc4" 
                roughness={0.3} 
                metalness={0.7} 
              />
            </Box>
          </>
        );
      
      case 'commercial':
        return (
          <>
            {/* Base */}
            <Box args={[1, 0.05, 1]} position={[0, -0.475, 0]}>
              <meshStandardMaterial 
                color="#ffe0b2" 
                roughness={0.6} 
                metalness={0.4} 
              />
            </Box>
            
            {/* Main building - multiple floors */}
            {Array.from({ length: 3 }).map((_, i) => (
              <Box 
                key={`floor-${i}`}
                args={[1, 0.3, 1]} 
                position={[0, i * 0.32 - 0.32, 0]}
              >
                <meshStandardMaterial 
                  color={baseColorObj}
                  roughness={roughness} 
                  metalness={metalness}
                  emissive={baseColorObj}
                  emissiveIntensity={emissiveIntensity}
                />
              </Box>
            ))}
            
            {/* Windows */}
            {Array.from({ length: 2 }).map((_, floor) => (
              [-0.3, 0.3].map((x) => (
                [-0.3, 0.3].map((z) => (
                  <Box 
                    key={`window-${floor}-${x}-${z}`}
                    args={[0.2, 0.1, 0.05]} 
                    position={[x, floor * 0.32 - 0.32, z > 0 ? 0.48 : -0.48]}
                  >
                    <meshStandardMaterial 
                      color="#fffde7" 
                      roughness={0.1} 
                      metalness={0.9}
                      transparent
                      opacity={0.7}
                      emissive="#fffde7"
                      emissiveIntensity={0.5}
                    />
                  </Box>
                ))
              ))
            ))}
          </>
        );
      
      case 'residential':
        return (
          <>
            {/* Base */}
            <Box args={[1, 0.05, 1]} position={[0, -0.475, 0]}>
              <meshStandardMaterial 
                color="#bbdefb" 
                roughness={0.7} 
                metalness={0.3} 
              />
            </Box>
            
            {/* Main building */}
            <Box args={[1, 0.8, 1]} position={[0, -0.05, 0]}>
              <meshStandardMaterial 
                color={baseColorObj}
                roughness={roughness} 
                metalness={metalness}
                emissive={baseColorObj}
                emissiveIntensity={emissiveIntensity}
              />
            </Box>
            
            {/* Roof */}
            <Box args={[1.2, 0.2, 1.2]} position={[0, 0.45, 0]} rotation={[0, Math.PI / 4, 0]}>
              <meshStandardMaterial 
                color="#64b5f6" 
                roughness={0.5} 
                metalness={0.5} 
              />
            </Box>
            
            {/* Windows */}
            {[-0.3, 0.3].map((x) => (
              <Box 
                key={`window-front-${x}`}
                args={[0.2, 0.2, 0.05]} 
                position={[x, 0, 0.48]}
              >
                <meshStandardMaterial 
                  color="#e3f2fd" 
                  roughness={0.1} 
                  metalness={0.9}
                  transparent
                  opacity={0.7}
                  emissive="#e3f2fd"
                  emissiveIntensity={0.3}
                />
              </Box>
            ))}
            <Box 
              args={[0.3, 0.4, 0.05]} 
              position={[0, -0.2, 0.48]}
            >
              <meshStandardMaterial 
                color="#0d47a1" 
                roughness={0.5} 
                metalness={0.5}
              />
            </Box>
          </>
        );
      
      default:
        // Generic building
        return (
          <Box args={[1, 1, 1]} position={[0, 0, 0]}>
            <meshStandardMaterial
              color={baseColorObj}
              opacity={opacity}
              transparent={opacity < 1}
              emissive={baseColorObj}
              emissiveIntensity={hovered ? 0.4 : isSelected ? 0.6 : emissiveIntensity}
              roughness={hovered ? 0.1 : isSelected ? 0.05 : roughness}
              metalness={hovered ? 0.9 : isSelected ? 1.0 : metalness}
              envMapIntensity={hovered || isSelected ? 2 : 1}
            />
          </Box>
        );
    }
  };
  
  return (
    <group
      ref={groupRef}
      position={position}
      scale={size}
      onClick={onSelect}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderBuildingByType()}
      
      {/* Glow effect for selected buildings */}
      {(isSelected || hovered) && (
        <Sphere args={[1.2, 8, 8]} scale={[1, 0.7, 1]}>
          <meshBasicMaterial
            color={baseColorObj}
            transparent
            opacity={isSelected ? 0.15 : hovered ? 0.07 : 0}
            wireframe
          />
        </Sphere>
      )}
    </group>
  );
};

// Car component - simplified low poly version
const Car = ({ position, direction, speed = 0.1, color = '#e53935' }: { 
  position: [number, number, number], 
  direction: 'x' | 'z',
  speed?: number,
  color?: string
}) => {
  const meshRef = useRef<ThreeGroup>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const worldLimit = 50; // A világ határa
  const initialRotation = useRef(direction === 'x' ? (speed > 0 ? Math.PI / 2 : -Math.PI / 2) : (speed > 0 ? 0 : Math.PI));

  // Optimize car movement with fewer updates
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Only update every other frame to improve performance
    if (Math.floor(clock.getElapsedTime() * 10) % 2 !== 0) return;
    
    // Simplified movement logic
    if (direction === 'x') {
      let newPos = currentPosition[0] + currentSpeed;
      if (newPos > worldLimit || newPos < -worldLimit) {
        currentSpeed > 0 ? setCurrentSpeed(-speed) : setCurrentSpeed(speed);
        initialRotation.current = currentSpeed > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        meshRef.current.position.x = newPos;
        setCurrentPosition([newPos, currentPosition[1], currentPosition[2]]);
      }
      meshRef.current.rotation.y = initialRotation.current;
    } else {
      let newPos = currentPosition[2] + currentSpeed;
      if (newPos > worldLimit || newPos < -worldLimit) {
        currentSpeed > 0 ? setCurrentSpeed(-speed) : setCurrentSpeed(speed);
        initialRotation.current = currentSpeed > 0 ? Math.PI : 0;
      } else {
        meshRef.current.position.z = newPos;
        setCurrentPosition([currentPosition[0], currentPosition[1], newPos]);
      }
      meshRef.current.rotation.y = initialRotation.current;
    }
  });
  
  return (
    <group 
      ref={meshRef} 
      position={position} 
      rotation={[0, initialRotation.current, 0]}
    >
      {/* Simplified car body - single box */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Simple wheels - reduced geometry */}
      {[
        [-0.25, 0.15, 0.2],
        [0.25, 0.15, 0.2],
        [-0.25, 0.15, -0.2],
        [0.25, 0.15, -0.2]
      ].map((wheelPos, i) => (
        <mesh 
          key={`wheel-${i}`} 
          castShadow 
          position={wheelPos as [number, number, number]}
        >
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#212121" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// Definiáljuk a Ground komponens prop típusait
interface GroundProps {
  cellSize?: number;
  gridSize?: number;
}

// Fog optimization based on view mode
const OptimizedFog = ({ isDaytime, worldSize }: { isDaytime: boolean, worldSize: number }) => {
  const fogColor = isDaytime ? "#e8f5e9" : "#0a192f";
  const fogNear = isDaytime ? worldSize * 0.8 : worldSize * 0.6;
  const fogFar = isDaytime ? worldSize * 2 : worldSize * 1.5;
  
  return <fog attach="fog" args={[fogColor, fogNear, fogFar]} />;
};

// A Ground komponens a várostervezési alapot jeleníti meg
const Ground: React.FC<GroundProps> = ({ cellSize = 10, gridSize = 10 }) => {
  // Teljes világ mérete
  const worldSize = cellSize * gridSize;
  
  return (
    <>
      {/* Alap felszín */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[worldSize + cellSize, worldSize + cellSize]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* Cellák kiemelése */}
      {Array.from({ length: gridSize }).map((_, row) =>
        Array.from({ length: gridSize }).map((_, col) => {
          // Cella középpontja
          const x = col * cellSize - (worldSize / 2) + (cellSize / 2);
          const z = row * cellSize - (worldSize / 2) + (cellSize / 2);
          
          return (
            <mesh 
              key={`cell-${row}-${col}`}
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[x, -0.09, z]}
              receiveShadow
            >
              <planeGeometry args={[cellSize - 1, cellSize - 1]} />
              <meshStandardMaterial color="#676767" />
            </mesh>
          );
        })
      )}
      
      {/* Utak megjelenítése - egyszerűsített */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.095, 0]} receiveShadow>
        <planeGeometry args={[worldSize, worldSize]} />
        <meshBasicMaterial color="#444444" wireframe={true} />
      </mesh>
    </>
  );
};

// Tree component - simplified low poly version
const Tree = ({ position, size = 1 }: { position: [number, number, number], size?: number }) => {
  const treeRef = useRef<ThreeGroup>(null);
  
  // Reduce animation frequency for better performance
  useFrame(({ clock }) => {
    if (treeRef.current) {
      // Gentle swaying animation with reduced complexity
      if (Math.floor(clock.getElapsedTime() * 2) % 3 === 0) {
        treeRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.02;
        treeRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
      }
    }
  });
  
  // Default tree with lower polygon count
  return (
    <group position={position} ref={treeRef} scale={[size, size, size]}>
      {/* Trunk - reduced geometry */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.6, 6]} />
        <meshStandardMaterial color="#795548" roughness={0.8} />
      </mesh>
      
      {/* Leaves - reduced geometry */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[1.2, 6, 6]} />
        <meshStandardMaterial color="#4CAF50" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Sun/Moon Object - simplified
const CelestialBody = ({ isDaytime }: { isDaytime: boolean }) => {
  const ref = useRef<Mesh>(null);
  
  if (isDaytime) {
    return (
      <mesh ref={ref} position={[80, 80, -80]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#FFEB3B" />
      </mesh>
    );
  } else {
    return (
      <mesh ref={ref} position={[-60, 40, -80]}>
        <sphereGeometry args={[5, 12, 12]} />
        <meshStandardMaterial color="#ECEFF1" emissive="#F5F5F5" emissiveIntensity={0.5} />
      </mesh>
    );
  }
};

// Main component
export function EpuletekMap({ buildings, onSelectBuilding, selectedBuildingId, isLoading }: EpuletekMapProps) {
  const [viewMode, setViewMode] = useState<'day' | 'night'>('day');
  const [cameraPosition, setCameraPosition] = useState<'top' | 'isometric' | 'front'>('isometric');
  const controlsRef = useRef<any>(null);
  
  // Camera position presets
  const cameraPositions: {[key: string]: [number, number, number]} = {
    top: [0, 100, 0],
    isometric: [30, 30, 30],
    front: [0, 10, 50]
  };
  
  // Zoom helpers
  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2);
    }
  };
  
  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2);
    }
  };
  
  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-primary">Épületek betöltése...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      {/* Control panel */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
        <ButtonGroup variant="flat" size="sm" className="pointer-events-auto">
          <Tooltip content="Nagyítás">
            <Button isIconOnly onClick={handleZoomIn}><IconZoomIn size={18} /></Button>
          </Tooltip>
          <Tooltip content="Kicsinyítés">
            <Button isIconOnly onClick={handleZoomOut}><IconZoomOut size={18} /></Button>
          </Tooltip>
          <Tooltip content="Alaphelyzet">
            <Button isIconOnly onClick={handleReset}><IconArrowsMaximize size={18} /></Button>
          </Tooltip>
        </ButtonGroup>
        
        <ButtonGroup variant="flat" size="sm" className="pointer-events-auto">
          <Tooltip content="Felülnézet">
            <Button
              onClick={() => setCameraPosition('top')} 
              className={cameraPosition === 'top' ? 'bg-primary-100 text-primary' : ''}
            >
              Felülnézet
            </Button>
          </Tooltip>
          <Tooltip content="Izometrikus nézet">
            <Button
              onClick={() => setCameraPosition('isometric')} 
              className={cameraPosition === 'isometric' ? 'bg-primary-100 text-primary' : ''}
            >
              Izometrikus
            </Button>
          </Tooltip>
          <Tooltip content="Elölnézet">
            <Button
              onClick={() => setCameraPosition('front')} 
              className={cameraPosition === 'front' ? 'bg-primary-100 text-primary' : ''}
            >
              Elölnézet
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        <ButtonGroup variant="flat" size="sm" className="pointer-events-auto">
          <Tooltip content="Nappal">
            <Button
              isIconOnly 
              onClick={() => setViewMode('day')} 
              className={viewMode === 'day' ? 'bg-primary-100 text-primary' : ''}
            >
              <IconSun size={18} />
            </Button>
          </Tooltip>
          <Tooltip content="Éjszaka">
            <Button
              isIconOnly 
              onClick={() => setViewMode('night')} 
              className={viewMode === 'night' ? 'bg-primary-100 text-primary' : ''}
            >
              <IconMoon size={18} />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </div>
      
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: true,
          precision: "highp"
        }}
        camera={{ position: cameraPositions[cameraPosition], fov: 50 }}
      >
        <Scene 
          buildings={buildings} 
          onSelectBuilding={onSelectBuilding} 
          selectedBuildingId={selectedBuildingId}
          viewMode={viewMode}
          cameraPosition={cameraPosition}
          controlsRef={controlsRef}
        />
      </Canvas>
    </div>
  );
}

// Enhanced Scene component with further optimizations
const Scene = ({ 
  buildings, 
  onSelectBuilding, 
  selectedBuildingId,
  viewMode,
  cameraPosition,
  controlsRef
}: {
  buildings: Epulet[],
  onSelectBuilding: (building: Epulet) => void,
  selectedBuildingId: number | null,
  viewMode: 'day' | 'night',
  cameraPosition: 'top' | 'isometric' | 'front',
  controlsRef: React.RefObject<any>
}) => {
  const [timeOfDay, setTimeOfDay] = useState(viewMode === 'day' ? 0.5 : 0.8);
  const [hoverInfo, setHoverInfo] = useState<{ id: number, position: Vector3 } | null>(null);
  const isDaytime = viewMode === 'day';
  
  // Performance optimizations for night mode
  const skyProps = useMemo(() => ({
    distance: isDaytime ? 450000 : 300000,
    turbidity: isDaytime ? 10 : 8,
    rayleigh: isDaytime ? 0.5 : 3,
    resolution: isDaytime ? 1024 : 512, // Lower resolution in night mode for better performance
  }), [isDaytime]);
  
  useEffect(() => {
    setTimeOfDay(viewMode === 'day' ? 0.5 : 0.8);
  }, [viewMode]);
  
  // Négyzetrácsos elrendezés beállításai
  const gridSize = 10; // A rács mérete (10x10)
  const cellSize = 10; // Egy cella mérete
  const worldSize = gridSize * cellSize;
  
  // Calculate grid layout for buildings
  const buildingLayout = useMemo(() => {
    if (!buildings || buildings.length === 0) return [];
    
    // Determinisztikus elhelyezés: egy épület - egy cella
    const result = [];
    const availableCells = [];
    
    // Minden cellát előkészítünk
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Minden cellának pontos középpontja van
        const x = col * cellSize - (worldSize / 2) + (cellSize / 2);
        const z = row * cellSize - (worldSize / 2) + (cellSize / 2);
        
        availableCells.push({ row, col, x, z });
      }
    }
    
    // Rendezzük a cellákat, hogy előre tervezhető legyen az elhelyezés
    // Bal felső saroktól kezdve jobbra és lefelé
    availableCells.sort((a, b) => {
      if (a.row === b.row) {
        return a.col - b.col;
      }
      return a.row - b.row;
    });
    
    // Épületek elhelyezése, minden elérhető cellát használunk
    const maxBuildings = Math.min(buildings.length, availableCells.length);
    
    for (let i = 0; i < maxBuildings; i++) {
      const building = buildings[i];
      const cell = availableCells[i];
      
      // Épület magasságának kiszámítása alapterület alapján
      const baseSize = Math.log(building.alapterulet) / 2.5;
      const maxSize = Math.min(cellSize / 3, Math.max(1, baseSize)); // Méretkorlát
      
      // Épület típusa befolyásolja a magasságot
      const heightMultiplier = 
        building.tipus.toLowerCase().includes('vallási') ? 2 :
        building.tipus.toLowerCase().includes('középület') ? 1.5 :
        building.tipus.toLowerCase().includes('kereskedelmi') ? 1.2 : 1;
      
      result.push({
        building,
        position: [cell.x, 0, cell.z] as [number, number, number], // Pontosan a cella közepére
        size: [maxSize, maxSize * heightMultiplier, maxSize] as [number, number, number]
      });
    }
    
    return result;
  }, [buildings]);
  
  // Generate trees at specific locations, enhancing the scene
  const treePositions = useMemo(() => {
    const positions = [];
    
    // Építkezések által elfoglalt cellák nyilvántartása
    const usedCells = new Set();
    const buildingCells = new Set();
    
    // Az épületek által elfoglalt cellák megjelölése
    buildingLayout.forEach(({ position }) => {
      const [x, _, z] = position;
      // Meghatározzuk, melyik cellában van az épület, a cella középpontja alapján
      const col = Math.floor((x + worldSize / 2) / cellSize);
      const row = Math.floor((z + worldSize / 2) / cellSize);
      usedCells.add(`${row}-${col}`);
      buildingCells.add(`${row}-${col}`);
    });
    
    // Fák elhelyezése olyan cellákban, ahol nincs épület
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellKey = `${row}-${col}`;
        
        // Cella középpontjának kiszámítása
        const cellX = col * cellSize - (worldSize / 2) + (cellSize / 2);
        const cellZ = row * cellSize - (worldSize / 2) + (cellSize / 2);
        
        if (!usedCells.has(cellKey)) {
          // Üres cellákba több fát helyezünk el véletlenszerűen
          const treeCount = 2 + Math.floor(Math.random() * 3); // 2-4 fa üres cellákban
          
          for (let i = 0; i < treeCount; i++) {
            const offsetX = (Math.random() - 0.5) * (cellSize * 0.8);
            const offsetZ = (Math.random() - 0.5) * (cellSize * 0.8);
            
            positions.push({
              position: [cellX + offsetX, 0, cellZ + offsetZ] as [number, number, number],
              size: 0.6 + Math.random() * 0.7,
              type: (Math.random() > 0.7 ? 'pine' : Math.random() > 0.9 ? 'palm' : 'normal') as 'normal' | 'pine' | 'palm'
            });
          }
        } else {
          // Ha van épület a cellában, akkor is helyezzünk el fákat a széleknél
          if (buildingCells.has(cellKey)) {
            // Épületek mellé kisebb fákat helyezünk, a cella szélén
            const edgeOffsets = [
              [-0.4, -0.4], // Bal alsó sarok
              [-0.4, 0.4],  // Bal felső sarok
              [0.4, -0.4],  // Jobb alsó sarok
              [0.4, 0.4],   // Jobb felső sarok
            ];
            
            // Véletlenszerűen válasszunk 2 sarkot, ahol fák lesznek
            const shuffledOffsets = [...edgeOffsets].sort(() => Math.random() - 0.5).slice(0, 2);
            
            shuffledOffsets.forEach(([offsetXPct, offsetZPct]) => {
              const treeX = cellX + offsetXPct * cellSize * 0.9;
              const treeZ = cellZ + offsetZPct * cellSize * 0.9;
              
              positions.push({
                position: [treeX, 0, treeZ] as [number, number, number],
                size: 0.4 + Math.random() * 0.3, // Kisebb fák az épületek mellett
                type: Math.random() > 0.6 ? 'normal' : 'pine' as 'normal' | 'pine'
              });
            });
          }
        }
      }
    }
    
    // Park területekre extra fákat és bokrokat
    const parkCount = Math.floor(gridSize * gridSize / 10);
    for (let i = 0; i < parkCount; i++) {
      // Véletlenszerű pozíció a világban
      const parkX = (Math.random() - 0.5) * worldSize * 0.8;
      const parkZ = (Math.random() - 0.5) * worldSize * 0.8;
      
      // Több fa csoportokban
      const treeClusterCount = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < treeClusterCount; j++) {
        const clusterX = parkX + (Math.random() - 0.5) * 8;
        const clusterZ = parkZ + (Math.random() - 0.5) * 8;
        
        positions.push({
          position: [clusterX, 0, clusterZ] as [number, number, number],
          size: 0.7 + Math.random() * 0.8,
          type: (Math.random() > 0.5 ? 'normal' : Math.random() > 0.7 ? 'palm' : 'pine') as 'normal' | 'pine' | 'palm'
        });
      }
    }
    
    return positions;
  }, [buildingLayout, worldSize, gridSize, cellSize]);
  
  // Autók generálása az utakra
  const cars = useMemo(() => {
    const carList = [];
    const carCount = 20; // Autók száma
    
    // Vízszintes utakon lévő autók
    for (let i = 0; i < carCount / 2; i++) {
      // Véletlenszerű út kiválasztása (minden egész indexű koordináta út)
      const roadIndex = Math.floor(Math.random() * (gridSize + 1));
      const roadPosition = roadIndex * cellSize - (worldSize / 2);
      
      // Véletlenszerű színek
      const carColors = ['#e53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FB8C00'];
      const randomColor = carColors[Math.floor(Math.random() * carColors.length)];
      
      carList.push({
        position: [-worldSize / 2, 0.1, roadPosition] as [number, number, number],
        direction: 'x' as 'x' | 'z',
        speed: 0.05 + Math.random() * 0.15, // Véletlenszerű sebesség
        color: randomColor
      });
    }
    
    // Függőleges utakon lévő autók
    for (let i = 0; i < carCount / 2; i++) {
      // Véletlenszerű út kiválasztása
      const roadIndex = Math.floor(Math.random() * (gridSize + 1));
      const roadPosition = roadIndex * cellSize - (worldSize / 2);
      
      // Véletlenszerű színek
      const carColors = ['#e53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FB8C00'];
      const randomColor = carColors[Math.floor(Math.random() * carColors.length)];
      
      carList.push({
        position: [roadPosition, 0.1, -worldSize / 2] as [number, number, number],
        direction: 'z' as 'x' | 'z',
        speed: 0.05 + Math.random() * 0.15, // Véletlenszerű sebesség
        color: randomColor
      });
    }
    
    return carList;
  }, [worldSize, gridSize, cellSize]);
  
  // Handle building hover
  const handleBuildingHover = (buildingId: number, position: [number, number, number], isHovered: boolean) => {
    if (isHovered) {
      setHoverInfo({ 
        id: buildingId, 
        position: new Vector3(position[0], position[1] + 5, position[2]) 
      });
    } else if (hoverInfo && hoverInfo.id === buildingId) {
      setHoverInfo(null);
    }
  };
  
  // Focus camera on a selected building
  useEffect(() => {
    if (selectedBuildingId && controlsRef.current) {
      const selectedLayout = buildingLayout.find(
        item => item.building.azonosito === selectedBuildingId
      );
      
      if (selectedLayout) {
        const [x, y, z] = selectedLayout.position;
        // Animate camera target to focus on the selected building
        controlsRef.current.target.set(x, y + 2, z);
      }
    }
  }, [selectedBuildingId, buildingLayout, controlsRef]);
  
  // Environmental lighting
  const lightIntensity = isDaytime ? 1.2 : 0.3;
  
  // Sun position
  const sunPosition = isDaytime
    ? [100, 100, 100]  // Day
    : [-100, -50, -100]; // Night
  
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[30, 50, 30]}
        far={1000}
        near={0.1}
        fov={45}
      />
      
      {/* Add OrbitControls with the correct ref */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={5}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
      
      {/* Nap/Hold és környezeti világítás */}
      <directionalLight
        castShadow
        position={[60, 100, 30]}
        intensity={isDaytime ? 0.1 : 0.4}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
      />
      
      <hemisphereLight 
        intensity={isDaytime ? 0.1 : 0.5} 
        color="#ffffff" 
        groundColor="#444444" 
      />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={isDaytime ? 0 : 1500} 
        factor={4} 
        saturation={0} 
      />
      
      <Sky {...skyProps} />
      <OptimizedFog 
        isDaytime={isDaytime}
        worldSize={worldSize}
      />
      
      <directionalLight
        position={sunPosition as [number, number, number]}
        intensity={lightIntensity}
        castShadow={isDaytime} // Only cast shadows in day mode to improve performance
      >
        {isDaytime && 
          <orthographicCamera attach="shadow-camera" args={[-worldSize, worldSize, worldSize, -worldSize, 0.5, 500]} />
        }
      </directionalLight>
      
      {/* Night lighting - optimized */}
      {!isDaytime && (
        <>
          <pointLight position={[20, 15, 20]} intensity={0.4} color="#4fc3f7" distance={50} decay={2} />
          <pointLight position={[-30, 10, -20]} intensity={0.3} color="#ffab40" distance={40} decay={2} />
          
          {/* Street lights at intersections - reduced quantity */}
          {Array.from({ length: Math.min(3, Math.floor(gridSize / 3)) + 1 }).map((_, rowIndex) => {
            const z = rowIndex * cellSize * 3 - (worldSize / 2);
            
            return Array.from({ length: Math.min(3, Math.floor(gridSize / 3)) + 1 }).map((_, colIndex) => {
              const x = colIndex * cellSize * 3 - (worldSize / 2);
              
              return (
                <group key={`street-light-${rowIndex}-${colIndex}`}>
                  <pointLight
                    position={[x, 4, z]}
                    intensity={0.4}
                    color="#FFCC80"
                    distance={cellSize}
                    decay={2}
                  />
                  <mesh position={[x, 2, z]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 4, 6]} />
                    <meshStandardMaterial color="#616161" />
                  </mesh>
                  <mesh position={[x, 4, z]} castShadow>
                    <sphereGeometry args={[0.3, 8, 8]} />
                    <meshStandardMaterial 
                      color={isDaytime ? "#BDBDBD" : "#FFCC80"} 
                      emissive={isDaytime ? "#BDBDBD" : "#FFCC80"}
                      emissiveIntensity={isDaytime ? 0 : 0.5} 
                    />
                  </mesh>
                </group>
              );
            });
          }).flat()}
        </>
      )}
      
      {/* Environment */}
      <Environment preset={isDaytime ? "city" : "night"} />
      
      {/* Sky with correct day/night setting */}
      <Sky 
        distance={skyProps.distance}
        sunPosition={sunPosition as [number, number, number]}
        inclination={isDaytime ? 0.5 : 0.2}
        azimuth={0.25}
        turbidity={skyProps.turbidity}
        rayleigh={skyProps.rayleigh}
      />
      
      {/* Custom sun or moon */}
      <CelestialBody isDaytime={isDaytime} />
      
      {/* Reduced number of trees - only show some trees */}
      {treePositions.slice(0, Math.min(20, treePositions.length)).map((tree, i) => (
        <Tree 
          key={`tree-${i}`} 
          position={tree.position} 
          size={tree.size} 
        />
      ))}
      
      {/* Reduced number of cars for better performance */}
      {cars.slice(0, Math.min(10, cars.length)).map((car, i) => (
        <Car
          key={`car-${i}`}
          position={car.position}
          direction={car.direction}
          speed={car.speed}
          color={car.color}
        />
      ))}
      
      {/* Ground with enhanced features */}
      <Ground cellSize={cellSize} gridSize={gridSize} />
      
      {/* Buildings */}
      {buildingLayout.map(({ building, position, size }) => (
        <group key={building.azonosito}>
          <Building 
            building={building}
            position={position}
            size={size}
            onSelect={() => onSelectBuilding(building)}
            isSelected={selectedBuildingId === building.azonosito}
            onHover={(isHovered) => handleBuildingHover(building.azonosito, position, isHovered)}
          />
          
          {/* Építési telek határok megjelenítése - kiemelés */}
          <Plane
            args={[cellSize * 0.9, cellSize * 0.9]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[position[0], -0.09, position[2]]}
            receiveShadow
          >
            <meshStandardMaterial
              color={selectedBuildingId === building.azonosito ? "#E8F5E9" : "#ECEFF1"}
              transparent
              opacity={selectedBuildingId === building.azonosito ? 0.4 : 0.1}
              roughness={0.9}
              metalness={0.1}
            />
          </Plane>
          
          {/* Building labels */}
          {(selectedBuildingId === building.azonosito || 
            (hoverInfo && hoverInfo.id === building.azonosito)) && (
            <Text
              position={[position[0], position[1] + size[1] * 1.5, position[2]]}
              color="white"
              fontSize={0.8}
              maxWidth={10}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.05}
              outlineColor="#000000"
              renderOrder={1}
              material={new MeshBasicMaterial({ depthTest: false })}
            >
              {building.nev}
            </Text>
          )}
        </group>
      ))}
    </>
  );
}; 