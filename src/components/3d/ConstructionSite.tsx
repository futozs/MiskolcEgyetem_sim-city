'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, AdditiveBlending, MeshStandardMaterial, DoubleSide, Group, Vector3 } from 'three';
import { useAppStore } from '@/store/appStore';
import { Box, Cone, useTexture, Cylinder, Torus, Instances, Instance } from '@react-three/drei';

type ConstructionSiteProps = {
  position: [number, number, number];
  completionPercentage: number;
  type: string;
  onHover: (isHovered: boolean) => void;
  performance?: 'high' | 'medium' | 'low';
  isRaining?: boolean;
};

export function ConstructionSite({ 
  position, 
  completionPercentage, 
  type, 
  onHover,
  performance = 'high',
  isRaining = false
}: ConstructionSiteProps) {
  const containerRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const { selectBuilding } = useAppStore();
  
  // Color based on completion and weather conditions
  const baseColor = useMemo(() => {
    let color: string;
    if (completionPercentage < 30) color = "#f44336"; // Red for early stage
    else if (completionPercentage < 70) color = "#ff9800"; // Orange for mid stage
    else color = "#4caf50"; // Green for nearly complete
    
    // Darken colors when raining
    if (isRaining) {
      return new Color(color).multiplyScalar(0.7).getStyle();
    }
    return color;
  }, [completionPercentage, isRaining]);
  
  // Animation for construction elements - optimized for performance
  useFrame(({ clock }) => {
    if (!containerRef.current) return;
    
    const time = clock.getElapsedTime();
    
    // Adjust animation based on performance settings
    const animationSpeed = performance === 'low' ? 0.3 : 0.5;
    const animationAmount = performance === 'low' ? 0.05 : performance === 'medium' ? 0.07 : 0.1;
    
    // Skip animation in low performance mode if not hovered
    if (performance === 'low' && !hovered) {
      containerRef.current.position.y = position[1];
    } else {
      // Gentle hovering animation
      containerRef.current.position.y = position[1] + Math.sin(time * animationSpeed) * animationAmount;
    }
    
    // Glow animations only for medium and high performance
    if (glowRef.current && performance !== 'low') {
      // Glow pulse animation
      const pulseScale = 1.05 + Math.sin(time * (performance === 'medium' ? 1.5 : 2)) * 0.05;
      glowRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      
      // Glow visibility based on hover
      const material = glowRef.current.material as MeshStandardMaterial;
      if (hovered) {
        material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
      } else {
        material.opacity = 0.05 + Math.sin(time * 2) * 0.05;
      }
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
  
  // Construction components to show based on completion
  const showFoundation = true; // Always show foundation
  const showStructure = completionPercentage >= 30;
  const showRoof = completionPercentage >= 60;
  const showDetails = completionPercentage >= 80;
  
  // Scale based on building type
  const scale = 
    type === 'lakóház' || type === 'lakóépület' ? 1 :
    type === 'középület' ? 1.2 :
    type === 'vallási' ? 1.5 :
    type === 'ipari' ? 1.3 :
    1;
  
  // Determine the appropriate number of scaffolding elements based on completion
  const scaffoldingCount = Math.max(1, Math.floor(completionPercentage / 10));
  
  // Generate scaffolding positions for instancing
  const scaffoldingPositions = useMemo(() => {
    if (performance === 'low') return []; // No scaffolding in low performance mode
    
    const positions: Vector3[] = [];
    const height = 8 * scale * (completionPercentage / 100);
    
    // Add scaffolding poles around the building
    for (let i = 0; i < scaffoldingCount; i++) {
      const angle = (i / scaffoldingCount) * Math.PI * 2;
      const radius = 5 * scale;
      
      positions.push(
        new Vector3(
          Math.cos(angle) * radius,
          height * 0.5,
          Math.sin(angle) * radius
        )
      );
    }
    
    return positions;
  }, [scaffoldingCount, scale, completionPercentage, performance]);
  
  // Construction materials with weather conditions
  const materials = useMemo(() => {
    return {
      foundation: {
        color: isRaining ? "#777777" : "#888888",
        roughness: isRaining ? 0.7 : 0.9,
        metalness: isRaining ? 0.2 : 0.1,
      },
      structure: {
        color: isRaining ? "#333333" : "#444444",
        opacity: isRaining ? 0.5 : 0.6,
      },
      pillars: {
        color: isRaining ? "#444444" : "#555555",
        roughness: isRaining ? 0.6 : 0.7,
        metalness: isRaining ? 0.4 : 0.3,
      },
      roof: {
        color: isRaining ? "#951717" : "#b71c1c",
        roughness: isRaining ? 0.6 : 0.7,
        metalness: isRaining ? 0.2 : 0.1,
      },
      windows: {
        color: isRaining ? "#7ba7d1" : "#90caf9",
        roughness: 0.1,
        metalness: 0.8,
        opacity: isRaining ? 0.6 : 0.7,
      },
      door: {
        color: isRaining ? "#4d3630" : "#5d4037",
        roughness: 0.8,
        metalness: 0.2,
      },
      scaffolding: {
        color: "#ffeb3b",
        roughness: 0.7,
        metalness: 0.3,
      }
    };
  }, [isRaining]);
  
  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={() => selectBuilding(null)} // Click to deselect
    >
      {/* Container for animation */}
      <group ref={containerRef}>
        {/* Foundation - Always visible */}
        {showFoundation && (
          <Box
            args={[10 * scale, 0.5, 10 * scale]}
            position={[0, 0, 0]}
            castShadow={performance !== 'low'}
            receiveShadow={performance !== 'low'}
          >
            <meshStandardMaterial
              color={materials.foundation.color}
              roughness={materials.foundation.roughness}
              metalness={materials.foundation.metalness}
            />
          </Box>
        )}
        
        {/* Structure frame - Visible after 30% */}
        {showStructure && (
          <>
            {/* Main structural frame */}
            <Box
              args={[8 * scale, 8 * scale * (completionPercentage / 100), 8 * scale]}
              position={[0, 4 * scale * (completionPercentage / 100), 0]}
              castShadow={performance !== 'low'}
            >
              <meshStandardMaterial
                color={materials.structure.color}
                wireframe={true}
                transparent
                opacity={materials.structure.opacity}
              />
            </Box>
            
            {/* Corner pillars - use instanced rendering for better performance */}
            <Instances limit={4}>
              <cylinderGeometry args={[0.5, 0.5, 8 * scale * (completionPercentage / 100), performance === 'low' ? 6 : 8]} />
              <meshStandardMaterial
                color={materials.pillars.color}
                roughness={materials.pillars.roughness}
                metalness={materials.pillars.metalness}
              />
              
              {[
                [4 * scale, 0, 4 * scale],
                [4 * scale, 0, -4 * scale],
                [-4 * scale, 0, 4 * scale],
                [-4 * scale, 0, -4 * scale]
              ].map((pillarPos, i) => (
                <Instance
                  key={`pillar-${i}`}
                  position={[pillarPos[0], 4 * scale * (completionPercentage / 100), pillarPos[2]]}
                />
              ))}
            </Instances>
          </>
        )}
        
        {/* Roof - Visible after 60% */}
        {showRoof && (
          <Box
            args={[9 * scale, 0.5, 9 * scale]}
            position={[0, 8 * scale, 0]}
            castShadow={performance !== 'low'}
            receiveShadow={performance !== 'low'}
          >
            <meshStandardMaterial
              color={materials.roof.color}
              roughness={materials.roof.roughness}
              metalness={materials.roof.metalness}
            />
          </Box>
        )}
        
        {/* Details - Visible after 80% */}
        {showDetails && (
          <>
            {/* Windows - use instanced rendering */}
            <Instances limit={4}>
              <boxGeometry args={[4 * scale, 2 * scale, 0.1]} />
              <meshStandardMaterial
                color={materials.windows.color}
                roughness={materials.windows.roughness}
                metalness={materials.windows.metalness}
                transparent
                opacity={materials.windows.opacity}
              />
              
              {[
                [0, 5 * scale, 4.1 * scale],
                [0, 5 * scale, -4.1 * scale],
              ].map((windowPos, i) => (
                <Instance
                  key={`window-front-${i}`}
                  position={windowPos}
                />
              ))}
            </Instances>
            
            <Instances limit={2}>
              <boxGeometry args={[0.1, 2 * scale, 4 * scale]} />
              <meshStandardMaterial
                color={materials.windows.color}
                roughness={materials.windows.roughness}
                metalness={materials.windows.metalness}
                transparent
                opacity={materials.windows.opacity}
              />
              
              {[
                [4.1 * scale, 5 * scale, 0],
                [-4.1 * scale, 5 * scale, 0]
              ].map((windowPos, i) => (
                <Instance
                  key={`window-side-${i}`}
                  position={windowPos}
                />
              ))}
            </Instances>
            
            {/* Entrance */}
            <Box
              args={[2 * scale, 3 * scale, 0.1]}
              position={[0, 1.5 * scale, 4.1 * scale]}
              castShadow={performance !== 'low'}
            >
              <meshStandardMaterial
                color={materials.door.color}
                roughness={materials.door.roughness}
                metalness={materials.door.metalness}
              />
            </Box>
          </>
        )}
        
        {/* Scaffolding - optimized with instancing */}
        {showStructure && performance !== 'low' && (
          <Instances limit={scaffoldingPositions.length}>
            <cylinderGeometry args={[0.1, 0.1, 8 * scale * (completionPercentage / 100), 6]} />
            <meshStandardMaterial
              color={materials.scaffolding.color}
              roughness={materials.scaffolding.roughness}
              metalness={materials.scaffolding.metalness}
            />
            
            {scaffoldingPositions.map((pos, i) => (
              <Instance key={`scaffold-${i}`} position={pos} />
            ))}
          </Instances>
        )}
        
        {/* Construction equipment - only in high performance mode */}
        {performance === 'high' && (
          <>
            {/* Crane arm */}
            <Box
              args={[0.5, 0.5, 12 * scale]}
              position={[6 * scale, 10 * scale, 0]}
              rotation={[0, Math.PI / 4, 0]}
            >
              <meshStandardMaterial color="#fdd835" roughness={0.7} metalness={0.3} />
            </Box>
            
            {/* Crane vertical support */}
            <Box
              args={[0.5, 15 * scale, 0.5]}
              position={[6 * scale, 7.5 * scale, 0]}
            >
              <meshStandardMaterial color="#fdd835" roughness={0.7} metalness={0.3} />
            </Box>
          </>
        )}
        
        {/* Progress indicator */}
        <Torus
          args={[5 * scale, 0.3, 16, 32, Math.PI * 2 * (completionPercentage / 100)]}
          position={[0, 0.3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.7}
          />
        </Torus>
      </group>
      
      {/* Glow effect - only render when necessary */}
      {performance !== 'low' && (
        <mesh
          ref={glowRef}
          position={[0, 4 * scale, 0]}
        >
          <boxGeometry args={[10 * scale, 8 * scale, 10 * scale]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.05}
            wireframe={true}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
} 