'use client';

import { useRef, useMemo } from 'react';
import { Vector3, Color } from 'three';
import { Box, Cylinder, Sphere, useFrame } from '@react-three/drei';
import { useAppStore } from '@/store/appStore';

// Utcai lámpa stílusok
export type StreetLightStyle = 'modern' | 'classic' | 'victorian';

// Utcai lámpa komponens a 3D városhoz
export function StreetLight({ 
  position, 
  style = 'modern',
  height = 5,
  lightColor = '#FFCE7B',
  performance = 'high'
}: { 
  position: [number, number, number],
  style?: StreetLightStyle,
  height?: number,
  lightColor?: string,
  performance?: 'high' | 'medium' | 'low'
}) {
  const lightRef = useRef<any>();
  const { isDaytime } = useAppStore();
  
  // Lámpa fényének pulzálása éjszaka (kis variáció)
  useFrame((state) => {
    if (lightRef.current && !isDaytime) {
      // Pulzálás az idő függvényében
      const intensity = 1.0 + Math.sin(state.clock.elapsedTime * 2 + position[0] + position[2]) * 0.1;
      lightRef.current.intensity = intensity;
    }
  });
  
  // Lámpafény intenzitás és távolság a teljesítmény és napszak alapján
  const lightSettings = useMemo(() => {
    // Alap beállítások
    let intensity = isDaytime ? 0.0 : 1.0;
    let distance = performance === 'low' ? 8 : performance === 'medium' ? 12 : 15;
    
    return { intensity, distance };
  }, [isDaytime, performance]);
  
  // Modern stílusú lámpa
  if (style === 'modern') {
    return (
      <group position={position}>
        {/* Oszlop */}
        <Cylinder 
          args={[0.1, 0.15, height, 8]} 
          position={[0, height/2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color="#666666" 
            roughness={0.5}
            metalness={0.8}
          />
        </Cylinder>
        
        {/* Lámpa fej */}
        <Box
          args={[0.8, 0.1, 0.4]}
          position={[0, height, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#444444"
            roughness={0.5}
            metalness={0.7}
          />
        </Box>
        
        {/* Lámpa búra */}
        <Box
          args={[0.6, 0.05, 0.3]}
          position={[0, height - 0.08, 0]}
        >
          <meshStandardMaterial
            color={lightColor}
            roughness={0.2}
            metalness={0.2}
            emissive={lightColor}
            emissiveIntensity={isDaytime ? 0.2 : 1.0}
            transparent={true}
            opacity={0.9}
          />
        </Box>
        
        {/* Fényforrás */}
        {performance !== 'low' && (
          <pointLight
            ref={lightRef}
            position={[0, height - 0.2, 0]}
            color={lightColor}
            intensity={lightSettings.intensity}
            distance={lightSettings.distance}
            castShadow={performance === 'high'}
            shadow-bias={-0.001}
            shadow-mapSize={[512, 512]}
          />
        )}
      </group>
    );
  }
  
  // Klasszikus stílusú lámpa
  if (style === 'classic') {
    return (
      <group position={position}>
        {/* Oszlop */}
        <Cylinder 
          args={[0.08, 0.12, height, 8]} 
          position={[0, height/2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color="#555555" 
            roughness={0.5}
            metalness={0.7}
          />
        </Cylinder>
        
        {/* Tartó kar */}
        <Box
          args={[0.6, 0.06, 0.06]}
          position={[0.3, height, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#555555"
            roughness={0.5}
            metalness={0.7}
          />
        </Box>
        
        {/* Lámpa búra */}
        <Sphere
          args={[0.2, 8, 8]}
          position={[0.6, height - 0.1, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={lightColor}
            roughness={0.2}
            metalness={0.2}
            emissive={lightColor}
            emissiveIntensity={isDaytime ? 0.2 : 1.0}
            transparent={true}
            opacity={0.9}
          />
        </Sphere>
        
        {/* Lámpa teteje */}
        <Cylinder
          args={[0.22, 0.22, 0.05, 8]}
          position={[0.6, height + 0.1, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#444444"
            roughness={0.5}
            metalness={0.7}
          />
        </Cylinder>
        
        {/* Fényforrás */}
        {performance !== 'low' && (
          <pointLight
            ref={lightRef}
            position={[0.6, height - 0.1, 0]}
            color={lightColor}
            intensity={lightSettings.intensity}
            distance={lightSettings.distance}
            castShadow={performance === 'high'}
            shadow-bias={-0.001}
            shadow-mapSize={[512, 512]}
          />
        )}
      </group>
    );
  }
  
  // Viktoriánus stílusú lámpa
  return (
    <group position={position}>
      {/* Díszített oszlop */}
      <Cylinder 
        args={[0.1, 0.2, height - 0.5, 8]} 
        position={[0, (height - 0.5)/2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color="#333333" 
          roughness={0.4}
          metalness={0.8}
        />
      </Cylinder>
      
      {/* Díszítő elem az oszlop alján */}
      <Cylinder
        args={[0.25, 0.25, 0.2, 8]}
        position={[0, 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#444444"
          roughness={0.5}
          metalness={0.7}
        />
      </Cylinder>
      
      {/* Díszítő elem az oszlop tetején */}
      <Cylinder
        args={[0.15, 0.15, 0.1, 8]}
        position={[0, height - 0.6, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#444444"
          roughness={0.5}
          metalness={0.7}
        />
      </Cylinder>
      
      {/* Négy tartó kar */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, index) => (
        <group key={index} rotation={[0, angle, 0]}>
          <Box
            args={[0.4, 0.05, 0.05]}
            position={[0.2, height - 0.5, 0]}
            rotation={[0, 0, Math.PI/8]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#444444"
              roughness={0.5}
              metalness={0.7}
            />
          </Box>
        </group>
      ))}
      
      {/* Lámpa búra */}
      <group position={[0, height, 0]}>
        {/* Üveg búra */}
        <Cylinder
          args={[0.25, 0.3, 0.5, 8]}
          castShadow
        >
          <meshStandardMaterial
            color={lightColor}
            roughness={0.2}
            metalness={0.3}
            emissive={lightColor}
            emissiveIntensity={isDaytime ? 0.2 : 1.0}
            transparent={true}
            opacity={0.8}
          />
        </Cylinder>
        
        {/* Díszítő tető */}
        <Cylinder
          args={[0.1, 0.3, 0.2, 8]}
          position={[0, 0.35, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#333333"
            roughness={0.5}
            metalness={0.8}
          />
        </Cylinder>
      </group>
      
      {/* Fényforrás */}
      {performance !== 'low' && (
        <pointLight
          ref={lightRef}
          position={[0, height - 0.1, 0]}
          color={lightColor}
          intensity={lightSettings.intensity}
          distance={lightSettings.distance}
          castShadow={performance === 'high'}
          shadow-bias={-0.001}
          shadow-mapSize={[512, 512]}
        />
      )}
    </group>
  );
} 