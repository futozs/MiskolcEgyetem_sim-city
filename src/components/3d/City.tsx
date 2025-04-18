'use client';

import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { 
  Html,
  useProgress,
  OrbitControls,
  Sky,
  Stars,
  Box,
  AdaptiveDpr,
  PerformanceMonitor,
  BakeShadows,
  ContactShadows
} from '@react-three/drei';
import { Vector3, MathUtils, DirectionalLight } from 'three';
import { Ground } from './Ground';
import { Weather } from './Weather';
import { LowPolyForest } from './LowPolyForest';

// Building data type definition
interface BuildingPosition {
  id: number;
  position: [number, number, number];
  scale: [number, number, number];
  type?: string;
}

// Loading component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="w-48 bg-black/80 p-4 rounded-lg text-center">
        <div className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
        <div className="text-white">Betöltés: {Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Low Poly Building component
function LowPolyBuilding({ 
  position, 
  scale, 
  type = 'residential', 
  isSelected = false,
  onClick = () => {}
}: { 
  position: [number, number, number]; 
  scale: [number, number, number]; 
  type?: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  // Height for low-poly buildings is capped
  const height = Math.min(scale[1], 8);
  const width = scale[0];
  const depth = scale[2];
  
  // Define building colors based on type - enhanced colors
  const getColors = () => {
    const types: {[key: string]: {base: string, roof: string, windows: string, emissive: string}} = {
      'residential': {
        base: '#e8e8e8', 
        roof: '#ff9800',
        windows: '#bbdefb',
        emissive: '#ffecb3'
      },
      'commercial': {
        base: '#90caf9', 
        roof: '#1976d2',
        windows: '#e3f2fd',
        emissive: '#bbdefb'
      },
      'industrial': {
        base: '#b0bec5', 
        roof: '#455a64',
        windows: '#cfd8dc',
        emissive: '#90a4ae'
      },
      'office': {
        base: '#80deea', 
        roof: '#0097a7',
        windows: '#e0f7fa',
        emissive: '#b2ebf2'
      }
    };
    
    return types[type] || types['residential'];
  };
  
  const colors = getColors();
  
  return (
    <group 
      position={position} 
      onClick={onClick}
      scale={isSelected ? [1.05, 1.05, 1.05] : [1, 1, 1]}
    >
      {/* Building Base */}
      <Box 
        args={[width, height, depth]} 
        position={[0, height/2, 0]}
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={colors.base} 
          roughness={0.6} 
          metalness={0.2} 
          emissive={isSelected ? colors.emissive : '#000000'} 
          emissiveIntensity={isSelected ? 0.6 : 0}
          envMapIntensity={1.5}
        />
      </Box>
      
      {/* Simple Roof */}
      <Box 
        args={[width, height * 0.2, depth]} 
        position={[0, height + (height * 0.1), 0]}
        castShadow
      >
        <meshStandardMaterial 
          color={colors.roof} 
          roughness={0.4} 
          metalness={0.3}
          envMapIntensity={1.8}
        />
      </Box>
      
      {/* Windows (front side) */}
      <Box 
        args={[width * 0.6, height * 0.4, 0.1]} 
        position={[0, height * 0.6, depth/2 + 0.06]}
      >
        <meshStandardMaterial 
          color={colors.windows} 
          roughness={0.2} 
          metalness={0.8} 
          emissive={colors.windows} 
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
          envMapIntensity={2.0}
        />
      </Box>
      
      {/* Windows (back side) */}
      <Box 
        args={[width * 0.6, height * 0.4, 0.1]} 
        position={[0, height * 0.6, -depth/2 - 0.06]}
      >
        <meshStandardMaterial 
          color={colors.windows} 
          roughness={0.2} 
          metalness={0.8} 
          emissive={colors.windows} 
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
          envMapIntensity={2.0}
        />
      </Box>
    </group>
  );
}

// Lighting system for the city - enhanced with better lighting
function CityLighting({ 
  isDaytime = true, 
  transitionProgress = 1 
}) {
  const directionalLightRef = useRef<DirectionalLight>(null);
  const [ambientIntensity, setAmbientIntensity] = useState(isDaytime ? 0.7 : 0.15);
  const [sunIntensity, setSunIntensity] = useState(isDaytime ? 1.2 : 0.0);

  useEffect(() => {
    // Smooth transition between day and night
    const targetAmbient = isDaytime ? 0.7 : 0.15;
    const targetSun = isDaytime ? 1.2 : 0.0;
    
    setAmbientIntensity(MathUtils.lerp(
      isDaytime ? 0.15 : 0.7, 
      targetAmbient, 
      transitionProgress
    ));
    
    setSunIntensity(MathUtils.lerp(
      isDaytime ? 0.0 : 1.2, 
      targetSun, 
      transitionProgress
    ));
  }, [isDaytime, transitionProgress]);
  
  // Position the sun based on time of day
  const sunPosition = useMemo(() => {
    if (isDaytime) {
      return [50 * Math.cos(transitionProgress * Math.PI), 60, 50 * Math.sin(transitionProgress * Math.PI)];
    }
    return [-10, -10, -10]; // Below horizon at night
  }, [isDaytime, transitionProgress]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={isDaytime ? '#e0f7ff' : '#0a1a2a'} />
      
      <directionalLight
        ref={directionalLightRef}
        position={sunPosition as [number, number, number]}
        intensity={sunIntensity}
        castShadow={isDaytime}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={150}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0001}
        color={isDaytime ? '#fffaea' : '#2a446e'}
      />
      
      {/* Additional fill light for shadows */}
      <directionalLight
        position={[-20, 30, 10]}
        intensity={isDaytime ? 0.4 : 0.08}
        castShadow={false}
        color={isDaytime ? '#cbe8ff' : '#001e62'}
      />
      
      {/* Enhanced sky with better parameters */}
      <Sky
        distance={450000}
        sunPosition={sunPosition as [number, number, number]}
        inclination={isDaytime ? 0.52 : 0.1}
        azimuth={0.25}
        mieCoefficient={isDaytime ? 0.005 : 0.001}
        mieDirectionalG={isDaytime ? 0.8 : 0.7}
        rayleigh={isDaytime ? 0.8 : 0.5}
        turbidity={isDaytime ? 6 : 15}
      />
      
      {/* Enhanced stars for night */}
      {!isDaytime && <Stars radius={100} depth={50} count={7000} factor={4} saturation={0.6} fade speed={0.8} />}
      
      {/* Enhanced hemisphere light for better ambient lighting */}
      <hemisphereLight 
        args={[isDaytime ? '#bbdefb' : '#172b46', isDaytime ? '#e1f5fe' : '#0a1622', isDaytime ? 0.7 : 0.4]} 
      />
    </>
  );
}

// Camera control system
function CityCamera({ 
  cameraView = 'isometric',
  target = [0, 0, 0] as [number, number, number],
  selectedBuilding = false
}) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  
  // Set camera position based on view
  useEffect(() => {
    let position: [number, number, number];
    
    switch(cameraView) {
      case 'overhead':
        position = [0, 120, 0];
        break;
      case 'isometric':
        position = [80, 80, 80];
        break;
      case 'first-person':
        position = [10, 2, 10];
        break;
      default:
        position = [80, 80, 80];
    }
    
    // Animated camera position change
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startPosition = camera.position.clone();
    const endPosition = new Vector3(...position);
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease function (ease out cubic)
      const t = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPosition, endPosition, t);
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  }, [camera, cameraView]);

  // Update camera target when a building is selected
  useEffect(() => {
    if (selectedBuilding && controlsRef.current) {
      const controls = controlsRef.current as any;
      
      // Set the orbit controls target to the selected building position
      const newTarget = new Vector3(...target);
      
      // Smoothly animate the target change
      const duration = 800; // 0.8 second
      const startTime = Date.now();
      const startTarget = controls.target.clone();
      
      const animateTarget = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function (ease out cubic)
        const t = 1 - Math.pow(1 - progress, 3);
        
        controls.target.lerpVectors(startTarget, newTarget, t);
        
        if (progress < 1) {
          requestAnimationFrame(animateTarget);
        }
      };
      
      animateTarget();
    }
  }, [target, selectedBuilding]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={target}
      enableDamping={true}
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minDistance={5}
      maxDistance={200}
      enableZoom={true}
      enablePan={true}
      rotateSpeed={0.5}
      makeDefault
    />
  );
}

