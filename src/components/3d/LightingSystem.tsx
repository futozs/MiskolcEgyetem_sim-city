'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface LightingSystemProps {
  isDaytime: boolean;
  transitionProgress: number;
}

export function LightingSystem({ isDaytime, transitionProgress }: LightingSystemProps) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  const dayLightIntensity = 1.0;
  const nightLightIntensity = 0.2;
  
  const daySkyColor = new THREE.Color('#87CEEB');
  const nightSkyColor = new THREE.Color('#00008B');
  
  const dayGroundColor = new THREE.Color('#8B4513');
  const nightGroundColor = new THREE.Color('#191970');
  
  // Calculate current light intensity based on transition
  const currentLightIntensity = isDaytime
    ? nightLightIntensity + (dayLightIntensity - nightLightIntensity) * transitionProgress
    : dayLightIntensity - (dayLightIntensity - nightLightIntensity) * transitionProgress;
  
  // Update directional light position and intensity
  useFrame(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = currentLightIntensity;
      
      // If it's day, position the sun high in the sky; if night, position it below the horizon
      if (isDaytime) {
        const angle = Math.PI * 0.25; // 45 degrees
        directionalLightRef.current.position.set(
          Math.cos(angle) * 100,
          Math.sin(angle) * 100,
          0
        );
      } else {
        const angle = Math.PI * -0.25; // -45 degrees (below horizon)
        directionalLightRef.current.position.set(
          Math.cos(angle) * 100,
          Math.sin(angle) * 100,
          0
        );
      }
    }
  });
  
  // Calculate current sky and ground colors based on transition
  const currentSkyColor = isDaytime
    ? nightSkyColor.clone().lerp(daySkyColor, transitionProgress)
    : daySkyColor.clone().lerp(nightSkyColor, transitionProgress);
    
  const currentGroundColor = isDaytime
    ? nightGroundColor.clone().lerp(dayGroundColor, transitionProgress)
    : dayGroundColor.clone().lerp(nightGroundColor, transitionProgress);
  
  // Convert current sky and ground colors to hex strings
  const skyColorHex = '#' + currentSkyColor.getHexString();
  const groundColorHex = '#' + currentGroundColor.getHexString();
  
  return (
    <>
      {/* Main directional light (sun/moon) */}
      <directionalLight
        ref={directionalLightRef}
        intensity={currentLightIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* Ambient light for general illumination */}
      <ambientLight intensity={isDaytime ? 0.5 : 0.1} />
      
      {/* Sky simulation */}
      <Sky
        distance={450000}
        sunPosition={isDaytime ? [0, 1, 0] : [0, -1, 0]}
        inclination={isDaytime ? 0.5 : 0}
        azimuth={0.25}
      />
      
      {/* Environment for reflections */}
      <Environment preset={isDaytime ? "sunset" : "night"} />
      
      {/* Hemisphere light to add color from sky/ground */}
      <hemisphereLight
        color={skyColorHex}
        groundColor={groundColorHex}
        intensity={0.3}
      />
    </>
  );
} 