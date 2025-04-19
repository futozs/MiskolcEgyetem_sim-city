'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Float } from '@react-three/drei';
import { Vector3, Color, Group } from 'three';
import { Season } from './AdvancedTree';

// Különböző növénytípusok
export type VegetationType = 'grass' | 'flower' | 'bush' | 'fern' | 'mushroom';

interface VegetationProps {
  position: [number, number, number];
  scale?: number;
  type?: VegetationType;
  season?: Season;
  windStrength?: number;
  performance?: 'high' | 'medium' | 'low';
}

// Egyedi növényfajta (virág, fű, bokor, stb.)
export function VegetationItem({
  position,
  scale = 1,
  type = 'grass',
  season = 'summer',
  windStrength = 0,
  performance = 'high'
}: VegetationProps) {
  const vegetationRef = useRef<Group>(null);
  const wavingRef = useRef<Group>(null);
  const windOffsetRef = useRef(Math.random() * Math.PI * 2);
  const [visible, setVisible] = useState(true);
  
  // Növényi tulajdonságok az adott típus és évszak alapján
  const properties = useMemo(() => {
    // Determinisztikus seed a pozíció alapján
    const seed = Math.abs(Math.floor(position[0] * 1000) + Math.floor(position[2] * 1000));
    
    // Alap tulajdonságok
    const base = {
      size: 0,
      height: 0,
      color: new Color(),
      hasFlowers: false,
      flowerColor: new Color(),
      windSensitivity: 0,
      segments: performance === 'low' ? 4 : performance === 'medium' ? 6 : 8
    };
    
    // Típus szerinti beállítások
    switch (type) {
      case 'grass':
        base.size = 0.1 + (seed % 5) / 100;
        base.height = 0.3 + (seed % 5) / 25;
        base.windSensitivity = 0.8;
        break;
        
      case 'flower':
        base.size = 0.15 + (seed % 5) / 100;
        base.height = 0.3 + (seed % 7) / 35;
        base.hasFlowers = true;
        // Virág színe seed alapján
        const flowerColors = [
          '#FF5555', // piros
          '#FFAA00', // narancssárga
          '#FFFF77', // sárga
          '#AA77FF', // lila
          '#FF77AA', // rózsaszín
          '#FFFFFF'  // fehér
        ];
        base.flowerColor = new Color(flowerColors[seed % flowerColors.length]);
        base.windSensitivity = 0.6;
        break;
        
      case 'bush':
        base.size = 0.4 + (seed % 8) / 20;
        base.height = 0.5 + (seed % 10) / 20;
        base.windSensitivity = 0.4;
        break;
        
      case 'fern':
        base.size = 0.2 + (seed % 6) / 30;
        base.height = 0.3 + (seed % 8) / 40;
        base.windSensitivity = 0.7;
        break;
        
      case 'mushroom':
        base.size = 0.15 + (seed % 4) / 40;
        base.height = 0.2 + (seed % 3) / 30;
        base.windSensitivity = 0.1; // Gomba alig mozog
        break;
        
      default:
        base.size = 0.2;
        base.height = 0.3;
        base.windSensitivity = 0.5;
    }
    
    // Évszak szerinti módosítások
    switch (season) {
      case 'spring':
        if (type === 'grass' || type === 'fern') {
          base.color = new Color(
            `hsl(${100 + (seed % 20)}, ${70 + (seed % 20)}%, ${40 + (seed % 15)}%)`
          );
        } else if (type === 'bush') {
          base.color = new Color(
            `hsl(${90 + (seed % 30)}, ${60 + (seed % 30)}%, ${30 + (seed % 20)}%)`
          );
          base.hasFlowers = seed % 3 === 0; // 33% esély a virágzásra
          base.flowerColor = new Color(
            `hsl(${280 + (seed % 80)}, ${70 + (seed % 20)}%, ${70 + (seed % 20)}%)`
          );
        } else if (type === 'mushroom') {
          base.color = new Color('#A0522D'); // barna
        }
        break;
        
      case 'summer':
        if (type === 'grass' || type === 'fern') {
          base.color = new Color(
            `hsl(${90 + (seed % 30)}, ${60 + (seed % 30)}%, ${30 + (seed % 20)}%)`
          );
        } else if (type === 'bush') {
          base.color = new Color(
            `hsl(${85 + (seed % 20)}, ${70 + (seed % 20)}%, ${25 + (seed % 15)}%)`
          );
        } else if (type === 'mushroom') {
          base.color = new Color('#8B4513'); // sötétebb barna
        }
        break;
        
      case 'autumn':
        if (type === 'grass' || type === 'fern') {
          base.color = new Color(
            `hsl(${30 + (seed % 30)}, ${60 + (seed % 30)}%, ${40 + (seed % 20)}%)`
          );
        } else if (type === 'bush') {
          base.color = new Color(
            `hsl(${20 + (seed % 40)}, ${80 + (seed % 15)}%, ${40 + (seed % 15)}%)`
          );
        } else if (type === 'mushroom') {
          base.color = new Color('#8B4513');
          base.hasFlowers = true; // ősszel több gomba van
        }
        break;
        
      case 'winter':
        if (type === 'mushroom') {
          base.color = new Color('#5C4033'); // sötét barna
          base.height *= 0.7; // kisebb
        } else {
          // Télen minden növény fakóbb, szárazabb
          base.color = new Color(
            `hsl(${35 + (seed % 20)}, ${20 + (seed % 20)}%, ${70 + (seed % 20)}%)`
          );
          base.height *= 0.6; // alacsonyabb
          base.hasFlowers = false; // nincs virág
        }
        break;
        
      default:
        base.color = new Color('#4CAF50');
    }
    
    return base;
  }, [type, season, performance, position]);
  
  // Távolság-alapú optimalizálás
  useFrame(({ camera }) => {
    if (!vegetationRef.current) return;
    
    // Távolság számítása a kamerától
    const distance = new Vector3(...position).distanceTo(camera.position);
    
    // Nagyon távoli növényzet elrejtése a teljesítmény érdekében
    if ((performance === 'low' && distance > 50) || 
        (performance === 'medium' && distance > 100)) {
      if (visible) setVisible(false);
      return;
    } else if (!visible) {
      setVisible(true);
    }
    
    // Szélmozgás szimulálása
    if (wavingRef.current && windStrength > 0 && properties.windSensitivity > 0) {
      const time = performance.now() / 1000;
      const windEffect = Math.sin(time + windOffsetRef.current) * windStrength * properties.windSensitivity;
      
      // Különböző mozgás típusonként
      if (type === 'grass' || type === 'flower' || type === 'fern') {
        wavingRef.current.rotation.x = windEffect * 0.2;
        wavingRef.current.rotation.z = windEffect * 0.25;
      } else if (type === 'bush') {
        wavingRef.current.rotation.x = windEffect * 0.05;
        wavingRef.current.rotation.z = windEffect * 0.08;
      }
      // Gomba alig mozog
    }
  });
  
  if (!visible) return null;
  
  // Típus szerinti megjelenítés
  return (
    <group ref={vegetationRef} position={position} scale={scale}>
      {type === 'grass' && (
        <group ref={wavingRef} position={[0, 0, 0]}>
          {/* Füves aljnövényzet */}
          {Array.from({ length: performance === 'low' ? 3 : 5 }).map((_, i) => {
            const angle = (i / (performance === 'low' ? 3 : 5)) * Math.PI * 2;
            const distance = properties.size * 0.5;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const height = properties.height * (0.8 + Math.random() * 0.4);
            
            return (
              <Box
                key={`grass-${i}`}
                args={[0.02, height, 0.01]}
                position={[x, height / 2, z]}
                rotation={[0.1 * i, angle, 0.05 * i]}
              >
                <meshStandardMaterial 
                  color={properties.color} 
                  roughness={0.8}
                  metalness={0.1}
                  transparent={true}
                  opacity={0.9}
                />
              </Box>
            );
          })}
        </group>
      )}
      
      {type === 'flower' && (
        <group>
          {/* Virág szára */}
          <Cylinder 
            args={[0.01, 0.01, properties.height, 4]} 
            position={[0, properties.height / 2, 0]}
            ref={wavingRef}
          >
            <meshStandardMaterial 
              color={new Color('#4CAF50')} 
              roughness={0.8}
              metalness={0.1}
            />
          </Cylinder>
          
          {/* Virág feje */}
          {properties.hasFlowers && (
            <Float
              speed={2}
              rotationIntensity={0.2}
              floatIntensity={0.5}
              position={[0, properties.height, 0]}
            >
              <Sphere
                args={[properties.size, 6, 6]}
              >
                <meshStandardMaterial
                  color={properties.flowerColor}
                  roughness={0.6}
                  metalness={0.1}
                  emissive={properties.flowerColor}
                  emissiveIntensity={0.3}
                />
              </Sphere>
            </Float>
          )}
        </group>
      )}
      
      {type === 'bush' && (
        <group>
          {/* Bokor test - több gömb kombinációja */}
          <group ref={wavingRef}>
            <Sphere
              args={[properties.size, properties.segments, properties.segments]}
              position={[0, properties.size, 0]}
            >
              <meshStandardMaterial
                color={properties.color}
                roughness={0.8}
                metalness={0.1}
                transparent={true}
                opacity={0.95}
              />
            </Sphere>
            
            {/* További kisebb csomók a bokron */}
            {performance !== 'low' && (
              <>
                {Array.from({ length: 3 }).map((_, i) => {
                  const angle = (i / 3) * Math.PI * 2;
                  const radius = properties.size * 0.7;
                  const x = Math.cos(angle) * radius * 0.5;
                  const z = Math.sin(angle) * radius * 0.5;
                  
                  return (
                    <Sphere
                      key={`bush-part-${i}`}
                      args={[properties.size * 0.7, properties.segments, properties.segments]}
                      position={[x, properties.size * 1.2, z]}
                    >
                      <meshStandardMaterial
                        color={properties.color}
                        roughness={0.8}
                        metalness={0.1}
                        transparent={true}
                        opacity={0.95}
                      />
                    </Sphere>
                  );
                })}
              </>
            )}
            
            {/* Virágok a bokron, ha szükséges */}
            {properties.hasFlowers && performance !== 'low' && (
              <>
                {Array.from({ length: 5 }).map((_, i) => {
                  const phi = Math.acos(-1 + (2 * i) / 5);
                  const theta = Math.sqrt(5 * Math.PI) * phi;
                  
                  const x = Math.cos(theta) * Math.sin(phi) * properties.size;
                  const y = Math.sin(theta) * Math.sin(phi) * properties.size + properties.size;
                  const z = Math.cos(phi) * properties.size;
                  
                  return (
                    <Sphere
                      key={`flower-${i}`}
                      args={[0.05, 4, 4]}
                      position={[x, y, z]}
                    >
                      <meshStandardMaterial
                        color={properties.flowerColor}
                        emissive={properties.flowerColor}
                        emissiveIntensity={0.3}
                      />
                    </Sphere>
                  );
                })}
              </>
            )}
          </group>
        </group>
      )}
      
      {type === 'fern' && (
        <group ref={wavingRef}>
          {/* Páfrány levelek */}
          {Array.from({ length: performance === 'low' ? 3 : 5 }).map((_, i) => {
            const angle = (i / (performance === 'low' ? 3 : 5)) * Math.PI * 2;
            const rotation = [
              Math.PI * 0.25, 
              angle,
              0
            ] as [number, number, number];
            
            return (
              <group 
                key={`fern-leaf-${i}`} 
                position={[0, 0.05, 0]} 
                rotation={rotation}
              >
                <Box
                  args={[properties.size * 1.5, 0.02, properties.size * 0.5]}
                  position={[properties.size * 0.5, 0, 0]}
                >
                  <meshStandardMaterial
                    color={properties.color}
                    roughness={0.8}
                    metalness={0.1}
                    transparent={true}
                    opacity={0.9}
                  />
                </Box>
              </group>
            );
          })}
        </group>
      )}
      
      {type === 'mushroom' && (
        <group>
          {/* Gomba szár */}
          <Cylinder
            args={[0.03, 0.05, properties.height, 6]}
            position={[0, properties.height / 2, 0]}
          >
            <meshStandardMaterial
              color="#DDDDDD"
              roughness={0.7}
              metalness={0.1}
            />
          </Cylinder>
          
          {/* Gomba kalap */}
          <Sphere
            args={[properties.size, 10, 10]}
            position={[0, properties.height * 0.8 + properties.size * 0.5, 0]}
            scale={[1, 0.4, 1]}
          >
            <meshStandardMaterial
              color={properties.color}
              roughness={0.6}
              metalness={0.2}
            />
          </Sphere>
        </group>
      )}
    </group>
  );
}