// Low Poly Street Light - improved with better lighting
function StreetLight({ position, rotation = 0, isDaytime = false }: { position: [number, number, number], rotation?: number, isDaytime?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <Box args={[0.2, 3.5, 0.2]} position={[0, 1.75, 0]}>
        <meshStandardMaterial color="#37474F" roughness={0.8} metalness={0.3} />
      </Box>
      {/* Arm */}
      <Box args={[1.2, 0.15, 0.15]} position={[0.6, 3.2, 0]}>
        <meshStandardMaterial color="#455A64" roughness={0.7} metalness={0.4} />
      </Box>
      {/* Light fixture */}
      <Box args={[0.5, 0.3, 0.5]} position={[1.2, 3.1, 0]}>
        <meshStandardMaterial 
          color={isDaytime ? "#F0E68C" : "#FDD835"}
          emissive={isDaytime ? "#000000" : "#FFEB3B"}
          emissiveIntensity={isDaytime ? 0 : 1.5}
          roughness={0.3}
          metalness={0.7}
        />
      </Box>
      {/* Light source with improved parameters - only illuminated at night with stronger light */}
      {!isDaytime && (
        <pointLight 
          position={[1.2, 3.1, 0]} 
          distance={30}
          intensity={4.0}
          color="#FFF9C4"
          castShadow
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.001}
          decay={1.5}
        />
      )}
    </group>
  );
}

