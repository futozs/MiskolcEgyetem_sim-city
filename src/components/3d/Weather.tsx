'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, useGLTF } from '@react-three/drei';
import { Group, Vector3, Color, MathUtils, PointLight } from 'three';
import { Season } from './AdvancedTree';

type WeatherProps = {
  type: 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';
  intensity: number;
  isDaytime: boolean;
  season?: Season;
  performance?: 'high' | 'medium' | 'low';
};

export function Weather({ 
  type = 'clear', 
  intensity = 0, 
  isDaytime = true,
  season = 'summer',
  performance = 'high' 
}: WeatherProps) {
  const groupRef = useRef<Group>(null);
  const lightningRef = useRef<PointLight>(null);
  const timeRef = useRef({ 
    lastLightning: 0, 
    nextLightning: Math.random() * 10000,
    lastLightningDuration: 0 
  });
  
  // Lightning effect for storms - moved before the early return
  useEffect(() => {
    if (type === 'rainy' && intensity > 0.7 && performance !== 'low') {
      // Enable lightning effects for heavy rain
      const interval = setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance of lightning every check
          const now = window.performance.now();
          timeRef.current.lastLightning = now;
          timeRef.current.lastLightningDuration = 100 + Math.random() * 150;
          timeRef.current.nextLightning = 1000 + Math.random() * 5000;
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [type, intensity, performance]);
  
  // Lightning animation - moved before the early return
  useFrame(() => {
    if (!lightningRef.current) return;
    
    const now = window.performance.now();
    const { lastLightning, lastLightningDuration } = timeRef.current;
    const lightningActive = now - lastLightning < lastLightningDuration;
    
    if (lightningActive) {
      lightningRef.current.intensity = 2 + Math.random() * 3;
      lightningRef.current.position.set(
        MathUtils.randFloatSpread(200),
        50 + MathUtils.randFloatSpread(50),
        MathUtils.randFloatSpread(200)
      );
    } else {
      lightningRef.current.intensity = 0;
    }
  });
  
  // Clouds optimization - reduce number and detail based on performance
  const cloudCount = useMemo(() => {
    if (performance === 'low') return 6;
    if (performance === 'medium') return 12;
    return 20; // high performance
  }, [performance]);
  
  // Cloud segment optimization
  const cloudSegments = useMemo(() => {
    if (performance === 'low') return 3;
    if (performance === 'medium') return 5;
    return 8; // high performance
  }, [performance]);
  
  // Configure cloud positions for efficient distribution
  const cloudPositions = useMemo(() => {
    const positions = [];
    
    // Different cloud patterns based on weather type
    if (type === 'foggy') {
      // Lower, more spread out clouds for fog
      const radius = 100;
      const height = 20;
      
      for (let i = 0; i < cloudCount; i++) {
        const angle = (i / cloudCount) * Math.PI * 2;
        const distance = radius * (0.3 + Math.random() * 0.7);
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = height * (0.5 + Math.random() * 0.5);
        
        positions.push([x, y, z]);
      }
    } else {
      // Normal clouds for other weather types
      const radius = 120;
      const height = 80;
      
      for (let i = 0; i < cloudCount; i++) {
        const angle = (i / cloudCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
        const z = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
        const y = height + (Math.random() * 30 - 15);
        
        positions.push([x, y, z]);
      }
    }
    
    return positions;
  }, [cloudCount, type]);
  
  // Fixed cloud seeds to prevent regeneration on every render
  const cloudSeeds = useMemo(() => {
    return Array.from({ length: cloudCount }, () => Math.random());
  }, [cloudCount]);
  
  // Optimize performance by only showing weather effects when needed
  if (type === 'clear' || (performance === 'low' && type !== 'rainy' && type !== 'snowy')) {
    return null; // Skip rendering completely for clear weather or low performance
  }
  
  // Rain/snow optimization based on performance mode
  const PrecipitationEffect = () => {
    const particleCount = performance === 'low' ? 500 : 
                        performance === 'medium' ? 1500 : 
                        3000;
    const particlesRef = useRef<Group>(null);
    const isSnow = type === 'snowy' || (type === 'rainy' && season === 'winter' && Math.random() > 0.5);
    
    // Pre-compute and reuse particle positions
    const particlePositions = useMemo(() => {
      const positions = [];
      const area = 200;
      
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * area;
        const y = Math.random() * 100; // Height variation
        const z = (Math.random() - 0.5) * area;
        
        positions.push(new Vector3(x, y, z));
      }
      
      return positions;
    }, [particleCount]);
    
    // Animate particles with optimized approach
    useFrame(({ clock }) => {
      if (!particlesRef.current) return;
      
      const particles = particlesRef.current.children;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        if (isSnow) {
          // Snowflake movement - slower, swaying
          const swayX = Math.sin(time * 0.5 + i * 0.1) * 0.2;
          const swayZ = Math.cos(time * 0.5 + i * 0.1) * 0.2;
          
          particle.position.y -= 0.2; // Falling speed
          particle.position.x += swayX;
          particle.position.z += swayZ;
          
          // Rotate snowflakes
          particle.rotation.x += 0.01;
          particle.rotation.z += 0.01;
        } else {
          // Raindrop movement - faster, straighter
          particle.position.y -= 1; // Falling speed
        }
        
        // Reset position when particle goes below ground
        if (particle.position.y < 0) {
          // Reset to original y position with slight randomization
          particle.position.y = particlePositions[i].y + Math.random() * 10;
          
          // For snow, also reset x and z with slight variation
          if (isSnow) {
            particle.position.x = particlePositions[i].x + (Math.random() - 0.5) * 5;
            particle.position.z = particlePositions[i].z + (Math.random() - 0.5) * 5;
          }
        }
      }
    });
    
    return (
      <group ref={particlesRef}>
        {particlePositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            {isSnow ? (
              // Snowflake geometry
              <boxGeometry args={[0.1, 0.1, 0.1]} />
            ) : (
              // Raindrop geometry
              <boxGeometry args={[0.03, 0.2, 0.03]} />
            )}
            <meshBasicMaterial 
              color={isSnow ? new Color(0xffffff) : new Color(0x99ccff)} 
              transparent={true} 
              opacity={isSnow ? 0.9 : 0.5} 
            />
          </mesh>
        ))}
      </group>
    );
  };
  
  // Fog effect for foggy weather
  const FogEffect = () => {
    const fogRef = useRef<Group>(null);
    
    // Animate fog with subtle movement
    useFrame(({ clock }) => {
      if (!fogRef.current) return;
      
      const time = clock.getElapsedTime();
      fogRef.current.position.x = Math.sin(time * 0.05) * 5;
      fogRef.current.position.z = Math.cos(time * 0.07) * 5;
    });
    
    return (
      <group ref={fogRef}>
        {/* Lower fog layer */}
        {Array.from({ length: performance === 'low' ? 3 : 6 }).map((_, i) => (
          <Cloud
            key={`fog-${i}`}
            position={[
              (i % 3 - 1) * 40,
              2 + i * 0.5,
              (Math.floor(i / 3) - 1) * 40
            ]}
            opacity={0.5}
            speed={0.1}
            segments={cloudSegments}
            scale={60 + (i % 3) * 10}
            color={isDaytime ? '#E6E6E6' : '#B3B3B3'}
          />
        ))}
      </group>
    );
  };
  
  return (
    <group ref={groupRef}>
      {/* Lightning for stormy weather */}
      {type === 'rainy' && intensity > 0.7 && performance !== 'low' && (
        <pointLight 
          ref={lightningRef}
          position={[0, 100, 0]}
          intensity={0}
          distance={300}
          decay={2}
          color="#f0f0ff"
        />
      )}
      
      {/* Clouds with more stable rendering */}
      {(type === 'cloudy' || type === 'rainy' || type === 'snowy') && (
        <>
          {cloudPositions.map((position, i) => (
            <Cloud
              key={`cloud-${i}`}
              position={position as [number, number, number]}
              opacity={isDaytime ? 0.8 : 0.6}
              speed={0.2} // Slower movement to reduce flickering
              seed={cloudSeeds[i]} // Fixed seed for stability
              segments={cloudSegments}
              scale={performance === 'low' ? 10 : 15}
              color={isDaytime ? '#ffffff' : '#aaaaaa'}
            />
          ))}
        </>
      )}
      
      {/* Fog effect with improved stability */}
      {type === 'foggy' && <FogEffect />}
      
      {/* Rain or snow effect */}
      {(type === 'rainy' || type === 'snowy') && 
        intensity > 0.1 && 
        <PrecipitationEffect />
      }
    </group>
  );
} 