// Csoportosított növényzet egy területen
interface VegetationPatchProps {
  position: [number, number, number];
  radius?: number;
  density?: number;
  types?: VegetationType[];
  season?: Season;
  windStrength?: number;
  performance?: 'high' | 'medium' | 'low';
}

export function VegetationPatch({
  position,
  radius = 5,
  density = 1,
  types = ['grass', 'flower'],
  season = 'summer',
  windStrength = 0,
  performance = 'high'
}: VegetationPatchProps) {
  // Növényzet eloszlása a területen
  const vegetationItems = useMemo(() => {
    const items = [];
    
    // Darabszám a teljesítmény és sűrűség alapján
    const count = Math.floor(
      (performance === 'low' ? 10 : 
      performance === 'medium' ? 25 : 
      40) * density
    );
    
    for (let i = 0; i < count; i++) {
      // Determinisztikus véletlenszerűség a pozíció alapján
      const seed = Math.abs(Math.floor(position[0] * 100) + Math.floor(position[2] * 100) + i);
      
      // Poláris koordináták a jobb eloszlásért
      const angle = (seed % 360) * Math.PI / 180;
      const dist = Math.sqrt(seed % 100) / 10 * radius;
      
      // Pozíció kiszámítása
      const x = position[0] + Math.cos(angle) * dist;
      const z = position[2] + Math.sin(angle) * dist;
      
      // Növény típusának kiválasztása
      const typeIndex = seed % types.length;
      const type = types[typeIndex];
      
      // Méret
      const scale = 0.8 + (seed % 6) / 10;
      
      // Elem hozzáadása
      items.push({
        position: [x, position[1], z] as [number, number, number],
        type,
        scale
      });
    }
    
    return items;
  }, [position, radius, density, types, performance]);
  
  return (
    <group>
      {vegetationItems.map((item, index) => (
        <VegetationItem
          key={`veg-${index}`}
          position={item.position}
          type={item.type}
          scale={item.scale}
          season={season}
          windStrength={windStrength}
          performance={performance}
        />
      ))}
    </group>
  );
} 