// Main city map component
export function City({
  rainIntensity = 0,
  isDaytime = true,
  initialPerformance = 'high' as 'high' | 'medium' | 'low',
  onSelectBuilding = undefined,
  selectedBuildingId = undefined,
}: {
  rainIntensity?: number;
  isDaytime?: boolean;
  initialPerformance?: 'high' | 'medium' | 'low';
  onSelectBuilding?: (building: any) => void;
  selectedBuildingId?: number;
}) {
  const [performance, setPerformance] = useState<'high' | 'medium' | 'low'>(initialPerformance);
  const [cameraView, setCameraView] = useState<'overhead' | 'isometric' | 'first-person'>('isometric');
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [buildingPositions, setBuildingPositions] = useState<BuildingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0, 0]);
  
  // Separate state for selected building details to ensure they're correctly reported
  const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<null | {
    id: number;
    type: string;
    position: [number, number, number];
    scale: [number, number, number];
  }>(null);
  
  // Sync with external selectedBuildingId if provided
  useEffect(() => {
    if (selectedBuildingId !== undefined) {
      setSelectedBuilding(selectedBuildingId);
    }
  }, [selectedBuildingId]);
  
  // Handle building selection with better details
  const handleBuildingSelect = (buildingId: number) => {
    if (selectedBuilding === buildingId) {
      // If the same building is clicked again, deselect it
      setSelectedBuilding(null);
      setSelectedBuildingDetails(null);
      setCameraTarget([0, 0, 0]);
      // Notify parent component if callback provided
      if (onSelectBuilding) {
        onSelectBuilding(null);
      }
    } else {
      // Find the selected building details
      const building = buildingPositions.find(b => b.id === buildingId);
      if (building) {
        setSelectedBuilding(buildingId);
        setSelectedBuildingDetails({
          id: building.id,
          type: building.type || 'unknown',
          position: building.position,
          scale: building.scale
        });
        
        // Update camera target to focus on this building
        setCameraTarget(building.position);
        
        // Notify parent component if callback provided
        if (onSelectBuilding) {
          onSelectBuilding({
            azonosito: building.id,
            tipus: building.type || 'unknown',
            position: building.position,
            scale: building.scale
          });
        }
      }
    }
  };
  
  // Handle camera view changes
  const handleCameraViewChange = (view: 'overhead' | 'isometric' | 'first-person') => {
    setCameraView(view);
  };
  
  // Performance monitoring
  const handlePerformanceChange = ({ factor }: { factor: number }) => {
    if (factor < 0.5) setPerformance('low');
    else if (factor < 0.8) setPerformance('medium');
    else setPerformance('high');
  };
  
  // Grid size for positioning buildings (one building per grid)
  const GRID_SIZE = 20;
  
  // Fetch building data from API and position them on a grid system
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/buildings')
      .then(response => response.json())
      .then(data => {
        // Create a grid system to track occupied positions
        const occupiedGrids: Record<string, boolean> = {};
        
        // Process buildings and place them on grid squares
        const buildings = data.map((building: {
          id: number;
          position: {x: number; y: number; z: number};
          scale?: {x: number; y: number; z: number};
          type?: string;
        }) => {
          // Calculate the grid coordinates based on raw position
          let gridX = Math.round(building.position.x / GRID_SIZE);
          let gridZ = Math.round(building.position.z / GRID_SIZE);
          
          // Create a unique key for this grid position
          let gridKey = `${gridX},${gridZ}`;
          
          // If this grid is already occupied, try to find the nearest empty grid
          if (occupiedGrids[gridKey]) {
            // Search for an unoccupied grid nearby
            const searchRadius = 5; // Maximum distance to search
            let found = false;
            
            for (let r = 1; r <= searchRadius && !found; r++) {
              for (let dx = -r; dx <= r && !found; dx++) {
                for (let dz = -r; dz <= r && !found; dz++) {
                  // Skip checking the same cell or cells too far away
                  if ((Math.abs(dx) + Math.abs(dz)) > r) continue;
                  
                  const newGridX = gridX + dx;
                  const newGridZ = gridZ + dz;
                  const newGridKey = `${newGridX},${newGridZ}`;
                  
                  if (!occupiedGrids[newGridKey]) {
                    // Found an empty grid
                    gridX = newGridX;
                    gridZ = newGridZ;
                    gridKey = newGridKey;
                    found = true;
                  }
                }
              }
            }
          }
          
          // Mark this grid as occupied
          occupiedGrids[gridKey] = true;
          
          // Calculate the actual position based on grid coordinates
          const posX = gridX * GRID_SIZE;
          const posZ = gridZ * GRID_SIZE;
          
          return {
            id: building.id,
            position: [
              posX, 
              building.position.y || 0, 
              posZ
            ] as [number, number, number],
            scale: [
              building.scale?.x || 3,
              building.scale?.y || 3,
              building.scale?.z || 3
            ] as [number, number, number],
            type: building.type || 'residential'
          };
        });
        
        setBuildingPositions(buildings);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching building data:', error);
        setIsLoading(false);
        // No fallback - only use API data
        setBuildingPositions([]);
      });
  }, []);
  
  // Ensure the correct building info is displayed when a building is selected
  useEffect(() => {
    if (selectedBuilding !== null) {
      const building = buildingPositions.find(b => b.id === selectedBuilding);
      if (building) {
        setSelectedBuildingDetails({
          id: building.id,
          type: building.type || 'unknown',
          position: building.position,
          scale: building.scale
        });
      }
    }
  }, [selectedBuilding, buildingPositions]);

  // Clear selection if building no longer exists
  useEffect(() => {
    if (selectedBuilding !== null && !buildingPositions.some(b => b.id === selectedBuilding)) {
      setSelectedBuilding(null);
      setSelectedBuildingDetails(null);
    }
  }, [selectedBuilding, buildingPositions]);
  
  // Notify the parent component about the selected building
  useEffect(() => {
    if (selectedBuildingDetails && typeof window !== 'undefined') {
      // Dispatch event for any parent component that needs to know about the selection
      const event = new CustomEvent('buildingInfoUpdated', {
        detail: selectedBuildingDetails
      });
      window.dispatchEvent(event);
    }
  }, [selectedBuildingDetails]);
  
  // Change camera view based on building selection
  useEffect(() => {
    if (selectedBuilding !== null && selectedBuildingDetails) {
      // Optionally change to first-person view when a building is selected
      // Uncomment this if you want automatic camera change on selection
      // setCameraView('first-person');
    }
  }, [selectedBuilding, selectedBuildingDetails]);
  
  // Smooth day/night transition
  useEffect(() => {
    let startTime = 0;
    const transitionDuration = 5000; // 5 seconds for transition
    
    const animate = (time: number) => {
      if (startTime === 0) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      setTransitionProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    setTransitionProgress(0);
    requestAnimationFrame(animate);
    
    return () => {
      startTime = 0;
    };
  }, [isDaytime]);
  
  // Generate street lights along roads - more lights with better positioning
  const streetLights = useMemo(() => {
    const lights = [];
    const citySize = 120;
    const spacing = 12; // Spacing between lights
    const roadOffset = 4; // Distance from road center to light position
    
    // Create lights along main roads
    for (let x = -citySize / 2; x <= citySize / 2; x += spacing) {
      // Main x-axis roads - offset to the sides
      lights.push({ position: [x, 0, -roadOffset - 2] as [number, number, number], rotation: 0 });
      lights.push({ position: [x, 0, roadOffset + 2] as [number, number, number], rotation: Math.PI });
    }
    
    for (let z = -citySize / 2; z <= citySize / 2; z += spacing) {
      // Main z-axis roads - offset to the sides
      lights.push({ position: [-roadOffset - 2, 0, z] as [number, number, number], rotation: Math.PI / 2 });
      lights.push({ position: [roadOffset + 2, 0, z] as [number, number, number], rotation: -Math.PI / 2 });
    }
    
    // Add lights on grid roads too
    const gridSize = 20;
    for (let x = -citySize / 2; x <= citySize / 2; x += gridSize) {
      for (let z = -citySize / 2; z <= citySize / 2; z += spacing) {
        if (x !== 0 && Math.abs(x) > 15) { // Skip main road areas
          lights.push({ position: [x - 4, 0, z] as [number, number, number], rotation: Math.PI / 2 });
        }
      }
    }
    
    for (let z = -citySize / 2; z <= citySize / 2; z += gridSize) {
      for (let x = -citySize / 2; x <= citySize / 2; x += spacing) {
        if (z !== 0 && Math.abs(z) > 15) { // Skip main road areas
          lights.push({ position: [x, 0, z - 4] as [number, number, number], rotation: 0 });
        }
      }
    }
    
    return lights;
  }, []);
  
  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
            <div className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="text-white mt-4">Épületek betöltése...</p>
          </div>
        </div>
      )}
      
      {performance === 'low' && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-md text-xs z-10">
          Alacsony Teljesítmény Mód
        </div>
      )}
      
      {/* Camera control UI */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-lg z-10 flex flex-col gap-2">
        <button 
          className={`px-3 py-1 rounded text-sm ${cameraView === 'overhead' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleCameraViewChange('overhead')}
        >
          Felülnézet
        </button>
        <button 
          className={`px-3 py-1 rounded text-sm ${cameraView === 'isometric' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleCameraViewChange('isometric')}
        >
          Izometrikus
        </button>
        <button 
          className={`px-3 py-1 rounded text-sm ${cameraView === 'first-person' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleCameraViewChange('first-person')}
        >
          Első személy
        </button>
      </div>
      
      <Canvas 
        shadows 
        camera={{ position: [80, 80, 80], fov: 60 }}
        gl={{ 
          antialias: performance !== 'low',
          alpha: false, 
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, performance === 'high' ? 2 : 1.5]}
      >
        <PerformanceMonitor onIncline={handlePerformanceChange} onDecline={handlePerformanceChange} />
        <AdaptiveDpr pixelated />
        
        <Suspense fallback={<Loader />}>
          {/* Lighting and environment */}
          <CityLighting 
            isDaytime={isDaytime} 
            transitionProgress={transitionProgress} 
          />
          
          {/* Camera controls */}
          <CityCamera 
            cameraView={cameraView} 
            target={cameraTarget}
            selectedBuilding={selectedBuilding !== null}
          />
          
          {/* Ground plane with grid */}
          <Ground 
            rainIntensity={rainIntensity}
            isDaytime={isDaytime}
            performance={performance}
            onSelectBuilding={handleBuildingSelect}
            selectedBuildingId={selectedBuilding || undefined}
          />
          
          {/* Add street lights */}
          {streetLights.map((light, index) => (
            <StreetLight
              key={`streetlight-${index}`}
              position={light.position}
              rotation={light.rotation}
              isDaytime={isDaytime}
            />
          ))}
          
          {/* Forest layer with many more low-poly trees */}
          <LowPolyForest
            buildingPositions={buildingPositions}
            density={1.5}
          />
          
          {/* Weather effects - enhanced */}
          <Weather 
            intensity={rainIntensity} 
            isDaytime={isDaytime}
            performance={performance}
            type="rainy"
          />
          
          {/* Bake shadows for performance */}
          {performance !== 'high' && <BakeShadows />}
          
          {/* Add contact shadows - enhanced */}
          {performance === 'high' && 
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.7}
              scale={150}
              blur={2.5}
              far={6}
              resolution={1024}
              color="#000000"
            />
          }
        </Suspense>
      </Canvas>
    </div>
  );
} 